import { RsvpSubmission, GiftPledge, WishlistItem, GiftReminder } from '../types';
import { supabase } from './supabase';
import { isTursoConfigured, getTursoClient } from './turso';
import { INITIAL_WISHLIST_ITEMS } from '../data/wishlistData';

const USER_RSVP_KEY = 'mm_user_active_rsvp';
const REMINDERS_STORAGE_KEY = 'mm_wedding_gift_reminders';

// Isolated Local Database keys for Miracle & Malvin
const MM_DB_RSVPS = 'mm_db_rsvps';
const MM_DB_CODES = 'mm_db_codes';
const MM_DB_PLEDGES = 'mm_db_pledges';
const MM_DB_RESERVATIONS = 'mm_db_reservations';
const MM_DB_WISHLIST = 'mm_db_wishlist';

// Clean up any lingering legacy cache from the browser immediately
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const keysToRemove = [
      'legacy_user_active_rsvp',
      'legacy_wedding_gift_reminders',
      'legacy_admin_lockout_until',
      'legacy_admin_attempts'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
} catch {
  // Ignore SSR / restricted environments
}

// Function to reset the entire database to a clean, fresh state (0 guests, 0 RSVPs, fresh wishlist)
export async function clearMiracleMalvinDatabase(): Promise<void> {
  try {
    localStorage.removeItem(MM_DB_RSVPS);
    localStorage.removeItem(MM_DB_CODES);
    localStorage.removeItem(MM_DB_PLEDGES);
    localStorage.removeItem(MM_DB_RESERVATIONS);
    localStorage.removeItem(MM_DB_WISHLIST);
    localStorage.removeItem(USER_RSVP_KEY);
    localStorage.removeItem(REMINDERS_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear local database:', e);
  }

  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        await client.batch([
          'DELETE FROM rsvps;',
          'DELETE FROM reservations;',
          'DELETE FROM gift_pledges;',
          'DELETE FROM wishlist;',
          'DELETE FROM invite_codes;'
        ]);
      }
    } catch (err) {
      console.warn('[turso] Failed to clear cloud tables:', err);
    }
  }
}

// Helper to determine if a dedicated, non-legacy Supabase is configured
function isDedicatedSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (!url || !key || url.includes('rmgrhxvbxwdpctvegppb')) {
    return false;
  }
  return true;
}

// Safe Local Storage Database Helpers
function getLocalDb<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setLocalDb<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save to local DB (${key}):`, e);
  }
}

// --- CSV Security ---
function sanitizeCsvCell(val: string): string {
  if (/^[=+\-@]/.test(val)) return `'${val}`;
  return val;
}

// --- Helper for Backend Admin Proxy ---
async function adminDb(action: string, payload: any = {}) {
  if (!isDedicatedSupabaseConfigured()) {
    throw new Error('Using isolated local database');
  }

  const pinHash = localStorage.getItem('admin_pin_hash');
  if (!pinHash) throw new Error('Not authenticated');

  const res = await fetch('/api/admin-db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinHash, action, payload })
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Admin request failed');
  return json.data;
}

// ============================================================
// --- RSVPS ---
// ============================================================

export async function getStoredRsvps(): Promise<RsvpSubmission[]> {
  // 1. Try Turso SQLite if configured
  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        const res = await client.execute('SELECT * FROM rsvps ORDER BY created_at DESC');
        const rsvps: RsvpSubmission[] = res.rows.map((row: any) => ({
          id: String(row.id),
          firstName: String(row.first_name || ''),
          lastName: String(row.last_name || ''),
          email: row.email ? String(row.email) : undefined,
          attendance: row.attendance === 'no' ? 'no' : 'yes',
          relation: row.relation ? String(row.relation) : undefined,
          message: row.message ? String(row.message) : undefined,
          submittedAt: String(row.created_at || new Date().toISOString())
        }));
        setLocalDb(MM_DB_RSVPS, rsvps);
        return rsvps;
      }
    } catch (err) {
      console.warn('[turso] Error fetching RSVPs, falling back to local DB:', err);
    }
  }

  // 2. Try Supabase if configured
  if (isDedicatedSupabaseConfigured()) {
    try {
      const data = await adminDb('getStoredRsvps');
      return (data || []).map((row: any) => ({
        id: row.id,
        firstName: row.first_name || (row.full_name ? row.full_name.split(' ')[0] : ''),
        lastName: row.last_name || (row.full_name ? row.full_name.substring(row.full_name.indexOf(' ') + 1) : ''),
        email: row.email,
        attendance: row.attendance as 'yes' | 'no',
        relation: row.relation,
        message: row.message,
        submittedAt: row.created_at
      }));
    } catch {
      try {
        const { data, error: sbError } = await supabase.from('rsvps').select('*').order('created_at', { ascending: false });
        if (sbError) throw sbError;
        return (data || []).map((row: any) => ({
          id: row.id,
          firstName: row.first_name || (row.full_name ? row.full_name.split(' ')[0] : ''),
          lastName: row.last_name || (row.full_name ? row.full_name.substring(row.full_name.indexOf(' ') + 1) : ''),
          email: row.email,
          attendance: row.attendance as 'yes' | 'no',
          relation: row.relation,
          message: row.message,
          submittedAt: row.created_at
        }));
      } catch {}
    }
  }

  // 3. Fallback to Local Storage DB
  return getLocalDb<RsvpSubmission[]>(MM_DB_RSVPS, []);
}

