import { Link, useLocation, useParams } from 'react-router-dom';
import { getExamSetById } from '../../content/registry';

interface ReviewState {
  score: number;
  correct: number;
  total: number;
  tagMisses: string[];
  results: Record<string, boolean>;
}

export function ReviewSheetPage() {
  const { examSetId } = useParams<{ examSetId: string }>();
  const location = useLocation();
  const state = location.state as ReviewState | null;
  const examSet = examSetId ? getExamSetById(examSetId) : undefined;

  if (!examSet || !state) {
    return (
      <div className="empty-state">
        <h1>No review data</h1>
        <Link to="/exam-prep">← Exam prep</Link>
      </div>
    );
  }

  return (
    <div className="review-sheet">
      <p className="score-display">
        {state.score}% · {state.correct}/{state.total} correct
      </p>
      {state.tagMisses.length > 0 && (
        <>
          <h2>Misses by concept</h2>
          <ul className="tag-rank">
            {state.tagMisses.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </>
      )}
      <h2>Questions</h2>
      <ul className="review-questions">
        {examSet.questions.map((q, i) => (
          <li key={q.id} className={state.results[q.id] ? 'correct' : 'wrong'}>
            Q{i + 1}: {state.results[q.id] ? '✓' : '✗'} — {q.prompt.slice(0, 80)}…
          </li>
        ))}
      </ul>
      <Link to="/review" className="btn-primary link-btn">
        Drill missed concepts
      </Link>
    </div>
  );
}
