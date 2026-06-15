import { useProgressStore } from '../store/progress';
import { buildSmartPracticeQueue } from '../engine/practiceQueue';
import { ReviewSession } from '../components/ReviewSession';

export function PracticePage() {
  const srsQueue = useProgressStore((s) => s.srsQueue);
  const examples = useProgressStore((s) => s.examples);
  const sessionPosition = useProgressStore((s) => s.sessionPosition);

  const queueIds = buildSmartPracticeQueue(srsQueue, examples, sessionPosition);

  return (
    <div className="practice-page">
      <p className="panel-desc">Due reviews, recent misses, and your next incomplete examples — mixed for you.</p>
      <ReviewSession
        exampleIds={queueIds}
        banner={
          queueIds.length > 0
            ? `${queueIds.length} examples in this session`
            : undefined
        }
        focusMode
      />
    </div>
  );
}