export async function saveRsvp(submission: Omit<RsvpSubmission, 'id' | 'submittedAt'>): Promise<RsvpSubmission> {
  const newRsvp: RsvpSubmission = {
    id: 'rsvp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    firstName: submission.firstName,
    lastName: submission.lastName,
    email: submission.email,
    attendance: submission.attendance,
    relation: submission.relation,
    message: submission.message,
    submittedAt: new Date().toISOString()
  };

  // Always save locally first for instant UI response
  const currentRsvps = getLocalDb<RsvpSubmission[]>(MM_DB_RSVPS, []);
  setLocalDb(MM_DB_RSVPS, [newRsvp, ...currentRsvps]);

  try {
    localStorage.setItem(USER_RSVP_KEY, JSON.stringify(newRsvp));
  } catch {}

  // Save to Turso if configured
  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        await client.execute({
          sql: `INSERT INTO rsvps (id, first_name, last_name, email, attendance, relation, message, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            newRsvp.id,
            newRsvp.firstName,
            newRsvp.lastName,
            newRsvp.email || null,
            newRsvp.attendance,
            newRsvp.relation || null,
            newRsvp.message || null,
            newRsvp.submittedAt
          ]
        });
      }
    } catch (err) {
      console.warn('[turso] Failed to sync RSVP to Turso, preserved in local DB:', err);
    }
  }

  // Sync to Supabase if configured
  if (isDedicatedSupabaseConfigured()) {
    try {
      const payload: any = {
        first_name: submission.firstName,
        last_name: submission.lastName,
        full_name: `${submission.firstName} ${submission.lastName}`.trim(),
        email: submission.email,
        attendance: submission.attendance,
        relation: submission.relation,
        message: submission.message
      };
      await supabase.from('rsvps').insert([payload]);
    } catch (err) {
      console.warn('Supabase sync skipped:', err);
    }
  }

  return newRsvp;
}

export async function deleteRsvp(id: string): Promise<void> {
  const currentRsvps = getLocalDb<RsvpSubmission[]>(MM_DB_RSVPS, []);
  setLocalDb(MM_DB_RSVPS, currentRsvps.filter(r => r.id !== id));

  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        await client.execute({
          sql: 'DELETE FROM rsvps WHERE id = ?',
          args: [id]
        });
      }
    } catch (err) {
      console.warn('[turso] Failed to delete RSVP from cloud:', err);
    }
  }

  if (isDedicatedSupabaseConfigured()) {
    try {
      await adminDb('deleteRsvp', { id });
    } catch {}
  }
}

export function getUserActiveRsvp(): RsvpSubmission | null {
  try {
    const raw = localStorage.getItem(USER_RSVP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearUserActiveRsvp(): void {
  try {
    localStorage.removeItem(USER_RSVP_KEY);
  } catch {}
}

export async function exportRsvpsCsv(): Promise<void> {
  const rsvps = await getStoredRsvps();
  if (rsvps.length === 0) {
    alert('No RSVPs to export.');
    return;
  }

  const headers = ['First Name', 'Last Name', 'Email', 'Attendance', 'Relationship', 'Message', 'Submitted At'];
  const rows = rsvps.map(r => [
    `"${sanitizeCsvCell(r.firstName).replace(/"/g, '""')}"`,
    `"${sanitizeCsvCell(r.lastName).replace(/"/g, '""')}"`,
    `"${sanitizeCsvCell(r.email || '').replace(/"/g, '""')}"`,
    `"${r.attendance}"`,
    `"${sanitizeCsvCell(r.relation || '').replace(/"/g, '""')}"`,
    `"${sanitizeCsvCell(r.message || '').replace(/"/g, '""')}"`,
    `"${new Date(r.submittedAt).toLocaleString()}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Miracle_Malvin_Wedding_RSVPs_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================
// --- GIFT PLEDGES ---
// ============================================================

export async function getStoredGiftPledges(): Promise<GiftPledge[]> {
  const adminPledges = await getStoredGiftPledgesAdmin();
  return adminPledges.map(p => ({
    ...p,
    giverEmail: '',
    giverNote: ''
  }));
}

export async function getStoredGiftPledgesAdmin(): Promise<GiftPledge[]> {
  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        const res = await client.execute('SELECT * FROM gift_pledges ORDER BY created_at DESC');
        const pledges: GiftPledge[] = res.rows.map((row: any) => ({
          id: String(row.id),
          itemId: String(row.item_id),
          itemName: String(row.item_name),
          amount: Number(row.amount || 0),
          giverName: String(row.giver_name),
          giverEmail: row.giver_email ? String(row.giver_email) : undefined,
          giverNote: row.giver_note ? String(row.giver_note) : '',
          giverRelation: row.giver_relation ? String(row.giver_relation) : undefined,
          pledgedAt: String(row.created_at || new Date().toISOString())
        }));
        setLocalDb(MM_DB_PLEDGES, pledges);
        return pledges;
      }
    } catch (err) {
      console.warn('[turso] Failed to fetch gift pledges, using local DB:', err);
    }
  }

  if (isDedicatedSupabaseConfigured()) {
    try {
      const data = await adminDb('getStoredGiftPledgesAdmin');
      return (data || []).map((row: any) => ({
        id: row.id,
        itemId: row.item_id,
        itemName: row.item_name,
        amount: row.amount,
        giverName: row.giver_name,
        giverEmail: row.giver_email,
        giverNote: row.giver_note || '',
        giverRelation: row.relation,
        pledgedAt: row.created_at
      }));
    } catch {}
  }

  return getLocalDb<GiftPledge[]>(MM_DB_PLEDGES, []);
}

export async function saveGiftPledge(pledge: Omit<GiftPledge, 'id' | 'pledgedAt'>): Promise<GiftPledge> {
  const newPledge: GiftPledge = {
    id: 'pledge_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    itemId: pledge.itemId,
    itemName: pledge.itemName,
    amount: pledge.amount,
    giverName: pledge.giverName,
    giverEmail: pledge.giverEmail,
    giverNote: pledge.giverNote,
    giverRelation: pledge.giverRelation,
    pledgedAt: new Date().toISOString()
  };

  const currentPledges = getLocalDb<GiftPledge[]>(MM_DB_PLEDGES, []);
  setLocalDb(MM_DB_PLEDGES, [newPledge, ...currentPledges]);

  // When a pledge / payment is saved for a reserved item, mark reservation as fulfilled so it never expires!
  if (pledge.itemId && pledge.itemId !== 'cash_gift') {
    const reservations = getLocalDb<GiftReminder[]>(MM_DB_RESERVATIONS, []);
    const updated = reservations.map(r => {
      if (r.itemId === pledge.itemId) {
        return {
          ...r,
          isFulfilled: true,
          fulfilledAt: new Date().toISOString()
        };
      }
      return r;
    });
    setLocalDb(MM_DB_RESERVATIONS, updated);
  }

  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        await client.execute({
          sql: `INSERT INTO gift_pledges (id, item_id, item_name, amount, giver_name, giver_email, giver_note, giver_relation, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            newPledge.id,
            newPledge.itemId,
            newPledge.itemName,
            newPledge.amount,
            newPledge.giverName,
            newPledge.giverEmail || null,
            newPledge.giverNote || null,
            newPledge.giverRelation || null,
            newPledge.pledgedAt
          ]
        });
        if (pledge.itemId && pledge.itemId !== 'cash_gift') {
          await client.execute({
            sql: 'UPDATE reservations SET is_fulfilled = 1, fulfilled_at = ? WHERE item_id = ?',
            args: [new Date().toISOString(), pledge.itemId]
          });
        }
      }
    } catch (err) {
      console.warn('[turso] Failed to sync gift pledge to cloud:', err);
    }
  }

  if (isDedicatedSupabaseConfigured()) {
    try {
      await supabase.from('gift_pledges').insert([{
        item_id: pledge.itemId,
        item_name: pledge.itemName,
        amount: pledge.amount,
        giver_name: pledge.giverName,
        giver_email: pledge.giverEmail,
        giver_note: pledge.giverNote,
        relation: pledge.giverRelation
      }]);
    } catch {}
  }

  return newPledge;
}

