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
import { lesson17 } from './lessons/lesson17';
import { lesson18 } from './lessons/lesson18';
import { ml01 } from './ml/ml01';
import { ml02 } from './ml/ml02';
import { ml03 } from './ml/ml03';
import { ml04 } from './ml/ml04';
import { ml05 } from './ml/ml05';
import { examFinal01, examFinal02, examFinal03 } from './examSets/finals';
import type { ExamSet } from './examSets/schema';
import { mergeLessonExtras } from './lessonExtras';
import { INTERACTIVE_EXTRAS } from './interactiveExtras';
import { BUILD_EXTRAS } from './buildExtras';
import { CHALLENGE_EXTRAS } from './challengeExtras';
import { CAPSTONE_PROJECTS, validateCapstones } from './capstones/projects';
export { CAPSTONE_PROJECTS, getCapstoneById, validateCapstones } from './capstones/projects';
export type { CapstoneProject } from './capstones/schema';
import { CHALLENGE_BUNDLES } from './challenges/bundles';
import { challengeBundleSchema, type ChallengeBundle } from './challenges/schema';

/**
 * The CAI 2100C bridge tier — Intro Python carried forward into pandas/NumPy/
 * scikit-learn.
 *
 * Deliberately a separate tier rather than extra entries in ALL_LESSONS, for
 * two reasons the test suite already encodes: the course is exactly 16 lessons
 * (progress + registry tests assert it), and every one of those carries a
 * challenge concept the bridge lessons have no reason to. It is likewise absent
 * from capstones/lessonIndex's COURSE_LESSONS, whose length pins the
 * lessonCoverage map on all 18 capstones.
 */
export const ML_LESSONS: Lesson[] = [ml01, ml02, ml03, ml04, ml05];

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
  lesson17,
  lesson18,
].map((l) => mergeChallengeExtras(mergeBuildExtras(mergeInteractiveExtras(mergeLessonExtras(l)))));

function mergeChallengeExtras<T extends { id: string; concepts: { id: string; title: string; objective: string; miniNote?: string; examples: Example[] }[] }>(
  lesson: T,
): T {
  const extras = CHALLENGE_EXTRAS[lesson.id];
  if (!extras?.length) return lesson;
  const challengeConcept = {
    id: `${lesson.id}-challenge`,
    title: 'Challenge — interview-grade',
    objective: 'Apply this lesson under exam pressure: edge cases, complexity, and distractors.',
    miniNote: 'Optional stretch. Uses only what this lesson and earlier lessons taught.',
    examples: extras,
  };
  return { ...lesson, concepts: [...lesson.concepts, challengeConcept] };
}

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

/** Rail/nav metadata for the bridge tier, mirroring LESSON_META. */
export const ML_LESSON_META = ML_LESSONS.map((l) => ({
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

/**
 * Resolves across both tiers, so /lesson/ml01 renders through the very same
 * route and components as /lesson/lesson04 — adding bridge content needs no UI
 * code. getAllLessons() stays Intro-only, which is what the course-shaped
 * surfaces (dashboard counts, readiness, the 16-lesson invariant) rely on.
 */
export function getLessonById(id: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id) ?? ML_LESSONS.find((l) => l.id === id);
}

export function getExamSetById(id: string): ExamSet | undefined {
  return EXAM_SETS.find((e) => e.id === id);
}

export function getExampleById(id: string): { example: Example; lessonId: string } | undefined {
  for (const lesson of [...ALL_LESSONS, ...ML_LESSONS]) {
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
  for (const bundle of CHALLENGE_BUNDLES) {
    const ex = bundle.examples.find((e) => e.id === id);
    if (ex) return { example: ex, lessonId: 'challenge' };
  }
  return undefined;
}

export function getChallengeBundles(): ChallengeBundle[] {
  return CHALLENGE_BUNDLES;
}

export function getChallengeBundleById(id: string): ChallengeBundle | undefined {
  return CHALLENGE_BUNDLES.find((b) => b.id === id);
}

export function getMlLessons(): Lesson[] {
  return ML_LESSONS;
}

export function getMlLessonById(id: string): Lesson | undefined {
  return ML_LESSONS.find((l) => l.id === id);
}

function collectLessonExamples(lessons: Lesson[]): Example[] {
  const out: Example[] = [];
  for (const lesson of lessons) {
    for (const concept of lesson.concepts) {
      out.push(...concept.examples);
    }
    out.push(...lesson.lessonCheck);
  }
  return out;
}

export function getAllExamples(): Example[] {
  return [...collectLessonExamples(ALL_LESSONS), ...collectLessonExamples(ML_LESSONS)];
}

export function validateAllLessons(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const lesson of [...ALL_LESSONS, ...ML_LESSONS]) {
    const result = lessonSchema.safeParse(lesson);
    if (!result.success) {
      errors.push(`${lesson.id}: ${result.error.message}`);
    }
  }
  const capstoneResult = validateCapstones();
  if (!capstoneResult.ok) {
    errors.push(...capstoneResult.errors);
  }
  for (const bundle of CHALLENGE_BUNDLES) {
    const result = challengeBundleSchema.safeParse(bundle);
    if (!result.success) {
      errors.push(`${bundle.id}: ${result.error.message}`);
    }
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
