/**
 * AI gateway configuration – GitHub Models only (GITHUB_TOKEN).
 * Token and model are read from env only on the server; never exposed to the client.
 */
import { env } from './env';

export const aiConfig = {
  /** GitHub Models API base URL (no trailing slash) */
  baseUrl: 'https://models.github.ai',
  /** Chat completions endpoint (relative) */
  chatCompletionsPath: '/inference/chat/completions',
  /** API version query param (required for some features) */
  apiVersion: '2022-11-28',
  /** Model ID: publisher/name e.g. openai/gpt-4.1 */
  model: env.AI_MODEL || 'openai/gpt-4.1',
  /** Bearer token – fine-grained PAT with "Models" read permission */
  token: env.GITHUB_TOKEN?.trim() || undefined,
  /** Request timeout in ms */
  timeoutMs: 30_000,
  /** Max retries on transient failures */
  maxRetries: 2,
  /** Max tokens per completion */
  maxTokens: 2048,
};

export function isAiConfigured(): boolean {
  return Boolean(aiConfig.token);
}
