// @vitest-environment node
/**
 * Reference solutions for lesson18 (Python Libraries: NumPy & pandas), run
 * against real numpy/pandas in Pyodide.
 *
 * Several of these challenges assert hardcoded numbers I computed by hand
 * (row sums, per-month totals, the 2x2 merge fan-out). These runs are what
 * confirm the arithmetic, and the rejection cases confirm the hidden tests are
 * tight enough to catch a plausible wrong approach.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { runCodeChallenge, getPyodide, setPyodideIndexUrlForTests } from '../src/engine/pyodide';
import { getExampleById } from '../src/content/registry';

const TIMEOUT = 300_000;
const LOCAL_PYODIDE_DIST = fileURLToPath(new URL('../node_modules/pyodide/', import.meta.url));

function challenge(id: string) {
  const found = getExampleById(id);
  if (!found) throw new Error(`example ${id} not found`);
  const ex = found.example;
  if (ex.type !== 'codeChallenge') throw new Error(`${id} is ${ex.type}`);
  return ex;
}

async function solve(id: string, body: string) {
  const ex = challenge(id);
  return runCodeChallenge(`${ex.starterCode}\n${body}`, ex.tests, ex.requires ?? []);
}

const CASES: { id: string; solution: string; rejects: { label: string; code: string }[] }[] = [
  {
    id: 'l18-c1-e2',
    solution: [
      'a = np.arange(1, 13).reshape(3, -1)',
      'print(f"shape: {a.shape}")',
      'print(f"row_sums: {a.sum(axis=1)}")',
      'print(f"flat_len: {len(a.flatten())}")',
    ].join('\n'),
    rejects: [
      {
        label: 'sums along the wrong axis (columns, not rows)',
        code: [
          'a = np.arange(1, 13).reshape(3, -1)',
          'print(f"shape: {a.shape}")',
          'print(f"row_sums: {a.sum(axis=0)}")',
          'print(f"flat_len: {len(a.flatten())}")',
        ].join('\n'),
      },
      {
        label: 'starts from 0 instead of 1',
        code: [
          'a = np.arange(12).reshape(3, -1)',
          'print(f"shape: {a.shape}")',
          'print(f"row_sums: {a.sum(axis=1)}")',
          'print(f"flat_len: {len(a.flatten())}")',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'l18-c3-e2',
    solution: [
      'j = orders.merge(customers, on="customer_id")',
      'g = j.groupby("name")["total"].agg(["count", "sum"]).sort_values("sum", ascending=False)',
      'for name, row in g.iterrows():',
      '    print(f"{name}: {int(row[\'count\'])} orders, {row[\'sum\']:.2f} total")',
    ].join('\n'),
    rejects: [
      {
        label: 'outer merge keeps Dana, who has no orders',
        code: [
          'j = orders.merge(customers, on="customer_id", how="right")',
          'g = j.groupby("name")["total"].agg(["count", "sum"]).sort_values("sum", ascending=False)',
          'for name, row in g.iterrows():',
          '    print(f"{name}: {int(row[\'count\'])} orders, {row[\'sum\']:.2f} total")',
        ].join('\n'),
      },
      {
        label: 'leaves groupby in default key order instead of sorting by total',
        code: [
          'j = orders.merge(customers, on="customer_id")',
          'g = j.groupby("name")["total"].agg(["count", "sum"])',
          'for name, row in g.iterrows():',
          '    print(f"{name}: {int(row[\'count\'])} orders, {row[\'sum\']:.2f} total")',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'l18-c4-e2',
    solution: [
      'df["order_date"] = pd.to_datetime(df["order_date"])',
      'g = df.groupby(df["order_date"].dt.to_period("M"))["total"].sum().sort_index()',
      'for period, total in g.items():',
      '    print(f"{period}: {total:.2f}")',
    ].join('\n'),
    rejects: [
      {
        label: 'groups on the raw string, giving one bucket per day',
        code: [
          'g = df.groupby("order_date")["total"].sum().sort_index()',
          'for k, total in g.items():',
          '    print(f"{k}: {total:.2f}")',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'l18-chal-1',
    solution: [
      'long = pd.melt(sales, id_vars="region", var_name="quarter", value_name="amount")',
      'best = long.loc[long["amount"].idxmax()]',
      'print(f"{best[\'region\']} {best[\'quarter\']}: {best[\'amount\']:.2f}")',
    ].join('\n'),
    rejects: [
      {
        label: 'prints every row instead of only the best',
        code: [
          'long = pd.melt(sales, id_vars="region", var_name="quarter", value_name="amount")',
          'for _, r in long.iterrows():',
          '    print(f"{r[\'region\']} {r[\'quarter\']}: {r[\'amount\']:.2f}")',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'l18-chal-2',
    solution: [
      'print(f"best_student: {scores.sum(axis=1).argmax()}")',
      'print(f"hardest_test: {scores.mean(axis=0).argmin()}")',
    ].join('\n'),
    rejects: [
      {
        label: 'swaps the two axes',
        code: [
          'print(f"best_student: {scores.sum(axis=0).argmax()}")',
          'print(f"hardest_test: {scores.mean(axis=1).argmin()}")',
        ].join('\n'),
      },
      {
        label: 'uses max/min instead of argmax/argmin, reporting values not positions',
        code: [
          'print(f"best_student: {scores.sum(axis=1).max()}")',
          'print(f"hardest_test: {scores.mean(axis=0).min()}")',
        ].join('\n'),
      },
    ],
  },
];

describe('lesson18 — NumPy & pandas, real runtime', () => {
  beforeAll(async () => {
    setPyodideIndexUrlForTests(LOCAL_PYODIDE_DIST);
    await getPyodide();
  }, TIMEOUT);

  it('covers every codeChallenge in the lesson', () => {
    const covered = new Set(CASES.map((c) => c.id));
    for (const id of ['l18-c1-e2', 'l18-c3-e2', 'l18-c4-e2', 'l18-chal-1', 'l18-chal-2']) {
      expect(covered.has(id), `${id} has no reference solution`).toBe(true);
    }
  });

  for (const testCase of CASES) {
    it(`${testCase.id} passes with a correct solution`, async () => {
      const result = await solve(testCase.id, testCase.solution);
      expect(result.feedback).toBe('All tests passed!');
      expect(result.correct).toBe(true);
    }, TIMEOUT);

    for (const reject of testCase.rejects) {
      it(`${testCase.id} rejects: ${reject.label}`, async () => {
        const result = await solve(testCase.id, reject.code);
        expect(result.correct).toBe(false);
      }, TIMEOUT);
    }
  }
});
