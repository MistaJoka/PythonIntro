/**
 * One-time migration: add options + answerIndex to traceSteps / fillBlank examples.
 * Run: npx tsx scripts/migrate-to-mc.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const TYPE_NAMES = ['int', 'float', 'str', 'bool', 'None', 'list', 'dict', 'set', 'tuple'];

/** Hand-tuned distractors for answers that heuristics miss. */
const OVERRIDES: Record<string, string[]> = {
  'l1-c2-e1': ['7', '8', '6', '73'],
  'l1-c2-e3': ['f"Score: {score}"', '"Score: 42"', 'score', '"Score:", score'],
  'l1-c3-e1': ['"42.0"', '"42"', '42.0', 'float'],
  'l1-c4-e1': ['"7 + 3 = 10"', '"10"', '"7+3=10"', '"13"'],
  'l1-c4-e2': ['.2f', '.0f', ':.2f', '2f'],
  'l1-extra-2': ['name', 'input()', 'input("name")', '"name"'],
  'l1-check-2': ['10', '9', '11', '"10"'],
  'l1-check-4': ['int', 'float', 'str', 'bool'],
  'l2-c1-e1': ['16', '3', '17', '4'],
  'l2-c4-e3': ['(2 + 3) * 4', '2 + 3 * 4', '20', '10'],
  'l2-extra-3': ['%', '//', '/', '**'],
  'l3-c1-e1': ['"B"', '"A"', '"C"', '"AB"'],
  'l3-c3-e1': ['"pos"', '"neg"', '"zero"', '"Pos"'],
  'l3-c4-e1': ['"empty"', '"zero"', '"pos"', '""'],
  'l3-extra-4': ['"mid"', '"low"', '"high"', '"Mid"'],
  'l3-check-1': ['"yes"', '"no"', '"maybe"', 'True'],
  'l4-c2-e3': ['for n in nums', 'for nums in n', 'while n in nums', 'for n in range(nums)'],
  'l4-c4-e1': ['a=4, b=4', 'a=3, b=4', 'a=4, b=3', 'a=0, b=0'],
  'l4-extra-3': ['break', 'continue', 'return', 'pass'],
  'l4-check-4': ['5, 0, -1', '5, 1, 0', '4, 0, -1', '5, 0, 1'],
  'l5-c1-e3': ['return a', 'return b', 'a', 'return a >= b'],
  'l5-c2-e1': ['y=99, z=10', 'y=10, z=10', 'y=99, z=99', 'x=99, z=10'],
  'l5-c3-e1': ['r1=None, r2=5', 'r1=5, r2=5', 'r1=None, r2=None', 'r1="Hi Ada", r2=5'],
  'l5-c4-e1': ['[1, 2]', '[1]', '[2]', '[1, 2, 3]'],
  'l5-extra-4': ['def', 'function', 'fn', 'define'],
  'l5-check-4': ['-n', 'n', 'n - 1', '-1'],
  'l6-c2-e3': ['0:2', '1:3', ':2', '0:3'],
  'l6-c3-e1': ['s="dog", t="cats"', 's="cats", t="cats"', 's="dog", t="dog"', 's="cat", t="cats"'],
  'l6-extra-2': [':3', '3:', ':2', '0:3'],
  'l6-extra-4': ['"bdf"', '"abc"', '"bdfh"', '"BDF"'],
  'l7-c2-e2': ['stack=[10], x=30, y=20', 'stack=[10,20], x=30, y=20', 'stack=[10], x=20, y=30', 'stack=[], x=30, y=20'],
  'l7-c3-e2': ['[5, 0]', '[5]', '[0, 5]', '[5, 0, 0]'],
  'l7-c3-e3': ['x=[2], y=[1, 3]', 'x=[1], y=[1, 3]', 'x=[2], y=[2, 3]', 'x=[2], y=[1, 2, 3]'],
  'l7-extra-3': ['append', 'extend', 'insert', 'add'],
  'l8-c1-e3': ['d["x"] = 10', 'd.x = 10', 'd["x"] = "10"', 'd.get("x") = 10'],
  'l8-c3-e1': ['{"a": 10, "c": 3}', '{"a": 1, "c": 3}', '{"a": 10, "b": 2}', '{"a": 10, "b": 2, "c": 3}'],
  'l8-extra-4': ['keys', 'values', 'items', 'get'],
  'l9-c1-e3': ['n % 2 == 0', 'n % 2', 'n // 2 == 0', 'n % 2 != 0'],
  'l9-c4-e3': ['from math import sqrt', 'import sqrt', 'import math.sqrt', 'from math import *'],
  'l9-extra-1': ['n * n', 'n ** 2', 'n + n', '2 * n'],
  'l10-c3-e3': ['ZeroDivisionError', 'ValueError', 'TypeError', 'IndexError'],
  'l10-extra-3': ['except', 'catch', 'try', 'finally'],
  'l10-check-3': ['"w"', '"r"', '"a"', '"rw"'],
  'l11-c1-e3': ['name', 'self.name', 'self', '__name__'],
  'l11-extra-4': ['__init__', '__str__', 'init', 'constructor'],
  'l12-c1-e3': ['0', '1', '-1', 'None'],
  'l12-c4-e3': ['log n', 'n', 'n log n', '1'],
};

