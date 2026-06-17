import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { TraceDisplayStep } from '../engine/executionTrace';

function stepsKey(steps: TraceDisplayStep[]): string {
  return steps.map((s) => `${s.line}:${JSON.stringify(s.vars)}:${s.output ?? ''}`).join('|');
}

export interface ExecutionTraceState {
  stepIndex: number;
  maxStep: number;
  step: TraceDisplayStep | undefined;
  visited: Set<number>;
  allVisited: boolean;
  progressPct: number;
  nextUnvisitedIndex: number | null;
  goToStep: (next: number) => void;
  goNext: () => void;
  goPrev: () => void;
  panelRef: RefObject<HTMLDivElement | null>;
}

export function useExecutionTrace(
  steps: TraceDisplayStep[],
  requireAllSteps: boolean,
  onAllStepsVisited?: () => void,
): ExecutionTraceState {
  const key = stepsKey(steps);
  const [stepIndex, setStepIndex] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [prevKey, setPrevKey] = useState(key);
  const panelRef = useRef<HTMLDivElement>(null);

  if (prevKey !== key) {
    setPrevKey(key);
    setStepIndex(0);
    setVisited(new Set([0]));
  }

  const maxStep = Math.max(0, steps.length - 1);
  const step = steps[stepIndex];

  const goToStep = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(maxStep, next));
      setStepIndex(clamped);
      setVisited((prev) => {
        const n = new Set(prev);
        n.add(clamped);
        return n;
      });
    },
    [maxStep],
  );

  const goNext = useCallback(() => goToStep(stepIndex + 1), [goToStep, stepIndex]);
  const goPrev = useCallback(() => goToStep(stepIndex - 1), [goToStep, stepIndex]);

  useEffect(() => {
    if (!requireAllSteps) {
      onAllStepsVisited?.();
      return;
    }
    if (visited.size >= steps.length) {
      onAllStepsVisited?.();
    }
  }, [requireAllSteps, visited.size, steps.length, onAllStepsVisited]);

  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, [key]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || steps.length === 0) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToStep(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToStep(maxStep);
      }
    };

    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, goToStep, maxStep, steps.length]);

  const allVisited = !requireAllSteps || visited.size >= steps.length;
  const progressPct = steps.length > 0 ? Math.round((visited.size / steps.length) * 100) : 0;

  const nextUnvisitedIndex = useMemo(() => {
    for (let i = 0; i <= maxStep; i += 1) {
      if (!visited.has(i)) return i;
    }
    return null;
  }, [visited, maxStep]);

  return {
    stepIndex,
    maxStep,
    step,
    visited,
    allVisited,
    progressPct,
    nextUnvisitedIndex,
    goToStep,
    goNext,
    goPrev,
    panelRef,
  };
}
