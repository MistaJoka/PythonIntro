import type { Example } from '../content/schema';
import { getLessonById } from '../content/registry';
import type { ExampleAttempt } from '../store/progress';

export interface QueueItem {
  example: Example;
  conceptId: string;
  conceptTitle: string;
  conceptIndex: number;
  exampleIndex: number;
  isLessonCheck: boolean;
  queueIndex: number;
}

export interface SessionPosition {
  conceptIndex: number;
  exampleIndex: number;
  updatedAt: string;
}

export function getLessonExampleQueue(lessonId: string): QueueItem[] {
  const lesson = getLessonById(lessonId);
  if (!lesson) return [];

  const items: QueueItem[] = [];
  let queueIndex = 0;

  lesson.concepts.forEach((concept, conceptIndex) => {
    concept.examples.forEach((example, exampleIndex) => {
      items.push({
        example,
        conceptId: concept.id,
        conceptTitle: concept.title,
        conceptIndex,
        exampleIndex,
        isLessonCheck: false,
        queueIndex: queueIndex++,
      });
    });
  });

  lesson.lessonCheck.forEach((example, exampleIndex) => {
    items.push({
      example,
      conceptId: 'lesson-check',
      conceptTitle: 'Lesson Check',
      conceptIndex: lesson.concepts.length,
      exampleIndex,
      isLessonCheck: true,
      queueIndex: queueIndex++,
    });
  });

  return items;
}

export function getNextIncompleteQueueIndex(
  lessonId: string,
  attempts: Record<string, ExampleAttempt>,
): number {
  const queue = getLessonExampleQueue(lessonId);
  const idx = queue.findIndex((item) => !attempts[item.example.id]?.correct);
  return idx >= 0 ? idx : 0;
}

export function queueIndexFromPosition(
  lessonId: string,
  position: Pick<SessionPosition, 'conceptIndex' | 'exampleIndex'>,
): number {
  const queue = getLessonExampleQueue(lessonId);
  const idx = queue.findIndex(
    (item) =>
      item.conceptIndex === position.conceptIndex &&
      item.exampleIndex === position.exampleIndex,
  );
  return idx >= 0 ? idx : 0;
}

export function positionFromQueueIndex(
  lessonId: string,
  queueIndex: number,
): Pick<SessionPosition, 'conceptIndex' | 'exampleIndex'> | null {
  const queue = getLessonExampleQueue(lessonId);
  const item = queue[queueIndex];
  if (!item) return null;
  return { conceptIndex: item.conceptIndex, exampleIndex: item.exampleIndex };
}

export function getConceptStartQueueIndex(lessonId: string, conceptIndex: number): number {
  const queue = getLessonExampleQueue(lessonId);
  const idx = queue.findIndex((item) => item.conceptIndex === conceptIndex);
  return idx >= 0 ? idx : 0;
}

export function getConceptProgress(
  lessonId: string,
  conceptIndex: number,
  attempts: Record<string, ExampleAttempt>,
): { completed: number; total: number } {
  const lesson = getLessonById(lessonId);
  if (!lesson) return { completed: 0, total: 0 };

  if (conceptIndex >= lesson.concepts.length) {
    const ids = lesson.lessonCheck.map((e) => e.id);
    const completed = ids.filter((id) => attempts[id]?.correct).length;
    return { completed, total: ids.length };
  }

  const concept = lesson.concepts[conceptIndex];
  const ids = concept.examples.map((e) => e.id);
  const completed = ids.filter((id) => attempts[id]?.correct).length;
  return { completed, total: ids.length };
}

export interface LastActiveLesson {
  lessonId: string;
  conceptIndex: number;
  exampleIndex: number;
  updatedAt: string;
  lessonTitle: string;
  queueIndex: number;
  queueTotal: number;
  label: string;
}

export function getLastActiveLesson(
  sessionPosition: Record<string, SessionPosition>,
): LastActiveLesson | null {
  let best: { lessonId: string; pos: SessionPosition } | null = null;

  for (const [lessonId, pos] of Object.entries(sessionPosition)) {
    if (!best || pos.updatedAt > best.pos.updatedAt) {
      best = { lessonId, pos };
    }
  }

  if (!best) return null;

  const lesson = getLessonById(best.lessonId);
  if (!lesson) return null;

  const queue = getLessonExampleQueue(best.lessonId);
  const queueIndex = queueIndexFromPosition(best.lessonId, best.pos);
  const item = queue[queueIndex];

  return {
    lessonId: best.lessonId,
    conceptIndex: best.pos.conceptIndex,
    exampleIndex: best.pos.exampleIndex,
    updatedAt: best.pos.updatedAt,
    lessonTitle: lesson.title,
    queueIndex,
    queueTotal: queue.length,
    label: item
      ? `${item.conceptTitle} · Example ${queueIndex + 1} of ${queue.length}`
      : `Example ${queueIndex + 1} of ${queue.length}`,
  };
}
