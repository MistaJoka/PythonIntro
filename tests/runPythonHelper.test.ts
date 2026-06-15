import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const helperPath = path.join(root, 'src/engine/runPythonHelper.py');

function runHelper(source: string): { stdout: string; stderr: string; error?: string } {
  const script = `${readFileSync(helperPath, 'utf8')}\nimport json\nprint(json.dumps(run_user_code(${JSON.stringify(source)})))`;
  const stdout = execFileSync('python3', ['-c', script], { encoding: 'utf8' });
  return JSON.parse(stdout) as { stdout: string; stderr: string; error?: string };
}

describe('runPythonHelper', () => {
  it('captures print output in isolated namespace', () => {
    const result = runHelper('print("hello")');
    expect(result.stdout.trim()).toBe('hello');
    expect(result.error).toBeUndefined();
  });

  it('does not bleed globals between runs', () => {
    runHelper('x = 99');
    const result = runHelper('print(x)');
    expect(result.error).toMatch(/NameError/);
  });
});
