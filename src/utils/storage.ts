import { RsvpSubmission, GiftPledge, WishlistItem } from '../types';
import { supabase } from './supabase';

const USER_RSVP_KEY = 'ore_dara_user_active_rsvp';
const REMINDERS_STORAGE_KEY = 'ore_dara_wedding_gift_reminders'; // We can keep reminders local for bell icon state, or fetch from DB. Let's fetch from DB.

// --- CSV Security ---
// Prevents spreadsheet formula injection (e.g. =CMD|' /C calc'!A0) by prefixing
// dangerous leading characters with a single quote, which Excel/Sheets treat as text.
function sanitizeCsvCell(val: string): string {
  if (/^[=+\-@]/.test(val)) return `'${val}`;
  return val;
}

// --- Helper for Backend Admin Proxy ---
async function adminDb(action: string, payload: any = {}) {
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
  } catch (error) {
    console.warn('adminDb getStoredRsvps failed, trying direct Supabase fallback:', error);
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
    } catch (fallbackErr) {
      console.error('Error fetching RSVPs:', fallbackErr);
      return [];
    }
  }
}

export async function saveRsvp(submission: Omit<RsvpSubmission, 'id' | 'submittedAt'>): Promise<RsvpSubmission> {
  const payload: any = {
    first_name: submission.firstName,
    last_name: submission.lastName,
    full_name: `${submission.firstName} ${submission.lastName}`.trim(),
    email: submission.email,
    attendance: submission.attendance,
    relation: submission.relation,
    message: submission.message
  };

  const { data, error } = await supabase
    .from('rsvps')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error saving RSVP:', error);
    throw error;
  }

  const savedRsvp: RsvpSubmission = {
    id: data.id,
    firstName: data.first_name || submission.firstName,
    lastName: data.last_name || submission.lastName,
    email: data.email,
    attendance: data.attendance as 'yes' | 'no',
    relation: data.relation,
    message: data.message,
    submittedAt: data.created_at
  };

  // Keep local session active
  localStorage.setItem(USER_RSVP_KEY, JSON.stringify(savedRsvp));
  
  return savedRsvp;
}

export async function deleteRsvp(id: string): Promise<void> {
  await adminDb('deleteRsvp', { id });
}

