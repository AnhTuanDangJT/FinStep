import { z } from 'zod';

const aiActionSchema = z.enum([
  'chat',
  'grammar_fix',
  'rewrite_luxury',
  'rewrite_simple',
  'summarize',
  'reflection',
  'paragraph_analyze',
]);

const contextSchema = z
  .object({
    postTitle: z.string().max(500).optional(),
    postContent: z.string().max(50000).optional(),
    userProfile: z.record(z.unknown()).optional(),
  })
  .optional();

const inputSchema = z.record(z.unknown());

export const aiRequestSchema = z.object({
  body: z.object({
    action: aiActionSchema,
    input: inputSchema,
    context: contextSchema,
  }),
});

export type AiRequest = z.infer<typeof aiRequestSchema>;
