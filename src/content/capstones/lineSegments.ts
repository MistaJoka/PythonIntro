export type CodeSegment = {
  code: string;
  explain: string;
};

const KEYWORD_EXPLAIN: Record<string, string> = {
  return: 'Stop here and send the computed value back to the caller.',
  yield: 'Produce one value from a generator without exiting the function.',
  assert: 'Crash immediately if the condition is false — guards bad state early.',
  if: 'Only run the indented block when this condition is True.',
  elif: 'Try this alternative branch when earlier conditions were False.',
  else: 'Run this branch when all preceding conditions were False.',
  for: 'Repeat the block once for each item in the collection.',
  while: 'Repeat the block while the condition stays True.',
  try: 'Attempt the next lines; jump to except on failure.',
  except: 'Handle errors from the try block — recover instead of crashing.',
  def: 'Define a reusable function — the body runs only when called.',
  class: 'Define a new type — instances bundle data and methods.',
  import: 'Load a library module so its tools are available in this file.',
  match: 'Compare a value against patterns — like a smarter if/elif chain.',
  case: 'One pattern arm of a match — runs when the pattern fits.',
};

function explainMethod(name: string, args: string): string {
  const map: Record<string, string | ((a: string) => string)> = {
    strip: 'Remove whitespace from both ends of the string.',
    rstrip: 'Remove trailing whitespace only.',
    lower: 'Convert every character to lowercase.',
    upper: 'Convert every character to uppercase.',
    title: 'Capitalize the first letter of each word — "ada lovelace" → "Ada Lovelace".',
    split: (a) => (a ? `Split on delimiter ${a}.` : 'Split on whitespace into a list.'),
    splitlines: 'Split into a list of lines at newline characters.',
    append: (a) => `Append ${a || 'item'} to the list in place.`,
    get: (a) => `Dict lookup for key ${a || '...'} with a safe default.`,
    add: (a) => `Add ${a || 'item'} to the set — duplicates ignored.`,
  };
  const entry = map[name];
  if (!entry) return `Call .${name}(${args}) on the value to its left.`;
  return typeof entry === 'function' ? entry(args) : entry;
}

function explainCall(name: string, argsPreview: string): string {
  const map: Record<string, string> = {
    're.sub': `Regex replace — pattern ${argsPreview.split(',')[0]?.trim() || '...'} finds runs of whitespace; replace with a single space.`,
    'json.loads': 'Parse a JSON string into Python dicts and lists.',
    'json.dumps': 'Serialize Python data into a JSON string.',
    sorted: 'Return a new sorted list — order controlled by the key= argument.',
    zip: 'Pair elements from parallel lists — e.g. names with scores.',
    enumerate: 'Loop with an automatic index counter starting at 0.',
    float: 'Convert text or int to a decimal number for comparisons.',
    int: 'Convert value to a whole number.',
    str: 'Convert value to text.',
    len: 'Count how many items are in the collection.',
    round: 'Round a float for human-readable output.',
    deepcopy: 'Clone a dict/list so later edits cannot alias the original.',
    '_rec_sum': 'Add list elements recursively — empty tail returns 0.',
    '_letter': 'Map a numeric score to letter grade A–F.',
    '_clean': 'Normalize display text — trim, collapse spaces, title-case.',
    HighlightRow: 'Build a highlighted honor row object for the report.',
    ResultRow: 'Build a standard report row object.',
  };
  return map[name] ?? `Call ${name}(...) and use its return value.`;
}

