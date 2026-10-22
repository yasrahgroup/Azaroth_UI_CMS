import fs from 'fs';
import path from 'path';

const root = process.cwd();
const dataDir = path.join(root, 'data-e2e');
const uploadDir = path.join(root, 'uploads-e2e');

fs.rmSync(dataDir, { recursive: true, force: true });
fs.rmSync(uploadDir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.E2E_PORT || '4173';
process.env.DATA_DIR = dataDir;
process.env.UPLOAD_DIR = uploadDir;
process.env.DATABASE_URL = '';
process.env.TEST_DATABASE_URL = '';
process.env.JWT_SECRET = 'e2e-only-secret-not-for-production';
process.env.INITIAL_ADMIN_EMAIL = 'e2e-admin@example.com';
process.env.INITIAL_ADMIN_PASSWORD = 'E2eOnly!Passw0rd';
process.env.ADMIN_EMAIL = '';
process.env.ADMIN_PASSWORD = '';
// E2E runs on an isolated local disk. Force test mode so the suite can never
// reach a production Cloudflare R2 bucket even if S3_* env vars leak in.
process.env.MEDIA_STORAGE_MODE = 'test';

const { startServer } = await import('../server.js');
await startServer();
