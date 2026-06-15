export interface SrsEntry {
  exampleId: string;
  dueDate: string;
  intervalDays: number;
}

/** Update SRS queue after an attempt (simplified SM-2). */
export function updateSrsQueue(
  queue: SrsEntry[],
  exampleId: string,
  correct: boolean,
  now = new Date(),
): SrsEntry[] {
  const existing = queue.find((q) => q.exampleId === exampleId);

  if (!correct) {
    if (existing) {
      return queue.map((q) =>
        q.exampleId === exampleId
          ? { ...q, dueDate: now.toISOString(), intervalDays: 1 }
          : q,
      );
    }
    return [
      ...queue,
      { exampleId, dueDate: now.toISOString(), intervalDays: 1 },
    ];
  }

  if (!existing) return queue;

  const nextInterval = existing.intervalDays * 2;
  const due = new Date(now);
  due.setDate(due.getDate() + nextInterval);
  return queue.map((q) =>
    q.exampleId === exampleId
      ? { exampleId, dueDate: due.toISOString(), intervalDays: nextInterval }
      : q,
  );
}

export function getDueExampleIds(queue: SrsEntry[], now = new Date()): string[] {
  return queue
    .filter((q) => new Date(q.dueDate) <= now)
    .map((q) => q.exampleId);
}

export function getMissedExampleIds(
  examples: Record<string, { correct: boolean }>,
): string[] {
  return Object.entries(examples)
    .filter(([, v]) => !v.correct)
    .map(([id]) => id);
}
