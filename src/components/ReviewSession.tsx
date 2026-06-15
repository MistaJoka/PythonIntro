import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getExampleById } from '../content/registry';
import { useProgressStore } from '../store/progress';
import { ExampleCard } from './examples/ExampleCard';

interface ReviewSessionProps {
  exampleIds: string[];
  banner?: string;
  focusMode?: boolean;
  onSessionComplete?: () => void;
  continueLabel?: string;
}

export function ReviewSession({
  exampleIds,
  banner,
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
    return <p className="empty-review">No misses yet — keep practicing!</p>;
  }

  const atLast = index >= total - 1;

  return (
    <div className="lesson-session review-session focus-mode">
      {banner && <p className="review-banner">{banner}</p>}
      <div className="session-bar">
        <p className="session-progress-text">
          Review {index + 1} of {total}
        </p>
        <div className="session-progress-track">
          <div
            className="progress-segment"
            style={{ width: `${Math.round(((index + 1) / total) * 100)}%` }}
          />
        </div>
      </div>

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

      <div className="session-controls">
        <button type="button" className="btn-secondary" onClick={goBack} disabled={index === 0}>
          ← Back
        </button>
        {!atLast && (
          <button type="button" className="btn-primary" onClick={goNext} disabled={!readyToContinue}>
            Continue →
          </button>
        )}
        {atLast && onSessionComplete && (
          <button type="button" className="btn-primary" onClick={handleFinish} disabled={!readyToContinue}>
            {continueLabel ?? 'Continue review →'}
          </button>
        )}
        {atLast && !onSessionComplete && (
          <Link to="/" className="btn-primary btn-link">
            Done reviewing
          </Link>
        )}
        {strictFocus && lastAttemptCorrect === false && !readyToContinue && (
          <p className="strict-hint">Get it right or turn off Strict mode.</p>
        )}
      </div>
    </div>
  );
}
