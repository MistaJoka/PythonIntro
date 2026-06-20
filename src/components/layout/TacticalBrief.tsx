import type { ReactNode } from 'react';

interface TacticalBriefProps {
  children: ReactNode;
}

export function TacticalBrief({ children }: TacticalBriefProps) {
  return (
    <div className="ops-brief">
      <p className="ops-brief-intel">{children}</p>
    </div>
  );
}
