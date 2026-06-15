import type { PyodideInterface } from 'pyodide';
import runPythonHelperSource from './runPythonHelper.py?raw';
import { formatFeedback, humanizePythonError, type HumanizedError } from './humanizeError';

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';

let pyodidePromise: Promise<PyodideInterface> | null = null;
let loadError: string | null = null;
let runPythonHelperReady: Promise<void> | null = null;

export interface RunPythonResult {
  stdout: string;
  stderr: string;
  error?: string;
  humanized?: HumanizedError;
}

export interface CodeChallengeResult {
  correct: boolean;
  feedback: string;
  humanized?: HumanizedError;
}

async function ensureRunPythonHelper(pyodide: PyodideInterface): Promise<void> {
  if (!runPythonHelperReady) {
    runPythonHelperReady = pyodide.runPythonAsync(runPythonHelperSource).then(() => undefined);
  }
  await runPythonHelperReady;
}

function parsePythonException(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return err instanceof Error ? err.message : String(err);
}

export async function getPyodide(): Promise<PyodideInterface> {
  if (loadError) throw new Error(loadError);
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const { loadPyodide } = await import('pyodide');
      return loadPyodide({ indexURL: PYODIDE_CDN });
    })().catch((err: unknown) => {
      loadError = err instanceof Error ? err.message : 'Failed to load Pyodide';
      pyodidePromise = null;
      throw err;
    });
  }
  return pyodidePromise;
}

export async function runPython(userCode: string): Promise<RunPythonResult> {
  try {
    const pyodide = await getPyodide();
    await ensureRunPythonHelper(pyodide);
    pyodide.globals.set('_run_user_source', userCode);
    const jsonStr = await pyodide.runPythonAsync(`
import json
json.dumps(run_user_code(_run_user_source))
`);
    const parsed = JSON.parse(String(jsonStr)) as {
      stdout: string;
      stderr: string;
      error?: string;
    };
    const humanized = parsed.error ? humanizePythonError(parsed.error) : undefined;
    return { ...parsed, humanized };
  } catch (err) {
    const raw = parsePythonException(err);
    const humanized = humanizePythonError(raw);
    return { stdout: '', stderr: '', error: raw, humanized };
  }
}

export async function runCodeChallenge(
  userCode: string,
  tests: string[],
): Promise<CodeChallengeResult> {
  try {
    const pyodide = await getPyodide();
    await pyodide.runPythonAsync(userCode);
    for (let i = 0; i < tests.length; i++) {
      try {
        await pyodide.runPythonAsync(tests[i]!);
      } catch (err) {
        const raw = parsePythonException(err);
        const humanized = humanizePythonError(raw);
        return {
          correct: false,
          feedback: formatFeedback(humanized, `Test ${i + 1} failed`),
          humanized,
        };
      }
    }
    return { correct: true, feedback: 'All tests passed!' };
  } catch (err) {
    const raw = parsePythonException(err);
    const humanized = humanizePythonError(raw);
    return {
      correct: false,
      feedback: formatFeedback(humanized, 'Runtime error'),
      humanized,
    };
  }
}

export function isPyodideLoading(): boolean {
  return pyodidePromise !== null && loadError === null;
}
