import { describe, expect, it } from 'vitest';
import { getRailLocus } from '../src/components/layout/railLocus';

describe('getRailLocus', () => {
  it('returns overview for home', () => {
    expect(getRailLocus('/')).toMatchObject({ glyph: '◈', label: 'Overview', kind: 'nav' });
  });

  it('returns module number for lesson routes', () => {
    const locus = getRailLocus('/lesson/lesson01', 'lesson01');
    expect(locus.kind).toBe('module');
    expect(locus.glyph).toBe('01');
    expect(locus.label).toBe('Foundations');
  });

  it('returns capstone workspace for capstone editor', () => {
    expect(getRailLocus('/capstones/guess-game')).toMatchObject({
      glyph: '◆',
      kind: 'capstone',
    });
  });
});
