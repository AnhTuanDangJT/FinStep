import { z } from 'zod';

/**
 * Ask chat question validation schema
 */
export const askChatSchema = z.object({
  body: z.object({
    question: z
      .string({
        required_error: 'Question is required',
      })
      .min(1, 'Question must not be empty')
      .max(1000, 'Question must be less than 1000 characters')
      .trim(),
  }).strict(),
});

export type AskChatInput = z.infer<typeof askChatSchema>['body'];



