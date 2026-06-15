import { Link } from 'react-router-dom';
import { LESSON_META } from '../content/registry';
import { getLastActiveLesson } from '../engine/lessonQueue';
import { buildSmartPracticeQueue } from '../engine/practiceQueue';
import { getOverallCompletion, useProgressStore } from '../store/progress';

export function CourseMap() {
  const courseProgress = useProgressStore((s) => s.courseProgress);
  const sessionPosition = useProgressStore((s) => s.sessionPosition);
  const srsQueue = useProgressStore((s) => s.srsQueue);
  const examples = useProgressStore((s) => s.examples);

  const resume = getLastActiveLesson(sessionPosition);
  const smartCount = buildSmartPracticeQueue(srsQueue, examples, sessionPosition).length;
  const completion = getOverallCompletion();
  const completeModules = LESSON_META.filter((m) => (courseProgress[m.id] ?? 0) === 100).length;

  return (
    <div className="command-overview">
      <p className="overview-brief">
        All systems routed through one console — modules on the left rail, live telemetry on the
        right, active work in this viewport.
      </p>

      <div className="overview-grid">
        <div className="overview-card">
          <span className="overview-card-label">System sync</span>
          <span className="overview-card-value">{completion}%</span>
          <span className="overview-card-meta">
            {completeModules} of {LESSON_META.length} modules complete
          </span>
        </div>
        <div className="overview-card">
          <span className="overview-card-label">Practice queue</span>
          <span className="overview-card-value">{smartCount}</span>
          <span className="overview-card-meta">examples loaded</span>
        </div>
        <div className="overview-card">
          <span className="overview-card-label">Active modules</span>
          <span className="overview-card-value">{LESSON_META.length}</span>
          <span className="overview-card-meta">intro python path</span>
        </div>
      </div>

      <section className="overview-actions">
        {resume && (
          <Link to={`/lesson/${resume.lessonId}`} className="action-card resume-card">
            <span className="action-label">Resume signal</span>
            <strong>{resume.lessonTitle}</strong>
            <span className="action-meta">{resume.label}</span>
          </Link>
        )}
        {smartCount > 0 && (
          <Link to="/practice" className="action-card practice-card">
            <span className="action-label">Engage queue</span>
            <strong>Smart practice</strong>
            <span className="action-meta">{smartCount} examples ready</span>
          </Link>
        )}
        <Link to="/exam-prep" className="action-card">
          <span className="action-label">Exam channel</span>
          <strong>Diagnostic & finals</strong>
          <span className="action-meta">optional assessment</span>
        </Link>
        <Link to="/capstones" className="action-card">
          <span className="action-label">Build bay</span>
          <strong>Capstone projects</strong>
          <span className="action-meta">apply what you learned</span>
        </Link>
      </section>

      <section className="overview-digest" aria-label="Module sync digest">
        <span className="rail-section-label">Module sync digest</span>
        <div className="digest-grid">
          {LESSON_META.map((meta, index) => {
            const progress = courseProgress[meta.id] ?? 0;
            const num = String(index + 1).padStart(2, '0');
            return (
              <Link
                key={meta.id}
                to={`/lesson/${meta.id}`}
                className={`digest-cell ${progress === 100 ? 'complete' : ''}`}
                title={meta.title}
              >
                <span className="digest-num">{num}</span>
                <span className="digest-pct">{progress}%</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
