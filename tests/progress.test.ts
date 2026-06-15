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
    const exported = useProgressStore.getState().exportProgress();
    useProgressStore.getState().resetProgress();
    expect(useProgressStore.getState().examples['l1-c1-e1']).toBeUndefined();
    const ok = useProgressStore.getState().importProgress(exported);
    expect(ok).toBe(true);
    expect(useProgressStore.getState().examples['l1-c1-e1']?.correct).toBe(true);
    expect(useProgressStore.getState().sessionPosition.lesson01?.conceptIndex).toBe(1);
    expect(useProgressStore.getState().schemaVersion).toBe(3);
    expect(useProgressStore.getState().strictFocus).toBe(true);
  });

  it('tracks progress for all 16 lessons', () => {
    useProgressStore.getState().recordAttempt('l1-c1-e1', 'lesson01', [], true);
    const keys = Object.keys(useProgressStore.getState().courseProgress);
    expect(keys).toContain('lesson16');
    expect(keys.length).toBe(16);
  });
});
