import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rmgrhxvbxwdpctvegppb.supabase.co', 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3');

async function test() {
  await supabase.from('invite_codes').update({ used_by: 'Oreoluwa Okunade' }).eq('code', '69598');
}
test();
