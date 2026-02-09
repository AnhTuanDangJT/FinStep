/**
 * Clear all users from the database (for testing)
 *
 * Usage: npm run clear-users
 *
 * WARNING: This permanently deletes ALL user records.
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finstep';

async function clearUsers() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No database');

  const users = db.collection('users');
  const count = await users.countDocuments();
  const result = await users.deleteMany({});

  console.log(`\n✅ Removed ${result.deletedCount} user(s) from the database.\n`);
  await mongoose.disconnect();
}

clearUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
