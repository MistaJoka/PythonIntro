import { describe, it, expect, beforeEach } from 'vitest';
import { useProgressStore } from '../src/store/progress';

describe('progress store', () => {
  beforeEach(() => {
    useProgressStore.getState().resetProgress();
  });

  it('records attempts and updates course progress', () => {
    useProgressStore.getState().recordAttempt('l1-c1-e1', 'lesson01', ['typeCoercion'], true);
    const ex = useProgressStore.getState().examples['l1-c1-e1'];
    expect(ex?.correct).toBe(true);
    expect(ex?.attempts).toBe(1);
    expect(useProgressStore.getState().courseProgress.lesson01).toBeGreaterThan(0);
  });

  it('export/import round-trips data without losing schemaVersion', () => {
    useProgressStore.getState().recordAttempt('l1-c1-e1', 'lesson01', [], true);
    useProgressStore.getState().saveSessionPosition('lesson01', 1, 2);
    useProgressStore.getState().setStrictFocus(true);
    useProgressStore.getState().saveCapstoneCode('cap-01', 'def analyze():\n    pass');
    useProgressStore.getState().recordCapstoneAttempt('cap-01', 'def analyze():\n    return 1', true);
    const exported = useProgressStore.getState().exportProgress();
    useProgressStore.getState().resetProgress();
    expect(useProgressStore.getState().examples['l1-c1-e1']).toBeUndefined();
    const ok = useProgressStore.getState().importProgress(exported);
    expect(ok).toBe(true);
    expect(useProgressStore.getState().examples['l1-c1-e1']?.correct).toBe(true);
    expect(useProgressStore.getState().sessionPosition.lesson01?.conceptIndex).toBe(1);
    expect(useProgressStore.getState().schemaVersion).toBe(4);
    expect(useProgressStore.getState().strictFocus).toBe(true);
    expect(useProgressStore.getState().capstones['cap-01']?.passed).toBe(true);
    expect(useProgressStore.getState().capstones['cap-01']?.code).toContain('return 1');
  });

  it('persists capstone code and attempt counts', () => {
    useProgressStore.getState().saveCapstoneCode('cap-02', 'def inspect():\n    pass');
    useProgressStore.getState().recordCapstoneAttempt('cap-02', 'def inspect():\n    pass', false);
    const entry = useProgressStore.getState().capstones['cap-02'];
    expect(entry?.attempts).toBe(1);
    expect(entry?.passed).toBe(false);
    expect(entry?.code).toContain('inspect');
  });

  it('tracks progress for all 16 lessons', () => {
    useProgressStore.getState().recordAttempt('l1-c1-e1', 'lesson01', [], true);
    const keys = Object.keys(useProgressStore.getState().courseProgress);
    expect(keys).toContain('lesson16');
    expect(keys.length).toBe(16);
  });
});
