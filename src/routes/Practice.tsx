import { useProgressStore } from '../store/progress';
import { buildSmartPracticeQueue } from '../engine/practiceQueue';
import { ReviewSession } from '../components/ReviewSession';
import { TacticalBrief } from '../components/layout/TacticalBrief';

export function PracticePage() {
  const srsQueue = useProgressStore((s) => s.srsQueue);
  const examples = useProgressStore((s) => s.examples);
  const sessionPosition = useProgressStore((s) => s.sessionPosition);

  const queueIds = buildSmartPracticeQueue(srsQueue, examples, sessionPosition);

  return (
    <div className="practice-page">
      <TacticalBrief>
        SRS queue — due items, recent misses, and the next unseen example in your current module.
      </TacticalBrief>
      <ReviewSession
        exampleIds={queueIds}
        channel="PRACTICE"
        banner={
          queueIds.length > 0
            ? `${queueIds.length} questions queued`
            : undefined
        }
        focusMode
      />
    </div>
  );
}
