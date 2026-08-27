// @vitest-environment node
/**
 * Proves the authored ML-bridge challenges are actually solvable.
 *
 * Content is pulled from the registry rather than pasted here, so this fails if
 * a challenge's tests drift from something a learner can satisfy. A challenge
 * whose hidden tests cannot pass is worse than a missing one — the learner
 * assumes they are wrong. Each case also runs a deliberately wrong solution, so
 * a test that vacuously passes anything is caught too.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import {
  runCodeChallenge,
  getPyodide,
  setPyodideIndexUrlForTests,
} from '../src/engine/pyodide';
import { getExampleById } from '../src/content/registry';

const BOOT_TIMEOUT = 180_000;
const LOCAL_PYODIDE_DIST = fileURLToPath(new URL('../node_modules/pyodide/', import.meta.url));

/** Pull a codeChallenge out of the shipped content by id. */
function challenge(id: string) {
  const found = getExampleById(id);
  if (!found) throw new Error(`example ${id} not found in registry`);
  const ex = found.example;
  if (ex.type !== 'codeChallenge') throw new Error(`example ${id} is ${ex.type}, not codeChallenge`);
  return ex;
}

describe('every requires-declaring challenge is wired to load its packages', () => {
  /*
   * Regression guard. runCodeChallenge/runPython take `requires` as an optional
   * third argument, so a call site that forgets it still compiles and still
   * passes every engine-level test — then fails in the browser with
   * "ModuleNotFoundError: No module named 'pandas'". That is exactly what
   * happened. Assert the editor components forward the field.
   */
  it('CodeChallengeEditor forwards example.requires to both RUN and CHECK', async () => {
    const source = await readFile(
      fileURLToPath(new URL('../src/components/examples/CodeChallengeEditor.tsx', import.meta.url)),
      'utf8',
    );
    expect(source).toContain('runCodeChallenge(code, example.tests, example.requires ?? [])');
    expect(source).toContain('runPython(code, example.requires ?? [])');
  });
});

describe('ML bridge content is solvable', () => {
  beforeAll(async () => {
    setPyodideIndexUrlForTests(LOCAL_PYODIDE_DIST);
    await getPyodide();
  }, BOOT_TIMEOUT);

  it('ml1-c1-e2 (boolean mask) passes with a correct solution', async () => {
    const ex = challenge('ml1-c1-e2');
    const solution = ex.starterCode.replace(
      /def high_risk\(df\):[\s\S]*$/,
      'def high_risk(df):\n' +
        '    return df[(df["amount"] > 1000) & (df["failed_attempts"] >= 3)]\n',
    );
    const result = await runCodeChallenge(solution, ex.tests, ex.requires ?? []);
    expect(result.feedback).toBe('All tests passed!');
    expect(result.correct).toBe(true);
  }, BOOT_TIMEOUT);

  it('ml1-c1-e2 rejects a mask that drops the failed_attempts condition', async () => {
    const ex = challenge('ml1-c1-e2');
    const wrong = ex.starterCode.replace(
      /def high_risk\(df\):[\s\S]*$/,
      'def high_risk(df):\n    return df[df["amount"] > 1000]\n',
    );
    const result = await runCodeChallenge(wrong, ex.tests, ex.requires ?? []);
    expect(result.correct).toBe(false);
  }, BOOT_TIMEOUT);

  it('ml1-c1-e2 rejects returning the mask instead of the rows', async () => {
    const ex = challenge('ml1-c1-e2');
    const wrong = ex.starterCode.replace(
      /def high_risk\(df\):[\s\S]*$/,
      'def high_risk(df):\n    return (df["amount"] > 1000) & (df["failed_attempts"] >= 3)\n',
    );
    const result = await runCodeChallenge(wrong, ex.tests, ex.requires ?? []);
    expect(result.correct).toBe(false);
  }, BOOT_TIMEOUT);

  it('ml1-c1-e3 (printed country counts) passes with a correct solution', async () => {
    const ex = challenge('ml1-c1-e3');
    const solution = `${ex.starterCode}
for country, n in df["country"].value_counts().items():
    print(f"{country}: {n}")
`;
    const result = await runCodeChallenge(solution, ex.tests, ex.requires ?? []);
    expect(result.feedback).toBe('All tests passed!');
    expect(result.correct).toBe(true);
  }, BOOT_TIMEOUT);

  it('ml1-c1-e3 rejects computing the counts without printing them', async () => {
    const ex = challenge('ml1-c1-e3');
    const wrong = `${ex.starterCode}\ncounts = df["country"].value_counts()\n`;
    const result = await runCodeChallenge(wrong, ex.tests, ex.requires ?? []);
    expect(result.correct).toBe(false);
  }, BOOT_TIMEOUT);

  it('ml1-c1-e3 rejects unsorted output (US must lead)', async () => {
    const ex = challenge('ml1-c1-e3');
    const wrong = `${ex.starterCode}
for country in ["BR", "CA", "US"]:
    print(f"{country}: {(df['country'] == country).sum()}")
`;
    const result = await runCodeChallenge(wrong, ex.tests, ex.requires ?? []);
    expect(result.correct).toBe(false);
  }, BOOT_TIMEOUT);
});
