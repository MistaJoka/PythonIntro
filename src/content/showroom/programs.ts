import type { ShowroomProgram } from './schema';

export const SHOWROOM_PROGRAMS: ShowroomProgram[] = [
  // ── 1: Word Frequency Counter ──────────────────────────────────
  {
    id: 'word-freq',
    title: 'Word Frequency Counter',
    description:
      'Count and rank words in any text using Counter, generator expressions, and f-string format specs.',
    difficulty: 'intermediate',
    techniques: ['Counter', 'generator expression', 'yield from', 'f-string specs', 'set lookup'],
    code: `from collections import Counter
from typing import Iterator

STOP_WORDS = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for"}

def tokenize(text: str) -> Iterator[str]:
    yield from (
        word.lower().strip(".,!?;:\\"'")
        for word in text.split()
        if word.lower().strip(".,!?;:\\"'") not in STOP_WORDS
    )

def word_frequency(text: str, top_n: int = 10) -> list[tuple[str, int]]:
    counts = Counter(tokenize(text))
    return counts.most_common(top_n)

def format_report(text: str, top_n: int = 10) -> str:
    results = word_frequency(text, top_n)
    if not results:
        return "No words found."
    max_count = results[0][1]
    width = len(str(max_count))
    lines = [f"{'Word':<20} {'Count':>{width}}"]
    lines.append("-" * (21 + width))
    for word, count in results:
        bar = "\\u2588" * int(count / max_count * 10)
        lines.append(f"{word:<20} {count:>{width}}  {bar}")
    return "\\n".join(lines)

if __name__ == "__main__":
    sample = "Python is great Python makes learning fun Python is powerful"
    print(format_report(sample))`,
    annotations: [
      {
        afterLine: 4,
        technique: 'Set literal for O(1) lookup',
        explanation:
          'STOP_WORDS is a set, not a list. The "not in" check is O(1) for a set regardless of size — iterating a list to find membership is O(n) and slows down with each word added.',
      },
      {
        afterLine: 11,
        technique: 'Generator expression + yield from',
        explanation:
          'yield from delegates to an inner generator expression, producing one cleaned word at a time. No list is ever built in memory — the caller receives words lazily, one per iteration.',
      },
      {
        afterLine: 15,
        technique: 'Counter',
        explanation:
          'Counter(iterable) consumes the generator in one pass and tallies frequencies. most_common(n) returns the top N using a heap internally — O(n log k) rather than a full sort.',
      },
      {
        afterLine: 23,
        technique: 'f-string format specs',
        explanation:
          ':<20 left-pads a string into a 20-char field; :>{width} right-aligns into a dynamic width. Both specs live inside the same f-string expression, building an aligned text table without any manual padding.',
      },
    ],
  },

  // ── 2: Apache Log Parser ───────────────────────────────────────
  {
    id: 'log-parser',
    title: 'Apache Log Parser',
    description:
      'Extract IPs, status codes, and paths from Apache access logs using regex named groups and defaultdict.',
    difficulty: 'advanced',
    techniques: ['regex', 'named groups', 'defaultdict', 'exception handling', 'type hints'],
    code: `import re
from collections import defaultdict
from typing import Optional

LOG_PATTERN = re.compile(
    r'(?P<ip>\\d+\\.\\d+\\.\\d+\\.\\d+) - - '
    r'\\[(?P<date>[^\\]]+)\\] '
    r'"(?P<method>\\w+) (?P<path>[^ ]+) [^"]+" '
    r'(?P<status>\\d{3}) '
    r'(?P<size>\\d+|-)'
)

def parse_line(line: str) -> Optional[dict]:
    match = LOG_PATTERN.match(line.strip())
    if not match:
        return None
    entry = match.groupdict()
    entry["status"] = int(entry["status"])
    entry["size"] = int(entry["size"]) if entry["size"] != "-" else 0
    return entry

def analyze_log(lines: list[str]) -> dict:
    errors: dict[int, int] = defaultdict(int)
    ip_hits: dict[str, int] = defaultdict(int)
    path_hits: dict[str, int] = defaultdict(int)
    failures = 0
    for line in lines:
        try:
            entry = parse_line(line)
        except Exception:
            failures += 1
            continue
        if entry is None:
            failures += 1
            continue
        if entry["status"] >= 400:
            errors[entry["status"]] += 1
        ip_hits[entry["ip"]] += 1
        path_hits[entry["path"]] += 1
    top_ips = sorted(ip_hits.items(), key=lambda t: t[1], reverse=True)[:5]
    top_paths = sorted(path_hits.items(), key=lambda t: t[1], reverse=True)[:5]
    return {"errors": dict(errors), "top_ips": top_ips, "top_paths": top_paths, "failures": failures}`,
    annotations: [
      {
        afterLine: 10,
        technique: 'Regex named groups (?P<name>...)',
        explanation:
          '(?P<name>...) creates named capture groups inside the pattern. match.groupdict() then returns a clean dict keyed by those names — no more match.group(1), match.group(2) positional guessing.',
      },
      {
        afterLine: 18,
        technique: 'groupdict() for structured extraction',
        explanation:
          'groupdict() collects every named group into one dict in a single call. This lets you treat a regex match like a data record: entry["ip"], entry["status"] — readable and refactor-safe.',
      },
      {
        afterLine: 22,
        technique: 'defaultdict(int)',
        explanation:
          'defaultdict(int) returns 0 for any missing key automatically. errors[404] += 1 works on the very first encounter with no KeyError and no "if key not in dict" guard needed.',
      },
      {
        afterLine: 31,
        technique: 'Targeted exception handling',
        explanation:
          'Catching Exception (not bare except) around per-line parsing means one malformed line cannot abort the entire log scan. Failures are counted and the loop continues — a resilient batch-processing pattern.',
      },
    ],
  },

  // ── 3: CSV Budget Tracker ──────────────────────────────────────
  {
    id: 'csv-budget',
    title: 'CSV Budget Tracker',
    description:
      'Parse monthly CSV exports and summarize spending by category using dataclasses and @property.',
    difficulty: 'intermediate',
    techniques: ['@dataclass', '@property', '__post_init__', 'csv module', 'list comprehension'],
    code: `import csv
from dataclasses import dataclass, field
from typing import ClassVar

@dataclass
class Transaction:
    description: str
    amount: float
    category: str
    CATEGORIES: ClassVar[set[str]] = {"food", "transport", "utilities", "entertainment", "other"}

    def __post_init__(self) -> None:
        if self.category not in self.CATEGORIES:
            self.category = "other"
        self.amount = round(float(self.amount), 2)

    @property
    def is_expense(self) -> bool:
        return self.amount < 0

    @property
    def label(self) -> str:
        sign = "\\u2212" if self.is_expense else "+"
        return f"{sign}\${abs(self.amount):.2f}  {self.description}"

def load_transactions(path: str) -> list[Transaction]:
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        return [
            Transaction(
                description=row["description"],
                amount=float(row["amount"]),
                category=row["category"],
            )
            for row in reader
        ]

def summarize(transactions: list[Transaction]) -> dict[str, float]:
    totals: dict[str, float] = {}
    for txn in transactions:
        if txn.is_expense:
            totals[txn.category] = totals.get(txn.category, 0.0) + abs(txn.amount)
    return dict(sorted(totals.items(), key=lambda t: t[1], reverse=True))`,
    annotations: [
      {
        afterLine: 5,
        technique: '@dataclass',
        explanation:
          '@dataclass auto-generates __init__, __repr__, and __eq__ from the annotated class fields. No boilerplate constructor to write — adding a new field just means adding one line to the class body.',
      },
      {
        afterLine: 15,
        technique: '__post_init__',
        explanation:
          "__post_init__ runs immediately after the generated __init__ completes. It's the correct place to validate or normalize fields — overriding __init__ directly would lose the auto-generated version.",
      },
      {
        afterLine: 19,
        technique: '@property',
        explanation:
          '@property makes is_expense look like a data attribute to callers (txn.is_expense, not txn.is_expense()). The distinction matters: properties express "what the object is", methods express "what it does".',
      },
      {
        afterLine: 30,
        technique: 'List comprehension over DictReader',
        explanation:
          'csv.DictReader yields one dict per row using the header row as keys. The comprehension translates each dict into a typed Transaction object in a single readable expression — no append loop needed.',
      },
    ],
  },

  // ── 4: File Tree Walker ────────────────────────────────────────
  {
    id: 'file-tree',
    title: 'File Tree Walker',
    description:
      'Recursively yield a formatted directory tree using a generator function, pathlib, and yield from.',
    difficulty: 'advanced',
    techniques: ['yield', 'yield from', 'generator function', 'pathlib', 'recursion', 'type hints'],
    code: `from pathlib import Path
from typing import Generator

def walk_tree(
    root: Path,
    *,
    max_depth: int = 3,
    _depth: int = 0,
) -> Generator[str, None, None]:
    if _depth > max_depth:
        return
    prefix = "  " * _depth
    icon = "\\U0001f4c1" if root.is_dir() else "\\U0001f4c4"
    yield f"{prefix}{icon} {root.name}"
    if root.is_dir():
        try:
            children = sorted(root.iterdir(), key=lambda p: (p.is_file(), p.name))
            for child in children:
                yield from walk_tree(child, max_depth=max_depth, _depth=_depth + 1)
        except PermissionError:
            yield f"{prefix}  [permission denied]"

def render_tree(root: Path, max_depth: int = 3) -> str:
    return "\\n".join(walk_tree(root, max_depth=max_depth))

if __name__ == "__main__":
    import sys
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    print(render_tree(target))`,
    annotations: [
      {
        afterLine: 8,
        technique: 'Generator[YieldType, SendType, ReturnType]',
        explanation:
          'The full Generator type hint has three slots: what it yields, what it accepts via .send(), and what it returns when done. Generator[str, None, None] means "yields strings, never sent values, returns nothing".',
      },
      {
        afterLine: 13,
        technique: 'yield (generator function)',
        explanation:
          'yield suspends the function and hands the current line to the caller. The caller can stop iterating at any point — if you only need the first 5 lines, the rest of the tree is never computed.',
      },
      {
        afterLine: 18,
        technique: 'yield from + recursion',
        explanation:
          "yield from walk_tree(...) delegates to the recursive call's generator, forwarding every item it produces upstream. This chains generator frames together without a list accumulator — memory usage stays proportional to depth, not tree size.",
      },
      {
        afterLine: 20,
        technique: 'Targeted PermissionError handling',
        explanation:
          'Only catching PermissionError (not bare except) means unexpected errors still propagate normally. You handle the specific failure you anticipate and nothing else — a hallmark of robust error handling.',
      },
    ],
  },

  // ── 5: Contact Book ───────────────────────────────────────────
  {
    id: 'contact-book',
    title: 'Contact Book',
    description:
      'A searchable contact store built with dataclasses, set-based dedup, and multi-key sorting.',
    difficulty: 'intermediate',
    techniques: [
      '@dataclass(order=True)',
      'field(default_factory)',
      '__repr__',
      'set comprehension',
      'multi-key sort',
    ],
    code: `from dataclasses import dataclass, field
from typing import Optional

@dataclass(order=True)
class Contact:
    last_name: str
    first_name: str
    email: str
    phone: Optional[str] = None
    tags: set[str] = field(default_factory=set)

    def __repr__(self) -> str:
        tag_str = ", ".join(sorted(self.tags)) if self.tags else "\\u2014"
        return f"<Contact {self.first_name} {self.last_name} | {self.email} | tags: {tag_str}>"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

class ContactBook:
    def __init__(self) -> None:
        self._contacts: list[Contact] = []

    def add(self, contact: Contact) -> None:
        existing_emails = {c.email for c in self._contacts}
        if contact.email not in existing_emails:
            self._contacts.append(contact)

    def search(self, query: str) -> list[Contact]:
        q = query.lower()
        return [c for c in self._contacts
                if q in c.full_name.lower() or q in c.email.lower()]

    def by_tag(self, tag: str) -> list[Contact]:
        return [c for c in self._contacts if tag in c.tags]

    def sorted_list(self) -> list[Contact]:
        return sorted(self._contacts)`,
    annotations: [
      {
        afterLine: 3,
        technique: '@dataclass(order=True)',
        explanation:
          'order=True generates __lt__, __le__, __gt__, __ge__ using fields in declaration order. Contact sorts by last_name first, then first_name — because those appear first in the class body. sorted(contacts) works with no extra key function.',
      },
      {
        afterLine: 9,
        technique: 'field(default_factory=set)',
        explanation:
          'Mutable defaults (lists, sets, dicts) must use default_factory. Writing tags: set[str] = set() would share one set object across all instances — a subtle aliasing bug that breaks the first time you add a tag.',
      },
      {
        afterLine: 13,
        technique: '__repr__',
        explanation:
          '__repr__ is what Python prints in the REPL, error messages, and debuggers. A good __repr__ shows the meaningful state of an object — it makes print() and logging actually useful during development.',
      },
      {
        afterLine: 24,
        technique: 'Set comprehension for O(1) dedup check',
        explanation:
          'Building existing_emails as a set first means the "in" check on the next line is O(1). If you checked email in [c.email for c in self._contacts] instead, each add() call would be O(n) — quadratic for large imports.',
      },
    ],
  },

  // ── 6: Config File Reader ──────────────────────────────────────
  {
    id: 'config-reader',
    title: 'Config File Reader',
    description:
      'Load and validate a JSON config file safely using context managers, exception chaining, and set difference.',
    difficulty: 'intermediate',
    techniques: ['context manager', 'raise from', 'set difference', 'pathlib', 'json module'],
    code: `import json
from pathlib import Path

class ConfigError(Exception):
    """Raised when a config file is missing or malformed."""

def load_config(path: str | Path) -> dict:
    config_path = Path(path)
    try:
        with config_path.open(encoding="utf-8") as fh:
            data = json.load(fh)
    except FileNotFoundError as exc:
        raise ConfigError(f"Config not found: {config_path}") from exc
    except json.JSONDecodeError as exc:
        raise ConfigError(f"Invalid JSON in {config_path}: {exc.msg} at line {exc.lineno}") from exc

    required = {"host", "port", "debug"}
    missing = required - data.keys()
    if missing:
        raise ConfigError(f"Config missing required keys: {sorted(missing)}")
    if not isinstance(data["port"], int):
        raise ConfigError(f"'port' must be an int, got {type(data['port']).__name__}")
    return data

def get_setting(config: dict, key: str, default=None):
    return config.get(key, default)`,
    annotations: [
      {
        afterLine: 9,
        technique: 'Context manager (with statement)',
        explanation:
          'with config_path.open(...) guarantees the file handle closes even if json.load raises an exception. You never need to call fh.close() manually or write a try/finally block around file I/O.',
      },
      {
        afterLine: 13,
        technique: 'Exception chaining: raise X from exc',
        explanation:
          'raise ConfigError(...) from exc links the new exception to the original. Tracebacks show both — callers see the friendly ConfigError message but can still inspect the root FileNotFoundError that caused it.',
      },
      {
        afterLine: 18,
        technique: 'Set difference for validation',
        explanation:
          'required - data.keys() is a one-line set subtraction that finds all missing keys simultaneously. No loop, no repeated "if key not in data" checks — and it scales to any number of required fields.',
      },
    ],
  },

  // ── 7: Score Aggregator ────────────────────────────────────────
  {
    id: 'score-agg',
    title: 'Score Aggregator',
    description:
      'Aggregate quiz scores across students using functools.reduce, the walrus operator, and namedtuple.',
    difficulty: 'advanced',
    techniques: [
      'functools.reduce',
      'walrus operator :=',
      'namedtuple',
      'starred unpacking',
      'type hints',
    ],
    code: `from functools import reduce
from collections import namedtuple
from typing import Sequence

StudentScore = namedtuple("StudentScore", ["name", "scores"])

def total(scores: Sequence[float]) -> float:
    return reduce(lambda acc, x: acc + x, scores, 0.0)

def average(scores: Sequence[float]) -> float:
    return total(scores) / len(scores) if scores else 0.0

def top_students(
    students: list[StudentScore],
    threshold: float = 80.0,
) -> list[tuple[str, float]]:
    results = []
    for student in students:
        if (avg := average(student.scores)) >= threshold:
            results.append((student.name, round(avg, 1)))
    return sorted(results, key=lambda t: t[1], reverse=True)

def score_range(students: list[StudentScore]) -> tuple[int, float, float]:
    averages = sorted(average(s.scores) for s in students)
    first, *_, last = averages
    return len(students), round(first, 1), round(last, 1)`,
    annotations: [
      {
        afterLine: 4,
        technique: 'namedtuple',
        explanation:
          "namedtuple creates an immutable, hashable record with named fields. student.name is clearer than student[0], and namedtuples are memory-efficient — they use less RAM than a full class or dict because they store fields in a fixed-size tuple.",
      },
      {
        afterLine: 7,
        technique: 'functools.reduce',
        explanation:
          "reduce(fn, seq, init) applies fn cumulatively: reduce(+, [1,2,3], 0) → ((0+1)+2)+3 → 6. It's the 'fold' pattern — useful when each step must incorporate all previous results, not just the last one.",
      },
      {
        afterLine: 18,
        technique: 'Walrus operator (:=)',
        explanation:
          'avg := average(student.scores) assigns and evaluates in one expression inside the if. Without it, you\'d call average() twice — once for the comparison, once to get the value to store. The walrus operator eliminates that redundant call.',
      },
      {
        afterLine: 23,
        technique: 'Starred unpacking',
        explanation:
          'first, *_, last = averages captures the first and last elements of any-length sequence, discarding everything in between into _. No indexing, no len() — the pattern works whether averages has 2 items or 2000.',
      },
    ],
  },

  // ── 8: Report Formatter ────────────────────────────────────────
  {
    id: 'report-formatter',
    title: 'Report Formatter',
    description:
      'Render raw data as an aligned text table using f-string format specs, Enum, and match/case dispatch.',
    difficulty: 'advanced',
    techniques: [
      'Enum',
      'f-string format specs (dynamic)',
      'match/case',
      '@dataclass',
      'structural pattern matching',
    ],
    code: `from enum import Enum
from dataclasses import dataclass

class Align(Enum):
    LEFT   = "<"
    RIGHT  = ">"
    CENTER = "^"

@dataclass
class Column:
    header: str
    width: int
    align: Align = Align.LEFT
    precision: int | None = None

    def format_value(self, value: object) -> str:
        spec = f"{self.align.value}{self.width}"
        match value:
            case float() | int() if self.precision is not None:
                return f"{value:.{self.precision}f}"
            case float() | int():
                return f"{value:{spec}}"
            case str():
                truncated = str(value)[:self.width]
                return f"{truncated:{spec}}"
            case _:
                return f"{str(value):{spec}}"

def render_table(columns: list[Column], rows: list[dict]) -> str:
    sep = "  ".join("\\u2500" * col.width for col in columns)
    headers = "  ".join(
        f"{col.header:{col.align.value}{col.width}}" for col in columns
    )
    lines = [headers, sep]
    for row in rows:
        cells = [col.format_value(row.get(col.header, "")) for col in columns]
        lines.append("  ".join(cells))
    return "\\n".join(lines)`,
    annotations: [
      {
        afterLine: 6,
        technique: 'Enum',
        explanation:
          'Enum prevents invalid values at the type level — Align.LEFT is more readable than "<", the IDE autocompletes it, and passing Align.BOGUS is a NameError rather than a silent wrong-alignment bug.',
      },
      {
        afterLine: 16,
        technique: 'Dynamic f-string format spec',
        explanation:
          'f"{value:{spec}}" embeds the spec string itself inside the format expression. spec = ">20" right-aligns in 20 chars; the outer f-string fills in both the value and the alignment spec at runtime — fully dynamic column formatting.',
      },
      {
        afterLine: 25,
        technique: 'match/case structural pattern matching',
        explanation:
          'match/case dispatches on the type and value of an object simultaneously. case float() | int() matches any float or int in one arm — replacing a chain of isinstance() checks with a readable switch-like structure.',
      },
    ],
  },

  // ── 9: Task Queue ──────────────────────────────────────────────
  {
    id: 'task-queue',
    title: 'Task Queue',
    description:
      'A priority task scheduler using deque with a bounded capacity, dataclass ordering, and itertools.islice peeking.',
    difficulty: 'advanced',
    techniques: [
      'deque(maxlen)',
      'dataclass ordering',
      '__lt__',
      'itertools.islice',
      'generator',
      '@property',
    ],
    code: `from collections import deque
from dataclasses import dataclass, field
from typing import Generator
import itertools

@dataclass
class Task:
    priority: int
    name: str = field(compare=False)
    description: str = field(compare=False, default="")

    def __lt__(self, other: "Task") -> bool:
        return self.priority < other.priority

class TaskQueue:
    def __init__(self, capacity: int = 100) -> None:
        self._queue: deque[Task] = deque(maxlen=capacity)

    def push(self, task: Task) -> None:
        self._queue.append(task)
        self._queue = deque(sorted(self._queue), maxlen=self._queue.maxlen)

    def pop(self) -> Task | None:
        return self._queue.popleft() if self._queue else None

    def peek_batch(self, n: int) -> Generator[Task, None, None]:
        yield from itertools.islice(self._queue, n)

    @property
    def size(self) -> int:
        return len(self._queue)`,
    annotations: [
      {
        afterLine: 9,
        technique: 'field(compare=False)',
        explanation:
          'By default, @dataclass(order=True) compares all fields. field(compare=False) excludes name and description so Tasks sort purely by priority — without it, two tasks with the same priority but different names would produce undefined ordering.',
      },
      {
        afterLine: 12,
        technique: '__lt__ for custom ordering',
        explanation:
          "__lt__ makes Task work with sorted(), min(), max(), and heapq without inheriting from anything. Any class that defines __lt__ is automatically sortable — Python's sort only requires this one method.",
      },
      {
        afterLine: 16,
        technique: 'deque(maxlen=capacity)',
        explanation:
          'deque with maxlen is a bounded ring buffer — when full, pushing a new item silently drops the oldest one. Appending and popping from either end is O(1), unlike list.insert(0) or list.pop(0) which are O(n).',
      },
      {
        afterLine: 25,
        technique: 'itertools.islice',
        explanation:
          'islice(iterable, n) lazily takes at most n items from any iterable — it works on deques, generators, files, or anything else. Peeking here produces at most n Tasks without copying the deque or converting it to a list.',
      },
    ],
  },

  // ── 10: Mini CLI Tool ─────────────────────────────────────────
  {
    id: 'cli-tool',
    title: 'Mini CLI Tool',
    description:
      'A runnable command-line word-count utility demonstrating argparse, the __name__ guard, and a testable main().',
    difficulty: 'intermediate',
    techniques: [
      'argparse',
      '__name__ guard',
      'testable main()',
      'context manager',
      'generator in sum()',
    ],
    code: `import argparse
import sys
from pathlib import Path

def count_lines(path: Path) -> int:
    with path.open(encoding="utf-8") as fh:
        return sum(1 for _ in fh)

def count_words(path: Path) -> int:
    with path.open(encoding="utf-8") as fh:
        return sum(len(line.split()) for line in fh)

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Count lines and words in a text file.",
    )
    parser.add_argument("file", type=Path, help="Path to the text file")
    parser.add_argument("--words", action="store_true", help="Also count words")
    parser.add_argument("--quiet", "-q", action="store_true", help="Counts only")
    return parser

def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if not args.file.exists():
        print(f"Error: {args.file} not found", file=sys.stderr)
        return 1
    lines = count_lines(args.file)
    if not args.quiet:
        print(f"File: {args.file}")
    print(f"Lines: {lines}")
    if args.words:
        print(f"Words: {count_words(args.file)}")
    return 0

if __name__ == "__main__":
    sys.exit(main())`,
    annotations: [
      {
        afterLine: 6,
        technique: 'Generator expression in sum()',
        explanation:
          "sum(1 for _ in fh) counts lines without loading the file into memory. The generator yields 1 for each line as it's read; sum() accumulates the total. Memory usage is O(1) regardless of file size.",
      },
      {
        afterLine: 18,
        technique: 'argparse',
        explanation:
          'ArgumentParser parses sys.argv into a typed Namespace, auto-generates --help, validates required vs optional arguments, and handles type conversion (type=Path converts the string argument to a Path object automatically).',
      },
      {
        afterLine: 21,
        technique: 'Testable main(argv=None)',
        explanation:
          "Accepting argv as a parameter makes main() callable from tests: main(['myfile.txt', '--words']) without monkey-patching sys.argv. When argv is None, parse_args() falls back to sys.argv — so the real CLI still works normally.",
      },
      {
        afterLine: 33,
        technique: '__name__ == "__main__" guard',
        explanation:
          'This block only runs when the file is executed directly (python cli_tool.py). When the module is imported by a test or another script, __name__ is the module name, not "__main__", so main() is not called automatically.',
      },
    ],
  },
];
