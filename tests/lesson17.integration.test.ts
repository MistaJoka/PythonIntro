// @vitest-environment node
/**
 * Proves every lesson17 (Databases & SQL) challenge is solvable against real
 * SQLite running inside Pyodide, and that its hidden tests actually reject
 * wrong answers.
 *
 * sqlite3 is stdlib and ships in Pyodide, so nothing is declared in `requires`
 * — these run against a genuine database engine rather than a stand-in.
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
  if (ex.type !== 'codeChallenge') throw new Error(`${id} is ${ex.type}, not codeChallenge`);
  return ex;
}

async function solve(id: string, body: string) {
  const ex = challenge(id);
  return runCodeChallenge(`${ex.starterCode}\n${body}`, ex.tests, ex.requires ?? []);
}

interface Case {
  id: string;
  solution: string;
  rejects: { label: string; code: string }[];
}

const CASES: Case[] = [
  {
    id: 'l17-c1-e3',
    solution: [
      'cur.execute("INSERT INTO customers (name, city, balance) VALUES (?, ?, ?)",',
      '            ("Fatima", "Naples", 640.00))',
      'con.commit()',
      'print(f"count: {cur.execute(\'SELECT COUNT(*) FROM customers\').fetchone()[0]}")',
    ].join('\n'),
    rejects: [
      {
        label: 'prints the count without inserting',
        code: 'print("count: 6")',
      },
      {
        label: 'inserts with the wrong city',
        code: [
          'cur.execute("INSERT INTO customers (name, city, balance) VALUES (?, ?, ?)",',
          '            ("Fatima", "Miami", 640.00))',
          'print("count: 6")',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'l17-c2-e2',
    solution: [
      'rows = cur.execute(',
      '    "SELECT name, balance FROM customers WHERE city = ? AND balance > ? ORDER BY balance DESC",',
      '    ("Miami", 100),',
      ').fetchall()',
      'for name, bal in rows:',
      '    print(f"{name}: {bal:.2f}")',
    ].join('\n'),
    rejects: [
      {
        label: 'omits the balance filter, so Eli leaks in',
        code: [
          'for name, bal in cur.execute(',
          '    "SELECT name, balance FROM customers WHERE city = ? ORDER BY balance DESC", ("Miami",)',
          '):',
          '    print(f"{name}: {bal:.2f}")',
        ].join('\n'),
      },
      {
        label: 'sorts ascending instead of descending',
        code: [
          'for name, bal in cur.execute(',
          '    "SELECT name, balance FROM customers WHERE city = ? AND balance > ? ORDER BY balance ASC",',
          '    ("Miami", 100),',
          '):',
          '    print(f"{name}: {bal:.2f}")',
        ].join('\n'),
      },
      {
        label: 'forgets the city filter, so Bob and Dana leak in',
        code: [
          'for name, bal in cur.execute(',
          '    "SELECT name, balance FROM customers WHERE balance > ? ORDER BY balance DESC", (100,)',
          '):',
          '    print(f"{name}: {bal:.2f}")',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'l17-c3-e2',
    solution: [
      'cur.execute("UPDATE customers SET balance = balance + ? WHERE city = ?", (10.0, "Miami"))',
      'print(f"updated: {cur.rowcount}")',
      'cur.execute("DELETE FROM customers WHERE balance < ?", (100,))',
      'print(f"deleted: {cur.rowcount}")',
      'con.commit()',
    ].join('\n'),
    rejects: [
      {
        label: 'UPDATE with no WHERE — credits every customer',
        code: [
          'cur.execute("UPDATE customers SET balance = balance + ?", (10.0,))',
          'print(f"updated: {cur.rowcount}")',
          'cur.execute("DELETE FROM customers WHERE balance < ?", (100,))',
          'print(f"deleted: {cur.rowcount}")',
        ].join('\n'),
      },
      {
        label: 'deletes before crediting, so Eli is wrongly removed early',
        code: [
          'cur.execute("DELETE FROM customers WHERE balance < ?", (100,))',
          'print(f"deleted: {cur.rowcount}")',
          'cur.execute("UPDATE customers SET balance = balance + ? WHERE city = ?", (10.0, "Miami"))',
          'print(f"updated: {cur.rowcount}")',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'l17-chal-1',
    solution: [
      'def transfer(con, src, dst, amount):',
      '    bal = con.execute("SELECT balance FROM customers WHERE name = ?", (src,)).fetchone()[0]',
      '    if bal < amount:',
      '        raise ValueError(f"{src} has {bal}, needs {amount}")',
      '    con.execute("UPDATE customers SET balance = balance - ? WHERE name = ?", (amount, src))',
      '    con.execute("UPDATE customers SET balance = balance + ? WHERE name = ?", (amount, dst))',
      '    con.commit()',
    ].join('\n'),
    rejects: [
      {
        label: 'debits before checking, leaving money destroyed on failure',
        code: [
          'def transfer(con, src, dst, amount):',
          '    con.execute("UPDATE customers SET balance = balance - ? WHERE name = ?", (amount, src))',
          '    bal = con.execute("SELECT balance FROM customers WHERE name = ?", (src,)).fetchone()[0]',
          '    if bal < 0:',
          '        raise ValueError("insufficient funds")',
          '    con.execute("UPDATE customers SET balance = balance + ? WHERE name = ?", (amount, dst))',
          '    con.commit()',
        ].join('\n'),
      },
      {
        label: 'never raises on overdraft',
        code: [
          'def transfer(con, src, dst, amount):',
          '    con.execute("UPDATE customers SET balance = balance - ? WHERE name = ?", (amount, src))',
          '    con.execute("UPDATE customers SET balance = balance + ? WHERE name = ?", (amount, dst))',
          '    con.commit()',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'l17-chal-2',
    solution: [
      'rows = cur.execute("""',
      '    SELECT ci.name, COUNT(*), SUM(cu.balance)',
      '    FROM customers cu JOIN cities ci ON ci.id = cu.city_id',
      '    GROUP BY ci.name',
      '    ORDER BY SUM(cu.balance) DESC',
      '""").fetchall()',
      'for city, n, total in rows:',
      '    print(f"{city}: {n} customers, {total:.2f} total")',
    ].join('\n'),
    rejects: [
      {
        label: 'LEFT JOIN includes Naples, which has no customers',
        code: [
          'rows = cur.execute("""',
          '    SELECT ci.name, COUNT(cu.name), COALESCE(SUM(cu.balance), 0)',
          '    FROM cities ci LEFT JOIN customers cu ON ci.id = cu.city_id',
          '    GROUP BY ci.name',
          '    ORDER BY COALESCE(SUM(cu.balance), 0) DESC',
          '""").fetchall()',
          'for city, n, total in rows:',
          '    print(f"{city}: {n} customers, {total:.2f} total")',
        ].join('\n'),
      },
      {
        label: 'orders ascending, putting Miami first',
        code: [
          'rows = cur.execute("""',
          '    SELECT ci.name, COUNT(*), SUM(cu.balance)',
          '    FROM customers cu JOIN cities ci ON ci.id = cu.city_id',
          '    GROUP BY ci.name ORDER BY SUM(cu.balance) ASC',
          '""").fetchall()',
          'for city, n, total in rows:',
          '    print(f"{city}: {n} customers, {total:.2f} total")',
        ].join('\n'),
      },
    ],
  },
];

describe('lesson17 — Databases & SQL, against real sqlite3', () => {
  beforeAll(async () => {
    setPyodideIndexUrlForTests(LOCAL_PYODIDE_DIST);
    await getPyodide();
  }, TIMEOUT);

  it('sqlite3 is available in the runtime', async () => {
    const r = await runCodeChallenge(
      'import sqlite3\nprint(sqlite3.sqlite_version)',
      ['assert _stdout.strip().startswith("3."), f"unexpected sqlite version: {_stdout!r}"'],
    );
    expect(r.correct).toBe(true);
  }, TIMEOUT);

  it('covers every codeChallenge in the lesson', () => {
    const found = getExampleById('l17-c1-e3');
    expect(found).toBeDefined();
    const covered = new Set(CASES.map((c) => c.id));
    for (const id of ['l17-c1-e3', 'l17-c2-e2', 'l17-c3-e2', 'l17-chal-1', 'l17-chal-2']) {
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
