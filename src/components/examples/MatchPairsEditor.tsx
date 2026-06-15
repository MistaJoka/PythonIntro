import { useMemo, useState } from 'react';
import type { Example } from '../../content/schema';

interface MatchPairsEditorProps {
  example: Extract<Example, { type: 'matchPairs' }>;
  onChange: (pairs: [number, number][]) => void;
  disabled?: boolean;
}

function shuffleArray<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function MatchPairsEditor({ example, onChange, disabled }: MatchPairsEditorProps) {
  const rightOrder = useMemo(
    () => shuffleArray(example.rightItems.map((_, i) => i), example.id.length + 1),
    [example.id, example.rightItems],
  );

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<[number, number][]>([]);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);

  const matchedLeft = new Set(matched.map(([l]) => l));
  const matchedRight = new Set(matched.map(([, r]) => r));

  const tryMatch = (leftIdx: number, rightDisplayIdx: number) => {
    if (disabled) return;
    const rightOrigIdx = rightOrder[rightDisplayIdx];
    const pair: [number, number] = [leftIdx, rightOrigIdx];
    const isCorrect = example.pairs.some(([l, r]) => l === leftIdx && r === rightOrigIdx);

    if (isCorrect) {
      const next = [...matched, pair];
      setMatched(next);
      if (next.length === example.pairs.length) {
        onChange(next);
      }
      setSelectedLeft(null);
      setWrongFlash(null);
    } else {
      setWrongFlash(`${leftIdx}-${rightDisplayIdx}`);
      setTimeout(() => setWrongFlash(null), 300);
      setSelectedLeft(null);
    }
  };

  return (
    <div className="match-pairs-editor">
      <p className="match-hint">Click a left item, then its match on the right.</p>
      <div className="match-columns">
        <div className="match-col">
          {example.leftItems.map((item, leftIdx) => (
            <button
              key={leftIdx}
              type="button"
              className={`match-item ${selectedLeft === leftIdx ? 'selected' : ''} ${matchedLeft.has(leftIdx) ? 'matched' : ''}`}
              disabled={disabled || matchedLeft.has(leftIdx)}
              onClick={() => setSelectedLeft(leftIdx)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="match-col">
          {rightOrder.map((rightOrigIdx, displayIdx) => (
            <button
              key={displayIdx}
              type="button"
              className={`match-item ${matchedRight.has(rightOrigIdx) ? 'matched' : ''} ${wrongFlash === `${selectedLeft}-${displayIdx}` ? 'wrong-flash' : ''}`}
              disabled={disabled || matchedRight.has(rightOrigIdx) || selectedLeft === null}
              onClick={() => selectedLeft !== null && tryMatch(selectedLeft, displayIdx)}
            >
              {example.rightItems[rightOrigIdx]}
            </button>
          ))}
        </div>
      </div>
      <p className="match-progress">
        Matched {matched.length} / {example.pairs.length}
      </p>
    </div>
  );
}
