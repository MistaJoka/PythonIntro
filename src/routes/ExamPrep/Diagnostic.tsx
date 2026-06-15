import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DIAGNOSTIC_QUESTIONS } from '../../content/diagnostic';
import { ExampleCard } from '../../components/examples/ExampleCard';
import { useProgressStore } from '../../store/progress';

function buildTagScores(answers: Record<string, boolean>) {
  const tagCounts: Record<string, { ok: number; total: number }> = {};
  for (const [id, correct] of Object.entries(answers)) {
    const question = DIAGNOSTIC_QUESTIONS.find((d) => d.id === id);
    if (!question) continue;
    for (const tag of question.tags) {
      if (!tagCounts[tag]) tagCounts[tag] = { ok: 0, total: 0 };
      tagCounts[tag].total += 1;
      if (correct) tagCounts[tag].ok += 1;
    }
  }
  const scores: Record<string, number> = {};
  for (const [tag, { ok, total }] of Object.entries(tagCounts)) {
    scores[tag] = total > 0 ? ok / total : 0;
  }
  return scores;
}

export function DiagnosticPage() {
  const saveDiagnostic = useProgressStore((s) => s.saveDiagnostic);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);

  const q = DIAGNOSTIC_QUESTIONS[index];
  const total = DIAGNOSTIC_QUESTIONS.length;

  const tagScores = useMemo(() => buildTagScores(answers), [answers]);

  const handleAnswer = (correct: boolean) => {
    if (!q) return;
    const next = { ...answers, [q.id]: correct };
    setAnswers(next);
    if (index + 1 >= total) {
      saveDiagnostic(buildTagScores(next));
      setDone(true);
    } else {
      setTimeout(() => setIndex((i) => i + 1), 500);
    }
  };

  if (done) {
    const correct = Object.values(answers).filter(Boolean).length;
    const pct = Math.round((correct / total) * 100);
    return (
      <div className="diagnostic-done">
        <p className="score-display">{pct}% ({correct}/{total})</p>
        <h2>Weakest tags</h2>
        <ul className="tag-rank">
          {Object.entries(tagScores)
            .sort(([, a], [, b]) => (a as number) - (b as number))
            .slice(0, 5)
            .map(([tag, score]) => (
              <li key={tag}>
                {tag}: {Math.round((score as number) * 100)}%
              </li>
            ))}
        </ul>
        <Link to="/review" className="btn-primary link-btn">Review misses</Link>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="diagnostic-page">
      <div className="exam-banner">DIAGNOSTIC · {index + 1}/{total}</div>
      <ExampleCard
        key={q.id}
        example={q}
        lessonId="diagnostic"
        examMode
        onExamAnswer={handleAnswer}
      />
    </div>
  );
}
