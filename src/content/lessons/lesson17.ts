import type { Lesson } from '../schema';

/**
 * Lesson 17 — Databases & SQL with sqlite3.
 *
 * Added after the curriculum was found to be missing it: COP1047C teaches
 * databases, but this app was authored against an assumed intro-Python spine
 * that omitted them.
 *
 * sqlite3 is in the standard library and ships inside Pyodide (3.39.0), so
 * nothing needs declaring in `requires` — every challenge here runs against a
 * genuine database engine, not a simulation.
 *
 * Depth is deliberate. The four CRUD verbs are the refresher; parameter
 * binding, commit/rollback semantics, the missing-WHERE catastrophe, and
 * aggregate queries are the rabbit hole, reachable through the `debug` and
 * `stretch` stages without being mandatory.
 */

/** Every challenge starts from the same seeded in-memory database. */
const DB_STARTER = [
  'import sqlite3',
  '',
  'con = sqlite3.connect(":memory:")',
  'cur = con.cursor()',
  'cur.execute("""',
  '    CREATE TABLE customers (',
  '        id      INTEGER PRIMARY KEY,',
  '        name    TEXT NOT NULL,',
  '        city    TEXT,',
  '        balance REAL DEFAULT 0',
  '    )',
  '""")',
  'cur.executemany(',
  '    "INSERT INTO customers (name, city, balance) VALUES (?, ?, ?)",',
  '    [',
  '        ("Alice",  "Miami",   120.50),',
  '        ("Bob",    "Orlando", 1800.00),',
  '        ("Carlos", "Miami",   220.25),',
  '        ("Dana",   "Tampa",   3200.00),',
  '        ("Eli",    "Miami",    88.99),',
  '    ],',
  ')',
  'con.commit()',
  '',
].join('\n');

