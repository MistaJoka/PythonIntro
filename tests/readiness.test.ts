import { describe, it, expect } from 'vitest';
import { computeReadinessScore } from '../src/engine/readiness';

describe('readiness', () => {
  it('returns 0 with empty state', () => {
    expect(
      computeReadinessScore({ examples: {}, lessonChecks: {}, diagnostic: null }),
    ).toBe(0);
  });

  it('weights course completion and lesson checks', () => {
    const score = computeReadinessScore({
      examples: {},
      lessonChecks: { lesson01: { score: 80 } },
      diagnostic: null,
    });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('includes diagnostic in score', () => {
    const without = computeReadinessScore({
      examples: {},
      lessonChecks: {},
      diagnostic: null,
    });
    const withDiag = computeReadinessScore({
      examples: {},
      lessonChecks: {},
      diagnostic: { tagScores: { scope: 1 } },
    });
    expect(withDiag).toBeGreaterThan(without);
  });
});
