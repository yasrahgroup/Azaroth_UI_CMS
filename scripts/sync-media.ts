import dotenv from 'dotenv';
dotenv.config();
import { initDatabase, db, syncMediaToNeon } from '../src/server/db.js';

async function main() {
  await initDatabase();
  const media = db.getMedia();
  console.log(`Synchronizing ${media.length} media items into database...`);
  for (const item of media) {
    await syncMediaToNeon(item);
  }
  console.log('Successfully synced all items:');
  for (const item of media) {
    console.log(` - [${item.id}] ${item.filename} -> ${item.altText} (${item.url})`);
  }
  process.exit(0);
}

main().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
