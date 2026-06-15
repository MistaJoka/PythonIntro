import { useMemo, useState, useCallback, useEffect } from 'react';
import type { Example } from '../content/schema';

interface StateVisualizerProps {
  example: Extract<Example, { type: 'traceSteps' }>;
  requireAllSteps?: boolean;
  onAllStepsVisited?: () => void;
}

export function StateVisualizer({
  example,
  requireAllSteps = false,
  onAllStepsVisited,
}: StateVisualizerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const lines = useMemo(() => example.code.split('\n'), [example.code]);
  const step = example.steps[stepIndex];
  const maxStep = example.steps.length - 1;

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
    if (visited.size >= example.steps.length) {
      onAllStepsVisited?.();
    }
  }, [requireAllSteps, visited.size, example.steps.length, onAllStepsVisited]);

  return (
    <div className="visualizer">
      <pre className="code-block">
        {lines.map((line, i) => {
          const lineNum = i + 1;
          const active = step && lineNum === step.line;
          return (
            <div key={i} className={active ? 'code-line active' : 'code-line'}>
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
          disabled={stepIndex >= maxStep}
          onClick={() => goToStep(stepIndex + 1)}
        >
          Next →
        </button>
      </div>
      {requireAllSteps && (
        <p className="step-progress">
          Steps viewed: {visited.size} / {example.steps.length}
        </p>
      )}
      {step && (
        <table className="var-table">
          <thead>
            <tr>
              <th>Variable</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(step.vars).map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
