import { describe, it, expect } from 'vitest';
import { updateSrsQueue, getDueExampleIds } from '../src/engine/srs';

describe('srs', () => {
  it('adds wrong answer to queue immediately', () => {
    const q = updateSrsQueue([], 'ex1', false);
    expect(q).toHaveLength(1);
    expect(q[0]!.exampleId).toBe('ex1');
    expect(q[0]!.intervalDays).toBe(1);
  });

  it('doubles interval on correct answer', () => {
    const start = updateSrsQueue([], 'ex1', false);
    const after = updateSrsQueue(start, 'ex1', true, new Date('2026-01-01T00:00:00Z'));
    expect(after[0]!.intervalDays).toBe(2);
    const due = new Date(after[0]!.dueDate);
    expect(due.getUTCDate()).toBe(3);
  });

  it('returns due ids when dueDate passed', () => {
    const q = [{ exampleId: 'a', dueDate: '2020-01-01T00:00:00Z', intervalDays: 1 }];
    expect(getDueExampleIds(q, new Date('2026-01-01'))).toEqual(['a']);
  });
});
