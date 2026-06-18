import { z } from 'zod';
import { COURSE_LESSONS } from './lessonIndex';

export const CAPSTONE_DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export type CapstoneDifficulty = (typeof CAPSTONE_DIFFICULTIES)[number];

const lessonIds = COURSE_LESSONS.map((l) => l.id) as [string, ...string[]];

export const lessonCoverageEntrySchema = z.object({
  lessonId: z.enum(lessonIds),
  lessonTitle: z.string(),
  conceptUsed: z.string().min(8),
});

export const solutionStepSchema = z.object({
  line: z.number().int().min(1),
  teaching: z.string(),
  lessonId: z.enum(lessonIds).optional(),
});

export const capstoneProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  difficulty: z.enum(CAPSTONE_DIFFICULTIES),
  expertLens: z.string(),
  topics: z.array(z.string()).min(1),
  lessonCoverage: z.array(lessonCoverageEntrySchema).length(COURSE_LESSONS.length),
  description: z.string(),
  objectives: z.array(z.string()).min(1),
  starterCode: z.string(),
  tests: z.array(z.string()).min(1),
  solution: z.string(),
  solutionSteps: z.array(solutionStepSchema).min(1),
  explanation: z.string(),
  solutionHint: z.string().optional(),
});

export type LessonCoverageEntry = z.infer<typeof lessonCoverageEntrySchema>;
export type SolutionStep = z.infer<typeof solutionStepSchema>;
export type CapstoneProject = z.infer<typeof capstoneProjectSchema>;
