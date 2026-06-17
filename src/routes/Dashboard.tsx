import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  countCompletedExamples,
  getOverallCompletion,
  getTotalExampleCount,
  useProgressStore,
} from '../store/progress';
import { CoverageHeatmap } from '../components/CoverageHeatmap';
import { TacticalBrief } from '../components/layout/TacticalBrief';
import { getWeakestTagForDashboard } from '../engine/tagStats';
import { computeReadinessScore, exportAnkiCsv } from '../engine/readiness';

export function DashboardPage() {
  const exportProgress = useProgressStore((s) => s.exportProgress);
  const importProgress = useProgressStore((s) => s.importProgress);
  const resetProgress = useProgressStore((s) => s.resetProgress);
  const courseProgress = useProgressStore((s) => s.courseProgress);
  const examples = useProgressStore((s) => s.examples);
  const lessonChecks = useProgressStore((s) => s.lessonChecks);
  const diagnostic = useProgressStore((s) => s.diagnostic);
  const examHistory = useProgressStore((s) => s.examHistory);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState(false);

  const readiness = computeReadinessScore({ examples, lessonChecks, diagnostic });
  const weakestTag = getWeakestTagForDashboard(examples);

  const handleImport = (text: string) => {
    const ok = importProgress(text);
    if (!ok) {
      setImportError(true);
    } else {
      setImportError(false);
    }
  };

  return (
    <div className="dashboard-page">
      <TacticalBrief msgType="LOG" sector="TELEMETRY">
        Mission telemetry — progress tally, competency matrix by tag, and data export channels.
      </TacticalBrief>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{getOverallCompletion()}%</span>
          <span className="stat-label">Mission tally</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{readiness}</span>
          <span className="stat-label">C-rate index</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{countCompletedExamples()}</span>
          <span className="stat-label">Confirmed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{getTotalExampleCount()}</span>
          <span className="stat-label">Total tasks</span>
        </div>
      </div>
      <h2>Competency matrix</h2>
      {weakestTag && (
        <p className="weakest-tag-cta">
          <Link to={`/review?tag=${weakestTag}`} className="btn-primary btn-link">
            Init retrain: {weakestTag}
          </Link>
        </p>
      )}
      <CoverageHeatmap />
      <h2>Module status</h2>
      <ul className="progress-list">
        {Object.entries(courseProgress)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([id, pct]) => (
            <li key={id}>
              <Link to={`/lesson/${id}`}>{id}</Link>
              <span>{pct}%</span>
            </li>
          ))}
      </ul>
      {examHistory.length > 0 && (
        <>
          <h2>Exam history</h2>
          <ul className="progress-list">
            {examHistory.map((h) => (
              <li key={h.id}>
                {h.examSetId} — {h.score}% — {new Date(h.date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </>
      )}
      {importError && (
        <div className="import-error-modal" role="alert">
          <h3>Could not import progress</h3>
          <p>
            This file may be from an older version (schemaVersion must be 2). Export your current
            progress first if needed, then reset or fix the file.
          </p>
          <div className="import-error-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                const blob = new Blob([exportProgress()], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'intro-python-progress-backup.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export backup
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                if (confirm('Reset all progress? This cannot be undone.')) {
                  resetProgress();
                  setImportError(false);
                }
              }}
            >
              Reset progress
            </button>
            <button type="button" className="btn-text" onClick={() => setImportError(false)}>
              Dismiss
            </button>
          </div>
        </div>
      )}
      <div className="export-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            const blob = new Blob([exportProgress()], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'intro-python-progress.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export mission data
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            const csv = exportAnkiCsv(examples);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'python-dojo-misses.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export Anki CSV
        </button>
        <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
          Import mission data
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            file.text().then(handleImport);
          }}
        />
        <button
          type="button"
          className="btn-danger"
          onClick={() => {
            if (confirm('Reset all progress? Export first if needed.')) resetProgress();
          }}
        >
          Wipe mission data
        </button>
      </div>
    </div>
  );
}
