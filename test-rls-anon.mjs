import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rmgrhxvbxwdpctvegppb.supabase.co', 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3');

async function test() {
  const { data, error } = await supabase.from('invite_codes').update({ is_used: true, used_by: 'TEST ANON' }).eq('code', '77729').select();
  console.log(error, data);
  
  if (data && data.length) {
    await supabase.from('invite_codes').update({ is_used: false, used_by: null }).eq('code', '77729');
  }
}
test();
