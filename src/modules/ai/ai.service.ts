/**
 * AI gateway service – GitHub Models only (GITHUB_TOKEN).
 * Single entry for chatbot, writing assistant, summary, reflection.
 */
import { aiConfig, isAiConfigured } from '../../config/ai';
import {
  getSystemPromptForAction,
  passesInputGuardrails,
  MAX_INPUT_LENGTH,
  MAX_POST_CONTENT_LENGTH,
} from '../../utils/safePrompt';
import { logger } from '../../utils/logger';
import { normalizeContent } from '../../utils/content';

const GITHUB_API_VERSION = '2022-11-28';

export type AiAction =
  | 'chat'
  | 'grammar_fix'
  | 'rewrite_luxury'
  | 'rewrite_simple'
  | 'summarize'
  | 'reflection'
  | 'paragraph_analyze';

export interface GrammarFixInput {
  draftText: string;
}

export interface GrammarFixReplacement {
  wrong: string;
  replacement: string;
}

export interface GrammarFixResult {
  correctedText: string;
  replacements: GrammarFixReplacement[];
  detectedLanguage?: 'en' | 'vi';
  changes?: string[];
}

export interface RewriteInput {
  draftText: string;
  tone?: 'luxury' | 'friendly' | 'professional';
}

export interface RewriteResult {
  improvedText: string;
}

export interface ChatInput {
  userMessage: string;
  pageContext?: string;
}

export interface SummarizeInput {
  postContent: string;
}

export interface ReflectionInput {
  postContent: string;
  journeyStep?: string;
}

export interface ParagraphAnalyzeInput {
  content: string;
}

export interface AiContext {
  postTitle?: string;
  postContent?: string;
  userProfile?: Record<string, unknown>;
}

export interface ChatResult {
  assistantMessage: string;
}

export interface SummarizeResult {
  bulletSummary: string[];
  takeaway: string;
}

export interface ReflectionResult {
  reflectionQuestions: string[];
  suggestedNextStep: string;
}

export interface ParagraphAnalyzeResult {
  paragraphs: Array<{
    index: number;
    title: string | null;
    suggestedFormat: 'paragraph' | 'bullet';
  }>;
}

export type AiResult =
  | { action: 'chat'; result: ChatResult }
  | { action: 'grammar_fix'; result: GrammarFixResult }
  | { action: 'rewrite_luxury'; result: RewriteResult }
  | { action: 'rewrite_simple'; result: RewriteResult }
  | { action: 'summarize'; result: SummarizeResult }
  | { action: 'reflection'; result: ReflectionResult }
  | { action: 'paragraph_analyze'; result: ParagraphAnalyzeResult };

function buildMessages(
  action: AiAction,
  input: unknown,
  context?: AiContext
): { role: string; content: string }[] {
  const systemPrompt = getSystemPromptForAction(action);
  const messages: { role: string; content: string }[] = [{ role: 'system', content: systemPrompt }];
  let userContent = '';
  switch (action) {
    case 'chat': {
      const { userMessage, pageContext } = input as ChatInput;
      userContent = pageContext ? `Context: ${pageContext}\n\nQuestion: ${userMessage}` : userMessage;
      break;
    }
    case 'grammar_fix': {
      const { draftText } = input as GrammarFixInput;
      userContent = `Draft to check and fix (detect language—Vietnamese or English—then fix grammar/spelling and return the format requested in your instructions):\n\n${draftText}`;
      break;
    }
    case 'rewrite_luxury':
    case 'rewrite_simple': {
      const { draftText, tone } = input as RewriteInput;
      const t = tone || (action === 'rewrite_luxury' ? 'professional' : 'clear and easy to read');
      userContent = `Rewrite the ENTIRE draft below to be more ${t}. The draft may be in Vietnamese or English—preserve its language. Output the COMPLETE rewritten text from start to end; do not truncate or summarize.\n\nDraft:\n${draftText}`;
      break;
    }
    case 'summarize': {
      const { postContent } = input as SummarizeInput;
      userContent = context?.postTitle
        ? `Post title: ${context.postTitle}\n\nContent to summarize:\n${postContent}`
        : `Summarize this post into bullet points and one short takeaway:\n\n${postContent}`;
      break;
    }
    case 'reflection': {
      const { postContent, journeyStep } = input as ReflectionInput;
      userContent = journeyStep
        ? `Journey step: ${journeyStep}\n\nPost content:\n${postContent}\n\nGenerate 3 reflection questions and 1 suggested next step.`
        : `Post content:\n${postContent}\n\nGenerate 3 reflection questions and 1 suggested next step.`;
      break;
    }
    case 'paragraph_analyze': {
      const { content } = input as ParagraphAnalyzeInput;
      userContent = `Analyze this blog content. Split by paragraph (double newline). For each paragraph, suggest a short title and classify: "paragraph" for explanatory prose, "bullet" for list-like.\n\nContent:\n${content}`;
      break;
    }
    default:
      userContent = JSON.stringify(input);
  }
  messages.push({ role: 'user', content: userContent });
  return messages;
}

