import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getExampleById } from '../content/registry';
import { useProgressStore } from '../store/progress';
import { ExampleCard } from './examples/ExampleCard';
import { SessionTacticalBar } from './SessionTacticalBar';

interface ReviewSessionProps {
  exampleIds: string[];
  banner?: string;
  channel?: string;
  focusMode?: boolean;
  onSessionComplete?: () => void;
  continueLabel?: string;
}

export function ReviewSession({
  exampleIds,
  banner,
  channel = 'REVIEW DRILL',
  focusMode = false,
  onSessionComplete,
  continueLabel,
}: ReviewSessionProps) {
  const [index, setIndex] = useState(0);
  const [readyToContinue, setReadyToContinue] = useState(false);
  const [lastAttemptCorrect, setLastAttemptCorrect] = useState<boolean | null>(null);
  const [animating, setAnimating] = useState(false);
  const strictFocus = useProgressStore((s) => s.strictFocus);

  const items = useMemo(
    () =>
      exampleIds
        .map((id) => getExampleById(id))
        .filter((x): x is NonNullable<typeof x> => x !== undefined),
    [exampleIds],
  );

  const current = items[index];
  const total = items.length;

  const goNext = useCallback(() => {
    if (index >= total - 1) return;
    setAnimating(true);
    setReadyToContinue(false);
    setLastAttemptCorrect(null);
    setTimeout(() => {
      setIndex((i) => i + 1);
      setAnimating(false);
    }, 150);
  }, [index, total]);

  const goBack = () => {
    if (index > 0) {
      setReadyToContinue(true);
      setIndex((i) => i - 1);
    }
  };

  const handleFinish = () => {
    if (onSessionComplete) {
      onSessionComplete();
      setIndex(0);
      setReadyToContinue(false);
    }
  };

  if (total === 0) {
    return <p className="empty-review">Queue empty — no pending retrain items.</p>;
  }

  const atLast = index >= total - 1;

  return (
    <div className="lesson-session review-session focus-mode">
      <SessionTacticalBar channel={channel} index={index} total={total} status={banner} />

      <div className={animating ? 'session-card-wrap motion-exit' : 'session-card-wrap'}>
        {!animating && current && (
          <ExampleCard
            key={current.example.id}
            example={current.example}
            lessonId={current.lessonId}
            focusMode={focusMode || true}
            showCompactHeader
            strictFocus={strictFocus}
            onReadyToContinue={() => setReadyToContinue(true)}
            onRetry={() => {
              setReadyToContinue(false);
              setLastAttemptCorrect(null);
            }}
            onSubmitResult={setLastAttemptCorrect}
          />
        )}
      </div>

      <div className="session-controls session-controls--tactical">
        <button type="button" className="btn-secondary" onClick={goBack} disabled={index === 0}>
          ← Prev
        </button>
        {!atLast && (
          <button type="button" className="btn-primary" onClick={goNext} disabled={!readyToContinue}>
            Advance →
          </button>
        )}
        {atLast && onSessionComplete && (
          <button type="button" className="btn-primary" onClick={handleFinish} disabled={!readyToContinue}>
            {continueLabel ?? 'Next batch →'}
          </button>
        )}
        {atLast && !onSessionComplete && (
          <Link to="/" className="btn-primary btn-link">
            RTB — C2 post
          </Link>
        )}
        {strictFocus && lastAttemptCorrect === false && !readyToContinue && (
          <p className="strict-hint">Hold — resolve task or disengage Lock protocol.</p>
        )}
      </div>
    </div>
  );
}
