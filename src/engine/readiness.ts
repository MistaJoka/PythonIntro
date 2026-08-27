import { MISTAKE_TAGS, type MistakeTag } from '../content/schema';
import { getAllExamples, ML_LESSONS } from '../content/registry';

export interface BridgeSkillReadiness {
  id: string;
  title: string;
  completed: number;
  total: number;
  pct: number;
}

/**
 * Per-skill readiness for the CAI 2100C bridge tier.
 *
 * Derived strictly from examples actually answered correctly — never a
 * self-assessed or arbitrary figure — so a bar can only move by doing the work.
 * An untouched lesson reports 0 rather than being hidden, because "not started"
 * is the most useful thing a readiness screen can say.
 */
export function computeBridgeReadiness(
  examples: Record<string, { correct: boolean }>,
): BridgeSkillReadiness[] {
  return ML_LESSONS.map((lesson) => {
    const ids = [
      ...lesson.concepts.flatMap((c) => c.examples.map((e) => e.id)),
      ...lesson.lessonCheck.map((e) => e.id),
    ];
    const completed = ids.filter((id) => examples[id]?.correct).length;
    const total = ids.length;
    return {
      id: lesson.id,
      title: lesson.title,
      completed,
      total,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });
}

/** Overall bridge readiness — the share of all bridge examples answered correctly. */
export function computeBridgeReadinessScore(
  examples: Record<string, { correct: boolean }>,
): number {
  const skills = computeBridgeReadiness(examples);
  const total = skills.reduce((n, s) => n + s.total, 0);
  const completed = skills.reduce((n, s) => n + s.completed, 0);
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

interface ReadinessInput {
  examples: Record<string, { correct: boolean; tags: MistakeTag[] }>;
  lessonChecks: Record<string, { score: number }>;
  diagnostic: { tagScores: Record<string, number> } | null;
}

export function computeTagStatsFromExamples(
  examples: Record<string, { correct: boolean; tags: MistakeTag[] }>,
): Record<MistakeTag, { attempts: number; correct: number }> {
  const stats = Object.fromEntries(
    MISTAKE_TAGS.map((t) => [t, { attempts: 0, correct: 0 }]),
  ) as Record<MistakeTag, { attempts: number; correct: number }>;

  for (const attempt of Object.values(examples)) {
    for (const tag of attempt.tags) {
      stats[tag].attempts += 1;
      if (attempt.correct) stats[tag].correct += 1;
    }
  }
  return stats;
}

export function tagAccuracyFromStats(
  stats: Record<MistakeTag, { attempts: number; correct: number }>,
  tag: MistakeTag,
  minAttempts = 2,
): number | null {
  const { attempts, correct } = stats[tag];
  if (attempts < minAttempts) return null;
  return Math.round((correct / attempts) * 100);
}

export function computeReadinessScore(state: ReadinessInput): number {
  const total = getAllExamples().length;
  const mastered = Object.values(state.examples).filter((e) => e.correct).length;
  const courseCompletion = total > 0 ? mastered / total : 0;

  const checkScores = Object.values(state.lessonChecks).map((c) => c.score);
  const lessonCheckAvg =
    checkScores.length > 0
      ? checkScores.reduce((a, b) => a + b, 0) / checkScores.length / 100
      : 0;

  const diagScores = state.diagnostic?.tagScores
    ? Object.values(state.diagnostic.tagScores)
    : [];
  const diagnosticScore =
    diagScores.length > 0 ? diagScores.reduce((a, b) => a + b, 0) / diagScores.length : 0;

  return Math.round((0.5 * courseCompletion + 0.3 * lessonCheckAvg + 0.2 * diagnosticScore) * 100);
}

export function exportAnkiCsv(
  examples: Record<string, { correct: boolean }>,
): string {
  const missed = Object.entries(examples).filter(([, v]) => !v.correct);
  const rows = [['front', 'back']];
  const all = getAllExamples();
  for (const [id] of missed) {
    const ex = all.find((e) => e.id === id);
    if (!ex) continue;
    const front = ex.prompt.replace(/"/g, '""');
    let back = ex.explanation.replace(/"/g, '""');
    if ('options' in ex && 'answerIndex' in ex) {
      back += ` | Answer: ${ex.options[ex.answerIndex]}`;
    }
    if (ex.trapNote) back += ` | ${ex.trapNote}`;
    rows.push([`"${front}"`, `"${back}"`]);
  }
  return rows.map((r) => r.join(',')).join('\n');
}
