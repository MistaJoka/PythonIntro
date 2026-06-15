import { z } from 'zod';
import { exampleSchema } from '../schema';

export const examSetSchema = z.object({
  id: z.string(),
  title: z.string(),
  durationMin: z.number(),
  questions: z.array(exampleSchema).min(1),
});

export type ExamSet = z.infer<typeof examSetSchema>;
