import { useCallback, useMemo, useState } from 'react';
import type { TraceStep } from '../engine/traceRunner';

interface TracePanelProps {
  code: string;
  steps: TraceStep[];
  error?: string | null;
}

export function TracePanel({ code, steps, error }: TracePanelProps) {
  const resetKey = `${code}:${steps.length}:${steps[0]?.line ?? 0}`;
  const [stepIndex, setStepIndex] = useState(0);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setStepIndex(0);
  }
  const lines = useMemo(() => code.split('\n'), [code]);
  const maxStep = Math.max(0, steps.length - 1);
  const step = steps[stepIndex];
  const changedSet = useMemo(() => new Set(step?.changed ?? []), [step?.changed]);

  const goToStep = useCallback(
    (next: number) => {
      setStepIndex(Math.max(0, Math.min(maxStep, next)));
    },
    [maxStep],
  );

  if (steps.length === 0) {
    return (
      <div className="visualizer trace-panel">
        <p className="trace-panel-label">Live execution trace</p>
        {error ? <p className="feedback wrong">{error}</p> : <p className="hint-text">No steps recorded.</p>}
      </div>
    );
  }

  return (
    <div className="visualizer trace-panel">
      <p className="trace-panel-label">Live execution trace</p>
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
        <button type="button" disabled={stepIndex >= maxStep} onClick={() => goToStep(stepIndex + 1)}>
          Next →
        </button>
      </div>
      <p className="step-progress">
        Step {stepIndex + 1} of {steps.length}
        {step ? ` · line ${step.line}` : ''}
      </p>
      {step && (
        <>
          <table className="var-table walkthrough-var-table">
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
          {step.changed.length > 0 && (
            <p className="var-changed-note">Changed this step: {step.changed.join(', ')}</p>
          )}
        </>
      )}
    </div>
  );
}
