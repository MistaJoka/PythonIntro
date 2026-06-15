import { describe, it, expect } from 'vitest';
import { humanizePythonError } from '../src/engine/humanizeError';
import { shouldAllowContinue } from '../src/engine/focusGate';
import { recomputeCourseProgress } from '../src/store/progress';
import { LESSON_META } from '../src/content/registry';

describe('humanizePythonError', () => {
  it('humanizes NameError', () => {
    const result = humanizePythonError("NameError: name 'x' is not defined");
    expect(result.friendly).toContain("'x'");
    expect(result.friendly.toLowerCase()).toContain('before defining');
  });

  it('humanizes SyntaxError', () => {
    const result = humanizePythonError('SyntaxError: invalid syntax (line 2)');
    expect(result.friendly.toLowerCase()).toContain('parse');
  });

  it('humanizes AssertionError', () => {
    const result = humanizePythonError('AssertionError: assert 1 == 2');
    expect(result.friendly.toLowerCase()).toContain('assertion');
  });

  it('humanizes IndexError', () => {
    const result = humanizePythonError('IndexError: list index out of range');
    expect(result.friendly.toLowerCase()).toContain('index');
  });
});

describe('shouldAllowContinue', () => {
  it('allows continue when strict mode is off', () => {
    expect(shouldAllowContinue(false, false)).toBe(true);
    expect(shouldAllowContinue(false, true)).toBe(true);
  });

  it('requires correct answer when strict mode is on', () => {
    expect(shouldAllowContinue(true, false)).toBe(false);
    expect(shouldAllowContinue(true, true)).toBe(true);
  });
});

describe('recomputeCourseProgress', () => {
  it('includes all 16 lessons from LESSON_META', () => {
    const progress = recomputeCourseProgress({});
    expect(Object.keys(progress)).toHaveLength(LESSON_META.length);
    for (const meta of LESSON_META) {
      expect(progress[meta.id]).toBe(0);
    }
  });
});
