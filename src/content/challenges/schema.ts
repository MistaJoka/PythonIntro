import { z } from 'zod';
import { exampleSchema } from '../schema';

export const CHALLENGE_THEMES = [
  'numbers',
  'controlflow',
  'textparse',
  'datawrangling',
  'idioms',
  'objects',
  'recursion',
  'errors',
] as const;

export type ChallengeTheme = (typeof CHALLENGE_THEMES)[number];

export const challengeBundleSchema = z.object({
  id: z.string(),
  title: z.string(),
  blurb: z.string(),
  theme: z.enum(CHALLENGE_THEMES),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  lessonRefs: z.array(z.string()).min(1),
  examples: z.array(exampleSchema).min(4),
});

export type ChallengeBundle = z.infer<typeof challengeBundleSchema>;
