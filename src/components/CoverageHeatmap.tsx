import { Link } from 'react-router-dom';
import { MISTAKE_TAGS } from '../content/schema';
import { useProgressStore } from '../store/progress';
import { computeTagStatsFromExamples, tagAccuracyFromStats } from '../engine/readiness';

function tierClass(accuracy: number | null): string {
  if (accuracy === null) return 'unknown';
  if (accuracy >= 75) return 'good';
  if (accuracy >= 50) return 'mid';
  return 'bad';
}

export function CoverageHeatmap() {
  const examples = useProgressStore((s) => s.examples);
  const stats = computeTagStatsFromExamples(examples);

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-grid">
        {MISTAKE_TAGS.map((tag) => {
          const accuracy = tagAccuracyFromStats(stats, tag);
          const label = tag.replace(/([A-Z])/g, ' $1').trim();
          const tier = tierClass(accuracy);
          const canPractice = accuracy !== null;
          return (
            <div key={tag} className={`heatmap-card ${tier}`}>
              <span className="heatmap-tag">{label}</span>
              <span className="heatmap-pct">{accuracy === null ? '—' : `${accuracy}%`}</span>
              <div className="heatmap-bar">
                <div
                  className="heatmap-bar-fill"
                  style={{ width: accuracy === null ? '0%' : `${accuracy}%` }}
                />
              </div>
              {canPractice ? (
                <Link to={`/review?tag=${tag}`} className="heatmap-engage">
                  Engage →
                </Link>
              ) : (
                <span className="heatmap-practice-muted">Insufficient data</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="heatmap-note">
        — = fewer than 2 attempts. Engage to drill misses for that concept.
      </p>
    </div>
  );
}
