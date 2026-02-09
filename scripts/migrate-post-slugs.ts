/**
 * Migration: Ensure every blog post has a unique slug (for URL-friendly and slug-based lookup).
 * Run once after adding slug support. Safe to run multiple times (idempotent for posts that already have a slug).
 *
 * Usage: npx tsx scripts/migrate-post-slugs.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

function slugFromTitle(title: string): string {
  if (!title || typeof title !== 'string') return 'post';
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'post';
}

async function findUniqueSlug(
  collection: mongoose.mongo.Collection,
  baseSlug: string,
  excludeId: mongoose.Types.ObjectId | null
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  for (;;) {
    const filter: Record<string, unknown> = { slug };
    if (excludeId) filter._id = { $ne: excludeId };
    const existing = await collection.findOne(filter);
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI required');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No db');

  const collection = db.collection('blogposts');
  const cursor = collection.find({});
  let updated = 0;
  let skipped = 0;

  for await (const doc of cursor) {
    const currentSlug = doc.slug;
    const title = doc.title;
    if (currentSlug && typeof currentSlug === 'string' && currentSlug.trim().length > 0) {
      skipped++;
      continue;
    }

    const baseSlug = slugFromTitle(title || 'Untitled');
    const slug = await findUniqueSlug(collection, baseSlug, doc._id);

    await collection.updateOne(
      { _id: doc._id },
      { $set: { slug } }
    );
    updated++;
    console.log(`  ${doc._id} -> slug: ${slug}`);
  }

  console.log(`Slug migration done. Updated: ${updated}, Skipped (already had slug): ${skipped}`);
  await mongoose.disconnect();
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
