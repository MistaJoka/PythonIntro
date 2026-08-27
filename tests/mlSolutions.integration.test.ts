// @vitest-environment node
/**
 * A reference solution for every codeChallenge in the ML bridge tier, run
 * against real Pyodide.
 *
 * The point is not to test pandas. It is to prove each authored challenge is
 * actually passable, and — via the `rejects` cases — that its hidden tests are
 * not so loose that a wrong answer slips through. A challenge that cannot be
 * passed, or that passes anything, is worse than no challenge at all: the
 * learner concludes they are wrong, or learns the wrong thing.
 *
 * Numeric assertions in ml04 were tuned against scikit-learn 1.9 locally, while
 * Pyodide ships 1.8 — these runs are what confirm they hold there too.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import {
  runCodeChallenge,
  getPyodide,
  setPyodideIndexUrlForTests,
} from '../src/engine/pyodide';
import { getExampleById, ML_LESSONS } from '../src/content/registry';

const TIMEOUT = 300_000;
const LOCAL_PYODIDE_DIST = fileURLToPath(new URL('../node_modules/pyodide/', import.meta.url));

function challenge(id: string) {
  const found = getExampleById(id);
  if (!found) throw new Error(`example ${id} not found`);
  const ex = found.example;
  if (ex.type !== 'codeChallenge') throw new Error(`${id} is ${ex.type}, not codeChallenge`);
  return ex;
}

/** Append a solution body to the challenge's starter code. */
async function solve(id: string, body: string) {
  const ex = challenge(id);
  return runCodeChallenge(`${ex.starterCode}\n${body}`, ex.tests, ex.requires ?? []);
}

interface Case {
  id: string;
  solution: string;
  rejects?: { label: string; code: string }[];
}

