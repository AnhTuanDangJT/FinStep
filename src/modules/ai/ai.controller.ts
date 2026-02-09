import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { isAiConfigured } from '../../config/ai';
import { runAiAction, type AiAction } from './ai.service';
import { aiRequestSchema } from './ai.validator';
import { z } from 'zod';

const paragraphAnalyzeBodySchema = z.object({
  body: z.object({
    content: z.string({ required_error: 'content is required' }).min(1, 'content must not be empty'),
  }),
});

/**
 * POST /api/ai/paragraph-analyze
 * Body: { content: string }
 * Returns { paragraphs: [{ index, title, suggestedFormat }] }
 * Advisory only; AI suggestions NEVER overwrite blog.content.
 */
export async function paragraphAnalyzeHandler(req: Request, res: Response): Promise<Response> {
  try {
    const parsed = paragraphAnalyzeBodySchema.safeParse(req);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }

    if (!isAiConfigured()) {
      return sendError(res, 'AI service is not configured', 503);
    }

    const { content } = parsed.data.body;
    const result = await runAiAction('paragraph_analyze', { content });

    if (result.action !== 'paragraph_analyze') {
      return sendError(res, 'Unexpected AI response', 500);
    }

    logger.info('AI paragraph analyze completed');
    return sendSuccess(res, 'Paragraph analysis completed', result.result, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Paragraph analysis failed';
    logger.error('Paragraph analysis failed', error instanceof Error ? error : undefined);
    return sendError(res, message, 400);
  }
}

/**
 * POST /api/ai
 * Body: { action, input, context? }
 * Token is never sent to client; all AI calls are server-side.
 */
export async function aiHandler(req: Request, res: Response): Promise<Response> {
  try {
    const parsed = aiRequestSchema.safeParse(req);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }

    if (!isAiConfigured()) {
      return sendError(res, 'AI service is not configured', 503);
    }

    const { action, input, context } = parsed.data.body;
    const result = await runAiAction(action as AiAction, input, context);

    // Log minimal metadata only (no user text)
    logger.info('AI action completed', { action });

    return sendSuccess(res, 'AI action completed', result, 200);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('AI request failed');
    const code = (err as Error & { code?: string }).code;
    logger.error('AI request failed', err);
    if (code === 'AI_QUOTA_EXCEEDED' || err.message === 'AI_QUOTA_EXCEEDED') {
      return sendError(res, 'AI quota exceeded. Please try again later.', 429, 'AI_QUOTA_EXCEEDED');
    }
    return sendError(res, err.message, 400);
  }
}
