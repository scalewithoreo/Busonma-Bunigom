import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rmgrhxvbxwdpctvegppb.supabase.co', 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3');

async function fix() {
  const { data: rsvps } = await supabase.from('rsvps').select('*');
  const { data: usedCodes } = await supabase.from('invite_codes').select('*').eq('is_used', true);
  
  const missingRsvps = [];
  for (const rsvp of rsvps) {
    const name = rsvp.first_name.trim() + ' ' + rsvp.last_name.trim();
    if (!usedCodes.find(c => c.used_by && c.used_by.toLowerCase() === name.toLowerCase())) {
      missingRsvps.push(name);
    }
  }
  
  console.log('Missing RSVPs:', missingRsvps.length);
  
  const { data: availableCodes } = await supabase.from('invite_codes').select('*').eq('is_used', false).eq('is_shared', true);
  console.log('Available shared codes:', availableCodes.length);
  
  for (let i = 0; i < missingRsvps.length; i++) {
    const name = missingRsvps[i];
    const code = availableCodes[i];
    if (code) {
      console.log('Assigning', name, 'to code', code.code);
      await supabase.from('invite_codes').update({ is_used: true, used_by: name }).eq('code', code.code);
    }
  }
  
  console.log('Done!');
}
fix();
