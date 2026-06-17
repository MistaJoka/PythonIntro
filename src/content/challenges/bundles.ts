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
  {
    id: 'ch-controlflow',
    title: 'Control-Flow Traps',
    blurb: 'Where ranges stop early, 0 is falsy, and for...else fires when you least expect it.',
    theme: 'controlflow',
    difficulty: 1,
    lessonRefs: ['lesson03', 'lesson04'],
    examples: [
      {
        id: 'ch-controlflow-1',
        type: 'codeChallenge',
        stage: 'build',
        tags: ['offByOne', 'loopLogic'],
        prompt:
          'Write sum_evens(n) that returns the sum of every even number from 1 through n inclusive. sum_evens(10) is 30 (2+4+6+8+10). If there are no evens, return 0.',
        starterCode: 'def sum_evens(n):\n    pass',
        tests: [
          'assert sum_evens(10) == 30',
          'assert sum_evens(9) == 20',
          'assert sum_evens(2) == 2',
          'assert sum_evens(1) == 0',
          'assert sum_evens(0) == 0',
        ],
        explanation:
          'total = 0; for i in range(2, n + 1, 2): total += i; return total. The stop must be n + 1 so an even n is included, and the start at 2 with step 2 skips odds.',
        trapNote:
          'range(2, n, 2) excludes n itself — sum_evens(10) would wrongly drop the 10. The stop is exclusive, so use n + 1.',
      },
      {
        id: 'ch-controlflow-2',
        type: 'codeChallenge',
        stage: 'build',
        tags: ['loopLogic', 'loopInvariant'],
        prompt:
          'Write first_divisor(n) (n >= 2) returning the smallest divisor of n greater than 1. For a prime, that divisor is n itself. first_divisor(15) is 3; first_divisor(13) is 13.',
        starterCode: 'def first_divisor(n):\n    pass',
        tests: [
          'assert first_divisor(15) == 3',
          'assert first_divisor(13) == 13',
          'assert first_divisor(49) == 7',
          'assert first_divisor(4) == 2',
          'assert first_divisor(2) == 2',
        ],
        explanation:
          'for d in range(2, n): if n % d == 0: return d — then after the loop return n. Equivalently use a for...else: the else runs only if no divisor was found (no return/break), meaning n is prime.',
        trapNote:
          'For n = 2, range(2, 2) is empty so the loop body never runs; you must still return n (2) afterward, or you return None.',
        solutionHint:
          'Loop d from 2 up to but not including n; return the first d that divides n, else return n.',
      },
      {
        id: 'ch-controlflow-3',
        type: 'multipleChoice',
        stage: 'stretch',
        tags: ['truthiness'],
        prompt:
          'What is r after this runs?\n\nscore = 0\nif score:\n    r = "set"\nelif score >= 0:\n    r = "zero-or-more"\nelse:\n    r = "negative"',
        options: ['"set"', '"zero-or-more"', '"negative"', 'r is undefined'],
        answerIndex: 1,
        explanation:
          '0 is falsy, so `if score:` is False even though score is defined. The elif `score >= 0` is 0 >= 0 → True, so r becomes "zero-or-more".',
        trapNote:
          'Truthiness (`if score`) and a numeric comparison (`score >= 0`) are different tests. 0 fails the first but passes the second.',
      },
      {
        id: 'ch-controlflow-4',
        type: 'multipleChoice',
        stage: 'stretch',
        tags: ['loopLogic', 'offByOne'],
        prompt:
          'How many times does the body run?\n\ncount = 0\nfor i in range(3):\n    for j in range(i):\n        count += 1',
        options: ['9', '6', '3', '0'],
        answerIndex: 2,
        explanation:
          'The inner range(i) has i iterations. For i = 0, 1, 2 that is 0 + 1 + 2 = 3 total, so count ends at 3.',
        trapNote:
          'It is not 3 * 3 = 9. range(i) depends on i, and range(0) is empty — the inner loop runs 0, then 1, then 2 times.',
      },
      {
        id: 'ch-controlflow-5',
        type: 'traceSteps',
        stage: 'stretch',
        tags: ['loopInvariant', 'loopLogic'],
        prompt: 'Trace the accumulator and counter through each iteration of the while loop.',
        code: 'total = 0\nn = 5\nwhile n > 0:\n    total += n\n    n -= 2',
        steps: [
          { line: 1, vars: { total: '0' } },
          { line: 2, vars: { total: '0', n: '5' } },
          { line: 4, vars: { total: '5', n: '5' }, note: 'iter 1: add n, then n -= 2' },
          { line: 5, vars: { total: '5', n: '3' } },
          { line: 4, vars: { total: '8', n: '3' }, note: 'iter 2' },
          { line: 5, vars: { total: '8', n: '1' } },
          { line: 4, vars: { total: '9', n: '1' }, note: 'iter 3' },
          { line: 5, vars: { total: '9', n: '-1' }, note: 'n is now -1, so n > 0 is False — loop ends' },
        ],
        question: 'What is the final value of total?',
        options: ['6', '9', '15', '8'],
        answerIndex: 1,
        explanation:
          'n takes the values 5, 3, 1 inside the loop (decreasing by 2). total accumulates 5 + 3 + 1 = 9. After the third iteration n is -1, so n > 0 is False and the loop stops.',
      },
    ],
  },
  {
    id: 'ch-textparse',
    title: 'Text & Parsing',
    blurb: 'Negative-step slices, greedy regex, and the JSON-to-Python type table that trips everyone.',
    theme: 'textparse',
    difficulty: 2,
    lessonRefs: ['lesson06', 'lesson15'],
    examples: [
      {
        id: 'ch-textparse-1',
        type: 'codeChallenge',
        stage: 'build',
        tags: ['offByOne'],
        prompt:
          'Write is_palindrome(s) that returns True if s reads the same forwards and backwards, ignoring case and any non-alphanumeric characters. is_palindrome("A man, a plan, a canal: Panama") is True; is_palindrome("race a car") is False.',
        starterCode: 'def is_palindrome(s):\n    pass',
        tests: [
          'assert is_palindrome("A man, a plan, a canal: Panama") == True',
          'assert is_palindrome("race a car") == False',
          'assert is_palindrome("0P") == False',
          'assert is_palindrome("") == True',
          'assert is_palindrome("a.") == True',
        ],
        explanation:
          'Normalize first: cleaned = "".join(ch.lower() for ch in s if ch.isalnum()), then compare cleaned == cleaned[::-1]. The [::-1] slice reverses the string.',
        trapNote:
          '"0P" is False — case-folding makes it "0p" whose reverse is "p0". Skipping the .isalnum() filter (or forgetting .lower()) misclassifies the punctuation cases.',
        solutionHint: 'Strip to alphanumerics, lowercase, then compare against the reversed slice s[::-1].',
      },
      {
        id: 'ch-textparse-2',
        type: 'codeChallenge',
        stage: 'build',
        tags: ['jsonCsv'],
        prompt:
          'Write parse_scores(text) where text is CSV with a header row "name,score". Return a dict mapping each name to its score as an int, stripping surrounding whitespace from both fields. Parse the string with csv.reader(io.StringIO(text)) — do not touch the filesystem.',
        starterCode: 'import csv, io\n\ndef parse_scores(text):\n    pass',
        tests: [
          'assert parse_scores("name,score\\n Ann , 90\\nBob,75\\n") == {"Ann": 90, "Bob": 75}',
          'assert parse_scores("name,score\\nX,0\\n") == {"X": 0}',
          'assert parse_scores("name,score\\n") == {}',
        ],
        explanation:
          'rows = list(csv.reader(io.StringIO(text))); then iterate rows[1:] to skip the header, doing out[name.strip()] = int(score.strip()). int() on " 90" fails unless you strip first — int(s.strip()) is safe.',
        trapNote:
          'Forgetting rows[1:] makes "name"/"score" a data row and int("score") raises ValueError. Also int(" 90") works, but assigning the un-stripped " Ann " as a key leaves a space in the dict.',
        solutionHint: 'Read all rows, skip index 0 (the header), strip each field, and int() the score.',
      },
      {
        id: 'ch-textparse-3',
        type: 'multipleChoice',
        stage: 'stretch',
        tags: ['regex'],
        prompt:
          'What does this return?\n\nimport re\nre.findall(r"(\\d)\\d", "12 34 56")',
        options: [
          "['1', '3', '5']",
          "['12', '34', '56']",
          "['2', '4', '6']",
          "[('1', '2'), ('3', '4'), ('5', '6')]",
        ],
        answerIndex: 0,
        explanation:
          'When the pattern contains one capturing group, re.findall returns only the captured group, not the whole match. The match is two digits but the group captures just the first, giving ["1", "3", "5"].',
        trapNote:
          'findall returns the FULL match only when there are no groups. Add a group and it returns the group(s) instead — a classic source of "wrong" results.',
      },
      {
        id: 'ch-textparse-4',
        type: 'multipleChoice',
        stage: 'stretch',
        tags: ['offByOne', 'typeCoercion'],
        prompt:
          'What does this return?\n\n"a,,b".split(",")',
        options: [
          "['a', '', 'b']",
          "['a', 'b']",
          "['a', ',', 'b']",
          "['a,,b']",
        ],
        answerIndex: 0,
        explanation:
          'str.split(",") splits on EVERY comma and keeps empty fields between consecutive delimiters, so the gap between the two commas becomes "". The result is the 3-element list ["a", "", "b"].',
        trapNote:
          'split with an explicit separator preserves empties; only the no-argument split() (whitespace mode) collapses runs and drops empties — "  a  b  ".split() is ["a", "b"].',
      },
      {
        id: 'ch-textparse-5',
        type: 'traceSteps',
        stage: 'stretch',
        tags: ['jsonCsv', 'typeCoercion'],
        prompt: 'Trace how json.loads maps each JSON value to a Python type.',
        code: "import json\ndata = '[null, true, 1, 2.0]'\nv = json.loads(data)\nfirst = v[0]\nflag = v[1]",
        steps: [
          { line: 2, vars: { data: "'[null, true, 1, 2.0]'" } },
          {
            line: 3,
            vars: { data: "'[null, true, 1, 2.0]'", v: '[None, True, 1, 2.0]' },
            note: 'null→None, true→True, 1→int, 2.0→float',
          },
          { line: 4, vars: { v: '[None, True, 1, 2.0]', first: 'None' } },
          { line: 5, vars: { v: '[None, True, 1, 2.0]', first: 'None', flag: 'True' } },
        ],
        question: 'What are the Python types of first and flag?',
        options: [
          'NoneType and bool',
          'str and str',
          'NoneType and int',
          'None and "true" (both strings)',
        ],
        answerIndex: 0,
        explanation:
          'json.loads maps null → None (type NoneType), true → True (type bool), an integer literal → int, and a decimal literal → float. So first is None (NoneType) and flag is True (bool).',
      },
    ],
  },
];
