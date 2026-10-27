import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method=== 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pinHash, action, payload } = req.body;

  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '127.0.0.1';
  const rateLimitKey = `ratelimit:admin:${ip}`;

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  // Check rate limit if KV/Upstash is configured
  if (kvUrl && kvToken) {
    try {
      const { createClient } = require('@vercel/kv');
      const kv = createClient({ url: kvUrl, token: kvToken });
      const attempts = (await kv.get(rateLimitKey)) || 0;
      if (attempts >= 10) {
        return res.status(429).json({ error: 'Too many attempts. Security lockout active for 5 minutes.' });
      }
    } catch (e) {
      console.warn('KV rate limiting failed, bypassing:', e);
    }
  }

  // Verify the PIN hash securely on the server
  const validHashes: Record<string, string> = {
    '8c07cfdfbe255d306247038188b8020416cdb8c97260969c13cfb06378d8cba2': 'ore', // 1999
    '39a7cc6fbd4379686efcca59317abe6ac88f6a35af4b043faa5e977ff3c9bf19': 'dara', // 2003
    'e13f99645f87a7c2aab8b5ae9074165318cde28e754a566087006120fca132e7': 'groomsfamily',
    '42ff322c7b6c9b702d027adeb217b1f226a41d71a86f9a9dcfdcf38a21cf515d': 'bridesfamily',
    'ec9de88936216680d2661d006be2e47b070650b6c8d5c177ccf7c4e13fe943d8': 'custom1964'
  };

  const role = validHashes[pinHash];
  if (!role) {
    // Record failed attempt
    if (kvUrl && kvToken) {
      try {
        const { createClient } = require('@vercel/kv');
        const kv = createClient({ url: kvUrl, token: kvToken });
        const attempts = await kv.incr(rateLimitKey);
        if (attempts === 1) await kv.expire(rateLimitKey, 300); // 5 mins
      } catch (e) {}
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Reset rate limit on success
  if (kvUrl && kvToken) {
    try {
      const { createClient } = require('@vercel/kv');
      const kv = createClient({ url: kvUrl, token: kvToken });
      await kv.del(rateLimitKey);
    } catch (e) {}
  }

  if (action === 'verifyPin') {
    return res.status(200).json({ success: true, data: { role } });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rmgrhxvbxwdpctvegppb.supabase.co';
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3';

  // Prefer valid service role key, but if missing or invalid JWT, fallback to working anon key
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || serviceRoleKey.startsWith('eyJ')) {
    serviceRoleKey = anonKey;
  }

  const executeQuery = async (client: any) => {
    switch (action) {
      case 'getStoredRsvps':
        return client.from('rsvps').select('*').order('created_at', { ascending: false });
      case 'deleteRsvp':
        return client.from('rsvps').delete().eq('id', payload.id);
      case 'getStoredGiftPledgesAdmin':
        return client.from('gift_pledges').select('*').order('created_at', { ascending: false });
      case 'deleteGiftPledge':
        return client.from('gift_pledges').delete().eq('id', payload.id);
      case 'getInviteCodes':
        return client.from('invite_codes').select('*').order('created_at', { ascending: false });
      case 'generateInviteCode':
        return client.from('invite_codes').upsert([payload.code], { onConflict: 'code', ignoreDuplicates: true }).select().single();
      case 'bulkGenerateInviteCodes':
        return client.from('invite_codes').upsert(payload.codes, { onConflict: 'code', ignoreDuplicates: true }).select();
      case 'deleteInviteCodes':
        return client.from('invite_codes').delete().in('id', payload.ids);
      case 'markInviteCodeAsShared':
        return client.from('invite_codes').update({ is_shared: true }).eq('id', payload.id);
      case 'unmarkInviteCodeAsShared':
        return client.from('invite_codes').update({ is_shared: false }).eq('id', payload.id);
      case 'saveWishlistItem':
        return client.from('wishlist_items').upsert([payload.item]).select().single();
      case 'deleteWishlistItem':
        return client.from('wishlist_items').delete().eq('id', payload.id);
      default:
        throw new Error('Unknown action');
    }
  };

  try {
    let supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    let { data, error } = await executeQuery(supabaseAdmin);

    // If initial query fails with invalid API key, retry with anon key fallback
    if (error && (error.message?.includes('Invalid API key') || error.code === 'PGRST301')) {
      console.warn('Admin DB: Retrying query with anon key fallback');
      const fallbackClient = createClient(supabaseUrl, anonKey);
      ({ data, error } = await executeQuery(fallbackClient));
    }

    if (error) {
      console.error('Supabase admin error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error('Admin DB error:', err);
    return res.status(500).json({ error: err.message });
  }
}
