import { useCallback, useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import type { CapstoneProject } from '../../content/capstones/schema';
import { runCodeChallenge, runPython } from '../../engine/pyodide';
import type { HumanizedError } from '../../engine/humanizeError';
import { runWithTrace, type TraceStep } from '../../engine/traceRunner';
import { useProgressStore } from '../../store/progress';
import { CodeRunnerToolbar } from '../CodeRunnerToolbar';
import { OutputPanel } from '../OutputPanel';
import { RunFeedback } from '../RunFeedback';
import { TracePanel } from '../TracePanel';

interface CapstoneEditorProps {
  project: CapstoneProject;
}

export function CapstoneEditor({ project }: CapstoneEditorProps) {
  const saved = useProgressStore((s) => s.capstones[project.id]);
  const saveCapstoneCode = useProgressStore((s) => s.saveCapstoneCode);
  const recordCapstoneAttempt = useProgressStore((s) => s.recordCapstoneAttempt);

  const [code, setCode] = useState(() => saved?.code ?? project.starterCode);
  const [running, setRunning] = useState(false);
  const [tracing, setTracing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activePanel, setActivePanel] = useState<'output' | 'trace' | null>(null);
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [humanized, setHumanized] = useState<HumanizedError | undefined>();
  const [passed, setPassed] = useState(() => saved?.passed ?? false);
  const [attempts, setAttempts] = useState(() => saved?.attempts ?? 0);

  useEffect(() => {
    const timer = window.setTimeout(() => saveCapstoneCode(project.id, code), 400);
    return () => window.clearTimeout(timer);
  }, [code, project.id, saveCapstoneCode]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setActivePanel('output');
    setStdout('');
    setStderr('');
    setFeedback(null);
    setHumanized(undefined);
    try {
      const result = await runPython(code);
      setStdout(result.stdout);
      setStderr(result.stderr);
      if (result.error) {
        setFeedback(result.humanized?.friendly ?? result.error);
        setHumanized(result.humanized);
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Run failed');
    } finally {
      setRunning(false);
    }
  }, [code]);

  const handleTrace = useCallback(async () => {
    setTracing(true);
    setActivePanel('trace');
    setTraceSteps([]);
    setTraceError(null);
    try {
      const result = await runWithTrace(code);
      setTraceSteps(result.steps);
      setTraceError(result.error ?? null);
    } catch (err) {
      setTraceError(err instanceof Error ? err.message : 'Trace failed');
    } finally {
      setTracing(false);
    }
  }, [code]);

  const handleTests = useCallback(async () => {
    setTesting(true);
    setActivePanel(null);
    setFeedback('Loading Python runtime…');
    const attemptNum = attempts + 1;
    setAttempts(attemptNum);
    try {
      const result = await runCodeChallenge(code, project.tests);
      setFeedback(result.feedback);
      setHumanized(result.humanized);
      setPassed(result.correct);
      recordCapstoneAttempt(project.id, code, result.correct);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Run failed');
      setHumanized(undefined);
      recordCapstoneAttempt(project.id, code, false);
    } finally {
      setTesting(false);
    }
  }, [attempts, code, project.id, project.tests, recordCapstoneAttempt]);

  const handleResetStarter = useCallback(() => {
    setCode(project.starterCode);
    saveCapstoneCode(project.id, project.starterCode);
  }, [project.id, project.starterCode, saveCapstoneCode]);

  const showHint = !passed && attempts >= 2 && project.solutionHint;

  return (
    <div className="capstone-editor">
      {saved?.passed && (
        <p className="capstone-complete-banner">Project complete — your solution is saved.</p>
      )}
      <CodeMirror
        value={code}
        height="320px"
        extensions={[python()]}
        onChange={(v) => setCode(v)}
        editable={!passed}
        theme="dark"
        basicSetup={{ lineNumbers: true, foldGutter: false }}
      />
      <CodeRunnerToolbar
        activePanel={activePanel}
        running={running}
        tracing={tracing}
        testing={testing}
        testsPassed={passed}
        onRun={handleRun}
        onTrace={handleTrace}
        onTests={handleTests}
        extraActions={
          !passed ? (
            <button type="button" className="btn-secondary" onClick={handleResetStarter}>
              Reset starter
            </button>
          ) : undefined
        }
      />
      {activePanel === 'output' && !running && <OutputPanel stdout={stdout} stderr={stderr} />}
      {activePanel === 'trace' && (
        tracing ? (
          <p className="hint-text">Tracing execution…</p>
        ) : (
          <TracePanel code={code} steps={traceSteps} error={traceError} />
        )
      )}
      {showHint && <p className="hint-text">Hint: {project.solutionHint}</p>}
      {feedback && !testing && (
        <RunFeedback message={feedback} passed={passed} humanized={humanized} />
      )}
    </div>
  );
}
