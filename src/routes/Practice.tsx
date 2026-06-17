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
      <TacticalBrief msgType="SITREP" sector="TRG-DRILL">
        Auto-sequenced task queue — due SRS items, recent misses, and next incomplete modules.
      </TacticalBrief>
      <ReviewSession
        exampleIds={queueIds}
        channel="SMART DRILL"
        banner={
          queueIds.length > 0
            ? `${queueIds.length} sorties in queue`
            : undefined
        }
        focusMode
      />
    </div>
  );
}