export async function deleteGiftPledge(id: string): Promise<void> {
  const currentPledges = getLocalDb<GiftPledge[]>(MM_DB_PLEDGES, []);
  setLocalDb(MM_DB_PLEDGES, currentPledges.filter(p => p.id !== id));

  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        await client.execute({
          sql: 'DELETE FROM gift_pledges WHERE id = ?',
          args: [id]
        });
      }
    } catch (err) {
      console.warn('[turso] Failed to delete pledge from cloud:', err);
    }
  }

  if (isDedicatedSupabaseConfigured()) {
    try {
      await adminDb('deleteGiftPledge', { id });
    } catch {}
  }
}

export async function exportGiftPledgesCsv(): Promise<void> {
  const pledges = await getStoredGiftPledgesAdmin();
  if (pledges.length === 0) {
    alert('No item gift payments recorded yet.');
    return;
  }

  const headers = ['Pledge ID', 'Item ID', 'Item Name', 'Amount (NGN)', 'Giver Name', 'Giver Email', 'Relationship', 'Message', 'Date'];
  const rows = pledges.map(p => [
    `"${p.id}"`,
    `"${sanitizeCsvCell(p.itemId).replace(/"/g, '""')}"`,
    `"${sanitizeCsvCell(p.itemName).replace(/"/g, '""')}"`,
    `"${p.amount}"`,
    `"${sanitizeCsvCell(p.giverName).replace(/"/g, '""')}"`,
    `"${sanitizeCsvCell(p.giverEmail || '').replace(/"/g, '""')}"`,
    `"${sanitizeCsvCell(p.giverRelation || '').replace(/"/g, '""')}"`,
    `"${sanitizeCsvCell(p.giverNote || '').replace(/"/g, '""')}"`,
    `"${new Date(p.pledgedAt).toLocaleString()}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Miracle_Malvin_Wedding_GiftPledges_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================
// --- RESERVATIONS / HOLDS ---
// ============================================================

export async function getStoredReminders(): Promise<GiftReminder[]> {
  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        const res = await client.execute('SELECT * FROM reservations ORDER BY created_at DESC');
        const reservations: GiftReminder[] = res.rows.map((row: any) => ({
          id: String(row.id),
          itemId: String(row.item_id),
          itemName: String(row.item_name),
          itemPrice: String(row.item_price || ''),
          email: String(row.email),
          reservedByName: row.reserved_by_name ? String(row.reserved_by_name) : undefined,
          relation: row.relation ? String(row.relation) : undefined,
          isAnonymous: Boolean(row.is_anonymous),
          remindDate: String(row.remind_date || ''),
          expiresAt: row.expires_at ? String(row.expires_at) : undefined,
          createdAt: String(row.created_at || new Date().toISOString()),
          isFulfilled: Boolean(row.is_fulfilled),
          fulfilledAt: row.fulfilled_at ? String(row.fulfilled_at) : undefined
        }));
        setLocalDb(MM_DB_RESERVATIONS, reservations);
        return reservations;
      }
    } catch (err) {
      console.warn('[turso] Failed to fetch reservations from cloud:', err);
    }
  }

  return getLocalDb<GiftReminder[]>(MM_DB_RESERVATIONS, []);
}

export async function getActiveReservations(): Promise<GiftReminder[]> {
  const reservations = await getStoredReminders();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return reservations.filter(r => !r.isFulfilled && (new Date(r.createdAt).getTime() + ONE_WEEK_MS) > now);
}

export async function markReservationFulfilled(id: string): Promise<void> {
  const reservations = getLocalDb<GiftReminder[]>(MM_DB_RESERVATIONS, []);
  const updated = reservations.map(r => {
    if (r.id === id) {
      return {
        ...r,
        isFulfilled: true,
        fulfilledAt: new Date().toISOString()
      };
    }
    return r;
  });
  setLocalDb(MM_DB_RESERVATIONS, updated);

  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        await client.execute({
          sql: 'UPDATE reservations SET is_fulfilled = 1, fulfilled_at = ? WHERE id = ?',
          args: [new Date().toISOString(), id]
        });
      }
    } catch (err) {
      console.warn('[turso] Failed to mark reservation fulfilled in cloud:', err);
    }
  }
}

export async function saveReminder(reminder: {
  itemId: string;
  itemName: string;
  itemPrice: string;
  email: string;
  reservedByName?: string;
  guestName?: string;
  relation?: string;
  isAnonymous?: boolean;
}): Promise<GiftReminder> {
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const newReminder: GiftReminder = {
    id: 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    itemId: reminder.itemId,
    itemName: reminder.itemName,
    itemPrice: reminder.itemPrice,
    email: reminder.email,
    reservedByName: reminder.reservedByName || reminder.guestName,
    relation: reminder.relation,
    isAnonymous: reminder.isAnonymous,
    remindDate: new Date(now + FIVE_DAYS_MS).toISOString(),
    expiresAt: new Date(now + ONE_WEEK_MS).toISOString(),
    createdAt: new Date().toISOString()
  };

  const current = getLocalDb<GiftReminder[]>(MM_DB_RESERVATIONS, []);
  setLocalDb(MM_DB_RESERVATIONS, [newReminder, ...current]);

  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        await client.execute({
          sql: `INSERT INTO reservations (id, item_id, item_name, item_price, email, reserved_by_name, relation, is_anonymous, remind_date, expires_at, is_fulfilled, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
          args: [
            newReminder.id,
            newReminder.itemId,
            newReminder.itemName,
            newReminder.itemPrice || null,
            newReminder.email,
            newReminder.reservedByName || null,
            newReminder.relation || null,
            newReminder.isAnonymous ? 1 : 0,
            newReminder.remindDate,
            newReminder.expiresAt || null,
            newReminder.createdAt
          ]
        });
      }
    } catch (err) {
      console.warn('[turso] Failed to sync reservation to cloud:', err);
    }
  }

  return newReminder;
}

