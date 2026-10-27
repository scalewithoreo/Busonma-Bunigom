import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rmgrhxvbxwdpctvegppb.supabase.co', 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3');
async function run() {
  const { data: rsvps } = await supabase.from('rsvps').select('*');
  const { data: codes } = await supabase.from('invite_codes').select('*');
  
  for (const r of rsvps) {
    const name = r.first_name + ' ' + r.last_name;
    const code = codes.find(c => c.used_by && c.used_by.toLowerCase() === name.toLowerCase());
    console.log({
      name,
      relation: r.relation,
      code_creator: code ? code.created_by : 'NONE'
    });
  }
}
run();
