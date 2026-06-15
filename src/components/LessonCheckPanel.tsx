import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Lesson } from '../content/schema';
import { ExampleCard } from './examples/ExampleCard';
import { useProgressStore } from '../store/progress';

interface LessonCheckPanelProps {
  lesson: Lesson;
}

export function LessonCheckPanel({ lesson }: LessonCheckPanelProps) {
  const examples = useProgressStore((s) => s.examples);
  const lessonCheckScore = useProgressStore((s) => s.lessonChecks[lesson.id]);
  const recordLessonCheck = useProgressStore((s) => s.recordLessonCheck);

  const checkIds = lesson.lessonCheck.map((e) => e.id);
  const attempted = checkIds.filter((id) => examples[id] !== undefined);
  const correct = checkIds.filter((id) => examples[id]?.correct).length;
  const allAttempted = attempted.length === checkIds.length && checkIds.length > 0;

  const liveScore = useMemo(() => {
    if (checkIds.length === 0) return 0;
    return Math.round((correct / checkIds.length) * 100);
  }, [checkIds.length, correct]);

  const handleSubmitCheck = () => {
    recordLessonCheck(lesson.id, liveScore);
  };

  if (lesson.lessonCheck.length === 0) return null;

  return (
    <section className="lesson-check-section" id="lesson-check">
      <h2>Lesson Check</h2>
      <p>Test yourself across all concepts in this lesson.</p>
      {lessonCheckScore && (
        <p className="check-score">
          Last score: {lessonCheckScore.score}% on{' '}
          {new Date(lessonCheckScore.date).toLocaleDateString()}
        </p>
      )}
      <p className="check-progress">
        Progress: {correct}/{checkIds.length} correct ({liveScore}%)
      </p>
      {lesson.lessonCheck.map((ex) => (
        <ExampleCard key={ex.id} example={ex} lessonId={lesson.id} />
      ))}
      {allAttempted && (
        <button type="button" className="btn-primary" onClick={handleSubmitCheck}>
          Save Lesson Check Score ({liveScore}%)
        </button>
      )}
      <p className="meta">
        <Link to={`/lesson/${lesson.id}/check`}>Open lesson check only →</Link>
      </p>
    </section>
  );
}
