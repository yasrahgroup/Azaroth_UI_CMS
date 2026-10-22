import { app } from '../server.ts';
import { initDatabase } from '../src/server/db.js';

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    try {
      await initDatabase();
      initialized = true;
    } catch (err: any) {
      console.error('[Serverless] Startup failed:', err);
      return res.status(500).json({ error: 'Server initialization failed' });
    }
  }
  app(req, res);
}