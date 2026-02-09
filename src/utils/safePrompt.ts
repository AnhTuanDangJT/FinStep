/**
 * Prompt safety: length limits and system prompts for AI actions.
 * Validates input length to avoid quota abuse and API errors.
 */

export const MAX_INPUT_LENGTH = 8000;
export const MAX_POST_CONTENT_LENGTH = 50000;

export type AiAction =
  | 'chat'
  | 'grammar_fix'
  | 'rewrite_luxury'
  | 'rewrite_simple'
  | 'summarize'
  | 'reflection'
  | 'paragraph_analyze';

/**
 * Validate that text is non-empty and within maxLength (chars).
 * Returns { ok: true } or { ok: false, reason: string }.
 */
export function passesInputGuardrails(
  text: string,
  maxLength: number
): { ok: true } | { ok: false; reason: string } {
  if (text == null || typeof text !== 'string') {
    return { ok: false, reason: 'Input must be a string' };
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, reason: 'Input cannot be empty' };
  }
  if (trimmed.length > maxLength) {
    return { ok: false, reason: `Input exceeds maximum length of ${maxLength} characters` };
  }
  return { ok: true };
}

/**
 * Return system prompt for the given AI action.
 */
export function getSystemPromptForAction(action: AiAction): string {
  const prompts: Record<AiAction, string> = {
    chat: 'You are a helpful finance and blogging assistant. Answer concisely and professionally.',
    grammar_fix: 'You are a copy editor. Fix grammar and spelling. Return only the corrected text unless asked for details.',
    rewrite_luxury: 'Rewrite the given text in a polished, premium tone. Keep the same meaning and length roughly similar.',
    rewrite_simple: 'Rewrite the given text in simple, clear language. Keep the same meaning.',
    summarize: 'Summarize the given blog post in bullet points and one short takeaway.',
    reflection: 'Based on the blog content, suggest reflection questions and one suggested next step for the reader.',
    paragraph_analyze: 'Analyze each paragraph: suggest a short title (or null) and whether it should be paragraph or bullet format.',
  };
  return prompts[action] ?? 'You are a helpful assistant.';
}
