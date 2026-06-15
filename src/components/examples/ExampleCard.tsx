import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import type { Example } from '../../content/schema';
import { gradeExample } from '../../engine/grader';
import { shouldAllowContinue } from '../../engine/focusGate';
import { useProgressStore } from '../../store/progress';
import { StateVisualizer } from '../StateVisualizer';
import { runWithTrace, type TraceStep } from '../../engine/traceRunner';
import { TracePanel } from '../TracePanel';

const CodeChallengeEditor = lazy(() =>
  import('./CodeChallengeEditor').then((m) => ({ default: m.CodeChallengeEditor })),
);
const OrderLinesEditor = lazy(() =>
  import('./OrderLinesEditor').then((m) => ({ default: m.OrderLinesEditor })),
);
const MatchPairsEditor = lazy(() =>
  import('./MatchPairsEditor').then((m) => ({ default: m.MatchPairsEditor })),
);
const DragBlankEditor = lazy(() =>
  import('./DragBlankEditor').then((m) => ({ default: m.DragBlankEditor })),
);

function EditorFallback() {
  return <p className="editor-loading">Loading activity…</p>;
}

function TraceStepsLiveTrace({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const [tracing, setTracing] = useState(false);
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleTrace = useCallback(async () => {
    setOpen(true);
    setTracing(true);
    setSteps([]);
    setError(null);
    try {
      const result = await runWithTrace(code);
      setSteps(result.steps);
      setError(result.error ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trace failed');
    } finally {
      setTracing(false);
    }
  }, [code]);

  return (
    <div className="trace-steps-live">
      <button type="button" className="btn-secondary btn-text" onClick={handleTrace} disabled={tracing}>
        {tracing ? 'Tracing…' : 'Live trace this code'}
      </button>
      {open && (
        tracing ? (
          <p className="hint-text">Tracing execution…</p>
        ) : (
          <TracePanel code={code} steps={steps} error={error} />
        )
      )}
    </div>
  );
}

function McOptions({
  exampleId,
  options,
  answer,
  focusMode,
  locked,
  onSelect,
}: {
  exampleId: string;
  options: string[];
  answer: string | number;
  focusMode: boolean;
  locked: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="mc-options">
      {options.map((opt, i) => (
        <label key={i} className={`mc-option ${answer === i ? 'selected' : ''}`}>
          <input
            type="radio"
            name={exampleId}
            checked={answer === i}
            onChange={() => onSelect(i)}
            disabled={locked}
          />
          <span className="mc-key">{focusMode ? `${i + 1}.` : ''}</span>
          {opt}
        </label>
      ))}
    </div>
  );
}

interface ExampleCardProps {
  example: Example;
  lessonId: string;
  examMode?: boolean;
  focusMode?: boolean;
  showCompactHeader?: boolean;
  onExamAnswer?: (correct: boolean) => void;
  onReadyToContinue?: () => void;
  onRetry?: () => void;
  onSubmitResult?: (correct: boolean) => void;
  strictFocus?: boolean;
}

export function ExampleCard({
  example,
  lessonId,
  examMode = false,
  focusMode = false,
  showCompactHeader = false,
  onExamAnswer,
  onReadyToContinue,
  onRetry,
  onSubmitResult,
  strictFocus = false,
}: ExampleCardProps) {
  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const prior = useProgressStore((s) => s.examples[example.id]);
  const [answer, setAnswer] = useState<string | number>('');
  const [result, setResult] = useState<{ correct: boolean; feedback: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [traceReady, setTraceReady] = useState(false);

  const mcLocked = submitted && !examMode && result?.correct === true;

  const notifyContinue = useCallback(
    (correct: boolean) => {
      onExamAnswer?.(correct);
      onSubmitResult?.(correct);
      if (shouldAllowContinue(strictFocus, correct)) {
        onReadyToContinue?.();
      }
    },
    [onExamAnswer, onReadyToContinue, onSubmitResult, strictFocus],
  );

  const handleSubmit = useCallback(() => {
    const grade = gradeExample(example, answer);
    setResult(grade);
    setSubmitted(true);
    if (!examMode) {
      recordAttempt(example.id, lessonId, example.tags, grade.correct);
    }
    notifyContinue(grade.correct);
  }, [answer, examMode, example, lessonId, notifyContinue, recordAttempt]);

  const handleCodeResult = useCallback(
    (correct: boolean, feedback: string) => {
      setResult({ correct, feedback });
      setSubmitted(true);
      if (!examMode) {
        recordAttempt(example.id, lessonId, example.tags, correct);
      }
      notifyContinue(correct);
    },
    [examMode, example.id, example.tags, lessonId, notifyContinue, recordAttempt],
  );

  useEffect(() => {
    if (!focusMode) return;
    if (
      example.type !== 'multipleChoice' &&
      example.type !== 'traceSteps' &&
      example.type !== 'fillBlank'
    ) {
      return;
    }
    const opts = example.options;
    const handler = (e: KeyboardEvent) => {
      if (submitted) return;
      if (example.type === 'traceSteps' && !traceReady && !examMode) return;
      const num = Number(e.key);
      if (num >= 1 && num <= opts.length) {
        setAnswer(num - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusMode, example, submitted, traceReady, examMode]);

  const stageLabel = example.stage.toUpperCase();

  const canSubmit = (() => {
    switch (example.type) {
      case 'multipleChoice':
      case 'fillBlank':
      case 'fixTheLine':
        return answer !== '';
      case 'traceSteps':
        return (examMode || traceReady) && answer !== '';
      case 'orderLines':
      case 'matchPairs':
      case 'dragBlank':
        return String(answer).trim() !== '';
      default:
        return String(answer).trim() !== '';
    }
  })();

  const hideSubmitInFocus = focusMode && submitted;

  return (
    <article
      className={`example-card stage-${example.stage} ${prior?.correct && !examMode ? 'completed' : ''} ${examMode ? 'exam-mode' : ''} ${focusMode ? 'focus-mode' : ''} motion-enter`}
    >
      {!showCompactHeader && (
        <header className="example-header">
          <span className="stage-badge">{stageLabel}</span>
          <span className="type-badge">{example.type}</span>
          {prior?.correct && !examMode && <span className="done-badge motion-check">✓</span>}
        </header>
      )}
      <p className="example-prompt">{example.prompt}</p>

      {example.type === 'traceSteps' && (
        <>
          {!examMode && (
            <StateVisualizer
              example={example}
              requireAllSteps={!examMode}
              onAllStepsVisited={() => setTraceReady(true)}
            />
          )}
          {examMode && <pre className="code-block">{example.code}</pre>}
          {!examMode && (
            <TraceStepsLiveTrace code={example.code} />
          )}
          {!traceReady && !examMode && (
            <p className="step-gate-hint">Step through the code before predicting the output.</p>
          )}
          <p className="question">{example.question}</p>
          <McOptions
            exampleId={example.id}
            options={example.options}
            answer={answer}
            focusMode={focusMode}
            locked={mcLocked || (!examMode && !traceReady)}
            onSelect={setAnswer}
          />
        </>
      )}

      {example.type === 'multipleChoice' && (
        <McOptions
          exampleId={example.id}
          options={example.options}
          answer={answer}
          focusMode={focusMode}
          locked={mcLocked}
          onSelect={setAnswer}
        />
      )}

      {example.type === 'fillBlank' && (
        <>
          <pre className="code-block">{example.code.replace('____', '______')}</pre>
          <p className="question">{example.blankLabel}</p>
          <McOptions
            exampleId={example.id}
            options={example.options}
            answer={answer}
            focusMode={focusMode}
            locked={mcLocked}
            onSelect={setAnswer}
          />
        </>
      )}

      {example.type === 'fixTheLine' && (
        <>
          <pre className="code-block">
            {example.code.split('\n').map((line, i) => (
              <div key={i}>
                <span className="line-num">{i + 1}</span> {line}
              </div>
            ))}
          </pre>
          <div className="mc-options">
            {example.lineOptions.map((lineNum) => (
              <label key={lineNum} className={`mc-option ${answer === lineNum ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={example.id}
                  checked={answer === lineNum}
                  onChange={() => setAnswer(lineNum)}
                  disabled={submitted && !examMode && result?.correct}
                />
                Line {lineNum}
              </label>
            ))}
          </div>
        </>
      )}

      {example.type === 'codeChallenge' && (
        <Suspense fallback={<EditorFallback />}>
          <CodeChallengeEditor
            example={example}
            onResult={handleCodeResult}
            disabled={submitted && (examMode || result?.correct)}
            trapNote={example.trapNote}
            explanation={example.explanation}
          />
        </Suspense>
      )}

      {example.type === 'orderLines' && (
        <Suspense fallback={<EditorFallback />}>
          <OrderLinesEditor
            example={example}
            disabled={submitted && !examMode && result?.correct}
            onChange={(order) => setAnswer(JSON.stringify(order))}
          />
        </Suspense>
      )}

      {example.type === 'matchPairs' && (
        <Suspense fallback={<EditorFallback />}>
          <MatchPairsEditor
            example={example}
            disabled={submitted && !examMode && result?.correct}
            onChange={(pairs) => setAnswer(JSON.stringify(pairs))}
          />
        </Suspense>
      )}

      {example.type === 'dragBlank' && (
        <Suspense fallback={<EditorFallback />}>
          <DragBlankEditor
            example={example}
            disabled={submitted && !examMode && result?.correct}
            onChange={(fills) => setAnswer(JSON.stringify(fills))}
          />
        </Suspense>
      )}

      {example.type !== 'codeChallenge' &&
        !hideSubmitInFocus &&
        !(submitted && result?.correct && !examMode) && (
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit || (submitted && examMode)}
          >
            {examMode ? 'Submit Answer' : 'Check Answer'}
          </button>
        )}

      {submitted && result && (
        <div
          className={`feedback motion-feedback ${result.correct ? 'correct' : 'wrong'}`}
        >
          <p>{result.feedback}</p>
          {(!result.correct || examMode) && (
            <>
              <p className="explanation">{example.explanation}</p>
              {example.trapNote && <p className="trap-note">⚡ {example.trapNote}</p>}
            </>
          )}
          {!result.correct && !examMode && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSubmitted(false);
                setResult(null);
                setAnswer('');
                onRetry?.();
              }}
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </article>
  );
}
