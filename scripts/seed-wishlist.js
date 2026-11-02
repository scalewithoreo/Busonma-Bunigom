import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const urlMatch = envContent.match(/VITE_TURSO_DATABASE_URL=["']?(.*?)["']?$/m);
const tokenMatch = envContent.match(/VITE_TURSO_AUTH_TOKEN=["']?(.*?)["']?$/m);

const url = urlMatch[1].trim();
const token = tokenMatch[1].trim();

const client = createClient({ url, authToken: token });

async function seed() {
  const countRes = await client.execute('SELECT COUNT(*) as count FROM wishlist;');
  const count = Number(countRes.rows[0].count);

  if (count > 0) {
    console.log(`Wishlist already has ${count} items in Turso. Skipping seed.`);
    return;
  }

  // Import items from wishlistData
  const wishlistDataPath = path.resolve(__dirname, '../src/data/wishlistData.ts');
  const content = fs.readFileSync(wishlistDataPath, 'utf8');

  // Parse items via regex or simple eval
  const itemsMatch = content.match(/export const INITIAL_WISHLIST_ITEMS: WishlistItem\[\] = (\[[\s\S]*?\]);/);
  if (!itemsMatch) {
    console.log('Could not find INITIAL_WISHLIST_ITEMS');
    return;
  }

  const items = eval(itemsMatch[1]);
  console.log(`Seeding ${items.length} initial wishlist items into Turso...`);

  const statements = items.map(item => ({
    sql: `INSERT INTO wishlist (id, name, quantity, price, formatted_price, category, image, description, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      item.id,
      item.name,
      item.quantity || 1,
      item.price || 0,
      item.formattedPrice || '',
      item.category || 'Living & Comfort',
      item.image || '',
      item.description || '',
      new Date().toISOString()
    ]
  }));

  await client.batch(statements);
  console.log(`✅ Successfully seeded ${items.length} items into Turso wishlist!`);
}

seed().catch(console.error);
