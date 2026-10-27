import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rmgrhxvbxwdpctvegppb.supabase.co', 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3');

async function run() {
  const { data: rsvps } = await supabase.from('rsvps').select('*');
  const { data: codes } = await supabase.from('invite_codes').select('*');

  // Let's print ALL used codes created on or after 2026-09-14
  console.log("--- All Used Codes ---");
  for (const c of codes.filter(c => c.is_used)) {
      console.log(`Code: ${c.code}, created_by: ${c.created_by}, used_by: ${c.used_by}`);
  }
}

run();
