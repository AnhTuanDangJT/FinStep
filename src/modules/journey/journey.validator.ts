import { z } from 'zod';

export const createJourneySchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200).trim(),
    goal: z.enum(['Saving', 'Investing', 'Career', 'SideHustle']),
    isPublic: z.boolean().optional().default(false),
  }).strict(),
});

export type CreateJourneyInput = z.infer<typeof createJourneySchema>['body'];
