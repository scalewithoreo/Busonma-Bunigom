import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rmgrhxvbxwdpctvegppb.supabase.co', 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3');

async function test() {
  const { data, error } = await supabase.from('invite_codes').select('*').eq('is_used', true);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Used Codes Count:', data.length);
    console.log(data);
  }
}
test();