function validateInputForAction(
  action: AiAction,
  input: unknown
): { ok: true } | { ok: false; reason: string } {
  switch (action) {
    case 'chat': {
      const { userMessage } = (input || {}) as ChatInput;
      if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
        return { ok: false, reason: 'userMessage is required' };
      }
      return passesInputGuardrails(userMessage, MAX_INPUT_LENGTH);
    }
    case 'grammar_fix':
    case 'rewrite_luxury':
    case 'rewrite_simple': {
      const { draftText } = (input || {}) as GrammarFixInput & RewriteInput;
      if (!draftText || typeof draftText !== 'string' || !draftText.trim()) {
        return { ok: false, reason: 'draftText is required' };
      }
      return passesInputGuardrails(draftText, MAX_INPUT_LENGTH);
    }
    case 'summarize':
    case 'reflection': {
      const { postContent } = (input || {}) as SummarizeInput & ReflectionInput;
      if (!postContent || typeof postContent !== 'string' || !postContent.trim()) {
        return { ok: false, reason: 'postContent is required' };
      }
      return passesInputGuardrails(postContent, MAX_POST_CONTENT_LENGTH);
    }
    case 'paragraph_analyze': {
      const { content } = (input || {}) as ParagraphAnalyzeInput;
      if (!content || typeof content !== 'string' || !content.trim()) {
        return { ok: false, reason: 'content is required' };
      }
      return passesInputGuardrails(content, MAX_POST_CONTENT_LENGTH);
    }
    default:
      return { ok: false, reason: 'Unknown action' };
  }
}

function parseResponse(body: unknown): string {
  if (body && typeof body === 'object' && 'choices' in body) {
    const choices = (body as { choices?: unknown[] }).choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const first = choices[0];
      if (first && typeof first === 'object' && 'message' in first) {
        const msg = (first as { message?: { content?: string } }).message;
        if (msg && typeof msg.content === 'string') {
          return msg.content.trim();
        }
      }
    }
  }
  return '';
}

const REWRITE_MAX_TOKENS = 4096;

