/**
 * Slugify a string for URLs (lowercase, hyphens, alphanumeric).
 * For post slugs with uniqueness, use post.service generateSlug.
 */
export function slugify(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
