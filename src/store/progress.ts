import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { updateSrsQueue } from '../engine/srs';
import { computeReadinessScore } from '../engine/readiness';
import type { MistakeTag } from '../content/schema';
import { getAllExamples, getLessonById, LESSON_META } from '../content/registry';

export interface ExampleAttempt {
  correct: boolean;
  attempts: number;
  lastSeen: string;
  lessonId: string;
  tags: MistakeTag[];
}

export interface SessionPosition {
  conceptIndex: number;
  exampleIndex: number;
  updatedAt: string;
}

export interface CapstoneProgress {
  code: string;
  passed: boolean;
  attempts: number;
  completedAt?: string;
  lastSeen: string;
}

export interface ProgressState {
  schemaVersion: 4;
  examples: Record<string, ExampleAttempt>;
  lessonChecks: Record<string, { score: number; date: string }>;
  srsQueue: { exampleId: string; dueDate: string; intervalDays: number }[];
  courseProgress: Record<string, number>;
  sessionPosition: Record<string, SessionPosition>;
  capstones: Record<string, CapstoneProgress>;
  diagnostic: { date: string; tagScores: Record<string, number> } | null;
  examHistory: {
    id: string;
    date: string;
    examSetId: string;
    score: number;
    tagMisses: MistakeTag[];
  }[];
  examInProgress: {
    examSetId: string;
    startedAt: string;
    answers: Record<string, unknown>;
  } | null;
  readinessScore: number;
  strictFocus: boolean;
}

const initialState: ProgressState = {
  schemaVersion: 4,
  examples: {},
  lessonChecks: {},
  srsQueue: [],
  courseProgress: {},
  sessionPosition: {},
  capstones: {},
  diagnostic: null,
  examHistory: [],
  examInProgress: null,
  readinessScore: 0,
  strictFocus: false,
};

function computeLessonProgress(lessonId: string, examples: Record<string, ExampleAttempt>): number {
  const lesson = getLessonById(lessonId);
  if (!lesson) return 0;
  const allIds = [
    ...lesson.concepts.flatMap((c) => c.examples.map((e) => e.id)),
    ...lesson.lessonCheck.map((e) => e.id),
  ];
  if (allIds.length === 0) return 0;
  const completed = allIds.filter((id) => examples[id]?.correct).length;
  return Math.round((completed / allIds.length) * 100);
}

function recomputeCourseProgress(examples: Record<string, ExampleAttempt>): Record<string, number> {
  const progress: Record<string, number> = {};
  for (const meta of LESSON_META) {
    progress[meta.id] = computeLessonProgress(meta.id, examples);
  }
  return progress;
}

interface ProgressActions {
  recordAttempt: (
    exampleId: string,
    lessonId: string,
    tags: MistakeTag[],
    correct: boolean,
  ) => void;
  recordLessonCheck: (lessonId: string, score: number) => void;
  saveDiagnostic: (tagScores: Record<string, number>) => void;
  completeExam: (examSetId: string, score: number, tagMisses: MistakeTag[]) => void;
  exportProgress: () => string;
  importProgress: (json: string) => boolean;
  resetProgress: () => void;
  saveSessionPosition: (lessonId: string, conceptIndex: number, exampleIndex: number) => void;
  saveCapstoneCode: (projectId: string, code: string) => void;
  recordCapstoneAttempt: (projectId: string, code: string, correct: boolean) => void;
  setStrictFocus: (enabled: boolean) => void;
}

function migrateProgress(parsed: Record<string, unknown>): ProgressState {
  const base = parsed as Partial<ProgressState> & { schemaVersion?: number };
  if (base.schemaVersion === 4) {
    return {
      ...initialState,
      ...base,
      schemaVersion: 4,
      capstones: base.capstones ?? {},
      strictFocus: base.strictFocus ?? false,
    } as ProgressState;
  }
  if (base.schemaVersion === 3) {
    return {
      schemaVersion: 4,
      examples: base.examples ?? {},
      lessonChecks: base.lessonChecks ?? {},
      srsQueue: base.srsQueue ?? [],
      courseProgress: recomputeCourseProgress(base.examples ?? {}),
      sessionPosition: base.sessionPosition ?? {},
      capstones: {},
      diagnostic: base.diagnostic ?? null,
      examHistory: base.examHistory ?? [],
      examInProgress: base.examInProgress ?? null,
      readinessScore: base.readinessScore ?? 0,
      strictFocus: base.strictFocus ?? false,
    };
  }
  if (base.schemaVersion === 2) {
    return {
      schemaVersion: 4,
      examples: base.examples ?? {},
      lessonChecks: base.lessonChecks ?? {},
      srsQueue: base.srsQueue ?? [],
      courseProgress: recomputeCourseProgress(base.examples ?? {}),
      sessionPosition: base.sessionPosition ?? {},
      capstones: {},
      diagnostic: base.diagnostic ?? null,
      examHistory: base.examHistory ?? [],
      examInProgress: base.examInProgress ?? null,
      readinessScore: base.readinessScore ?? 0,
      strictFocus: false,
    };
  }
  return initialState;
}

