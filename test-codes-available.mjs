import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rmgrhxvbxwdpctvegppb.supabase.co', 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3');
async function test() {
  const { data } = await supabase.from('invite_codes').select('*').eq('is_used', false);
  console.log('Available codes:', data.length);
  const byCreator = data.reduce((acc, c) => {
    acc[c.created_by] = (acc[c.created_by] || 0) + 1;
    return acc;
  }, {});
  console.log(byCreator);
}
test();
