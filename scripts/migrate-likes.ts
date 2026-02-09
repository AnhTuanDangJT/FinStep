/**
 * Migration: Backfill Like collection from BlogPost.likedBy
 * Run once after deploying the Like model.
 * Usage: npx tsx scripts/migrate-likes.ts
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

  const posts = db.collection('blogposts');
  const likes = db.collection('likes');

  const cursor = posts.find({ likedBy: { $exists: true, $ne: [] } });
  let migrated = 0;

  for await (const post of cursor) {
    const likedBy = post.likedBy || [];
    if (!Array.isArray(likedBy) || likedBy.length === 0) continue;

    for (const userId of likedBy) {
      if (!userId) continue;
      try {
        await likes.updateOne(
          { postId: post._id, userId: String(userId) },
          { $setOnInsert: { postId: post._id, userId: String(userId), createdAt: new Date() } },
          { upsert: true }
        );
        migrated++;
      } catch (e) {
        console.warn('Skip duplicate like', post._id, userId);
      }
    }
  }

  console.log(`Migrated ${migrated} likes`);
  await mongoose.disconnect();
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
