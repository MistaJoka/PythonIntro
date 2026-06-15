import { describe, it, expect } from 'vitest';
import {
  getLessonExampleQueue,
  getNextIncompleteQueueIndex,
  queueIndexFromPosition,
  positionFromQueueIndex,
  getConceptStartQueueIndex,
  getLastActiveLesson,
} from '../src/engine/lessonQueue';

describe('lessonQueue', () => {
  it('flattens lesson01 into ordered queue', () => {
    const queue = getLessonExampleQueue('lesson01');
    expect(queue.length).toBeGreaterThan(0);
    expect(queue[0].conceptIndex).toBe(0);
    expect(queue[0].exampleIndex).toBe(0);
    expect(queue.every((item, i) => item.queueIndex === i)).toBe(true);
  });

  it('includes lesson check at end', () => {
    const queue = getLessonExampleQueue('lesson01');
    const last = queue[queue.length - 1];
    expect(last.isLessonCheck).toBe(true);
    expect(last.conceptId).toBe('lesson-check');
  });

  it('finds next incomplete index', () => {
    const queue = getLessonExampleQueue('lesson01');
    const firstId = queue[0].example.id;
    const idx = getNextIncompleteQueueIndex('lesson01', {
      [firstId]: {
        correct: true,
        attempts: 1,
        lastSeen: '',
        lessonId: 'lesson01',
        tags: [],
      },
    });
    expect(idx).toBe(1);
  });

  it('converts position to queue index and back', () => {
    const pos = { conceptIndex: 1, exampleIndex: 0 };
    const qi = queueIndexFromPosition('lesson01', pos);
    const back = positionFromQueueIndex('lesson01', qi);
    expect(back).toEqual(pos);
  });

  it('gets concept start index', () => {
    const queue = getLessonExampleQueue('lesson01');
    const concept1Start = getConceptStartQueueIndex('lesson01', 1);
    expect(queue[concept1Start].conceptIndex).toBe(1);
    expect(queue[concept1Start].exampleIndex).toBe(0);
  });
});

describe('getLastActiveLesson', () => {
  it('returns most recently updated lesson', () => {
    const result = getLastActiveLesson({
      lesson01: { conceptIndex: 0, exampleIndex: 0, updatedAt: '2025-01-01T00:00:00Z' },
      lesson07: { conceptIndex: 1, exampleIndex: 2, updatedAt: '2025-06-01T00:00:00Z' },
    });
    expect(result?.lessonId).toBe('lesson07');
    expect(result?.lessonTitle).toBeTruthy();
    expect(result?.queueTotal).toBeGreaterThan(0);
  });

  it('returns null when empty', () => {
    expect(getLastActiveLesson({})).toBeNull();
  });
});
