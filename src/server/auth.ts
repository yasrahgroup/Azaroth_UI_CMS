import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import type { User, UserRole } from '../types/index.js';

const INSECURE_DEFAULT_SECRET = 'azaroth-secret-token-key-change-in-production-2026';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (!secret || secret === INSECURE_DEFAULT_SECRET) {
    if (isProd) {
      throw new Error(
        '[Security Fatal] Production startup aborted: JWT_SECRET environment variable is not configured or uses an insecure default secret. Please configure a strong, unique JWT_SECRET.'
      );
    }
    return INSECURE_DEFAULT_SECRET;
  }
  return secret;
}

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '24h') as any;

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

export function authenticateUser(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const user = db.getUserById(decoded.id);
    if (user) {
      req.user = user;
    }
  } catch {
    // Token is invalid or expired
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  next();
}

export function requireEditor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // 401 means "not authenticated"; 403 means "authenticated but not allowed".
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    return res.status(403).json({ error: 'Access denied: Editor or Admin privileges required.' });
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
  }
  next();
}
