import type { Example } from '../content/schema';

export interface GradeResult {
  correct: boolean;
  feedback: string;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function arraysEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function pairsEqual(
  user: [number, number][],
  expected: [number, number][],
): boolean {
  if (user.length !== expected.length) return false;
  const sortPair = (p: [number, number]) => `${p[0]}:${p[1]}`;
  const us = [...user].map(sortPair).sort();
  const es = [...expected].map(sortPair).sort();
  return us.every((v, i) => v === es[i]);
}

export function gradeExample(
  example: Example,
  answer: string | number,
): GradeResult {
  switch (example.type) {
    case 'traceSteps':
    case 'fillBlank': {
      const idx = Number(answer);
      const ok = idx === example.answerIndex;
      const correct = example.options[example.answerIndex];
      return {
        correct: ok,
        feedback: ok
          ? 'Correct!'
          : `The answer is: ${correct}. ${example.explanation}`,
      };
    }
    case 'multipleChoice': {
      const idx = Number(answer);
      const ok = idx === example.answerIndex;
      return {
        correct: ok,
        feedback: ok
          ? 'Correct!'
          : `The answer is: ${example.options[example.answerIndex]}. ${example.explanation}`,
      };
    }
    case 'fixTheLine': {
      const ok = Number(answer) === example.answerLine;
      return {
        correct: ok,
        feedback: ok
          ? 'Correct!'
          : `Line ${example.answerLine} is the problem. ${example.explanation}`,
      };
    }
    case 'orderLines': {
      try {
        const order = JSON.parse(String(answer)) as number[];
        const ok = arraysEqual(order, example.correctOrder);
        return {
          correct: ok,
          feedback: ok ? 'Correct order!' : example.explanation,
        };
      } catch {
        return { correct: false, feedback: 'Invalid order submission.' };
      }
    }
    case 'matchPairs': {
      try {
        const userPairs = JSON.parse(String(answer)) as [number, number][];
        const ok = pairsEqual(userPairs, example.pairs);
        return {
          correct: ok,
          feedback: ok ? 'All pairs matched!' : example.explanation,
        };
      } catch {
        return { correct: false, feedback: 'Invalid pairs submission.' };
      }
    }
    case 'dragBlank': {
      try {
        const fills = JSON.parse(String(answer)) as Record<string, string>;
        const ok = example.blanks.every(
          (b) => normalize(fills[b.id] ?? '') === normalize(b.answer),
        );
        return {
          correct: ok,
          feedback: ok ? 'All blanks filled correctly!' : example.explanation,
        };
      } catch {
        return { correct: false, feedback: 'Invalid blank submission.' };
      }
    }
    case 'codeChallenge':
      return {
        correct: false,
        feedback: 'Code challenges are graded by Pyodide at runtime.',
      };
    default:
      return { correct: false, feedback: 'Unknown example type.' };
  }
}
