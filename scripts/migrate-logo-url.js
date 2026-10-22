/**
 * One-shot migration: convert legacy object-valued footer.logoUrl entries
 * in data/db.json to their .url string form, so persisted data is always
 * a plain URL string (matching the current upload/picker handlers).
 *
 * Run: node scripts/migrate-logo-url.js
 */
import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), 'data', 'db.json');

function normalizeLogoUrl(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.url === 'string') return value.url;
  return '';
}

function migrateFooterLogo(obj) {
  if (!obj || typeof obj !== 'object') return false;
  const footer = obj.footer;
  if (!footer || typeof footer !== 'object') return false;
  const logoUrl = footer.logoUrl;
  if (logoUrl && typeof logoUrl === 'object') {
    footer.logoUrl = normalizeLogoUrl(logoUrl);
    return true;
  }
  return false;
}

function main() {
  if (!fs.existsSync(DB_FILE)) {
    console.log('[migrate] data/db.json not found; nothing to migrate.');
    return;
  }

  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  const data = JSON.parse(raw);
  let changed = 0;

  // settings, draftSettings
  for (const key of ['settings', 'draftSettings']) {
    if (migrateFooterLogo(data[key])) changed++;
  }

  // revisions[].data
  if (Array.isArray(data.revisions)) {
    for (const rev of data.revisions) {
      if (rev && rev.data && migrateFooterLogo(rev.data)) changed++;
    }
  }

  if (changed > 0) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[migrate] Normalized ${changed} object-valued footer.logoUrl entries in data/db.json`);
  } else {
    console.log('[migrate] No object-valued footer.logoUrl entries found; file unchanged.');
  }
}

main();