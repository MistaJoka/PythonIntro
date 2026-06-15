import type { CSSProperties } from 'react';
import type { Lesson } from '../content/schema';
import { getConceptProgress } from '../engine/lessonQueue';
import { useProgressStore } from '../store/progress';

interface ConceptStepperProps {
  lesson: Lesson;
  activeConceptIndex: number;
  onSelectConcept: (conceptIndex: number) => void;
  milestoneConcept?: number | null;
}

export function ConceptStepper({
  lesson,
  activeConceptIndex,
  onSelectConcept,
  milestoneConcept,
}: ConceptStepperProps) {
  const attempts = useProgressStore((s) => s.examples);

  const chips = [
    ...lesson.concepts.map((c, i) => ({ id: c.id, title: c.title, index: i, isCheck: false })),
    { id: 'lesson-check', title: 'Check', index: lesson.concepts.length, isCheck: true },
  ];

  return (
    <nav className="concept-stepper" aria-label="Concept navigation">
      {chips.map((chip) => {
        const { completed, total } = getConceptProgress(lesson.id, chip.index, attempts);
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        const active = chip.index === activeConceptIndex;
        return (
          <button
            key={chip.id}
            type="button"
            className={`concept-chip ${active ? 'active' : ''} ${pct === 100 ? 'complete' : ''} ${milestoneConcept === chip.index ? 'milestone' : ''}`}
            style={{ '--chip-progress': `${pct}%` } as CSSProperties}
            onClick={() => onSelectConcept(chip.index)}
            title={`${chip.title} — ${completed}/${total}`}
          >
            <span className="chip-ring" aria-hidden="true" />
            <span className="chip-label">{chip.isCheck ? '✓ Check' : chip.title.split(' ')[0]}</span>
          </button>
        );
      })}
    </nav>
  );
}
