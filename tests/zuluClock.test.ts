import { describe, expect, it } from 'vitest';
import { formatZuluTime } from '../src/engine/zuluClock';

describe('formatZuluTime', () => {
  it('returns HH:MM:SSZ from a Date', () => {
    const d = new Date('2026-06-16T14:30:45.000Z');
    expect(formatZuluTime(d)).toBe('14:30:45Z');
  });
});