export function getUserActiveRsvp(): RsvpSubmission | null {
  try {
    const raw = localStorage.getItem(USER_RSVP_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function clearUserActiveRsvp(): void {
  localStorage.removeItem(USER_RSVP_KEY);
}

export async function exportRsvpsCsv(): Promise<void> {
  const rsvps = await getStoredRsvps();
  if (rsvps.length === 0) {
    console.warn('No RSVPs recorded yet.');
    return;
  }

  const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Attendance', 'Connection', 'Message', 'Submitted At'];
  const rows = rsvps.map(r => [
    `"${r.id}"`,
    `"${sanitizeCsvCell(r.firstName).replace(/"/g, '""')}"`,
    `"${sanitizeCsvCell(r.lastName).replace(/"/g, '""')}"`,
    `"${sanitizeCsvCell(r.email || '').replace(/"/g, '""')}"`,
    `"${r.attendance === 'yes' ? 'Attending' : 'Declined'}"`,
    `"${sanitizeCsvCell(r.relation || '').replace(/"/g, '""')}"`,
    `"${sanitizeCsvCell(r.message || '').replace(/"/g, '""')}"`,
    `"${new Date(r.submittedAt).toLocaleString()}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Ore_Dara_Wedding_Guestlist_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- Gift Pledges ---

// Public-safe version — used by the public /wishlist page.
// Deliberately omits giver_email and giver_note so private contact details
// never reach a visitor's browser via DevTools / network inspection.
export async function getStoredGiftPledges(): Promise<GiftPledge[]> {
  const { data, error } = await supabase
    .from('gift_pledges')
    .select('id, item_id, item_name, amount, giver_name, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pledges:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name,
    amount: row.amount,
    giverName: row.giver_name,
    giverEmail: '',    // intentionally blank for public callers
    giverNote: '',     // intentionally blank for public callers
    pledgedAt: row.created_at
  }));
}

// Admin-only version — full data including email and private notes.
// Only called from AdminModal.tsx (behind the admin PIN gate).
export async function getStoredGiftPledgesAdmin(): Promise<GiftPledge[]> {
  try {
    const data = await adminDb('getStoredGiftPledgesAdmin');
    return (data || []).map((row: any) => {
      let relation = row.relation;
      let note = row.giver_note || '';
      if (!relation && note.startsWith('[Relation:')) {
        const match = note.match(/^\[Relation:\s*([^\]]+)\]\s*(.*)$/);
        if (match) {
          relation = match[1];
          note = match[2];
        }
      }

      return {
        id: row.id,
        itemId: row.item_id,
        itemName: row.item_name,
        amount: row.amount,
        giverName: row.giver_name,
        giverEmail: row.giver_email,
        giverNote: note,
        giverRelation: relation,
        pledgedAt: row.created_at
      };
    });
  } catch (error) {
    console.warn('adminDb getStoredGiftPledgesAdmin failed, trying direct Supabase fallback:', error);
    try {
      const { data, error: sbError } = await supabase.from('gift_pledges').select('*').order('created_at', { ascending: false });
      if (sbError) throw sbError;
      return (data || []).map((row: any) => {
        let relation = row.relation;
        let note = row.giver_note || '';
        if (!relation && note.startsWith('[Relation:')) {
          const match = note.match(/^\[Relation:\s*([^\]]+)\]\s*(.*)$/);
          if (match) {
            relation = match[1];
            note = match[2];
          }
        }

        return {
          id: row.id,
          itemId: row.item_id,
          itemName: row.item_name,
          amount: row.amount,
          giverName: row.giver_name,
          giverEmail: row.giver_email,
          giverNote: note,
          giverRelation: relation,
          pledgedAt: row.created_at
        };
      });
    } catch (fallbackErr) {
      console.error('Error fetching pledges (admin):', fallbackErr);
      return [];
    }
  }
}

export async function saveGiftPledge(pledge: Omit<GiftPledge, 'id' | 'pledgedAt'>): Promise<GiftPledge> {
  const insertPayload: any = {
    item_id: pledge.itemId,
    item_name: pledge.itemName,
    amount: pledge.amount,
    giver_name: pledge.giverName,
    giver_email: pledge.giverEmail,
    giver_note: pledge.giverNote
  };
  if (pledge.giverRelation) {
    insertPayload.relation = pledge.giverRelation;
  }

  let data: any = null;
  const res = await supabase
    .from('gift_pledges')
    .insert([insertPayload])
    .select()
    .single();

  if (res.error) {
    console.warn('Attempting fallback save for gift pledge without relation column...', res.error);
    const noteWithRelation = pledge.giverRelation 
      ? `[Relation: ${pledge.giverRelation}] ${pledge.giverNote || ''}`.trim()
      : pledge.giverNote;

    const retry = await supabase
      .from('gift_pledges')
      .insert([
        {
          item_id: pledge.itemId,
          item_name: pledge.itemName,
          amount: pledge.amount,
          giver_name: pledge.giverName,
          giver_email: pledge.giverEmail,
          giver_note: noteWithRelation
        }
      ])
      .select()
      .single();

    if (retry.error) {
      console.error('Error saving pledge:', retry.error);
      throw retry.error;
    }
    data = retry.data;
  } else {
    data = res.data;
  }

  const result = {
    id: data.id,
    itemId: data.item_id,
    itemName: data.item_name,
    amount: data.amount,
    giverName: data.giver_name,
    giverEmail: data.giver_email,
    giverNote: pledge.giverNote,
    giverRelation: pledge.giverRelation,
    pledgedAt: data.created_at
  };

  // Notify Master Admins
  try {
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: ['oreokunade@gmail.com', 'saoluwadara@gmail.com'],
        subject: `New Gift Received: ${result.itemName}`,
        html: `
          <h2>New Gift Pledge!</h2>
          <p><strong>Item:</strong> ${result.itemName}</p>
          <p><strong>Amount:</strong> ₦${result.amount.toLocaleString()}</p>
          <p><strong>From:</strong> ${result.giverName} (${result.giverEmail})</p>
          <p><strong>Note:</strong> ${result.giverNote || 'None'}</p>
        `
      })
    }).catch(console.error);
  } catch (err) {
    console.error('Failed to queue admin notification:', err);
  }

  return result;
}

export async function deleteGiftPledge(id: string): Promise<void> {
  await adminDb('deleteGiftPledge', { id });
}

export async function exportGiftPledgesCsv(): Promise<void> {
  // Use admin version so the export includes emails and notes (admin-only action)
  const pledges = await getStoredGiftPledgesAdmin();
  if (pledges.length === 0) {
    console.warn('No item gift payments recorded yet.');
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
  link.setAttribute('download', `Ore_Dara_Wedding_GiftPledges_${new Date().toISOString().split('T')[0]}.csv`);
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
  remindDate: string; // ISO date string (5 days after reservation)
  expiresAt: string; // ISO date string (7 days after reservation)
  createdAt: string;
}

export async function getStoredReminders(): Promise<GiftReminder[]> {
  const { data, error } = await supabase
    .from('gift_reminders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reminders:', error);
    return [];
  }

  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  // Sync with localStorage for any fallback names
  let localFallback: any[] = [];
  try {
    const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (raw) localFallback = JSON.parse(raw);
  } catch(e) {}

  return (data || []).map(row => {
    const createdTime = new Date(row.created_at).getTime();
    const expiresAt = new Date(createdTime + ONE_WEEK_MS).toISOString();
    
    // Look for fallback name/anonymity in local storage just in case DB doesn't have it
    const localMatch = localFallback.find((l: any) => l.itemId === row.item_id);

    return {
      id: row.id,
      itemId: row.item_id,
      itemName: row.item_name,
      itemPrice: '',
      email: row.email,
      reservedByName: row.reserved_by_name || (localMatch ? localMatch.reservedByName : undefined),
      relation: row.relation || (localMatch ? localMatch.relation : undefined),
      isAnonymous: row.is_anonymous !== undefined ? row.is_anonymous : (localMatch ? localMatch.isAnonymous : false),
      remindDate: row.remind_date,
      expiresAt: expiresAt,
      createdAt: row.created_at
    };
  });
}

export async function getActiveReservations(): Promise<GiftReminder[]> {
  // Query ONLY non-sensitive columns from Supabase so emails are never transferred over the wire to public visitors
  const { data, error } = await supabase
    .from('gift_reminders')
    .select('id, item_id, item_name, is_anonymous, reserved_by_name, remind_date, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching public reservations:', error);
    return [];
  }

  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  return (data || [])
    .filter(row => {
      const createdTime = new Date(row.created_at).getTime();
      return (createdTime + ONE_WEEK_MS) > now;
    })
    .map(row => {
      const createdTime = new Date(row.created_at).getTime();
      const expiresAt = new Date(createdTime + ONE_WEEK_MS).toISOString();
      return {
        id: row.id,
        itemId: row.item_id,
        itemName: row.item_name,
        itemPrice: '',
        email: '', // Never queried or exposed to the public page
        reservedByName: row.is_anonymous ? undefined : (row.reserved_by_name || undefined),
        isAnonymous: !!row.is_anonymous,
        remindDate: row.remind_date,
        expiresAt: expiresAt,
        createdAt: row.created_at
      };
    });
}

export async function saveReminder(reminder: {
  itemId: string;
  itemName: string;
  itemPrice?: string;
  email: string;
  guestName: string;
  relation?: string;
  isAnonymous?: boolean;
}): Promise<GiftReminder> {
  const now = new Date();
  // Reminder is scheduled 5 days from now (2 days before the 7-day expiration)
  const remindDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  // Reservation expires 7 days (1 week) from now
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  let insertedData: any = null;

  // Try to insert with reserved_by_name, relation, and is_anonymous column
  const initialPayload: any = {
    item_id: reminder.itemId,
    item_name: reminder.itemName,
    email: reminder.email,
    remind_date: remindDate,
    reserved_by_name: reminder.guestName,
    is_anonymous: !!reminder.isAnonymous
  };
  if (reminder.relation) {
    initialPayload.relation = reminder.relation;
  }

  const { data, error } = await supabase
    .from('gift_reminders')
    .insert([initialPayload])
    .select()
    .single();

  if (error) {
    // If it's a column missing error, retry with fallbacks
    console.warn('Supabase missing relation, is_anonymous or reserved_by_name column. Using fallback...', error);
    const retryPayload: any = {
      item_id: reminder.itemId,
      item_name: reminder.itemName,
      email: reminder.email,
      remind_date: remindDate
    };
    if (!error.message?.includes('reserved_by_name')) {
      retryPayload.reserved_by_name = reminder.guestName;
    }
    if (!error.message?.includes('is_anonymous')) {
      retryPayload.is_anonymous = !!reminder.isAnonymous;
    }

    const retry = await supabase
      .from('gift_reminders')
      .insert([retryPayload])
      .select()
      .single();
    
    if (retry.error) {
      throw retry.error;
    }
    insertedData = retry.data;
  } else {
    insertedData = data;
  }

  // Also keep it locally so the reserved status updates instantly on this device
  try {
    const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
    const local = raw ? JSON.parse(raw) : [];
    local.push({
      itemId: reminder.itemId,
      expiresAt: expiresAt,
      reservedByName: reminder.guestName,
      relation: reminder.relation,
      isAnonymous: !!reminder.isAnonymous
    });
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(local));
  } catch(e) {}

  const result = {
    id: insertedData.id,
    itemId: insertedData.item_id,
    itemName: insertedData.item_name,
    itemPrice: reminder.itemPrice || '',
    email: insertedData.email,
    reservedByName: insertedData.reserved_by_name || reminder.guestName,
    relation: insertedData.relation || reminder.relation,
    isAnonymous: insertedData.is_anonymous !== undefined ? insertedData.is_anonymous : !!reminder.isAnonymous,
    remindDate: insertedData.remind_date,
    expiresAt: expiresAt,
    createdAt: insertedData.created_at
  };

  // Notify Master Admins
  try {
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: ['oreokunade@gmail.com', 'saoluwadara@gmail.com'],
        subject: `New Gift Reservation: ${result.itemName}`,
        html: `
          <h2>New Gift Reservation!</h2>
          <p><strong>Item:</strong> ${result.itemName}</p>
          <p><strong>Reserved By:</strong> ${result.isAnonymous ? 'Anonymous' : result.reservedByName} (${result.email})</p>
          <p><strong>Expires At:</strong> ${new Date(result.expiresAt).toLocaleString()}</p>
        `
      })
    }).catch(console.error);
  } catch (err) {
    console.error('Failed to queue admin notification:', err);
  }

  return result;
}

export function getLocalReminders(): string[] {
  // Returns list of itemIds reminded locally to update UI sync
  try {
    const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return arr.map((r: any) => r.itemId);
  } catch (e) {
    return [];
  }
}

export async function deleteReservation(id: string, itemId?: string): Promise<void> {
  const { error } = await supabase
    .from('gift_reminders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting/releasing reservation:', error);
    throw error;
  }

  // Verify the row is actually gone (Supabase RLS can silently block deletes)
  const { data: checkData } = await supabase
    .from('gift_reminders')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (checkData) {
    console.error('Reservation still exists after delete — RLS may be blocking. Row id:', id);
    throw new Error('Delete was blocked by database permissions. Please check your Supabase RLS policies.');
  }

  // Clear matching items from localStorage
  try {
    const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      const filtered = itemId ? arr.filter((r: any) => r.itemId !== itemId) : arr;
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch(e) {}
}

// --- Wishlist Items ---

export async function getStoredWishlistItems(): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching wishlist items:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    price: row.price,
    formattedPrice: row.formatted_price,
    category: row.category,
    image: row.image,
    description: row.description
  }));
}

export async function saveWishlistItem(item: Omit<WishlistItem, 'id' | 'isFunded' | 'fundedBy' | 'isReserved' | 'reservedUntil' | 'reservedByEmail' | 'reservedByName'>): Promise<WishlistItem> {
  const payload = {
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    formatted_price: item.formattedPrice,
    category: item.category,
    image: item.image,
    description: item.description
  };
  const data = await adminDb('saveWishlistItem', { item: payload });
  return {
    id: data.id,
    name: data.name,
    quantity: data.quantity,
    price: data.price,
    formattedPrice: data.formatted_price,
    category: data.category,
    image: data.image,
    description: data.description
  };
}

export async function deleteWishlistItem(id: string): Promise<void> {
  await adminDb('deleteWishlistItem', { id });
}

export async function updateWishlistItem(item: Omit<WishlistItem, 'isFunded' | 'fundedBy' | 'isReserved' | 'reservedUntil' | 'reservedByEmail' | 'reservedByName'>): Promise<WishlistItem> {
  const payload = {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    formatted_price: item.formattedPrice,
    category: item.category,
    image: item.image,
    description: item.description
  };
  const data = await adminDb('saveWishlistItem', { item: payload });
  return {
    id: data.id,
    name: data.name,
    quantity: data.quantity,
    price: data.price,
    formattedPrice: data.formatted_price,
    category: data.category,
    image: data.image,
    description: data.description
  };
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

export async function generateInviteCode(createdBy: string = 'ore'): Promise<string> {
  const existingCodes: InviteCode[] = await adminDb('getInviteCodes');
  const existingSet = new Set(existingCodes.map(c => c.code));
  
  let code = '';
  while (true) {
    code = Math.floor(10000 + Math.random() * 90000).toString();
    if (!existingSet.has(code)) break;
  }
  
  await adminDb('generateInviteCode', { code: { code, created_by: createdBy } });
  return code;
}

export async function bulkGenerateInviteCodes(count: number, createdBy: string = 'ore'): Promise<string[]> {
  const existingCodes: InviteCode[] = await adminDb('getInviteCodes');
  const existingSet = new Set(existingCodes.map(c => c.code));
  
  const codes = [];
  const payload = [];
  
  for (let i = 0; i < count; i++) {
    let code = '';
    while (true) {
      code = Math.floor(10000 + Math.random() * 90000).toString();
      if (!existingSet.has(code)) {
        existingSet.add(code);
        break;
      }
    }
    codes.push(code);
    payload.push({ code, created_by: createdBy });
  }
  
  await adminDb('bulkGenerateInviteCodes', { codes: payload });
  return codes;
}

export async function deleteInviteCodes(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await adminDb('deleteInviteCodes', { ids });
}

export async function markInviteCodeAsShared(id: string): Promise<void> {
  await adminDb('markInviteCodeAsShared', { id });
}

export async function unmarkInviteCodeAsShared(id: string): Promise<void> {
  await adminDb('unmarkInviteCodeAsShared', { id });
}

export async function getInviteCodes(filterByRole?: string): Promise<InviteCode[]> {
  try {
    let data = await adminDb('getInviteCodes');
    if (filterByRole && !['ore', 'dara'].includes(filterByRole)) {
      data = data.filter((c: any) => c.created_by === filterByRole);
    }
    return data as InviteCode[];
  } catch (err) {
    console.warn('adminDb getInviteCodes failed, trying direct Supabase fallback:', err);
    try {
      let { data, error: sbError } = await supabase.from('invite_codes').select('*').order('created_at', { ascending: false });
      if (sbError) throw sbError;
      if (filterByRole && !['ore', 'dara'].includes(filterByRole)) {
        data = (data || []).filter((c: any) => c.created_by === filterByRole);
      }
      return (data || []) as InviteCode[];
    } catch (fallbackErr) {
      console.error('Error fetching invite codes:', fallbackErr);
      return [];
    }
  }
}

export async function verifyInviteCode(code: string): Promise<InviteCode | null> {
  const { data, error } = await supabase.rpc('verify_invite_code', { p_code: code });
  if (error || !data || data.length === 0) {
    return null;
  }
  return data[0] as InviteCode;
}

export async function markCodeAsUsed(code: string, usedBy: string): Promise<void> {
  const { error } = await supabase
    .from('invite_codes')
    .update({ is_used: true, used_by: usedBy })
    .eq('code', code);
    
  if (error) console.error('Error marking code used:', error);
}

export async function exportInviteCodesCsv(filterByRole?: string): Promise<void> {
  const codes = await getInviteCodes(filterByRole);
  if (codes.length === 0) {
    alert('No invite codes to export.');
    return;
  }

  const headers = ['Code', 'Status', 'Used By', 'Created At'];
  const rows = codes.map(c => [
    c.code,
    c.is_used ? 'Used' : 'Available',
    sanitizeCsvCell(c.used_by || ''),
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
  link.setAttribute('download', `invite_codes_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
