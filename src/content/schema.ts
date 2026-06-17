import { z } from 'zod';

export const MISTAKE_TAGS = [
  'aliasing',
  'mutation',
  'scope',
  'offByOne',
  'loopLogic',
  'typeCoercion',
  'truthiness',
  'dictKeys',
  'recursion',
  'oopAttrs',
  'exceptionType',
  'comprehension',
  'fileMode',
  'identity',
  'traceback',
  'shallowCopy',
  'loopInvariant',
  'assertLogic',
  'sortedKey',
  'floatPrecision',
  'moduleMain',
  'regex',
  'jsonCsv',
  'generators',
  'unpacking',
  'typeHints',
  'patternMatch',
] as const;

export type MistakeTag = (typeof MISTAKE_TAGS)[number];

export const EXAMPLE_STAGES = ['see', 'try', 'build', 'debug', 'stretch'] as const;
export type ExampleStage = (typeof EXAMPLE_STAGES)[number];

export const EXAMPLE_TYPES = [
  'traceSteps',
  'multipleChoice',
  'fillBlank',
  'fixTheLine',
  'codeChallenge',
  'orderLines',
  'matchPairs',
  'dragBlank',
] as const;

export type ExampleType = (typeof EXAMPLE_TYPES)[number];

const baseExample = z.object({
  id: z.string(),
  stage: z.enum(EXAMPLE_STAGES),
  tags: z.array(z.enum(MISTAKE_TAGS)),
  prompt: z.string(),
  explanation: z.string(),
  trapNote: z.string().optional(),
});

export const traceStepsExampleSchema = baseExample.extend({
  type: z.literal('traceSteps'),
  code: z.string(),
  steps: z.array(
    z.object({
      line: z.number(),
      vars: z.record(z.string(), z.string()),
      output: z.string().optional(),
      note: z.string().optional(),
    }),
  ),
  question: z.string(),
  options: z.array(z.string()).min(4).max(6),
  answerIndex: z.number().int().min(0),
});

export const multipleChoiceExampleSchema = baseExample.extend({
  type: z.literal('multipleChoice'),
  options: z.array(z.string()).min(2),
  answerIndex: z.number().int().min(0),
});

export const fillBlankExampleSchema = baseExample.extend({
  type: z.literal('fillBlank'),
  code: z.string(),
  blankLabel: z.string(),
  options: z.array(z.string()).min(4).max(6),
  answerIndex: z.number().int().min(0),
});

export const fixTheLineExampleSchema = baseExample.extend({
  type: z.literal('fixTheLine'),
  code: z.string(),
  lineOptions: z.array(z.number()),
  answerLine: z.number(),
  wrongOutput: z.string().optional(),
});

export const codeChallengeExampleSchema = baseExample.extend({
  type: z.literal('codeChallenge'),
  starterCode: z.string(),
  tests: z.array(z.string()),
  solutionHint: z.string().optional(),
});

export const orderLinesExampleSchema = baseExample.extend({
  type: z.literal('orderLines'),
  codeContext: z.string().optional(),
  lines: z.array(z.string()).min(2),
  correctOrder: z.array(z.number().int().min(0)),
});

export const matchPairsExampleSchema = baseExample.extend({
  type: z.literal('matchPairs'),
  leftItems: z.array(z.string()).min(2),
  rightItems: z.array(z.string()).min(2),
  pairs: z.array(z.tuple([z.number().int().min(0), z.number().int().min(0)])),
});

export const dragBlankExampleSchema = baseExample.extend({
  type: z.literal('dragBlank'),
  code: z.string(),
  blanks: z.array(z.object({ id: z.string(), answer: z.string() })).min(1),
  distractors: z.array(z.string()),
});

export const exampleSchema = z.discriminatedUnion('type', [
  traceStepsExampleSchema,
  multipleChoiceExampleSchema,
  fillBlankExampleSchema,
  fixTheLineExampleSchema,
  codeChallengeExampleSchema,
  orderLinesExampleSchema,
  matchPairsExampleSchema,
  dragBlankExampleSchema,
]);

export type Example = z.infer<typeof exampleSchema>;

export const conceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  objective: z.string(),
  miniNote: z.string().optional(),
  examples: z.array(exampleSchema).min(1),
});

export type Concept = z.infer<typeof conceptSchema>;

export const lessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  objectives: z.array(z.string()).min(1),
  concepts: z.array(conceptSchema),
  lessonCheck: z.array(exampleSchema),
});

export type Lesson = z.infer<typeof lessonSchema>;
