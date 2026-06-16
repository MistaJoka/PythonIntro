import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { computeChangedVars, type TraceDisplayStep } from '../engine/executionTrace';

interface ExecutionTraceViewProps {
  code: string;
  steps: TraceDisplayStep[];
  label?: string;
  error?: string | null;
  requireAllSteps?: boolean;
  onAllStepsVisited?: () => void;
}

export function ExecutionTraceView({
  code,
  steps,
  label = 'Execution trace',
  error,
  requireAllSteps = false,
  onAllStepsVisited,
}: ExecutionTraceViewProps) {
  const resetKey = steps.map((s) => `${s.line}:${JSON.stringify(s.vars)}`).join('|');
  const [stepIndex, setStepIndex] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  const panelRef = useRef<HTMLDivElement>(null);

  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setStepIndex(0);
    setVisited(new Set([0]));
  }

  const lines = useMemo(() => code.split('\n'), [code]);
  const maxStep = Math.max(0, steps.length - 1);
  const step = steps[stepIndex];
  const changedSet = useMemo(
    () => new Set(step?.changed ?? computeChangedVars(steps, stepIndex)),
    [step, stepIndex, steps],
  );

  const goToStep = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(maxStep, next));
      setStepIndex(clamped);
      setVisited((prev) => {
        const n = new Set(prev);
        n.add(clamped);
        return n;
      });
    },
    [maxStep],
  );

  useEffect(() => {
    if (!requireAllSteps) {
      onAllStepsVisited?.();
      return;
    }
    if (visited.size >= steps.length) {
      onAllStepsVisited?.();
    }
  }, [requireAllSteps, visited.size, steps.length, onAllStepsVisited]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || steps.length === 0) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToStep(stepIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToStep(stepIndex + 1);
      }
    };

    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [goToStep, stepIndex, steps.length]);

  const allVisited = !requireAllSteps || visited.size >= steps.length;
  const progressPct = steps.length > 0 ? Math.round((visited.size / steps.length) * 100) : 0;

  const nextUnvisitedIndex = useMemo(() => {
    for (let i = 0; i <= maxStep; i += 1) {
      if (!visited.has(i)) return i;
    }
    return null;
  }, [visited, maxStep]);

  if (steps.length === 0) {
    return (
      <div className="visualizer execution-trace">
        <p className="execution-trace-label">{label}</p>
        {error ? <p className="feedback wrong">{error}</p> : <p className="hint-text">No steps recorded.</p>}
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="visualizer execution-trace"
      tabIndex={0}
      role="region"
      aria-label={label}
    >
      <div className="execution-trace-header">
        <p className="execution-trace-label">{label}</p>
        <p className="execution-trace-hint">Use ← → keys or the slider to step through each line.</p>
      </div>

      {error && <p className="trace-error-note">Stopped early: {error}</p>}

      <pre className="code-block">
        {lines.map((line, i) => {
          const lineNum = i + 1;
          const active = step && lineNum === step.line;
          const passed = step && lineNum < step.line;
          return (
            <div
              key={i}
              className={`code-line ${active ? 'active' : ''} ${passed ? 'passed' : ''}`}
            >
              <span className="line-num">{lineNum}</span>
              <span>{line || ' '}</span>
            </div>
          );
        })}
      </pre>

      <div className="step-controls">
        <button type="button" disabled={stepIndex === 0} onClick={() => goToStep(stepIndex - 1)}>
          ← Prev
        </button>
        <input
          type="range"
          min={0}
          max={maxStep}
          value={stepIndex}
          onChange={(e) => goToStep(Number(e.target.value))}
          aria-label="Execution step"
        />
        <button
          type="button"
          className={requireAllSteps && !allVisited && stepIndex < maxStep ? 'step-next-pulse' : ''}
          disabled={stepIndex >= maxStep}
          onClick={() => goToStep(stepIndex + 1)}
        >
          Next →
        </button>
      </div>

      <div className="execution-trace-meta">
        <p className="step-progress">
          Step {stepIndex + 1} of {steps.length}
          {step ? ` · line ${step.line}` : ''}
        </p>
        {requireAllSteps && (
          <div className="step-visit-track" aria-hidden="true">
            <div className="step-visit-fill" style={{ width: `${progressPct}%` }} />
          </div>
        )}
        {requireAllSteps && (
          <p className={`step-visit-count ${allVisited ? 'complete' : ''}`}>
            {allVisited
              ? 'All steps explored — answer unlocked'
              : `Explore ${steps.length - visited.size} more step(s) to unlock the answer`}
          </p>
        )}
        {requireAllSteps && !allVisited && nextUnvisitedIndex !== null && nextUnvisitedIndex !== stepIndex && (
          <button
            type="button"
            className="btn-text step-jump-btn"
            onClick={() => goToStep(nextUnvisitedIndex)}
          >
            Jump to next unexplored step →
          </button>
        )}
      </div>

      {step && Object.keys(step.vars).length === 0 && (
        <p className="hint-text">No variables in scope at this line yet.</p>
      )}

      {step && Object.keys(step.vars).length > 0 && (
        <>
          <table className="var-table execution-var-table">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(step.vars).map(([k, v]) => (
                <tr key={k} className={changedSet.has(k) ? 'var-changed' : ''}>
                  <td>{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {changedSet.size > 0 && (
            <p className="var-changed-note">Updated this step: {[...changedSet].join(', ')}</p>
          )}
        </>
      )}
    </div>
  );
}
