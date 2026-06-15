import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLessonById } from '../content/registry';
import { useProgressStore } from '../store/progress';
import { ConceptBlock } from '../components/ConceptBlock';
import { LessonSession } from '../components/LessonSession';

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = lessonId ? getLessonById(lessonId) : undefined;
  const [viewMode, setViewMode] = useState<'focus' | 'browse'>('focus');
  const [showObjectives, setShowObjectives] = useState(false);
  const strictFocus = useProgressStore((s) => s.strictFocus);
  const setStrictFocus = useProgressStore((s) => s.setStrictFocus);

  if (!lesson) {
    return (
      <div className="empty-state">
        <h1>Lesson not found</h1>
        <Link to="/">← Back to course</Link>
      </div>
    );
  }

  if (lesson.concepts.length === 0) {
    return (
      <div className="empty-state">
        <h1>{lesson.title}</h1>
        <p>{lesson.subtitle}</p>
        <p className="coming-soon-msg">No content available for this lesson yet.</p>
        <Link to="/">← Back to course</Link>
      </div>
    );
  }

  return (
    <div className="lesson-page">
      <header className="lesson-header compact">
        <div className="lesson-header-row">
          <div>
            <p className="lesson-subtitle">{lesson.subtitle}</p>
          </div>
          <div className="view-toggle" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'focus'}
              className={viewMode === 'focus' ? 'active' : ''}
              onClick={() => setViewMode('focus')}
            >
              Focus
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'browse'}
              className={viewMode === 'browse' ? 'active' : ''}
              onClick={() => setViewMode('browse')}
            >
              Browse all
            </button>
          </div>
          {viewMode === 'focus' && (
            <label className="strict-toggle">
              <input
                type="checkbox"
                checked={strictFocus}
                onChange={(e) => setStrictFocus(e.target.checked)}
              />
              Strict mode
            </label>
          )}
        </div>
        <button
          type="button"
          className="btn-text objectives-toggle"
          onClick={() => setShowObjectives((v) => !v)}
        >
          {showObjectives ? 'Hide objectives' : 'Show objectives'}
        </button>
        {showObjectives && (
          <ul className="objectives">
            {lesson.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        )}
      </header>

      {viewMode === 'focus' ? (
        <LessonSession lesson={lesson} />
      ) : (
        <div className="browse-mode">
          {lesson.concepts.map((concept) => (
            <ConceptBlock key={concept.id} concept={concept} lessonId={lesson.id} />
          ))}
          <p className="meta browse-check-link">
            <Link to={`/lesson/${lesson.id}/check`}>Open lesson check →</Link>
          </p>
        </div>
      )}
    </div>
  );
}
