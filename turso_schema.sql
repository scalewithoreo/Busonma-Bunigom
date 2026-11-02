-- ============================================================
-- TURSO SQLITE SCHEMA FOR WEDDING PLATFORM
-- Run this on any new Turso database:
-- turso db shell <database-name> < turso_schema.sql
-- ============================================================

-- 1. RSVPs Table
CREATE TABLE IF NOT EXISTS rsvps (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  attendance TEXT NOT NULL CHECK(attendance IN ('yes', 'no')),
  relation TEXT,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for sorting and email lookups
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rsvps_email ON rsvps(email);

-- 2. Wishlist Items Table
CREATE TABLE IF NOT EXISTS wishlist (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price REAL NOT NULL DEFAULT 0,
  formatted_price TEXT,
  category TEXT NOT NULL,
  image TEXT,
  description TEXT,
  is_funded INTEGER NOT NULL DEFAULT 0,
  funded_by TEXT,
  is_reserved INTEGER NOT NULL DEFAULT 0,
  reserved_until TEXT,
  reserved_by_email TEXT,
  reserved_by_name TEXT,
  is_anonymous_reservation INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wishlist_category ON wishlist(category);

-- 3. Item Reservations (Holds) Table
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_price TEXT,
  email TEXT NOT NULL,
  reserved_by_name TEXT,
  relation TEXT,
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  remind_date TEXT,
  expires_at TEXT,
  is_fulfilled INTEGER NOT NULL DEFAULT 0,
  fulfilled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (item_id) REFERENCES wishlist(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reservations_item_id ON reservations(item_id);
CREATE INDEX IF NOT EXISTS idx_reservations_email ON reservations(email);

-- 4. Gift Payments / Pledges Table
CREATE TABLE IF NOT EXISTS gift_pledges (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  giver_name TEXT NOT NULL,
  giver_email TEXT,
  giver_note TEXT,
  giver_relation TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (item_id) REFERENCES wishlist(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gift_pledges_created_at ON gift_pledges(created_at DESC);

-- 5. Invite / Access Codes Table
CREATE TABLE IF NOT EXISTS invite_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  guest_name TEXT NOT NULL,
  category TEXT,
  max_guests INTEGER NOT NULL DEFAULT 1,
  is_used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
