export interface TraceDisplayStep {
  line: number;
  vars: Record<string, string>;
  changed?: string[];
}

export function computeChangedVars(
  steps: { vars: Record<string, string> }[],
  stepIndex: number,
): string[] {
  const step = steps[stepIndex];
  if (!step) return [];
  const prevVars = stepIndex > 0 ? (steps[stepIndex - 1]?.vars ?? {}) : {};
  return Object.keys(step.vars).filter((key) => prevVars[key] !== step.vars[key]);
}
