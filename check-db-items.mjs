import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');
const env = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabaseServiceKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const key = supabaseServiceKeyMatch ? supabaseServiceKeyMatch[1].trim() : supabaseKey;
const supabase = createClient(supabaseUrl, key);

async function run() {
  const { data, error } = await supabase.from('wishlist_items').select('*').eq('name', 'Decorative Throw Pillows');
  console.log(JSON.stringify(data, null, 2));
}
run();