/** Walk expression inside-out; push segments in evaluation order. */
function walkExpression(expr: string, out: CodeSegment[]): void {
  const e = expr.trim();
  if (!e) return;

  const method0 = e.match(/^([\s\S]+)\.([a-zA-Z_]\w*)\(\)\s*$/);
  if (method0 && parenDepth(method0[1]!) === 0) {
    walkExpression(method0[1]!, out);
    out.push({ code: `.${method0[2]}()`, explain: explainMethod(method0[2]!, '') });
    return;
  }
  const method1 = e.match(/^([\s\S]+)\.([a-zA-Z_]\w*)\(([^)]*)\)\s*$/);
  if (method1 && parenDepth(method1[1]!) === 0) {
    walkExpression(method1[1]!, out);
    out.push({
      code: `.${method1[2]}(${method1[3]})`,
      explain: explainMethod(method1[2]!, method1[3]!),
    });
    return;
  }

  const sub = e.match(/^re\.sub\((r"[^"]*"|r'[^']*'|"[^"]*"|'[^']*'),\s*("[^"]*"|'[^']*'),\s*([\s\S]+)\)$/);
  if (sub) {
    walkExpression(sub[3]!, out);
    out.push({
      code: `re.sub(${sub[1]}, ${sub[2]}, …)`,
      explain: explainCall('re.sub', `${sub[1]}, ${sub[2]}`),
    });
    return;
  }

  const calls: { re: RegExp; name: string; argIdx: number }[] = [
    { re: /^json\.loads\(([\s\S]+)\)$/, name: 'json.loads', argIdx: 1 },
    { re: /^json\.dumps\(([\s\S]+)\)$/, name: 'json.dumps', argIdx: 1 },
    { re: /^sorted\(([\s\S]+)\)$/, name: 'sorted', argIdx: 1 },
    { re: /^_rec_sum\(([\s\S]+)\)$/, name: '_rec_sum', argIdx: 1 },
    { re: /^_letter\(([\s\S]+)\)$/, name: '_letter', argIdx: 1 },
    { re: /^_clean\(([\s\S]+)\)$/, name: '_clean', argIdx: 1 },
    { re: /^deepcopy\(([\s\S]+)\)$/, name: 'deepcopy', argIdx: 1 },
    { re: /^float\(([\s\S]+)\)$/, name: 'float', argIdx: 1 },
    { re: /^len\(([\s\S]+)\)$/, name: 'len', argIdx: 1 },
    { re: /^round\(([\s\S]+)\)$/, name: 'round', argIdx: 1 },
    { re: /^HighlightRow\(([\s\S]+)\)$/, name: 'HighlightRow', argIdx: 1 },
    { re: /^ResultRow\(([\s\S]+)\)$/, name: 'ResultRow', argIdx: 1 },
  ];

  for (const { re, name, argIdx } of calls) {
    const m = e.match(re);
    if (m) {
      walkExpression(m[argIdx]!, out);
      out.push({
        code: `${name}(…)`,
        explain: explainCall(name, m[argIdx]!.trim()),
      });
      return;
    }
  }

  if (/^[a-zA-Z_]\w*$/.test(e)) {
    out.push({ code: e, explain: `Read variable ${e} — the input value at this step.` });
    return;
  }

  if (e.startsWith('f"') || e.startsWith("f'")) {
    out.push({
      code: e.length > 40 ? `${e.slice(0, 37)}…` : e,
      explain: 'Build a formatted string — {variables} are filled in at runtime.',
    });
    return;
  }

  out.push({
    code: e.length > 44 ? `${e.slice(0, 41)}…` : e,
    explain: 'Evaluate this sub-expression; its result feeds the next outer operation.',
  });
}

function parenDepth(s: string): number {
  let d = 0;
  for (const ch of s) {
    if (ch === '(') d++;
    else if (ch === ')') d--;
  }
  return d;
}

/** Break a source line into primitive segments, inside-out evaluation order. */
export function decomposeLine(line: string): CodeSegment[] {
  const t = line.trim();
  if (!t) return [];

  if (t.startsWith('from __future__')) {
    return [{ code: t, explain: 'Enable modern type-hint syntax for annotations below.' }];
  }
  if (t.startsWith('import ') || t.startsWith('from ')) {
    return [{ code: t, explain: KEYWORD_EXPLAIN.import! }];
  }
  if (t.startsWith('def ')) {
    return [
      { code: 'def', explain: KEYWORD_EXPLAIN.def! },
      { code: t.slice(4), explain: 'Parameters become local variables when the function is called.' },
    ];
  }
  if (t.startsWith('class ')) {
    return [
      { code: 'class', explain: KEYWORD_EXPLAIN.class! },
      { code: t.slice(6), explain: 'Instances share the methods you define in this block.' },
    ];
  }

  const segments: CodeSegment[] = [];

  const prefix = t.match(/^(return|yield|assert)\s+/);
  if (prefix) {
    const kw = prefix[1]!;
    const rest = t.slice(prefix[0].length);
    walkExpression(rest, segments);
    segments.push({ code: kw, explain: KEYWORD_EXPLAIN[kw]! });
    return segments;
  }

  if (/^(if|elif|for|while|try|except|match|case)\b/.test(t)) {
    const kw = t.split(/\s+/)[0]!;
    return [
      { code: kw, explain: KEYWORD_EXPLAIN[kw] ?? `${kw} — control flow.` },
      { code: t.slice(kw.length).trim(), explain: 'Condition or target for this branch.' },
    ];
  }

  if (t.includes('=') && !/[=!<>]=/.test(t.split('=')[0] ?? '')) {
    const eq = t.indexOf('=');
    const lhs = t.slice(0, eq).trim();
    const rhs = t.slice(eq + 1).trim();
    walkExpression(rhs, segments);
    segments.push({
      code: lhs,
      explain: `Store the result in ${lhs} — readable on following lines.`,
    });
    return segments;
  }

  walkExpression(t, segments);
  return segments;
}
