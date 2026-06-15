import { useState } from 'react';
import type { HumanizedError } from '../engine/humanizeError';

interface RunFeedbackProps {
  message: string;
  passed?: boolean;
  humanized?: HumanizedError;
}

export function RunFeedback({ message, passed, humanized }: RunFeedbackProps) {
  const [showRaw, setShowRaw] = useState(false);

  if (!message) return null;

  return (
    <div className={`feedback motion-feedback ${passed ? 'correct' : 'wrong'}`}>
      <p>{humanized?.friendly ?? message}</p>
      {humanized && humanized.raw !== humanized.friendly && (
        <>
          <button type="button" className="btn-text error-details-toggle" onClick={() => setShowRaw((v) => !v)}>
            {showRaw ? 'Hide details' : 'Show details'}
          </button>
          {showRaw && <pre className="error-raw-block">{humanized.raw}</pre>}
        </>
      )}
    </div>
  );
}
