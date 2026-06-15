import type { MistakeTag } from '../content/schema';
import { getExampleById } from '../content/registry';
import type { ExampleAttempt } from '../store/progress';
import type { SrsEntry } from './srs';
import { getDueExampleIds, getMissedExampleIds } from './srs';
import {
  getLastActiveLesson,
  getLessonExampleQueue,
  getNextIncompleteQueueIndex,
  type SessionPosition,
} from './lessonQueue';
import { computeTagStatsFromExamples, tagAccuracyFromStats } from './readiness';
import { MISTAKE_TAGS } from '../content/schema';

const SMART_PRACTICE_CAP = 15;
const REVIEW_BATCH_SIZE = 10;

export { REVIEW_BATCH_SIZE };

export function buildSmartPracticeQueue(
  srsQueue: SrsEntry[],
  attempts: Record<string, ExampleAttempt>,
  sessionPosition: Record<string, SessionPosition>,
  cap = SMART_PRACTICE_CAP,
): string[] {
  const dueIds = getDueExampleIds(srsQueue);
  const missedIds = getMissedExampleIds(attempts);
  const seen = new Set<string>();
  const result: string[] = [];

  const add = (id: string) => {
    if (seen.has(id) || !getExampleById(id)) return;
    seen.add(id);
    result.push(id);
  };

  for (const id of dueIds) {
    if (result.length >= cap) break;
    add(id);
  }

  for (const id of missedIds) {
    if (result.length >= cap) break;
    add(id);
  }

  const last = getLastActiveLesson(sessionPosition);
  if (last && result.length < cap) {
    const queue = getLessonExampleQueue(last.lessonId);
    const startIdx = getNextIncompleteQueueIndex(last.lessonId, attempts);
    for (let i = startIdx; i < queue.length && result.length < cap; i++) {
      add(queue[i].example.id);
    }
  }

  return result;
}

export function buildReviewQueue(
  srsQueue: SrsEntry[],
  attempts: Record<string, ExampleAttempt>,
  options: {
    lessonFilter?: string;
    tagFilter?: MistakeTag;
  } = {},
): string[] {
  const dueIds = getDueExampleIds(srsQueue);
  const missedIds = getMissedExampleIds(attempts);
  let ids = [...new Set([...dueIds, ...missedIds])];

  if (options.lessonFilter && options.lessonFilter !== 'all') {
    ids = ids.filter((id) => getExampleById(id)?.lessonId === options.lessonFilter);
  }

  if (options.tagFilter) {
    ids = ids.filter((id) => {
      const found = getExampleById(id);
      return found?.example.tags.includes(options.tagFilter!);
    });
  }

  return ids;
}

export function getReviewBatch(ids: string[], batchStart: number): string[] {
  return ids.slice(batchStart, batchStart + REVIEW_BATCH_SIZE);
}

export function getWeakestTag(
  attempts: Record<string, ExampleAttempt>,
): MistakeTag | null {
  const stats = computeTagStatsFromExamples(attempts);
  let worst: { tag: MistakeTag; accuracy: number } | null = null;

  for (const tag of MISTAKE_TAGS) {
    const accuracy = tagAccuracyFromStats(stats, tag);
    if (accuracy === null) continue;
    if (!worst || accuracy < worst.accuracy) {
      worst = { tag, accuracy };
    }
  }

  return worst?.tag ?? null;
}

export function exampleHasTag(exampleId: string, tag: MistakeTag): boolean {
  const found = getExampleById(exampleId);
  return found?.example.tags.includes(tag) ?? false;
}
