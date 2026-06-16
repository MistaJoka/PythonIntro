import { describe, it, expect } from 'vitest';
import { computeChangedVars } from '../src/engine/executionTrace';

describe('computeChangedVars', () => {
  const steps = [
    { line: 1, vars: { x: '1' } },
    { line: 2, vars: { x: '1', y: '2' } },
    { line: 2, vars: { x: '3', y: '2' } },
  ];

  it('marks all vars as changed on first step', () => {
    expect(computeChangedVars(steps, 0)).toEqual(['x']);
  });

  it('detects newly added variables', () => {
    expect(computeChangedVars(steps, 1)).toEqual(['y']);
  });

  it('detects value updates', () => {
    expect(computeChangedVars(steps, 2)).toEqual(['x']);
  });
});
