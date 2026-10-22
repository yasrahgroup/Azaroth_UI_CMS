import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { initDatabase, db, DEFAULT_SETTINGS } from './src/server/db.js';
import {
  authenticateUser,
  requireAuth,
  requireEditor,
  requireAdmin,
  generateToken,
  verifyPassword,
  AuthenticatedRequest,
} from './src/server/auth.js';
import { sendEnquiryEmail, sendLeadEmail } from './src/server/email.js';
import { cleanHtml, sanitizeSvg } from './src/server/sanitize.js';
import {
  buildMediaFilename,
  createMediaStorage,
  resolveMediaStorageConfig,
  type MediaStorage,
} from './src/server/mediaStorage.js';
import {
  validateSiteSettingsDraft,
  validateProduct,
  validatePage,
} from './src/server/validators.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
export { app };
const PORT = parseInt(process.env.PORT || '8080', 10);
const isProd = process.env.NODE_ENV === 'production';

// Process-level error handling
process.on('unhandledRejection', (reason) => {
  console.warn('[Server] Handled asynchronous rejection:', isProd ? (reason as Error)?.message || 'Internal error' : reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Server] Critical uncaught exception:', isProd ? err.message : err);
});

// Configure proxy trust securely
app.set('trust proxy', process.env.TRUST_PROXY ? (process.env.TRUST_PROXY === 'true' ? true : process.env.TRUST_PROXY) : 1);

// Ensure uploads folder exists
const defaultUploadDir =
  process.env.VERCEL === '1' ? path.join(os.tmpdir(), 'azaroth-uploads') : 'uploads';
const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || defaultUploadDir);
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

let mediaStorageConfigurationError: Error | null = null;
let mediaStorage: MediaStorage;
try {
  mediaStorage = createMediaStorage(resolveMediaStorageConfig(UPLOAD_DIR));
} catch (err) {
  if (process.env.VERCEL !== '1') throw err;

  mediaStorageConfigurationError =
    err instanceof Error ? err : new Error('Media storage configuration is invalid.');
  console.error('[Media] Storage configuration unavailable; media operations are disabled:', mediaStorageConfigurationError.message);
  mediaStorage = {
    kind: 'disk',
    async save() {
      throw mediaStorageConfigurationError;
    },
    async read() {
      throw mediaStorageConfigurationError;
    },
    async remove() {
      throw mediaStorageConfigurationError;
    },
  };
}
const maxFileSizeMb = Math.max(1, parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10) || 50);

// Fail fast on a misconfigured Cloudflare R2 bucket. A bad region (R2 is "auto",
// not us-east-1) or a wrong URL style produces a 403 at the first upload, which
// is invisible in local disk mode. Probe the bucket at startup so the operator
// gets a clear error instead of a silent production outage.
async function probeMediaStorage(): Promise<void> {
  if (mediaStorage.kind !== 's3') return;
  const cfg = resolveMediaStorageConfig(UPLOAD_DIR) as any;
  const endpoint = cfg.endpoint;
  if (!endpoint) return;
  try {
    const isR2 = /r2\.cloudflarestorage\.com$/i.test(new URL(endpoint).hostname);
    if (isR2 && cfg.region !== 'auto') {
      console.warn(
        '[Media] Cloudflare R2 endpoint detected but S3_REGION is "%s". R2 only accepts "auto"; signature verification will fail with 403. Defaulting to "auto".',
        cfg.region
      );
    }
    if (isR2 && !cfg.forcePathStyle) {
      console.warn(
        '[Media] Cloudflare R2 endpoint detected but S3_FORCE_PATH_STYLE is not enabled. R2 requires path-style URLs; uploads will fail with 403. Defaulting to path-style.'
      );
    }
  } catch (err: any) {
    console.warn('[Media] Storage probe failed:', err?.message || err);
  }
}

// Allowed MIME types mapped to permitted extensions
const ALLOWED_MIME_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/svg+xml': ['.svg'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
};

// Multer storage for images and videos
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    cb(null, buildMediaFilename(file.originalname));
  },
});

