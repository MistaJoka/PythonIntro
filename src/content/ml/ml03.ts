import type { Lesson } from '../schema';
import { GENERATE_DF } from './data';

/**
 * ML Bridge — Session 4b: arrays and pictures. The two things a model needs
 * before it can exist: numeric features computed without loops, and enough of
 * a look at the data to know whether the features mean anything.
 */

const NP_STARTER = `${GENERATE_DF}\n\n`;

export const ml03: Lesson = {
  id: 'ml03',
  title: 'Arrays and Pictures',
  subtitle: 'Vectorised features, and looking before modelling',
  objectives: [
    'State what a NumPy array gives you that a Python list does not',
    'Replace an element-by-element loop with a vectorised expression',
    'Use axis= deliberately instead of guessing',
    'Produce a histogram and a scatter plot that answer a stated question',
  ],
  concepts: [
    {
      id: 'ml3-c1',
      title: 'Lists versus arrays',
      objective: 'Understand why ML code stops using plain lists.',
      miniNote:
        'An array has one dtype and a shape. That is exactly what makes whole-column arithmetic possible.',
      examples: [
        {
          id: 'ml3-c1-e1',
          type: 'multipleChoice',
          stage: 'see',
          tags: ['vectorization', 'typeCoercion'],
          prompt:
            'xs = [1, 2, 3] and arr = np.array([1, 2, 3]).\nWhat do xs * 2 and arr * 2 produce?',
          options: [
            '[1, 2, 3, 1, 2, 3] and array([2, 4, 6])',
            'array([2, 4, 6]) for both',
            '[2, 4, 6] and array([2, 4, 6])',
            '[1, 2, 3, 1, 2, 3] for both',
          ],
          answerIndex: 0,
          explanation:
            'For a list, * means repeat the sequence. For an array, * means multiply every element. ' +
            'Same operator, completely different meaning — this is the single biggest source of ' +
            'confusion when moving from lists to arrays.',
          trapNote:
            'The same split applies to +: lists concatenate, arrays add elementwise.',
        },
        {
          id: 'ml3-c1-e1b',
          type: 'traceSteps',
          stage: 'see',
          tags: ['vectorization', 'axisConfusion'],
          prompt:
            'Broadcasting is the rule that lets differently-shaped arrays combine. Step through it ' +
            'and watch the shapes line up.',
          code: [
            'import numpy as np',
            '',
            'row = np.array([1, 2, 3])',
            'col = np.array([[10], [20]])',
            'out = row + col',
          ].join('\n'),
          steps: [
            { line: 3, vars: { row: 'array([1, 2, 3])', 'row.shape': '(3,)' } },
            { line: 4, vars: { col: 'array([[10], [20]])', 'col.shape': '(2, 1)' } },
            {
              line: 5,
              vars: { 'row.shape': '(3,)  -> (1, 3)' },
              note: 'Shapes are compared right to left; row gains a leading 1.',
            },
            {
              line: 5,
              vars: { 'result.shape': '(2, 3)' },
              note: 'Each size-1 dimension stretches: rows to 2, columns to 3.',
            },
            {
              line: 5,
              vars: { out: 'array([[11, 12, 13],\n       [21, 22, 23]])' },
              note: 'row is added to each row of col — no loop was written.',
            },
          ],
          question: 'What shape does out have?',
          options: ['(2, 3)', '(3, 2)', '(3,)', 'It raises a shape mismatch error'],
          answerIndex: 0,
          explanation:
            'Broadcasting compares shapes from the right. (3,) becomes (1, 3), then every size-1 ' +
            'dimension stretches to match: (1, 3) and (2, 1) both become (2, 3). Nothing is copied ' +
            'in memory — NumPy simply reuses the values.',
          trapNote:
            'Two shapes are compatible only where each dimension matches or one of them is 1. ' +
            '(3,) with (2,) is neither, and raises.',
        },
        {
          id: 'ml3-c1-e2',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['vectorization'],
          requires: ['pandas', 'numpy'],
          prompt:
            'Add a risk_score column: amount divided by 1000, plus failed_attempts. ' +
            'Use one vectorised expression — no for loop, no .apply().',
          starterCode: `${NP_STARTER}# Add df["risk_score"] without looping.\n`,
          tests: [
            'assert "risk_score" in df.columns, "add a risk_score column to df"',
            '_expected = df["amount"] / 1000 + df["failed_attempts"]',
            'assert np.allclose(df["risk_score"], _expected), "risk_score formula does not match"',
            'assert len(df["risk_score"]) == 400, "every row needs a score"',
          ],
          solutionHint:
            'Columns support arithmetic directly: df["a"] / 1000 + df["b"] gives a whole new column.',
          explanation:
            'Column arithmetic runs the loop in C, below your Python code. It is faster, but the ' +
            'bigger win is that the expression states the formula instead of the machinery.',
          trapNote:
            'df.apply(..., axis=1) would also work and is a common first instinct — but it runs a ' +
            'Python function per row and is far slower for no gain here.',
        },
        {
          id: 'ml3-c1-e3',
          type: 'multipleChoice',
          stage: 'try',
          tags: ['axisConfusion'],
          prompt:
            'grid is a 2-D array with shape (3, 4) — 3 rows, 4 columns.\n' +
            'What does grid.sum(axis=0) return?',
          options: [
            '4 numbers — one column total per column',
            '3 numbers — one row total per row',
            'A single number — the grand total',
            'A (3, 4) array of running totals',
          ],
          answerIndex: 0,
          explanation:
            'axis names the dimension being collapsed, not the one you keep. axis=0 collapses the ' +
            'rows, leaving one value per column. Reading it as "which axis disappears" removes the ' +
            'guesswork for good.',
          trapNote:
            'Nearly everyone reads axis=0 as "give me rows". It gives you the result of eating the rows.',
        },
      ],
    },
    {
      id: 'ml3-c2',
      title: 'Looking before modelling',
      objective: 'Draw the plot that answers the question you actually asked.',
      miniNote:
        'Pick the plot from the question: one variable’s shape is a histogram; two variables’ relationship is a scatter.',
      examples: [
        {
          id: 'ml3-c2-e1',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['vectorization'],
          requires: ['pandas', 'numpy', 'matplotlib'],
          prompt:
            'Save a histogram of the amount column, 30 bins, titled "Transaction amounts", to ' +
            '"amounts.png". A non-interactive backend is already selected.',
          starterCode:
            'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot as plt\n' +
            'from pathlib import Path\n\n' +
            '# Clear any file left by a previous run, so the check below always\n' +
            '# reflects THIS run rather than an earlier success.\n' +
            'Path("amounts.png").unlink(missing_ok=True)\n\n' +
            `${NP_STARTER}# Build the histogram and save it to amounts.png\n`,
          tests: [
            'from pathlib import Path',
            'assert Path("amounts.png").exists(), "no amounts.png was written — did you call savefig?"',
            'assert Path("amounts.png").stat().st_size > 1000, "amounts.png looks empty"',
            '_fig = plt.gcf()',
            '_axes = _fig.get_axes() or [plt.gca()]',
            '_titles = [a.get_title() for a in _axes]',
            'assert any("Transaction amounts" in t for t in _titles), f"expected the title to be set; got {_titles}"',
            'assert any(len(a.patches) == 30 for a in _axes), "expected 30 histogram bins"',
          ],
          solutionHint:
            'fig, ax = plt.subplots(); ax.hist(..., bins=30); ax.set_title(...); fig.savefig("amounts.png").',
          explanation:
            'The shape matters more than the picture: amounts are heavily right-skewed, which is ' +
            'why the mean sat above the median earlier and why a handful of large transactions ' +
            'will dominate any model that uses raw amount.',
          trapNote:
            'plt.show() does nothing under the Agg backend. Saving to a file is how you inspect a ' +
            'plot in a headless environment.',
        },
        {
          id: 'ml3-c2-e2',
          type: 'multipleChoice',
          stage: 'try',
          tags: ['overfitting', 'vectorization'],
          prompt:
            'You scatter amount against failed_attempts, colouring fraud in red. The red points ' +
            'sit mostly upper-right but a clear handful sit among the blue. What does that tell ' +
            'you before you train anything?',
          options: [
            'The two features carry real signal, but cannot separate the classes perfectly',
            'The features are useless and should be replaced',
            'The data is mislabelled and needs cleaning',
            'A model will reach 100% accuracy on this data',
          ],
          answerIndex: 0,
          explanation:
            'Visible-but-imperfect separation is the normal case, and it sets your expectations: ' +
            'a good model here should beat chance clearly while falling well short of perfect. ' +
            'A model reporting 100% on data that looks like this is a bug, not a triumph.',
        },
      ],
    },
  ],
  lessonCheck: [
    {
      id: 'ml3-check-1',
      type: 'multipleChoice',
      stage: 'try',
      tags: ['viewVsCopy'],
      prompt:
        'arr = np.array([1, 2, 3, 4, 5]); part = arr[1:4]; part[0] = 99.\nWhat is arr now?',
      options: [
        '[1, 99, 3, 4, 5] — the slice is a view onto the same memory',
        '[1, 2, 3, 4, 5] — the slice is an independent copy',
        '[99, 2, 3, 4, 5] — the first element changes',
        'An error, because slices are read-only',
      ],
      answerIndex: 0,
      explanation:
        'Basic NumPy slicing returns a view sharing the original buffer, so writing through it ' +
        'mutates the source. Use .copy() when you need independence. (Note this differs from ' +
        'pandas 3, where a filtered DataFrame is already independent under copy-on-write.)',
    },
  ],
};