export const lesson17: Lesson = {
  id: 'lesson17',
  title: 'Databases & SQL',
  subtitle: 'sqlite3, CRUD, parameter binding, and transactions',
  objectives: [
    'Connect to a database and create a table from Python',
    'Insert, query, update, and delete rows with the four CRUD verbs',
    'Bind parameters with ? instead of building SQL from strings',
    'Explain what commit() does and why a missing WHERE is dangerous',
  ],
  concepts: [
    {
      id: 'l17-c1',
      title: 'Connect, create, insert',
      objective: 'Get a table into existence and put rows in it.',
      miniNote:
        'connection → cursor → execute. The connection owns the file; the cursor runs statements and holds results.',
      examples: [
        {
          id: 'l17-c1-e1',
          type: 'multipleChoice',
          stage: 'see',
          tags: ['fileMode'],
          prompt:
            'What does sqlite3.connect(":memory:") give you, as opposed to ' +
            'sqlite3.connect("shop.db")?',
          options: [
            'A database held in RAM that disappears when the connection closes',
            'A read-only view of an existing database',
            'A faster connection to the same shop.db file',
            'An error — ":memory:" is not a valid path',
          ],
          answerIndex: 0,
          explanation:
            'The special name ":memory:" creates a private database in RAM. It is ideal for tests ' +
            'and exercises because it starts empty every run. A filename instead creates or opens ' +
            'a file on disk that survives the program.',
          trapNote:
            'Two separate ":memory:" connections are two separate databases — they do not see each other.',
        },
        {
          id: 'l17-c1-e2',
          type: 'traceSteps',
          stage: 'see',
          tags: ['fileMode', 'mutation'],
          prompt: 'Step through the shortest possible round trip: create, insert, read back.',
          code: [
            'import sqlite3',
            'con = sqlite3.connect(":memory:")',
            'cur = con.cursor()',
            'cur.execute("CREATE TABLE t (name TEXT)")',
            'cur.execute("INSERT INTO t VALUES (?)", ("Alice",))',
            'rows = cur.execute("SELECT name FROM t").fetchall()',
          ].join('\n'),
          steps: [
            { line: 2, vars: { con: '<sqlite3.Connection>' }, note: 'An empty database now exists in RAM.' },
            { line: 3, vars: { cur: '<sqlite3.Cursor>' }, note: 'The cursor is what runs statements.' },
            { line: 4, vars: { tables: "['t']" }, note: 'CREATE TABLE defines the shape. No rows yet.' },
            {
              line: 5,
              vars: { 'row count': '1' },
              note: 'The ? is a placeholder; the tuple supplies the value. Note the trailing comma — ("Alice",) is a 1-tuple.',
            },
            {
              line: 6,
              vars: { rows: "[('Alice',)]" },
              note: 'fetchall() returns a list of TUPLES, one per row — even for a single column.',
            },
          ],
          question: 'What is `rows` at the end?',
          options: ["['Alice']", "[('Alice',)]", "'Alice'", "[{'name': 'Alice'}]"],
          answerIndex: 1,
          explanation:
            'Every query returns rows as tuples, one element per selected column. A single-column ' +
            'query still gives you a 1-tuple, which is why you so often see row[0].',
          trapNote:
            '("Alice") is just a string in parentheses. ("Alice",) — with the comma — is the 1-tuple ' +
            'execute() needs for a single parameter.',
        },
        {
          id: 'l17-c1-e3',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['fileMode'],
          prompt:
            'The customers table is created and populated. Insert one more customer — ' +
            'Fatima, Naples, 640.00 — then print "count: N", the total number of rows.',
          starterCode: `${DB_STARTER}# Insert Fatima, then print the row count.\n`,
          tests: [
            'assert "count: 6" in _stdout, f"expected \'count: 6\' after inserting one row; got: {_stdout!r}"',
            '_row = cur.execute("SELECT city, balance FROM customers WHERE name = ?", ("Fatima",)).fetchone()',
            'assert _row is not None, "no customer named Fatima was inserted"',
            'assert _row[0] == "Naples", f"expected city Naples, got {_row[0]!r}"',
            'assert abs(_row[1] - 640.00) < 0.01, f"expected balance 640.00, got {_row[1]}"',
          ],
          solutionHint:
            'cur.execute("INSERT INTO customers (name, city, balance) VALUES (?, ?, ?)", (...)), then ' +
            'SELECT COUNT(*) FROM customers and read element 0 of the fetchone() tuple.',
          explanation:
            'INSERT adds a row; COUNT(*) is an aggregate that returns a single row holding a single ' +
            'number, so fetchone()[0] is the count. The id column fills itself because it is ' +
            'INTEGER PRIMARY KEY.',
        },
      ],
    },
    {
      id: 'l17-c2',
      title: 'Querying — the R in CRUD',
      objective: 'Ask precise questions instead of pulling everything into Python.',
      miniNote:
        'Filter in SQL with WHERE, not in Python with an if. The database is far better at it, and it moves less data.',
      examples: [
        {
          id: 'l17-c2-e1',
          type: 'multipleChoice',
          stage: 'try',
          tags: ['assertLogic'],
          prompt:
            'What is the difference between cur.fetchone() and cur.fetchall() after running a SELECT?',
          options: [
            'fetchone() returns the first row as a tuple; fetchall() returns a list of every remaining row',
            'They are identical — fetchone() is just an alias',
            'fetchone() returns a single value; fetchall() returns a list of values',
            'fetchall() must be called before fetchone()',
          ],
          answerIndex: 0,
          explanation:
            'A cursor is a stream you consume. fetchone() takes the next row (or None when exhausted); ' +
            'fetchall() drains the rest into a list. Both hand you tuples, not bare values.',
          trapNote:
            'Calling fetchall() twice gives you the rows and then an empty list — the cursor has already ' +
            'been consumed.',
        },
        {
          id: 'l17-c2-e2',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['assertLogic', 'sortedKey'],
          prompt:
            'Print every customer in Miami whose balance is over 100, one per line as ' +
            '"Alice: 120.50", ordered by balance from highest to lowest.',
          starterCode: `${DB_STARTER}# Query Miami customers with balance > 100, highest balance first.\n`,
          tests: [
            '_lines = [l for l in _stdout.strip().splitlines() if l.strip()]',
            'assert len(_lines) == 2, f"expected exactly 2 matching customers, got {len(_lines)}: {_lines!r}"',
            'assert _lines[0].startswith("Carlos"), f"Carlos has the higher balance so should print first; got {_lines[0]!r}"',
            'assert "220.25" in _lines[0], f"expected Carlos 220.25; got {_lines[0]!r}"',
            'assert _lines[1].startswith("Alice"), f"expected Alice second; got {_lines[1]!r}"',
            'assert "120.50" in _lines[1], f"expected Alice 120.50; got {_lines[1]!r}"',
            'assert "Eli" not in _stdout, "Eli is in Miami but only has 88.99 — the balance filter should exclude him"',
            'assert "Bob" not in _stdout, "Bob has a high balance but is in Orlando"',
          ],
          solutionHint:
            'SELECT name, balance FROM customers WHERE city = ? AND balance > ? ORDER BY balance DESC — ' +
            'then loop the rows and print with an f-string using :.2f.',
          explanation:
            'Two conditions joined by AND, then ORDER BY ... DESC. Eli is the row that matters: he is in ' +
            'Miami but under the balance bar, so a query missing the second condition would wrongly ' +
            'include him.',
          trapNote:
            'ORDER BY defaults to ascending. Leaving off DESC silently gives you the right rows in the ' +
            'wrong order.',
        },
      ],
    },
    {
      id: 'l17-c3',
      title: 'Update, delete, and the WHERE you forgot',
      objective: 'Change and remove rows without destroying the table.',
      miniNote:
        'UPDATE and DELETE without a WHERE clause apply to EVERY row. SQL will not warn you.',
      examples: [
        {
          id: 'l17-c3-e1',
          type: 'multipleChoice',
          stage: 'debug',
          tags: ['mutation', 'loopInvariant'],
          prompt:
            'A script runs: cur.execute("UPDATE customers SET balance = 0")\n' +
            'The intent was to zero out one closed account. What actually happened?',
          options: [
            'Nothing — SQLite rejects an UPDATE with no WHERE clause',
            'Only the first row was changed',
            'Every row in the table now has balance 0',
            'It raises a syntax error',
          ],
          answerIndex: 2,
          explanation:
            'A WHERE clause is what limits the scope. Without one, UPDATE applies to the whole table — ' +
            'valid SQL, silently catastrophic. The same is true of DELETE FROM customers with no WHERE.',
          trapNote:
            'cur.rowcount tells you how many rows a statement touched. Checking it before commit() is ' +
            'the cheapest habit that will ever save you.',
        },
        {
          id: 'l17-c3-e2',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['mutation'],
          prompt:
            'Give every Miami customer a 10.00 loyalty credit, then delete any customer whose balance ' +
            'is still under 100. Print "updated: N" then "deleted: M" using cur.rowcount.',
          starterCode: `${DB_STARTER}# Credit Miami customers, remove the ones still under 100.\n`,
          tests: [
            'assert "updated: 3" in _stdout, f"3 customers are in Miami; got: {_stdout!r}"',
            'assert "deleted: 1" in _stdout, f"only Eli (88.99 + 10 = 98.99) stays under 100; got: {_stdout!r}"',
            '_names = [r[0] for r in cur.execute("SELECT name FROM customers ORDER BY name")]',
            'assert _names == ["Alice", "Bob", "Carlos", "Dana"], f"unexpected survivors: {_names}"',
            '_alice = cur.execute("SELECT balance FROM customers WHERE name = ?", ("Alice",)).fetchone()[0]',
            'assert abs(_alice - 130.50) < 0.01, f"Alice should be 120.50 + 10 = 130.50, got {_alice}"',
            '_bob = cur.execute("SELECT balance FROM customers WHERE name = ?", ("Bob",)).fetchone()[0]',
            'assert abs(_bob - 1800.00) < 0.01, f"Bob is in Orlando and should be untouched, got {_bob}"',
          ],
          solutionHint:
            'UPDATE customers SET balance = balance + ? WHERE city = ?, then DELETE FROM customers ' +
            'WHERE balance < ?. Read cur.rowcount immediately after each statement.',
          explanation:
            'balance = balance + 10 reads and writes in one statement — no need to SELECT first. Eli is ' +
            'the interesting row: the credit lifts him to 98.99, still under the bar, so he is deleted ' +
            'after being updated.',
          trapNote:
            'cur.rowcount reflects the LAST statement executed. Read it before running the next one or ' +
            'you will report the wrong number.',
        },
      ],
    },
    {
      id: 'l17-c4',
      title: 'Parameters and transactions',
      objective: 'The two habits that separate working code from dangerous code.',
      miniNote:
        'Never build SQL by joining strings. Never assume a write is saved until commit() runs.',
      examples: [
        {
          id: 'l17-c4-e1',
          type: 'multipleChoice',
          stage: 'debug',
          tags: ['typeCoercion', 'exceptionType'],
          prompt:
            'Why is\n' +
            '    cur.execute(f"SELECT * FROM customers WHERE name = \'{user_input}\'")\n' +
            'dangerous, where the ? placeholder form is not?',
          options: [
            'It is slower because the query cannot be cached',
            'The input is treated as SQL code, so a crafted value can rewrite the query',
            'f-strings cannot contain quotes',
            'It only fails when the input contains numbers',
          ],
          answerIndex: 1,
          explanation:
            'String-building makes user input part of the SQL text. An input of ' +
            "\"' OR '1'='1\" turns the WHERE into something always true, and a value containing a " +
            'semicolon can append an entirely new statement. Placeholders send the value separately ' +
            'from the query, so it is only ever data. This is SQL injection.',
          trapNote:
            'Escaping quotes by hand is not a fix — it is a bug waiting for an input you did not imagine. ' +
            'Use ? every time, including for values you believe are safe.',
        },
        {
          id: 'l17-c4-e2',
          type: 'multipleChoice',
          stage: 'try',
          tags: ['mutation', 'fileMode'],
          prompt:
            'A script inserts 100 rows into a file-backed database, then exits without calling ' +
            'con.commit(). What is in the file afterwards?',
          options: [
            'All 100 rows — execute() writes immediately',
            'None of them — the transaction was never committed, so the changes were rolled back',
            'The first row only',
            'The file is corrupted',
          ],
          answerIndex: 1,
          explanation:
            'sqlite3 opens a transaction for you on the first write. Until commit(), the changes exist ' +
            'only inside that transaction; closing without committing discards them. This is the single ' +
            'most common "my data vanished" bug.',
          trapNote:
            'Using the connection as a context manager — `with con:` — commits on success and rolls back ' +
            'if the block raises, which is safer than remembering.',
        },
      ],
    },
  ],
  lessonCheck: [
    {
      id: 'l17-check-1',
      type: 'multipleChoice',
      stage: 'try',
      tags: ['assertLogic'],
      prompt: 'Which statement correctly and safely deletes the customer named by the variable target?',
      options: [
        'cur.execute("DELETE FROM customers WHERE name = " + target)',
        'cur.execute(f"DELETE FROM customers WHERE name = \'{target}\'")',
        'cur.execute("DELETE FROM customers WHERE name = ?", (target,))',
        'cur.execute("DELETE FROM customers", target)',
      ],
      answerIndex: 2,
      explanation:
        'The placeholder form passes target as data, never as SQL, and the trailing comma makes it a ' +
        '1-tuple. The last option has no WHERE at all and would empty the table.',
    },
    {
      id: 'l17-check-2',
      type: 'multipleChoice',
      stage: 'try',
      tags: ['mutation'],
      prompt: 'What does cur.rowcount report immediately after an UPDATE?',
      options: [
        'The number of rows the UPDATE changed',
        'The total number of rows in the table',
        'The id of the last row updated',
        'Always 1 for an UPDATE',
      ],
      answerIndex: 0,
      explanation:
        'rowcount is how many rows the last statement affected. Checking it against what you expected ' +
        'catches a missing WHERE before you commit it.',
    },
  ],
};
