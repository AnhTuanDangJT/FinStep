import { z } from 'zod';
import { EXPERIENCE_LEVELS } from './mentorship.model';

export const registerMentorshipSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, 'Name is required').max(100).trim(),
      school: z.string().min(1, 'School is required').max(150).trim(),
      experienceLevel: z.enum(EXPERIENCE_LEVELS as unknown as [string, ...string[]]),
      major: z.string().min(1, 'Major is required').max(120).trim(),
      financeFocus: z.string().min(1, 'Finance focus is required').max(200).trim(),
    })
    .strict(),
});

export type RegisterMentorshipInput = z.infer<typeof registerMentorshipSchema>['body'];
