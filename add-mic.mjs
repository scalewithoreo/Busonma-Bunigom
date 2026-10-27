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

async function add() {
  const newItem = {
    name: 'Hollyland Lark M2 Microphone',
    quantity: 1,
    price: 160000,
    formatted_price: '₦160,000',
    category: 'Electronics',
    image: '/assets/Hollyland lark m2.jpg',
    description: 'High-quality wireless microphone perfect for recording content and creating memories.',
  };
  
  const { data, error } = await supabase.from('wishlist_items').insert([newItem]);
  if (error) console.error(error);
  else console.log('Added successfully');
}
add();
