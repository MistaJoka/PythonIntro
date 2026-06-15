import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const collectorPath = path.join(root, 'src/engine/traceCollector.py');

function runCollector(source: string): { steps: { line: number; vars: Record<string, string>; changed: string[] }[]; error?: string } {
  const script = `${readFileSync(collectorPath, 'utf8')}\nimport json\nprint(json.dumps(collect_trace(${JSON.stringify(source)})))`;
  const stdout = execFileSync('python3', ['-c', script], { encoding: 'utf8' });
  return JSON.parse(stdout) as {
    steps: { line: number; vars: Record<string, string>; changed: string[] }[];
    error?: string;
  };
}

describe('traceCollector (custom sys.settrace)', () => {
  it('traces a for-loop sum with accumulator updates', () => {
    const code = 'total = 0\nfor n in [1, 2, 3]:\n    total += n';
    const { steps, error } = runCollector(code);

    expect(error).toBeUndefined();
    expect(steps.length).toBeGreaterThan(3);
    expect(steps.some((s) => s.vars.total === '3')).toBe(true);
    expect(steps.some((s) => s.vars.total === '6')).toBe(true);
  });

  it('returns syntax errors without throwing', () => {
    const { steps, error } = runCollector('for x in\n');
    expect(steps).toEqual([]);
    expect(error).toMatch(/SyntaxError/);
  });

  it('marks changed variables per step', () => {
    const { steps } = runCollector('x = 1\nx = 2');
    const assigned = steps.find((s) => s.changed.includes('x'));
    expect(assigned?.vars.x).toBe('1');
  });
});
