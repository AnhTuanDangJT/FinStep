/**
 * Migration: Copy coverImageUrl → images[0] for existing blog posts.
 * Safe to run multiple times (idempotent: only updates docs with coverImageUrl and no images).
 *
 * Usage: npx tsx scripts/migrate-blog-images.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { BlogPost } from '../src/modules/posts/post.model';

dotenv.config({ path: resolve(process.cwd(), '.env') });

async function run(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI required');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const cursor = BlogPost.find({
    coverImageUrl: { $exists: true, $nin: [null, ''] },
  }).cursor();

  let updated = 0;
  for await (const doc of cursor) {
    const cover = (doc as any).coverImageUrl;
    if (!cover || typeof cover !== 'string' || !cover.trim()) continue;
    const existing = (doc as any).images;
    if (Array.isArray(existing) && existing.length > 0) continue; // already migrated
    await BlogPost.updateOne(
      { _id: doc._id },
      {
        $set: {
          images: [
            {
              _id: new mongoose.Types.ObjectId(),
              url: cover.trim(),
              order: 0,
              alt: undefined,
            },
          ],
        },
      }
    );
    updated++;
    console.log('Updated post', doc._id, '→ images[0] =', cover.slice(0, 50) + '...');
  }

  console.log('Done. Updated', updated, 'posts.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
