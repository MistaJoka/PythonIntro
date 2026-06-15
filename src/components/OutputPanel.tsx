interface OutputPanelProps {
  stdout: string;
  stderr: string;
}

export function OutputPanel({ stdout, stderr }: OutputPanelProps) {
  const empty = !stdout && !stderr;

  return (
    <div className="output-panel">
      <p className="trace-panel-label">Program output</p>
      {empty ? (
        <p className="hint-text output-empty">(no output)</p>
      ) : (
        <pre className="output-block">
          {stdout}
          {stderr ? (stdout ? '\n' : '') + stderr : ''}
        </pre>
      )}
    </div>
  );
}
