/**
 * Database index audit for production readiness.
 * Run: npm run audit-indexes
 * Verifies BlogPost collection has required indexes: status, createdAt, author.email
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI || !MONGODB_URI.trim()) {
  console.error('Set MONGODB_URI in .env');
  process.exit(1);
}

async function auditIndexes(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) {
    console.error('No database connection');
    process.exit(1);
  }
  const collections = await db.listCollections().toArray();
  const blogCollections = collections.filter((c) =>
    /blogpost|posts?/i.test(c.name)
  );
  const collectionName = blogCollections[0]?.name ?? 'blogposts';
  const col = db.collection(collectionName);
  const indexes = await col.indexes();
  console.log(`\n📊 Indexes for ${collectionName}:\n`);
  indexes.forEach((idx) => {
    console.log(`  ${idx.name}:`, JSON.stringify(idx.key));
  });
  const keys = indexes.flatMap((i) => Object.keys(i.key));
  const required = ['status', 'createdAt'];
  const authorEmailIndex = indexes.some((i) => 'author.email' in i.key);
  const missing = required.filter((k) => !keys.includes(k));
  if (missing.length > 0) {
    console.warn(`\n⚠️  Missing indexes: ${missing.join(', ')}`);
  }
  if (!authorEmailIndex) {
    console.warn('\n⚠️  Consider adding index on author.email for admin queries');
  }
  if (missing.length === 0 && authorEmailIndex) {
    console.log('\n✅ Required indexes present');
  }
  await mongoose.disconnect();
}

auditIndexes().catch((err) => {
  console.error(err);
  process.exit(1);
});
