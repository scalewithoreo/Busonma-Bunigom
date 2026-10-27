import { RsvpSubmission, GiftPledge, WishlistItem } from '../types';
import { supabase } from './supabase';
import { INITIAL_WISHLIST_ITEMS } from '../data/wishlistData';

const USER_RSVP_KEY = 'mm_user_active_rsvp';
const REMINDERS_STORAGE_KEY = 'mm_wedding_gift_reminders';

// Isolated Local Database keys for Miracle & Malvin
const MM_DB_RSVPS = 'mm_db_rsvps';
const MM_DB_CODES = 'mm_db_codes';
const MM_DB_PLEDGES = 'mm_db_pledges';
const MM_DB_RESERVATIONS = 'mm_db_reservations';
const MM_DB_WISHLIST = 'mm_db_wishlist';

// Clean up any lingering legacy Ore & Dara cache from the browser immediately
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const keysToRemove = [
      'ore_dara_user_active_rsvp',
      'ore_dara_wedding_gift_reminders',
      'ore_dara_admin_lockout_until',
      'ore_dara_admin_attempts'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
} catch {
  // Ignore SSR / restricted environments
}

// Function to reset the entire database to a clean, fresh state (0 guests, 0 RSVPs, fresh wishlist)
export function clearMiracleMalvinDatabase(): void {
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
}

// Helper to determine if a dedicated, non-legacy Supabase is configured
function isDedicatedSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  // NEVER connect to Ore & Dara's database
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
  // If no dedicated external database is configured, route immediately to local DB
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

// --- RSVPs ---

export async function getStoredRsvps(): Promise<RsvpSubmission[]> {
  if (!isDedicatedSupabaseConfigured()) {
    return getLocalDb<RsvpSubmission[]>(MM_DB_RSVPS, []);
  }

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
    } catch {
      return getLocalDb<RsvpSubmission[]>(MM_DB_RSVPS, []);
    }
  }
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

  // Save to isolated local DB
  const currentRsvps = getLocalDb<RsvpSubmission[]>(MM_DB_RSVPS, []);
  setLocalDb(MM_DB_RSVPS, [newRsvp, ...currentRsvps]);

  try {
    localStorage.setItem(USER_RSVP_KEY, JSON.stringify(newRsvp));
  } catch {}

  // If dedicated Supabase configured, sync with it
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
      console.warn('Supabase sync skipped, stored locally:', err);
    }
  }

  return newRsvp;
}

