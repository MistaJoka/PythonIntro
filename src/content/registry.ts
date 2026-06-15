import { lessonSchema, type Example, type Lesson } from './schema';
import { lesson01 } from './lessons/lesson01';
import { lesson02 } from './lessons/lesson02';
import { lesson03 } from './lessons/lesson03';
import { lesson04 } from './lessons/lesson04';
import { lesson05 } from './lessons/lesson05';
import { lesson06 } from './lessons/lesson06';
import { lesson07 } from './lessons/lesson07';
import { lesson08 } from './lessons/lesson08';
import { lesson09 } from './lessons/lesson09';
import { lesson10 } from './lessons/lesson10';
import { lesson11 } from './lessons/lesson11';
import { lesson12 } from './lessons/lesson12';
import { lesson13 } from './lessons/lesson13';
import { lesson14 } from './lessons/lesson14';
import { lesson15 } from './lessons/lesson15';
import { lesson16 } from './lessons/lesson16';
import { examFinal01, examFinal02, examFinal03 } from './examSets/finals';
import type { ExamSet } from './examSets/schema';
import { mergeLessonExtras } from './lessonExtras';
import { INTERACTIVE_EXTRAS } from './interactiveExtras';
import { BUILD_EXTRAS } from './buildExtras';
import { CAPSTONE_PROJECTS, validateCapstones } from './capstones/projects';
export { CAPSTONE_PROJECTS, getCapstoneById, validateCapstones } from './capstones/projects';
export type { CapstoneProject } from './capstones/schema';

const ALL_LESSONS: Lesson[] = [
  lesson01,
  lesson02,
  lesson03,
  lesson04,
  lesson05,
  lesson06,
  lesson07,
  lesson08,
  lesson09,
  lesson10,
  lesson11,
  lesson12,
  lesson13,
  lesson14,
  lesson15,
  lesson16,
].map((l) => mergeBuildExtras(mergeInteractiveExtras(mergeLessonExtras(l))));

function mergeBuildExtras<T extends { id: string; concepts: { examples: Example[] }[] }>(
  lesson: T,
): T {
  const extras = BUILD_EXTRAS[lesson.id];
  if (!extras?.length) return lesson;
  const concepts = [...lesson.concepts];
  const last = concepts[concepts.length - 1];
  if (last) {
    concepts[concepts.length - 1] = {
      ...last,
      examples: [...last.examples, ...extras],
    };
  }
  return { ...lesson, concepts };
}

function mergeInteractiveExtras<T extends { id: string; concepts: { examples: Example[] }[] }>(
  lesson: T,
): T {
  const extras = INTERACTIVE_EXTRAS[lesson.id];
  if (!extras?.length) return lesson;
  const concepts = [...lesson.concepts];
  const last = concepts[concepts.length - 1];
  if (last) {
    concepts[concepts.length - 1] = {
      ...last,
      examples: [...last.examples, ...extras],
    };
  }
  return { ...lesson, concepts };
}

export const EXAM_SETS: ExamSet[] = [examFinal01, examFinal02, examFinal03];

export const LESSON_META = ALL_LESSONS.map((l) => ({
  id: l.id,
  title: l.title,
  subtitle: l.subtitle,
  exampleCount: countLessonExamples(l),
  hasContent: l.concepts.length > 0,
}));

function countLessonExamples(lesson: Lesson): number {
  return (
    lesson.concepts.reduce((n, c) => n + c.examples.length, 0) + lesson.lessonCheck.length
  );
}

export function getAllLessons(): Lesson[] {
  return ALL_LESSONS;
}

export function getLessonById(id: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}

export function getExamSetById(id: string): ExamSet | undefined {
  return EXAM_SETS.find((e) => e.id === id);
}

export function getExampleById(id: string): { example: Example; lessonId: string } | undefined {
  for (const lesson of ALL_LESSONS) {
    for (const concept of lesson.concepts) {
      const ex = concept.examples.find((e) => e.id === id);
      if (ex) return { example: ex, lessonId: lesson.id };
    }
    const check = lesson.lessonCheck.find((e) => e.id === id);
    if (check) return { example: check, lessonId: lesson.id };
  }
  for (const exam of EXAM_SETS) {
    const ex = exam.questions.find((e) => e.id === id);
    if (ex) return { example: ex, lessonId: 'exam' };
  }
  return undefined;
}

export function getAllExamples(): Example[] {
  const out: Example[] = [];
  for (const lesson of ALL_LESSONS) {
    for (const concept of lesson.concepts) {
      out.push(...concept.examples);
    }
    out.push(...lesson.lessonCheck);
  }
  return out;
}

export function validateAllLessons(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const lesson of ALL_LESSONS) {
    const result = lessonSchema.safeParse(lesson);
    if (!result.success) {
      errors.push(`${lesson.id}: ${result.error.message}`);
    }
  }
  const capstoneResult = validateCapstones();
  if (!capstoneResult.ok) {
    errors.push(...capstoneResult.errors);
  }
  return { ok: errors.length === 0, errors };
}

export function getCapstoneCount(): number {
  return CAPSTONE_PROJECTS.length;
}

export {
  getLessonExampleQueue,
  getNextIncompleteQueueIndex,
  queueIndexFromPosition,
  positionFromQueueIndex,
  getConceptStartQueueIndex,
  getConceptProgress,
} from '../engine/lessonQueue';
export type { QueueItem, SessionPosition as QueueSessionPosition } from '../engine/lessonQueue';

export function validateAllExercises(): { ok: boolean; errors: string[] } {
  return validateAllLessons();
}
