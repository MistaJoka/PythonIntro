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
  lesson08: [
    {
      id: 'l8-chal-1',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['dictKeys'],
      prompt:
        'Write count_chars(s) that returns a dict mapping each character in s to how many times it appears. Build the counts with dict.get so a brand-new character starts at 0 instead of raising KeyError.',
      starterCode: 'def count_chars(s):\n    pass',
      tests: [
        'assert count_chars("aab") == {"a": 2, "b": 1}',
        'assert count_chars("") == {}',
        'assert count_chars("zzz") == {"z": 3}',
        'assert count_chars("abc") == {"a": 1, "b": 1, "c": 1}',
      ],
      explanation:
        'Start counts = {}, then for each ch do counts[ch] = counts.get(ch, 0) + 1. dict.get(ch, 0) returns 0 when ch is not yet a key, avoiding the KeyError you would hit with counts[ch] on the first sighting. The empty string yields the empty dict because the loop never runs.',
      trapNote:
        'counts[ch] + 1 raises KeyError the first time a character is seen. dict.get(ch, 0) supplies a default instead of raising.',
      solutionHint:
        'counts = {}  /  for ch in s: counts[ch] = counts.get(ch, 0) + 1  /  return counts.',
    },
    {
      id: 'l8-chal-2',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['dictKeys'],
      prompt:
        'Write only_in_first(a, b) that returns a sorted list of the values that appear in list a but NOT in list b, with no duplicates. Use set operations.',
      starterCode: 'def only_in_first(a, b):\n    pass',
      tests: [
        'assert only_in_first([1, 2, 3], [2]) == [1, 3]',
        'assert only_in_first([1, 1, 2], [2]) == [1]',
        'assert only_in_first([], [1, 2]) == []',
        'assert only_in_first([1, 2], [1, 2]) == []',
        'assert only_in_first([3, 1, 2], []) == [1, 2, 3]',
      ],
      explanation:
        'return sorted(set(a) - set(b)). The set difference set(a) - set(b) keeps the elements of a that are not in b, and converting to a set also deduplicates ([1, 1, 2] becomes {1, 2}). A set is unordered, so sorted() is required to get a stable, predictable list back.',
      trapNote:
        'A set has no order — returning list(set(a) - set(b)) gives an unpredictable ordering. Wrap it in sorted() for a deterministic result.',
      solutionHint: 'return sorted(set(a) - set(b))',
    },
    {
      id: 'l8-chal-3',
      type: 'multipleChoice',
      stage: 'debug',
      tags: ['dictKeys'],
      prompt:
        'What does this print?\n\nd = {"a": 1, "b": 2}\nprint(1 in d)',
      options: ['False', 'True', '1', 'KeyError'],
      answerIndex: 0,
      explanation:
        'The in operator on a dict tests membership against the KEYS, not the values. The keys of d are "a" and "b"; the integer 1 is a value, not a key, so 1 in d is False. To test the values you would write 1 in d.values().',
      trapNote:
        'x in some_dict checks keys only. 1 is a value here, so it is not found — use d.values() to search values.',
    },
    {
      id: 'l8-chal-4',
      type: 'traceSteps',
      stage: 'stretch',
      tags: ['dictKeys'],
      prompt: 'Trace this tally built with dict.get and predict both printed lines.',
      code: 'scores = {}\nfor name in ["amy", "bob", "amy"]:\n    scores[name] = scores.get(name, 0) + 1\nprint(scores["amy"])\nprint(len(scores))',
      steps: [
        { line: 1, vars: { scores: '{}' } },
        {
          line: 3,
          vars: { scores: "{'amy': 1}" },
          note: 'name = "amy": scores.get("amy", 0) is 0 (no key yet), so scores["amy"] becomes 1.',
        },
        {
          line: 3,
          vars: { scores: "{'amy': 1, 'bob': 1}" },
          note: 'name = "bob": new key, count starts at 0 + 1 = 1.',
        },
        {
          line: 3,
          vars: { scores: "{'amy': 2, 'bob': 1}" },
          note: 'name = "amy" again: existing count 1, so 1 + 1 = 2.',
        },
        {
          line: 4,
          vars: { scores: "{'amy': 2, 'bob': 1}" },
          output: '2',
          note: 'scores["amy"] is 2.',
        },
        {
          line: 5,
          vars: { scores: "{'amy': 2, 'bob': 1}" },
          output: '2',
          note: 'len(scores) counts the distinct KEYS: "amy" and "bob" = 2.',
        },
      ],
      question: 'What are the two printed lines, in order?',
      options: ['2 then 2', '2 then 3', '3 then 2', '1 then 2', '2 then 1'],
      answerIndex: 0,
      explanation:
        '"amy" is counted twice and "bob" once, so scores["amy"] is 2 (first line). len(scores) counts distinct keys — there are two keys, "amy" and "bob" — so the second line is 2, NOT 3. The trap answer 3 confuses the number of names processed with the number of unique keys.',
    },
  ],
  lesson09: [
    {
      id: 'l9-chal-1',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['comprehension'],
      prompt:
        'Write squares_of_evens(nums) that returns a list of the squares of only the even numbers in nums, preserving order. Use a single list comprehension with an if filter.',
      starterCode: 'def squares_of_evens(nums):\n    pass',
      tests: [
        'assert squares_of_evens([1, 2, 3, 4]) == [4, 16]',
        'assert squares_of_evens([]) == []',
        'assert squares_of_evens([1, 3, 5]) == []',
        'assert squares_of_evens([0, -2]) == [0, 4]',
      ],
      explanation:
        'return [n * n for n in nums if n % 2 == 0]. The if at the END of a comprehension is a FILTER — odd numbers are dropped entirely rather than mapped to something. 0 is even (0 % 2 == 0), so [0, -2] keeps both and squares them to [0, 4].',
      trapNote:
        'A trailing "if cond" filters items out. Do not confuse it with a leading "a if cond else b", which is a ternary that keeps every item but transforms it.',
      solutionHint: 'return [n * n for n in nums if n % 2 == 0]',
    },
    {
      id: 'l9-chal-2',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['comprehension', 'dictKeys'],
      prompt:
        'Write word_lengths(words) that returns a dict mapping each word to its length, using a dict comprehension. If a word repeats, the dict naturally keeps a single entry.',
      starterCode: 'def word_lengths(words):\n    pass',
      tests: [
        'assert word_lengths(["hi", "bye"]) == {"hi": 2, "bye": 3}',
        'assert word_lengths([]) == {}',
        'assert word_lengths(["a", "a", "bb"]) == {"a": 1, "bb": 2}',
        'assert word_lengths(["x"]) == {"x": 1}',
      ],
      explanation:
        'return {w: len(w) for w in words}. A dict comprehension keys by w, so a repeated word like "a" simply overwrites its own identical entry — the result has one "a" key, not two. The empty list produces the empty dict.',
      trapNote:
        'Dict keys are unique: repeating a key in a comprehension keeps only the LAST assignment, it does not create duplicate entries.',
      solutionHint: 'return {w: len(w) for w in words}',
    },
    {
      id: 'l9-chal-3',
      type: 'multipleChoice',
      stage: 'stretch',
      tags: ['comprehension'],
      prompt:
        'What is the value of\n\n[x if x % 2 == 0 else 0 for x in [1, 2, 3, 4]]',
      options: ['[0, 2, 0, 4]', '[2, 4]', '[1, 0, 3, 0]', '[0, 2, 4]'],
      answerIndex: 0,
      explanation:
        'The "x if cond else 0" sits BEFORE the for, so it is a ternary applied to every element — nothing is filtered out. Odd numbers become 0 and even numbers stay, giving [0, 2, 0, 4]. The trap [2, 4] is what a trailing FILTER ("for x in xs if x % 2 == 0") would produce — a different construct.',
      trapNote:
        'Ternary-before-for transforms every element (same length out); if-after-for filters elements away (shorter result). These two read similarly but do opposite things.',
    },
    {
      id: 'l9-chal-4',
      type: 'traceSteps',
      stage: 'stretch',
      tags: ['comprehension'],
      prompt: 'Trace this nested comprehension and predict the output.',
      code: 'pairs = [(i, j) for i in range(2) for j in range(2)]\nprint(pairs)\nprint(len(pairs))',
      steps: [
        {
          line: 1,
          vars: { pairs: '[(0, 0), (0, 1), (1, 0), (1, 1)]' },
          note: 'The left for is the OUTER loop and the right for is the INNER loop. i=0 pairs with j=0,1; then i=1 pairs with j=0,1.',
        },
        {
          line: 2,
          vars: { pairs: '[(0, 0), (0, 1), (1, 0), (1, 1)]' },
          output: '[(0, 0), (0, 1), (1, 0), (1, 1)]',
        },
        {
          line: 3,
          vars: { pairs: '[(0, 0), (0, 1), (1, 0), (1, 1)]' },
          output: '4',
        },
      ],
      question: 'What is the first printed line (the value of pairs)?',
      options: [
        '[(0, 0), (0, 1), (1, 0), (1, 1)]',
        '[(0, 0), (1, 0), (0, 1), (1, 1)]',
        '[(0, 0), (1, 1)]',
        '[(0, 1), (1, 0)]',
        '[(0, 0), (0, 1), (1, 0)]',
      ],
      answerIndex: 0,
      explanation:
        'In a nested comprehension the fors read left-to-right exactly like nested for-loops: "for i ... for j ..." means i is the outer loop and j the inner. So i runs 0 then 1, and for each i, j runs 0 then 1, producing (0,0),(0,1),(1,0),(1,1). The trap option swaps the loop order.',
    },
  ],
  lesson10: [
    {
      id: 'l10-chal-1',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['exceptionType'],
      prompt:
        'Write safe_int(s, default) that returns int(s) when s is a valid integer string, and returns default when the conversion fails. Catch ONLY the error int() raises on bad input — do not catch everything.',
      starterCode: 'def safe_int(s, default):\n    pass',
      tests: [
        'assert safe_int("42", 0) == 42',
        'assert safe_int("x", -1) == -1',
        'assert safe_int("  7 ", 0) == 7',
        'assert safe_int("", 99) == 99',
        'assert safe_int("-5", 0) == -5',
      ],
      explanation:
        'Wrap return int(s) in try, and except ValueError: return default. int("x") and int("") both raise ValueError, which is the precise type to catch. Note int("  7 ") is 7 — int() strips surrounding whitespace before converting, so that input does NOT fail.',
      trapNote:
        'int() raises ValueError (not TypeError) on a non-numeric string. Catch ValueError specifically; a bare "except:" would also swallow unrelated bugs.',
      solutionHint:
        'try: return int(s)  /  except ValueError: return default.',
    },
    {
      id: 'l10-chal-2',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['exceptionType'],
      prompt:
        'Write safe_div(a, b) that returns a / b, but returns None when b is 0 instead of crashing. Catch the specific exception that division by zero raises.',
      starterCode: 'def safe_div(a, b):\n    pass',
      tests: [
        'assert safe_div(10, 2) == 5.0',
        'assert safe_div(7, 0) is None',
        'assert safe_div(0, 5) == 0.0',
        'assert safe_div(-6, 3) == -2.0',
      ],
      explanation:
        'try: return a / b, then except ZeroDivisionError: return None. Only b == 0 triggers the error; 0 / 5 is a perfectly valid 0.0 and must NOT return None — the danger is the divisor being zero, not the dividend.',
      trapNote:
        'It is ZeroDivisionError, a distinct type. Guarding "if b == 0" works too, but catching the wrong type (e.g. ValueError) would let the crash through.',
      solutionHint:
        'try: return a / b  /  except ZeroDivisionError: return None.',
    },
    {
      id: 'l10-chal-3',
      type: 'multipleChoice',
      stage: 'debug',
      tags: ['exceptionType', 'traceback'],
      prompt:
        'What does f("z") return?\n\ndef f(x):\n    try:\n        return int(x)\n    except Exception:\n        return "broad"\n    except ValueError:\n        return "specific"',
      options: ["'broad'", "'specific'", 'a ValueError', 'None'],
      answerIndex: 0,
      explanation:
        'except clauses are tried top-to-bottom and the FIRST matching one wins. int("z") raises ValueError, but except Exception is listed first and ValueError is a subclass of Exception, so the broad handler catches it and returns "broad". The specific ValueError clause below is unreachable.',
      trapNote:
        'Order matters: a broad except Exception placed before a specific except ValueError shadows it. Always list the most specific exceptions first.',
    },
    {
      id: 'l10-chal-4',
      type: 'traceSteps',
      stage: 'stretch',
      tags: ['exceptionType', 'traceback'],
      prompt:
        'Trace try/except/else/finally when an exception fires, and predict the order of printed lines.',
      code: 'def run(x):\n    try:\n        y = 10 / x\n    except ZeroDivisionError:\n        print("caught")\n        return "err"\n    else:\n        print("ok")\n        return y\n    finally:\n        print("done")\n\nprint(run(0))',
      steps: [
        {
          line: 3,
          vars: { x: '0' },
          note: '10 / 0 raises ZeroDivisionError, so the try body stops here and the matching except runs.',
        },
        {
          line: 5,
          vars: { x: '0' },
          output: 'caught',
          note: 'The except ZeroDivisionError block runs and prints "caught".',
        },
        {
          line: 6,
          vars: { x: '0' },
          note: 'return "err" is staged — but finally must run before the function actually returns.',
        },
        {
          line: 11,
          vars: { x: '0' },
          output: 'done',
          note: 'finally ALWAYS runs, even when returning from the except. The else block is skipped because an exception occurred.',
        },
        {
          line: 13,
          vars: {},
          output: 'err',
          note: 'run(0) returned "err", which print displays last.',
        },
      ],
      question: 'In what order are the lines printed?',
      options: [
        'caught, done, err',
        'caught, err, done',
        'ok, done, err',
        'caught, done, ok',
        'done, caught, err',
      ],
      answerIndex: 0,
      explanation:
        'The exception sends control to except (prints "caught"). Its return "err" is held while finally runs (prints "done") — finally always executes before the function returns. else is skipped because an exception occurred. Back at the top level, print shows the returned "err". So: caught, done, err.',
    },
  ],
  lesson11: [
    {
      id: 'l11-chal-1',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['oopAttrs'],
      prompt:
        'Write a class Basket. The constructor takes owner and stores it. Each basket must have its OWN items list, starting empty. Add an add(thing) method that appends to that basket\'s items. Two different baskets must NOT share the same list.',
      starterCode: 'class Basket:\n    pass',
      tests: [
        'a = Basket("amy")\nb = Basket("bob")\na.add("apple")\nassert a.items == ["apple"]',
        'assert b.items == []',
        'c = Basket("cam")\nc.add("x")\nc.add("y")\nassert c.items == ["x", "y"]',
        'assert a.items == ["apple"]',
      ],
      explanation:
        'Create the list INSIDE __init__ with self.items = [], so every instance gets a fresh list bound to it. Then add appends to self.items. Because the list is per-instance, mutating one basket leaves the others untouched — c.add("x") never shows up in a.items.',
      trapNote:
        'Writing the list as a class attribute (class Basket: items = []) makes ONE list shared by every instance, so a.add(...) would leak into b.items. Per-instance state must be set in __init__ with self.',
      solutionHint:
        'def __init__(self, owner): self.owner = owner; self.items = []  /  def add(self, thing): self.items.append(thing).',
    },
    {
      id: 'l11-chal-2',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['oopAttrs'],
      prompt:
        'Account has __init__(self, balance) and describe(self) returning "balance=<balance>". Write a subclass SavingsAccount that also stores a rate. Its __init__ must reuse the parent to set balance via super(), and its describe must extend the parent\'s text to "balance=<balance> rate=<rate>".',
      starterCode:
        'class Account:\n    def __init__(self, balance):\n        self.balance = balance\n    def describe(self):\n        return f"balance={self.balance}"\n\nclass SavingsAccount(Account):\n    pass',
      tests: [
        's = SavingsAccount(100, 5)\nassert s.balance == 100',
        'assert s.rate == 5',
        'assert s.describe() == "balance=100 rate=5"',
        'assert Account(50).describe() == "balance=50"',
        'assert isinstance(s, Account)',
      ],
      explanation:
        'In SavingsAccount.__init__ call super().__init__(balance) to run the parent constructor (which sets self.balance), then set self.rate. In describe, call super().describe() to get "balance=100" and append " rate=5". super() reuses the parent\'s behavior instead of copying it, and isinstance(s, Account) is True because SavingsAccount inherits from Account.',
      trapNote:
        'Forgetting super().__init__(balance) leaves self.balance unset, so describe crashes with AttributeError. The subclass __init__ overrides the parent\'s, so the parent constructor only runs if you call it explicitly.',
      solutionHint:
        'def __init__(self, balance, rate): super().__init__(balance); self.rate = rate  /  def describe(self): return super().describe() + f" rate={self.rate}".',
    },
    {
      id: 'l11-chal-3',
      type: 'multipleChoice',
      stage: 'debug',
      tags: ['oopAttrs'],
      prompt:
        'What is d1.tricks after this runs?\n\nclass Dog:\n    tricks = []\n    def __init__(self, name):\n        self.name = name\n    def add_trick(self, t):\n        self.tricks.append(t)\n\nd1 = Dog("rex")\nd2 = Dog("fido")\nd1.add_trick("sit")\nd2.add_trick("roll")',
      options: ["['sit', 'roll']", "['sit']", "['roll']", '[]'],
      answerIndex: 0,
      explanation:
        'tricks is a class attribute — a single list object shared by every Dog instance. add_trick does self.tricks.append(t), which does NOT create a new instance attribute; it MUTATES the one shared list. So d1 appending "sit" and d2 appending "roll" both land in the same list, and d1.tricks is ["sit", "roll"].',
      trapNote:
        'self.tricks.append(...) mutates the shared class list; only an assignment like self.tricks = [...] would create a separate per-instance attribute. Mutable class attributes are shared across all instances.',
    },
    {
      id: 'l11-chal-4',
      type: 'traceSteps',
      stage: 'stretch',
      tags: ['oopAttrs'],
      prompt:
        'Trace how self.count += 1 interacts with a class attribute, then predict both printed lines.',
      code: 'class Counter:\n    count = 0\n    def __init__(self):\n        self.count += 1\n\na = Counter()\nb = Counter()\nprint(a.count)\nprint(Counter.count)',
      steps: [
        {
          line: 6,
          vars: { 'Counter.count': '0' },
          note: 'a = Counter(): __init__ runs self.count += 1, i.e. self.count = self.count + 1. The read finds the class attribute 0, then the assignment creates an INSTANCE attribute a.count = 1. The class attribute is untouched.',
        },
        {
          line: 7,
          vars: { 'Counter.count': '0', 'a.count': '1' },
          note: 'b = Counter(): same thing — b.count becomes its own instance attribute 1. Counter.count is still 0.',
        },
        {
          line: 8,
          vars: { 'Counter.count': '0', 'a.count': '1', 'b.count': '1' },
          output: '1',
          note: 'a.count is the instance attribute, 1.',
        },
        {
          line: 9,
          vars: { 'Counter.count': '0', 'a.count': '1', 'b.count': '1' },
          output: '0',
          note: 'Counter.count is the class attribute, never incremented, so 0.',
        },
      ],
      question: 'What are the two printed lines, in order?',
      options: ['1 then 0', '1 then 2', '2 then 2', '1 then 1', '0 then 2'],
      answerIndex: 0,
      explanation:
        'self.count += 1 expands to self.count = self.count + 1. The right side reads the class attribute (0) because the instance has none yet, but the assignment binds a NEW instance attribute on self set to 1. The class attribute Counter.count is never modified, so it stays 0. Hence a.count is 1 and Counter.count is 0. The trap answer "1 then 2" assumes the class attribute accumulates across instances.',
    },
  ],
  lesson12: [
    {
      id: 'l12-chal-1',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['recursion'],
      prompt:
        'Write sum_to(n) RECURSIVELY (no loops): return 0 + 1 + ... + n for n >= 0. The base case is sum_to(0) == 0; every other call adds n to the sum of everything below it.',
      starterCode: 'def sum_to(n):\n    pass',
      tests: [
        'assert sum_to(0) == 0',
        'assert sum_to(1) == 1',
        'assert sum_to(5) == 15',
        'assert sum_to(10) == 55',
      ],
      explanation:
        'Base case: if n == 0 return 0. Recursive case: return n + sum_to(n - 1). Each call peels off n and defers the rest to a smaller call, and the additions accumulate as the stack unwinds: sum_to(5) = 5 + (4 + (3 + (2 + (1 + 0)))) = 15. The n == 0 base case is what stops the recursion.',
      trapNote:
        'Omitting the base case (or using n == 1) means sum_to(0) recurses into negative n forever and blows the stack with RecursionError. Always return a concrete value at the smallest input.',
      solutionHint:
        'if n == 0: return 0  /  return n + sum_to(n - 1).',
    },
    {
      id: 'l12-chal-2',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['recursion'],
      prompt:
        'Write total(items) RECURSIVELY (no loops) that sums all integers in a list that may contain nested lists. total([]) is 0. Use head/tail recursion: handle the first element (recursing into it if it is itself a list) plus total of the rest.',
      starterCode: 'def total(items):\n    pass',
      tests: [
        'assert total([]) == 0',
        'assert total([5]) == 5',
        'assert total([1, 2, 3]) == 6',
        'assert total([1, [2, 3], [4, [5]]]) == 15',
        'assert total([[], [], []]) == 0',
      ],
      explanation:
        'Base case: an empty list returns 0. Otherwise split into first = items[0] and rest = items[1:]. If first is a list, recurse into it; otherwise it is an int to add. Either way add total(rest): return (total(first) if isinstance(first, list) else first) + total(rest). Two base cases meet here — empty list returns 0, and a bare int is added directly — letting arbitrary nesting collapse.',
      trapNote:
        'isinstance(first, list) is essential: without it you would try to add a list to an int and hit TypeError. The empty-list base case [] -> 0 also handles the nested empties in [[], [], []].',
      solutionHint:
        'if not items: return 0  /  first, rest = items[0], items[1:]  /  head = total(first) if isinstance(first, list) else first  /  return head + total(rest).',
    },
    {
      id: 'l12-chal-3',
      type: 'multipleChoice',
      stage: 'stretch',
      tags: ['recursion'],
      prompt:
        'What is the worst-case time complexity of this function in terms of n = len(nums)?\n\ndef has_pair(nums, target):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return True\n    return False',
      options: ['O(n^2)', 'O(n)', 'O(n log n)', 'O(1)'],
      answerIndex: 0,
      explanation:
        'Two nested loops each scan over the list. The inner loop runs n-1, then n-2, ..., down to 0 times across the outer iterations, totalling n(n-1)/2 comparisons — which grows like n^2. In the worst case (no matching pair, so it never returns early) the work is proportional to n^2, i.e. O(n^2). O(n) would require a single pass, e.g. with a set of seen values.',
      trapNote:
        'A nested loop where the inner bound depends on the outer index still sums to ~n^2/2 iterations. Constants and the 1/2 drop out in Big-O, leaving O(n^2), not O(n).',
    },
    {
      id: 'l12-chal-4',
      type: 'traceSteps',
      stage: 'stretch',
      tags: ['recursion'],
      prompt:
        'Trace recursive factorial and watch the value build up as the call stack unwinds.',
      code: 'def fac(n):\n    if n == 0:\n        return 1\n    return n * fac(n - 1)\n\nprint(fac(3))',
      steps: [
        {
          line: 4,
          vars: { n: '3' },
          note: 'fac(3): n is not 0, so it returns 3 * fac(2) — but fac(2) must be computed first.',
        },
        {
          line: 4,
          vars: { n: '2' },
          note: 'fac(2): returns 2 * fac(1), pausing to compute fac(1).',
        },
        {
          line: 4,
          vars: { n: '1' },
          note: 'fac(1): returns 1 * fac(0), pausing to compute fac(0).',
        },
        {
          line: 3,
          vars: { n: '0' },
          note: 'fac(0): base case hit, returns 1. Now the stack unwinds.',
        },
        {
          line: 6,
          vars: {},
          output: '6',
          note: 'Unwinding: fac(1) = 1*1 = 1, fac(2) = 2*1 = 2, fac(3) = 3*2 = 6. print shows 6.',
        },
      ],
      question: 'What does this program print?',
      options: ['6', '0', '3', '1', 'RecursionError'],
      answerIndex: 0,
      explanation:
        'fac(3) defers to 3 * fac(2), which defers to 2 * fac(1), which defers to 1 * fac(0). The base case fac(0) returns 1, and as the stack unwinds the multiplications resolve outward: 1, then 2, then 6. The result is 3 * 2 * 1 * 1 = 6. Without the n == 0 base case it would recurse forever and raise RecursionError.',
    },
  ],
  lesson13: [
    {
      id: 'l13-chal-1',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['identity'],
      prompt:
        'Write analyze(a, b) that returns a tuple (equal, same_object): equal is whether a == b, and same_object is whether a is b. This separates value equality from object identity.',
      starterCode: 'def analyze(a, b):\n    pass',
      tests: [
        'x = [1, 2, 3]\ny = [1, 2, 3]\nassert analyze(x, y) == (True, False)',
        'z = x\nassert analyze(x, z) == (True, True)',
        'assert analyze([], []) == (True, False)',
        'assert analyze(None, None) == (True, True)',
      ],
      explanation:
        'return (a == b, a is b). == compares VALUES, so two separate lists with equal contents are ==. is compares IDENTITY (same object in memory), so those two distinct lists are NOT is. When z = x aliases the same list, a is b is True. None is a singleton, so None is None is True.',
      trapNote:
        'Two distinct lists with equal contents are == but not is. Use is only for identity checks (most commonly x is None), and == for value comparison.',
      solutionHint: 'return (a == b, a is b)',
    },
    {
      id: 'l13-chal-2',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['shallowCopy'],
      prompt:
        'A grid is a list of lists. Write independent_copy(grid) that returns a copy you can mutate freely — appending to an inner list of the copy must NOT change the original grid. Import deepcopy from copy.',
      starterCode: 'from copy import deepcopy\n\ndef independent_copy(grid):\n    pass',
      tests: [
        'original = [[1, 2], [3, 4]]\ncopy_ = independent_copy(original)\ncopy_[0].append(99)\nassert original == [[1, 2], [3, 4]]',
        'assert copy_ == [[1, 2, 99], [3, 4]]',
        'assert independent_copy([]) == []',
        'g = [[0]]\nc = independent_copy(g)\nc[0][0] = 7\nassert g == [[0]]',
      ],
      explanation:
        'return deepcopy(grid). deepcopy recursively copies the outer list AND every inner list, so the copy shares no objects with the original — mutating copy_[0] cannot touch original[0]. A shallow copy (grid[:] or list(grid)) copies only the outer list; the inner lists stay shared, so copy_[0].append(99) would leak into original.',
      trapNote:
        'grid[:] / list(grid) is a SHALLOW copy: the outer list is new but the inner lists are the same objects, so mutating an inner list shows in both. deepcopy is required for true independence of nested structures.',
      solutionHint: 'return deepcopy(grid)',
    },
    {
      id: 'l13-chal-3',
      type: 'multipleChoice',
      stage: 'debug',
      tags: ['shallowCopy', 'aliasing'],
      prompt:
        'What is a after this runs?\n\na = [[1, 2], [3, 4]]\nb = a[:]\nb[0].append(99)',
      options: ['[[1, 2, 99], [3, 4]]', '[[1, 2], [3, 4]]', '[[1, 2, 99], [3, 4, 99]]', 'a TypeError'],
      answerIndex: 0,
      explanation:
        'a[:] makes a SHALLOW copy: b is a new outer list (so a is b is False), but b[0] is the very same inner list object as a[0]. b[0].append(99) mutates that shared inner list in place, so the change is visible through a as well — a becomes [[1, 2, 99], [3, 4]]. Only b[0] (= a[0]) is affected; a[1] is unchanged.',
      trapNote:
        'A slice copy duplicates only the top level. The inner lists are shared references, so mutating b[0] also mutates a[0]. deepcopy(a) would have made them independent.',
    },
    {
      id: 'l13-chal-4',
      type: 'traceSteps',
      stage: 'stretch',
      tags: ['identity'],
      prompt:
        'Trace == versus is on lists, and predict the three printed lines.',
      code: 'a = [1, 2]\nb = [1, 2]\nc = a\nprint(a == b)\nprint(a is b)\nprint(a is c)',
      steps: [
        { line: 1, vars: { a: '[1, 2]' } },
        {
          line: 2,
          vars: { a: '[1, 2]', b: '[1, 2]' },
          note: 'b is a SEPARATE list object that happens to have equal contents.',
        },
        {
          line: 3,
          vars: { a: '[1, 2]', b: '[1, 2]', c: '[1, 2]' },
          note: 'c = a does not copy; c is bound to the same object as a (an alias).',
        },
        {
          line: 4,
          vars: { a: '[1, 2]', b: '[1, 2]', c: '[1, 2]' },
          output: 'True',
          note: 'a == b compares values: equal contents, so True.',
        },
        {
          line: 5,
          vars: { a: '[1, 2]', b: '[1, 2]', c: '[1, 2]' },
          output: 'False',
          note: 'a is b compares identity: different objects, so False.',
        },
        {
          line: 6,
          vars: { a: '[1, 2]', b: '[1, 2]', c: '[1, 2]' },
          output: 'True',
          note: 'a is c: c is an alias of a, the same object, so True.',
        },
      ],
      question: 'What are the three printed lines, in order?',
      options: [
        'True, False, True',
        'True, True, True',
        'True, False, False',
        'False, False, True',
        'True, True, False',
      ],
      answerIndex: 0,
      explanation:
        'a == b is True because the two lists hold equal values. a is b is False because they are distinct objects in memory despite equal contents. a is c is True because c = a binds c to the SAME object (an alias), not a copy. So the lines are True, False, True. The trap is assuming equal contents imply is (identity) — they do not.',
    },
  ],
};
