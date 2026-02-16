/**
 * Normalize content before saving to DB.
 * Ensures consistent line endings and spacing across blog posts.
 */
export function normalizeContent(content: string): string {
  if (!content || typeof content !== 'string') return '';
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
