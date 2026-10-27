import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env');
const env = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
// Use service role key if available, else anon key will fail due to RLS probably, but wait, the RLS allows delete for anyone?
// In storage.ts, deleteReservation just deletes by id.
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabaseServiceKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const key = supabaseServiceKeyMatch ? supabaseServiceKeyMatch[1].trim() : supabaseKey;

const supabase = createClient(supabaseUrl, key);

async function del() {
  const { data, error } = await supabase.from('gift_reminders').delete().eq('id', '547d590b-e45a-49c8-8d0a-e3cb6d075419');
  if (error) console.error(error);
  else console.log('Deleted successfully');
}
del();
