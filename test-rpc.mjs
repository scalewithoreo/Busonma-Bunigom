import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rmgrhxvbxwdpctvegppb.supabase.co', 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3');

async function test() {
  const { data, error } = await supabase.rpc('mark_code_as_used', { p_code: '69598', p_used_by: 'Oreoluwa Okunade' });
  console.log(error);
}
test();
