import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rmgrhxvbxwdpctvegppb.supabase.co', 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3');

async function run() {
  const { data: rsvps } = await supabase.from('rsvps').select('*').order('created_at', { ascending: true });
  const { data: codes } = await supabase.from('invite_codes').select('*');
  
  for (const r of rsvps) {
    const name = r.first_name.trim() + ' ' + r.last_name.trim();
    const code = codes.find(c => c.used_by && c.used_by.toLowerCase() === name.toLowerCase());
    
    console.log(`[${r.created_at}] ${name} -> ${code ? code.created_by : 'NO CODE MATCHED'} (Code: ${code ? code.code : 'N/A'})`);
  }
}
run();
