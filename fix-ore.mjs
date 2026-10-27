import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rmgrhxvbxwdpctvegppb.supabase.co', 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3');
async function run() {
  await supabase.from('invite_codes').update({ created_by: 'ore' }).eq('code', '69598');
  console.log('Fixed Ore');
}
run();
