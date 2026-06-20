function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const TOKEN_RE = new RegExp(
  [
    '(#.*$)',
    '("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')',
    '\\b(False|None|True|and|as|assert|async|await|break|class|continue|' +
      'def|del|elif|else|except|finally|for|from|global|if|import|in|is|' +
      'lambda|match|case|nonlocal|not|or|pass|raise|return|try|while|with|yield)\\b',
    '\\b(print|len|range|type|isinstance|str|int|float|bool|list|dict|set|' +
      'tuple|sorted|enumerate|zip|map|filter|sum|min|max|abs|round|open|' +
      'super|object|property|staticmethod|classmethod|hasattr|getattr|setattr|' +
      'next|iter|vars|dir|repr|id|hex|bin|ord|chr|callable|any|all)\\b',
    '\\b(\\d+\\.\\d*|\\.\\d+|\\d+)\\b',
  ].join('|'),
  'gm',
);

/** Tokenize one line of Python source into HTML with syntax-highlight spans. */
export function tokenizeLine(line: string): string {
  const parts: string[] = [];
  let lastIdx = 0;

  const matches = [...line.matchAll(TOKEN_RE)];
  for (const match of matches) {
    const [full, comment, str, kw, builtin, num] = match;
    const idx = match.index!;
    if (idx > lastIdx) parts.push(esc(line.slice(lastIdx, idx)));
    if (comment) parts.push(`<span class="code-cm">${esc(full)}</span>`);
    else if (str) parts.push(`<span class="code-str">${esc(full)}</span>`);
    else if (kw) parts.push(`<span class="code-kw">${esc(full)}</span>`);
    else if (builtin) parts.push(`<span class="code-builtin">${esc(full)}</span>`);
    else if (num) parts.push(`<span class="code-num">${esc(full)}</span>`);
    lastIdx = idx + full.length;
  }
  if (lastIdx < line.length) parts.push(esc(line.slice(lastIdx)));
  return parts.join('');
}
