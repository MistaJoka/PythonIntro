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
  lesson02: [
    {
      id: 'l2-chal-1',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['typeCoercion'],
      prompt:
        'Write minutes_until(now, target) where now and target are minute marks (0-59) on a clock face. Return how many minutes forward from now until target, wrapping past the top of the hour. Use % so it works even when target is "behind" now.',
      starterCode: 'def minutes_until(now, target):\n    pass',
      tests: [
        'assert minutes_until(50, 10) == 20',
        'assert minutes_until(10, 50) == 40',
        'assert minutes_until(0, 0) == 0',
        'assert minutes_until(59, 0) == 1',
      ],
      explanation:
        'Return (target - now) % 60. When target < now, target - now is negative, but Python\'s % always returns a result with the sign of the divisor (60), so (10 - 50) % 60 == -40 % 60 == 20. No if-statement needed.',
      trapNote:
        'In Python, -40 % 60 is 20, not -40. The result of % takes the sign of the right operand, unlike C/Java.',
      solutionHint: 'The whole body is one line: return (target - now) % 60.',
    },
    {
      id: 'l2-chal-2',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['typeCoercion'],
      prompt:
        'Write split_bill(total_cents, people) that splits a bill (an int number of cents) as evenly as possible. Return a tuple (each, leftover): each is the whole cents every person pays, leftover is the cents left over that cannot be split evenly. Use // and %.',
      starterCode: 'def split_bill(total_cents, people):\n    pass',
      tests: [
        'assert split_bill(1000, 3) == (333, 1)',
        'assert split_bill(1000, 4) == (250, 0)',
        'assert split_bill(0, 5) == (0, 0)',
        'assert split_bill(7, 10) == (0, 7)',
      ],
      explanation:
        'Return (total_cents // people, total_cents % people). Floor division gives each share; modulo gives the indivisible remainder. With 7 cents over 10 people, each gets 0 and all 7 are leftover.',
      trapNote:
        'total_cents / people uses true division and returns a float (333.33...), which is wrong here — you need // for an integer share.',
      solutionHint: 'return (total_cents // people, total_cents % people)',
    },
    {
      id: 'l2-chal-3',
      type: 'multipleChoice',
      stage: 'stretch',
      tags: ['typeCoercion'],
      prompt: 'What does 2 ** 3 ** 2 evaluate to in Python?',
      options: ['512', '64', '256', '18'],
      answerIndex: 0,
      explanation:
        'The ** operator is right-associative, so 2 ** 3 ** 2 is 2 ** (3 ** 2) = 2 ** 9 = 512. Evaluating left-to-right would give (2 ** 3) ** 2 = 8 ** 2 = 64, which is the common wrong answer.',
      trapNote: 'Exponentiation groups right-to-left, unlike +, -, *, and /.',
    },
    {
      id: 'l2-chal-4',
      type: 'multipleChoice',
      stage: 'stretch',
      tags: ['truthiness'],
      prompt: 'What is the value of   0 or "" or "fallback"   in Python?',
      options: ["'fallback'", 'True', "''", '0'],
      answerIndex: 0,
      explanation:
        'or returns the first operand that is truthy, or the last operand if all are falsy — it does NOT coerce to a bool. 0 is falsy, "" is falsy, so the expression yields the next operand "fallback". This operand-returning behavior is why x or default is a common defaulting idiom.',
      trapNote:
        'and / or return one of their operands, not necessarily True/False. "" or "fallback" is "fallback", and 3 and 5 is 5.',
    },
  ],
  lesson03: [
    {
      id: 'l3-chal-1',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['loopLogic'],
      prompt:
        'Write letter_grade(score) returning "A" for score >= 90, "B" for >= 80, "C" for >= 70, otherwise "F". Order your elif branches so the boundaries land correctly — 90 is an A, 89 is a B.',
      starterCode: 'def letter_grade(score):\n    pass',
      tests: [
        'assert letter_grade(90) == "A"',
        'assert letter_grade(89) == "B"',
        'assert letter_grade(80) == "B"',
        'assert letter_grade(70) == "C"',
        'assert letter_grade(0) == "F"',
      ],
      explanation:
        'Check the highest threshold first with >=. Once you reach an elif, you already know the higher tests failed, so elif score >= 80 implicitly means 80 <= score < 90. Using > instead of >= would wrongly grade exactly 90 as a B.',
      trapNote:
        'Boundary bug: >= vs >. A score of exactly 90 must be an A — score > 90 would drop it to B.',
      solutionHint:
        'if score >= 90: return "A"  /  elif score >= 80: return "B"  /  elif score >= 70: return "C"  /  else: return "F".',
    },
    {
      id: 'l3-chal-2',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['truthiness'],
      prompt:
        'Write classify(n) that returns "negative" if n < 0, "zero" if n is 0, "small" if 0 < n < 10, and "big" if n >= 10. Make sure n == 0 is reported as "zero", not swallowed by a truthiness check.',
      starterCode: 'def classify(n):\n    pass',
      tests: [
        'assert classify(-5) == "negative"',
        'assert classify(0) == "zero"',
        'assert classify(1) == "small"',
        'assert classify(9) == "small"',
        'assert classify(10) == "big"',
      ],
      explanation:
        'Test n < 0, then n == 0 explicitly, then n < 10 (which now means 1..9), else "big". Writing if not n: to detect zero would also fire for other falsy values, and more importantly the explicit n == 0 check keeps the zero boundary separate from the small range.',
      trapNote:
        'The 9-vs-10 boundary: 9 is "small" but 10 is "big". Using n <= 10 for "small" would misclassify 10.',
      solutionHint:
        'if n < 0: return "negative"  /  elif n == 0: return "zero"  /  elif n < 10: return "small"  /  else: return "big".',
    },
    {
      id: 'l3-chal-3',
      type: 'multipleChoice',
      stage: 'stretch',
      tags: ['truthiness'],
      prompt: 'What is the value of   [] or "0" or 0   in Python?',
      options: ["'0'", 'False', '[]', '0'],
      answerIndex: 0,
      explanation:
        'or returns the first truthy operand. [] is falsy (empty list), but the string "0" is truthy — a non-empty string is truthy regardless of its contents. So the expression short-circuits and returns "0" without ever evaluating the final 0.',
      trapNote:
        'The string "0" is truthy; only the empty string "" is falsy. Falsy values include 0, 0.0, "", [], {}, and None.',
    },
    {
      id: 'l3-chal-4',
      type: 'traceSteps',
      stage: 'stretch',
      tags: ['loopLogic'],
      prompt: 'Trace this chained comparison and predict what prints.',
      code: 'x = 7\nlow = 3\nhigh = 5\nresult = low < x < high\nprint(result)',
      steps: [
        { line: 1, vars: { x: '7' } },
        { line: 2, vars: { x: '7', low: '3' } },
        { line: 3, vars: { x: '7', low: '3', high: '5' } },
        {
          line: 4,
          vars: { x: '7', low: '3', high: '5', result: 'False' },
          note: 'low < x < high means (low < x) and (x < high): (3 < 7) and (7 < 5) = True and False = False.',
        },
        { line: 5, vars: { x: '7', low: '3', high: '5', result: 'False' }, output: 'False' },
      ],
      question: 'What does this program print?',
      options: ['False', 'True', '7', 'SyntaxError', '3'],
      answerIndex: 0,
      explanation:
        'Python expands low < x < high into (low < x) and (x < high), evaluating x exactly once. 3 < 7 is True but 7 < 5 is False, so the whole chain is False. It does NOT mean (low < x) < high.',
    },
  ],
  lesson04: [
    {
      id: 'l4-chal-1',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['offByOne'],
      prompt:
        'Write sum_evens(n) that returns the sum of all even numbers from 0 up to but NOT including n, using a for loop over range. For n = 10 the last term is 8, because 10 is excluded.',
      starterCode: 'def sum_evens(n):\n    pass',
      tests: [
        'assert sum_evens(10) == 20',
        'assert sum_evens(0) == 0',
        'assert sum_evens(1) == 0',
        'assert sum_evens(2) == 0',
      ],
      explanation:
        'Initialize total = 0, then loop for i in range(0, n, 2) and add each i. range stop is exclusive, so range(0, 10, 2) yields 0,2,4,6,8 — 10 is never included. sum_evens(2) is 0 because range(0, 2, 2) yields only 0.',
      trapNote:
        "range's stop is exclusive: range(0, n, 2) stops before n. Writing range(0, n + 1, 2) would wrongly include n when n is even.",
      solutionHint:
        'total = 0  /  for i in range(0, n, 2): total += i  /  return total.',
    },
    {
      id: 'l4-chal-2',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['loopLogic'],
      prompt:
        'Write first_divisor(n): return the smallest divisor of n that is 2 or greater (for a prime this is n itself). Return 0 when n is less than 2. Use a for loop and return early as soon as you find a divisor.',
      starterCode: 'def first_divisor(n):\n    pass',
      tests: [
        'assert first_divisor(15) == 3',
        'assert first_divisor(13) == 13',
        'assert first_divisor(2) == 2',
        'assert first_divisor(1) == 0',
        'assert first_divisor(0) == 0',
      ],
      explanation:
        'Guard n < 2 returning 0. Then loop for d in range(2, n + 1); the first d where n % d == 0 is the smallest divisor — return it immediately. The +1 in range(2, n + 1) is essential so that a prime n reaches d == n and returns itself.',
      trapNote:
        'range(2, n) excludes n, so a prime like 13 would never match and you would fall through — use range(2, n + 1).',
      solutionHint:
        'if n < 2: return 0  /  for d in range(2, n + 1): if n % d == 0: return d.',
    },
    {
      id: 'l4-chal-3',
      type: 'multipleChoice',
      stage: 'stretch',
      tags: ['loopLogic'],
      prompt:
        'How many times does the body run?\n\ncount = 0\nfor i in range(3):\n    for j in range(i):\n        count += 1',
      options: ['3', '9', '6', '0'],
      answerIndex: 0,
      explanation:
        'The inner range(i) depends on i. When i = 0, range(0) is empty (0 iterations); i = 1 runs 1 time; i = 2 runs 2 times. Total = 0 + 1 + 2 = 3. The trap answer 9 assumes both loops run 3 times each.',
      trapNote:
        'range(i) is not range(3): the inner loop count grows with i and is empty when i is 0.',
    },
    {
      id: 'l4-chal-4',
      type: 'traceSteps',
      stage: 'stretch',
      tags: ['loopInvariant'],
      prompt: 'Trace this while-loop accumulator and predict the final total.',
      code: 'total = 0\nn = 1\nwhile n <= 3:\n    total = total + n\n    n = n + 1\nprint(total)',
      steps: [
        { line: 1, vars: { total: '0' } },
        { line: 2, vars: { total: '0', n: '1' } },
        { line: 4, vars: { total: '1', n: '1' }, note: 'n <= 3 true; add n: total = 0 + 1 = 1.' },
        { line: 5, vars: { total: '1', n: '2' } },
        { line: 4, vars: { total: '3', n: '2' }, note: 'n <= 3 true; total = 1 + 2 = 3.' },
        { line: 5, vars: { total: '3', n: '3' } },
        { line: 4, vars: { total: '6', n: '3' }, note: 'n <= 3 true; total = 3 + 3 = 6.' },
        { line: 5, vars: { total: '6', n: '4' }, note: 'n is now 4, so n <= 3 is false; loop ends.' },
        { line: 6, vars: { total: '6', n: '4' }, output: '6' },
      ],
      question: 'What does this program print?',
      options: ['6', '3', '10', '4', '7'],
      answerIndex: 0,
      explanation:
        'The loop runs while n <= 3 with n starting at 1: it adds 1, then 2, then 3, giving total = 6, and stops when n becomes 4. The trap answer 10 comes from also adding n = 4 (treating the bound as inclusive of 4).',
    },
  ],
};