export function getLocalReminders(): string[] {
  try {
    const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function deleteReservation(id: string, itemId?: string): Promise<void> {
  const current = getLocalDb<GiftReminder[]>(MM_DB_RESERVATIONS, []);
  const filtered = current.filter(r => r.id !== id && (itemId ? r.itemId !== itemId : true));
  setLocalDb(MM_DB_RESERVATIONS, filtered);

  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        await client.execute({
          sql: 'DELETE FROM reservations WHERE id = ? OR item_id = ?',
          args: [id, itemId || '']
        });
      }
    } catch (err) {
      console.warn('[turso] Failed to delete reservation from cloud:', err);
    }
  }
}

// ============================================================
// --- WISHLIST ITEMS ---
// ============================================================

export async function getStoredWishlistItems(): Promise<WishlistItem[]> {
  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        const res = await client.execute('SELECT * FROM wishlist ORDER BY created_at DESC');
        if (res.rows.length > 0) {
          const items: WishlistItem[] = res.rows.map((row: any) => ({
            id: String(row.id),
            name: String(row.name),
            quantity: Number(row.quantity || 1),
            price: Number(row.price || 0),
            formattedPrice: String(row.formatted_price || `₦${Number(row.price || 0).toLocaleString()}`),
            category: row.category as any,
            image: String(row.image || ''),
            description: String(row.description || ''),
            isFunded: Boolean(row.is_funded),
            fundedBy: row.funded_by ? String(row.funded_by) : undefined,
            isReserved: Boolean(row.is_reserved),
            reservedUntil: row.reserved_until ? String(row.reserved_until) : undefined,
            reservedByEmail: row.reserved_by_email ? String(row.reserved_by_email) : undefined,
            reservedByName: row.reserved_by_name ? String(row.reserved_by_name) : undefined,
            isAnonymousReservation: Boolean(row.is_anonymous_reservation)
          }));
          setLocalDb(MM_DB_WISHLIST, items);
          return items;
        }
      }
    } catch (err) {
      console.warn('[turso] Failed to fetch wishlist from cloud:', err);
    }
  }

  const customItems = getLocalDb<WishlistItem[] | null>(MM_DB_WISHLIST, null);
  if (customItems && customItems.length > 0) {
    return customItems;
  }
  return INITIAL_WISHLIST_ITEMS;
}

