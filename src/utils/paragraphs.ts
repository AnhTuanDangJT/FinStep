/**
 * Paragraph parsing utilities for blog content.
 * Content is ALWAYS stored raw; parsing is for validation/metadata only.
 */

/** Split content by double newline, trim outer whitespace per paragraph, preserve order */
export function parseParagraphs(content: string): string[] {
  if (!content || typeof content !== 'string') return [];
  return content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Get paragraph count (for verification: paragraphMeta.paragraphs.length should match when AI has run) */
export function getParagraphCount(content: string): number {
  return parseParagraphs(content).length;
}
