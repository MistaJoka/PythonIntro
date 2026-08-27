import { loadPyodide, version as PYODIDE_PACKAGE_VERSION, type PyodideInterface } from 'pyodide';
import runPythonHelperSource from './runPythonHelper.py?raw';
import { formatFeedback, humanizePythonError, type HumanizedError } from './humanizeError';

/** Must match the installed `pyodide` npm package — Pyodide rejects mismatched indexURL. */
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_PACKAGE_VERSION}/full/`;

let pyodidePromise: Promise<PyodideInterface> | null = null;
let loadError: string | null = null;
let runPythonHelperReady: Promise<void> | null = null;
/** One in-flight/settled promise per package name, so a wheel downloads once per session. */
const packagePromises = new Map<string, Promise<void>>();

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
  packagePromises.clear();
}

export function humanizePackageLoadError(raw: string, packages: string[]): HumanizedError {
  return {
    short: 'Data libraries unavailable',
    friendly:
      `Could not download the Python data libraries needed for this challenge ` +
      `(${packages.join(', ')}). These are larger downloads than the rest of the ` +
      `course — check your connection and try again.`,
    raw,
  };
}

/**
 * Load Pyodide packages on demand, once each per session.
 *
 * Deliberately opt-in per challenge rather than loaded up front: the ML wheel
 * set is ~34MB (scipy alone is ~13MB), and the Intro lessons need none of it.
 * A pandas-only challenge pays ~7MB; only the scikit-learn challenges pay full
 * freight. Callers pass the challenge's `requires` list.
 */
export async function ensurePackages(packages: string[]): Promise<void> {
  if (packages.length === 0) return;
  const pyodide = await getPyodide();
  await Promise.all(
    packages.map((name) => {
      let pending = packagePromises.get(name);
      if (!pending) {
        pending = pyodide.loadPackage(name).then(
          () => undefined,
          (err: unknown) => {
            // Drop the rejected promise so a later retry can succeed.
            packagePromises.delete(name);
            throw err;
          },
        );
        packagePromises.set(name, pending);
      }
      return pending;
    }),
  );
}

/**
 * Overrides the runtime location. The browser must use the CDN, but Pyodide
 * resolves indexURL as a filesystem path under Node, so integration tests point
 * this at the local node_modules dist. Unset in production — the default below
 * is what ships, and pyodide.test.ts guards that it matches the npm version.
 */
let indexUrlOverride: string | null = null;

/** Point the loader at a local Pyodide dist — for Node-based tests only. */
export function setPyodideIndexUrlForTests(url: string | null): void {
  indexUrlOverride = url;
}

export async function getPyodide(): Promise<PyodideInterface> {
  if (loadError) throw new Error(loadError);
  if (!pyodidePromise) {
    const indexURL = indexUrlOverride ?? PYODIDE_INDEX_URL;
    pyodidePromise = loadPyodide({ indexURL }).catch((err: unknown) => {
      loadError = parsePythonException(err);
      pyodidePromise = null;
      throw err;
    });
  }
  return pyodidePromise;
}

export async function runPython(
  userCode: string,
  requires: string[] = [],
): Promise<RunPythonResult> {
  try {
    const pyodide = await getPyodide();
    await ensureRunPythonHelper(pyodide);
    if (requires.length > 0) {
      try {
        await ensurePackages(requires);
      } catch (err) {
        const raw = parsePythonException(err);
        return {
          stdout: '',
          stderr: '',
          error: raw,
          humanized: humanizePackageLoadError(raw, requires),
        };
      }
    }
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
  requires: string[] = [],
): Promise<CodeChallengeResult> {
  try {
    const pyodide = await getPyodide();
    await ensureRunPythonHelper(pyodide);
    if (requires.length > 0) {
      try {
        await ensurePackages(requires);
      } catch (err) {
        const humanized = humanizePackageLoadError(parsePythonException(err), requires);
        return { correct: false, feedback: formatFeedback(humanized, 'Setup failed'), humanized };
      }
    }

    // Run the learner's code through the capturing helper rather than
    // runPythonAsync directly: definitions still land in the global namespace
    // for the tests below, but printed output is captured too, so a test can
    // assert on stdout via the `_stdout` global.
    pyodide.globals.set('_run_user_source', userCode);
    const runJson = await pyodide.runPythonAsync(`
import json
json.dumps(run_user_code_in_globals(_run_user_source))
`);
    const run = JSON.parse(String(runJson)) as {
      stdout: string;
      stderr: string;
      error?: string;
    };
    if (run.error) {
      const humanized = humanizePythonError(run.error);
      return { correct: false, feedback: formatFeedback(humanized, 'Runtime error'), humanized };
    }
    pyodide.globals.set('_stdout', run.stdout);

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
