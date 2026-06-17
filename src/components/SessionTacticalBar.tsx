interface SessionTacticalBarProps {
  channel: string;
  index: number;
  total: number;
  status?: string;
}

/** Compact progress rail for drill / practice sorties */
export function SessionTacticalBar({ channel, index, total, status }: SessionTacticalBarProps) {
  const pct = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;

  return (
    <div className="tactical-bar session-tactical-bar" role="toolbar" aria-label={`${channel} progress`}>
      <div className="tactical-bar-row">
        <div className="tactical-segment tactical-segment--mode">
          <span className="session-channel-label">{channel}</span>
        </div>

        <div className="tactical-segment tactical-segment--status session-tactical-status">
          {status && (
            <span className="tactical-concept" title={status}>
              {status}
            </span>
          )}
          <span className="tactical-progress">
            TASK {index + 1}/{total}
          </span>
          <div
            className="tactical-progress-track"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Session progress"
          >
            <div className="progress-segment" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
