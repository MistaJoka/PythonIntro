import { loadPyodide, version as PYODIDE_PACKAGE_VERSION, type PyodideInterface } from 'pyodide';
import runPythonHelperSource from './runPythonHelper.py?raw';
import { formatFeedback, humanizePythonError, type HumanizedError } from './humanizeError';

/** Must match the installed `pyodide` npm package — Pyodide rejects mismatched indexURL. */
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_PACKAGE_VERSION}/full/`;

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

export function humanizePyodideLoadError(raw: string): HumanizedError {
  if (raw.includes('Pyodide version does not match')) {
    return {
      short: 'Python runtime version mismatch',
      friendly:
        'The in-browser Python runtime could not start because its files do not match the app version. Refresh the page; if this persists, clear cache and reload.',
      raw,
    };
  }
  if (
    raw.includes('Failed to fetch dynamically imported module') ||
    raw.includes('Failed to load') ||
    raw.includes('fetch')
  ) {
    return {
      short: 'Python runtime failed to download',
      friendly:
        'Could not download the in-browser Python runtime (Pyodide). Check your network connection and try again.',
      raw,
    };
  }
  return {
    short: 'Python runtime unavailable',
    friendly: 'The in-browser Python runtime failed to start. Refresh and try again.',
    raw,
  };
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

/** Reset loader state — for tests only. */
export function resetPyodideLoaderForTests(): void {
  pyodidePromise = null;
  loadError = null;
  runPythonHelperReady = null;
}

export async function getPyodide(): Promise<PyodideInterface> {
  if (loadError) throw new Error(loadError);
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide({ indexURL: PYODIDE_INDEX_URL }).catch((err: unknown) => {
      loadError = parsePythonException(err);
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
    const humanized =
      raw === loadError || raw.includes('Pyodide') || raw.includes('fetch')
        ? humanizePyodideLoadError(raw)
        : humanizePythonError(raw);
    return { stdout: '', stderr: '', error: raw, humanized };
  }
}

export async function runCodeChallenge(
  userCode: string,
  tests: string[],
): Promise<CodeChallengeResult> {
  try {
    const pyodide = await getPyodide();
    await ensureRunPythonHelper(pyodide);
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
    const humanized =
      raw === loadError || raw.includes('Pyodide') || raw.includes('fetch')
        ? humanizePyodideLoadError(raw)
        : humanizePythonError(raw);
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

export { PYODIDE_PACKAGE_VERSION };
