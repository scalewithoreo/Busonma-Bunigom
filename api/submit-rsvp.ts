import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, attendance, message, code, creator, websiteUrl } = req.body;

  try {
    // 1. Google Sheets Webhook (Hidden from browser)
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || process.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: email || '',
          attendance,
          message: message || '',
          code,
          creator
        })
      }).catch(err => console.error('Webhook failed:', err));
    }

    // 2. Email Sending (Hidden from browser)
    const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    const SENDER_EMAIL = process.env.EMAIL_SENDER || process.env.VITE_EMAIL_SENDER || "Ore & Dara's Wedding <onboarding@resend.dev>";
    
    if (email && RESEND_API_KEY) {
      const subject = attendance === 'Attending' 
        ? "RSVP Confirmed: We can't wait to celebrate with you! 🥂" 
        : "RSVP Received: We will miss you! 🕊️";
        
      const registryUrl = websiteUrl ? `${websiteUrl}/#gifts` : 'https://ore-and-dara.vercel.app/#gifts';
      
      let emailHtml = `
        <!DOCTYPE html>
        <html>
          <body style="margin: 0; padding: 0; background-color: #faf8f2; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1c1917;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #faf8f2; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e7e0d3; box-shadow: 0 10px 30px rgba(28, 25, 23, 0.05);">
                    <tr>
                      <td align="center" style="background-color: #1c1917; padding: 40px 30px; text-align: center;">
                        <p style="margin: 0 0 10px 0; color: #c5a880; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; font-weight: 600;">The Wedding Of</p>
                        <h1 style="margin: 0; color: #faf8f2; font-size: 32px; font-family: Georgia, serif; font-weight: normal; letter-spacing: 1px;">Oluwadara & Oreoluwa</h1>
                        <p style="margin: 12px 0 0 0; color: #c5a880; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">Saturday, December 12, 2026 &bull; Lagos, Nigeria</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 35px;">
      `;

      if (attendance === 'Attending') {
        emailHtml += `
                        <h2 style="margin: 0 0 15px 0; color: #1c1917; font-family: Georgia, serif; font-size: 24px; font-weight: normal;">Dearest ${firstName},</h2>
                        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #44403c;">We are absolutely thrilled that you will be joining us to celebrate our wedding! Your RSVP has been successfully received.</p>
                        <div style="background-color: #faf8f2; border: 1px solid #e7e0d3; border-radius: 16px; padding: 20px 25px; margin-bottom: 25px;">
                          <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #8c734e; font-weight: 600;">Wedding Details</p>
                          <p style="margin: 0 0 8px 0; font-size: 15px; color: #1c1917;"><strong>Date:</strong> Saturday, December 12, 2026</p>
                          <p style="margin: 0; font-size: 15px; color: #1c1917;"><strong>Location:</strong> Lagos, Nigeria</p>
                          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e7e0d3;">
                            <p style="margin: 0; font-size: 13px; color: #78716c; font-style: italic;">* Please note that this is strictly an <strong>adult-only</strong> event (No children).</p>
                          </div>
                        </div>
                        <p style="margin: 0 0 25px 0; font-size: 15px; line-height: 1.6; color: #44403c;">We will share more specific details regarding the venue and schedule closer to the big day. Thank you for your continued love and support!</p>
                        <div style="margin-top: 25px; padding-top: 25px; border-top: 1px solid #e7e0d3;">
                          <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #44403c;">Your presence at our wedding is the greatest gift we could ask for! Should you wish to bless us with a gift, you are welcome to make a cash contribution or visit our online registry.</p>
                          <p style="margin: 0; text-align: center;"><a href="${registryUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1c1917; color: #c5a880; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Gift Registry</a></p>
                        </div>
        `;
      } else {
        emailHtml += `
                        <h2 style="margin: 0 0 15px 0; color: #1c1917; font-family: Georgia, serif; font-size: 24px; font-weight: normal;">Dearest ${firstName},</h2>
                        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #44403c;">We have received your RSVP. While we are sad that you won't be able to join us in person, we completely understand and truly appreciate you letting us know.</p>
                        <p style="margin: 0 0 25px 0; font-size: 15px; line-height: 1.6; color: #44403c;">Thank you for all your love, prayers, and support as we embark on this new chapter together!</p>
                        <div style="margin-top: 25px; padding-top: 25px; border-top: 1px solid #e7e0d3;">
                          <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; color: #44403c;">If you would still like to bless us with a gift from afar, you are welcome to make a cash contribution or visit our online registry.</p>
                          <p style="margin: 0; text-align: center;"><a href="${registryUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1c1917; color: #c5a880; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Gift Registry</a></p>
                        </div>
        `;
      }

      emailHtml += `
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="background-color: #faf8f2; padding: 30px; text-align: center; border-top: 1px solid #e7e0d3;">
                        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #1c1917; letter-spacing: 0.1em; text-transform: uppercase;">#BecomingTheOkunades</p>
                        <p style="margin: 0; font-size: 12px; color: #78716c; line-height: 1.5;">Thank you for your love, prayers, and support as we begin this new chapter together.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: SENDER_EMAIL,
          to: [email],
          subject,
          html: emailHtml
        })
      }).catch(err => console.error('Resend failed:', err));
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Submit RSVP error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
