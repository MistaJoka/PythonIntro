import type { ChallengeBundle } from './schema';

export const CHALLENGE_BUNDLES: ChallengeBundle[] = [
  {
    id: 'ch-numbers',
    title: 'Numbers & Precision',
    blurb: 'Type coercion, float pitfalls, and operator precedence under one roof.',
    theme: 'numbers',
    difficulty: 1,
    lessonRefs: ['lesson01', 'lesson02'],
    examples: [
      {
        id: 'ch-numbers-1',
        type: 'codeChallenge',
        stage: 'build',
        tags: ['floatPrecision', 'typeCoercion'],
        prompt:
          'Write tax_total(price, rate) where price is a dollar string like "19.99" and rate is a float like 0.0825. Return the total (price + price*rate) as a string rounded to exactly 2 decimals, e.g. "21.64".',
        starterCode: 'def tax_total(price, rate):\n    pass',
        tests: [
          'assert tax_total("19.99", 0.0825) == "21.64"',
          'assert tax_total("100", 0.10) == "110.00"',
          'assert tax_total("0", 0.2) == "0.00"',
        ],
        explanation:
          'Convert with float(price), add the tax, and format with an f-string: f"{total:.2f}". The :.2f spec rounds and pads trailing zeros so "110" becomes "110.00".',
        trapNote: 'str(round(total, 2)) drops the trailing zero ("110.0"); use :.2f formatting.',
      },
      {
        id: 'ch-numbers-2',
        type: 'codeChallenge',
        stage: 'build',
        tags: ['typeCoercion'],
        prompt:
          'Write clock(total_seconds) that returns a string "H:MM:SS" for a whole number of seconds, e.g. clock(3909) == "1:05:09". Hours are not zero-padded; minutes and seconds are two digits.',
        starterCode: 'def clock(total_seconds):\n    pass',
        tests: [
          'assert clock(3909) == "1:05:09"',
          'assert clock(0) == "0:00:00"',
          'assert clock(59) == "0:00:59"',
          'assert clock(3600) == "1:00:00"',
        ],
        explanation:
          'h = total_seconds // 3600; m = total_seconds % 3600 // 60; s = total_seconds % 60; return f"{h}:{m:02d}:{s:02d}". Floor division and modulo split the value; :02d zero-pads.',
        trapNote: 'Using % 60 for minutes forgets to strip the hours first — use (total % 3600) // 60.',
      },
      {
        id: 'ch-numbers-3',
        type: 'multipleChoice',
        stage: 'stretch',
        tags: ['typeCoercion'],
        prompt: 'What does 10 % 3 ** 2 evaluate to in Python?',
        options: ['1', '0', '9', '100'],
        answerIndex: 0,
        explanation:
          '** binds tighter than %, so this is 10 % (3 ** 2) = 10 % 9 = 1.',
        trapNote: 'Exponentiation has higher precedence than % / * / //.',
      },
      {
        id: 'ch-numbers-4',
        type: 'multipleChoice',
        stage: 'stretch',
        tags: ['typeCoercion'],
        prompt: 'In Python 3, what is type(6 / 2)?',
        options: ['float', 'int', 'str', 'bool'],
        answerIndex: 0,
        explanation:
          'The / operator is true division and ALWAYS returns a float, even when the result is a whole number. 6 / 2 is 3.0 (float). Use // for an int result.',
        trapNote: '6 / 2 is 3.0, not 3.',
      },
      {
        id: 'ch-numbers-5',
        type: 'traceSteps',
        stage: 'stretch',
        tags: ['typeCoercion'],
        prompt: 'Trace the coercion as each line runs.',
        code: 'a = 5\nb = 2\nc = a / b\nd = a // b\ne = a % b',
        steps: [
          { line: 1, vars: { a: '5' } },
          { line: 2, vars: { a: '5', b: '2' } },
          { line: 3, vars: { a: '5', b: '2', c: '2.5' } },
          { line: 4, vars: { a: '5', b: '2', c: '2.5', d: '2' } },
          { line: 5, vars: { a: '5', b: '2', c: '2.5', d: '2', e: '1' } },
        ],
        question: 'What are the values of c, d, e?',
        options: ['2.5, 2, 1', '2, 2, 1', '2.5, 2.5, 1', '2.5, 2, 0'],
        answerIndex: 0,
        explanation:
          'a / b is true division → 2.5 (float). a // b is floor division → 2 (int). a % b is the remainder → 1.',
      },
    ],
  },
];
