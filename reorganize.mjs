import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rmgrhxvbxwdpctvegppb.supabase.co', 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3');

async function run() {
  const daraGuests = [
    'Yewande Ijose',
    'Ifeadikachi Ikemefuna',
    'Dr Kifayat Durosinmi',
    'Oghenekome Othe',
    'Olufolajimi Ijimakinde',
    'Kafayat Adeyemi',
    'Oyindamola Jayeola',
    'KELECHI OPARA',
    'Damilola Ajewole'
  ];

  // 1. Un-assign the currently assigned codes for these guests
  for (const guest of daraGuests) {
    await supabase.from('invite_codes').update({ is_used: false, used_by: null }).eq('used_by', guest);
  }

  // 2. Fetch unused shared codes from Dara
  const { data: daraCodes } = await supabase.from('invite_codes')
    .select('*')
    .eq('created_by', 'dara')
    .eq('is_used', false)
    .eq('is_shared', true)
    .limit(daraGuests.length);

  // 3. Reassign
  for (let i = 0; i < daraGuests.length; i++) {
    const guest = daraGuests[i];
    const code = daraCodes[i];
    if (code) {
      console.log('Reassigning', guest, 'to Dara code', code.code);
      await supabase.from('invite_codes').update({ is_used: true, used_by: guest }).eq('code', code.code);
    }
  }
}
run();
