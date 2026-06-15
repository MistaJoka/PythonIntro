import type { ExamSet } from './schema';
import { lesson04 } from '../lessons/lesson04';
import { lesson05 } from '../lessons/lesson05';
import { lesson07 } from '../lessons/lesson07';
import { lesson03 } from '../lessons/lesson03';
import { lesson08 } from '../lessons/lesson08';
import { lesson11 } from '../lessons/lesson11';
import { INTERACTIVE_EXTRAS } from '../interactiveExtras';

const interactivePool = Object.values(INTERACTIVE_EXTRAS).flat();

/** Practice final 1 — loops, functions, conditionals mix */
export const examFinal01: ExamSet = {
  id: 'final01',
  title: 'Practice Final I',
  durationMin: 60,
  questions: [
    ...lesson04.lessonCheck,
    ...lesson05.concepts[0].examples.filter((e) => e.stage === 'stretch'),
    ...lesson03.lessonCheck.slice(0, 2),
    lesson04.concepts[1].examples[2],
    lesson05.concepts[2].examples[2],
    lesson04.concepts[3].examples[1],
    interactivePool.find((e) => e.type === 'orderLines')!,
    interactivePool.find((e) => e.type === 'dragBlank' && e.id.startsWith('l3'))!,
  ].map((q, i) => ({ ...q, id: `final01-q${i + 1}` })),
};

/** Practice final 2 — data structures heavy */
export const examFinal02: ExamSet = {
  id: 'final02',
  title: 'Practice Final II',
  durationMin: 60,
  questions: [
    ...lesson07.lessonCheck,
    ...lesson08.lessonCheck,
    lesson07.concepts[0].examples[2],
    lesson07.concepts[1].examples[2],
    lesson08.concepts[2].examples[2],
    lesson07.concepts[3].examples[1],
    interactivePool.find((e) => e.id === 'l7-int-2')!,
    interactivePool.find((e) => e.id === 'l8-int-2')!,
  ].map((q, i) => ({ ...q, id: `final02-q${i + 1}` })),
};

/** Practice final 3 — OOP + comprehensive */
export const examFinal03: ExamSet = {
  id: 'final03',
  title: 'Practice Final III',
  durationMin: 90,
  questions: [
    ...lesson11.lessonCheck,
    ...lesson07.concepts[2].examples.filter((e) => e.type === 'traceSteps'),
    ...lesson05.lessonCheck,
    lesson11.concepts[3].examples[2],
    lesson08.concepts[0].examples[2],
    interactivePool.find((e) => e.id === 'l12-int-1')!,
    interactivePool.find((e) => e.type === 'orderLines' && e.id.startsWith('l11'))!,
  ].map((q, i) => ({ ...q, id: `final03-q${i + 1}` })),
};
