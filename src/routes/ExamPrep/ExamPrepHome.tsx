import { Link } from 'react-router-dom';
import { EXAM_SETS } from '../../content/registry';
import { useProgressStore } from '../../store/progress';
import { computeReadinessScore } from '../../engine/readiness';
import { TacticalBrief } from '../../components/layout/TacticalBrief';

export function ExamPrepPage() {
  const diagnostic = useProgressStore((s) => s.diagnostic);
  const examHistory = useProgressStore((s) => s.examHistory);
  const state = useProgressStore();
  const readiness = computeReadinessScore({
    examples: state.examples,
    lessonChecks: state.lessonChecks,
    diagnostic: state.diagnostic,
  });

  return (
    <div className="exam-prep-page">
      <TacticalBrief>
        Diagnostic sweep, timed finals, and accuracy tracking — {EXAM_SETS.length} exam sets across all 16 modules.
      </TacticalBrief>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{readiness}</span>
          <span className="stat-label">Accuracy score</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{examHistory.length}</span>
          <span className="stat-label">Exams logged</span>
        </div>
      </div>
      <section className="exam-section">
        <h2>Diagnostic sweep</h2>
        <p>20 questions across all 16 modules — results flag your weakest concepts.</p>
        {diagnostic && (
          <p className="meta">Last taken: {new Date(diagnostic.date).toLocaleDateString()}</p>
        )}
        <Link to="/exam-prep/diagnostic" className="btn-primary link-btn">
          {diagnostic ? 'Re-run diagnostic' : 'Start diagnostic'}
        </Link>
      </section>
      <section className="exam-section">
        <h2>Practice finals</h2>
        <div className="exam-set-list">
          {EXAM_SETS.map((set) => {
            const last = examHistory.filter((h) => h.examSetId === set.id).at(-1);
            return (
              <div key={set.id} className="exam-set-card">
                <h3>{set.title}</h3>
                <p>{set.questions.length} questions · {set.durationMin} min</p>
                {last && <p className="meta">Best: {last.score}%</p>}
                <Link to={`/exam-prep/sim/${set.id}`} className="btn-secondary link-btn">
                  Start exam
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
