import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Lesson } from '../content/schema';
import {
  getLessonExampleQueue,
  getNextIncompleteQueueIndex,
  queueIndexFromPosition,
  positionFromQueueIndex,
  getConceptStartQueueIndex,
  getConceptProgress,
} from '../engine/lessonQueue';
import { useProgressStore } from '../store/progress';
import { ConceptStepper } from './ConceptStepper';
import { ExampleCard } from './examples/ExampleCard';

interface LessonSessionProps {
  lesson: Lesson;
}

export function LessonSession({ lesson }: LessonSessionProps) {
  const queue = useMemo(() => getLessonExampleQueue(lesson.id), [lesson.id]);
  const attempts = useProgressStore((s) => s.examples);
  const sessionPosition = useProgressStore((s) => s.sessionPosition[lesson.id]);
  const saveSessionPosition = useProgressStore((s) => s.saveSessionPosition);
  const recordLessonCheck = useProgressStore((s) => s.recordLessonCheck);

  const strictFocus = useProgressStore((s) => s.strictFocus);
  const [lastAttemptCorrect, setLastAttemptCorrect] = useState<boolean | null>(null);

  const initialIndex = useMemo(() => {
    if (sessionPosition) {
      return queueIndexFromPosition(lesson.id, sessionPosition);
    }
    return getNextIncompleteQueueIndex(lesson.id, attempts);
  }, [lesson.id, sessionPosition, attempts, queue.length]);

  const [queueIndex, setQueueIndex] = useState(initialIndex);
  const [readyToContinue, setReadyToContinue] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [milestoneConcept, setMilestoneConcept] = useState<number | null>(null);

  const item = queue[queueIndex];
  const total = queue.length;
  const progressPct = total > 0 ? Math.round(((queueIndex + 1) / total) * 100) : 0;

  const checkIds = lesson.lessonCheck.map((e) => e.id);
  const checkCorrect = checkIds.filter((id) => attempts[id]?.correct).length;
  const checkScore =
    checkIds.length > 0 ? Math.round((checkCorrect / checkIds.length) * 100) : 0;
  const allCheckAttempted = checkIds.every((id) => attempts[id] !== undefined);

  useEffect(() => {
    const pos = positionFromQueueIndex(lesson.id, queueIndex);
    if (pos) saveSessionPosition(lesson.id, pos.conceptIndex, pos.exampleIndex);
  }, [lesson.id, queueIndex, saveSessionPosition]);

  const goToIndex = useCallback(
    (idx: number) => {
      setAnimating(true);
      setReadyToContinue(false);
      setLastAttemptCorrect(null);
      setTimeout(() => {
        setQueueIndex(Math.max(0, Math.min(total - 1, idx)));
        setAnimating(false);
      }, 150);
    },
    [total],
  );

  const handleContinue = () => {
    if (queueIndex < total - 1) {
      const prevConcept = item?.conceptIndex;
      goToIndex(queueIndex + 1);
      if (prevConcept !== undefined) {
        const { completed, total: t } = getConceptProgress(lesson.id, prevConcept, attempts);
        if (t > 0 && completed === t) {
          setMilestoneConcept(prevConcept);
          setTimeout(() => setMilestoneConcept(null), 600);
        }
      }
    }
  };

  const handleBack = () => {
    if (queueIndex > 0) goToIndex(queueIndex - 1);
  };

  if (!item) {
    return (
      <div className="lesson-session empty-session">
        <p>No examples in this lesson yet.</p>
      </div>
    );
  }

  const atLast = queueIndex >= total - 1;

  return (
    <div className="lesson-session focus-mode">
      <ConceptStepper
        lesson={lesson}
        activeConceptIndex={item.conceptIndex}
        milestoneConcept={milestoneConcept}
        onSelectConcept={(ci) => goToIndex(getConceptStartQueueIndex(lesson.id, ci))}
      />

      <div className="session-bar">
        <div className="session-meta">
          <span className="session-concept">{item.conceptTitle}</span>
          <span className="stage-badge">{item.example.stage.toUpperCase()}</span>
        </div>
        <p className="session-progress-text">
          Example {queueIndex + 1} of {total}
        </p>
        <div className="session-progress-track" aria-hidden="true">
          <div className="progress-segment" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className={animating ? 'session-card-wrap motion-exit' : 'session-card-wrap'}>
        {!animating && (
          <ExampleCard
            key={item.example.id}
            example={item.example}
            lessonId={lesson.id}
            focusMode
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
        <button type="button" className="btn-secondary" onClick={handleBack} disabled={queueIndex === 0}>
          ← Back
        </button>
        {!atLast && (
          <button
            type="button"
            className="btn-primary"
            onClick={handleContinue}
            disabled={!readyToContinue}
          >
            Continue →
          </button>
        )}
        {strictFocus && lastAttemptCorrect === false && !readyToContinue && (
          <p className="strict-hint">Get it right or turn off Strict mode in the lesson header.</p>
        )}
        {atLast && item.isLessonCheck && allCheckAttempted && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => recordLessonCheck(lesson.id, checkScore)}
          >
            Save Lesson Check ({checkScore}%)
          </button>
        )}
        {atLast && !item.isLessonCheck && (
          <Link to="/" className="btn-primary btn-link">
            Back to course map
          </Link>
        )}
      </div>

      {item.isLessonCheck && (
        <p className="check-progress session-check-progress">
          Lesson check: {checkCorrect}/{checkIds.length} correct ({checkScore}%)
        </p>
      )}
    </div>
  );
}
