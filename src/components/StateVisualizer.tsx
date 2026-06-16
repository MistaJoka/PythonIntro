import { useMemo } from 'react';
import type { Example } from '../content/schema';
import { computeChangedVars, type TraceDisplayStep } from '../engine/executionTrace';
import { ExecutionTraceView } from './ExecutionTraceView';

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
  const steps = useMemo<TraceDisplayStep[]>(
    () =>
      example.steps.map((s, i) => ({
        line: s.line,
        vars: s.vars,
        changed: computeChangedVars(example.steps, i),
      })),
    [example.steps],
  );

  return (
    <ExecutionTraceView
      code={example.code}
      steps={steps}
      label="Execution trace"
      requireAllSteps={requireAllSteps}
      onAllStepsVisited={onAllStepsVisited}
    />
  );
}
