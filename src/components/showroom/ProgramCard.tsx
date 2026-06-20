import type { ShowroomProgram } from '../../content/showroom/schema';

interface ProgramCardProps {
  program: ShowroomProgram;
  isSelected: boolean;
  onClick: () => void;
}

export function ProgramCard({ program, isSelected, onClick }: ProgramCardProps) {
  return (
    <button
      type="button"
      className={`showroom-card${isSelected ? ' showroom-card--active' : ''}`}
      onClick={onClick}
    >
      <div className="showroom-card-header">
        <span className="showroom-card-title">{program.title}</span>
        <span className={`difficulty ${program.difficulty}`}>{program.difficulty}</span>
      </div>
      <p className="showroom-card-desc">{program.description}</p>
      <div className="showroom-card-tags">
        {program.techniques.map((t) => (
          <span key={t} className="showroom-tag">
            {t}
          </span>
        ))}
      </div>
    </button>
  );
}
