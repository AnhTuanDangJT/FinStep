/**
 * Migration: Add profile fields to existing users (backward compatible).
 * - Sets displayName = name where displayName is missing/empty
 * - Sets lastActiveAt = updatedAt (or createdAt) where missing
 * Run once after deploying the extended User schema.
 * Usage: npx tsx scripts/migrate-user-profile-fields.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI required');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No db');

  const users = db.collection('users');

  // Backfill displayName from name where displayName is missing or empty
  const displayNameResult = await users.updateMany(
    { $or: [{ displayName: { $exists: false } }, { displayName: '' }], name: { $exists: true } },
    [{ $set: { displayName: '$name' } }]
  );
  console.log('displayName backfill:', displayNameResult.modifiedCount, 'users');

  // Backfill lastActiveAt from updatedAt or createdAt where missing
  const lastActiveResult = await users.updateMany(
    { lastActiveAt: { $exists: false } },
    [{ $set: { lastActiveAt: { $ifNull: ['$updatedAt', '$createdAt'] } } }]
  );
  console.log('lastActiveAt backfill:', lastActiveResult.modifiedCount, 'users');

  console.log('Profile fields migration done.');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
