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
        C2 terminal online — route training modules via comms rail, execute tasks in this viewport.
      </p>

      <div className="overview-grid">
        <div className="overview-card">
          <span className="overview-card-label">Mission tally</span>
          <span className="overview-card-value">{completion}%</span>
          <span className="overview-card-meta">
            {completeModules}/{LESSON_META.length} modules complete
          </span>
        </div>
        <div className="overview-card">
          <span className="overview-card-label">Drill queue</span>
          <span className="overview-card-value">{smartCount}</span>
          <span className="overview-card-meta">tasks pending</span>
        </div>
        <div className="overview-card">
          <span className="overview-card-label">Training mods</span>
          <span className="overview-card-value">{LESSON_META.length}</span>
          <span className="overview-card-meta">intro python AO</span>
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
            <span className="action-label">Init drill</span>
            <strong>Adaptive queue</strong>
            <span className="action-meta">{smartCount} tasks loaded</span>
          </Link>
        )}
        <Link to="/exam-prep" className="action-card">
          <span className="action-label">Test channel</span>
          <strong>Diagnostic & finals</strong>
          <span className="action-meta">assessment ops</span>
        </Link>
        <Link to="/capstones" className="action-card">
          <span className="action-label">Dev bay</span>
          <strong>Capstone ops</strong>
          <span className="action-meta">synthesis deployment</span>
        </Link>
      </section>

      <section className="overview-digest" aria-label="Module status grid">
        <span className="rail-section-label">Module status matrix</span>
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
