import { useMemo } from 'react';
import type { TraceStep } from '../engine/traceRunner';
import type { TraceDisplayStep } from '../engine/executionTrace';
import { ExecutionTraceView } from './ExecutionTraceView';

interface TracePanelProps {
  code: string;
  steps: TraceStep[];
  error?: string | null;
}

export function TracePanel({ code, steps, error }: TracePanelProps) {
  const displaySteps = useMemo<TraceDisplayStep[]>(
    () =>
      steps.map((s) => ({
        line: s.line,
        vars: s.vars,
        changed: s.changed,
      })),
    [steps],
  );

  return (
    <ExecutionTraceView
      code={code}
      steps={displaySteps}
      label="Live execution trace"
      error={error}
    />
  );
}