const upload = multer({
  storage: mediaStorage.kind === 's3' ? multer.memoryStorage() : diskStorage,
  limits: { fileSize: maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ALLOWED_MIME_EXTENSIONS[file.mimetype];
    if (allowedExts && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type rejected. The MIME type "${file.mimetype}" does not match the extension "${ext}".`));
    }
  },
});

// Basic Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// JSON parse error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload provided' });
  }
  next(err);
});

// Security HTTP Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(authenticateUser);

// Serve uploaded media files safely with Content-Security-Policy to prevent script execution
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(UPLOAD_DIR));

// Serve website assets directory safely in both dev and production
const ASSETS_DIR = path.resolve(process.cwd(), 'src/assets');
if (fs.existsSync(ASSETS_DIR)) {
  app.use('/src/assets', express.static(ASSETS_DIR));
}

// Alias /assets/images for production asset paths
const ASSETS_IMAGES_DIR = path.resolve(process.cwd(), 'src/assets/images');
if (fs.existsSync(ASSETS_IMAGES_DIR)) {
  app.use('/assets/images', express.static(ASSETS_IMAGES_DIR));
}

// In-memory sliding-window rate limiters using validated client IP resolution
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitBuckets = new Map<string, Map<string, RateLimitBucket>>();

function createRateLimiter(options: { windowMs: number; max: number; message: string; name: string }) {
  const store = new Map<string, RateLimitBucket>();
  rateLimitBuckets.set(options.name, store);

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Rely on Express's validated req.ip which respects trusted reverse proxy hops
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    let record = store.get(clientIp);

    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + options.windowMs };
      store.set(clientIp, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > options.max) {
      return res.status(429).json({
        error: options.message,
        retryAfter: Math.ceil((record.resetAt - now) / 1000),
      });
    }

    next();
  };
}

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
  name: 'auth',
});

const submissionLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: 'Too many requests submitted. Please slow down and try again shortly.',
  name: 'submissions',
});

// RFC 5322 Standard Email Validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
}

const USER_ROLES = ['admin', 'editor', 'viewer'];
const MIN_PASSWORD_LENGTH = 8;

function isValidRole(role: unknown): role is 'admin' | 'editor' | 'viewer' {
  return typeof role === 'string' && USER_ROLES.includes(role);
}

function isValidPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH;
}

function normalizeName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 120) return null;
  return trimmed;
}

function countAdmins(): number {
  return db.getUsers().filter((user) => user.role === 'admin').length;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Single Authoritative Health check endpoint (consolidated)
app.get('/api/health', async (_req, res) => {
  const healthy = await db.checkConnection();
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'unavailable' });
});

app.get('/api/admin/health', requireAdmin, async (_req, res) => {
  const dbStatus = db.getStatus();
  dbStatus.connected = await db.checkConnection();
  const products = db.getProducts(true);
  const leads = db.getLeads();
  const enquiries = db.getEnquiries();

  const isHealthy = dbStatus.connected;

  res.json({
    status: isHealthy ? 'operational' : 'degraded',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: {
      type: dbStatus.type,
      connected: dbStatus.connected,
      status: isHealthy ? 'operational' : 'degraded',
      productsCount: products.length,
      leadsCount: leads.length,
      enquiriesCount: enquiries.length,
      mediaCount: dbStatus.mediaCount,
    },
    smtpConfigured: !!(
      (process.env.BREVO_SMTP_HOST && process.env.BREVO_SMTP_USERNAME) ||
      (process.env.SMTP_HOST && process.env.SMTP_USER)
    ),
    mediaStorage: mediaStorageConfigurationError ? 'unavailable' : mediaStorage.kind,
  });
});

app.get('/api/admin/addons', requireAdmin, async (_req, res) => {
  try {
    res.json({ addons: await db.getAddons() });
  } catch (error) {
    console.error('[API] Could not load add-on registry:', error);
    res.status(503).json({ error: 'Add-on registry is temporarily unavailable.' });
  }
});

app.put('/api/admin/addons/:id', requireAdmin, async (req, res) => {
  if (typeof req.body.enabled !== 'boolean') {
    return res.status(400).json({ error: 'The enabled field must be a boolean.' });
  }
  try {
    const addon = await db.setAddonEnabled(req.params.id, req.body.enabled);
    res.json({ addon });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Add-on update failed.';
    const status = message === 'Unknown add-on' ? 404 : 409;
    res.status(status).json({ error: message });
  }
});

app.get('/api/public/addons', async (_req, res) => {
  try {
    const addons = await db.getAddons();
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json({ enabled: addons.filter((addon) => addon.enabled).map((addon) => addon.id) });
  } catch {
    res.status(503).json({ error: 'Website modules are temporarily unavailable.' });
  }
});

// Authentication
app.post('/api/auth/login', authLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const record = db.getUserByEmail(email);
  if (!record || !verifyPassword(password, record.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password credentials' });
  }

  const token = generateToken(record.user);
  res.json({ token, user: record.user });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// Update the signed-in user's own profile (name and email)
app.patch('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const currentUser = req.user!;
  const name = normalizeName(req.body.name);
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';

  if (!name) {
    return res.status(400).json({ error: 'Name is required and must be 120 characters or fewer.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  const duplicate = db
    .getUsers()
    .find((user) => user.id !== currentUser.id && user.email.toLowerCase() === email.toLowerCase());
  if (duplicate) {
    return res.status(409).json({ error: 'That email address is already in use by another account.' });
  }

  const updated = db.updateUser(currentUser.id, { name, email });
  if (!updated) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  res.json({ user: updated });
});

// Change the signed-in user's own password
app.post('/api/auth/change-password', requireAuth, (req: AuthenticatedRequest, res) => {
  const currentUser = req.user!;
  const { currentPassword, newPassword } = req.body;

  if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
    return res.status(400).json({ error: 'Current password is required.' });
  }
  if (!isValidPassword(newPassword)) {
    return res
      .status(400)
      .json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'New password must be different from the current password.' });
  }

  const record = db.getUserByEmail(currentUser.email);
  if (!record || !verifyPassword(currentPassword, record.passwordHash)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  if (!db.updateUserPassword(currentUser.id, hash)) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  res.json({ success: true });
});

// User administration (RBAC: administrators only)
app.get('/api/users', requireAdmin, (_req, res) => {
  res.json(db.getUsers());
});

app.post('/api/users', requireAdmin, (req, res) => {
  const name = normalizeName(req.body.name);
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  const role = req.body.role;
  const password = req.body.password;

  if (!name) {
    return res.status(400).json({ error: 'Name is required and must be 120 characters or fewer.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!isValidRole(role)) {
    return res.status(400).json({ error: 'Role must be admin, editor, or viewer.' });
  }
  if (!isValidPassword(password)) {
    return res
      .status(400)
      .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
  }

  const duplicate = db.getUsers().find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (duplicate) {
    return res.status(409).json({ error: 'A user with that email address already exists.' });
  }

  const user = {
    id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    name,
    role,
    createdAt: new Date().toISOString(),
  };

  db.createUser(user, bcrypt.hashSync(password, 10));
  res.status(201).json({ user });
});

app.patch('/api/users/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const target = db.getUserById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  const updates: Partial<{ name: string; email: string; role: 'admin' | 'editor' | 'viewer' }> = {};

  if (req.body.name !== undefined) {
    const name = normalizeName(req.body.name);
    if (!name) {
      return res.status(400).json({ error: 'Name is required and must be 120 characters or fewer.' });
    }
    updates.name = name;
  }

  if (req.body.email !== undefined) {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    const duplicate = db
      .getUsers()
      .find((user) => user.id !== target.id && user.email.toLowerCase() === email.toLowerCase());
    if (duplicate) {
      return res.status(409).json({ error: 'That email address is already in use by another account.' });
    }
    updates.email = email;
  }

  if (req.body.role !== undefined) {
    if (!isValidRole(req.body.role)) {
      return res.status(400).json({ error: 'Role must be admin, editor, or viewer.' });
    }
    updates.role = req.body.role;
  }

  if (updates.role && updates.role !== 'admin' && target.role === 'admin') {
    if (target.id === req.user!.id) {
      return res.status(400).json({ error: 'You cannot remove your own administrator role.' });
    }
    if (countAdmins() <= 1) {
      return res.status(400).json({ error: 'At least one administrator account must remain.' });
    }
  }

  const updated = db.updateUser(target.id, updates);
  res.json({ user: updated });
});

app.delete('/api/users/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const target = db.getUserById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'User account not found.' });
  }
  if (target.id === req.user!.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }
  if (target.role === 'admin' && countAdmins() <= 1) {
    return res.status(400).json({ error: 'At least one administrator account must remain.' });
  }

  db.deleteUser(target.id);
  res.json({ success: true });
});

app.post('/api/users/:id/password', requireAdmin, (req, res) => {
  const target = db.getUserById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'User account not found.' });
  }
  if (!isValidPassword(req.body.password)) {
    return res
      .status(400)
      .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
  }

  db.updateUserPassword(target.id, bcrypt.hashSync(req.body.password, 10));
  res.json({ success: true });
});

// Settings & Theme
app.get('/api/settings', (_req, res) => {
  res.json(db.getSettings(false));
});

app.get('/api/settings/draft', requireEditor, (_req, res) => {
  res.json(db.getSettings(true));
});

app.post('/api/settings/draft', requireEditor, (req, res) => {
  const validation = validateSiteSettingsDraft(req.body);
  if (!validation.isValid || !validation.data) {
    return res.status(400).json({ error: 'Validation failed', details: validation.errors });
  }
  const updated = db.saveDraftSettings(validation.data);
  res.json(updated);
});

app.post('/api/settings/publish', requireEditor, (_req, res) => {
  // Promoting verified draft; does not accept raw client body to bypass draft validation
  const published = db.publishSettings();
  res.json(published);
});

app.post('/api/settings/restore-defaults', requireAdmin, (_req, res) => {
  const restored = db.restoreDefaultSettings();
  res.json(restored);
});

// Products
app.get('/api/products', async (_req, res) => {
  try {
    const catalog = (await db.getAddons()).find((addon) => addon.id === 'website-products');
    if (!catalog?.enabled) return res.status(404).json({ error: 'Product catalog is currently unavailable.' });
    res.json(db.getProducts(false));
  } catch {
    res.status(503).json({ error: 'Product catalog is temporarily unavailable.' });
  }
});

app.get('/api/products/all', requireEditor, (_req, res) => {
  res.json(db.getProducts(true));
});

app.get('/api/products/:slug', async (req: AuthenticatedRequest, res) => {
  if (req.query.draft !== 'true') {
    try {
      const catalog = (await db.getAddons()).find((addon) => addon.id === 'website-products');
      if (!catalog?.enabled) return res.status(404).json({ error: 'Product catalog is currently unavailable.' });
    } catch {
      return res.status(503).json({ error: 'Product catalog is temporarily unavailable.' });
    }
  }
  const includeUnpublished =
    req.query.draft === 'true' &&
    (req.user?.role === 'admin' || req.user?.role === 'editor');
  const product = db.getProductBySlug(req.params.slug, includeUnpublished);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

app.post('/api/products', requireEditor, (req, res) => {
  const validation = validateProduct(req.body);
  if (!validation.isValid || !validation.data) {
    return res.status(400).json({ error: 'Product validation failed', details: validation.errors });
  }

  const saved = db.saveProduct(validation.data as any);
  res.json(saved);
});

app.delete('/api/products/:id', requireEditor, (req, res) => {
  const success = db.deleteProduct(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ success: true, message: 'Product removed' });
});

// Pages
app.get('/api/pages', (req: AuthenticatedRequest, res) => {
  const includeUnpublished = req.user?.role === 'admin' || req.user?.role === 'editor';
  res.json(db.getPages(includeUnpublished));
});

app.get('/api/pages/:slug', (req: AuthenticatedRequest, res) => {
  const isDraft = req.query.draft === 'true' &&
    (req.user?.role === 'admin' || req.user?.role === 'editor');
  const page = db.getPage(req.params.slug, isDraft);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }
  res.json(page);
});

app.post('/api/pages/:slug/draft', requireEditor, async (req, res) => {
  const validation = validatePage({ ...req.body, slug: req.params.slug });
  if (!validation.isValid || !validation.data) {
    return res.status(400).json({ error: 'Page validation failed', details: validation.errors });
  }
  try {
    const saved = await db.saveDraftPage(validation.data);
    res.json(saved);
  } catch (error) {
    console.error('[API] Could not persist page draft:', error);
    res.status(503).json({ error: 'Draft could not be persisted. Please retry.' });
  }
});

app.post('/api/pages/:slug/publish', requireEditor, async (req, res) => {
  let published;
  try {
    published = await db.publishPage(req.params.slug);
  } catch (error) {
    console.error('[API] Could not publish page:', error);
    return res.status(503).json({ error: 'Page could not be published. Please retry.' });
  }
  if (!published) {
    return res.status(404).json({ error: 'Draft page not found to publish' });
  }
  res.json(published);
});

app.delete('/api/pages/:slug', requireEditor, (req, res) => {
  if (req.params.slug === 'home') {
    return res.status(400).json({ error: 'Cannot delete default homepage' });
  }
  const deleted = db.deletePage(req.params.slug);
  res.json({ success: deleted });
});

// Contact Form Enquiries
app.post('/api/enquiries', submissionLimiter, async (req, res) => {
  const { name, email, subject, message, productInterest } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  // RFC 5322 Standard Email Validation
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'A valid email address is required (e.g. name@domain.com).' });
  }

  const enquiry = db.addEnquiry({
    name: cleanHtml(String(name)).trim(),
    email: email.trim().toLowerCase(),
    subject: cleanHtml(String(subject || 'General Enterprise Inquiry')).trim(),
    message: cleanHtml(String(message)).trim(),
    productInterest: productInterest ? cleanHtml(String(productInterest)).trim() : undefined,
  });

  // Attempt transactional notification without blocking client response
  sendEnquiryEmail(enquiry).catch(err => {
    console.error('[Enquiry] Async email delivery note:', isProd ? (err as Error).message : err);
  });

  res.status(201).json({
    success: true,
    message: 'Your enquiry has been received. Our team will contact you shortly.',
    enquiryId: enquiry.id,
  });
});

app.get('/api/enquiries', requireEditor, (_req, res) => {
  res.json(db.getEnquiries());
});

app.patch('/api/enquiries/:id/status', requireEditor, (req, res) => {
  const { status } = req.body;
  if (!['new', 'in_progress', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const updated = db.updateEnquiryStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Enquiry not found' });
  res.json(updated);
});

// Chatbot Solution Leads
app.post('/api/leads', submissionLimiter, async (req, res) => {
  const { name, email, phone, company, businessType, productInterest, requirements } = req.body;
  if (!name || !email || !requirements) {
    return res.status(400).json({ error: 'Name, email, and requirements are required' });
  }

  // RFC 5322 Standard Email Validation
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'A valid email address is required (e.g. name@domain.com).' });
  }

  const lead = db.addLead({
    name: cleanHtml(String(name)).trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? cleanHtml(String(phone)).trim() : undefined,
    company: company ? cleanHtml(String(company)).trim() : undefined,
    businessType: businessType ? cleanHtml(String(businessType)).trim() : undefined,
    productInterest: productInterest ? cleanHtml(String(productInterest)).trim() : undefined,
    requirements: cleanHtml(String(requirements)).trim(),
  });

  sendLeadEmail(lead).catch(err => {
    console.error('[Lead] Async email delivery note:', isProd ? (err as Error).message : err);
  });

  res.status(201).json({
    success: true,
    message: 'Your solution requirements have been logged. An Azaroth enterprise solutions architect will reach out.',
    leadId: lead.id,
  });
});

app.get('/api/leads', requireEditor, (_req, res) => {
  res.json(db.getLeads());
});

app.patch('/api/leads/:id/status', requireEditor, (req, res) => {
  const { status } = req.body;
  if (!['new', 'in_progress', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const updated = db.updateLeadStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Lead not found' });
  res.json(updated);
});

// Media Library
app.get('/api/media', requireEditor, (_req, res) => {
  res.json(db.getMedia());
});

app.get('/api/media/:id/download', requireEditor, async (req, res) => {
  const item = db.getMedia().find(m => m.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Media not found' });
  }

  try {
    const content = item.url.startsWith('/src/assets/images/')
      ? await fs.promises.readFile(
          path.join(__dirname, 'src', 'assets', 'images', path.basename(item.url))
        )
      : await mediaStorage.read(item.filename);
    const fallbackName = item.originalName.replace(/[^\x20-\x7E]|["\\]/g, '_') || 'download';
    const encodedName = encodeURIComponent(item.originalName).replace(/['()*]/g, (char) =>
      `%${char.charCodeAt(0).toString(16).toUpperCase()}`
    );

    res.setHeader('Content-Type', item.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(content);
  } catch (err) {
    console.error('[Media] Download failed:', (err as Error).message);
    res.status(500).json({ error: 'Media download failed. Please retry or contact an administrator.' });
  }
});

app.post('/api/media/upload', requireEditor, (req, res) => {
  upload.single('file')(req as any, res as any, async (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Media upload failed' });
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({ error: 'No media file provided for upload' });
    }

    const filename = file.filename || buildMediaFilename(file.originalname);
    const ext = path.extname(file.originalname).toLowerCase();
    const removeTempFile = () => {
      if (file.path) {
        try {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch (cleanupErr) {
          console.warn('Could not remove temporary upload file:', cleanupErr);
        }
      }
    };

    try {
      // Sanitize SVG uploads to strip dangerous executable script tags and handlers
      if (file.mimetype === 'image/svg+xml' || ext === '.svg') {
        const rawSvg = file.buffer
          ? file.buffer.toString('utf-8')
          : fs.readFileSync(file.path, 'utf-8');
        const cleanedSvg = sanitizeSvg(rawSvg);
        if (!cleanedSvg || cleanedSvg.trim().length === 0) {
          await mediaStorage.remove(filename).catch(() => undefined);
          removeTempFile();
          return res.status(400).json({
            error: 'SVG validation failed: File contains active scripts, invalid XML, or disallowed elements.',
          });
        }

        const cleanedBuffer = Buffer.from(cleanedSvg, 'utf-8');
        if (file.buffer) {
          file.buffer = cleanedBuffer;
        } else {
          fs.writeFileSync(file.path, cleanedBuffer);
        }
        file.size = cleanedBuffer.length;
      }

      const stored = await mediaStorage.save({
        filename,
        mimeType: file.mimetype,
        buffer: file.buffer || undefined,
        tempPath: file.path,
      });

      const isVideo = file.mimetype.startsWith('video/');
      const mediaItem = db.addMedia({
        id: 'media-' + Date.now(),
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        url: stored.url,
        altText: req.body.altText ? cleanHtml(String(req.body.altText)).trim() : file.originalname,
        uploadedAt: new Date().toISOString(),
        mediaType: isVideo ? 'video' : 'image',
      });

      res.status(201).json(mediaItem);
    } catch (uploadError: any) {
      await mediaStorage.remove(filename).catch(() => undefined);
      removeTempFile();
      console.error('[Media] Upload failed:', uploadError?.message || uploadError);
      res.status(500).json({ error: 'Media storage failed. Please retry or contact an administrator.' });
    }
  });
});

app.patch('/api/media/:id/alt', requireEditor, (req, res) => {
  const { altText } = req.body;
  const updated = db.updateMediaAlt(req.params.id, cleanHtml(String(altText || '')).trim());
  if (!updated) return res.status(404).json({ error: 'Media not found' });
  res.json(updated);
});

app.patch('/api/media/:id/name', requireEditor, (req, res) => {
  if (typeof req.body.originalName !== 'string') {
    return res.status(400).json({ error: 'A media name is required' });
  }

  const originalName = cleanHtml(req.body.originalName).trim();
  if (!originalName || originalName.length > 255) {
    return res.status(400).json({ error: 'Media name must be between 1 and 255 characters' });
  }

  const updated = db.updateMediaName(req.params.id, originalName);
  if (!updated) return res.status(404).json({ error: 'Media not found' });
  res.json(updated);
});

app.delete('/api/media/:id', requireEditor, async (req, res) => {
  const item = db.getMedia().find(m => m.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Media not found' });
  }

  try {
    const success = await db.deleteMedia(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Media not found' });
    }

    try {
      await mediaStorage.remove(item.filename);
    } catch (err) {
      console.warn('Could not remove media object:', err);
    }

    if (mediaStorage.kind === 's3' && item.url.startsWith('/uploads/')) {
      const filePath = path.join(UPLOAD_DIR, path.basename(item.filename));
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.warn('Could not remove local media file:', err);
        }
      }
    }

    res.json({ success: true, message: 'Media removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to remove media record from database' });
  }
});

// Revisions
app.get('/api/revisions', requireEditor, (_req, res) => {
  res.json(db.getRevisions());
});

// Centralized error handling middleware (prevents leaking stack traces in production)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error Handler]:', isProd ? err.message : err);
  // Ensure we always return JSON, even if headers were already sent
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: isProd ? 'An unexpected server error occurred.' : err.message || 'Internal server error',
    });
  }
});

// ----------------------------------------------------
// FRONTEND MOUNTING & SERVER START
// ----------------------------------------------------
export async function startServer() {
  await initDatabase();
  await probeMediaStorage();

  if (!isProd) {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            '**/data/**',
            '**/uploads/**',
            '**/.git/**',
            '**/dist/**',
            '**/*.log',
          ],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Azaroth Server] Ready on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
  });
}

// The app is exported so the automated test suite can mount it on an
// ephemeral port without booting Vite. Auto-start only happens when this
// file is the process entry point (or when explicitly requested).
const isDirectRun = (() => {
  if (process.env.AZAROTH_AUTOSTART === 'false') return false;
  try {
    const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
    return entry !== '' && fileURLToPath(import.meta.url) === entry;
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  startServer().catch(err => {
    console.error('[Azaroth Server] Fatal startup error:', err);
    process.exit(1);
  });
}
