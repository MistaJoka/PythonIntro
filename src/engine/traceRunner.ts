import type { PyodideInterface } from 'pyodide';
import traceCollectorSource from './traceCollector.py?raw';
import { getPyodide, humanizePyodideLoadError } from './pyodide';

export interface TraceStep {
  line: number;
  vars: Record<string, string>;
  changed: string[];
}

export interface TraceResult {
  steps: TraceStep[];
  error?: string;
  loadError?: boolean;
}

let traceCollectorReady: Promise<void> | null = null;

async function ensureTraceCollector(pyodide: PyodideInterface): Promise<void> {
  if (!traceCollectorReady) {
    traceCollectorReady = pyodide.runPythonAsync(traceCollectorSource).then(() => undefined);
  }
  await traceCollectorReady;
}

function parseException(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function runWithTrace(userCode: string): Promise<TraceResult> {
  try {
    const pyodide = await getPyodide();
    await ensureTraceCollector(pyodide);
    pyodide.globals.set('_trace_user_source', userCode);
    const jsonStr = await pyodide.runPythonAsync(`
import json
json.dumps(collect_trace(_trace_user_source))
`);
    const parsed = JSON.parse(String(jsonStr)) as TraceResult;
    return {
      steps: parsed.steps ?? [],
      error: parsed.error,
    };
  } catch (err) {
    const raw = parseException(err);
    const loadFailure =
      raw.includes('Pyodide') ||
      raw.includes('fetch') ||
      raw.includes('Failed to load') ||
      raw.includes('dynamically imported module');
    return {
      steps: [],
      error: loadFailure ? humanizePyodideLoadError(raw).friendly : raw,
      loadError: loadFailure,
    };
  }
}
