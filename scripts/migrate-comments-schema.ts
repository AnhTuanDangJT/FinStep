/**
 * Migration: Update existing comments to new schema (authorId, authorName)
 * Old schema: userId, authorName, authorEmail
 * New schema: authorId, authorName (authorId refs User)
 *
 * Run: npx ts-node scripts/migrate-comments-schema.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finstep-auth';

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No database');

  const coll = db.collection('comments');
  const cursor = coll.find({});
  let updated = 0;
  let skipped = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;

    const hasAuthorId = doc.authorId != null;
    const hasUserId = doc.userId != null && doc.userId !== 'guest';

    if (hasAuthorId) {
      skipped++;
      continue;
    }

    if (hasUserId && mongoose.Types.ObjectId.isValid(doc.userId)) {
      await coll.updateOne(
        { _id: doc._id },
        {
          $set: {
            authorId: new mongoose.Types.ObjectId(doc.userId),
            authorName: doc.authorName ?? doc.authorEmail?.split('@')[0] ?? 'Unknown',
          },
          $unset: { userId: '', authorEmail: '' },
        }
      );
      updated++;
    } else {
      await coll.updateOne(
        { _id: doc._id },
        {
          $set: { authorName: doc.authorName ?? 'Unknown' },
          $unset: { userId: '', authorEmail: '' },
        }
      );
      updated++;
    }
  }

  console.log(`Migrated ${updated} comments, skipped ${skipped} (already migrated)`);
  await mongoose.disconnect();
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
