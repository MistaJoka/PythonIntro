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
  {
    id: 'cap-exp-02',
    title: 'JSON Config Validator',
    subtitle: 'Normalize hostile JSON config text into a safe, defaulted dict',
    difficulty: 'expert',
    expertLens:
      'Config files arrive with missing keys, wrong types, JSON null, and outright syntax errors — a service that does json.loads(payload)["port"] crashes on the first bad deploy. The expert validates against a schema: fill documented defaults, coerce or reject wrong types, treat null as missing, recurse into nested objects, and turn malformed input into a structured error result instead of a stack trace.',
    topics: ['json', 'validation', 'robustness', 'adversarial input', 'L1–L16 synthesis'],
    lessonCoverage: buildLessonCoverage({
      lesson01: 'Build f-string error paths and a typed config dict from the schema',
      lesson02: 'Boolean logic `key in raw and raw[key] is not None` decides presence',
      lesson03: 'if/elif coercion branches plus a not-present truthiness guard',
      lesson04: 'Loop the schema items to resolve each field against the raw payload',
      lesson05: 'Factor _coerce, _resolve, _flat_numbers, validate_config helpers',
      lesson06: 'str.strip and regex on string values before integer coercion',
      lesson07: 'Tuple return `(ok, coerced)` is unpacked to drive the branch',
      lesson08: 'Dict comprehension seeds defaults; nested dicts get their own keys',
      lesson09: 'Comprehensions build audit rows and the per-field type table',
      lesson10: 'try/except around json.loads turns malformed input into an error dict',
      lesson11: 'ResultRow / HighlightRow with super() wrap each resolved field',
      lesson12: '_rec_sum totals numeric leaves recursively — O(n) over the config',
      lesson13: 'deepcopy the schema and assert it is equal-but-not-identical',
      lesson14: 'enumerate and zip pair field names with values for the audit list',
      lesson15: 'json.loads parses, regex validates int strings, json.dumps audits',
      lesson16: 'Generator yields numeric leaves; match/case and type hints classify',
    }),
    description:
      'Implement `validate_config(payload)` that parses a JSON object string and returns a normalized config.\n\nReturn shape: `{"ok": bool, "config": {...}, "errors": [...]}`.\n\nValidate against a fixed schema (name, port, debug, retries, and a nested `limits` object):\n- missing keys → filled with documented defaults\n- wrong types (e.g. a non-numeric string for `port`) → rejected, default used, error recorded\n- a numeric string like `"9090"` → coerced to int\n- JSON `null` → treated as missing → default\n- nested `limits` object → its own missing keys get nested defaults\n- malformed JSON or a non-object payload → `ok: false` with an `errors` list, NOT an exception\n\nA naive `json.loads(payload)["port"]` crashes on malformed input and ignores defaults, so validate every field.',
    objectives: [
      'Resolve a JSON payload against a schema with documented defaults',
      'Coerce or reject wrong types and treat null as missing',
      'Recurse into nested objects and never raise on malformed input',
    ],
    starterCode:
      'def validate_config(payload):\n    """Return {"ok", "config", "errors"} from a JSON config string."""\n    pass',
    tests: [
      'assert validate_config(\'{"name": "svc"}\')["config"]["port"] == 8080',
      'assert validate_config(\'{"name": "svc"}\')["config"]["limits"] == {"max_conn": 100, "timeout": 30}',
      'r = validate_config(\'{"port": "nope"}\'); assert r["ok"] is False and r["config"]["port"] == 8080 and any("port" in e for e in r["errors"])',
      'r = validate_config(\'{"port": "9090", "retries": null}\'); assert r["config"]["port"] == 9090 and r["config"]["retries"] == 3',
      'r = validate_config(\'{"limits": {"max_conn": 250}}\'); assert r["config"]["limits"]["max_conn"] == 250 and r["config"]["limits"]["timeout"] == 30',
      'r = validate_config("{not valid json"); assert r["ok"] is False and r["config"] == {} and r["errors"]',
    ],
    solution: wrapSolution(`
SCHEMA: dict[str, Any] = {
    "name": {"type": str, "default": "app"},
    "port": {"type": int, "default": 8080},
    "debug": {"type": bool, "default": False},
    "retries": {"type": int, "default": 3},
    "limits": {
        "type": "nested",
        "fields": {
            "max_conn": {"type": int, "default": 100},
            "timeout": {"type": int, "default": 30},
        },
    },
}


def _coerce(value: Any, want: type) -> tuple[bool, Any]:
    """L02/L03: coerce value to the wanted type; return (ok, coerced)."""
    if isinstance(value, bool) and want is not bool:
        return False, None
    if want is bool:
        return (True, value) if isinstance(value, bool) else (False, None)
    if want is int:
        if isinstance(value, int):
            return True, value
        if isinstance(value, str) and re.fullmatch(r"-?\\d+", value.strip()):
            return True, int(value.strip())
        return False, None
    if want is str:
        return (True, value) if isinstance(value, str) else (False, None)
    return False, None


def _resolve(
    spec: dict[str, dict[str, Any]],
    raw: dict[str, Any],
    errors: list[str],
    prefix: str = "",
) -> dict[str, Any]:
    """L05 recursion-by-structure: fill defaults and coerce each field."""
    out: dict[str, Any] = {}
    for key, rule in spec.items():
        path = f"{prefix}{key}"
        present = key in raw and raw[key] is not None
        match rule["type"]:
            case "nested":
                child = raw.get(key) if isinstance(raw.get(key), dict) else {}
                out[key] = _resolve(rule["fields"], child, errors, f"{path}.")
            case want:
                if not present:
                    out[key] = rule["default"]
                    continue
                ok, coerced = _coerce(raw[key], want)
                if ok:
                    out[key] = coerced
                else:
                    errors.append(f"{path}: expected {want.__name__}, used default")
                    out[key] = rule["default"]
    return out


def _flat_numbers(config: dict[str, Any]) -> Iterator[float]:
    """L16 generator: yield every numeric leaf of the resolved config."""
    for value in config.values():
        if isinstance(value, dict):
            yield from _flat_numbers(value)
        elif isinstance(value, bool):
            continue
        elif isinstance(value, (int, float)):
            yield float(value)


def validate_config(payload: str) -> dict[str, Any]:
    """Parse a JSON object string into a normalized config; never raise."""
    errors: list[str] = []
    try:
        raw = json.loads(payload)
    except (json.JSONDecodeError, TypeError):
        return {"ok": False, "config": {}, "errors": ["payload is not valid JSON"]}
    if not isinstance(raw, dict):
        return {"ok": False, "config": {}, "errors": ["payload is not a JSON object"]}

    defaults = deepcopy(SCHEMA)
    assert defaults == SCHEMA and defaults is not SCHEMA
    config = _resolve(SCHEMA, raw, errors)

    numbers = sorted(_flat_numbers(config))
    total = _rec_sum(numbers)
    rows = [
        (HighlightRow(k, len(v)) if isinstance(v, dict) else ResultRow(k, 1.0)).describe()
        for k, v in config.items()
    ]
    audit = [
        f"{i}:{name}={'dict' if isinstance(val, dict) else type(val).__name__}"
        for i, (name, val) in enumerate(zip(config.keys(), config.values()))
    ]
    _ = json.dumps({"sum": total, "fields": len(audit), "rows": len(rows)})
    return {"ok": not errors, "config": config, "errors": errors}
`),
    solutionSteps: [
      step(52, 'Declare the config schema: each field carries a type and a documented default.', 'lesson01'),
      step(67, 'Factor coercion into a helper that returns whether the value fit the type.', 'lesson05'),
      step(69, 'Boolean logic rejects a stray bool where a non-bool type is expected.', 'lesson02'),
      step(76, 'A regex full-match accepts a clean integer string before int() coercion.', 'lesson15'),
      step(84, '_resolve recurses by structure to fill defaults and coerce each field.', 'lesson05'),
      step(94, 'Presence test: a key counts only if present and not JSON null.', 'lesson02'),
      step(95, 'match/case splits nested objects from scalar fields — no dead branch.', 'lesson16'),
      step(100, 'Truthiness guard: a missing field falls back to its documented default.', 'lesson03'),
      step(103, 'Unpack the (ok, coerced) tuple to drive the accept-or-default branch.', 'lesson07'),
      step(116, 'Generator yields numeric leaves lazily, recursing into nested dicts.', 'lesson16'),
      step(126, 'try/except around json.loads turns malformed input into a safe error dict.', 'lesson10'),
      step(133, 'deepcopy the schema and assert it is equal-but-not-identical (is vs ==).', 'lesson13'),
      step(137, 'sorted orders the numeric leaves before the recursive total.', 'lesson14'),
      step(138, '_rec_sum totals the numeric leaves recursively — O(n) over the config.', 'lesson12'),
      step(140, 'Comprehension wraps each field in a ResultRow / HighlightRow object.', 'lesson11'),
      step(145, 'enumerate and zip pair field names with values for the audit table.', 'lesson14'),
    ],
    explanation:
      'The contract is defensive normalization. A schema declares every field with a type and a documented default; _resolve walks it, filling missing or null fields with defaults, coercing clean integer strings, and rejecting genuine type mismatches into an errors list. Nested objects recurse so their own missing keys get nested defaults. Crucially, malformed JSON and non-object payloads are caught and returned as `{"ok": false, ...}` rather than thrown — the difference between a logged validation error and a crashed service on deploy.',
  },
  {
    id: 'cap-exp-03',
    title: 'Log Stream Triage',
    subtitle: 'Tally hostile multi-line log text without crashing on bad lines',
    difficulty: 'expert',
    expertLens:
      'Production log streams are messy: partial lines from a torn write, blank lines, unknown levels, and free-form messages all show up. A triage pass that does line.split(" ") and unpacks three fields blows up on the first malformed line and loses the whole batch. The expert parses each line defensively, tallies what is valid, counts what is not, and always returns a summary — even for empty input.',
    topics: ['parsing', 'validation', 'robustness', 'adversarial input', 'L1–L16 synthesis'],
    lessonCoverage: buildLessonCoverage({
      lesson01: 'Build a typed summary dict and f-string audit fields from levels',
      lesson02: 'Boolean checks `parsed is not None` and blank-line `not raw.strip()`',
      lesson03: 'match/case true-vs-default branch decides valid versus bad line',
      lesson04: 'Loop the record generator once, tallying counts, bad, and total',
      lesson05: 'Factor _parse_line, _records, and triage_logs helper functions',
      lesson06: 'str.strip and splitlines normalize each raw log line',
      lesson07: 'Tuple `(ok, record)` from the generator is unpacked per line',
      lesson08: 'Dict comprehension seeds level counts; group counts by level key',
      lesson09: 'Comprehensions build the severity weights and OOP row list',
      lesson10: 'Defensive None return stands in for an exception on unparseable lines',
      lesson11: 'ResultRow / HighlightRow with super() wrap each level tally',
      lesson12: '_rec_sum totals severity-weighted load recursively — O(n) scan',
      lesson13: 'deepcopy the counts and assert it is equal-but-not-identical',
      lesson14: 'enumerate and sorted rank levels by count for the report',
      lesson15: 'Compiled regex parses LEVEL/timestamp/message; json.dumps the report',
      lesson16: 'Generator yields per-line records; match/case and type hints classify',
    }),
    description:
      'Implement `triage_logs(text)` that parses multi-line log text where lines look like `LEVEL timestamp message` but many are malformed.\n\nReturn shape: `{"counts": {level: n, ...}, "bad": int, "total": int, "report": str}`.\n\n- valid INFO / WARN / ERROR lines → tallied in `counts`\n- malformed, partial, or unknown-level lines → counted in `bad`, never crash\n- blank / whitespace-only lines → skipped entirely (not counted in `total` or `bad`)\n- empty input → safe zero-summary (`counts` all zero, `bad` and `total` zero)\n\nA naive `line.split(" ")` that unpacks three fields raises on the first partial line, so parse defensively with a regex.',
    objectives: [
      'Parse each log line with a regex and reject malformed ones safely',
      'Tally valid levels while counting unparseable lines as bad',
      'Always return a summary — even for empty or all-bad input',
    ],
    starterCode:
      'def triage_logs(text):\n    """Return {"counts", "bad", "total", "report"} from log text."""\n    pass',
    tests: [
      'r = triage_logs("INFO 2024-01-01T10:00:00 up\\nERROR 2024-01-01T10:00:01 boom\\nWARN 2024-01-01T10:00:02 slow"); assert r["counts"] == {"INFO": 1, "WARN": 1, "ERROR": 1} and r["bad"] == 0 and r["total"] == 3',
      'r = triage_logs("INFO 2024-01-01T10:00:00 ok\\ngarbage line\\nERROR\\nINFO 2024-01-01T10:00:05 fine"); assert r["counts"]["INFO"] == 2 and r["bad"] == 2 and r["total"] == 4',
      'r = triage_logs("\\n\\nINFO 2024-01-01T10:00:00 hi\\n\\n   \\n"); assert r["total"] == 1 and r["bad"] == 0 and r["counts"]["INFO"] == 1',
      'r = triage_logs(""); assert r["counts"] == {"INFO": 0, "WARN": 0, "ERROR": 0} and r["bad"] == 0 and r["total"] == 0',
      'r = triage_logs("DEBUG 2024-01-01T10:00:00 trace\\nINFO 2024-01-01T10:00:01 ok"); assert r["bad"] == 1 and set(r["counts"]) == {"INFO", "WARN", "ERROR"} and r["counts"]["INFO"] == 1',
      'r = triage_logs("ERROR 2024-01-01T10:00:00 disk full on node 7"); assert r["counts"]["ERROR"] == 1 and r["bad"] == 0',
    ],
    solution: wrapSolution(`
LEVELS = ("INFO", "WARN", "ERROR")
_LINE = re.compile(
    r"^(?P<level>[A-Z]+)\\s+(?P<ts>\\d{4}-\\d{2}-\\d{2}T[\\d:]+)\\s+(?P<msg>.+)$"
)


def _parse_line(line: str) -> dict[str, str] | None:
    """L15/L16: regex-match one log line; return fields or None if unparseable."""
    match = _LINE.match(line.strip())
    if match is None:
        return None
    level = match.group("level")
    if level not in LEVELS:
        return None
    return {"level": level, "ts": match.group("ts"), "msg": match.group("msg").strip()}


def _records(text: str) -> Iterator[tuple[bool, dict[str, str] | None]]:
    """L16 generator: yield (ok, record) for each non-blank line."""
    for raw in text.splitlines():
        if not raw.strip():
            continue
        parsed = _parse_line(raw)
        yield (parsed is not None, parsed)


def triage_logs(text: str) -> dict[str, Any]:
    """Summarize multi-line log text without crashing on malformed lines."""
    counts: dict[str, int] = {level: 0 for level in LEVELS}
    bad = 0
    total = 0
    for ok, record in _records(text):
        total += 1
        match ok:
            case True if record is not None:
                counts[record["level"]] += 1
            case _:
                bad += 1

    snapshot = deepcopy(counts)
    assert snapshot == counts and snapshot is not counts
    severity = {"INFO": 1.0, "WARN": 2.0, "ERROR": 3.0}
    weights = [severity[lvl] * n for lvl, n in counts.items()]
    load = _rec_sum(weights)

    ranked = sorted(
        enumerate(counts.items()), key=lambda t: (-t[1][1], t[1][0])
    )
    rows = [
        (HighlightRow(lvl, n) if lvl == "ERROR" else ResultRow(lvl, n)).describe()
        for lvl, n in counts.items()
    ]
    report = json.dumps(
        {
            "load": load,
            "top": ranked[0][1][0] if ranked else "",
            "rows": len(rows),
        }
    )
    return {
        "counts": counts,
        "bad": bad,
        "total": total,
        "report": report,
    }
`),
    solutionSteps: [
      step(52, 'Name the valid levels; anything else is triaged as bad.', 'lesson01'),
      step(53, 'Compile a regex for LEVEL / ISO-timestamp / message once, up front.', 'lesson15'),
      step(58, 'Factor single-line parsing into a helper returning fields or None.', 'lesson05'),
      step(64, 'Reject an unknown level — partial or junk lines parse to None.', 'lesson03'),
      step(69, 'Generator yields one (ok, record) tuple per non-blank line.', 'lesson16'),
      step(72, 'Skip blank or whitespace-only lines — they never reach the tally.', 'lesson02'),
      step(78, 'Define triage_logs with type hints on input and the summary return.', 'lesson01'),
      step(80, 'Dict comprehension seeds every level count at zero.', 'lesson08'),
      step(83, 'Loop the record stream once, unpacking the (ok, record) tuple.', 'lesson07'),
      step(85, 'match/case routes valid lines to their level and the rest to bad.', 'lesson16'),
      step(91, 'deepcopy the counts and assert it is equal-but-not-identical (is vs ==).', 'lesson13'),
      step(94, 'Comprehension builds severity-weighted load per level.', 'lesson09'),
      step(95, '_rec_sum totals the weighted load recursively — an O(n) scan.', 'lesson12'),
      step(97, 'enumerate and sorted rank levels by descending count for the report.', 'lesson14'),
      step(101, 'Wrap each level tally in a ResultRow / HighlightRow object.', 'lesson11'),
      step(104, 'json.dumps serializes the load, top level, and row count audit.', 'lesson15'),
    ],
    explanation:
      'Triage means: extract signal, isolate noise, never crash. A compiled regex parses each line into LEVEL/timestamp/message; unknown levels and partial lines parse to None and are tallied as bad, while blank lines are skipped before they ever count. Valid INFO/WARN/ERROR lines are grouped by level. Because every line is guarded — no bare split-and-unpack — empty or all-malformed input still returns a complete zero-or-partial summary instead of throwing, which is exactly what a log pipeline needs to keep running through a bad batch.',
  },
  {
    id: 'cap-exp-04',
    title: 'Messy Metrics Aggregator',
    subtitle: 'Coerce hostile values into safe summary stats without dividing by zero',
    difficulty: 'expert',
    expertLens:
      'Real metric feeds are filthy: "$1,200" with a currency sign, " 42 " with stray whitespace, the literal string "NaN", empty strings, None, and the occasional genuine number all arrive in one list. A naive sum(values)/len(values) throws a TypeError on the first string and a ZeroDivisionError when nothing parses. The expert coerces what is salvageable, drops what is not, and always returns a summary — never a stack trace.',
    topics: ['validation', 'numbers', 'robustness', 'adversarial input', 'L1–L16 synthesis'],
    lessonCoverage: buildLessonCoverage({
      lesson01: 'Type hints (Any, float, Iterator) and a keyed summary dict shape the contract',
      lesson02: 'Boolean guards `not text or not re.fullmatch(...)` and `if not numbers` short-circuit',
      lesson03: 'if/isinstance branches route bool, numeric, string, and other values differently',
      lesson04: 'Loop the value list once inside the generator, coercing each element',
      lesson05: 'Factor _to_number, _clean_token, _valid_numbers, and aggregate helpers',
      lesson06: 'str.strip, lstrip("$"), and replace(",") clean each numeric token',
      lesson07: 'Tuple unpacking `low, high = ordered[0], ordered[-1]` reads both ends at once',
      lesson08: 'Assemble the summary dict keyed by count, mean, max, min, and dropped',
      lesson09: 'Comprehensions materialize the valid-number list and the OOP row list',
      lesson10: 'Defensive None return stands in for an exception on unparseable values',
      lesson11: 'ResultRow / HighlightRow with super() wrap each ordered value',
      lesson12: '_rec_sum totals the valid numbers recursively — an O(n) scan',
      lesson13: 'deepcopy the ordered list and assert it is equal-but-not-identical',
      lesson14: 'enumerate and sorted with a key rank the values by magnitude',
      lesson15: 'A regex full-match coerces numeric strings; json.dumps emits the audit',
      lesson16: 'Generator yields each coercible value lazily; match/case-free type guards classify',
    }),
    description:
      'Implement `aggregate(values)` that takes a list of messy values and returns safe summary statistics.\n\nReturn shape: `{"count": int, "mean": float | None, "max": num | None, "min": num | None, "dropped": int}`.\n\nThe input is hostile:\n- coercible strings like `"$1,200"`, `"  42 "` → strip currency/commas/whitespace and parse\n- unparseable junk like `"NaN"`, `""`, `None`, `"abc"`, float `nan`, and bools → dropped\n- plain ints, floats, and negatives → kept as numbers\n- zero valid values (empty list or all-bad) → safe `count: 0` with `None` stats, NEVER a ZeroDivisionError\n\nA naive `sum(values)/len(values)` raises a TypeError on the first string and a ZeroDivisionError on empty input, so coerce defensively and count what you drop.',
    objectives: [
      'Coerce salvageable strings to numbers and drop the rest',
      'Compute mean, min, and max only over valid values',
      'Return safe zeros/None for empty or all-bad input — never divide by zero',
    ],
    starterCode:
      'def aggregate(values):\n    """Return {"count", "mean", "max", "min", "dropped"} from messy values."""\n    pass',
    tests: [
      'r = aggregate(["10", "20", "30"]); assert r["count"] == 3 and r["mean"] == 20.0 and r["max"] == 30.0 and r["min"] == 10.0 and r["dropped"] == 0',
      'r = aggregate(["$1,200", "  42 ", "NaN", "", None, "abc", 8, 2.5, -3]); assert r["count"] == 5 and r["dropped"] == 4 and r["max"] == 1200.0 and r["min"] == -3.0',
      'r = aggregate([]); assert r["count"] == 0 and r["mean"] is None and r["max"] is None and r["min"] is None and r["dropped"] == 0',
      'r = aggregate(["NaN", "", None, "oops", float("nan")]); assert r["count"] == 0 and r["mean"] is None and r["dropped"] == 5',
      'r = aggregate(["$1,200", "300"]); assert r["count"] == 2 and r["mean"] == 750.0 and r["max"] == 1200.0 and r["min"] == 300.0',
      'r = aggregate([True, False, "5", 5]); assert r["count"] == 2 and r["max"] == 5.0 and r["min"] == 5.0 and r["dropped"] == 2',
    ],
    solution: wrapSolution(`
def _to_number(value: Any) -> float | None:
    """L02/L03/L06: coerce one messy value to a float, or None if hopeless."""
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return None if math.isnan(value) else float(value)
    if not isinstance(value, str):
        return None
    text = _clean_token(value)
    if not text or not re.fullmatch(r"-?\\d+(?:\\.\\d+)?", text):
        return None
    return float(text)


def _clean_token(value: str) -> str:
    """L06: strip whitespace, currency, and thousands separators from a token."""
    return value.strip().lstrip("$").replace(",", "").strip()


def _valid_numbers(values: list) -> Iterator[float]:
    """L16 generator: yield each value that survives coercion, lazily."""
    for value in values:
        number = _to_number(value)
        if number is not None:
            yield number


def aggregate(values: list) -> dict[str, Any]:
    """Summarize a list of messy values without ever dividing by zero."""
    numbers = [n for n in _valid_numbers(values)]
    dropped = len(values) - len(numbers)
    if not numbers:
        return {"count": 0, "mean": None, "max": None, "min": None, "dropped": dropped}

    ordered = sorted(numbers)
    total = _rec_sum(ordered)
    mean = total / len(ordered)
    low, high = ordered[0], ordered[-1]

    snapshot = deepcopy(ordered)
    assert snapshot == ordered and snapshot is not ordered

    rows = [
        (HighlightRow("value", n) if n == high else ResultRow("value", n)).describe()
        for n in ordered
    ]
    ranked = sorted(enumerate(ordered), key=lambda t: (-t[1], t[0]))
    audit_ok = bool(re.fullmatch(r"-?\\d+(?:\\.\\d+)?", str(round(mean, 2))))
    _ = json.dumps(
        {
            "n": len(ordered),
            "sum": round(total, 4),
            "top": ranked[0][1],
            "rows": len(rows),
            "clean": audit_ok,
        }
    )

    return {
        "count": len(ordered),
        "mean": mean,
        "max": high,
        "min": low,
        "dropped": dropped,
    }
`),
    solutionSteps: [
      step(52, 'Define the coercion helper with Any input and a float-or-None return hint.', 'lesson01'),
      step(54, 'isinstance branches route bool, numeric, string, and other values apart.', 'lesson03'),
      step(57, 'Drop a float nan up front so it never poisons the mean.', 'lesson02'),
      step(60, 'Clean the token, then a regex full-match gates whether it is numeric.', 'lesson15'),
      step(66, 'Factor token cleaning into its own helper — strip, drop "$", drop commas.', 'lesson06'),
      step(71, 'A generator yields only the values that survive coercion, lazily.', 'lesson16'),
      step(73, 'Loop the raw value list once, coercing each element in turn.', 'lesson04'),
      step(76, 'yield None-free numbers — the defensive return replaces a raised error.', 'lesson10'),
      step(79, 'Define aggregate with full type hints on input and the summary return.', 'lesson01'),
      step(81, 'Comprehension materializes the surviving numbers from the generator.', 'lesson09'),
      step(83, 'Guard the empty case: no valid values returns safe None stats, no divide.', 'lesson02'),
      step(87, '_rec_sum totals the valid numbers recursively — an O(n) scan.', 'lesson12'),
      step(89, 'Tuple unpacking reads the min and max ends of the sorted list at once.', 'lesson07'),
      step(91, 'deepcopy the ordered list and assert it is equal-but-not-identical (is vs ==).', 'lesson13'),
      step(94, 'Comprehension wraps each value in a ResultRow / HighlightRow object.', 'lesson11'),
      step(98, 'enumerate and sorted with a key rank the values by magnitude.', 'lesson14'),
      step(111, 'Assemble the summary dict keyed by count, mean, max, min, and dropped.', 'lesson08'),
    ],
    explanation:
      'The contract is safe aggregation over dirty input. _to_number coerces what it reasonably can — stripping currency signs, thousands commas, and whitespace before a regex gate — and returns None for anything hopeless, so the generator simply drops it and the caller counts the drops. Crucially, the empty-or-all-bad case returns count 0 with None statistics instead of dividing by len 0, and a stray float nan is filtered before it can corrupt the mean. That is the difference between a metrics pass that degrades gracefully on a bad batch and one that takes down the dashboard.',
  },
  {
    id: 'cap-exp-05',
    title: 'Form Field Validator',
    subtitle: 'Validate and normalize hostile form fields, collecting every error at once',
    difficulty: 'expert',
    expertLens:
      'A signup form arrives with a mixed-case email padded with spaces, a date in the wrong format, a phone number wearing parentheses and dashes, and a missing field or two. A validator that returns on the first failure forces the user through one round-trip per mistake. The expert validates every field with re, normalizes the good ones, and reports ALL errors in a single pass — the difference between one helpful form and five frustrating resubmissions.',
    topics: ['regex', 'validation', 'robustness', 'adversarial input', 'L1–L16 synthesis'],
    lessonCoverage: buildLessonCoverage({
      lesson01: 'Type hints and an f-string reason like `invalid {name}` tag each field',
      lesson02: 'Boolean guards `raw is None or (... not raw.strip())` decide presence',
      lesson03: 'if/elif branches split valid fields from the error dict per result',
      lesson04: 'Loop the field-result stream once, sorting each into normalized or errors',
      lesson05: 'Factor _check_email, _check_date, _check_phone, _field_results, validate_form',
      lesson06: 'str.strip, lower, and re.sub normalize each raw field before checking',
      lesson07: 'Tuple `(ok, cleaned)` per check and 4-tuple per field are unpacked',
      lesson08: 'Dict comprehension rebuilds the normalized output in declared field order',
      lesson09: 'Comprehensions build the length table and the OOP row list',
      lesson10: 'Defensive non-string and missing guards stand in for raised exceptions',
      lesson11: 'ResultRow / HighlightRow with super() wrap each field outcome',
      lesson12: '_rec_sum totals normalized value lengths recursively — an O(n) scan',
      lesson13: 'deepcopy the errors dict and assert it is equal-but-not-identical',
      lesson14: 'enumerate and sorted with a key order the required field names',
      lesson15: 'Compiled regex validates email, date, and phone; json.dumps the audit',
      lesson16: 'Generator yields a (name, ok, value, reason) tuple per required field',
    }),
    description:
      'Implement `validate_form(fields)` that validates and normalizes a dict of form fields (`email`, `date` as YYYY-MM-DD, `phone`).\n\nReturn shape: `{"ok": bool, "normalized": {...}, "errors": {field: reason, ...}}`.\n\nValidate every field and collect ALL errors:\n- `email` → trim, lowercase, regex-match; otherwise an error\n- `date` → match YYYY-MM-DD and a sane month/day range; otherwise an error\n- `phone` → strip formatting to bare digits and require exactly ten; otherwise an error\n- a missing or blank required field → an error, not a crash\n- a fully valid form → `ok: true` with the normalized values\n\nA naive validator that returns on the first error hides the rest, so collect every field error into the errors dict before returning.',
    objectives: [
      'Validate email, date, and phone with regex and normalize the good ones',
      'Collect ALL field errors in one pass, not just the first',
      'Report missing and malformed fields without ever raising',
    ],
    starterCode:
      'def validate_form(fields):\n    """Return {"ok", "normalized", "errors"} from a form dict."""\n    pass',
    tests: [
      'r = validate_form({"email": "  ALICE@Example.COM ", "date": "2024-01-15", "phone": "(555) 123-4567"}); assert r["ok"] is True and r["normalized"] == {"email": "alice@example.com", "date": "2024-01-15", "phone": "5551234567"} and r["errors"] == {}',
      'r = validate_form({"email": "not-an-email", "date": "15/01/2024", "phone": "abc"}); assert r["ok"] is False and set(r["errors"]) == {"email", "date", "phone"}',
      'r = validate_form({"email": "bob@site.io", "date": "2024-12-31"}); assert r["ok"] is False and r["errors"]["phone"] == "missing required field"',
      'r = validate_form({"email": "  ", "date": "2024-06-01", "phone": "5559998888"}); assert r["ok"] is False and r["errors"]["email"] == "missing required field" and r["normalized"]["date"] == "2024-06-01" and r["normalized"]["phone"] == "5559998888"',
      'r = validate_form({"email": "c@d.co", "date": "2024-13-01", "phone": "1234567890"}); assert r["ok"] is False and "date" in r["errors"]',
    ],
    solution: wrapSolution(`
REQUIRED = ("email", "date", "phone")
_EMAIL = re.compile(r"^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$")
_DATE = re.compile(r"^(\\d{4})-(\\d{2})-(\\d{2})$")
_PHONE = re.compile(r"^\\d{10}$")


def _check_email(value: str) -> tuple[bool, str]:
    """L06/L15: lowercase and trim, then regex-validate an email address."""
    cleaned = value.strip().lower()
    return bool(_EMAIL.fullmatch(cleaned)), cleaned


def _check_date(value: str) -> tuple[bool, str]:
    """L02/L15: validate a YYYY-MM-DD date by format and calendar range."""
    cleaned = value.strip()
    match = _DATE.fullmatch(cleaned)
    if match is None:
        return False, cleaned
    _, month, day = (int(g) for g in match.groups())
    ok = 1 <= month <= 12 and 1 <= day <= 31
    return ok, cleaned


def _check_phone(value: str) -> tuple[bool, str]:
    """L06/L15: strip formatting to bare digits, then require exactly ten."""
    digits = re.sub(r"[\\s().+-]", "", value.strip())
    return bool(_PHONE.fullmatch(digits)), digits


_CHECKS: dict[str, Any] = {
    "email": _check_email,
    "date": _check_date,
    "phone": _check_phone,
}


def _field_results(fields: dict) -> Iterator[tuple[str, bool, str, str]]:
    """L16 generator: yield (name, ok, value, reason) for every required field."""
    for name in REQUIRED:
        raw = fields.get(name)
        if raw is None or (isinstance(raw, str) and not raw.strip()):
            yield (name, False, "", "missing required field")
            continue
        if not isinstance(raw, str):
            yield (name, False, "", "must be a string")
            continue
        ok, cleaned = _CHECKS[name](raw)
        yield (name, ok, cleaned, "" if ok else f"invalid {name}")


def validate_form(fields: dict) -> dict[str, Any]:
    """Validate and normalize a form dict, collecting ALL field errors."""
    normalized: dict[str, str] = {}
    errors: dict[str, str] = {}
    for name, ok, value, reason in _field_results(fields):
        if ok:
            normalized[name] = value
        else:
            errors[name] = reason

    snapshot = deepcopy(errors)
    assert snapshot == errors and snapshot is not errors

    lengths = [float(len(v)) for v in normalized.values()]
    span = _rec_sum(lengths)
    ranked = sorted(enumerate(REQUIRED), key=lambda t: (t[1], t[0]))
    rows = [
        (HighlightRow(name, 1.0) if name in errors else ResultRow(name, 0.0)).describe()
        for name in REQUIRED
    ]
    _ = json.dumps(
        {
            "ok_fields": len(normalized),
            "bad_fields": len(errors),
            "span": span,
            "first": ranked[0][1],
            "rows": len(rows),
        }
    )
    normalized_out = {key: normalized[key] for key in REQUIRED if key in normalized}

    return {
        "ok": not errors,
        "normalized": normalized_out,
        "errors": errors,
    }
`),
    solutionSteps: [
      step(52, 'Name the required fields and compile a regex for each field type once.', 'lesson15'),
      step(58, 'Factor email validation: trim, lowercase, then regex full-match.', 'lesson06'),
      step(64, 'Validate the date by both format and a sane month/day range.', 'lesson02'),
      step(70, 'Unpack the regex groups into year, month, day as ints.', 'lesson07'),
      step(75, 'Strip phone formatting to bare digits with re.sub before the length check.', 'lesson06'),
      step(88, 'A generator yields a (name, ok, value, reason) tuple per required field.', 'lesson16'),
      step(92, 'Boolean guard treats a missing or blank field as absent, not a crash.', 'lesson02'),
      step(95, 'Defensive non-string guard stands in for a raised type error.', 'lesson10'),
      step(99, 'Tag a failed check with an f-string reason naming the field.', 'lesson01'),
      step(102, 'Define validate_form with type hints on the form dict and result.', 'lesson01'),
      step(106, 'Loop the field-result stream once, sorting each into normalized or errors.', 'lesson04'),
      step(112, 'deepcopy the errors dict and assert it is equal-but-not-identical (is vs ==).', 'lesson13'),
      step(115, 'Comprehension totals normalized value lengths for the recursive span.', 'lesson09'),
      step(116, '_rec_sum totals the lengths recursively — an O(n) scan.', 'lesson12'),
      step(117, 'enumerate and sorted with a key order the required field names.', 'lesson14'),
      step(118, 'Comprehension wraps each field outcome in a ResultRow / HighlightRow.', 'lesson11'),
      step(131, 'Dict comprehension rebuilds the normalized output in declared field order.', 'lesson08'),
    ],
    explanation:
      'The contract is collect-all-errors validation. Each field gets its own re-backed check — email is trimmed and lowercased, the date is matched against YYYY-MM-DD and a calendar range, the phone is stripped to bare digits and required to be exactly ten. The generator yields one outcome per required field, and validate_form sorts every outcome into either the normalized dict or the errors dict in a single pass, so a form with three mistakes reports three errors rather than one. Missing and non-string fields are guarded rather than raised, and a fully valid form returns ok with normalized values — exactly the feedback a real signup form owes its users.',
  },
  {
    id: 'cap-exp-06',
    title: 'Two-Source Reconciler',
    subtitle: 'Merge two hostile record feeds by id with deterministic conflict resolution',
    difficulty: 'expert',
    expertLens:
      'Two systems describe the same entities and disagree: an id lives in only one feed, the same id appears twice in one batch, and a field holds different values across sources. A naive `{**a, **b}` merge silently picks a winner by argument order, loses every conflict, and crashes the moment a record is missing its id or is not even a dict. The expert keys both sources, resolves duplicates and conflicts by a documented rule (last-write within a source, primary wins across sources), records every conflict for audit, skips the garbage, and returns a stable, sorted result — the difference between a trustworthy merge and quiet data corruption.',
    topics: ['merging', 'validation', 'reconciliation', 'robustness', 'adversarial input', 'L1–L16 synthesis'],
    lessonCoverage: buildLessonCoverage({
      lesson01: 'Type hints (Any, Iterator, dict[str, Any]) and a documented return-shape dict define the contract',
      lesson02: 'Boolean logic `not isinstance(record, dict) or id_field not in record` decides record validity',
      lesson03: 'Conditional expression routes a hashable id through or returns None for a bad one',
      lesson04: 'Loop each source list once to index records by their id key',
      lesson05: 'Factor _key_of, _index_source, _merged_records, and reconcile helper functions',
      lesson06: 'str() coercion of ids and type names builds the sort key and OOP row labels',
      lesson07: 'Tuple unpacking `p_index, p_bad = _index_source(...)` and `(in_p, in_s)` reads pairs at once',
      lesson08: 'Set union `set(primary) | set(secondary)` collects all ids; dicts index each source',
      lesson09: 'Comprehensions build the merged list, conflicting-field list, and OOP row list',
      lesson10: 'Defensive None/skip on missing-id or non-dict records stands in for a raised exception',
      lesson11: 'ResultRow / HighlightRow with super() wrap each merged record for the audit',
      lesson12: '_rec_sum totals merged-record widths recursively — an O(n) scan over the result',
      lesson13: 'deepcopy a record before mutation and assert it is equal-but-not-identical',
      lesson14: 'enumerate and sorted with a key rank merged records and order ids deterministically',
      lesson15: 'json.dumps emits the reconciliation report; re.fullmatch audits its shape',
      lesson16: 'Generator yields (id, merged record) per key; match/case and type hints classify presence',
    }),
    description:
      'Implement `reconcile(primary, secondary)` that merges two lists of dict records keyed by their `"id"` field.\n\nReturn shape: `{"merged": [...sorted by id...], "conflicts": [...], "skipped": int}`.\n\nThe two feeds are adversarial:\n- a record present in only ONE source → included as-is\n- a DUPLICATE id within a source → last occurrence wins (deterministic)\n- a field with CONFLICTING values for the same id across sources → primary wins, and the conflict is recorded in `conflicts` as `{"id", "field", "primary", "secondary"}`\n- a record missing the `"id"` key, or a non-dict entry → skipped and counted in `skipped`, never a crash\n- `merged` is always returned sorted by id for deterministic output\n\nA naive `{**a, **b}` dict-merge silently drops conflicts, ignores ordering, and raises on the first bad record, so key both sources and resolve every case explicitly.',
    objectives: [
      'Key both sources by id, resolving duplicates by last-write and cross-source conflicts by primary-wins',
      'Record every cross-source field conflict in a structured report',
      'Skip missing-id and non-dict records without crashing, and return merged sorted by id',
    ],
    starterCode:
      'def reconcile(primary, secondary):\n    """Return {"merged", "conflicts", "skipped"} from two record feeds."""\n    pass',
    tests: [
      'r = reconcile([{"id": 1, "a": "x"}], [{"id": 2, "b": "y"}]); assert [rec["id"] for rec in r["merged"]] == [1, 2] and r["conflicts"] == [] and r["skipped"] == 0',
      'r = reconcile([{"id": 1, "v": "first"}, {"id": 1, "v": "second"}], []); assert len(r["merged"]) == 1 and r["merged"][0]["v"] == "second"',
      'r = reconcile([{"id": 1, "status": "active"}], [{"id": 1, "status": "stale", "extra": "keep"}]); m = r["merged"][0]; assert m["status"] == "active" and m["extra"] == "keep" and r["conflicts"] == [{"id": 1, "field": "status", "primary": "active", "secondary": "stale"}]',
      'r = reconcile([{"id": 1, "a": 1}, {"no_id": True}, "junk", 42, None], [{"id": 1, "a": 1}, {"id": 2}]); assert r["skipped"] == 4 and [rec["id"] for rec in r["merged"]] == [1, 2] and r["conflicts"] == []',
      'r = reconcile([{"id": 3}, {"id": 1}], [{"id": 2}]); assert [rec["id"] for rec in r["merged"]] == [1, 2, 3]',
    ],
    solution: wrapSolution(`
def _key_of(record: Any, id_field: str) -> Any:
    """L02/L03: return a hashable id for a valid dict record, else None."""
    if not isinstance(record, dict) or id_field not in record:
        return None
    candidate = record[id_field]
    return candidate if isinstance(candidate, (str, int)) else None


def _index_source(records: list, id_field: str) -> tuple[dict, int]:
    """L05: index one source by id; last duplicate wins, bad records counted."""
    indexed: dict[Any, dict] = {}
    bad = 0
    for record in records:
        key = _key_of(record, id_field)
        if key is None:
            bad += 1
            continue
        indexed[key] = record
    return indexed, bad


def _merged_records(
    primary: dict, secondary: dict, conflicts: list
) -> Iterator[tuple[Any, dict]]:
    """L16 generator: yield (id, merged record) for every key across sources."""
    for key in sorted(set(primary) | set(secondary), key=lambda k: (str(type(k).__name__), k)):
        in_p = key in primary
        in_s = key in secondary
        match (in_p, in_s):
            case (True, True):
                base = deepcopy(secondary[key])
                snapshot = deepcopy(base)
                assert snapshot == base and snapshot is not base
                fields = [f for f in base if f in primary[key] and primary[key][f] != base[f]]
                for field in sorted(fields):
                    conflicts.append(
                        {"id": key, "field": field,
                         "primary": primary[key][field], "secondary": base[field]}
                    )
                base.update(primary[key])
                yield key, base
            case (True, False):
                yield key, dict(primary[key])
            case _:
                yield key, dict(secondary[key])


def reconcile(primary: list, secondary: list) -> dict[str, Any]:
    """Merge two sources of dict records by id; primary wins conflicts."""
    id_field = "id"
    p_index, p_bad = _index_source(primary, id_field)
    s_index, s_bad = _index_source(secondary, id_field)
    conflicts: list[dict] = []

    merged = [record for _, record in _merged_records(p_index, s_index, conflicts)]
    skipped = p_bad + s_bad

    lengths = [float(len(record)) for record in merged]
    span = _rec_sum(lengths)
    ranked = sorted(
        enumerate(merged), key=lambda t: (len(t[1]), t[0]), reverse=True
    )
    rows = [
        (HighlightRow(str(rec.get(id_field, "?")), float(len(rec)))
         if i == 0 else ResultRow(str(rec.get(id_field, "?")), float(len(rec)))).describe()
        for i, rec in enumerate(merged)
    ]
    report = json.dumps(
        {
            "merged": len(merged),
            "conflicts": len(conflicts),
            "skipped": skipped,
            "span": span,
            "widest": ranked[0][0] if ranked else -1,
            "rows": len(rows),
        }
    )
    _ = report if bool(re.fullmatch(r"\\{.*\\}", report)) else ""

    return {
        "merged": merged,
        "conflicts": conflicts,
        "skipped": skipped,
    }
`),
    solutionSteps: [
      step(52, 'Define the id extractor with Any input and an Any-or-None return hint.', 'lesson01'),
      step(54, 'Boolean guard: a non-dict entry or one missing the id key has no usable id.', 'lesson02'),
      step(57, 'Conditional expression returns a hashable id or None for an unhashable one.', 'lesson03'),
      step(60, 'Factor source indexing into its own helper returning the index and bad count.', 'lesson05'),
      step(64, 'Loop one source list once, indexing each record by its id.', 'lesson04'),
      step(69, 'Last write wins: a duplicate id overwrites the earlier record deterministically.', 'lesson08'),
      step(73, 'Generator yields one (id, merged record) tuple per key across both sources.', 'lesson16'),
      step(77, 'Set union collects every id, sorted for deterministic output ordering.', 'lesson08'),
      step(80, 'match/case routes a key by whether it is in both sources, only primary, or only secondary.', 'lesson16'),
      step(83, 'deepcopy the secondary record before mutation and assert equal-but-not-identical.', 'lesson13'),
      step(85, 'Comprehension finds the fields whose values genuinely conflict across sources.', 'lesson09'),
      step(91, 'Primary wins: update the copy with primary fields after recording each conflict.', 'lesson07'),
      step(99, 'Define reconcile with full type hints on inputs and the documented return shape.', 'lesson01'),
      step(102, 'Tuple unpacking reads the index and bad count from each source at once.', 'lesson07'),
      step(110, '_rec_sum totals merged-record widths recursively — an O(n) scan.', 'lesson12'),
      step(114, 'enumerate and sorted rank merged records by width and id; str() builds row labels.', 'lesson14'),
      step(129, 'json.dumps emits the report and re.fullmatch audits its JSON-object shape.', 'lesson15'),
    ],
    explanation:
      'Reconciliation is a discipline of explicit rules. Both feeds are keyed by id with _index_source, where a duplicate id resolves to the last write — a documented, deterministic choice rather than an accident of ordering. The generator walks the union of ids in sorted order so the output is stable, and a match/case splits each id into present-in-both, primary-only, or secondary-only. When both sources carry the same id, every genuinely differing field is recorded in the conflicts report and then primary wins the merge, so disagreements are surfaced instead of silently overwritten. Records missing an id or that are not dicts are skipped and counted, never raised. The result — merged sorted by id, a structured conflict log, and a skipped count — is exactly the auditable output a real two-source data integration owes its operators, and precisely what a naive `{**a, **b}` merge cannot deliver.',
  },
];
