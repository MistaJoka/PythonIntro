import type { ReactNode } from 'react';

interface TacticalBriefProps {
  /** STANAG message type — SITREP, OPORD, FRAGO, etc. */
  msgType?: string;
  /** Operation / channel designator */
  sector?: string;
  children: ReactNode;
}

/** NATO terminal intel strip — consistent across viewports */
export function TacticalBrief({ msgType = 'SITREP', sector, children }: TacticalBriefProps) {
  return (
    <div className="ops-brief">
      <div className="ops-brief-tags">
        <span className="ops-brief-msg">{msgType}</span>
        {sector && <span className="ops-brief-sector">{sector}</span>}
      </div>
      <p className="ops-brief-intel">{children}</p>
    </div>
  );
}