/** Call GitHub Models API with timeout and retries. Uses only GITHUB_TOKEN. */
async function callGitHubModels(
  messages: { role: string; content: string }[],
  options?: { maxTokens?: number; model?: string }
): Promise<string> {
  if (!isAiConfigured()) {
    throw new Error(
      'AI is not configured. Set GITHUB_TOKEN in .env (fine-grained PAT with "Models" read permission).'
    );
  }
  const url = `${aiConfig.baseUrl}${aiConfig.chatCompletionsPath}?api-version=${aiConfig.apiVersion}`;
  const maxTokens = options?.maxTokens ?? aiConfig.maxTokens;
  const model = options?.model ?? aiConfig.model;
  const body = {
    model,
    messages,
    max_tokens: maxTokens,
    stream: false,
  };

  let lastError: Error | null = null;
  let lastStatus = 0;
  for (let attempt = 0; attempt <= aiConfig.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), aiConfig.timeoutMs);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
          Authorization: `Bearer ${aiConfig.token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        lastStatus = res.status;
        if (res.status === 429) break;
        const message = typeof data?.message === 'string' ? data.message : `API error ${res.status}`;
        throw new Error(message);
      }
      const text = parseResponse(data);
      if (!text) throw new Error('Empty response from AI');
      return text;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (lastError.message.includes('abort')) {
        lastError = new Error('Request timeout');
      }
      if (attempt < aiConfig.maxRetries) {
        logger.info('AI request retry', { attempt: attempt + 1, error: lastError.message });
      }
    }
  }
  const safeMessage =
    lastError?.message?.includes('token') || lastError?.message?.includes('Bearer')
      ? 'Service temporarily unavailable'
      : lastError?.message ?? 'AI request failed';
  if (lastStatus === 429) {
    const err = new Error('AI_QUOTA_EXCEEDED');
    (err as Error & { code?: string }).code = 'AI_QUOTA_EXCEEDED';
    throw err;
  }
  if (lastStatus === 403) {
    throw new Error(
      'AI access denied (403). Use a fine-grained GitHub PAT with "Models" read permission. Create one at https://github.com/settings/tokens?type=beta'
    );
  }
  throw new Error(safeMessage);
}

export async function runAiAction(
  action: AiAction,
  input: unknown,
  context?: AiContext
): Promise<AiResult> {
  const validation = validateInputForAction(action, input);
  if (!validation.ok) {
    throw new Error(validation.reason);
  }

  const messages = buildMessages(action, input, context);
  const isRewrite = action === 'rewrite_luxury' || action === 'rewrite_simple';
  const raw = await callGitHubModels(
    messages,
    isRewrite ? { maxTokens: REWRITE_MAX_TOKENS } : undefined
  );

  switch (action) {
    case 'chat':
      return { action: 'chat', result: { assistantMessage: raw } };
    case 'grammar_fix': {
      const replacementsMarker = /\n\s*REPLACEMENTS:\s*\n/i;
      const match = raw.match(replacementsMarker);
      let correctedText: string;
      let replacements: GrammarFixReplacement[] = [];
      let detectedLanguage: 'en' | 'vi' | undefined;
      let changes: string[] | undefined;

      if (match && typeof match.index === 'number') {
        correctedText = raw.slice(0, match.index).trim();
        const after = raw.slice(match.index + match[0].length);
        const lines = after.split('\n').map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
          const langMatch = line.match(/^LANGUAGE:\s*(en|vi)$/i);
          if (langMatch) {
            detectedLanguage = langMatch[1].toLowerCase() as 'en' | 'vi';
            continue;
          }
          try {
            const arr = JSON.parse(line) as unknown;
            if (Array.isArray(arr)) {
              for (const item of arr) {
                if (item && typeof item === 'object' && 'wrong' in item && 'replacement' in item) {
                  const wrong = String((item as { wrong: unknown }).wrong);
                  const replacement = String((item as { replacement: unknown }).replacement);
                  if (wrong !== replacement) replacements.push({ wrong, replacement });
                }
              }
              break;
            }
          } catch {
            // skip non-JSON lines
          }
        }
        if (replacements.length > 0) {
          changes = replacements.map((r) => `"${r.wrong}" → "${r.replacement}"`);
        }
      } else {
        correctedText = raw.trim();
      }
      return {
        action: 'grammar_fix',
        result: { correctedText, replacements, detectedLanguage, changes },
      };
    }
    case 'rewrite_luxury':
    case 'rewrite_simple':
      return { action, result: { improvedText: raw } };
    case 'summarize': {
      const bulletSummary: string[] = [];
      let takeaway = '';
      const parts = raw.split(/\n+/);
      for (const line of parts) {
        const t = line.trim();
        if (!t) continue;
        if (t.toLowerCase().startsWith('takeaway') || t.toLowerCase().includes('takeaway:')) {
          takeaway = t.replace(/^takeaway:?\s*/i, '').trim();
        } else if (t.startsWith('-') || t.startsWith('*') || /^\d+\./.test(t)) {
          bulletSummary.push(t.replace(/^[-*]\s*|\d+\.\s*/, '').trim());
        } else {
          bulletSummary.push(t);
        }
      }
      if (!takeaway && bulletSummary.length > 0) takeaway = bulletSummary[bulletSummary.length - 1];
      return { action: 'summarize', result: { bulletSummary, takeaway } };
    }
    case 'reflection': {
      const reflectionQuestions: string[] = [];
      let suggestedNextStep = '';
      const parts = raw.split(/\n+/);
      for (const line of parts) {
        const t = line.trim();
        if (!t) continue;
        if (t.toLowerCase().includes('next step') || t.toLowerCase().includes('suggested')) {
          suggestedNextStep = t.replace(/^.*?(next step|suggested):?\s*/i, '').trim();
        } else if (/^\d+\./.test(t) || t.startsWith('-') || t.startsWith('?')) {
          reflectionQuestions.push(t.replace(/^\d+\.\s*|^[-?]\s*/, '').trim());
        }
      }
      return {
        action: 'reflection',
        result: {
          reflectionQuestions: reflectionQuestions.slice(0, 3),
          suggestedNextStep: suggestedNextStep || raw.slice(0, 200),
        },
      };
    }
    case 'paragraph_analyze': {
      const paragraphs: Array<{
        index: number;
        title: string | null;
        suggestedFormat: 'paragraph' | 'bullet';
      }> = [];
      const trimmed = raw.trim();
      const parseObj = (obj: {
        index?: number;
        title?: string | null;
        aiTitle?: string | null;
        suggestedFormat?: string;
      }) => {
        const index = typeof obj.index === 'number' ? obj.index : paragraphs.length;
        const title = (obj.title ?? obj.aiTitle) != null ? String(obj.title ?? obj.aiTitle) : null;
        const suggestedFormat = obj.suggestedFormat === 'bullet' ? 'bullet' : 'paragraph';
        paragraphs.push({ index, title, suggestedFormat });
      };
      const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          const arr = JSON.parse(arrayMatch[0]) as Array<{
            index?: number;
            title?: string | null;
            aiTitle?: string | null;
            suggestedFormat?: string;
          }>;
          if (Array.isArray(arr)) {
            for (const obj of arr) parseObj(obj);
          }
        } catch {
          // fall through
        }
      }
      if (paragraphs.length === 0) {
        const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
          try {
            parseObj(
              JSON.parse(line) as {
                index?: number;
                title?: string | null;
                aiTitle?: string | null;
                suggestedFormat?: string;
              }
            );
          } catch {
            // skip
          }
        }
      }
      return { action: 'paragraph_analyze', result: { paragraphs } };
    }
    default:
      return { action: 'chat', result: { assistantMessage: raw } };
  }
}

export type RiskFlag = 'low' | 'medium' | 'high';

export interface BlogContentAnalysisResult {
  clarityScore: number;
  originalityScore: number;
  financeRelevanceScore: number;
  riskFlag: RiskFlag;
}

export async function analyzeBlogContent(content: string): Promise<BlogContentAnalysisResult> {
  if (!content || typeof content !== 'string') {
    return {
      clarityScore: 0,
      originalityScore: 0,
      financeRelevanceScore: 0,
      riskFlag: 'medium',
    };
  }
  const trimmed = content.trim();
  const len = trimmed.length;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const clarityScore = Math.min(100, Math.round((wordCount / 50) * 20) + 50);
  const originalityScore = Math.min(100, 40 + (len % 41));
  const financeRelevanceScore = Math.min(
    100,
    50 + (trimmed.toLowerCase().split(/invest|sav|budget|debt|finance|money|retirement/).length - 1) * 5
  );
  let riskFlag: RiskFlag = 'low';
  const lower = trimmed.toLowerCase();
  if (lower.includes('guaranteed return') || lower.includes('risk-free') || lower.includes('get rich quick')) {
    riskFlag = 'high';
  } else if (lower.includes('crypto') || lower.includes('bitcoin') || lower.includes('yolo')) {
    riskFlag = 'medium';
  }
  return {
    clarityScore: Math.max(0, Math.min(100, clarityScore)),
    originalityScore: Math.max(0, Math.min(100, originalityScore)),
    financeRelevanceScore: Math.max(0, Math.min(100, financeRelevanceScore)),
    riskFlag,
  };
}

const BLOG_SUMMARY_MODEL = 'openai/gpt-4o-mini';
const BLOG_SUMMARY_SYSTEM =
  'Summarize the following finance blog in 4-6 bullet points. Do not rewrite the content. Extract main ideas only.';
const BLOG_SUMMARY_MAX_TOKENS = 800;

/**
 * Generate AI summary for a finance blog (4–6 bullet points).
 * Uses gpt-4o-mini via GitHub Models (GITHUB_TOKEN).
 * Returns bullet points joined by newlines, or throws on failure.
 */
export async function generateBlogSummary(content: string): Promise<string> {
  if (!content || typeof content !== 'string' || !content.trim()) {
    return '';
  }
  const normalizedInput = normalizeContent(content);
  const validation = passesInputGuardrails(normalizedInput, MAX_POST_CONTENT_LENGTH);
  if (!validation.ok) {
    throw new Error(validation.reason);
  }
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: BLOG_SUMMARY_SYSTEM },
    { role: 'user', content: normalizedInput },
  ];
  const raw = await callGitHubModels(messages, {
    model: BLOG_SUMMARY_MODEL,
    maxTokens: BLOG_SUMMARY_MAX_TOKENS,
  });
  return normalizeContent(raw);
}
