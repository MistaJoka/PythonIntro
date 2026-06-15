import { MISTAKE_TAGS, type MistakeTag } from '../content/schema';
import { computeTagStatsFromExamples, tagAccuracyFromStats } from './readiness';

export function getWeakestTagForDashboard(
  examples: Record<string, { correct: boolean; tags: MistakeTag[] }>,
): MistakeTag | null {
  const stats = computeTagStatsFromExamples(examples);
  let worst: { tag: MistakeTag; accuracy: number } | null = null;
  for (const tag of MISTAKE_TAGS) {
    const accuracy = tagAccuracyFromStats(stats, tag);
    if (accuracy === null) continue;
    if (!worst || accuracy < worst.accuracy) worst = { tag, accuracy };
  }
  return worst?.tag ?? null;
}
