export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  provider?: 'brevo' | 'zeptomail' | 'resend';
  status?: number;
  data?: any;
  error?: any;
}

/**
 * Parses email strings formatted as:
 * - "First Last <user@domain.com>"
 * - "'First Last' <user@domain.com>"
 * - "\"First Last\" <user@domain.com>"
 * - "user@domain.com"
 */
export function parseEmailRecipient(raw: string): { address: string; name?: string } {
  const trimmed = (raw || '').trim();
  const angleMatch = trimmed.match(/^(.*?)\s*<([^>]+)>$/);
  if (angleMatch) {
    let name = angleMatch[1]?.trim() || '';
    name = name.replace(/^["']|["']$/g, '').trim();
    const address = angleMatch[2].trim();
    return name ? { address, name } : { address };
  }
  return { address: trimmed };
}

/**
 * Dispatches an email via Brevo (Sendinblue), ZeptoMail (Zoho CPaaS),
 * or Resend.
 */
export async function dispatchEmail({ to, subject, html, from }: SendEmailOptions): Promise<EmailDispatchResult> {
  const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  const ZEPTOMAIL_TOKEN = process.env.ZEPTOMAIL_TOKEN || process.env.ZOHO_CPAAS_TOKEN || process.env.VITE_ZEPTOMAIL_TOKEN;
  const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  const ZEPTOMAIL_URL = process.env.ZEPTOMAIL_URL || 'https://api.zeptomail.com/v1.1/email';

  // Sender fallback: twochasing10k.site if token exists, else onboarding@resend.dev
  const defaultSender = BREVO_API_KEY || ZEPTOMAIL_TOKEN
    ? "Wedding Celebration <weddings@twochasing10k.site>"
    : "Wedding Celebration <onboarding@resend.dev>";
  const SENDER_EMAIL = from || process.env.EMAIL_SENDER || process.env.VITE_EMAIL_SENDER || defaultSender;

  const sender = parseEmailRecipient(SENDER_EMAIL);
  const recipientList = (Array.isArray(to) ? to : [to]).map(item => parseEmailRecipient(item));

  // --- Provider 1: Brevo (Sendinblue) ---
  if (BREVO_API_KEY) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            email: sender.address,
            ...(sender.name ? { name: sender.name } : {})
          },
          to: recipientList.map(r => ({
            email: r.address,
            ...(r.name ? { name: r.name } : {})
          })),
          subject,
          htmlContent: html
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('Brevo API error response:', response.status, data);
        return {
          success: false,
          status: response.status,
          provider: 'brevo',
          error: data
        };
      }

      return {
        success: true,
        provider: 'brevo',
        status: response.status,
        data
      };
    } catch (err: any) {
      console.error('Brevo request exception:', err);
      return {
        success: false,
        status: 500,
        provider: 'brevo',
        error: err?.message || String(err)
      };
    }
  }

  // --- Provider 2: Zoho CPaaS / ZeptoMail ---
  if (ZEPTOMAIL_TOKEN) {
    try {
      const authHeader = ZEPTOMAIL_TOKEN.startsWith('Zoho-enczapikey ')
        ? ZEPTOMAIL_TOKEN
        : `Zoho-enczapikey ${ZEPTOMAIL_TOKEN}`;

      const response = await fetch(ZEPTOMAIL_URL, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          from: {
            address: sender.address,
            ...(sender.name ? { name: sender.name } : {})
          },
          to: recipientList.map(r => ({
            email_address: {
              address: r.address,
              ...(r.name ? { name: r.name } : {})
            }
          })),
          subject,
          htmlbody: html
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('ZeptoMail API error response:', response.status, data);
        return {
          success: false,
          status: response.status,
          provider: 'zeptomail',
          error: data
        };
      }

      return {
        success: true,
        provider: 'zeptomail',
        status: response.status,
        data
      };
    } catch (err: any) {
      console.error('ZeptoMail request exception:', err);
      return {
        success: false,
        status: 500,
        provider: 'zeptomail',
        error: err?.message || String(err)
      };
    }
  }

  // --- Provider 3: Resend (Fallback) ---
  if (RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: SENDER_EMAIL,
          to: Array.isArray(to) ? to : [to],
          subject,
          html
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('Resend API error response:', response.status, data);
        return {
          success: false,
          status: response.status,
          provider: 'resend',
          error: data
        };
      }

      return {
        success: true,
        provider: 'resend',
        status: response.status,
        data
      };
    } catch (err: any) {
      console.error('Resend request exception:', err);
      return {
        success: false,
        status: 500,
        provider: 'resend',
        error: err?.message || String(err)
      };
    }
  }

  // Neither configured
  console.error('Email sending failed: neither BREVO_API_KEY, ZEPTOMAIL_TOKEN nor RESEND_API_KEY is configured');
  return {
    success: false,
    status: 500,
    error: 'Email service is not configured. Please set BREVO_API_KEY, ZEPTOMAIL_TOKEN, or RESEND_API_KEY.'
  };
}
