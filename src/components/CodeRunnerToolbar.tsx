import type { ReactNode } from 'react';

export type RunnerAction = 'run' | 'trace' | 'tests';

interface CodeRunnerToolbarProps {
  activePanel: 'output' | 'trace' | null;
  running: boolean;
  tracing: boolean;
  testing: boolean;
  disabled?: boolean;
  testsPassed?: boolean;
  onRun: () => void;
  onTrace: () => void;
  onTests: () => void;
  extraActions?: ReactNode;
}

export function CodeRunnerToolbar({
  activePanel,
  running,
  tracing,
  testing,
  disabled,
  testsPassed,
  onRun,
  onTrace,
  onTests,
  extraActions,
}: CodeRunnerToolbarProps) {
  return (
    <div className="editor-actions code-runner-toolbar">
      <button
        type="button"
        className={activePanel === 'output' ? 'btn-primary' : 'btn-secondary'}
        onClick={onRun}
        disabled={running || disabled}
      >
        {running ? 'Running…' : 'Run'}
      </button>
      <button
        type="button"
        className={activePanel === 'trace' ? 'btn-primary' : 'btn-secondary'}
        onClick={onTrace}
        disabled={tracing || disabled}
      >
        {tracing ? 'Tracing…' : 'Trace'}
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={onTests}
        disabled={testing || disabled}
      >
        {testing ? 'Testing…' : testsPassed ? 'Tests passed ✓' : 'Tests'}
      </button>
      {extraActions}
    </div>
  );
}