function uniq(arr: string[]): string[] {
  const seen = new Set<string>();
  return arr.filter((v) => {
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
}

function buildOptions(id: string, answer: string): { options: string[]; answerIndex: number } {
  if (OVERRIDES[id]) {
    const options = uniq(OVERRIDES[id]);
    const answerIndex = options.indexOf(answer);
    if (answerIndex === -1) {
      options[0] = answer;
    }
    return { options: options.slice(0, 4), answerIndex: Math.max(0, options.indexOf(answer)) };
  }

  const a = answer.trim();

  if (TYPE_NAMES.includes(a)) {
    const pool = ['int', 'float', 'str', 'bool', 'None', 'list'];
    const options = uniq([a, ...pool.filter((t) => t !== a)]).slice(0, 4);
    return { options, answerIndex: options.indexOf(a) };
  }

  if (a === 'True' || a === 'False') {
    const options = uniq([a, a === 'True' ? 'False' : 'True', 'None', 'Error']);
    return { options, answerIndex: 0 };
  }

  if (/^-?\d+(\.\d+)?$/.test(a)) {
    const n = Number(a);
    const candidates = uniq([
      a,
      String(n + 1),
      String(n - 1),
      String(n * 2),
      String(n + 2),
      '0',
      '1',
    ]);
    const options = candidates.slice(0, 4);
    return { options, answerIndex: options.indexOf(a) };
  }

  if (a.startsWith('"') && a.endsWith('"')) {
    const inner = a.slice(1, -1);
    const candidates = uniq([
      a,
      `"${inner.slice(0, -1)}"`,
      `"${inner}X"`,
      `"${inner.toUpperCase()}"`,
      '""',
      inner,
    ]).filter((s) => s.length > 0);
    const options = candidates.slice(0, 4);
    if (!options.includes(a)) options[0] = a;
    return { options, answerIndex: options.indexOf(a) };
  }

  if (a.startsWith('[') || a.startsWith('{')) {
    const candidates = uniq([a, a.replace('99', '9'), a.replace('2', '3'), '[]', '{}']);
    const options = candidates.slice(0, 4);
    if (!options.includes(a)) options[0] = a;
    return { options, answerIndex: options.indexOf(a) };
  }

  // Code-like fillBlank answers
  const generic = uniq([a, `${a}x`, a.replace('return ', ''), a.toUpperCase(), 'pass']);
  const options = generic.slice(0, 4);
  return { options, answerIndex: 0 };
}

function escapeForTs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function formatOptions(options: string[], answerIndex: number): string {
  const lines = options.map((o) => `'${escapeForTs(o)}'`).join(', ');
  return `options: [${lines}],\n          answerIndex: ${answerIndex},`;
}

function migrateFile(filePath: string): number {
  let text = fs.readFileSync(filePath, 'utf8');
  let count = 0;

  // Match traceSteps or fillBlank blocks with id and answer
  const blockRe =
    /id: '([^']+)'([\s\S]*?type: '(traceSteps|fillBlank)'[\s\S]*?)answer: '((?:\\'|[^'])*)'(,?)([\s\S]*?)(?=acceptableAnswers:|explanation:)/g;

  text = text.replace(blockRe, (match, id, before, type, answer, comma, after) => {
    const unescaped = answer.replace(/\\'/g, "'");
    const { options, answerIndex } = buildOptions(id, unescaped);
    count++;
    const mcBlock = formatOptions(options, answerIndex);
    return `id: '${id}'${before}type: '${type}'${after}${mcBlock}\n          explanation:`;
  });

  // Remove acceptableAnswers lines (no longer needed for fillBlank)
  text = text.replace(/\n\s*acceptableAnswers: \[[^\]]*\],/g, '');

  fs.writeFileSync(filePath, text);
  return count;
}

const root = path.join(import.meta.dirname, '..');
const lessonDir = path.join(root, 'src/content/lessons');
const files = [
  ...fs.readdirSync(lessonDir).filter((f) => f.startsWith('lesson')).map((f) => path.join(lessonDir, f)),
  path.join(root, 'src/content/lessonExtras.ts'),
];

let total = 0;
for (const f of files) {
  const n = migrateFile(f);
  if (n > 0) console.log(`${path.basename(f)}: ${n}`);
  total += n;
}
console.log(`Migrated ${total} examples`);
