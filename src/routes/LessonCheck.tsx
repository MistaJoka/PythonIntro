import { Link, useParams } from 'react-router-dom';
import { getLessonById } from '../content/registry';
import { ReviewSession } from '../components/ReviewSession';
import { useProgressStore } from '../store/progress';

export function LessonCheckPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = lessonId ? getLessonById(lessonId) : undefined;
  const recordLessonCheck = useProgressStore((s) => s.recordLessonCheck);
  const attempts = useProgressStore((s) => s.examples);

  if (!lesson || lesson.lessonCheck.length === 0) {
    return (
      <div className="empty-state">
        <h1>Lesson check unavailable</h1>
        <Link to={lessonId ? `/lesson/${lessonId}` : '/'}>← Back</Link>
      </div>
    );
  }

  const checkIds = lesson.lessonCheck.map((e) => e.id);
  const correct = checkIds.filter((id) => attempts[id]?.correct).length;
  const score = checkIds.length > 0 ? Math.round((correct / checkIds.length) * 100) : 0;
  const allAttempted = checkIds.every((id) => attempts[id] !== undefined);

  return (
    <div className="lesson-check-page">
      <header className="lesson-header compact">
        <p className="lesson-subtitle">{lesson.subtitle}</p>
      </header>
      <ReviewSession
        exampleIds={checkIds}
        banner={`Lesson check · ${lesson.lessonCheck.length} questions`}
      />
      {allAttempted && (
        <div className="session-controls check-save-row">
          <button type="button" className="btn-primary" onClick={() => recordLessonCheck(lesson.id, score)}>
            Save Score ({score}%)
          </button>
        </div>
      )}
    </div>
  );
}
