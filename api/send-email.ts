import { dispatchEmail } from './_mailer.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html } = req.body || {};

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
  }

  try {
    const result = await dispatchEmail({ to, subject, html });

    if (!result.success) {
      return res.status(result.status || 500).json({
        error: result.error,
        provider: result.provider
      });
    }

    return res.status(200).json({
      success: true,
      provider: result.provider,
      data: result.data
    });
  } catch (error: any) {
    console.error('Email send failed:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
