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
import { ExampleCard } from './examples/ExampleCard';
import { FocusTacticalBar } from './FocusTacticalBar';

interface LessonSessionProps {
  lesson: Lesson;
  viewMode: 'focus' | 'browse';
  onViewModeChange: (mode: 'focus' | 'browse') => void;
  showObjectives: boolean;
  onToggleObjectives: () => void;
}

export function LessonSession({
  lesson,
  viewMode,
  onViewModeChange,
  showObjectives,
  onToggleObjectives,
}: LessonSessionProps) {
  const queue = useMemo(() => getLessonExampleQueue(lesson.id), [lesson.id]);
  const attempts = useProgressStore((s) => s.examples);
  const sessionPosition = useProgressStore((s) => s.sessionPosition[lesson.id]);
  const saveSessionPosition = useProgressStore((s) => s.saveSessionPosition);
  const recordLessonCheck = useProgressStore((s) => s.recordLessonCheck);

  const strictFocus = useProgressStore((s) => s.strictFocus);
  const setStrictFocus = useProgressStore((s) => s.setStrictFocus);
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
    <div className="lesson-page lesson-page--focus">
      <FocusTacticalBar
        lesson={lesson}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        strictFocus={strictFocus}
        onStrictFocusChange={setStrictFocus}
        showObjectives={showObjectives}
        onToggleObjectives={onToggleObjectives}
        activeConceptIndex={item.conceptIndex}
        milestoneConcept={milestoneConcept}
        onSelectConcept={(ci) => goToIndex(getConceptStartQueueIndex(lesson.id, ci))}
        queueIndex={queueIndex}
        total={total}
        conceptTitle={item.conceptTitle}
        stage={item.example.stage.toUpperCase()}
        progressPct={progressPct}
      />

      <div className="lesson-session focus-mode">
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

        <div className="session-controls session-controls--tactical">
          <button type="button" className="btn-secondary btn-compact" onClick={handleBack} disabled={queueIndex === 0}>
            ← Prev
          </button>
          {!atLast && (
            <button
              type="button"
              className="btn-primary btn-compact"
              onClick={handleContinue}
              disabled={!readyToContinue}
            >
              Advance →
            </button>
          )}
          {strictFocus && lastAttemptCorrect === false && !readyToContinue && (
            <p className="strict-hint">Hold — resolve task or disengage Lock protocol.</p>
          )}
          {atLast && item.isLessonCheck && allCheckAttempted && (
            <button
              type="button"
              className="btn-primary btn-compact"
              onClick={() => recordLessonCheck(lesson.id, checkScore)}
            >
              Log check ({checkScore}%)
            </button>
          )}
          {atLast && !item.isLessonCheck && (
            <Link to="/" className="btn-primary btn-link btn-compact">
              RTB — C2 post
            </Link>
          )}
        </div>

        {item.isLessonCheck && (
          <p className="check-progress session-check-progress">
            Lesson check: {checkCorrect}/{checkIds.length} ({checkScore}%)
          </p>
        )}
      </div>
    </div>
  );
}
