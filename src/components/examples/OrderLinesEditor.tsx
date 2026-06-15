import { useMemo, useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Example } from '../../content/schema';

interface OrderLinesEditorProps {
  example: Extract<Example, { type: 'orderLines' }>;
  onChange: (order: number[]) => void;
  disabled?: boolean;
}

function SortableLine({
  id,
  text,
  index,
  disabled,
}: {
  id: string;
  text: string;
  index: number;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="order-line" {...attributes} {...listeners}>
      <span className="order-grip" aria-hidden="true">
        ⋮⋮
      </span>
      <span className="line-num">{index + 1}</span>
      <code>{text}</code>
      <div className="order-arrows">
        <button
          type="button"
          className="btn-icon"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            const event = new CustomEvent('move-line', { detail: { id, dir: -1 } });
            window.dispatchEvent(event);
          }}
          aria-label="Move up"
        >
          ↑
        </button>
        <button
          type="button"
          className="btn-icon"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            const event = new CustomEvent('move-line', { detail: { id, dir: 1 } });
            window.dispatchEvent(event);
          }}
          aria-label="Move down"
        >
          ↓
        </button>
      </div>
    </div>
  );
}

function shuffleIndices(n: number, seed: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  let s = seed;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function OrderLinesEditor({ example, onChange, disabled }: OrderLinesEditorProps) {
  const initialOrder = useMemo(() => {
    const shuffled = shuffleIndices(example.lines.length, example.id.length);
    if (JSON.stringify(shuffled) === JSON.stringify(example.correctOrder)) {
      return [...shuffled].reverse();
    }
    return shuffled;
  }, [example.correctOrder, example.id, example.lines.length]);

  const [order, setOrder] = useState<number[]>(initialOrder);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = order.map((origIdx) => `line-${origIdx}`);

  const updateOrder = (next: number[]) => {
    setOrder(next);
    onChange(next);
  };

  useEffect(() => {
    onChange(order);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const { id, dir } = (e as CustomEvent<{ id: string; dir: number }>).detail;
      const origIdx = Number(id.replace('line-', ''));
      setOrder((prev) => {
        const pos = prev.indexOf(origIdx);
        if (pos < 0) return prev;
        const target = pos + dir;
        if (target < 0 || target >= prev.length) return prev;
        const next = arrayMove(prev, pos, target);
        onChange(next);
        return next;
      });
    };
    window.addEventListener('move-line', handler);
    return () => window.removeEventListener('move-line', handler);
  }, [onChange]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    updateOrder(arrayMove(order, oldIndex, newIndex));
  };

  return (
    <div className="order-lines-editor">
      {example.codeContext && <pre className="code-block code-context">{example.codeContext}</pre>}
      <p className="order-hint">Drag lines into the order they execute, or use ↑↓ buttons.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {order.map((origIdx, i) => (
            <SortableLine
              key={`line-${origIdx}`}
              id={`line-${origIdx}`}
              text={example.lines[origIdx]}
              index={i}
              disabled={disabled}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