export const useProgressStore = create<ProgressState & ProgressActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      recordAttempt: (exampleId, lessonId, tags, correct) => {
        set((state) => {
          const prev = state.examples[exampleId];
          const examples = {
            ...state.examples,
            [exampleId]: {
              correct: correct || prev?.correct || false,
              attempts: (prev?.attempts ?? 0) + 1,
              lastSeen: new Date().toISOString(),
              lessonId,
              tags,
            },
          };
          const srsQueue = updateSrsQueue(state.srsQueue, exampleId, correct);
          const next = {
            examples,
            srsQueue,
            courseProgress: recomputeCourseProgress(examples),
          };
          return {
            ...next,
            readinessScore: computeReadinessScore({
              examples,
              lessonChecks: state.lessonChecks,
              diagnostic: state.diagnostic,
            }),
          };
        });
      },
      recordLessonCheck: (lessonId, score) => {
        set((state) => {
          const lessonChecks = {
            ...state.lessonChecks,
            [lessonId]: { score, date: new Date().toISOString() },
          };
          return {
            lessonChecks,
            readinessScore: computeReadinessScore({
              examples: state.examples,
              lessonChecks,
              diagnostic: state.diagnostic,
            }),
          };
        });
      },
      saveDiagnostic: (tagScores) => {
        set((state) => {
          const diagnostic = { date: new Date().toISOString(), tagScores };
          return {
            diagnostic,
            readinessScore: computeReadinessScore({
              examples: state.examples,
              lessonChecks: state.lessonChecks,
              diagnostic,
            }),
          };
        });
      },
      completeExam: (examSetId, score, tagMisses) => {
        set((state) => ({
          examHistory: [
            ...state.examHistory,
            {
              id: `exam-${Date.now()}`,
              date: new Date().toISOString(),
              examSetId,
              score,
              tagMisses,
            },
          ],
          examInProgress: null,
        }));
      },
      exportProgress: () => JSON.stringify(get(), null, 2),
      importProgress: (json) => {
        try {
          const parsed = JSON.parse(json) as Record<string, unknown>;
          const migrated = migrateProgress(parsed);
          if (!migrated.schemaVersion) return false;
          set(migrated);
          return true;
        } catch {
          return false;
        }
      },
      resetProgress: () => set(initialState),
      saveSessionPosition: (lessonId, conceptIndex, exampleIndex) => {
        set((state) => ({
          sessionPosition: {
            ...state.sessionPosition,
            [lessonId]: {
              conceptIndex,
              exampleIndex,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },
      saveCapstoneCode: (projectId, code) => {
        set((state) => {
          const prev = state.capstones[projectId];
          return {
            capstones: {
              ...state.capstones,
              [projectId]: {
                code,
                attempts: prev?.attempts ?? 0,
                passed: prev?.passed ?? false,
                completedAt: prev?.completedAt,
                lastSeen: new Date().toISOString(),
              },
            },
          };
        });
      },
      recordCapstoneAttempt: (projectId, code, correct) => {
        set((state) => {
          const prev = state.capstones[projectId];
          const passed = correct || (prev?.passed ?? false);
          return {
            capstones: {
              ...state.capstones,
              [projectId]: {
                code,
                attempts: (prev?.attempts ?? 0) + 1,
                passed,
                completedAt: passed ? (prev?.completedAt ?? new Date().toISOString()) : undefined,
                lastSeen: new Date().toISOString(),
              },
            },
          };
        });
      },
      setStrictFocus: (enabled) => set({ strictFocus: enabled }),
    }),
    {
      name: 'intro-python-progress',
      version: 4,
      migrate: (persisted, version) => {
        if (version < 4) {
          return migrateProgress(persisted as Record<string, unknown>);
        }
        return persisted as ProgressState;
      },
    },
  ),
);

export function getOverallCompletion(): number {
  const store = useProgressStore.getState();
  const values = Object.values(store.courseProgress);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function countCompletedExamples(): number {
  return Object.values(useProgressStore.getState().examples).filter((e) => e.correct).length;
}

export function getTotalExampleCount(): number {
  return getAllExamples().length;
}

export function countCompletedCapstones(): number {
  return Object.values(useProgressStore.getState().capstones).filter((c) => c.passed).length;
}

export { recomputeCourseProgress, computeLessonProgress };
