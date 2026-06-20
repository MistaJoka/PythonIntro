import { useState } from 'react';
import { SHOWROOM_PROGRAMS } from '../../content/showroom/programs';
import { ProgramCard } from '../../components/showroom/ProgramCard';
import { AnnotatedCodeViewer } from '../../components/showroom/AnnotatedCodeViewer';
import { TacticalBrief } from '../../components/layout/TacticalBrief';

export function ShowroomPage() {
  const [selectedId, setSelectedId] = useState(SHOWROOM_PROGRAMS[0].id);
  const selected =
    SHOWROOM_PROGRAMS.find((p) => p.id === selectedId) ?? SHOWROOM_PROGRAMS[0];

  return (
    <div className="showroom-page">
      <TacticalBrief>
        Real programs from the course — read code with line-by-line annotations.
      </TacticalBrief>
      <div className="showroom-layout">
        <div className="showroom-list">
          {SHOWROOM_PROGRAMS.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              isSelected={program.id === selectedId}
              onClick={() => setSelectedId(program.id)}
            />
          ))}
        </div>
        <div className="showroom-detail">
          <AnnotatedCodeViewer program={selected} />
        </div>
      </div>
    </div>
  );
}
