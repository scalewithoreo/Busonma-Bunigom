import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rmgrhxvbxwdpctvegppb.supabase.co', 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3');

const webhookUrl = 'https://script.google.com/macros/s/AKfycbyDfnbzGs_j6s391MeEZMHHrfaMe2EX8DByxeg-VyPN4QhfB2W-HXp7lpS3gPoEdAeL/exec';

const roleLabels = {
  'master': 'Master',
  'ore': 'Ore',
  'dara': 'Dara',
  'custom1964': "Ore's Dad",
  'groomsfamily': "Ore's Mum",
  'bridesfamily': "Dara's Mum"
};

async function run() {
  const { data: rsvps } = await supabase.from('rsvps').select('*').order('created_at', { ascending: true });
  const { data: codes } = await supabase.from('invite_codes').select('*');
  
  for (const r of rsvps) {
    const name = r.first_name.trim() + ' ' + r.last_name.trim();
    const code = codes.find(c => c.used_by && c.used_by.toLowerCase() === name.toLowerCase());
    const creatorLabel = code ? (roleLabels[code.created_by] || 'Unknown') : 'Unknown';
    const passcode = code ? code.code : 'UNKNOWN';
    
    console.log(`Sending ${name} -> ${creatorLabel}`);
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email || '',
        attendance: r.attendance === 'yes' ? 'Attending' : 'Declined',
        message: r.message || '',
        code: passcode,
        creator: creatorLabel
      })
    });
    
    // Slight delay to not overwhelm Google Apps Script
    await new Promise(res => setTimeout(res, 500));
  }
}
run();
