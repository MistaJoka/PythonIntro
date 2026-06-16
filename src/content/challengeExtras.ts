import type { Example } from './schema';

/**
 * Interview-grade challenge items, keyed by lessonId.
 * Constraint: each lesson's items use ONLY tools taught up to and including
 * that lesson (see capstones/lessonIndex.ts). 4 per lesson: 2 codeChallenge + 2 reasoning.
 */
export const CHALLENGE_EXTRAS: Record<string, Example[]> = {
  lesson01: [
    {
      id: 'l1-chal-1',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['floatPrecision', 'typeCoercion'],
      prompt:
        'Write to_cents(price) that takes a price as a string of dollars (e.g. "12.34") and returns the whole number of cents as an int.',
      starterCode: 'def to_cents(price):\n    pass',
      tests: [
        'assert to_cents("12.34") == 1234',
        'assert to_cents("0.10") == 10',
        'assert to_cents("100") == 10000',
      ],
      explanation:
        'float("0.10") * 100 is 10.000000000000002. int() would truncate to 9 — round() gives the correct 10. Return round(float(price) * 100).',
      trapNote: 'int(float(price) * 100) silently loses a cent on values like 0.10 and 0.29.',
      solutionHint: 'Use round(...), not int(...), after multiplying.',
    },
    {
      id: 'l1-chal-2',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['typeCoercion'],
      prompt:
        'Write percent(part, whole) that returns a string like "33.3%": part/whole as a percentage rounded to one decimal place.',
      starterCode: 'def percent(part, whole):\n    pass',
      tests: [
        'assert percent(1, 3) == "33.3%"',
        'assert percent(0, 5) == "0.0%"',
        'assert percent(5, 4) == "125.0%"',
      ],
      explanation:
        'Return f"{part / whole * 100:.1f}%". The :.1f format spec rounds to one decimal and forces a trailing zero (0.0, not 0).',
      trapNote: 'Plain str(part/whole*100) gives "33.33333333333333", not "33.3".',
    },
    {
      id: 'l1-chal-3',
      type: 'multipleChoice',
      stage: 'stretch',
      tags: ['typeCoercion'],
      prompt: 'In Python 3, what is type(7 // 2 + 1.0)?',
      options: ['float', 'int', 'str', 'NoneType'],
      answerIndex: 0,
      explanation:
        '7 // 2 is 3 (int floor division), but 3 + 1.0 promotes to float. Any float in the expression makes the result a float.',
      trapNote: '// is integer division, but mixing with a float still yields a float.',
    },
    {
      id: 'l1-chal-4',
      type: 'multipleChoice',
      stage: 'debug',
      tags: ['floatPrecision'],
      prompt: 'What does 0.1 + 0.2 == 0.3 evaluate to?',
      options: ['False', 'True', '0.3', 'TypeError'],
      answerIndex: 0,
      explanation:
        '0.1 + 0.2 is 0.30000000000000004 in IEEE-754 binary floating point, which is not exactly 0.3. Compare floats with a tolerance (abs(a - b) < 1e-9), never ==.',
      trapNote: 'Never test float equality with ==.',
    },
  ],
};
