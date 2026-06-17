import { describe, it, expect } from 'vitest';
import {
  buildStepSummary,
  computeChangedVars,
  describeStepAction,
  inferVarType,
  varDelta,
} from '../src/engine/executionTrace';

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

describe('inferVarType', () => {
  it('infers common Python literals', () => {
    expect(inferVarType('10')).toBe('int');
    expect(inferVarType('3.5')).toBe('float');
    expect(inferVarType('"Ada"')).toBe('str');
    expect(inferVarType('True')).toBe('bool');
    expect(inferVarType('[1, 2]')).toBe('list');
  });
});

describe('buildStepSummary', () => {
  it('describes assignment with type and expression', () => {
    const code = 'a = 5';
    const steps = [{ line: 1, vars: { a: '5' } }];
    expect(buildStepSummary(code, 0, steps)).toMatchObject({
      action: 'Assignment',
      source: 'a = 5',
      effect: expect.stringContaining('Binds a to int 5'),
    });
    expect(buildStepSummary(code, 0, steps).effect).toContain('`5`');
  });

  it('describes print output added this step', () => {
    const code = 'print(a + b)\nprint("sum:", a + b)';
    const steps = [
      { line: 1, vars: { a: '5', b: '2' }, output: '7\n' },
      { line: 2, vars: { a: '5', b: '2' }, output: '7\nsum: 7\n' },
    ];
    expect(buildStepSummary(code, 0, steps).effect).toBe('Writes "7" to stdout.');
    expect(buildStepSummary(code, 1, steps).effect).toBe('Writes "sum: 7" to stdout.');
  });

  it('shows exact source line for print', () => {
    const code = 'print("sum:", a + b)';
    const steps = [{ line: 1, vars: {}, output: 'sum: 7\n' }];
    expect(buildStepSummary(code, 0, steps).source).toBe('print("sum:", a + b)');
  });
});

describe('describeStepAction', () => {
  it('wraps buildStepSummary', () => {
    const steps = [{ line: 1, vars: { x: '10' } }];
    expect(describeStepAction('x = 10', 0, steps)).toMatch(/^Assignment:/);
  });
});

describe('varDelta', () => {
  it('shows new bindings', () => {
    expect(varDelta({}, 'x', '10')).toBe('new → 10');
  });

  it('shows updates', () => {
    expect(varDelta({ x: '1' }, 'x', '2')).toBe('1 → 2');
  });

  it('returns null when unchanged', () => {
    expect(varDelta({ x: '1' }, 'x', '1')).toBeNull();
  });
});
