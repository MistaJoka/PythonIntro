// @vitest-environment node
/**
 * Real-runtime integration tests for the ML bridge tier.
 *
 * These boot actual Pyodide rather than mocking it, because the two things
 * under test — that hidden tests can see the learner's definitions, and that
 * they can also assert on printed output — are precisely the behaviours a mock
 * would paper over. jsdom cannot host Pyodide, hence the node environment.
 *
 * The first run downloads wheels from the CDN and caches them into
 * node_modules; later runs are fast.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import {
  runCodeChallenge,
  ensurePackages,
  getPyodide,
  setPyodideIndexUrlForTests,
} from '../src/engine/pyodide';

const BOOT_TIMEOUT = 180_000;

/** Pyodide resolves indexURL as a path under Node, so use the local dist. */
const LOCAL_PYODIDE_DIST = fileURLToPath(new URL('../node_modules/pyodide/', import.meta.url));

describe('runCodeChallenge — real Pyodide', () => {
  beforeAll(async () => {
    setPyodideIndexUrlForTests(LOCAL_PYODIDE_DIST);
    await getPyodide();
  }, BOOT_TIMEOUT);

  // --- regression net for the 76 existing "write a function" challenges ---
  it('grades a function-definition challenge by calling it', async () => {
    const result = await runCodeChallenge(
      'def calculate_average(values):\n    return sum(values) / len(values)',
      ['assert calculate_average([2, 4, 6]) == 4'],
    );
    expect(result.correct).toBe(true);
    expect(result.feedback).toBe('All tests passed!');
  }, BOOT_TIMEOUT);

  it('fails that shape when the logic is wrong, naming the test index', async () => {
    const result = await runCodeChallenge(
      'def calculate_average(values):\n    return sum(values)',
      ['assert calculate_average([2, 4, 6]) == 4'],
    );
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain('Test 1');
  }, BOOT_TIMEOUT);

  // --- the new capability: asserting on printed output ---
  it('exposes captured stdout to tests as _stdout', async () => {
    const userCode = [
      'transactions = [{"country": "US"}, {"country": "US"}, {"country": "BR"}]',
      'counts = {}',
      'for t in transactions:',
      '    counts[t["country"]] = counts.get(t["country"], 0) + 1',
      'for k, v in counts.items():',
      '    print(f"{k}: {v}")',
    ].join('\n');

    const result = await runCodeChallenge(userCode, [
      'assert "US: 2" in _stdout, f"expected US: 2, got {_stdout!r}"',
      'assert "BR: 1" in _stdout',
    ]);
    expect(result.correct).toBe(true);
  }, BOOT_TIMEOUT);

  it('fails a print-shaped challenge when the printed output is wrong', async () => {
    const result = await runCodeChallenge('print("US: 99")', ['assert "US: 2" in _stdout']);
    expect(result.correct).toBe(false);
  }, BOOT_TIMEOUT);

  it('reports a syntax error in learner-friendly prose, keeping the raw error', async () => {
    const result = await runCodeChallenge('def broken(:\n    pass', ['assert True']);
    expect(result.correct).toBe(false);
    // The Error Coach rewrites the traceback for the learner...
    expect(result.feedback.toLowerCase()).toMatch(/could not parse|colons|indentation/);
    // ...but must never discard the original (handoff: never hide the real error).
    expect(result.humanized?.raw).toContain('SyntaxError');
  }, BOOT_TIMEOUT);

  it('reports a runtime error raised by the learner code', async () => {
    const result = await runCodeChallenge('raise ValueError("boom")', ['assert True']);
    expect(result.correct).toBe(false);
    expect(result.humanized?.raw ?? result.feedback).toContain('ValueError');
  }, BOOT_TIMEOUT);
});

describe('ensurePackages — on-demand ML wheels', () => {
  it('loads pandas and grades a real DataFrame challenge', async () => {
    await ensurePackages(['pandas']);

    const userCode = [
      'import pandas as pd',
      'df = pd.DataFrame({',
      '    "amount": [45.50, 1800.00, 220.25, 3200.00, 88.99],',
      '    "failed_attempts": [0, 4, 1, 6, 0],',
      '})',
      'def high_risk(df):',
      '    return df[(df["amount"] > 1000) & (df["failed_attempts"] >= 3)]',
    ].join('\n');

    const result = await runCodeChallenge(
      userCode,
      ['assert len(high_risk(df)) == 2', 'assert list(high_risk(df)["amount"]) == [1800.0, 3200.0]'],
      ['pandas'],
    );
    expect(result.correct).toBe(true);
  }, BOOT_TIMEOUT);

  it('is idempotent — repeat calls do not reload the wheel', async () => {
    await expect(ensurePackages(['pandas'])).resolves.toBeUndefined();
    await expect(ensurePackages([])).resolves.toBeUndefined();
  }, BOOT_TIMEOUT);
});
