import type { Lesson } from '../schema';

/**
 * ML Bridge — Session 4a: the loop-to-DataFrame translation.
 *
 * Every example here uses the Transaction Risk Lab dataset so the whole bridge
 * tier tells one story instead of teaching pandas on abstract toy frames.
 * Challenges that need pandas declare `requires: ['pandas']`; the wheel is
 * fetched on demand so the Intro lessons stay lightweight.
 */

/**
 * The canonical rows plus one deliberate discriminator: Fatima is a large but
 * legitimate purchase (3100.00, only 1 failed attempt). Without her, every
 * high-amount row also happens to have many failures, so filtering on amount
 * alone would pass the mask challenge below and quietly reward a learner who
 * dropped half the condition. Small enough to still eyeball by hand.
 */
const SAMPLE_DF = [
  'import pandas as pd',
  '',
  'df = pd.DataFrame({',
  '    "customer": ["Alice", "Bob", "Carlos", "Dana", "Eli", "Fatima"],',
  '    "amount": [45.50, 1800.00, 220.25, 3200.00, 88.99, 3100.00],',
  '    "country": ["US", "US", "BR", "US", "CA", "US"],',
  '    "failed_attempts": [0, 4, 1, 6, 0, 1],',
  '    "fraud": [False, True, False, True, False, False],',
  '})',
].join('\n');

