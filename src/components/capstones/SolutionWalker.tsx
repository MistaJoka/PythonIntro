import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CapstoneProject } from '../../content/capstones/schema';
import { buildWalkthroughSteps, PHASE_LABEL } from '../../content/capstones/walkthrough';

interface SolutionWalkerProps {
  project: CapstoneProject;
}

export function SolutionWalker({ project }: SolutionWalkerProps) {
  const lines = useMemo(() => project.solution.split('\n'), [project.solution]);
  const steps = useMemo(
    () => buildWalkthroughSteps(project.solution, project.id),
    [project.solution, project.id],
  );

  const maxStep = steps.length - 1;
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex]!;
  const activeLineRef = useRef<HTMLDivElement>(null);

  const goToStep = useCallback(
    (next: number) => {
      setStepIndex(Math.max(0, Math.min(maxStep, next)));
    },
    [maxStep],
  );

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [stepIndex]);

  const trimmed = step.lineText.trim();
  const changedSet = useMemo(() => new Set(step.changed), [step.changed]);
  const varEntries = Object.entries(step.vars);

  return (
    <div className="solution-walker">
      <p className="walker-intro">
        Execute the reference solution one line at a time. Watch namespace and local variables update,
        then see how each change feeds the final return dict.
      </p>
      <pre className="code-block solution-code">
        {lines.map((line, i) => {
          const lineNum = i + 1;
          const active = lineNum === step.line;
          const passed = lineNum < step.line;
          return (
            <div
              key={i}
              ref={active ? activeLineRef : undefined}
              className={`code-line ${active ? 'active' : ''} ${passed ? 'passed' : ''} ${line.trim() ? 'clickable' : ''}`}
              role={line.trim() ? 'button' : undefined}
              tabIndex={line.trim() ? 0 : undefined}
              onClick={() => goToStep(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') goToStep(i);
              }}
            >
              <span className="line-num">{lineNum}</span>
              <span>{line || ' '}</span>
            </div>
          );
        })}
      </pre>
      <div className="step-controls">
        <button type="button" disabled={stepIndex === 0} onClick={() => goToStep(stepIndex - 1)}>
          ← Prev line
        </button>
        <input
          type="range"
          min={0}
          max={maxStep}
          value={stepIndex}
          onChange={(e) => goToStep(Number(e.target.value))}
          aria-label="Solution line"
        />
        <button type="button" disabled={stepIndex >= maxStep} onClick={() => goToStep(stepIndex + 1)}>
          Next line →
        </button>
      </div>
      <div className="teaching-panel execution-panel">
        <div className="teaching-header">
          <span className="teaching-label">
            Line {step.line}
            <span className="step-phase-badge">{PHASE_LABEL[step.phase]}</span>
            {step.lessonId ? (
              <Link to={`/lesson/${step.lessonId}`} className="step-lesson-badge">
                {step.lessonId.replace('lesson', 'L')}
              </Link>
            ) : null}
          </span>
        </div>

        {trimmed ? (
          <pre className="teaching-code teaching-code-active" aria-label="Line being executed">
            {step.lineText}
          </pre>
        ) : null}

        {trimmed && step.segments.length > 0 ? (
          <div className="execution-section">
            <h3 className="execution-heading">Line broken down</h3>
            <ol className="segment-list">
              {step.segments.map((seg, idx) => (
                <li key={idx} className="segment-item">
                  <code className="segment-code">{seg.code}</code>
                  <span className="segment-explain">{seg.explain}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : trimmed ? (
          <div className="execution-section">
            <h3 className="execution-heading">What this line does</h3>
            <p className="teaching-body">{step.effect}</p>
          </div>
        ) : null}

        {step.outputNote ? (
          <div className="execution-section output-link">
            <h3 className="execution-heading">Toward the output</h3>
            <p className="teaching-body">{step.outputNote}</p>
          </div>
        ) : null}

        {varEntries.length > 0 ? (
          <div className="execution-section">
            <h3 className="execution-heading">State after this line</h3>
            <table className="var-table walkthrough-var-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {varEntries.map(([k, v]) => (
                  <tr key={k} className={changedSet.has(k) ? 'var-changed' : ''}>
                    <td>{k}</td>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {step.changed.length > 0 ? (
              <p className="var-changed-note">
                Highlighted: {step.changed.join(', ')}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="var-empty-note">No live locals on this line — structural or definition-only step.</p>
        )}
      </div>
      <p className="step-progress">
        Line {stepIndex + 1} of {steps.length}
      </p>
    </div>
  );
}
