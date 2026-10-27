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

  if (req.method === 'OPTIONS') {
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
    // Miracle & Malvin Wedding PINs (Salt: MiracleMalvin_Wedding_2027_Salt_)
    '3ad116dc1633b3b70f8d635590a35ba3d4969d2777648baa33e62deca53a4dc7': 'miracle', // 1111
    '09e1868e2d439ffd907bc01564631bd82591dc58921f7effe64896d899df69e8': 'malvin',  // 2222
    '76c814e041129fed250849beb1ab408af9c5351fce3ccb1e4126bedc4e55a6c3': 'groomsfamily', // 3333
    '7de3b3dac3e46e5639e59e509f4a4da732c6ccc3d31f4fd43b0c0834592e6e2f': 'bridesfamily', // 4444
    '85e6ccb7dbc2a38f751f5bb75cedc2c4c773cbc1b918918c5ebf34e553abd50d': 'custom1964', // 1964
    '0e5c405683a06164be029d484af0fe82602b20c72e390cd02bec4180868cffdd': 'miracle', // 0000 emergency override
    // Also support previously generated hashes for smooth transition
    '2fd02616507a0514c705fb51eb2c8edab3347ae9fe0296e69fd715ad350956d3': 'miracle',
    '1decb05e4cabf700283b0854c2721d27610b24d0ac751b6a8853797c362c2ac7': 'malvin',
    '3c8d76ec3ed4a4ee1027fe0455fc72c2dd20e3fefd33cf17815333f76615c9fb': 'miracle'
  };

  const role = validHashes[pinHash];
  if (!role) {
    if (kvUrl && kvToken) {
      try {
        const { createClient } = require('@vercel/kv');
        const kv = createClient({ url: kvUrl, token: kvToken });
        const attempts = await kv.incr(rateLimitKey);
        if (attempts === 1) await kv.expire(rateLimitKey, 300);
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

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  // If no dedicated Miracle & Malvin Supabase project is configured yet,
  // return empty safe data without ever touching any external database.
  if (!supabaseUrl || !anonKey) {
    switch (action) {
      case 'getStoredRsvps':
      case 'getStoredGiftPledgesAdmin':
      case 'getInviteCodes':
        return res.status(200).json({ success: true, data: [] });
      case 'generateInviteCode':
        return res.status(200).json({ success: true, data: payload.code });
      case 'bulkGenerateInviteCodes':
        return res.status(200).json({ success: true, data: payload.codes });
      default:
        return res.status(200).json({ success: true, data: [] });
    }
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

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
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await executeQuery(supabaseAdmin);

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
