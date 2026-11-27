import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dispatchEmail } from './_mailer.ts';

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

  const { firstName, lastName, email, attendance, selectedDate, message, code, creator, websiteUrl, coupleId } = req.body || {};

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
          selectedDate: selectedDate || '',
          message: message || '',
          code,
          creator
        })
      }).catch(err => console.error('Webhook failed:', err));
    }

    // 2. Email Sending (Hidden from browser via ZeptoMail / Zoho CPaaS or Resend)
    if (email) {
      const isAttending = attendance === 'Attending';
      const subject = isAttending
        ? "RSVP Confirmed: We can't wait to celebrate with you! 🥂" 
        : "RSVP Received: We will miss you! 🕊️";
        
      const registryUrl = websiteUrl ? `${websiteUrl}/#gifts` : '/#gifts';

      const isBusonma = coupleId === 'busonma-bunigom' || (websiteUrl && websiteUrl.toLowerCase().includes('busonma'));
      const coupleTitle = isBusonma ? 'Busonma & Bunigom' : 'Miracle & Malvin';
      const coupleDateStr = isBusonma ? 'Saturday, March 27, 2027 &bull; Lagos, Nigeria' : 'January 2027 &bull; Lagos, Nigeria';
      const coupleHashtag = isBusonma ? '#BB2ONE' : '#MiracleAndMalvin';
      const senderName = isBusonma ? "Busonma & Bunigom's Wedding" : "Miracle & Malvin's Wedding";

      // Celebration details block depending on couple and guest selection
      let eventDetailsHtml = '';
      if (isBusonma) {
        eventDetailsHtml = `
          <div style="background-color: #faf8f2; border: 1px solid #e7e0d3; border-radius: 16px; padding: 20px 25px; margin-bottom: 25px;">
            <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #8c734e; font-weight: 600;">Wedding Celebration Details</p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #1c1917;"><strong>Date & Time:</strong> Saturday, March 27, 2027 &bull; 1:00 PM WAT</p>
            <p style="margin: 0; font-size: 13px; color: #78716c; line-height: 1.4;">Admiralty Conference Centre, Naval Dockyard Limited, Ahmadu Bello Way, Victoria Island, Lagos</p>
          </div>
        `;
      } else if (selectedDate === 'both') {
        eventDetailsHtml = `
          <div style="background-color: #faf8f2; border: 1px solid #e7e0d3; border-radius: 16px; padding: 20px 25px; margin-bottom: 25px;">
            <p style="margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #8c734e; font-weight: 600;">Wedding Celebration Details</p>
            
            <div style="margin-bottom: 14px;">
              <p style="margin: 0 0 2px 0; font-size: 14px; font-weight: bold; color: #1c1917;">1. Church Solemnization & White Wedding</p>
              <p style="margin: 0; font-size: 13px; color: #44403c; line-height: 1.5;"><strong>Date & Time:</strong> Thursday, January 7, 2027 &bull; 11:00 AM WAT</p>
              <p style="margin: 2px 0 0 0; font-size: 13px; color: #78716c; line-height: 1.4;">Anglican Church of the Pentecost Okota, 7/9 Femi Orebote Street, Ago Palace Way, Okota, Lagos</p>
            </div>

            <div style="padding-top: 12px; border-top: 1px dashed #e7e0d3;">
              <p style="margin: 0 0 2px 0; font-size: 14px; font-weight: bold; color: #1c1917;">2. Grand Wedding Reception</p>
              <p style="margin: 0; font-size: 13px; color: #44403c; line-height: 1.5;"><strong>Date & Time:</strong> Saturday, January 9, 2027 &bull; 11:00 AM WAT</p>
              <p style="margin: 2px 0 0 0; font-size: 13px; color: #78716c; line-height: 1.4;">Apata School, Plot 36/42 Godwin Omonua Street, Ire-Akari Estate, Isolo, Lagos</p>
            </div>
          </div>
        `;
      } else if (selectedDate === 'ceremony') {
        eventDetailsHtml = `
          <div style="background-color: #faf8f2; border: 1px solid #e7e0d3; border-radius: 16px; padding: 20px 25px; margin-bottom: 25px;">
            <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #8c734e; font-weight: 600;">Church Solemnization Details</p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #1c1917;"><strong>Date & Time:</strong> Thursday, January 7, 2027 &bull; 11:00 AM WAT</p>
            <p style="margin: 0; font-size: 13px; color: #78716c; line-height: 1.4;">Anglican Church of the Pentecost Okota, 7/9 Femi Orebote Street, Ago Palace Way, Okota, Lagos</p>
          </div>
        `;
      } else {
        // Reception only (default)
        eventDetailsHtml = `
          <div style="background-color: #faf8f2; border: 1px solid #e7e0d3; border-radius: 16px; padding: 20px 25px; margin-bottom: 25px;">
            <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #8c734e; font-weight: 600;">Wedding Reception Details</p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #1c1917;"><strong>Date & Time:</strong> Saturday, January 9, 2027 &bull; 11:00 AM WAT</p>
            <p style="margin: 0; font-size: 13px; color: #78716c; line-height: 1.4;">Apata School, Plot 36/42 Godwin Omonua Street, Ire-Akari Estate, Isolo, Lagos</p>
          </div>
        `;
      }
      
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
                        <h1 style="margin: 0; color: #faf8f2; font-size: 32px; font-family: Georgia, serif; font-weight: normal; letter-spacing: 1px;">${coupleTitle}</h1>
                        <p style="margin: 12px 0 0 0; color: #c5a880; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">${coupleDateStr}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 35px;">
      `;

      if (isAttending) {
        emailHtml += `
                        <h2 style="margin: 0 0 15px 0; color: #1c1917; font-family: Georgia, serif; font-size: 24px; font-weight: normal;">Dearest ${firstName},</h2>
                        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #44403c;">We are absolutely thrilled that you will be joining us to celebrate our wedding! Your RSVP has been successfully received.</p>
                        ${eventDetailsHtml}
                        <p style="margin: 0 0 25px 0; font-size: 15px; line-height: 1.6; color: #44403c;">We will share more specific details regarding the schedule closer to the big day. Thank you for your continued love and support!</p>
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
                        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #1c1917; letter-spacing: 0.1em; text-transform: uppercase;">${coupleHashtag}</p>
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

      // Dispatch via Brevo, ZeptoMail, or Resend
      const defaultEmail = process.env.EMAIL_SENDER || 'weddings@twochasing10k.site';
      const senderAddress = defaultEmail.includes('<')
        ? defaultEmail.replace(/^.*<([^>]+)>.*$/, '$1')
        : defaultEmail;

      const result = await dispatchEmail({
        to: email,
        subject,
        html: emailHtml,
        from: `${senderName} <${senderAddress}>`
      });
      if (!result.success) {
        console.warn('RSVP confirmation email delivery warning:', result.error);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Submit RSVP error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
