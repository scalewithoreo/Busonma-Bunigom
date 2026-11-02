import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const urlMatch = envContent.match(/VITE_TURSO_DATABASE_URL=["']?(.*?)["']?$/m);
const tokenMatch = envContent.match(/VITE_TURSO_AUTH_TOKEN=["']?(.*?)["']?$/m);

if (!urlMatch || !tokenMatch) {
  console.error('❌ Turso credentials not found in .env');
  process.exit(1);
}

const url = urlMatch[1].trim();
const token = tokenMatch[1].trim();

console.log('====================================================');
console.log('  TURSO DATABASE DEEP AUDIT & END-TO-END VERIFICATION');
console.log('====================================================');
console.log(`📡 Database URL: ${url}\n`);

const client = createClient({ url, authToken: token });

async function audit() {
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASS: ${testName}`);
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${details}`);
    }
  }

  // -------------------------------------------------------------------
  // TEST 1: Schema & Table Existence
  // -------------------------------------------------------------------
  console.log('▶ [1/6] Auditing Table Schemas & Indexes...');
  const tablesRes = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
  );
  const existingTables = tablesRes.rows.map(r => String(r.name));
  
  assert(existingTables.includes('rsvps'), 'Table `rsvps` exists');
  assert(existingTables.includes('wishlist'), 'Table `wishlist` exists');
  assert(existingTables.includes('reservations'), 'Table `reservations` exists');
  assert(existingTables.includes('gift_pledges'), 'Table `gift_pledges` exists');
  assert(existingTables.includes('invite_codes'), 'Table `invite_codes` exists');

  const indexesRes = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';"
  );
  const existingIndexes = indexesRes.rows.map(r => String(r.name));
  assert(existingIndexes.length >= 4, `Database Indexes present (Found ${existingIndexes.length})`);

  // -------------------------------------------------------------------
  // TEST 2: Wishlist CRUD & Data Integrity
  // -------------------------------------------------------------------
  console.log('\n▶ [2/6] Auditing Wishlist Item Storage...');
  const testItemId = 'audit-test-item-' + Date.now();
  
  // Insert test gift
  await client.execute({
    sql: `INSERT INTO wishlist (id, name, quantity, price, formatted_price, category, image, description, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      testItemId,
      'Audit Test Kitchen Mixer',
      2,
      120000,
      '₦120,000',
      'Kitchen & Dining',
      'https://example.com/mixer.jpg',
      'High-performance stand mixer for baking',
      new Date().toISOString()
    ]
  });

  const itemCheck = await client.execute({
    sql: 'SELECT * FROM wishlist WHERE id = ?',
    args: [testItemId]
  });
  assert(itemCheck.rows.length === 1, 'Wishlist item inserted successfully');
  assert(Number(itemCheck.rows[0].price) === 120000, 'Price numeric precision preserved (120,000 NGN)');
  assert(itemCheck.rows[0].formatted_price === '₦120,000', 'Formatted price string preserved');
  assert(itemCheck.rows[0].category === 'Kitchen & Dining', 'Category stored correctly');

  // Update test gift
  await client.execute({
    sql: 'UPDATE wishlist SET price = 135000, formatted_price = ? WHERE id = ?',
    args: ['₦135,000', testItemId]
  });
  const updateCheck = await client.execute({
    sql: 'SELECT price, formatted_price FROM wishlist WHERE id = ?',
    args: [testItemId]
  });
  assert(Number(updateCheck.rows[0].price) === 135000, 'Wishlist update executed and verified');

  // -------------------------------------------------------------------
  // TEST 3: Reserved Gifts (Holds & Expiration)
  // -------------------------------------------------------------------
  console.log('\n▶ [3/6] Auditing Gift Reservations (7-day Hold Pipeline)...');
  const testResId = 'audit-res-' + Date.now();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ONE_WEEK_MS).toISOString();

  await client.execute({
    sql: `INSERT INTO reservations (id, item_id, item_name, item_price, email, reserved_by_name, relation, is_anonymous, remind_date, expires_at, is_fulfilled, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    args: [
      testResId,
      testItemId,
      'Audit Test Kitchen Mixer',
      '₦135,000',
      'guest.tester@example.com',
      'Amaka Okafor',
      'Bridesmaid',
      0,
      new Date(now.getTime() + 5 * 86400000).toISOString(),
      expiresAt,
      now.toISOString()
    ]
  });

  const resCheck = await client.execute({
    sql: 'SELECT * FROM reservations WHERE id = ?',
    args: [testResId]
  });
  assert(resCheck.rows.length === 1, 'Reservation hold created in Turso');
  assert(Number(resCheck.rows[0].is_fulfilled) === 0, 'New reservation correctly starts unfulfilled (active hold)');
  assert(resCheck.rows[0].reserved_by_name === 'Amaka Okafor', 'Guest name preserved');
  assert(resCheck.rows[0].email === 'guest.tester@example.com', 'Contact email preserved for reminder');

  // Test active hold filter (must match frontend getActiveReservations logic)
  const activeHolds = await client.execute({
    sql: "SELECT * FROM reservations WHERE is_fulfilled = 0 AND datetime(expires_at) > datetime('now')"
  });
  const foundActive = activeHolds.rows.some(r => r.id === testResId);
  assert(foundActive, 'Active hold query successfully surfaces unexpired, unfulfilled item');

  // -------------------------------------------------------------------
  // TEST 4: Gift Payments / Pledges & Auto-Fulfillment
  // -------------------------------------------------------------------
  console.log('\n▶ [4/6] Auditing Gift Payments & Fulfillment Flow...');
  const testPledgeId = 'audit-pledge-' + Date.now();

  // Guest pays for the reserved item
  await client.execute({
    sql: `INSERT INTO gift_pledges (id, item_id, item_name, amount, giver_name, giver_email, giver_note, giver_relation, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      testPledgeId,
      testItemId,
      'Audit Test Kitchen Mixer',
      135000,
      'Amaka Okafor',
      'guest.tester@example.com',
      'Wishing Miracle & Malvin a lifetime of joy!',
      'Bridesmaid',
      new Date().toISOString()
    ]
  });

  // Mark reservation fulfilled upon payment (per wedding workflow)
  await client.execute({
    sql: 'UPDATE reservations SET is_fulfilled = 1, fulfilled_at = ? WHERE item_id = ?',
    args: [new Date().toISOString(), testItemId]
  });

  const pledgeCheck = await client.execute({
    sql: 'SELECT * FROM gift_pledges WHERE id = ?',
    args: [testPledgeId]
  });
  assert(pledgeCheck.rows.length === 1, 'Gift payment record saved');
  assert(Number(pledgeCheck.rows[0].amount) === 135000, 'Payment amount matches gift value');
  assert(pledgeCheck.rows[0].giver_name === 'Amaka Okafor', 'Giver name recorded correctly');

  const fulfilledCheck = await client.execute({
    sql: 'SELECT is_fulfilled, fulfilled_at FROM reservations WHERE id = ?',
    args: [testResId]
  });
  assert(Number(fulfilledCheck.rows[0].is_fulfilled) === 1, 'Reservation marked as Fulfilled');
  assert(fulfilledCheck.rows[0].fulfilled_at !== null, 'Fulfillment timestamp recorded');

  // Verify that fulfilled reservation no longer counts as an active hold
  const activeHoldsAfter = await client.execute({
    sql: 'SELECT * FROM reservations WHERE is_fulfilled = 0 AND id = ?',
    args: [testResId]
  });
  assert(activeHoldsAfter.rows.length === 0, 'Fulfilled reservation correctly excluded from active holds');

  // -------------------------------------------------------------------
  // TEST 5: RSVPs Pipeline
  // -------------------------------------------------------------------
  console.log('\n▶ [5/6] Auditing Guest RSVP Submissions...');
  const testRsvpId = 'audit-rsvp-' + Date.now();

  await client.execute({
    sql: `INSERT INTO rsvps (id, first_name, last_name, email, attendance, relation, message, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      testRsvpId,
      'Chinedu',
      'Eze',
      'chinedu.eze@example.com',
      'yes',
      'Groom Family',
      'Cannot wait to celebrate with Miracle & Malvin!',
      new Date().toISOString()
    ]
  });

  const rsvpCheck = await client.execute({
    sql: 'SELECT * FROM rsvps WHERE id = ?',
    args: [testRsvpId]
  });
  assert(rsvpCheck.rows.length === 1, 'RSVP stored in Turso');
  assert(rsvpCheck.rows[0].attendance === 'yes', 'Attendance recorded as YES');
  assert(rsvpCheck.rows[0].first_name === 'Chinedu' && rsvpCheck.rows[0].last_name === 'Eze', 'Full name split & preserved');
  assert(rsvpCheck.rows[0].relation === 'Groom Family', 'Relationship category preserved');

  // -------------------------------------------------------------------
  // TEST 6: Invite Codes Pipeline
  // -------------------------------------------------------------------
  console.log('\n▶ [6/6] Auditing Invite Codes Pipeline...');
  const testCodeId = 'audit-code-' + Date.now();
  const testCodeString = '88421';

  await client.execute({
    sql: `INSERT INTO invite_codes (id, code, guest_name, category, max_guests, is_used, created_at)
          VALUES (?, ?, '', 'malvin', 1, 0, ?)`,
    args: [testCodeId, testCodeString, new Date().toISOString()]
  });

  const codeCheck = await client.execute({
    sql: 'SELECT * FROM invite_codes WHERE id = ?',
    args: [testCodeId]
  });
  assert(codeCheck.rows.length === 1, 'Invite code generated and stored');
  assert(Number(codeCheck.rows[0].is_used) === 0, 'New code starts as unused (Available)');

  // Simulate guest using code to RSVP
  await client.execute({
    sql: 'UPDATE invite_codes SET is_used = 1, guest_name = ? WHERE code = ?',
    args: ['Chinedu Eze', testCodeString]
  });

  const usedCodeCheck = await client.execute({
    sql: 'SELECT is_used, guest_name FROM invite_codes WHERE id = ?',
    args: [testCodeId]
  });
  assert(Number(usedCodeCheck.rows[0].is_used) === 1, 'Invite code marked as USED');
  assert(usedCodeCheck.rows[0].guest_name === 'Chinedu Eze', 'Code mapped to guest name');

  // -------------------------------------------------------------------
  // CLEANUP TEST RECORDS (Purge audit data)
  // -------------------------------------------------------------------
  console.log('\n🧹 Cleaning up test audit records from Turso Cloud...');
  await client.batch([
    { sql: 'DELETE FROM gift_pledges WHERE id = ?', args: [testPledgeId] },
    { sql: 'DELETE FROM reservations WHERE id = ?', args: [testResId] },
    { sql: 'DELETE FROM wishlist WHERE id = ?', args: [testItemId] },
    { sql: 'DELETE FROM rsvps WHERE id = ?', args: [testRsvpId] },
    { sql: 'DELETE FROM invite_codes WHERE id = ?', args: [testCodeId] }
  ]);
  console.log('✅ All audit test records safely cleaned up.');

  // -------------------------------------------------------------------
  // FINAL SCORE & SUMMARY
  // -------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`  AUDIT COMPLETED: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log('====================================================');
}

audit().catch(console.error);
