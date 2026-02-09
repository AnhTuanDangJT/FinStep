import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { askChat } from './chat.service';
import { askChatSchema } from './chat.validator';

/**
 * Ask chat question (public, rate limited)
 * POST /chat/ask
 */
export const askChatHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Validate request
    const validationResult = askChatSchema.safeParse(req);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return sendError(res, 'Validation failed', 400, JSON.stringify(errors));
    }

    const input = validationResult.data.body;
    const response = await askChat(input.question);

    return sendSuccess(res, 'Chat response generated', { response }, 200);
  } catch (error) {
    logger.error('Failed to process chat question', error instanceof Error ? error : undefined);
    return sendError(res, 'Failed to process question', 500);
  }
};



