import type { Lesson } from '../schema';

/**
 * Lesson 18 — Python Libraries: NumPy & pandas.
 *
 * Recovered from the COP1047C "Python Libraries" module, which the app was
 * missing entirely. That module explicitly teaches array reshaping and
 * stacking, the aggregate functions with axis, and — on the pandas side —
 * "Concatenating and Merging", "Reshaping DataFrames", "Mapping Items into
 * Groups", and "Working with time data".
 *
 * Scope is chosen to complement rather than repeat the ML bridge tier: that
 * tier covers masks, CSV loading and the modelling workflow, so this one is
 * about reshaping, combining, grouping, and time — the operations the course
 * lists that nothing else here teaches.
 */

const NP = 'import numpy as np\n\n';
const PD = 'import pandas as pd\nimport numpy as np\n\n';

export const lesson18: Lesson = {
  id: 'lesson18',
  title: 'Python Libraries: NumPy & pandas',
  subtitle: 'Reshaping, stacking, merging, grouping, and time data',
  objectives: [
    'Reshape and flatten arrays without changing their contents',
    'Combine arrays with hstack/vstack and split them apart again',
    'Aggregate along an axis, and locate values with argmax',
    'Concatenate and merge DataFrames, then group and resample by time',
  ],
  concepts: [
    {
      id: 'l18-c1',
      title: 'Shape, reshape, flatten',
      objective: 'Change how an array is laid out without changing what is in it.',
      miniNote:
        'reshape rearranges the same values into a new shape. The element count must stay identical.',
      examples: [
        {
          id: 'l18-c1-e1',
          type: 'multipleChoice',
          stage: 'see',
          tags: ['vectorization'],
          prompt:
            'a = np.arange(12) makes [0, 1, 2, ..., 11].\nWhat does a.reshape(3, 4) produce?',
          options: [
            'A 3x4 array filled row by row: [[0,1,2,3], [4,5,6,7], [8,9,10,11]]',
            'A 3x4 array filled column by column: [[0,3,6,9], [1,4,7,10], [2,5,8,11]]',
            'An error, because 12 values cannot fit a 3x4 shape',
            'A 4x3 array — the arguments are height then width',
          ],
          answerIndex: 0,
          explanation:
            'reshape fills in C order by default: the last axis varies fastest, so values run along ' +
            'each row before moving to the next. The product of the new shape must equal the number ' +
            'of elements — 3 x 4 = 12, so this fits exactly.',
          trapNote:
            'reshape(3, 5) on 12 elements raises ValueError. Use -1 for one dimension — reshape(3, -1) ' +
            '— and NumPy computes the other for you.',
        },
        {
          id: 'l18-c1-e2',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['vectorization', 'axisConfusion'],
          requires: ['numpy'],
          prompt:
            'Build the numbers 1..12 as a 3-row array, then print "shape: (3, 4)", ' +
            '"row_sums: [10 26 42]" and "flat_len: 12" using reshape, an axis aggregate, and flatten.',
          starterCode: `${NP}# Make 1..12 into 3 rows, then report its shape, row sums, and flattened length.\n`,
          tests: [
            'assert "shape: (3, 4)" in _stdout, f"expected \'shape: (3, 4)\'; got: {_stdout!r}"',
            'assert "row_sums: [10 26 42]" in _stdout, f"row sums should be [10 26 42] — sum along axis=1; got: {_stdout!r}"',
            'assert "flat_len: 12" in _stdout, f"flatten should give 12 elements; got: {_stdout!r}"',
          ],
          solutionHint:
            'np.arange(1, 13).reshape(3, -1). Row sums collapse the columns, so axis=1. flatten() ' +
            'returns a 1-D copy whose len() is 12.',
          explanation:
            'arange(1, 13) is 12 values, so reshape(3, -1) infers 4 columns. Summing with axis=1 ' +
            'collapses each row to one number; axis=0 would have given column sums instead.',
          trapNote:
            'flatten() returns a COPY; ravel() returns a view where it can. Mutating a ravel result can ' +
            'therefore change the original.',
        },
      ],
    },
    {
      id: 'l18-c2',
      title: 'Stacking and splitting',
      objective: 'Join arrays together and cut them apart.',
      miniNote:
        'vstack adds rows (grows downward). hstack adds columns (grows sideways).',
      examples: [
        {
          id: 'l18-c2-e1',
          type: 'traceSteps',
          stage: 'see',
          tags: ['vectorization', 'axisConfusion'],
          prompt: 'Watch two 1-D arrays become a 2-D one, then get split back apart.',
          code: [
            'import numpy as np',
            'a = np.array([1, 2, 3])',
            'b = np.array([4, 5, 6])',
            'v = np.vstack((a, b))',
            'h = np.hstack((a, b))',
            'parts = np.split(h, 2)',
          ].join('\n'),
          steps: [
            { line: 2, vars: { a: 'array([1, 2, 3])', 'a.shape': '(3,)' } },
            { line: 3, vars: { b: 'array([4, 5, 6])' } },
            {
              line: 4,
              vars: { v: 'array([[1, 2, 3],\n       [4, 5, 6]])', 'v.shape': '(2, 3)' },
              note: 'vstack stacked them as two ROWS.',
            },
            {
              line: 5,
              vars: { h: 'array([1, 2, 3, 4, 5, 6])', 'h.shape': '(6,)' },
              note: 'hstack joined them end to end — still 1-D.',
            },
            {
              line: 6,
              vars: { parts: '[array([1, 2, 3]), array([4, 5, 6])]' },
              note: 'split cut the 6 elements into 2 equal pieces, recovering the originals.',
            },
          ],
          question: 'What is v.shape?',
          options: ['(3, 2)', '(6,)', '(2, 3)', '(1, 6)'],
          answerIndex: 2,
          explanation:
            'vstack treats each input as a row, so two 3-element arrays become a 2x3 array. hstack on ' +
            'the same 1-D inputs concatenates instead, giving shape (6,) — the operation you pick ' +
            'decides the dimensionality.',
          trapNote:
            'np.split requires equal parts and raises if the array does not divide evenly. ' +
            'np.array_split allows uneven pieces.',
        },
        {
          id: 'l18-c2-e2',
          type: 'multipleChoice',
          stage: 'try',
          tags: ['axisConfusion'],
          prompt:
            'grid has shape (4, 3). What does grid.argmax() return, and what does grid.argmax(axis=0) return?',
          options: [
            'The row index of the largest value; then one index per row',
            'The largest value; then the largest value in each column',
            'The index into the FLATTENED array; then one row-index per column',
            'A (row, col) tuple; then a list of tuples',
          ],
          answerIndex: 2,
          explanation:
            'argmax returns a position, not a value. With no axis it flattens first, so you get a ' +
            'single index into the flat array — np.unravel_index turns that back into (row, col). ' +
            'With axis=0 it collapses the rows, giving one row-index per column.',
          trapNote:
            'Reaching for max() when you meant argmax() is a classic mix-up: one gives the value, the ' +
            'other tells you where it lives.',
        },
      ],
    },
    {
      id: 'l18-c3',
      title: 'Concatenating and merging DataFrames',
      objective: 'Stack tables on top of each other, or join them on a key.',
      miniNote:
        'concat glues frames together. merge matches rows by a shared column — the SQL JOIN of pandas.',
      examples: [
        {
          id: 'l18-c3-e1',
          type: 'multipleChoice',
          stage: 'see',
          tags: ['dataFrameIndexing'],
          prompt:
            'You have two DataFrames: orders (customer_id, total) and customers (customer_id, name). ' +
            'You want one table with the customer name beside each order. Which do you reach for?',
          options: [
            'pd.concat([orders, customers]) — it combines both frames',
            'orders.merge(customers, on="customer_id") — it matches rows by the shared key',
            'orders.append(customers)',
            'orders.join(customers) with no arguments',
          ],
          answerIndex: 1,
          explanation:
            'concat stacks frames — useful when they have the same columns and you want more rows. ' +
            'merge aligns rows by a key, which is what "put the name next to the order" needs. It is ' +
            'the same operation as a SQL JOIN.',
          trapNote:
            'concat on frames with different columns does not fail — it produces a taller frame full ' +
            'of NaN, which is why the mistake often goes unnoticed.',
        },
        {
          id: 'l18-c3-e2',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['dataFrameIndexing'],
          requires: ['pandas', 'numpy'],
          prompt:
            'orders and customers are defined. Merge them on customer_id, then print one line per ' +
            'customer as "Alice: 3 orders, 275.00 total", ordered by total descending. Customers with ' +
            'no orders must not appear.',
          starterCode:
            `${PD}orders = pd.DataFrame({\n` +
            '    "customer_id": [1, 1, 1, 2, 3],\n' +
            '    "total": [100.00, 75.00, 100.00, 40.00, 500.00],\n' +
            '})\n' +
            'customers = pd.DataFrame({\n' +
            '    "customer_id": [1, 2, 3, 4],\n' +
            '    "name": ["Alice", "Bob", "Carlos", "Dana"],\n' +
            '})\n\n' +
            '# Merge, group per customer, print highest total first.\n',
          tests: [
            '_lines = [l for l in _stdout.strip().splitlines() if l.strip()]',
            'assert len(_lines) == 3, f"Dana has no orders so should be absent; expected 3 lines, got {_lines!r}"',
            'assert _lines[0].startswith("Carlos"), f"Carlos has the highest total (500); got {_lines[0]!r}"',
            'assert "500.00" in _lines[0], f"expected Carlos 500.00; got {_lines[0]!r}"',
            'assert _lines[1].startswith("Alice"), f"Alice is second with 275; got {_lines[1]!r}"',
            'assert "3 orders" in _lines[1], f"Alice placed 3 orders; got {_lines[1]!r}"',
            'assert "275.00" in _lines[1], f"expected Alice 275.00; got {_lines[1]!r}"',
            'assert _lines[2].startswith("Bob"), f"expected Bob third; got {_lines[2]!r}"',
            'assert "Dana" not in _stdout, "an inner merge drops customers with no orders — Dana must not appear"',
          ],
          solutionHint:
            'orders.merge(customers, on="customer_id") defaults to an inner join. Then ' +
            'groupby("name")["total"].agg(["count", "sum"]) and sort by the sum descending.',
          explanation:
            'merge defaults to how="inner", so only customer_ids present in BOTH frames survive — Dana ' +
            'has no orders and disappears. how="right" would have kept her with NaN totals.',
          trapNote:
            'groupby sorts by the group key by default. You have to sort by the aggregate explicitly ' +
            'to get "highest total first".',
        },
      ],
    },
    {
      id: 'l18-c4',
      title: 'Grouping and time data',
      objective: 'Collapse rows into per-group answers, including per-period ones.',
      miniNote:
        'groupby splits, applies, and combines. Dates only behave like dates after to_datetime.',
      examples: [
        {
          id: 'l18-c4-e1',
          type: 'multipleChoice',
          stage: 'debug',
          tags: ['typeCoercion'],
          prompt:
            'A CSV column "order_date" holds values like "2026-03-14". After pd.read_csv, you sort by ' +
            'it and the order looks right — but df["order_date"].dt.month raises AttributeError. Why?',
          options: [
            'The column is still text; .dt only exists on datetime columns',
            'read_csv corrupted the dates',
            '.dt requires the column to be the index',
            'You must call .sort_values() before .dt works',
          ],
          answerIndex: 0,
          explanation:
            'read_csv leaves dates as strings unless told otherwise. ISO-formatted text happens to sort ' +
            'correctly alphabetically, which hides the problem until you ask for something date-aware. ' +
            'Fix it with pd.to_datetime(df["order_date"]) or parse_dates=["order_date"] at read time.',
          trapNote:
            'The sort looking right is exactly what makes this bug slow to find. It only works because ' +
            'YYYY-MM-DD sorts the same as text and as dates — a format like "3/14/2026" would not.',
        },
        {
          id: 'l18-c4-e2',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['typeCoercion', 'dataFrameIndexing'],
          requires: ['pandas', 'numpy'],
          prompt:
            'The order_date column is text. Convert it to real dates, then print total sales per month ' +
            'as "2026-01: 300.00", oldest month first.',
          starterCode:
            `${PD}df = pd.DataFrame({\n` +
            '    "order_date": ["2026-01-05", "2026-02-11", "2026-01-22", "2026-03-02", "2026-02-28"],\n' +
            '    "total": [100.00, 250.00, 200.00, 75.00, 50.00],\n' +
            '})\n\n' +
            '# Convert order_date to datetime, then total sales per month, oldest first.\n',
          tests: [
            '_lines = [l for l in _stdout.strip().splitlines() if l.strip()]',
            'assert len(_lines) == 3, f"expected one line per month (3 months); got {_lines!r}"',
            'assert _lines[0].startswith("2026-01"), f"January should print first; got {_lines[0]!r}"',
            'assert "300.00" in _lines[0], f"January total is 100 + 200 = 300.00; got {_lines[0]!r}"',
            'assert _lines[1].startswith("2026-02"), f"expected February second; got {_lines[1]!r}"',
            'assert "300.00" in _lines[1], f"February total is 250 + 50 = 300.00; got {_lines[1]!r}"',
            'assert _lines[2].startswith("2026-03"), f"expected March last; got {_lines[2]!r}"',
            'assert "75.00" in _lines[2], f"March total is 75.00; got {_lines[2]!r}"',
            'assert str(df["order_date"].dtype).startswith("datetime"), f"order_date must be converted to datetime, got {df[\'order_date\'].dtype}"',
          ],
          solutionHint:
            'pd.to_datetime, then group by df["order_date"].dt.to_period("M") and sum the totals. ' +
            'Sorting by the period key gives oldest first.',
          explanation:
            'Once the column is real datetimes, .dt unlocks the calendar: to_period("M") buckets each ' +
            'row into its month, and groupby sums within each bucket. January and February both total ' +
            '300.00 from different numbers of orders.',
          trapNote:
            'Grouping on the raw date string would give five groups — one per distinct day — instead ' +
            'of three months.',
        },
      ],
    },
  ],
  lessonCheck: [
    {
      id: 'l18-check-1',
      type: 'multipleChoice',
      stage: 'try',
      tags: ['vectorization'],
      prompt: 'a has 12 elements. Which call reshapes it into 4 rows without you computing the width?',
      options: ['a.reshape(4)', 'a.reshape(4, -1)', 'a.reshape(-1, 4)', 'a.reshape(4, None)'],
      answerIndex: 1,
      explanation:
        '-1 means "work this dimension out from the others". reshape(4, -1) fixes 4 rows and infers 3 ' +
        'columns. reshape(-1, 4) is the mirror image: 4 columns, 3 rows inferred.',
    },
    {
      id: 'l18-check-2',
      type: 'multipleChoice',
      stage: 'try',
      tags: ['dataFrameIndexing'],
      prompt: 'Which pandas operation is the direct equivalent of a SQL INNER JOIN?',
      options: [
        'pd.concat',
        'df.groupby',
        'df.merge(other, on="key")',
        'df.pivot',
      ],
      answerIndex: 2,
      explanation:
        'merge matches rows between two frames on a shared key, defaulting to an inner join — rows ' +
        'without a match on both sides are dropped. concat stacks frames; groupby aggregates within ' +
        'one; pivot reshapes it.',
    },
  ],
};
