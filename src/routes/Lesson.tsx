import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLessonById } from '../content/registry';
import { ConceptBlock } from '../components/ConceptBlock';
import { LessonSession } from '../components/LessonSession';

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = lessonId ? getLessonById(lessonId) : undefined;
  const [viewMode, setViewMode] = useState<'focus' | 'browse'>('focus');
  const [showObjectives, setShowObjectives] = useState(false);

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

  if (viewMode === 'focus') {
    return (
      <LessonSession
        lesson={lesson}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showObjectives={showObjectives}
        onToggleObjectives={() => setShowObjectives((v) => !v)}
      />
    );
  }

  return (
    <div className="lesson-page lesson-page--browse">
      <header className="lesson-header browse-header">
        <div className="lesson-header-row">
          <div>
            <h1 className="lesson-title">{lesson.title}</h1>
            <p className="lesson-subtitle">{lesson.subtitle}</p>
          </div>
          <div className="view-toggle view-toggle--tactical" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={false}
              aria-label="Engage mode"
              onClick={() => setViewMode('focus')}
            >
              Engage
            </button>
            <button type="button" role="tab" aria-selected aria-label="Intel mode" className="active">
              Intel
            </button>
          </div>
        </div>
      </header>

      <div className="browse-mode">
        {lesson.concepts.map((concept) => (
          <ConceptBlock key={concept.id} concept={concept} lessonId={lesson.id} />
        ))}
        <p className="meta browse-check-link">
          <Link to={`/lesson/${lesson.id}/check`}>Deploy lesson check →</Link>
        </p>
      </div>
    </div>
  );
}
