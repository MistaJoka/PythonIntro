import { describe, it, expect } from 'vitest';
import {
  buildSmartPracticeQueue,
  buildReviewQueue,
  getWeakestTag,
  getReviewBatch,
  REVIEW_BATCH_SIZE,
} from '../src/engine/practiceQueue';

describe('practiceQueue', () => {
  it('builds smart practice with due and missed first', () => {
    const ids = buildSmartPracticeQueue(
      [{ exampleId: 'l1-c1-e1', dueDate: '2000-01-01T00:00:00Z', intervalDays: 1 }],
      { 'l2-c1-e1': { correct: false, attempts: 1, lastSeen: '', lessonId: 'lesson02', tags: [] } },
      {},
      15,
    );
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.length).toBeLessThanOrEqual(15);
  });

  it('filters review by tag', () => {
    const attempts = {
      'l7-c2-e1': {
        correct: false,
        attempts: 1,
        lastSeen: '',
        lessonId: 'lesson07',
        tags: ['mutation' as const],
      },
    };
    const queue = buildReviewQueue([], attempts, { tagFilter: 'mutation' });
    expect(queue).toContain('l7-c2-e1');
  });

  it('batches review ids', () => {
    const ids = Array.from({ length: 25 }, (_, i) => `id-${i}`);
    expect(getReviewBatch(ids, 0).length).toBe(REVIEW_BATCH_SIZE);
    expect(getReviewBatch(ids, 10).length).toBe(REVIEW_BATCH_SIZE);
    expect(getReviewBatch(ids, 20).length).toBe(5);
  });

  it('finds weakest tag when enough attempts', () => {
    const tag = getWeakestTag({
      a: { correct: false, attempts: 3, lastSeen: '', lessonId: 'lesson01', tags: ['mutation'] },
      b: { correct: true, attempts: 3, lastSeen: '', lessonId: 'lesson01', tags: ['mutation'] },
      c: { correct: true, attempts: 3, lastSeen: '', lessonId: 'lesson01', tags: ['scope'] },
      d: { correct: true, attempts: 3, lastSeen: '', lessonId: 'lesson01', tags: ['scope'] },
    });
    expect(tag).toBe('mutation');
  });
});
