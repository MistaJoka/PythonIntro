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
  const firstLesson = LESSON_META[0];
  const continueTarget = resume ?? (firstLesson ? { lessonId: firstLesson.id, lessonTitle: firstLesson.title, label: `Module ${String(1).padStart(2, '0')} · Start` } : null);

  return (
    <div className="home-view">
      <div className="home-stat-row">
        <span className="home-stat">{completion}<span className="home-stat-unit">%</span></span>
        <span className="home-stat-label">done</span>
        <span className="home-stat-sep" />
        <span className="home-stat">{completeModules}<span className="home-stat-unit">/{LESSON_META.length}</span></span>
        <span className="home-stat-label">modules</span>
        <span className="home-stat-sep" />
        <span className="home-stat">{smartCount}</span>
        <span className="home-stat-label">due</span>
      </div>

      {continueTarget && (
        <Link to={`/lesson/${continueTarget.lessonId}`} className="home-continue">
          <span className="home-continue-arrow">↳</span>
          <span className="home-continue-title">{continueTarget.lessonTitle}</span>
          <span className="home-continue-meta">{continueTarget.label}</span>
        </Link>
      )}

      <nav className="home-links" aria-label="Sections">
        {smartCount > 0 && (
          <Link to="/practice" className="home-link">
            Practice<span className="home-link-badge">{smartCount}</span>
          </Link>
        )}
        <Link to="/exam-prep" className="home-link">Exams</Link>
        <Link to="/capstones" className="home-link">Projects</Link>
        <Link to="/challenges" className="home-link">Challenges</Link>
        <Link to="/showroom" className="home-link">Showroom</Link>
      </nav>

      <section aria-label="All modules">
        <div className="home-section-label">
          <span>Modules</span>
          <span className="home-section-count">{completeModules}/{LESSON_META.length} complete</span>
        </div>
        <ul className="module-rows">
          {LESSON_META.map((meta, index) => {
            const progress = courseProgress[meta.id] ?? 0;
            const state = progress === 100 ? 'complete' : progress > 0 ? 'in-progress' : '';
            return (
              <li key={meta.id}>
                <Link
                  to={`/lesson/${meta.id}`}
                  className={`module-row ${state}`}
                >
                  <span className="module-row-num">{String(index + 1).padStart(2, '0')}</span>
                  <span className="module-row-title">{meta.title}</span>
                  <span className="module-row-track">
                    <span className="module-row-fill" style={{ width: `${progress}%` }} />
                  </span>
                  <span className="module-row-pct">{progress}%</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
