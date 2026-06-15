import { getAllLessons } from './registry';
import { INTERACTIVE_EXTRAS } from './interactiveExtras';
import type { Example } from './schema';

/** 20-question diagnostic — 2 per lesson from lesson checks / stretch + interactive samples */
function pickDiagnosticQuestions(): Example[] {
  const picked: Example[] = [];
  for (const lesson of getAllLessons()) {
    const pool = [
      ...lesson.lessonCheck,
      ...lesson.concepts.flatMap((c) => c.examples.filter((e) => e.stage === 'stretch')),
    ].filter((e) => e.type !== 'codeChallenge');
    if (pool.length === 0) continue;
    picked.push(pool[0]!);
    if (pool[1]) picked.push(pool[1]!);
  }

  const interactiveSamples = [
    INTERACTIVE_EXTRAS.lesson01?.[0],
    INTERACTIVE_EXTRAS.lesson02?.[1],
    INTERACTIVE_EXTRAS.lesson07?.[1],
  ].filter((e): e is Example => e !== undefined);

  const merged = [...picked, ...interactiveSamples];

  return merged.slice(0, 20).map((q, i) => ({ ...q, id: `diag-${i + 1}` }));
}

export const DIAGNOSTIC_QUESTIONS = pickDiagnosticQuestions();
