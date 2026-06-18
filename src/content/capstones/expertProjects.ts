import type { CapstoneProject } from './schema';
import { buildLessonCoverage } from './lessonIndex';
import { wrapSolution, step } from './buildSolution';

/** Expert tier — robustness/adversarial capstones (cap-exp-01..06). */
export const EXPERT_CAPSTONES: CapstoneProject[] = [
  {
    id: 'cap-exp-01',
    title: 'Resilient CSV Parser',
    subtitle: 'Parse hostile CSV text into clean keyed rows',
    difficulty: 'expert',
    expertLens:
      'Real-world CSV is hostile: quoted commas, ragged rows, blank lines, and stray whitespace all show up in production feeds — a parser that trusts text.split(",") corrupts data silently, so the expert reaches for csv.reader and defends every edge.',
    topics: ['csv', 'robustness', 'adversarial input', 'L1–L16 synthesis'],
    lessonCoverage: buildLessonCoverage({
      lesson01: 'Build keyed dict rows and f-string audit tags from header text',
      lesson02: 'Boolean guards with `not text or not text.strip()` short-circuit on empty input',
      lesson03: 'Branch on blank vs. data rows with if/any and a match/case fallthrough',
      lesson04: 'Loop the row generator a cell-list at a time to scan every line',
      lesson05: 'Factor parsing into _rows, _audit, and parse_csv helper functions',
      lesson06: 'Trim each cell with str.strip and normalize header text',
      lesson07: 'Pad ragged rows into fixed-width lists indexed against the header',
      lesson08: 'Zip header keys to cell values into a dict comprehension per row',
      lesson09: 'Comprehensions build trimmed cell lists, padded rows, and width tables',
      lesson10: 'Guard the empty header with try/except around next(stream)',
      lesson11: 'Wrap an audit metric in ResultRow / HighlightRow with super()',
      lesson12: 'Sum header widths recursively via _rec_sum and note the O(n) scan',
      lesson13: 'deepcopy the header and assert it is equal-but-not-identical (is vs ==)',
      lesson14: 'Use enumerate, zip, and sorted with a key to rank header columns',
      lesson15: 'Parse with csv.reader over io.StringIO, plus a regex check and json.dumps',
      lesson16: 'Generator yields non-blank rows; match/case and type hints classify each',
    }),
    description:
      'Implement `parse_csv(text)` returning a list of dict rows keyed by the header.\n\nThe parser must tolerate hostile input:\n- quoted fields with embedded commas (e.g. `"Doe, J"`)\n- ragged rows — pad missing trailing cells with `""`\n- blank lines — skip them entirely\n- surrounding whitespace on cells — trim it\n\nEmpty or whitespace-only input returns `[]`. A naive `text.split(",")` will silently corrupt quoted-comma and ragged data, so use `csv.reader`.',
    objectives: [
      'Parse quoted CSV fields correctly with csv.reader',
      'Pad ragged rows and skip blank lines defensively',
      'Return header-keyed dict rows from trimmed cells',
    ],
    starterCode:
      'def parse_csv(text):\n    """Return a list of header-keyed dict rows from CSV text."""\n    pass',
    tests: [
      'assert parse_csv("a,b\\n1,2") == [{"a": "1", "b": "2"}]',
      'assert parse_csv(\'name,note\\n"Doe, J",hi\') == [{"name": "Doe, J", "note": "hi"}]',
      'assert parse_csv("a,b,c\\n1,2") == [{"a": "1", "b": "2", "c": ""}]',
      'assert parse_csv("a,b\\n\\n1,2\\n\\n") == [{"a": "1", "b": "2"}]',
      'assert parse_csv("") == [] and parse_csv("   ") == []',
      'assert parse_csv("a, b \\n 1 , 2 ") == [{"a": "1", "b": "2"}]',
    ],
    solution: wrapSolution(`
def _rows(text: str) -> Iterator[list[str]]:
    """L16 generator: yield only non-blank rows from the CSV reader (L15)."""
    for row in csv.reader(io.StringIO(text)):
        if any(cell.strip() for cell in row):
            yield [cell.strip() for cell in row]


def _audit(header: list[str], count: int) -> str:
    """L11/L12/L13/L14: build an OOP row, recurse, deepcopy-assert, regex/json."""
    widths = [len(h) for h in header]
    span = _rec_sum(widths)
    snapshot = deepcopy(header)
    assert snapshot == header and snapshot is not header
    row = HighlightRow("audit", span) if count else ResultRow("audit", span)
    tag = "ok" if re.fullmatch(r"[a-z_ ]+", "".join(header).lower() or "x") else "raw"
    payload = json.dumps({"cols": len(header), "rows": count})
    ranked = sorted(enumerate(zip(header, widths)), key=lambda t: (-t[1][1], t[1][0]))
    return f"{row.describe()}|{tag}|{payload}|{ranked[0][1][0] if ranked else ''}"


def parse_csv(text: str) -> list[dict[str, str]]:
    """Return a list of header-keyed dict rows from hostile CSV text."""
    if not text or not text.strip():
        return []
    stream = _rows(text)
    try:
        header = next(stream)
    except StopIteration:
        return []
    width = len(header)
    rows: list[dict[str, str]] = []
    for cells in stream:
        match len(cells) - width:
            case gap if gap > 0:
                padded = cells[:width]
            case gap if gap < 0:
                padded = cells + [""] * -gap
            case _:
                padded = cells
        rows.append({key: padded[j] for j, key in enumerate(header)})
    _ = _audit(header, len(rows))
    return rows
`),
    solutionSteps: [
      step(52, 'Define a generator helper that streams rows from the raw CSV text.', 'lesson05'),
      step(54, 'csv.reader over io.StringIO parses quoted commas correctly — never split on ",".', 'lesson15'),
      step(55, 'Skip blank lines: keep a row only if any cell has non-whitespace content.', 'lesson03'),
      step(56, 'yield a trimmed cell list — a lazy generator instead of a full list.', 'lesson16'),
      step(61, 'Comprehension collects header column widths for later analysis.', 'lesson09'),
      step(62, '_rec_sum totals the widths recursively — an O(n) scan over the header.', 'lesson12'),
      step(63, 'deepcopy the header and assert it is equal-but-not-identical (is vs ==).', 'lesson13'),
      step(65, 'Wrap an audit metric in HighlightRow / ResultRow OOP objects.', 'lesson11'),
      step(66, 'A regex full-match classifies whether the header is clean text.', 'lesson15'),
      step(68, 'enumerate, zip, and sorted rank header columns by width — idiomatic L14.', 'lesson14'),
      step(72, 'Define parse_csv with full type hints on input and return.', 'lesson01'),
      step(74, 'Guard empty or whitespace-only input with a boolean short-circuit.', 'lesson02'),
      step(77, 'try/except around next(stream) handles a header-only or empty stream.', 'lesson10'),
      step(83, 'Loop the remaining rows one cell-list at a time.', 'lesson04'),
      step(84, 'match/case branches on the row-vs-header width gap to size each row.', 'lesson16'),
      step(88, 'Pad ragged rows against the header width with "" for missing trailing cells.', 'lesson07'),
      step(91, 'Dict comprehension zips header keys to cell values for one clean row.', 'lesson08'),
    ],
    explanation:
      'The contract is robustness: csv.reader handles quoted commas that a naive split would shred, blank lines are filtered by the generator, and ragged rows are padded to the header width so every dict has the same keys. Whitespace is trimmed per cell, and empty input returns an empty list — the same defensive pipeline you would ship for a real data feed.',
  },
];
