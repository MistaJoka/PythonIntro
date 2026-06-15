import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { Example } from '../../content/schema';

interface DragBlankEditorProps {
  example: Extract<Example, { type: 'dragBlank' }>;
  onChange: (fills: Record<string, string>) => void;
  disabled?: boolean;
}

function DraggableToken({
  id,
  label,
  disabled,
  onDoubleClick,
}: {
  id: string;
  label: string;
  disabled?: boolean;
  onDoubleClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, disabled });
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`drag-token ${isDragging ? 'dragging' : ''}`}
      disabled={disabled}
      onDoubleClick={onDoubleClick}
      {...listeners}
      {...attributes}
    >
      {label}
    </button>
  );
}

function DropSlot({
  blankId,
  value,
  onClear,
  disabled,
}: {
  blankId: string;
  value: string | null;
  onClear: () => void;
  disabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: blankId, disabled });
  return (
    <span
      ref={setNodeRef}
      className={`drag-slot ${value ? 'filled' : ''} ${isOver ? 'over' : ''}`}
    >
      {value ?? '____'}
      {value && !disabled && (
        <button type="button" className="slot-clear" onClick={onClear} aria-label="Clear">
          ×
        </button>
      )}
    </span>
  );
}

function shuffleTokens(tokens: string[], seed: number): string[] {
  const copy = [...tokens];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function DragBlankEditor({ example, onChange, disabled }: DragBlankEditorProps) {
  const tokens = useMemo(() => {
    const answers = example.blanks.map((b) => b.answer);
    return shuffleTokens([...answers, ...example.distractors], example.id.length);
  }, [example]);

  const [fills, setFills] = useState<Record<string, string>>({});
  const [usedTokens, setUsedTokens] = useState<Set<string>>(new Set());
  const [activeToken, setActiveToken] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const updateFills = (next: Record<string, string>, used: Set<string>) => {
    setFills(next);
    setUsedTokens(used);
    if (example.blanks.every((b) => next[b.id])) {
      onChange(next);
    }
  };

  const placeToken = (blankId: string, token: string) => {
    if (disabled || usedTokens.has(token)) return;
    const prev = fills[blankId];
    const next = { ...fills, [blankId]: token };
    const used = new Set(usedTokens);
    if (prev) used.delete(prev);
    used.add(token);
    updateFills(next, used);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveToken(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveToken(null);
    const { active, over } = event;
    if (!over) return;
    placeToken(String(over.id), String(active.id));
  };

  const handleTokenClick = (token: string) => {
    if (disabled || usedTokens.has(token)) return;
    const emptyBlank = example.blanks.find((b) => !fills[b.id]);
    if (emptyBlank) placeToken(emptyBlank.id, token);
  };

  const renderCode = () => {
    const parts = example.code.split(/\{\{(\w+)\}\}/);
    const nodes: ReactNode[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        if (parts[i]) nodes.push(<span key={`t-${i}`}>{parts[i]}</span>);
      } else {
        const blankId = parts[i];
        nodes.push(
          <DropSlot
            key={blankId}
            blankId={blankId}
            value={fills[blankId] ?? null}
            disabled={disabled}
            onClear={() => {
              const token = fills[blankId];
              if (!token) return;
              const next = { ...fills };
              delete next[blankId];
              const used = new Set(usedTokens);
              used.delete(token);
              updateFills(next, used);
            }}
          />,
        );
      }
    }
    return nodes;
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="drag-blank-editor">
        <pre className="code-block drag-code">{renderCode()}</pre>
        <div className="token-bank">
          {tokens.map((token) => (
            <DraggableToken
              key={token}
              id={token}
              label={token}
              disabled={disabled || usedTokens.has(token)}
              onDoubleClick={() => handleTokenClick(token)}
            />
          ))}
        </div>
        <p className="drag-hint">Drag tokens into blanks, or double-click a token to auto-fill the next blank.</p>
      </div>
      <DragOverlay>
        {activeToken ? <span className="drag-token overlay">{activeToken}</span> : null}
      </DragOverlay>
    </DndContext>
  );
}
