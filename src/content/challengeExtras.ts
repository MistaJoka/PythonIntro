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
  lesson05: [
    {
      id: 'l5-chal-1',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['scope'],
      prompt:
        'A module sets RATE = 0.10. Write discounted(price, rate=RATE) that returns price * (1 - rate) rounded to 2 decimals. The default must capture the value of RATE at the moment the function is defined — later reassigning RATE must not change the default.',
      starterCode: 'RATE = 0.10\n\ndef discounted(price, rate=RATE):\n    pass\n\nRATE = 0.50  # reassigned AFTER the def — must not affect the default',
      tests: [
        'assert discounted(100) == 90.0',
        'assert discounted(100, 0.25) == 75.0',
        'assert discounted(0) == 0.0',
        'assert discounted(50, 0) == 50.0',
      ],
      explanation:
        'Return round(price * (1 - rate), 2). Default arguments are evaluated ONCE, when the def statement runs — at that point RATE is 0.10, so the default is permanently 0.10. The later RATE = 0.50 rebinds the global name but the function already captured the old value, so discounted(100) is 90.0, not 50.0.',
      trapNote:
        'A default value is frozen at def time, not looked up on each call. Reassigning RATE afterward does NOT change the default.',
      solutionHint: 'return round(price * (1 - rate), 2)',
    },
    {
      id: 'l5-chal-2',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['scope'],
      prompt:
        'Write clamp(value, low=0, high=100) that returns value forced into the range [low, high]: low if value is below low, high if above high, otherwise value unchanged. The boundaries low and high are inclusive.',
      starterCode: 'def clamp(value, low=0, high=100):\n    pass',
      tests: [
        'assert clamp(50) == 50',
        'assert clamp(-10) == 0',
        'assert clamp(250) == 100',
        'assert clamp(50, 60, 90) == 60',
        'assert clamp(0) == 0',
        'assert clamp(100) == 100',
      ],
      explanation:
        'Guard the two ends first: if value < low return low; if value > high return high; else return value. Using strict < and > (not <= / >=) keeps the boundaries inclusive — clamp(0) and clamp(100) pass through unchanged because they are exactly on the edges, not outside them.',
      trapNote:
        'Inclusive boundaries need < and >, not <= and >=. Writing value <= low would wrongly clamp an in-range value sitting exactly on low.',
      solutionHint:
        'if value < low: return low  /  if value > high: return high  /  return value.',
    },
    {
      id: 'l5-chal-3',
      type: 'multipleChoice',
      stage: 'debug',
      tags: ['scope'],
      prompt:
        'What is result after this runs?\n\ndef shout(word):\n    print(word.upper())\n\nresult = shout("hi")',
      options: ['None', "'HI'", "'hi'", 'A NameError'],
      answerIndex: 0,
      explanation:
        'shout prints "HI" as a side effect but has no return statement, so it falls off the end and returns None. The call expression shout("hi") therefore evaluates to None, and result is bound to None. Printing a value is not the same as returning it.',
      trapNote:
        'A function with no return (or a bare return) yields None. print(...) displays text but the function still returns None.',
    },
    {
      id: 'l5-chal-4',
      type: 'traceSteps',
      stage: 'stretch',
      tags: ['scope'],
      prompt:
        'Trace how the default argument captures base, then predict the output.',
      code: 'base = 10\n\ndef add_base(n, b=base):\n    return n + b\n\nbase = 100\nprint(add_base(5))',
      steps: [
        { line: 1, vars: { base: '10' } },
        {
          line: 3,
          vars: { base: '10' },
          note: 'The def runs now: the default b=base is evaluated once, capturing the CURRENT value 10. The default is frozen at 10.',
        },
        {
          line: 6,
          vars: { base: '100' },
          note: 'base is rebound to 100, but the function already captured 10 — this does not change the default.',
        },
        {
          line: 7,
          vars: { base: '100' },
          output: '15',
          note: 'add_base(5) uses the captured default b = 10, returning 5 + 10 = 15.',
        },
      ],
      question: 'What does this program print?',
      options: ['15', '105', '110', '10', 'None'],
      answerIndex: 0,
      explanation:
        'The default b=base is evaluated a single time when def runs, capturing base = 10. Reassigning base to 100 afterward has no effect on the already-frozen default, so add_base(5) returns 5 + 10 = 15. The trap answer 105 assumes the default is looked up fresh on each call.',
    },
  ],
  lesson06: [
    {
      id: 'l6-chal-1',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['typeCoercion'],
      prompt:
        'Write is_palindrome(s) that returns True if s reads the same forwards and backwards, ignoring case. Compare the lowercased string against its reverse using slicing.',
      starterCode: 'def is_palindrome(s):\n    pass',
      tests: [
        'assert is_palindrome("RaceCar") == True',
        'assert is_palindrome("hello") == False',
        'assert is_palindrome("") == True',
        'assert is_palindrome("a") == True',
        'assert is_palindrome("Ab") == False',
      ],
      explanation:
        'Lowercase once, then compare to the reversed copy: cleaned = s.lower(); return cleaned == cleaned[::-1]. The [::-1] step-slice walks the string backwards to build a reversed copy. An empty string equals its own reverse, so is_palindrome("") is True, and a single character is trivially a palindrome.',
      trapNote:
        'Strings are immutable — s[::-1] returns a NEW reversed string; it never modifies s. There is no s.reverse() method on strings.',
      solutionHint: 'cleaned = s.lower()  /  return cleaned == cleaned[::-1]',
    },
    {
      id: 'l6-chal-2',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['typeCoercion'],
      prompt:
        'Write initials(name) that returns the uppercase first letter of each whitespace-separated word, concatenated. Extra leading/trailing/internal spaces must be ignored, and an empty or all-space string returns "".',
      starterCode: 'def initials(name):\n    pass',
      tests: [
        'assert initials("ada lovelace") == "AL"',
        'assert initials("Grace Brewster Murray Hopper") == "GBMH"',
        'assert initials("") == ""',
        'assert initials("   leading spaces  ") == "LS"',
        'assert initials("one") == "O"',
      ],
      explanation:
        'name.split() with no argument splits on runs of whitespace AND drops empty pieces, so leading/trailing/multiple spaces are handled for free and "" yields the empty list []. Loop over the words, take word[0].upper(), and build up the result string. An empty input gives no words, so the loop never runs and "" is returned.',
      trapNote:
        'name.split(" ") (with an explicit space) keeps empty strings between repeated spaces and would crash on word[0]. Bare .split() collapses whitespace and is what you want here.',
      solutionHint:
        'letters = ""  /  for word in name.split(): letters += word[0].upper()  /  return letters.',
    },
    {
      id: 'l6-chal-3',
      type: 'multipleChoice',
      stage: 'debug',
      tags: ['typeCoercion'],
      prompt:
        'What is printed?\n\ns = "hello"\ns.upper()\nprint(s)',
      options: ['hello', 'HELLO', 'None', 'An AttributeError'],
      answerIndex: 0,
      explanation:
        'Strings are immutable. s.upper() computes a NEW string "HELLO" and returns it, but nothing captures that return value, so s itself is never changed and still refers to "hello". To keep the result you must reassign: s = s.upper().',
      trapNote:
        'String methods never mutate in place — they return a new string. Calling s.upper() without assigning the result does nothing observable.',
    },
    {
      id: 'l6-chal-4',
      type: 'traceSteps',
      stage: 'stretch',
      tags: ['offByOne'],
      prompt: 'Trace these slices on "python" and predict the output.',
      code: 's = "python"\na = s[1:4]\nb = s[::-1]\nc = b[:3]\nprint(c)',
      steps: [
        { line: 1, vars: { s: "'python'" } },
        {
          line: 2,
          vars: { s: "'python'", a: "'yth'" },
          note: 's[1:4] takes indices 1,2,3 (4 is excluded): y, t, h.',
        },
        {
          line: 3,
          vars: { s: "'python'", a: "'yth'", b: "'nohtyp'" },
          note: 's[::-1] reverses the whole string into a new string.',
        },
        {
          line: 4,
          vars: { s: "'python'", a: "'yth'", b: "'nohtyp'", c: "'noh'" },
          note: 'b[:3] takes the first three chars of "nohtyp": n, o, h.',
        },
        {
          line: 5,
          vars: { s: "'python'", a: "'yth'", b: "'nohtyp'", c: "'noh'" },
          output: 'noh',
        },
      ],
      question: 'What does this program print?',
      options: ['noh', 'pyt', 'hon', 'nop', 'yth'],
      answerIndex: 0,
      explanation:
        's[::-1] reverses "python" to "nohtyp", and b[:3] slices its first three characters "noh". The stop index in a slice is exclusive, which is why s[1:4] is "yth" (not "ytho") — though a is never printed, it is the classic distractor.',
    },
  ],
  lesson07: [
    {
      id: 'l7-chal-1',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['aliasing'],
      prompt:
        'Write without_first(items) that returns a NEW list containing every element except the one at index 0. The original list passed in must NOT be modified.',
      starterCode: 'def without_first(items):\n    pass',
      tests: [
        'assert without_first([1, 2, 3]) == [2, 3]',
        'assert without_first([]) == []',
        'assert without_first([9]) == []',
        'assert without_first([1, 1, 1]) == [1, 1]',
        "nums = [1, 2, 3]\nwithout_first(nums)\nassert nums == [1, 2, 3]",
      ],
      explanation:
        'return items[1:]. Slicing a list produces a brand-new list, so the caller\'s list is untouched. Slicing also handles the edge cases gracefully: [][1:] is [] and [9][1:] is [] — no IndexError, because slice bounds are clamped, unlike indexing.',
      trapNote:
        'items.pop(0) or del items[0] would mutate the caller\'s list in place. Slicing items[1:] returns a copy and leaves the original alone.',
      solutionHint: 'return items[1:]',
    },
    {
      id: 'l7-chal-2',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['mutation'],
      prompt:
        'Write running_max(nums) that returns a new list where each position holds the maximum seen so far. For [3, 1, 4, 1, 5] the result is [3, 3, 4, 4, 5]. An empty input returns [].',
      starterCode: 'def running_max(nums):\n    pass',
      tests: [
        'assert running_max([3, 1, 4, 1, 5]) == [3, 3, 4, 4, 5]',
        'assert running_max([]) == []',
        'assert running_max([7]) == [7]',
        'assert running_max([-1, -5, -2]) == [-1, -1, -1]',
        'assert running_max([2, 2, 2]) == [2, 2, 2]',
      ],
      explanation:
        'Build a fresh result list with append. Track best, starting unset (None); for each n, raise best when n is larger, then append the current best. Initializing best to None (rather than 0) is what makes the all-negative case work — starting at 0 would wrongly report 0 as the running max for [-1, -5, -2].',
      trapNote:
        'result.append(best) returns None — never write result = result.append(best). append mutates the list in place and you keep using result directly.',
      solutionHint:
        'result = []  /  best = None  /  for n in nums: if best is None or n > best: best = n; result.append(best)  /  return result.',
    },
    {
      id: 'l7-chal-3',
      type: 'multipleChoice',
      stage: 'debug',
      tags: ['aliasing', 'mutation'],
      prompt:
        'What is a after this runs?\n\na = [1, 2, 3]\nb = a\nb.append(4)',
      options: ['[1, 2, 3, 4]', '[1, 2, 3]', '[4]', '[[1, 2, 3], 4]'],
      answerIndex: 0,
      explanation:
        'b = a does NOT copy the list — it binds b to the very same list object a refers to (aliasing). b.append(4) mutates that shared object in place, so the change is visible through both names: a is [1, 2, 3, 4]. To get an independent copy you would write b = a[:] or b = list(a).',
      trapNote:
        'Assignment of a list never copies it. b = a makes an alias; mutating through one name is seen through the other.',
    },
    {
      id: 'l7-chal-4',
      type: 'traceSteps',
      stage: 'stretch',
      tags: ['mutation'],
      prompt:
        'Trace this. .sort() sorts in place and returns None — watch what result becomes.',
      code: 'nums = [3, 1, 2]\nresult = nums.sort()\nprint(result)\nprint(nums)',
      steps: [
        { line: 1, vars: { nums: '[3, 1, 2]' } },
        {
          line: 2,
          vars: { nums: '[1, 2, 3]', result: 'None' },
          note: 'nums.sort() reorders nums in place to [1, 2, 3] and RETURNS None, so result is None.',
        },
        {
          line: 3,
          vars: { nums: '[1, 2, 3]', result: 'None' },
          output: 'None',
        },
        {
          line: 4,
          vars: { nums: '[1, 2, 3]', result: 'None' },
          output: '[1, 2, 3]',
        },
      ],
      question: 'What are the two printed lines, in order?',
      options: [
        'None then [1, 2, 3]',
        '[1, 2, 3] then [1, 2, 3]',
        '[1, 2, 3] then None',
        'None then [3, 1, 2]',
        '[3, 1, 2] then [1, 2, 3]',
      ],
      answerIndex: 0,
      explanation:
        'list.sort() mutates the list in place and returns None. So result = nums.sort() binds result to None (first line prints None), while nums itself is now sorted to [1, 2, 3] (second line). The trap is expecting result to hold the sorted list — that is what sorted(nums) would give; .sort() returns nothing.',
    },
  ],
};
