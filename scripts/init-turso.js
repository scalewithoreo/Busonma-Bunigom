import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env directly
const envPath = path.resolve(__dirname, '../.env');
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

const urlMatch = envContent.match(/VITE_TURSO_DATABASE_URL=["']?(.*?)["']?$/m);
const tokenMatch = envContent.match(/VITE_TURSO_AUTH_TOKEN=["']?(.*?)["']?$/m);

const url = urlMatch ? urlMatch[1].trim() : '';
const token = tokenMatch ? tokenMatch[1].trim() : '';

console.log('--------------------------------------------------');
console.log('  TURSO DATABASE INITIALIZER & VERIFIER');
console.log('--------------------------------------------------');

if (!url || !token) {
  console.error('\n❌ ERROR: Turso credentials missing in .env!');
  console.error('Please add the following to your .env file:');
  console.error('VITE_TURSO_DATABASE_URL="libsql://your-database-name.turso.io"');
  console.error('VITE_TURSO_AUTH_TOKEN="your-auth-token"\n');
  process.exit(1);
}

console.log(`📡 Connecting to: ${url}`);

const client = createClient({
  url,
  authToken: token,
});

async function run() {
  try {
    // 1. Test basic connectivity
    const ping = await client.execute('SELECT 1 as connected;');
    if (ping.rows.length > 0) {
      console.log('✅ Connected successfully to Turso Cloud!');
    }

    // 2. Read schema file
    const schemaPath = path.resolve(__dirname, '../turso_schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split into individual SQL statements by semicolon
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`\n📦 Applying ${statements.length} table definitions & indexes...`);

    for (const stmt of statements) {
      await client.execute(stmt);
    }

    console.log('✅ Tables created: rsvps, wishlist, reservations, gift_pledges, invite_codes');

    // 3. Verify tables exist
    const tablesRes = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );
    const existingTables = tablesRes.rows.map(r => r.name);
    console.log('\nVerified Active Tables in Turso:');
    existingTables.forEach(t => console.log(`  • ${t}`));

    console.log('\n🎉 SUCCESS! Your Turso database is fully set up and ready for Miracle & Malvin.');
    console.log('--------------------------------------------------\n');
  } catch (error) {
    console.error('\n❌ Error configuring Turso database:', error);
    process.exit(1);
  }
}

run();
