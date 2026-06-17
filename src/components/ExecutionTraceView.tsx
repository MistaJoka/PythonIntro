import { useMemo } from 'react';
import {
  buildStepSummary,
  computeChangedVars,
  inferVarType,
  varDelta,
  type TraceDisplayStep,
} from '../engine/executionTrace';
import { useExecutionTrace } from '../hooks/useExecutionTrace';

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
  const lines = useMemo(() => code.split('\n'), [code]);
  const {
    stepIndex,
    maxStep,
    step,
    visited,
    allVisited,
    progressPct,
    goToStep,
    goNext,
    goPrev,
    panelRef,
  } = useExecutionTrace(steps, requireAllSteps, onAllStepsVisited);

  const changedSet = useMemo(
    () => new Set(step?.changed ?? computeChangedVars(steps, stepIndex)),
    [step, stepIndex, steps],
  );

  const prevVars = stepIndex > 0 ? (steps[stepIndex - 1]?.vars ?? {}) : {};
  const summary = useMemo(
    () => buildStepSummary(code, stepIndex, steps),
    [code, stepIndex, steps],
  );

  if (steps.length === 0) {
    return (
      <div className="visualizer execution-trace">
        <p className="execution-trace-label">{label}</p>
        {error ? <p className="feedback wrong">{error}</p> : <p className="hint-text">No steps recorded.</p>}
      </div>
    );
  }

  const stepLabel = `Step ${stepIndex + 1} of ${steps.length}`;

  return (
    <div
      ref={panelRef}
      className="visualizer execution-trace"
      tabIndex={0}
      role="region"
      aria-label={label}
    >
      <div className="trace-toolbar">
        <div className="trace-toolbar-left">
          <span className="execution-trace-label">{label}</span>
          <span className="trace-step-readout" aria-live="polite">
            {stepLabel}
            {step ? ` · L${step.line}` : ''}
          </span>
        </div>

        <div className="trace-step-rail" role="tablist" aria-label="Execution steps">
          {steps.map((s, i) => {
            const isCurrent = i === stepIndex;
            const isVisited = visited.has(i);
            return (
              <button
                key={`${s.line}-${i}`}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                aria-label={`Step ${i + 1}, line ${s.line}${isVisited ? ', visited' : ''}`}
                className={`trace-step-dot${isCurrent ? ' current' : ''}${isVisited ? ' visited' : ''}`}
                onClick={() => goToStep(i)}
              />
            );
          })}
        </div>

        <div className="trace-toolbar-right">
          {requireAllSteps && (
            <span
              className={`trace-explore-badge${allVisited ? ' complete' : ''}`}
              title={
                allVisited
                  ? 'All steps explored — answer unlocked'
                  : `Explore ${steps.length - visited.size} more step(s) to unlock the answer`
              }
            >
              {allVisited ? 'Unlocked' : `${visited.size}/${steps.length}`}
            </span>
          )}
          <button
            type="button"
            className="trace-nav-btn"
            disabled={stepIndex === 0}
            onClick={goPrev}
            aria-label="Previous step"
          >
            ←
          </button>
          <button
            type="button"
            className={`trace-nav-btn${requireAllSteps && !allVisited && stepIndex < maxStep ? ' pulse' : ''}`}
            disabled={stepIndex >= maxStep}
            onClick={goNext}
            aria-label="Next step"
          >
            →
          </button>
        </div>
      </div>

      {error && <p className="trace-error-note">Stopped early: {error}</p>}

      <div className="trace-workspace">
        <div className="trace-code-pane">
          <pre className="code-block trace-code-block">
            {lines.map((line, i) => {
              const lineNum = i + 1;
              const active = step && lineNum === step.line;
              const passed = step && lineNum < step.line;
              const future = step && lineNum > step.line;
              return (
                <div
                  key={i}
                  className={`code-line ${active ? 'active' : ''} ${passed ? 'passed' : ''} ${future ? 'future' : ''}`}
                >
                  <span className="line-num">{lineNum}</span>
                  <code className="line-src">{line || ' '}</code>
                </div>
              );
            })}
          </pre>
        </div>

        <div className="trace-state-pane">
          <div className="trace-step-summary">
            <div className="trace-summary-head">
              <span className="trace-summary-action">{summary.action}</span>
              <span className="trace-summary-line">Line {summary.line}</span>
            </div>
            {summary.source && <code className="trace-summary-source">{summary.source}</code>}
            <p className="trace-summary-effect">{summary.effect}</p>
          </div>

          {step?.output !== undefined && step.output.length > 0 && (
            <div className="trace-output-block">
              <span className="trace-pane-label">Output</span>
              <pre className="trace-output">{step.output.replace(/\n$/, '') || '(empty)'}</pre>
            </div>
          )}

          {step && Object.keys(step.vars).length === 0 && !step.output && (
            <p className="hint-text trace-empty-state">No variables in scope yet.</p>
          )}

          {step && Object.keys(step.vars).length > 0 && (
            <div className="trace-vars-block">
              <span className="trace-pane-label">Variables</span>
              <table className="var-table execution-var-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(step.vars).map(([k, v]) => {
                    const changed = changedSet.has(k);
                    const delta = varDelta(prevVars, k, v);
                    return (
                      <tr key={k} className={changed ? 'var-changed' : ''}>
                        <td>{k}</td>
                        <td className="var-type">{inferVarType(v)}</td>
                        <td>
                          {v}
                          {changed && delta && <span className="var-delta"> {delta}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {requireAllSteps && (
            <div className="trace-explore-meter" aria-hidden="true">
              <div className="step-visit-fill" style={{ width: `${progressPct}%` }} />
            </div>
          )}
        </div>
      </div>

      <p className="trace-kbd-hint">← → step · Home/End jump · click dots to scrub</p>
    </div>
  );
}
