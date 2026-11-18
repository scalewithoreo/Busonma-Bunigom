export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export interface EmailDispatchResult {
  success: boolean;
  provider?: 'zeptomail' | 'resend';
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
 * Dispatches an email via Zoho CPaaS / ZeptoMail (primary if configured)
 * or Resend (fallback).
 */
export async function dispatchEmail({ to, subject, html }: SendEmailOptions): Promise<EmailDispatchResult> {
  const ZEPTOMAIL_TOKEN = process.env.ZEPTOMAIL_TOKEN || process.env.ZOHO_CPAAS_TOKEN || process.env.VITE_ZEPTOMAIL_TOKEN;
  const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  const ZEPTOMAIL_URL = process.env.ZEPTOMAIL_URL || 'https://api.zeptomail.com/v1.1/email';

  // Sender fallback: twochasing10k.site if ZeptoMail token exists, else onboarding@resend.dev
  const defaultSender = ZEPTOMAIL_TOKEN
    ? "Miracle & Malvin's Wedding <weddings@twochasing10k.site>"
    : "Miracle & Malvin's Wedding <onboarding@resend.dev>";
  const SENDER_EMAIL = process.env.EMAIL_SENDER || process.env.VITE_EMAIL_SENDER || defaultSender;

  // --- Provider 1: Zoho CPaaS / ZeptoMail ---
  if (ZEPTOMAIL_TOKEN) {
    try {
      const sender = parseEmailRecipient(SENDER_EMAIL);
      const recipientList = (Array.isArray(to) ? to : [to]).map(item => {
        const parsed = parseEmailRecipient(item);
        return {
          email_address: {
            address: parsed.address,
            ...(parsed.name ? { name: parsed.name } : {})
          }
        };
      });

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
          to: recipientList,
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

  // --- Provider 2: Resend (Fallback) ---
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
  console.error('Email sending failed: neither ZEPTOMAIL_TOKEN nor RESEND_API_KEY is configured');
  return {
    success: false,
    status: 500,
    error: 'Email service is not configured. Please set ZEPTOMAIL_TOKEN or RESEND_API_KEY.'
  };
}