export async function deleteRsvp(id: string): Promise<void> {
  const currentRsvps = getLocalDb<RsvpSubmission[]>(MM_DB_RSVPS, []);
  setLocalDb(MM_DB_RSVPS, currentRsvps.filter(r => r.id !== id));

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

// --- Gift Pledges ---

export async function getStoredGiftPledges(): Promise<GiftPledge[]> {
  if (!isDedicatedSupabaseConfigured()) {
    const pledges = getLocalDb<GiftPledge[]>(MM_DB_PLEDGES, []);
    return pledges.map(p => ({
      ...p,
      giverEmail: '',
      giverNote: ''
    }));
  }

  try {
    const { data } = await supabase
      .from('gift_pledges')
      .select('id, item_id, item_name, amount, giver_name, created_at')
      .order('created_at', { ascending: false });

    return (data || []).map((row: any) => ({
      id: row.id,
      itemId: row.item_id,
      itemName: row.item_name,
      amount: row.amount,
      giverName: row.giver_name,
      giverEmail: '',
      giverNote: '',
      pledgedAt: row.created_at
    }));
  } catch {
    return getLocalDb<GiftPledge[]>(MM_DB_PLEDGES, []);
  }
}

export async function getStoredGiftPledgesAdmin(): Promise<GiftPledge[]> {
  if (!isDedicatedSupabaseConfigured()) {
    return getLocalDb<GiftPledge[]>(MM_DB_PLEDGES, []);
  }

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
  } catch {
    return getLocalDb<GiftPledge[]>(MM_DB_PLEDGES, []);
  }
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

// --- Gift Reminders / Reservations ---

export interface GiftReminder {
  id: string;
  itemId: string;
  itemName: string;
  itemPrice: string;
  email: string;
  reservedByName?: string;
  relation?: string;
  isAnonymous?: boolean;
  remindDate: string;
  expiresAt: string;
  createdAt: string;
}

export async function getStoredReminders(): Promise<GiftReminder[]> {
  return getLocalDb<GiftReminder[]>(MM_DB_RESERVATIONS, []);
}

export async function getActiveReservations(): Promise<GiftReminder[]> {
  const reservations = getLocalDb<GiftReminder[]>(MM_DB_RESERVATIONS, []);
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return reservations.filter(r => (new Date(r.createdAt).getTime() + ONE_WEEK_MS) > now);
}

export async function saveReminder(reminder: {
  itemId: string;
  itemName: string;
  itemPrice: string;
  email: string;
  reservedByName?: string;
  relation?: string;
  isAnonymous?: boolean;
}): Promise<void> {
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const newReminder: GiftReminder = {
    id: 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    itemId: reminder.itemId,
    itemName: reminder.itemName,
    itemPrice: reminder.itemPrice,
    email: reminder.email,
    reservedByName: reminder.reservedByName,
    relation: reminder.relation,
    isAnonymous: reminder.isAnonymous,
    remindDate: new Date(now + FIVE_DAYS_MS).toISOString(),
    expiresAt: new Date(now + ONE_WEEK_MS).toISOString(),
    createdAt: new Date().toISOString()
  };

  const current = getLocalDb<GiftReminder[]>(MM_DB_RESERVATIONS, []);
  setLocalDb(MM_DB_RESERVATIONS, [newReminder, ...current]);
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
}

// --- Wishlist Items ---

export async function getStoredWishlistItems(): Promise<WishlistItem[]> {
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
  return newItem;
}

export async function deleteWishlistItem(id: string): Promise<void> {
  const current = await getStoredWishlistItems();
  setLocalDb(MM_DB_WISHLIST, current.filter(item => item.id !== id));
}

export async function updateWishlistItem(item: Omit<WishlistItem, 'isFunded' | 'fundedBy' | 'isReserved' | 'reservedUntil' | 'reservedByEmail' | 'reservedByName'>): Promise<WishlistItem> {
  const current = await getStoredWishlistItems();
  const updated = current.map(i => i.id === item.id ? { ...i, ...item } : i);
  setLocalDb(MM_DB_WISHLIST, updated);
  return { ...item, isFunded: false, isReserved: false };
}

// --- Invite Codes ---

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
  const currentCodes = getLocalDb<InviteCode[]>(MM_DB_CODES, []);
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
  return code;
}

export async function bulkGenerateInviteCodes(count: number, createdBy: string = 'malvin'): Promise<string[]> {
  const currentCodes = getLocalDb<InviteCode[]>(MM_DB_CODES, []);
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
  return generatedStrings;
}

export async function deleteInviteCodes(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const currentCodes = getLocalDb<InviteCode[]>(MM_DB_CODES, []);
  const idSet = new Set(ids);
  setLocalDb(MM_DB_CODES, currentCodes.filter(c => !idSet.has(c.id)));
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
  const currentCodes = getLocalDb<InviteCode[]>(MM_DB_CODES, []);
  if (filterByRole && !['miracle', 'malvin', 'ore', 'dara'].includes(filterByRole)) {
    return currentCodes.filter(c => c.created_by === filterByRole);
  }
  return currentCodes;
}

export async function verifyInviteCode(code: string): Promise<InviteCode | null> {
  const currentCodes = getLocalDb<InviteCode[]>(MM_DB_CODES, []);
  const found = currentCodes.find(c => c.code.trim() === code.trim());
  return found || null;
}

export async function markCodeAsUsed(code: string, usedBy: string): Promise<void> {
  const currentCodes = getLocalDb<InviteCode[]>(MM_DB_CODES, []);
  setLocalDb(MM_DB_CODES, currentCodes.map(c => 
    c.code.trim() === code.trim() ? { ...c, is_used: true, used_by: usedBy } : c
  ));
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
