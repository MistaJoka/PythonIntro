import { Link } from 'react-router-dom';
import { EXAM_SETS } from '../../content/registry';
import { useProgressStore } from '../../store/progress';
import { computeReadinessScore } from '../../engine/readiness';

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
      <p className="panel-desc tagline">Optional capstone — diagnostic, timed practice finals, readiness score.</p>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{readiness}</span>
          <span className="stat-label">Readiness score</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{examHistory.length}</span>
          <span className="stat-label">Exams taken</span>
        </div>
      </div>
      <section className="exam-section">
        <h2>Diagnostic</h2>
        <p>20 questions across all 16 lessons — find weak tags before cramming.</p>
        {diagnostic && (
          <p className="meta">Last taken: {new Date(diagnostic.date).toLocaleDateString()}</p>
        )}
        <Link to="/exam-prep/diagnostic" className="btn-primary link-btn">
          {diagnostic ? 'Retake Diagnostic' : 'Start Diagnostic'}
        </Link>
      </section>
      <section className="exam-section">
        <h2>Practice Finals</h2>
        <div className="exam-set-list">
          {EXAM_SETS.map((set) => {
            const last = examHistory.filter((h) => h.examSetId === set.id).at(-1);
            return (
              <div key={set.id} className="exam-set-card">
                <h3>{set.title}</h3>
                <p>{set.questions.length} questions · {set.durationMin} min</p>
                {last && <p className="meta">Best: {last.score}%</p>}
                <Link to={`/exam-prep/sim/${set.id}`} className="btn-secondary link-btn">
                  Start Exam
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
