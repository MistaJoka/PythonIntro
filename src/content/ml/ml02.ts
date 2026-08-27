import type { Lesson } from '../schema';
import { WRITE_SAMPLE_CSV, GENERATE_DF } from './data';

/**
 * ML Bridge — Session 3/4 join: getting real data in, and surviving what is
 * wrong with it. Every dataset the course touches later arrives this way.
 */

const CSV_STARTER = `${WRITE_SAMPLE_CSV}\n\nimport pandas as pd\n\n`;

export const ml02: Lesson = {
  id: 'ml02',
  title: 'Reading Real Data',
  subtitle: 'CSV in, dirty rows handled, first honest statistics',
  objectives: [
    'Load a CSV into a DataFrame and inspect it before trusting it',
    'Explain why every CSV value arrives as text',
    'Coerce a bad value without discarding the whole file',
    'Read describe() as a distribution rather than a wall of numbers',
  ],
  concepts: [
    {
      id: 'ml2-c1',
      title: 'Loading and looking',
      objective: 'Get the file in, then find out what you actually got.',
      miniNote:
        'df.info() before df.describe(): dtypes tell you whether the numbers are numbers yet.',
      examples: [
        {
          id: 'ml2-c1-e1',
          type: 'multipleChoice',
          stage: 'see',
          tags: ['jsonCsv', 'typeCoercion'],
          prompt:
            'A CSV holds `amount` values like 45.50 and 1800.00. You read it with a plain ' +
            'csv.DictReader and try row["amount"] * 2. What happens?',
          options: [
            'You get 91.0 — Python converts numeric-looking text automatically',
            'You get "45.5045.50" — the value is a string, and * repeats strings',
            'A TypeError, because strings cannot be multiplied at all',
            'A ValueError, because the CSV is malformed',
          ],
          answerIndex: 1,
          explanation:
            'A CSV is plain text; nothing in the format records a type. csv.DictReader hands you ' +
            'strings, and "45.50" * 2 is string repetition. You must convert explicitly. ' +
            'pd.read_csv is different — it infers dtypes per column, which is a large part of why ' +
            'it is worth using.',
          trapNote:
            'This is the single most common surprise moving from csv to pandas: read_csv converts ' +
            'for you, the csv module does not.',
        },
        {
          id: 'ml2-c1-e2',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['jsonCsv', 'fileMode'],
          requires: ['pandas'],
          prompt:
            'transactions.csv has been written for you. Load it with pandas and print two lines ' +
            'exactly: "rows: N" then "columns: M".',
          starterCode: `${CSV_STARTER}# Load transactions.csv and print its shape.\n`,
          tests: [
            'assert "rows: 7" in _stdout, f"expected 7 data rows (the header is not a row); got: {_stdout!r}"',
            'assert "columns: 6" in _stdout, f"expected 6 columns; got: {_stdout!r}"',
          ],
          solutionHint:
            'pd.read_csv returns a DataFrame; its .shape is a (rows, columns) tuple you can unpack.',
          explanation:
            'read_csv treats the first line as the header, so 8 lines of text become 7 rows and ' +
            '6 columns. Checking shape first is the cheapest way to catch a misparsed file.',
        },
        {
          id: 'ml2-c1-e3',
          type: 'multipleChoice',
          stage: 'try',
          tags: ['typeCoercion', 'jsonCsv'],
          requires: ['pandas'],
          prompt:
            'That file contains a row where amount is the text INVALID. After ' +
            'pd.read_csv("transactions.csv"), what is df["amount"].dtype?',
          options: [
            'float64 — pandas drops the bad value and converts the rest',
            'float64 — pandas stores the bad value as NaN automatically',
            'str — one unparseable value forces the whole column to stay text',
            'It raises a ValueError while reading',
          ],
          answerIndex: 2,
          explanation:
            'A column has ONE dtype. pandas will not silently discard data, so a single ' +
            'unconvertible value keeps the entire column as text. This is why an arithmetic ' +
            'operation can fail on a column that looks numeric in df.head(). On pandas 3 that ' +
            'dtype prints as str; older versions print object for the same situation, so you will ' +
            'meet both names in the wild.',
          trapNote:
            'df.head() prints 45.50 and INVALID side by side without complaint. Only .dtypes or ' +
            '.info() reveals that none of those numbers are numbers.',
        },
      ],
    },
    {
      id: 'ml2-c2',
      title: 'Cleaning without deleting',
      objective: 'Coerce what you can, mark what you cannot, keep the rest.',
      miniNote:
        'errors="coerce" turns unparseable values into NaN instead of raising — you decide what happens next.',
      examples: [
        {
          id: 'ml2-c2-e1',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['typeCoercion', 'exceptionType'],
          requires: ['pandas'],
          prompt:
            'Write clean_amounts(df) that returns the DataFrame with amount as a real numeric ' +
            'column, and rows whose amount could not be parsed removed. Do not drop any other row.',
          starterCode:
            `${CSV_STARTER}df = pd.read_csv("transactions.csv")\n\n\n` +
            'def clean_amounts(df):\n' +
            '    # Coerce amount to numeric, then drop only the rows that failed.\n' +
            '    pass\n',
          tests: [
            'out = clean_amounts(df)',
            'assert out is not None, "clean_amounts returned None — did you use return?"',
            'assert len(out) == 6, f"expected 6 surviving rows (only Frank is unparseable), got {len(out)}"',
            'assert str(out["amount"].dtype).startswith("float"), f"amount should be numeric, got {out[\'amount\'].dtype}"',
            'assert abs(out["amount"].sum() - 8454.74) < 0.01, f"unexpected total: {out[\'amount\'].sum()}"',
            'assert "Frank" not in list(out["customer"]), "the unparseable row should be gone"',
            'assert "Alice" in list(out["customer"]), "valid rows must be kept"',
          ],
          solutionHint:
            'pd.to_numeric(..., errors="coerce") produces NaN where conversion fails; assign it ' +
            'back, then drop rows with a missing amount.',
          explanation:
            'Coerce-then-drop keeps the decision explicit and local: six good rows survive, and the ' +
            'one genuinely unusable row is removed on purpose rather than by a silent exception.',
          trapNote:
            'df.dropna() with no argument drops a row if ANY column is missing. Here that happens ' +
            'to give the same answer, but on a wider table it would quietly delete good data — ' +
            'target the column with subset=.',
        },
        {
          id: 'ml2-c2-e2',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['dataFrameIndexing'],
          requires: ['pandas', 'numpy'],
          prompt:
            'A 400-row dataset is generated for you as df. Print the mean and median amount for ' +
            'fraudulent transactions only, as "mean: 1234.56" and "median: 1234.56" ' +
            '(two decimal places).',
          starterCode: `${GENERATE_DF}\n\n# Fraudulent rows only: print mean and median amount.\n`,
          tests: [
            'import re',
            '_m = re.search(r"mean:\\s*([0-9.]+)", _stdout)',
            'assert _m, f"expected a line like \'mean: 1234.56\'; got: {_stdout!r}"',
            '_med = re.search(r"median:\\s*([0-9.]+)", _stdout)',
            'assert _med, f"expected a line like \'median: 1234.56\'; got: {_stdout!r}"',
            '_want = df[df["fraud"]]["amount"]',
            'assert abs(float(_m.group(1)) - _want.mean()) < 0.02, f"mean should be {_want.mean():.2f}"',
            'assert abs(float(_med.group(1)) - _want.median()) < 0.02, f"median should be {_want.median():.2f}"',
          ],
          solutionHint:
            'Filter with a boolean mask first, then call .mean() and .median() on the amount column. ' +
            'Format with an f-string like f"mean: {value:.2f}".',
          explanation:
            'Mean and median disagree here because the fraud amounts are skewed — a handful of very ' +
            'large transactions drag the mean above the median. That gap is the first thing worth ' +
            'noticing about any money column.',
          trapNote:
            'df["fraud"] is already a boolean column, so df[df["fraud"]] is enough — no == True needed.',
        },
      ],
    },
  ],
  lessonCheck: [
    {
      id: 'ml2-check-1',
      type: 'multipleChoice',
      stage: 'try',
      tags: ['typeCoercion'],
      prompt: 'What does pd.to_numeric(col, errors="coerce") do with a value it cannot parse?',
      options: [
        'Replaces it with NaN and continues',
        'Raises a ValueError immediately',
        'Leaves the original text in place',
        'Drops the row containing it',
      ],
      answerIndex: 0,
      explanation:
        '"coerce" converts failures to NaN, which turns a crash into a missing value you can then ' +
        'count, fill, or drop deliberately. The default, errors="raise", stops on the first bad value.',
    },
  ],
};
