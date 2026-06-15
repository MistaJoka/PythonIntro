import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getExamSetById } from '../../content/registry';
import { ExampleCard } from '../../components/examples/ExampleCard';
import { useProgressStore } from '../../store/progress';
import type { MistakeTag } from '../../content/schema';

export function ExamSimPage() {
  const { examSetId } = useParams<{ examSetId: string }>();
  const examSet = examSetId ? getExamSetById(examSetId) : undefined;
  const completeExam = useProgressStore((s) => s.completeExam);
  const navigate = useNavigate();

  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(examSet ? examSet.durationMin * 60 : 0);
  const [submitted, setSubmitted] = useState(false);

  const finish = useCallback(() => {
    if (!examSet || submitted) return;
    setSubmitted(true);
    const total = examSet.questions.length;
    const correct = examSet.questions.filter((q) => results[q.id]).length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const tagMisses = [
      ...new Set(
        examSet.questions.filter((q) => !results[q.id]).flatMap((q) => q.tags),
      ),
    ] as MistakeTag[];
    completeExam(examSet.id, score, tagMisses);
    navigate(`/exam-prep/review/${examSet.id}`, {
      state: { score, correct, total, results, tagMisses },
    });
  }, [examSet, submitted, results, completeExam, navigate]);

  useEffect(() => {
    if (!examSet || submitted) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [examSet, submitted, finish]);

  if (!examSet) {
    return (
      <div className="empty-state">
        <h1>Exam not found</h1>
        <Link to="/exam-prep">← Exam prep</Link>
      </div>
    );
  }

  const q = examSet.questions[index];
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="exam-sim-page">
      <div className="exam-banner">
        EXAM MODE · {examSet.title} · {mins}:{String(secs).padStart(2, '0')} · Q{index + 1}/
        {examSet.questions.length}
      </div>
      {q && (
        <ExampleCard
          key={q.id}
          example={q}
          lessonId="exam"
          examMode
          onExamAnswer={(correct) => {
            setResults((prev) => ({ ...prev, [q.id]: correct }));
          }}
        />
      )}
      <div className="exam-nav">
        <button type="button" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          ← Previous
        </button>
        {index < examSet.questions.length - 1 ? (
          <button type="button" onClick={() => setIndex((i) => i + 1)}>
            Next →
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={finish}>
            Submit Exam
          </button>
        )}
      </div>
    </div>
  );
}