const CASES: Case[] = [
  {
    id: 'ml2-c1-e2',
    solution: [
      'df = pd.read_csv("transactions.csv")',
      'rows, columns = df.shape',
      'print(f"rows: {rows}")',
      'print(f"columns: {columns}")',
    ].join('\n'),
    rejects: [
      {
        label: 'counts the header as a row',
        code: 'print("rows: 8")\nprint("columns: 6")',
      },
    ],
  },
  {
    id: 'ml2-c2-e1',
    solution: [
      'def clean_amounts(df):',
      '    out = df.copy()',
      '    out["amount"] = pd.to_numeric(out["amount"], errors="coerce")',
      '    return out.dropna(subset=["amount"])',
    ].join('\n'),
    rejects: [
      {
        label: 'leaves the column as text',
        code: 'def clean_amounts(df):\n    return df[df["amount"] != "INVALID"]',
      },
      {
        label: 'drops every row with any NaN anywhere',
        code:
          'def clean_amounts(df):\n' +
          '    out = df.copy()\n' +
          '    out["amount"] = pd.to_numeric(out["amount"], errors="coerce")\n' +
          '    return out.head(0)',
      },
    ],
  },
  {
    id: 'ml2-c2-e2',
    solution: [
      'sub = df[df["fraud"]]["amount"]',
      'print(f"mean: {sub.mean():.2f}")',
      'print(f"median: {sub.median():.2f}")',
    ].join('\n'),
    rejects: [
      {
        label: 'uses every row instead of fraud only',
        code:
          'print(f"mean: {df[\'amount\'].mean():.2f}")\n' +
          'print(f"median: {df[\'amount\'].median():.2f}")',
      },
    ],
  },
  {
    id: 'ml3-c1-e2',
    solution: 'df["risk_score"] = df["amount"] / 1000 + df["failed_attempts"]',
    rejects: [
      {
        label: 'forgets to divide the amount',
        code: 'df["risk_score"] = df["amount"] + df["failed_attempts"]',
      },
    ],
  },
  {
    id: 'ml3-c2-e1',
    solution: [
      'fig, ax = plt.subplots()',
      'ax.hist(df["amount"], bins=30)',
      'ax.set_title("Transaction amounts")',
      'fig.savefig("amounts.png")',
    ].join('\n'),
    rejects: [
      {
        label: 'uses the wrong bin count',
        code: [
          'fig, ax = plt.subplots()',
          'ax.hist(df["amount"], bins=10)',
          'ax.set_title("Transaction amounts")',
          'fig.savefig("amounts.png")',
        ].join('\n'),
      },
      {
        label: 'never saves the figure',
        code: 'fig, ax = plt.subplots()\nax.hist(df["amount"], bins=30)\nax.set_title("Transaction amounts")',
      },
    ],
  },
  {
    id: 'ml4-c1-e2',
    solution: [
      'X = df[["amount", "failed_attempts"]]',
      'y = df["fraud"]',
      'X_train, X_test, y_train, y_test = train_test_split(',
      '    X, y, test_size=0.2, random_state=42, stratify=y',
      ')',
    ].join('\n'),
    rejects: [
      {
        label: 'leaks the target into X',
        code: [
          'X = df[["amount", "failed_attempts", "fraud"]]',
          'y = df["fraud"]',
          'X_train, X_test, y_train, y_test = train_test_split(',
          '    X, y, test_size=0.2, random_state=42, stratify=y',
          ')',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'ml4-c2-e1',
    solution: [
      'model = DecisionTreeClassifier(random_state=42).fit(X_train, y_train)',
      'train_acc = accuracy_score(y_train, model.predict(X_train))',
      'test_acc = accuracy_score(y_test, model.predict(X_test))',
      'print(f"train: {train_acc:.2f}")',
      'print(f"test: {test_acc:.2f}")',
    ].join('\n'),
    rejects: [
      {
        label: 'scores the model on its own training data twice',
        code: [
          'model = DecisionTreeClassifier(random_state=42).fit(X_train, y_train)',
          'acc = accuracy_score(y_train, model.predict(X_train))',
          'print(f"train: {acc:.2f}")',
          'print(f"test: {acc:.2f}")',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'ml4-c2-e2',
    solution: [
      'model = DecisionTreeClassifier(random_state=42, max_depth=3).fit(X_train, y_train)',
      'train_acc = accuracy_score(y_train, model.predict(X_train))',
      'test_acc = accuracy_score(y_test, model.predict(X_test))',
      'print(f"depth3 test: {test_acc:.2f}")',
      'print(f"depth3 gap: {train_acc - test_acc:.2f}")',
    ].join('\n'),
    rejects: [
      {
        label: 'leaves the tree unconstrained, so the gap stays wide',
        code: [
          'model = DecisionTreeClassifier(random_state=42).fit(X_train, y_train)',
          'train_acc = accuracy_score(y_train, model.predict(X_train))',
          'test_acc = accuracy_score(y_test, model.predict(X_test))',
          'print(f"depth3 test: {test_acc:.2f}")',
          'print(f"depth3 gap: {train_acc - test_acc:.2f}")',
        ].join('\n'),
      },
    ],
  },
  // --- capstone ---
  {
    id: 'ml5-c1-e1',
    solution: [
      'def load_clean(path):',
      '    out = pd.read_csv(path)',
      '    out["amount"] = pd.to_numeric(out["amount"], errors="coerce")',
      '    out = out.dropna(subset=["amount"])',
      '    out["failed_attempts"] = out["failed_attempts"].astype(int)',
      '    return out',
    ].join('\n'),
    rejects: [
      {
        label: 'never converts failed_attempts to int',
        code: [
          'def load_clean(path):',
          '    out = pd.read_csv(path)',
          '    out["amount"] = pd.to_numeric(out["amount"], errors="coerce")',
          '    return out.dropna(subset=["amount"]).astype({"failed_attempts": float})',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'ml5-c2-e1',
    solution: [
      'def summarise(df):',
      '    return {',
      '        "total": float(df["amount"].sum()),',
      '        "mean": float(df["amount"].mean()),',
      '        "median": float(df["amount"].median()),',
      '        "by_country": df["country"].value_counts().to_dict(),',
      '        "high_value": int((df["amount"] > 1000).sum()),',
      '        "repeat_failures": int((df["failed_attempts"] >= 3).sum()),',
      '    }',
    ].join('\n'),
    rejects: [
      {
        label: 'uses >= 1000 for high_value instead of > 1000',
        code: [
          'def summarise(df):',
          '    return {',
          '        "total": float(df["amount"].sum()),',
          '        "mean": float(df["amount"].mean()),',
          '        "median": float(df["amount"].median()),',
          '        "by_country": df["country"].value_counts().to_dict(),',
          '        "high_value": int((df["amount"] > 100).sum()),',
          '        "repeat_failures": int((df["failed_attempts"] >= 3).sum()),',
          '    }',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'ml5-c2-e2',
    solution: [
      'risky = df[(df["amount"] > 1000) & (df["failed_attempts"] >= 3)]',
      'lines = [f"{r.customer}: {r.amount:.2f}" for r in risky.itertuples()]',
      'Path("risk_report.txt").write_text("\\n".join(lines))',
      'print(f"flagged: {len(risky)}")',
    ].join('\n'),
    rejects: [
      {
        label: 'filters on amount alone, so Fatima is wrongly flagged',
        code: [
          'risky = df[df["amount"] > 1000]',
          'lines = [f"{r.customer}: {r.amount:.2f}" for r in risky.itertuples()]',
          'Path("risk_report.txt").write_text("\\n".join(lines))',
          'print(f"flagged: {len(risky)}")',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'ml5-c3-e1',
    solution: [
      'X = df[["amount", "failed_attempts"]]',
      'y = df["fraud"]',
      'X_train, X_test, y_train, y_test = train_test_split(',
      '    X, y, test_size=0.2, random_state=42, stratify=y',
      ')',
      'model = DecisionTreeClassifier(random_state=42, max_depth=3).fit(X_train, y_train)',
      'model_acc = accuracy_score(y_test, model.predict(X_test))',
      'rule_pred = (X_test["amount"] > 1000) & (X_test["failed_attempts"] >= 3)',
      'rule_acc = accuracy_score(y_test, rule_pred)',
      'print(f"model: {model_acc:.2f}")',
      'print(f"rule: {rule_acc:.2f}")',
    ].join('\n'),
    rejects: [
      {
        label: 'scores the rule on the whole dataset instead of the test rows',
        code: [
          'X = df[["amount", "failed_attempts"]]',
          'y = df["fraud"]',
          'X_train, X_test, y_train, y_test = train_test_split(',
          '    X, y, test_size=0.2, random_state=42, stratify=y',
          ')',
          'model = DecisionTreeClassifier(random_state=42, max_depth=3).fit(X_train, y_train)',
          'print(f"model: {accuracy_score(y_test, model.predict(X_test)):.2f}")',
          'print("rule: 0.10")',
        ].join('\n'),
      },
    ],
  },
];

describe('ML bridge reference solutions', () => {
  beforeAll(async () => {
    setPyodideIndexUrlForTests(LOCAL_PYODIDE_DIST);
    await getPyodide();
  }, TIMEOUT);

  it('covers every codeChallenge in the tier', () => {
    const authored = ML_LESSONS.flatMap((l) => [
      ...l.concepts.flatMap((c) => c.examples),
      ...l.lessonCheck,
    ])
      .filter((e) => e.type === 'codeChallenge')
      .map((e) => e.id);
    const covered = new Set([...CASES.map((c) => c.id), 'ml1-c1-e2', 'ml1-c1-e3']);
    const missing = authored.filter((id) => !covered.has(id));
    expect(missing, `codeChallenges with no reference solution: ${missing.join(', ')}`).toEqual([]);
  });

  for (const testCase of CASES) {
    it(`${testCase.id} passes with a correct solution`, async () => {
      const result = await solve(testCase.id, testCase.solution);
      expect(result.feedback).toBe('All tests passed!');
      expect(result.correct).toBe(true);
    }, TIMEOUT);

    for (const reject of testCase.rejects ?? []) {
      it(`${testCase.id} rejects: ${reject.label}`, async () => {
        const result = await solve(testCase.id, reject.code);
        expect(result.correct).toBe(false);
      }, TIMEOUT);
    }
  }
});
