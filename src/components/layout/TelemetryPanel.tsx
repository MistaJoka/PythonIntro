import { Link } from 'react-router-dom';
import {
  countCompletedExamples,
  getOverallCompletion,
  getTotalExampleCount,
  useProgressStore,
} from '../../store/progress';
import { getLastActiveLesson } from '../../engine/lessonQueue';
import { buildSmartPracticeQueue } from '../../engine/practiceQueue';
import { computeReadinessScore } from '../../engine/readiness';
import { getWeakestTagForDashboard } from '../../engine/tagStats';

export function TelemetryPanel() {
  const sessionPosition = useProgressStore((s) => s.sessionPosition);
  const srsQueue = useProgressStore((s) => s.srsQueue);
  const examples = useProgressStore((s) => s.examples);
  const lessonChecks = useProgressStore((s) => s.lessonChecks);
  const diagnostic = useProgressStore((s) => s.diagnostic);

  const completion = getOverallCompletion();
  const readiness = computeReadinessScore({ examples, lessonChecks, diagnostic });
  const mastered = countCompletedExamples();
  const total = getTotalExampleCount();
  const resume = getLastActiveLesson(sessionPosition);
  const queueCount = buildSmartPracticeQueue(srsQueue, examples, sessionPosition).length;
  const weakestTag = getWeakestTagForDashboard(examples);

  return (
    <aside className="telemetry-panel" aria-label="Live telemetry">
      <span className="rail-section-label">Live feed</span>

      <div className="telemetry-gauge">
        <div
          className="gauge-ring"
          style={{ '--gauge': readiness } as React.CSSProperties}
          role="img"
          aria-label={`Readiness ${readiness}`}
        >
          <span className="gauge-value">{readiness}</span>
        </div>
        <span className="gauge-label">Readiness</span>
      </div>

      <div className="telemetry-metric">
        <div className="metric-header">
          <span>Course sync</span>
          <span className="metric-val">{completion}%</span>
        </div>
        <div className="metric-track">
          <span className="metric-fill" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="telemetry-stat-row">
        <div className="telemetry-stat">
          <span className="telemetry-stat-val">{mastered}</span>
          <span className="telemetry-stat-lbl">Mastered</span>
        </div>
        <div className="telemetry-stat">
          <span className="telemetry-stat-val">{total}</span>
          <span className="telemetry-stat-lbl">Total</span>
        </div>
        <div className="telemetry-stat">
          <span className="telemetry-stat-val">{queueCount}</span>
          <span className="telemetry-stat-lbl">Queue</span>
        </div>
      </div>

      {resume && (
        <Link to={`/lesson/${resume.lessonId}`} className="telemetry-action resume-card">
          <span className="action-label">Resume</span>
          <strong>{resume.lessonTitle}</strong>
          <span className="action-meta">{resume.label}</span>
        </Link>
      )}

      {queueCount > 0 && (
        <Link to="/practice" className="telemetry-action practice-card">
          <span className="action-label">Practice queue</span>
          <strong>Engage {queueCount}</strong>
          <span className="action-meta">SRS + misses + next</span>
        </Link>
      )}

      {weakestTag && (
        <Link to={`/review?tag=${weakestTag}`} className="telemetry-weak">
          Weak signal: <strong>{weakestTag}</strong> → drill
        </Link>
      )}
    </aside>
  );
}
