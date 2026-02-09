/**
 * Migration: Add publicId (uuid) to existing User and BlogPost documents.
 * Run: tsx scripts/migrate-public-ids.ts
 */
import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../src/modules/auth/auth.model';
import { BlogPost } from '../src/modules/posts/post.model';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  let usersUpdated = 0;
  let postsUpdated = 0;

  // Migrate Users missing publicId
  const usersWithoutPublicId = await User.find({
    $or: [{ publicId: { $exists: false } }, { publicId: null }, { publicId: '' }],
  }).lean();
  for (const u of usersWithoutPublicId) {
    const id = (u as { _id: mongoose.Types.ObjectId })._id;
    await User.updateOne({ _id: id }, { $set: { publicId: randomUUID() } });
    usersUpdated++;
  }
  console.log(`Users updated: ${usersUpdated}`);

  // Migrate BlogPosts missing publicId
  const postsWithoutPublicId = await BlogPost.find({
    $or: [{ publicId: { $exists: false } }, { publicId: null }, { publicId: '' }],
  }).lean();
  for (const p of postsWithoutPublicId) {
    const id = (p as { _id: mongoose.Types.ObjectId })._id;
    await BlogPost.updateOne({ _id: id }, { $set: { publicId: randomUUID() } });
    postsUpdated++;
  }
  console.log(`BlogPosts updated: ${postsUpdated}`);

  await mongoose.disconnect();
  console.log('Migration complete');
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
