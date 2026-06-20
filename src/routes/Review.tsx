import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { getAllLessons } from '../content/registry';
import { MISTAKE_TAGS, type MistakeTag } from '../content/schema';
import { buildReviewQueue, getReviewBatch } from '../engine/practiceQueue';
import { useProgressStore } from '../store/progress';
import { ReviewSession } from '../components/ReviewSession';
import { TacticalBrief } from '../components/layout/TacticalBrief';

export function ReviewPage() {
  const [searchParams] = useSearchParams();
  const tagParam = searchParams.get('tag');
  const tagFilter =
    tagParam && MISTAKE_TAGS.includes(tagParam as MistakeTag)
      ? (tagParam as MistakeTag)
      : undefined;

  const srsQueue = useProgressStore((s) => s.srsQueue);
  const examples = useProgressStore((s) => s.examples);
  const [lessonFilter, setLessonFilter] = useState<string>('all');
  const [batchStart, setBatchStart] = useState(0);
  const [batchKey, setBatchKey] = useState(0);

  const filteredIds = useMemo(
    () =>
      buildReviewQueue(srsQueue, examples, {
        lessonFilter,
        tagFilter,
      }),
    [srsQueue, examples, lessonFilter, tagFilter],
  );

  const displayIds = useMemo(
    () => getReviewBatch(filteredIds, batchStart),
    [filteredIds, batchStart],
  );

  const lessons = getAllLessons();
  const remaining = Math.max(0, filteredIds.length - batchStart - displayIds.length);
  const dueToday = displayIds.filter((id) =>
    srsQueue.some(
      (q) => q.exampleId === id && new Date(q.dueDate) <= new Date(),
    ),
  ).length;

  const handleBatchComplete = useCallback(() => {
    if (remaining > 0) {
      setBatchStart((s) => s + displayIds.length);
      setBatchKey((k) => k + 1);
    }
  }, [remaining, displayIds.length]);

  const resetFilters = () => {
    setBatchStart(0);
    setBatchKey((k) => k + 1);
  };

  return (
    <div className="review-page">
      <TacticalBrief>
        Spaced repetition — items you've missed or that are due per the SRS schedule.
      </TacticalBrief>
      {tagFilter && (
        <p className="tag-filter-banner">
          Filter active: <strong>{tagFilter}</strong>{' '}
          <Link to="/review">Clear filter</Link>
        </p>
      )}
      <label className="filter-row">
        Module filter:
        <select
          value={lessonFilter}
          onChange={(e) => {
            setLessonFilter(e.target.value);
            resetFilters();
          }}
        >
          <option value="all">All lessons</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
      </label>
      <p className="review-queue-meta">
        {filteredIds.length} targets in queue
        {batchStart > 0 ? ` · wave ${Math.floor(batchStart / 10) + 1}` : ''}
      </p>
      <ReviewSession
        key={batchKey}
        exampleIds={displayIds}
        channel="REVIEW DRILL"
        focusMode
        banner={
          displayIds.length > 0
            ? `${dueToday} due · ${displayIds.length} this wave${remaining > 0 ? ` · ${remaining} remain` : ''}`
            : undefined
        }
        onSessionComplete={remaining > 0 ? handleBatchComplete : undefined}
        continueLabel={remaining > 0 ? `Next wave (${remaining} left) →` : undefined}
      />
    </div>
  );
}