export const ml01: Lesson = {
  id: 'ml01',
  title: 'From Loops to DataFrames',
  subtitle: 'The same question, asked two ways — CAI 2100C bridge',
  objectives: [
    'Translate a filtering loop into a pandas boolean mask',
    'Read a boolean mask as a column-wide expression, not a row-by-row test',
    'Use & and | with parentheses instead of and/or',
    'Recognise when a DataFrame operation replaces an explicit loop',
  ],
  concepts: [
    {
      id: 'ml1-c1',
      title: 'The translation',
      objective: 'See the loop and the mask as two spellings of one question.',
      miniNote:
        'pandas does not remove the loop — it moves it into C, below your code. Same work, different altitude.',
      examples: [
        {
          id: 'ml1-c1-e1',
          type: 'multipleChoice',
          stage: 'see',
          tags: ['vectorization'],
          prompt:
            'This loop collects risky transactions:\n\n' +
            'suspicious = []\n' +
            'for t in transactions:\n' +
            '    if t["amount"] > 1000 and t["failed_attempts"] >= 3:\n' +
            '        suspicious.append(t)\n\n' +
            'Which pandas expression asks the same question?',
          options: [
            'df[(df["amount"] > 1000) & (df["failed_attempts"] >= 3)]',
            'df[df["amount"] > 1000 and df["failed_attempts"] >= 3]',
            'df.filter(amount > 1000, failed_attempts >= 3)',
            'df.loc[df["amount"] > 1000].append(df["failed_attempts"] >= 3)',
          ],
          answerIndex: 0,
          explanation:
            'Each condition produces a full column of True/False, and & combines them elementwise. ' +
            'The parentheses are required because & binds tighter than > in Python.',
          trapNote:
            'Option 2 looks natural but raises ValueError: `and` demands a single True/False, and a ' +
            'column of 5 booleans is ambiguous. Use & for elementwise, and reserve `and` for scalars.',
        },
        {
          id: 'ml1-c1-e1b',
          type: 'traceSteps',
          stage: 'see',
          tags: ['vectorization', 'loopLogic'],
          prompt:
            'Before trusting the one-liner, watch the loop pandas replaces. Step through it and ' +
            'see the mask fill in.',
          code: [
            'amounts = [45.50, 1800.00, 3200.00]',
            'failed = [0, 4, 1]',
            'mask = []',
            'for a, f in zip(amounts, failed):',
            '    mask.append(a > 1000 and f >= 3)',
          ].join('\n'),
          steps: [
            { line: 1, vars: { amounts: '[45.5, 1800.0, 3200.0]' } },
            { line: 2, vars: { failed: '[0, 4, 1]' } },
            { line: 3, vars: { mask: '[]' } },
            { line: 4, vars: { a: '45.5', f: '0' }, note: 'First row: small amount, no failures.' },
            { line: 5, vars: { mask: '[False]' }, note: '45.5 > 1000 is False, so the AND is False.' },
            { line: 4, vars: { a: '1800.0', f: '4' }, note: 'Second row: large amount, 4 failures.' },
            { line: 5, vars: { mask: '[False, True]' }, note: 'Both halves hold, so True.' },
            { line: 4, vars: { a: '3200.0', f: '1' }, note: 'Third row: largest amount — but only 1 failure.' },
            {
              line: 5,
              vars: { mask: '[False, True, False]' },
              note: 'Amount passes, failures do not. The AND rejects it.',
            },
          ],
          question: 'What is mask when the loop finishes?',
          options: [
            '[False, True, False]',
            '[False, True, True]',
            '[True, True, False]',
            '[False, False, False]',
          ],
          answerIndex: 0,
          explanation:
            'That list of booleans IS the mask. pandas builds the same thing in one expression — ' +
            '(df["amount"] > 1000) & (df["failed_attempts"] >= 3) — and then uses it to select rows. ' +
            'Seeing the third row rejected is the point: the largest amount in the set is not risky, ' +
            'because the failure count vetoes it.',
          trapNote:
            'Row three is the one worth remembering. A filter on amount alone would have flagged it.',
        },
        {
          id: 'ml1-c1-e2',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['vectorization', 'dataFrameIndexing'],
          requires: ['pandas'],
          prompt:
            'The DataFrame is already built. Write high_risk(df) returning only the rows where ' +
            'amount is over 1000 AND failed_attempts is 3 or more. Use a boolean mask, not a loop.',
          starterCode: `${SAMPLE_DF}\n\n\ndef high_risk(df):\n    # Return the risky rows. One expression is enough.\n    pass\n`,
          tests: [
            'assert high_risk(df) is not None, "high_risk returned None — did you use return?"',
            'assert len(high_risk(df)) == 2, f"expected 2 risky rows, got {len(high_risk(df))}"',
            'assert list(high_risk(df)["customer"]) == ["Bob", "Dana"]',
            'assert "amount" in high_risk(df).columns, "return whole rows, not just one column"',
          ],
          solutionHint:
            'Two comparisons, each in its own parentheses, joined by &, then index the frame with the result.',
          explanation:
            'df[mask] keeps the rows where mask is True. Bob (1800, 4 failures) and Dana (3200, 6) ' +
            'clear both bars. Fatima spent more than Bob but failed only once — a big legitimate ' +
            'purchase — so filtering on amount alone would wrongly flag her.',
          trapNote:
            'Two traps here. Returning df["amount"] > 1000 gives the mask itself — a column of ' +
            'booleans — not the rows. And dropping the failed_attempts half of the condition still ' +
            'returns rows, just the wrong ones: Fatima sneaks in.',
        },
        {
          id: 'ml1-c1-e3',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['dataFrameIndexing', 'dictKeys'],
          requires: ['pandas'],
          prompt:
            'Print one line per country in the form "US: 4", ordered from most transactions to ' +
            'fewest. Your printed output is what gets checked.',
          starterCode: `${SAMPLE_DF}\n\n# Print each country and its transaction count, most frequent first.\n`,
          tests: [
            'assert "US: 4" in _stdout, f"expected a line \'US: 4\', got: {_stdout!r}"',
            'assert "BR: 1" in _stdout, f"expected a line \'BR: 1\', got: {_stdout!r}"',
            'assert "CA: 1" in _stdout, f"expected a line \'CA: 1\', got: {_stdout!r}"',
            '_lines = [l for l in _stdout.strip().splitlines() if l.strip()]',
            'assert len(_lines) == 3, f"expected exactly 3 lines, one per country; got {_lines!r}"',
            'assert _lines[0].startswith("US"), f"US has the most rows, so it should print first; got {_lines[0]!r}"',
          ],
          solutionHint:
            'value_counts() already sorts by frequency. Loop over its .items() and print with an f-string.',
          explanation:
            'df["country"].value_counts() returns a Series indexed by country and sorted descending, ' +
            'so iterating .items() gives you the pairs in the order you need.',
          trapNote:
            'This challenge grades printed output, so returning the counts is not enough — you must print them.',
        },
      ],
    },
  ],
  lessonCheck: [
    {
      id: 'ml1-check-1',
      type: 'multipleChoice',
      stage: 'try',
      tags: ['vectorization'],
      prompt: 'Why does df[df["a"] > 1 and df["b"] > 2] raise a ValueError?',
      options: [
        '`and` needs one True/False, but each comparison is a whole column of them',
        'pandas does not support more than one condition at a time',
        '`and` only works on integers',
        'The columns must be converted to lists first',
      ],
      answerIndex: 0,
      explanation:
        'Python\'s `and` calls bool() on its operands. bool() of a multi-element Series is ambiguous — ' +
        'pandas cannot guess whether you meant "any" or "all", so it raises instead. & is elementwise ' +
        'and has no such ambiguity.',
    },
  ],
};
