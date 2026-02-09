/**
 * Inspect User collection for 409 registration conflicts
 * 
 * Usage: npx ts-node scripts/inspect-users.ts
 * Or: npm run inspect-users (if script added to package.json)
 * 
 * Checks for:
 * - Duplicate emails (violates unique index)
 * - Partial records (local provider but missing passwordHash)
 * - OAuth users blocking local registration
 * - Case inconsistency in stored emails
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finstep';

async function inspectUsers() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No database');

  const users = db.collection('users');

  console.log('\n=== User Collection Inspection ===\n');

  const all = await users.find({}).toArray();
  console.log(`Total users: ${all.length}\n`);

  // Group by email (lowercase) to find potential duplicates
  const byEmail = new Map<string, typeof all>();
  for (const u of all) {
    const email = (u.email || '').toLowerCase();
    if (!byEmail.has(email)) byEmail.set(email, []);
    byEmail.get(email)!.push(u);
  }

  const duplicates = [...byEmail.entries()].filter(([, docs]) => docs.length > 1);
  if (duplicates.length > 0) {
    console.log('⚠️  DUPLICATE EMAILS (would cause E11000):');
    for (const [email, docs] of duplicates) {
      console.log(`  - ${email}: ${docs.length} records`);
      docs.forEach((d, i) =>
        console.log(`    [${i}] _id: ${d._id}, provider: ${d.provider}, hasPassword: ${!!(d.passwordHash || d.password)}`)
      );
    }
    console.log('');
  }

  // Partial records: local provider but missing passwordHash
  const partial = all.filter(
    (u) => u.provider === 'local' && !u.passwordHash && !u.password
  );
  if (partial.length > 0) {
    console.log('⚠️  PARTIAL RECORDS (local, no password - would block registration):');
    partial.forEach((u) =>
      console.log(`  - ${u.email} (_id: ${u._id}, createdAt: ${u.createdAt})`)
    );
    console.log('');
  }

  // OAuth users (for context)
  const oauth = all.filter((u) => u.provider === 'google');
  if (oauth.length > 0) {
    console.log(`ℹ️  OAuth users: ${oauth.length}`);
    oauth.slice(0, 5).forEach((u) => console.log(`  - ${u.email}`));
    if (oauth.length > 5) console.log(`  ... and ${oauth.length - 5} more`);
    console.log('');
  }

  // Case inconsistency
  const inconsistent = all.filter((u) => {
    const stored = u.email || '';
    return stored !== stored.toLowerCase();
  });
  if (inconsistent.length > 0) {
    console.log('⚠️  NON-LOWERCASE EMAILS (may cause false conflicts):');
    inconsistent.forEach((u) => console.log(`  - "${u.email}"`));
    console.log('');
  }

  if (
    duplicates.length === 0 &&
    partial.length === 0 &&
    inconsistent.length === 0
  ) {
    console.log('✅ No obvious issues found.\n');
  }

  await mongoose.disconnect();
}

inspectUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
