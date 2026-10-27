import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rmgrhxvbxwdpctvegppb.supabase.co', 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3');

async function test() {
  const { data: rsvps } = await supabase.from('rsvps').select('*');
  const { data: codes } = await supabase.from('invite_codes').select('*');
  
  for (const rsvp of rsvps) {
    const name = rsvp.first_name.trim() + ' ' + rsvp.last_name.trim();
    const matchedCode = codes.find(c => c.used_by && c.used_by.toLowerCase() === name.toLowerCase());
    if (!matchedCode) {
      console.log('NO CODE FOUND FOR RSVP:', name, rsvp.created_at);
    }
  }
}
test();