export async function saveWishlistItem(item: Omit<WishlistItem, 'id' | 'isFunded' | 'fundedBy' | 'isReserved' | 'reservedUntil' | 'reservedByEmail' | 'reservedByName'>): Promise<WishlistItem> {
  const current = await getStoredWishlistItems();
  const newItem: WishlistItem = {
    ...item,
    id: 'item_' + Date.now(),
    isFunded: false,
    isReserved: false
  };
  setLocalDb(MM_DB_WISHLIST, [newItem, ...current]);

  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        await client.execute({
          sql: `INSERT INTO wishlist (id, name, quantity, price, formatted_price, category, image, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            newItem.id,
            newItem.name,
            newItem.quantity,
            newItem.price,
            newItem.formattedPrice,
            newItem.category,
            newItem.image,
            newItem.description,
            new Date().toISOString()
          ]
        });
      }
    } catch (err) {
      console.warn('[turso] Failed to save wishlist item to cloud:', err);
    }
  }

  return newItem;
}

export async function deleteWishlistItem(id: string): Promise<void> {
  const current = await getStoredWishlistItems();
  setLocalDb(MM_DB_WISHLIST, current.filter(item => item.id !== id));

  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        await client.execute({
          sql: 'DELETE FROM wishlist WHERE id = ?',
          args: [id]
        });
      }
    } catch (err) {
      console.warn('[turso] Failed to delete wishlist item from cloud:', err);
    }
  }
}

export async function updateWishlistItem(item: Omit<WishlistItem, 'isFunded' | 'fundedBy' | 'isReserved' | 'reservedUntil' | 'reservedByEmail' | 'reservedByName'>): Promise<WishlistItem> {
  const current = await getStoredWishlistItems();
  const updated = current.map(i => i.id === item.id ? { ...i, ...item } : i);
  setLocalDb(MM_DB_WISHLIST, updated);

  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        await client.execute({
          sql: `UPDATE wishlist SET name = ?, price = ?, formatted_price = ?, category = ?, image = ?, description = ?, quantity = ?
                WHERE id = ?`,
          args: [
            item.name,
            item.price,
            item.formattedPrice,
            item.category,
            item.image,
            item.description,
            item.quantity,
            item.id
          ]
        });
      }
    } catch (err) {
      console.warn('[turso] Failed to update wishlist item in cloud:', err);
    }
  }

  return { ...item, isFunded: false, isReserved: false };
}

// ============================================================
// --- INVITE CODES ---
// ============================================================

export interface InviteCode {
  id: string;
  code: string;
  is_used: boolean;
  is_shared?: boolean;
  used_by?: string;
  created_by?: string;
  created_at: string;
}

export async function generateInviteCode(createdBy: string = 'malvin'): Promise<string> {
  const currentCodes = await getInviteCodes();
  const existingSet = new Set(currentCodes.map(c => c.code));

  let code = '';
  while (true) {
    code = Math.floor(10000 + Math.random() * 90000).toString();
    if (!existingSet.has(code)) break;
  }

  const newCode: InviteCode = {
    id: 'code_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    code,
    is_used: false,
    is_shared: false,
    created_by: createdBy,
    created_at: new Date().toISOString()
  };

  setLocalDb(MM_DB_CODES, [newCode, ...currentCodes]);

  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        await client.execute({
          sql: `INSERT INTO invite_codes (id, code, guest_name, category, max_guests, is_used, created_at)
                VALUES (?, ?, '', ?, 1, 0, ?)`,
          args: [newCode.id, newCode.code, newCode.created_by || 'malvin', newCode.created_at]
        });
      }
    } catch (err) {
      console.warn('[turso] Failed to save invite code to cloud:', err);
    }
  }

  return code;
}

export async function bulkGenerateInviteCodes(count: number, createdBy: string = 'malvin'): Promise<string[]> {
  const currentCodes = await getInviteCodes();
  const existingSet = new Set(currentCodes.map(c => c.code));

  const newCodes: InviteCode[] = [];
  const generatedStrings: string[] = [];

  for (let i = 0; i < count; i++) {
    let code = '';
    while (true) {
      code = Math.floor(10000 + Math.random() * 90000).toString();
      if (!existingSet.has(code)) {
        existingSet.add(code);
        break;
      }
    }
    generatedStrings.push(code);
    newCodes.push({
      id: 'code_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 6),
      code,
      is_used: false,
      is_shared: false,
      created_by: createdBy,
      created_at: new Date().toISOString()
    });
  }

  setLocalDb(MM_DB_CODES, [...newCodes, ...currentCodes]);

  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        const statements = newCodes.map(c => ({
          sql: `INSERT INTO invite_codes (id, code, guest_name, category, max_guests, is_used, created_at)
                VALUES (?, ?, '', ?, 1, 0, ?)`,
          args: [c.id, c.code, c.created_by || 'malvin', c.created_at]
        }));
        await client.batch(statements);
      }
    } catch (err) {
      console.warn('[turso] Failed to bulk save invite codes to cloud:', err);
    }
  }

  return generatedStrings;
}

export async function deleteInviteCodes(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const currentCodes = getLocalDb<InviteCode[]>(MM_DB_CODES, []);
  const idSet = new Set(ids);
  setLocalDb(MM_DB_CODES, currentCodes.filter(c => !idSet.has(c.id)));

  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        const placeholders = ids.map(() => '?').join(',');
        await client.execute({
          sql: `DELETE FROM invite_codes WHERE id IN (${placeholders})`,
          args: ids
        });
      }
    } catch (err) {
      console.warn('[turso] Failed to delete invite codes from cloud:', err);
    }
  }
}

export async function markInviteCodeAsShared(id: string): Promise<void> {
  const currentCodes = getLocalDb<InviteCode[]>(MM_DB_CODES, []);
  setLocalDb(MM_DB_CODES, currentCodes.map(c => c.id === id ? { ...c, is_shared: true } : c));
}

export async function unmarkInviteCodeAsShared(id: string): Promise<void> {
  const currentCodes = getLocalDb<InviteCode[]>(MM_DB_CODES, []);
  setLocalDb(MM_DB_CODES, currentCodes.map(c => c.id === id ? { ...c, is_shared: false } : c));
}

export async function getInviteCodes(filterByRole?: string): Promise<InviteCode[]> {
  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        const res = await client.execute('SELECT * FROM invite_codes ORDER BY created_at DESC');
        const codes: InviteCode[] = res.rows.map((row: any) => ({
          id: String(row.id),
          code: String(row.code),
          is_used: Boolean(row.is_used),
          created_by: row.category ? String(row.category) : 'malvin',
          used_by: row.guest_name ? String(row.guest_name) : undefined,
          created_at: String(row.created_at || new Date().toISOString())
        }));
        setLocalDb(MM_DB_CODES, codes);
        if (filterByRole && !['miracle', 'malvin'].includes(filterByRole)) {
          return codes.filter(c => c.created_by === filterByRole);
        }
        return codes;
      }
    } catch (err) {
      console.warn('[turso] Failed to fetch invite codes from cloud:', err);
    }
  }

  const currentCodes = getLocalDb<InviteCode[]>(MM_DB_CODES, []);
  if (filterByRole && !['miracle', 'malvin'].includes(filterByRole)) {
    return currentCodes.filter(c => c.created_by === filterByRole);
  }
  return currentCodes;
}

export async function verifyInviteCode(code: string): Promise<InviteCode | null> {
  const currentCodes = await getInviteCodes();
  const found = currentCodes.find(c => c.code.trim() === code.trim());
  return found || null;
}

export async function markCodeAsUsed(code: string, usedBy: string): Promise<void> {
  const currentCodes = getLocalDb<InviteCode[]>(MM_DB_CODES, []);
  setLocalDb(MM_DB_CODES, currentCodes.map(c => 
    c.code.trim() === code.trim() ? { ...c, is_used: true, used_by: usedBy } : c
  ));

  if (isTursoConfigured()) {
    try {
      const client = getTursoClient();
      if (client) {
        await client.execute({
          sql: 'UPDATE invite_codes SET is_used = 1, guest_name = ? WHERE code = ?',
          args: [usedBy, code.trim()]
        });
      }
    } catch (err) {
      console.warn('[turso] Failed to mark code as used in cloud:', err);
    }
  }
}

export async function exportInviteCodesCsv(filterByRole?: string): Promise<void> {
  const codes = await getInviteCodes(filterByRole);
  if (codes.length === 0) {
    alert('No invite codes to export.');
    return;
  }

  const headers = ['Code', 'Status', 'Used By', 'Created By', 'Created At'];
  const rows = codes.map(c => [
    c.code,
    c.is_used ? 'Used' : 'Available',
    sanitizeCsvCell(c.used_by || ''),
    c.created_by || '',
    new Date(c.created_at).toLocaleString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(e => e.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Miracle_Malvin_Invite_Codes_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
