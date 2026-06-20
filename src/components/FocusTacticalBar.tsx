import type { Lesson } from '../content/schema';
import { ConceptStepper } from './ConceptStepper';

interface FocusTacticalBarProps {
  lesson: Lesson;
  viewMode: 'focus' | 'browse';
  onViewModeChange: (mode: 'focus' | 'browse') => void;
  strictFocus: boolean;
  onStrictFocusChange: (enabled: boolean) => void;
  showObjectives: boolean;
  onToggleObjectives: () => void;
  activeConceptIndex: number;
  milestoneConcept: number | null;
  onSelectConcept: (conceptIndex: number) => void;
  queueIndex: number;
  total: number;
  conceptTitle: string;
  stage: string;
  progressPct: number;
}

export function FocusTacticalBar({
  lesson,
  viewMode,
  onViewModeChange,
  strictFocus,
  onStrictFocusChange,
  showObjectives,
  onToggleObjectives,
  activeConceptIndex,
  milestoneConcept,
  onSelectConcept,
  queueIndex,
  total,
  conceptTitle,
  stage,
  progressPct,
}: FocusTacticalBarProps) {
  return (
    <div className="tactical-bar" role="toolbar" aria-label="Lesson controls">
      <div className="tactical-bar-row">
        <div className="tactical-segment tactical-segment--mode">
          <div className="view-toggle view-toggle--tactical" role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'focus'}
              aria-label="Practice mode"
              className={viewMode === 'focus' ? 'active' : ''}
              onClick={() => onViewModeChange('focus')}
            >
              Practice
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'browse'}
              aria-label="Reference mode"
              className={viewMode === 'browse' ? 'active' : ''}
              onClick={() => onViewModeChange('browse')}
            >
              Reference
            </button>
          </div>
        </div>

        <ConceptStepper
          lesson={lesson}
          activeConceptIndex={activeConceptIndex}
          milestoneConcept={milestoneConcept}
          onSelectConcept={onSelectConcept}
          compact
        />

        <div className="tactical-segment tactical-segment--status">
          <span className="tactical-concept" title={conceptTitle}>
            {conceptTitle}
          </span>
          <span className="stage-badge stage-badge--tactical">{stage}</span>
          <span className="tactical-progress">
            TASK {queueIndex + 1}/{total}
          </span>
          <div
            className="tactical-progress-track"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Lesson progress"
          >
            <div className="progress-segment" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="tactical-segment tactical-segment--opts">
          <label className="strict-toggle strict-toggle--tactical" title="Lock advance until correct">
            <input
              type="checkbox"
              checked={strictFocus}
              onChange={(e) => onStrictFocusChange(e.target.checked)}
            />
            <span>Lock</span>
          </label>
          <button
            type="button"
            className={`tactical-icon-btn${showObjectives ? ' active' : ''}`}
            onClick={onToggleObjectives}
            aria-expanded={showObjectives}
            title={showObjectives ? 'Hide mission objectives' : 'Show mission objectives'}
          >
            ◫
          </button>
        </div>
      </div>

      {showObjectives && (
        <ul className="tactical-objectives">
          {lesson.objectives.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
