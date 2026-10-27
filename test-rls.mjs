import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rmgrhxvbxwdpctvegppb.supabase.co', 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3');

async function test() {
  const { data, error } = await supabase.from('invite_codes').update({ is_used: true, used_by: 'Test' }).eq('code', '69598');
  console.log(error);
}
test();
