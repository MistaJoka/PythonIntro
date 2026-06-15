import { MISTAKE_TAGS, type MistakeTag } from '../content/schema';
import { getAllExamples } from '../content/registry';

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
