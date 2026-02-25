/**
 * Normalize content before saving to DB.
 * Ensures consistent line endings. Preserves paragraph breaks (\n\n) — never sanitize away newlines.
 * Collapsing 3+ newlines to 2 keeps structure while preventing excessive whitespace.
 */
export function normalizeContent(content: string): string {
  if (!content || typeof content !== 'string') return '';
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Generate a summary that does not cut mid-sentence or mid-word.
 * Prefers ending at last period within maxLength.
 * If no period, breaks at last space to avoid mid-word cuts.
 * Fallback: truncate with "..." only if no space found.
 * Never returns empty for non-empty content; short content returned as-is.
 */
export function generateSummary(content: string, maxLength = 250): string {
  if (!content || typeof content !== 'string') return '';
  const trimmed = content.trim();
  if (!trimmed) return '';
  if (trimmed.length <= maxLength) return trimmed;

  const slice = trimmed.substring(0, maxLength);
  const lastPeriod = slice.lastIndexOf('.');

  if (lastPeriod > 100) {
    return slice.substring(0, lastPeriod + 1);
  }

  const lastSpace = slice.lastIndexOf(' ');
  // Always break at last space to avoid mid-word cuts (e.g. "cụ th" instead of "cụ thể")
  if (lastSpace >= 0) {
    return slice.substring(0, lastSpace) + '...';
  }

  return slice + '...';
}
