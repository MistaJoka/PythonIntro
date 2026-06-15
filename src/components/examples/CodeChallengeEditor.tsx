import { useCallback, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import type { Example } from '../../content/schema';
import { runCodeChallenge, runPython } from '../../engine/pyodide';
import type { HumanizedError } from '../../engine/humanizeError';
import { runWithTrace, type TraceStep } from '../../engine/traceRunner';
import { CodeRunnerToolbar } from '../CodeRunnerToolbar';
import { OutputPanel } from '../OutputPanel';
import { RunFeedback } from '../RunFeedback';
import { TracePanel } from '../TracePanel';

interface CodeChallengeEditorProps {
  example: Extract<Example, { type: 'codeChallenge' }>;
  onResult: (correct: boolean, feedback: string) => void;
  disabled?: boolean;
  trapNote?: string;
  explanation?: string;
}

export function CodeChallengeEditor({
  example,
  onResult,
  disabled,
  trapNote,
  explanation,
}: CodeChallengeEditorProps) {
  const [code, setCode] = useState(example.starterCode);
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
  const [passed, setPassed] = useState(false);
  const [attempts, setAttempts] = useState(0);

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
      const msg = err instanceof Error ? err.message : 'Run failed';
      setFeedback(msg);
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
      const result = await runCodeChallenge(code, example.tests);
      setFeedback(result.feedback);
      setHumanized(result.humanized);
      setPassed(result.correct);
      onResult(result.correct, result.feedback);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Run failed';
      setFeedback(msg);
      setHumanized(undefined);
      onResult(false, msg);
    } finally {
      setTesting(false);
    }
  }, [attempts, code, example.tests, onResult]);

  const showTrap = !passed && attempts >= 1 && trapNote;
  const showTestHint = !passed && attempts >= 2 && example.tests[0];
  const showExplanation = !passed && attempts >= 3 && explanation;

  return (
    <div className="code-challenge">
      <CodeMirror
        value={code}
        height="180px"
        extensions={[python()]}
        onChange={(v) => setCode(v)}
        editable={!disabled && !passed}
        theme="dark"
        basicSetup={{ lineNumbers: true, foldGutter: false }}
      />
      <CodeRunnerToolbar
        activePanel={activePanel}
        running={running}
        tracing={tracing}
        testing={testing}
        disabled={disabled}
        testsPassed={passed}
        onRun={handleRun}
        onTrace={handleTrace}
        onTests={handleTests}
      />
      {activePanel === 'output' && !running && <OutputPanel stdout={stdout} stderr={stderr} />}
      {activePanel === 'trace' && (
        tracing ? (
          <p className="hint-text">Tracing execution…</p>
        ) : (
          <TracePanel code={code} steps={traceSteps} error={traceError} />
        )
      )}
      {showTrap && <p className="trap-note">⚡ {trapNote}</p>}
      {showTestHint && (
        <p className="hint-text">First test expects: <code>{example.tests[0]}</code></p>
      )}
      {showExplanation && <p className="hint-text">{explanation}</p>}
      {!showTrap && !passed && example.solutionHint && attempts === 0 && (
        <p className="hint-text">Hint unlocks after your first failed run.</p>
      )}
      {feedback && !testing && (
        <>
          <RunFeedback message={feedback} passed={passed} humanized={humanized} />
          {!passed && attempts >= 1 && example.solutionHint && (
            <p className="hint-text">Hint: {example.solutionHint}</p>
          )}
        </>
      )}
    </div>
  );
}
