import { describe, it, expect } from 'vitest';
import { SHOWROOM_PROGRAMS } from '../src/content/showroom/programs';

describe('showroom programs', () => {
  it('has exactly 10 programs', () => {
    expect(SHOWROOM_PROGRAMS).toHaveLength(10);
  });

  it('every program has all required fields', () => {
    for (const p of SHOWROOM_PROGRAMS) {
      expect(p.id, `${p.id}: missing id`).toBeTruthy();
      expect(p.title, `${p.id}: missing title`).toBeTruthy();
      expect(p.description, `${p.id}: missing description`).toBeTruthy();
      expect(['intermediate', 'advanced']).toContain(p.difficulty);
      expect(p.techniques.length, `${p.id}: needs at least 1 technique`).toBeGreaterThan(0);
      expect(p.code.trim().length, `${p.id}: code is empty`).toBeGreaterThan(0);
      expect(p.annotations.length, `${p.id}: needs at least 1 annotation`).toBeGreaterThan(0);
    }
  });

  it('all annotation afterLine values are within code bounds', () => {
    for (const p of SHOWROOM_PROGRAMS) {
      const lineCount = p.code.split('\n').length;
      for (const ann of p.annotations) {
        expect(
          ann.afterLine,
          `${p.id}: afterLine ${ann.afterLine} must be >= 1`,
        ).toBeGreaterThanOrEqual(1);
        expect(
          ann.afterLine,
          `${p.id}: afterLine ${ann.afterLine} exceeds ${lineCount} lines`,
        ).toBeLessThanOrEqual(lineCount);
      }
    }
  });

  it('all annotations have non-empty technique and explanation', () => {
    for (const p of SHOWROOM_PROGRAMS) {
      for (const ann of p.annotations) {
        expect(ann.technique, `${p.id}: annotation missing technique`).toBeTruthy();
        expect(ann.explanation, `${p.id}: annotation missing explanation`).toBeTruthy();
      }
    }
  });

  it('all program ids are unique', () => {
    const ids = SHOWROOM_PROGRAMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
