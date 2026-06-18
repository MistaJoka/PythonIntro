import { capstoneProjectSchema, type CapstoneProject } from './schema';
import { buildLessonCoverage } from './lessonIndex';
import { wrapSolution, step } from './buildSolution';
import { EXPERT_CAPSTONES } from './expertProjects';

/** Full-course capstone registry — see FULL_COURSE_NOTE in lessonIndex. */
const BASE_CAPSTONES: CapstoneProject[] = [
  {
    id: "cap-01",
    title: "Academic Records Analyzer",
    subtitle: "Summarize student transcripts from JSON payloads",
    difficulty: "beginner",
    expertLens: "This capstone mirrors a registrar dashboard: you parse structured enrollment data, filter by policy thresholds, and emit ranked summaries — the same pipeline pattern used in real academic analytics.",
    topics: ["json","dicts","sorting","L1–L16 synthesis"],
    lessonCoverage: buildLessonCoverage({"lesson01":"Format student tags and summary notes with f-strings","lesson02":"Compare scores to PASS_THRESHOLD and compute class averages","lesson03":"Branch honor bands with if/elif on letter grades","lesson04":"Iterate every record in the enrollment list","lesson05":"Use tag_line helper with a default prefix argument","lesson06":"Normalize names via strip, lower, and title case","lesson07":"Collect scores in lists and pair tuples for ranking","lesson08":"Tally courses in a dict and track unique sets","lesson09":"List comprehension over HighlightRow instances","lesson10":"Guard json.loads with try/except for malformed payloads","lesson11":"Build ResultRow and HighlightRow objects for top students","lesson12":"Sum scores recursively via _rec_sum; note O(n) complexity","lesson13":"Assert payload is not None; deepcopy course tallies","lesson14":"Rank students with sorted(zip(...), key=score)","lesson15":"Parse transcript JSON with json.loads","lesson16":"match/case on letter grade; yield note_stream generator"}),
    description: "Implement `analyze_academic_records(payload: str)` that parses JSON:\n\n`{\"records\": [{\"name\": str, \"score\": number, \"course\": str}, ...]}`\n\nReturn a dict with at least `count` (passing records), `average`, `top_student`, and `grade`.",
    objectives: ["Parse JSON enrollment data safely","Filter and rank students by score","Synthesize a full-course report dict"],
    starterCode: "def analyze_academic_records(payload: str):\n    \"\"\"Return summary stats for academic records JSON.\"\"\"\n    pass",
    tests: ["import json\np = json.dumps({\"records\": [{\"name\": \"ada\", \"score\": 95, \"course\": \"py\"}]})\nr = analyze_academic_records(p)\nassert r[\"count\"] == 1","import json\np = json.dumps({\"records\": [{\"name\": \"ada\", \"score\": 95, \"course\": \"py\"}]})\nr = analyze_academic_records(p)\nassert r[\"top_student\"] == \"Ada\"","import json\np = json.dumps({\"records\": []})\nr = analyze_academic_records(p)\nassert r[\"count\"] == 0"],
    solution: wrapSolution(`
def analyze_academic_records(payload: str) -> dict[str, Any]:
    """Summarize academic record JSON: counts, averages, top student."""
    assert payload is not None
    n = 0
    try:
        body = json.loads(payload)
        records = body.get("records", [])
    except (json.JSONDecodeError, TypeError):
        records = []
    scores: list[float] = []
    names: list[str] = []
    courses: dict[str, int] = {}
    unique: set[str] = set()
    for i, rec in enumerate(records):
        raw_name = rec.get("name", "student")
        name = raw_name.strip().lower().title()
        score_val = float(rec.get("score", 0))
        course_tag = str(rec.get("course", "gen"))[:8]
        if score_val >= PASS_THRESHOLD:
            scores.append(score_val)
            names.append(name)
            n += 1
        courses[course_tag] = courses.get(course_tag, 0) + 1
        unique.add(course_tag)
    complexity = f"O({len(records)}) linear scan"
    if n == 0:
        return {"count": 0, "average": 0.0, "top_student": "", "grade": "F", "complexity": complexity}
    avg = _rec_sum(scores) / n
    pairs = sorted(zip(names, scores), key=lambda t: t[1], reverse=True)
    top = pairs[0][0]
    letter = _letter(avg)
    snapshot = deepcopy(courses)
    assert snapshot == courses
    rows: list[ResultRow] = []
    for label, val in pairs[:3]:
        row = HighlightRow(label, val) if val >= 90 else ResultRow(label, val)
        rows.append(row)
    highlights = [r.describe() for r in rows if isinstance(r, HighlightRow)]
    def tag_line(prefix: str = "rec") -> str:
        return f"{prefix}:{top}@{avg:.1f}"
    match letter:
        case "A" | "B":
            band = "honors"
        case "C" | "D":
            band = "pass"
        case _:
            band = "fail"
    def note_stream() -> Iterator[str]:
        yield f"Processed {n} passing of {len(records)}"
        yield complexity
    notes = list(note_stream())
    return {
        "count": n,
        "average": round(avg, 2),
        "top_student": top,
        "grade": letter,
        "band": band,
        "tag": tag_line(),
        "courses": snapshot,
        "unique_courses": len(unique),
        "highlights": highlights,
        "notes": notes,
        "complexity": complexity,
    }
`),
    solutionSteps: [
      step(52, "Define the main function with a typed payload parameter.", "lesson01"),
      step(54, "Docstring states the domain purpose of this capstone entry point.", "lesson02"),
      step(56, "Assert the input is not None before parsing — a debug guard from L13.", "lesson03"),
      step(58, "Initialize counters and empty collections for aggregation.", "lesson04"),
      step(60, "try/except wraps JSON or CSV parsing for malformed input.", "lesson05"),
      step(62, "Extract the primary data structure from the parsed payload.", "lesson06"),
      step(64, "Loop over each record with enumerate for stable indexing.", "lesson07"),
      step(66, "Normalize string fields using strip, lower, and title helpers.", "lesson08"),
      step(68, "Apply numeric comparisons and threshold checks on values.", "lesson09"),
      step(70, "Update dict tallies and set membership as you scan records.", "lesson10"),
      step(72, "Call _rec_sum for recursive aggregation with O(n) complexity.", "lesson11"),
      step(74, "Rank items with sorted, zip, and a key function.", "lesson12"),
      step(76, "deepcopy snapshots dict state; assert invariants hold.", "lesson13"),
      step(78, "Instantiate ResultRow or HighlightRow for ranked highlights.", "lesson14"),
      step(80, "match/case maps a summary metric to a human-readable status.", "lesson15"),
      step(82, "Generator yields status notes; list() materializes the stream.", "lesson16"),
      step(84, "Return the result dict with all required summary keys.", "lesson01"),
    ],
    explanation: "Parse once, filter passing scores, rank with zip/sorted, and wrap highlights in OOP rows. The recursive sum reinforces that aggregation is O(n) over the record list.",
  },
  {
    id: "cap-02",
    title: "Task Board Processor",
    subtitle: "Rank open kanban tasks by priority",
    difficulty: "beginner",
    expertLens: "Sprint boards are dict-and-loop exercises in disguise: you classify tasks, aggregate counts, and surface the highest-priority open item — exactly how issue trackers prioritize work.",
    topics: ["json","sorting","sets","L1–L16 synthesis"],
    lessonCoverage: buildLessonCoverage({"lesson01":"Build sprint_label status strings with f-strings","lesson02":"Sum priority weights and compare open vs done counts","lesson03":"Classify board mood with if/elif on pending count","lesson04":"Walk every task entry in the board JSON","lesson05":"sprint_label accepts an optional suffix default","lesson06":"Clean task titles and extract lane tags from words","lesson07":"Store open tasks as (title, priority) tuples in a list","lesson08":"Track lane tags in a set; tally open/done in a dict","lesson09":"Comprehend urgent HighlightRow list for priority ≥ 3","lesson10":"try/except around json.loads for corrupt boards","lesson11":"Emit ResultRow per ranked task; HighlightRow for urgent","lesson12":"_rec_sum over priority weights; O(n) board walk note","lesson13":"Assert payload not None; deepcopy tally dict","lesson14":"sorted open_items by priority; enumerate tasks","lesson15":"Load board structure from JSON payload","lesson16":"match pending count to mood; yield status_lines generator"}),
    description: "Implement `process_task_board(payload: str)` parsing:\n\n`{\"tasks\": [{\"title\": str, \"priority\": int, \"done\": bool}, ...]}`\n\nReturn dict with `pending`, `done`, and ranked open work.",
    objectives: ["Tally open vs completed tasks","Rank by priority","Tag tasks by lane"],
    starterCode: "def process_task_board(payload: str):\n    \"\"\"Summarize a kanban task board JSON payload.\"\"\"\n    pass",
    tests: ["import json\np = json.dumps({\"tasks\": [{\"title\": \"read\", \"priority\": 3, \"done\": False}]})\nr = process_task_board(p)\nassert r[\"pending\"] >= 1","import json\np = json.dumps({\"tasks\": [{\"title\": \"read\", \"priority\": 3, \"done\": False}]})\nr = process_task_board(p)\nassert r[\"top_task\"]"],
    solution: wrapSolution(`
def process_task_board(payload: str) -> dict[str, Any]:
    """Parse a kanban-style task board JSON and rank open work."""
    assert payload is not None
    pending = 0
    done = 0
    try:
        board = json.loads(payload)
        tasks = board.get("tasks", [])
    except (json.JSONDecodeError, TypeError):
        tasks = []
    open_items: list[tuple[str, int]] = []
    tags: set[str] = set()
    tallies: dict[str, int] = {"open": 0, "done": 0}
    for idx, task in enumerate(tasks):
        title = _clean(str(task.get("title", "untitled")))
        priority = int(task.get("priority", 1))
        finished = bool(task.get("done", False))
        lane = title.split()[0] if title else "misc"
        tags.add(lane.lower())
        if finished:
            done += 1
            tallies["done"] += 1
        else:
            pending += 1
            tallies["open"] += 1
            open_items.append((title, priority))
    complexity = f"O({len(tasks)}) board walk"
    weights = [float(p) for _, p in open_items]
    load = _rec_sum(weights) if weights else 0.0
    ranked = sorted(open_items, key=lambda t: t[1], reverse=True)
    top_task = ranked[0][0] if ranked else ""
    backup = deepcopy(tallies)
    assert backup["open"] == pending or pending == 0
    rows = [ResultRow(t, float(p)) for t, p in ranked[:3]]
    urgent = [HighlightRow(t, float(p)) for t, p in ranked if p >= 3]
    highlights = [r.describe() for r in urgent]
    def sprint_label(suffix: str = "sprint") -> str:
        return f"{suffix}:{pending} open/{done} done"
    match pending:
        case 0:
            mood = "clear"
        case p if p <= 3:
            mood = "focused"
        case _:
            mood = "busy"
    def status_lines() -> Iterator[str]:
        yield sprint_label()
        yield complexity
    return {
        "pending": pending,
        "done": done,
        "top_task": top_task,
        "load": round(load, 2),
        "mood": mood,
        "tags": sorted(tags),
        "rows": [r.describe() for r in rows],
        "highlights": highlights,
        "tallies": backup,
        "notes": list(status_lines()),
        "complexity": complexity,
    }
`),
    solutionSteps: [
      step(52, "Define the main function with a typed payload parameter.", "lesson01"),
      step(54, "Docstring states the domain purpose of this capstone entry point.", "lesson02"),
      step(56, "Assert the input is not None before parsing — a debug guard from L13.", "lesson03"),
      step(58, "Initialize counters and empty collections for aggregation.", "lesson04"),
      step(60, "try/except wraps JSON or CSV parsing for malformed input.", "lesson05"),
      step(62, "Extract the primary data structure from the parsed payload.", "lesson06"),
      step(64, "Loop over each record with enumerate for stable indexing.", "lesson07"),
      step(66, "Normalize string fields using strip, lower, and title helpers.", "lesson08"),
      step(68, "Apply numeric comparisons and threshold checks on values.", "lesson09"),
      step(70, "Update dict tallies and set membership as you scan records.", "lesson10"),
      step(72, "Call _rec_sum for recursive aggregation with O(n) complexity.", "lesson11"),
      step(74, "Rank items with sorted, zip, and a key function.", "lesson12"),
      step(76, "deepcopy snapshots dict state; assert invariants hold.", "lesson13"),
      step(78, "Instantiate ResultRow or HighlightRow for ranked highlights.", "lesson14"),
      step(80, "match/case maps a summary metric to a human-readable status.", "lesson15"),
      step(82, "Generator yields status notes; list() materializes the stream.", "lesson16"),
      step(84, "Return the result dict with all required summary keys.", "lesson01"),
    ],
    explanation: "Separate finished from open tasks, sort open items by priority, and expose load metrics via recursive sum over weights.",
  },
  {
    id: "cap-03",
    title: "Access Log Inspector",
    subtitle: "Flag HTTP errors in Apache-style logs",
    difficulty: "intermediate",
    expertLens: "Log analysis is pattern matching plus aggregation: regex extracts fields, loops tally status codes, and sorted error paths reveal what broke first in production.",
    topics: ["regex","loops","dicts","L1–L16 synthesis"],
    lessonCoverage: buildLessonCoverage({"lesson01":"Format audit banner strings with f-strings","lesson02":"Compare status codes ≥ 400 and sum error codes","lesson03":"Branch health status from error count thresholds","lesson04":"Scan each log line with enumerate","lesson05":"banner helper with default audit prefix","lesson06":"Strip whitespace from raw log lines","lesson07":"Collect error_rows as (path, code) tuples","lesson08":"Unique IPs in a set; route hits in a dict","lesson09":"Comprehend HighlightRow for 5xx responses","lesson10":"try/except when parsing status code integers","lesson11":"ResultRow per error path; HighlightRow for server errors","lesson12":"_rec_sum error codes; O(n) line scan complexity","lesson13":"Assert log_text not None; deepcopy routes dict","lesson14":"sorted error_rows by status code descending","lesson15":"Regex pattern for IP, path, and status fields","lesson16":"match errors to health tier; yield trace generator"}),
    description: "Implement `inspect_access_logs(log_text: str)` for lines like:\n\n`127.0.0.1 - GET /path 200`\n\nReturn dict with `errors` (status ≥ 400) and `ok` (2xx) counts.",
    objectives: ["Parse log lines with regex","Tally status codes","Rank error paths"],
    starterCode: "def inspect_access_logs(log_text: str):\n    \"\"\"Parse access logs and count error responses.\"\"\"\n    pass",
    tests: ["r = inspect_access_logs(\"127.0.0.1 - GET /ok 200\\n127.0.0.1 - GET /fail 404\\n\")\nassert r[\"errors\"] >= 1","r = inspect_access_logs(\"127.0.0.1 - GET /ok 200\\n127.0.0.1 - GET /fail 404\\n\")\nassert r[\"ok\"] >= 1"],
    solution: wrapSolution(`
def inspect_access_logs(log_text: str) -> dict[str, Any]:
    """Parse Apache-style access logs and flag error responses."""
    assert log_text is not None
    lines = log_text.strip().splitlines()
    errors = 0
    ok = 0
    ips: set[str] = set()
    routes: dict[str, int] = {}
    error_rows: list[tuple[str, int]] = []
    pattern = re.compile(r"^(\\S+)\\s+-\\s+\\S+\\s+(\\S+)\\s+(\\d{3})$")
    for lineno, raw in enumerate(lines, start=1):
        line = raw.strip()
        if not line:
            continue
        try:
            match = pattern.match(line)
            if match is None:
                continue
            ip, path, code_text = match.groups()
            code = int(code_text)
        except (ValueError, AttributeError):
            continue
        ips.add(ip)
        routes[path] = routes.get(path, 0) + 1
        if code >= 400:
            errors += 1
            error_rows.append((path, code))
        elif code >= 200 and code < 300:
            ok += 1
    complexity = f"O({len(lines)}) log lines"
    codes = [float(c) for _, c in error_rows]
    err_sum = _rec_sum(codes) if codes else 0.0
    ranked = sorted(error_rows, key=lambda t: t[1], reverse=True)
    top_path = ranked[0][0] if ranked else ""
    snapshot = deepcopy(routes)
    assert snapshot == routes
    rows = [ResultRow(p, float(c)) for p, c in ranked[:3]]
    hot = [HighlightRow(p, float(c)) for p, c in ranked if c >= 500]
    highlights = [r.describe() for r in hot]
    def banner(prefix: str = "audit") -> str:
        return f"{prefix}:{errors} errors/{ok} ok"
    match errors:
        case 0:
            health = "clean"
        case e if e <= 2:
            health = "watch"
        case _:
            health = "alert"
    def trace() -> Iterator[str]:
        yield banner()
        yield complexity
    return {
        "errors": errors,
        "ok": ok,
        "top_path": top_path,
        "err_sum": round(err_sum, 2),
        "health": health,
        "unique_ips": len(ips),
        "routes": snapshot,
        "rows": [r.describe() for r in rows],
        "highlights": highlights,
        "notes": list(trace()),
        "complexity": complexity,
    }
`),
    solutionSteps: [
      step(52, "Define the main function with a typed payload parameter.", "lesson01"),
      step(54, "Docstring states the domain purpose of this capstone entry point.", "lesson02"),
      step(56, "Assert the input is not None before parsing — a debug guard from L13.", "lesson03"),
      step(58, "Initialize counters and empty collections for aggregation.", "lesson04"),
      step(60, "try/except wraps JSON or CSV parsing for malformed input.", "lesson05"),
      step(62, "Extract the primary data structure from the parsed payload.", "lesson06"),
      step(64, "Loop over each record with enumerate for stable indexing.", "lesson07"),
      step(66, "Normalize string fields using strip, lower, and title helpers.", "lesson08"),
      step(68, "Apply numeric comparisons and threshold checks on values.", "lesson09"),
      step(70, "Update dict tallies and set membership as you scan records.", "lesson10"),
      step(72, "Call _rec_sum for recursive aggregation with O(n) complexity.", "lesson11"),
      step(74, "Rank items with sorted, zip, and a key function.", "lesson12"),
      step(76, "deepcopy snapshots dict state; assert invariants hold.", "lesson13"),
      step(78, "Instantiate ResultRow or HighlightRow for ranked highlights.", "lesson14"),
      step(80, "match/case maps a summary metric to a human-readable status.", "lesson15"),
      step(82, "Generator yields status notes; list() materializes the stream.", "lesson16"),
      step(84, "Return the result dict with all required summary keys.", "lesson01"),
    ],
    explanation: "Compile a regex once, walk lines safely, and aggregate errors separately from successful responses.",
  },
  {
    id: "cap-04",
    title: "Library Catalog Report",
    subtitle: "Summarize holdings from catalog JSON",
    difficulty: "beginner",
    expertLens: "Catalog systems combine normalization (author/title cleanup), aggregation (page totals), and ranking (longest volume) — a classic data-wrangling capstone.",
    topics: ["json","OOP rows","aggregation","L1–L16 synthesis"],
    lessonCoverage: buildLessonCoverage({"lesson01":"spine_label f-string for catalog summary line","lesson02":"Compute average and total page counts arithmetically","lesson03":"if/elif on title count for collection status","lesson04":"Loop each book in the holdings list","lesson05":"spine_label helper with default lib tag","lesson06":"Clean titles; slice author key to three chars","lesson07":"Append (title, pages) tuples to catalog list","lesson08":"Track authors in a set; shelf counts in dict","lesson09":"List comprehension for epic HighlightRow (≥400 pages)","lesson10":"try/except on json.loads for bad catalog data","lesson11":"ResultRow and HighlightRow for ranked titles","lesson12":"_rec_sum page list; O(n) catalog scan note","lesson13":"Assert payload not None; deepcopy shelves dict","lesson14":"sorted catalog by page count descending","lesson15":"json.loads to read library holdings payload","lesson16":"match titles to status; yield shelf_notes generator"}),
    description: "Implement `library_catalog_report(payload: str)` for:\n\n`{\"books\": [{\"title\": str, \"author\": str, \"pages\": number}, ...]}`\n\nReturn dict with `titles` count and reading statistics.",
    objectives: ["Normalize bibliographic fields","Rank by page count","Group by shelf key"],
    starterCode: "def library_catalog_report(payload: str):\n    \"\"\"Build a summary report from library catalog JSON.\"\"\"\n    pass",
    tests: ["import json\np = json.dumps({\"books\": [{\"title\": \"intro\", \"author\": \"mit\", \"pages\": 400}]})\nr = library_catalog_report(p)\nassert r[\"titles\"] >= 1"],
    solution: wrapSolution(`
def library_catalog_report(payload: str) -> dict[str, Any]:
    """Build a library catalog summary from JSON holdings."""
    assert payload is not None
    titles = 0
    pages: list[float] = []
    authors: set[str] = set()
    shelves: dict[str, int] = {}
    try:
        data = json.loads(payload)
        books = data.get("books", [])
    except (json.JSONDecodeError, TypeError):
        books = []
    catalog: list[tuple[str, float]] = []
    for i, book in enumerate(books):
        title = _clean(str(book.get("title", "unknown")))
        author = book.get("author", "anon").strip().lower()
        page_count = float(book.get("pages", 0))
        shelf_key = author[:3] if author else "unk"
        titles += 1
        pages.append(page_count)
        authors.add(author)
        shelves[shelf_key] = shelves.get(shelf_key, 0) + 1
        catalog.append((title, page_count))
    complexity = f"O({len(books)}) catalog scan"
    total_pages = _rec_sum(pages) if pages else 0.0
    ranked = sorted(catalog, key=lambda t: t[1], reverse=True)
    longest = ranked[0][0] if ranked else ""
    avg_pages = total_pages / titles if titles else 0.0
    snapshot = deepcopy(shelves)
    assert snapshot == shelves
    rows = [ResultRow(t, p) for t, p in ranked[:3]]
    epics = [HighlightRow(t, p) for t, p in ranked if p >= 400]
    highlights = [r.describe() for r in epics]
    def spine_label(tag: str = "lib") -> str:
        return f"{tag}:{titles} titles@{avg_pages:.0f}pg"
    match titles:
        case 0:
            status = "empty"
        case t if t < 5:
            status = "small"
        case _:
            status = "healthy"
    def shelf_notes() -> Iterator[str]:
        yield spine_label()
        yield complexity
    return {
        "titles": titles,
        "longest": longest,
        "avg_pages": round(avg_pages, 2),
        "total_pages": round(total_pages, 2),
        "authors": len(authors),
        "status": status,
        "shelves": snapshot,
        "rows": [r.describe() for r in rows],
        "highlights": highlights,
        "notes": list(shelf_notes()),
        "complexity": complexity,
    }
`),
    solutionSteps: [
      step(52, "Define the main function with a typed payload parameter.", "lesson01"),
      step(54, "Docstring states the domain purpose of this capstone entry point.", "lesson02"),
      step(56, "Assert the input is not None before parsing — a debug guard from L13.", "lesson03"),
      step(58, "Initialize counters and empty collections for aggregation.", "lesson04"),
      step(60, "try/except wraps JSON or CSV parsing for malformed input.", "lesson05"),
      step(62, "Extract the primary data structure from the parsed payload.", "lesson06"),
      step(64, "Loop over each record with enumerate for stable indexing.", "lesson07"),
      step(66, "Normalize string fields using strip, lower, and title helpers.", "lesson08"),
      step(68, "Apply numeric comparisons and threshold checks on values.", "lesson09"),
      step(70, "Update dict tallies and set membership as you scan records.", "lesson10"),
      step(72, "Call _rec_sum for recursive aggregation with O(n) complexity.", "lesson11"),
      step(74, "Rank items with sorted, zip, and a key function.", "lesson12"),
      step(76, "deepcopy snapshots dict state; assert invariants hold.", "lesson13"),
      step(78, "Instantiate ResultRow or HighlightRow for ranked highlights.", "lesson14"),
      step(80, "match/case maps a summary metric to a human-readable status.", "lesson15"),
      step(82, "Generator yields status notes; list() materializes the stream.", "lesson16"),
      step(84, "Return the result dict with all required summary keys.", "lesson01"),
    ],
    explanation: "Treat each book as a record, aggregate pages recursively, and highlight epic volumes with inheritance.",
  },
  {
    id: "cap-05",
    title: "Budget CSV Analyzer",
    subtitle: "Aggregate spending from monthly CSV exports",
    difficulty: "intermediate",
    expertLens: "Finance pipelines ingest CSV, coerce types in loops, and pivot by category — the same ETL shape you will see with pandas, but built from stdlib primitives.",
    topics: ["csv","aggregation","math","L1–L16 synthesis"],
    lessonCoverage: buildLessonCoverage({"lesson01":"ledger f-string showing total dollars and month span","lesson02":"Sum amounts and compare row counts for state","lesson03":"if/elif on rows_read for empty/light/loaded state","lesson04":"Iterate csv.DictReader rows","lesson05":"ledger helper with default budget tag","lesson06":"Normalize category names to lower case","lesson07":"Collect amounts in a float list","lesson08":"by_category dict and unique months set","lesson09":"Comprehend HighlightRow for categories ≥ $10","lesson10":"try/except around csv parsing and float coercion","lesson11":"ResultRow breakdown rows per top category","lesson12":"_rec_sum amounts; O(n) csv row complexity","lesson13":"Assert csv_text not None; deepcopy categories","lesson14":"sorted categories by spend descending","lesson15":"csv.DictReader + io.StringIO for csv_text","lesson16":"match row count to state; yield csv_notes generator"}),
    description: "Implement `analyze_budget_csv(csv_text: str)` for CSV header:\n\n`month,amount,category`\n\nReturn dict with `total` spend and category breakdown.",
    objectives: ["Parse CSV with DictReader","Aggregate by category","Handle bad rows"],
    starterCode: "def analyze_budget_csv(csv_text: str):\n    \"\"\"Aggregate budget totals from CSV text.\"\"\"\n    pass",
    tests: ["r = analyze_budget_csv(\"month,amount,category\\n1,10.5,food\\n1,5,food\\n\")\nassert r[\"total\"] == 15.5"],
    solution: wrapSolution(`
def analyze_budget_csv(csv_text: str) -> dict[str, Any]:
    """Aggregate monthly budget rows from CSV text."""
    assert csv_text is not None
    total = 0.0
    rows_read = 0
    by_category: dict[str, float] = {}
    months: set[int] = set()
    amounts: list[float] = []
    try:
        reader = csv.DictReader(io.StringIO(csv_text))
        records = list(reader)
    except (csv.Error, TypeError):
        records = []
    for i, row in enumerate(records):
        try:
            month = int(row.get("month", "0"))
            amount = float(row.get("amount", "0"))
            category = row.get("category", "misc").strip().lower()
        except (ValueError, TypeError):
            continue
        rows_read += 1
        total += amount
        amounts.append(amount)
        months.add(month)
        by_category[category] = by_category.get(category, 0.0) + amount
    complexity = f"O({rows_read}) csv rows"
    cat_total = _rec_sum(amounts) if amounts else 0.0
    ranked = sorted(by_category.items(), key=lambda t: t[1], reverse=True)
    top_cat = ranked[0][0] if ranked else ""
    snapshot = deepcopy(by_category)
    assert math.isclose(snapshot.get(top_cat, 0.0), ranked[0][1] if ranked else 0.0) or not ranked
    result_rows = [ResultRow(c, v) for c, v in ranked[:3]]
    big = [HighlightRow(c, v) for c, v in ranked if v >= 10.0]
    highlights = [r.describe() for r in big]
    def ledger(tag: str = "budget") -> str:
        return f"{tag}:\${total:.2f} across {len(months)} mo"
    match rows_read:
        case 0:
            state = "empty"
        case r if r <= 3:
            state = "light"
        case _:
            state = "loaded"
    def csv_notes() -> Iterator[str]:
        yield ledger()
        yield complexity
    return {
        "total": round(total, 2),
        "rows": rows_read,
        "top_category": top_cat,
        "cat_total": round(cat_total, 2),
        "months": len(months),
        "state": state,
        "by_category": snapshot,
        "breakdown": [r.describe() for r in result_rows],
        "highlights": highlights,
        "notes": list(csv_notes()),
        "complexity": complexity,
    }
`),
    solutionSteps: [
      step(52, "Define the main function with a typed payload parameter.", "lesson01"),
      step(54, "Docstring states the domain purpose of this capstone entry point.", "lesson02"),
      step(56, "Assert the input is not None before parsing — a debug guard from L13.", "lesson03"),
      step(58, "Initialize counters and empty collections for aggregation.", "lesson04"),
      step(60, "try/except wraps JSON or CSV parsing for malformed input.", "lesson05"),
      step(62, "Extract the primary data structure from the parsed payload.", "lesson06"),
      step(64, "Loop over each record with enumerate for stable indexing.", "lesson07"),
      step(66, "Normalize string fields using strip, lower, and title helpers.", "lesson08"),
      step(68, "Apply numeric comparisons and threshold checks on values.", "lesson09"),
      step(70, "Update dict tallies and set membership as you scan records.", "lesson10"),
      step(72, "Call _rec_sum for recursive aggregation with O(n) complexity.", "lesson11"),
      step(74, "Rank items with sorted, zip, and a key function.", "lesson12"),
      step(76, "deepcopy snapshots dict state; assert invariants hold.", "lesson13"),
      step(78, "Instantiate ResultRow or HighlightRow for ranked highlights.", "lesson14"),
      step(80, "match/case maps a summary metric to a human-readable status.", "lesson15"),
      step(82, "Generator yields status notes; list() materializes the stream.", "lesson16"),
      step(84, "Return the result dict with all required summary keys.", "lesson01"),
    ],
    explanation: "Stream CSV through DictReader, coerce types safely, and rank categories by total spend.",
  },
  {
    id: "cap-06",
    title: "Password Audit Tool",
    subtitle: "Score password strength with regex policy rules",
    difficulty: "intermediate",
    expertLens: "Security audits combine pattern matching (regex lookaheads), set deduplication, and scored reporting — a practical intro to validation pipelines.",
    topics: ["regex","json","sets","L1–L16 synthesis"],
    lessonCoverage: buildLessonCoverage({"lesson01":"report f-string for strong vs weak counts","lesson02":"Score passwords numerically and compare to policy","lesson03":"if/elif on strong count for security posture","lesson04":"Loop each password in the audit list","lesson05":"report helper with default sec prefix","lesson06":"Mask passwords via slicing for safe display","lesson07":"Zip labels and scores for ranking tuples","lesson08":"Deduplicate passwords with a seen set","lesson09":"Comprehend gold HighlightRow for score 100","lesson10":"try/except on json.loads payload","lesson11":"ResultRow per masked password label","lesson12":"_rec_sum scores; O(n) audit complexity note","lesson13":"Assert payload not None; deepcopy stats dict","lesson14":"sorted zip(labels, scores) by score desc","lesson15":"re.compile lookahead policy + json password list","lesson16":"match strong count to posture; yield audit_trail"}),
    description: "Implement `audit_password_list(payload: str)` for:\n\n`{\"passwords\": [str, ...]}`\n\nStrong = ≥8 chars with upper, lower, digit, and symbol. Return `strong` count.",
    objectives: ["Apply regex password policy","Deduplicate entries","Rank by score"],
    starterCode: "def audit_password_list(payload: str):\n    \"\"\"Audit password strength from a JSON list.\"\"\"\n    pass",
    tests: ["import json\np = json.dumps({\"passwords\": [\"Abcdef1!\", \"weak\"]})\nr = audit_password_list(p)\nassert r[\"strong\"] >= 1"],
    solution: wrapSolution(`
def audit_password_list(payload: str) -> dict[str, Any]:
    """Score password strength using regex rules from security policy."""
    assert payload is not None
    strong = 0
    weak = 0
    try:
        data = json.loads(payload)
        passwords = data.get("passwords", [])
    except (json.JSONDecodeError, TypeError):
        passwords = []
    scores: list[float] = []
    labels: list[str] = []
    seen: set[str] = set()
    policy = re.compile(r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$")
    for i, raw in enumerate(passwords):
        pwd = str(raw).strip()
        masked = pwd[:2] + "*" * max(len(pwd) - 2, 0)
        if pwd in seen:
            continue
        seen.add(pwd)
        if policy.match(pwd):
            strong += 1
            scores.append(100.0)
            labels.append(masked)
        else:
            weak += 1
            scores.append(float(len(pwd)))
            labels.append(masked[:6])
    complexity = f"O({len(passwords)}) password audit"
    score_sum = _rec_sum(scores) if scores else 0.0
    pairs = sorted(zip(labels, scores), key=lambda t: t[1], reverse=True)
    best = pairs[0][0] if pairs else ""
    snapshot = deepcopy({"strong": strong, "weak": weak})
    assert snapshot["strong"] == strong
    rows = [ResultRow(l, s) for l, s in pairs[:3]]
    gold = [HighlightRow(l, s) for l, s in pairs if s >= 100.0]
    highlights = [r.describe() for r in gold]
    def report(tag: str = "sec") -> str:
        return f"{tag}:{strong} strong/{weak} weak"
    match strong:
        case 0:
            posture = "poor"
        case s if s >= len(passwords) // 2 + 1:
            posture = "good"
        case _:
            posture = "mixed"
    def audit_trail() -> Iterator[str]:
        yield report()
        yield complexity
    return {
        "strong": strong,
        "weak": weak,
        "best": best,
        "score_sum": round(score_sum, 2),
        "posture": posture,
        "unique": len(seen),
        "stats": snapshot,
        "rows": [r.describe() for r in rows],
        "highlights": highlights,
        "notes": list(audit_trail()),
        "complexity": complexity,
    }
`),
    solutionSteps: [
      step(52, "Define the main function with a typed payload parameter.", "lesson01"),
      step(54, "Docstring states the domain purpose of this capstone entry point.", "lesson02"),
      step(56, "Assert the input is not None before parsing — a debug guard from L13.", "lesson03"),
      step(58, "Initialize counters and empty collections for aggregation.", "lesson04"),
      step(60, "try/except wraps JSON or CSV parsing for malformed input.", "lesson05"),
      step(62, "Extract the primary data structure from the parsed payload.", "lesson06"),
      step(64, "Loop over each record with enumerate for stable indexing.", "lesson07"),
      step(66, "Normalize string fields using strip, lower, and title helpers.", "lesson08"),
      step(68, "Apply numeric comparisons and threshold checks on values.", "lesson09"),
      step(70, "Update dict tallies and set membership as you scan records.", "lesson10"),
      step(72, "Call _rec_sum for recursive aggregation with O(n) complexity.", "lesson11"),
      step(74, "Rank items with sorted, zip, and a key function.", "lesson12"),
      step(76, "deepcopy snapshots dict state; assert invariants hold.", "lesson13"),
      step(78, "Instantiate ResultRow or HighlightRow for ranked highlights.", "lesson14"),
      step(80, "match/case maps a summary metric to a human-readable status.", "lesson15"),
      step(82, "Generator yields status notes; list() materializes the stream.", "lesson16"),
      step(84, "Return the result dict with all required summary keys.", "lesson01"),
    ],
    explanation: "Compile the policy regex once, score each unique password, and highlight policy-compliant secrets.",
  },
  {
    id: "cap-07",
    title: "Event RSVP Manager",
    subtitle: "Estimate headcount from guest responses",
    difficulty: "beginner",
    expertLens: "RSVP tooling is conditional logic over structured guest records: yes/no branches, plus-one arithmetic, and ranked party sizes mirror event-planning scripts.",
    topics: ["json","conditionals","aggregation","L1–L16 synthesis"],
    lessonCoverage: buildLessonCoverage({"lesson01":"invite f-string reporting seats and yes count","lesson02":"Add party sizes (1 or 2) for headcount arithmetic","lesson03":"Branch on rsvp yes/no for guest tallies","lesson04":"Enumerate guests in the RSVP JSON list","lesson05":"invite helper with default evt prefix","lesson06":"Clean guest names with title case","lesson07":"Track names list and party weight floats","lesson08":"invited set and dietary preference dict","lesson09":"Comprehend big_parties HighlightRow for plus-one","lesson10":"try/except on json.loads guest payload","lesson11":"ResultRow and HighlightRow for party sizes","lesson12":"_rec_sum seat weights; O(n) guest list note","lesson13":"Assert payload not None; deepcopy dietary dict","lesson14":"sorted zip(names, weights) by party size","lesson15":"json.loads for guest RSVP structure","lesson16":"match headcount to fill tier; yield rsvp_feed"}),
    description: "Implement `manage_event_rsvp(payload: str)` for:\n\n`{\"guests\": [{\"name\": str, \"rsvp\": \"yes\"|\"no\", \"plus_one\": bool}, ...]}`\n\nReturn dict with `headcount` (yes guests + plus-ones).",
    objectives: ["Tally yes/no responses","Count plus-one guests","Rank largest parties"],
    starterCode: "def manage_event_rsvp(payload: str):\n    \"\"\"Compute event headcount from RSVP JSON.\"\"\"\n    pass",
    tests: ["import json\np = json.dumps({\"guests\": [{\"name\": \"sam\", \"rsvp\": \"yes\", \"plus_one\": True}]})\nr = manage_event_rsvp(p)\nassert r[\"headcount\"] >= 2"],
    solution: wrapSolution(`
def manage_event_rsvp(payload: str) -> dict[str, Any]:
    """Tally RSVP responses and estimate event headcount."""
    assert payload is not None
    headcount = 0
    yes = 0
    no = 0
    try:
        data = json.loads(payload)
        guests = data.get("guests", [])
    except (json.JSONDecodeError, TypeError):
        guests = []
    names: list[str] = []
    weights: list[float] = []
    dietary: dict[str, int] = {}
    invited: set[str] = set()
    for i, guest in enumerate(guests):
        name = _clean(str(guest.get("name", "guest")))
        rsvp = guest.get("rsvp", "no").strip().lower()
        plus = bool(guest.get("plus_one", False))
        invited.add(name.lower())
        if rsvp == "yes":
            yes += 1
            party = 2 if plus else 1
            headcount += party
            names.append(name)
            weights.append(float(party))
            dietary["yes"] = dietary.get("yes", 0) + party
        else:
            no += 1
            dietary["no"] = dietary.get("no", 0) + 1
    complexity = f"O({len(guests)}) guest list"
    seat_sum = _rec_sum(weights) if weights else 0.0
    ranked = sorted(zip(names, weights), key=lambda t: t[1], reverse=True)
    lead = ranked[0][0] if ranked else ""
    snapshot = deepcopy(dietary)
    assert snapshot.get("yes", 0) == headcount or headcount == 0
    rows = [ResultRow(n, w) for n, w in ranked[:3]]
    big_parties = [HighlightRow(n, w) for n, w in ranked if w >= 2.0]
    highlights = [r.describe() for r in big_parties]
    def invite(tag: str = "evt") -> str:
        return f"{tag}:{headcount} seats/{yes} yes"
    match headcount:
        case 0:
            fill = "empty"
        case h if h <= 10:
            fill = "intimate"
        case _:
            fill = "crowded"
    def rsvp_feed() -> Iterator[str]:
        yield invite()
        yield complexity
    return {
        "headcount": headcount,
        "yes": yes,
        "no": no,
        "lead": lead,
        "seat_sum": round(seat_sum, 2),
        "fill": fill,
        "invited": len(invited),
        "dietary": snapshot,
        "rows": [r.describe() for r in rows],
        "highlights": highlights,
        "notes": list(rsvp_feed()),
        "complexity": complexity,
    }
`),
    solutionSteps: [
      step(52, "Define the main function with a typed payload parameter.", "lesson01"),
      step(54, "Docstring states the domain purpose of this capstone entry point.", "lesson02"),
      step(56, "Assert the input is not None before parsing — a debug guard from L13.", "lesson03"),
      step(58, "Initialize counters and empty collections for aggregation.", "lesson04"),
      step(60, "try/except wraps JSON or CSV parsing for malformed input.", "lesson05"),
      step(62, "Extract the primary data structure from the parsed payload.", "lesson06"),
      step(64, "Loop over each record with enumerate for stable indexing.", "lesson07"),
      step(66, "Normalize string fields using strip, lower, and title helpers.", "lesson08"),
      step(68, "Apply numeric comparisons and threshold checks on values.", "lesson09"),
      step(70, "Update dict tallies and set membership as you scan records.", "lesson10"),
      step(72, "Call _rec_sum for recursive aggregation with O(n) complexity.", "lesson11"),
      step(74, "Rank items with sorted, zip, and a key function.", "lesson12"),
      step(76, "deepcopy snapshots dict state; assert invariants hold.", "lesson13"),
      step(78, "Instantiate ResultRow or HighlightRow for ranked highlights.", "lesson14"),
      step(80, "match/case maps a summary metric to a human-readable status.", "lesson15"),
      step(82, "Generator yields status notes; list() materializes the stream.", "lesson16"),
      step(84, "Return the result dict with all required summary keys.", "lesson01"),
    ],
    explanation: "Each yes RSVP adds 1 or 2 seats; aggregate recursively and highlight large parties.",
  },
  {
    id: "cap-08",
    title: "Flashcard Session Grader",
    subtitle: "Score a drill session against expected answers",
    difficulty: "beginner",
    expertLens: "Drill graders zip parallel lists (cards vs answers), apply string normalization, and compute percentage scores — the core of any autograder loop.",
    topics: ["json","strings","grading","L1–L16 synthesis"],
    lessonCoverage: buildLessonCoverage({"lesson01":"score_line f-string with correct/total and percent","lesson02":"Compute percent correct and map to letter grade","lesson03":"Compare given vs expected answer strings","lesson04":"Loop cards with index into parallel answers","lesson05":"score_line helper with default deck tag","lesson06":"Strip and lower case answers for fair matching","lesson07":"Track points list and missed question snippets","lesson08":"Topic tallies dict and seen question set","lesson09":"Comprehend streak HighlightRow for 100-point cards","lesson10":"try/except on json session payload","lesson11":"ResultRow for missed cards; HighlightRow for perfect","lesson12":"_rec_sum points; O(n) cards complexity","lesson13":"Assert payload not None; deepcopy topics dict","lesson14":"enumerate cards; zip implicit in parallel access","lesson15":"json.loads session with cards and answers arrays","lesson16":"match letter to mood; yield recap generator"}),
    description: "Implement `run_flashcard_session(payload: str)` for:\n\n`{\"cards\": [{\"q\": str, \"a\": str}, ...], \"answers\": [str, ...]}`\n\nReturn dict with `correct` match count.",
    objectives: ["Grade parallel Q/A lists","Normalize strings","Report percent score"],
    starterCode: "def run_flashcard_session(payload: str):\n    \"\"\"Grade a flashcard session JSON payload.\"\"\"\n    pass",
    tests: ["import json\np = json.dumps({\"cards\": [{\"q\": \"2+2\", \"a\": \"4\"}], \"answers\": [\"4\"]})\nr = run_flashcard_session(p)\nassert r[\"correct\"] == 1"],
    solution: wrapSolution(`
def run_flashcard_session(payload: str) -> dict[str, Any]:
    """Grade a flashcard drill session against supplied answers."""
    assert payload is not None
    correct = 0
    wrong = 0
    try:
        session = json.loads(payload)
        cards = session.get("cards", [])
        answers = session.get("answers", [])
    except (json.JSONDecodeError, TypeError):
        cards, answers = [], []
    points: list[float] = []
    missed: list[str] = []
    topics: dict[str, int] = {}
    seen_q: set[str] = set()
    for i, card in enumerate(cards):
        question = str(card.get("q", "")).strip()
        expected = str(card.get("a", "")).strip().lower()
        given = str(answers[i]).strip().lower() if i < len(answers) else ""
        topic = question.split()[0] if question else "general"
        seen_q.add(question)
        topics[topic] = topics.get(topic, 0) + 1
        if given == expected and expected:
            correct += 1
            points.append(100.0)
        else:
            wrong += 1
            points.append(0.0)
            missed.append(question[:20])
    complexity = f"O({len(cards)}) cards"
    total_pts = _rec_sum(points) if points else 0.0
    pct = (correct / len(cards) * 100.0) if cards else 0.0
    letter = _letter(pct)
    snapshot = deepcopy(topics)
    assert len(seen_q) <= len(cards)
    rows = [ResultRow(m, 0.0) for m in missed[:3]]
    streak = [HighlightRow(f"card-{i}", points[i]) for i in range(len(points)) if points[i] >= 100.0]
    highlights = [r.describe() for r in streak]
    def score_line(tag: str = "deck") -> str:
        return f"{tag}:{correct}/{len(cards)} @{pct:.0f}%"
    match letter:
        case "A" | "B":
            mood = "mastered"
        case "C" | "D":
            mood = "review"
        case _:
            mood = "retry"
    def recap() -> Iterator[str]:
        yield score_line()
        yield complexity
    return {
        "correct": correct,
        "wrong": wrong,
        "percent": round(pct, 2),
        "grade": letter,
        "mood": mood,
        "total_pts": round(total_pts, 2),
        "topics": snapshot,
        "rows": [r.describe() for r in rows],
        "highlights": highlights,
        "notes": list(recap()),
        "complexity": complexity,
    }
`),
    solutionSteps: [
      step(52, "Define the main function with a typed payload parameter.", "lesson01"),
      step(54, "Docstring states the domain purpose of this capstone entry point.", "lesson02"),
      step(56, "Assert the input is not None before parsing — a debug guard from L13.", "lesson03"),
      step(58, "Initialize counters and empty collections for aggregation.", "lesson04"),
      step(60, "try/except wraps JSON or CSV parsing for malformed input.", "lesson05"),
      step(62, "Extract the primary data structure from the parsed payload.", "lesson06"),
      step(64, "Loop over each record with enumerate for stable indexing.", "lesson07"),
      step(66, "Normalize string fields using strip, lower, and title helpers.", "lesson08"),
      step(68, "Apply numeric comparisons and threshold checks on values.", "lesson09"),
      step(70, "Update dict tallies and set membership as you scan records.", "lesson10"),
      step(72, "Call _rec_sum for recursive aggregation with O(n) complexity.", "lesson11"),
      step(74, "Rank items with sorted, zip, and a key function.", "lesson12"),
      step(76, "deepcopy snapshots dict state; assert invariants hold.", "lesson13"),
      step(78, "Instantiate ResultRow or HighlightRow for ranked highlights.", "lesson14"),
      step(80, "match/case maps a summary metric to a human-readable status.", "lesson15"),
      step(82, "Generator yields status notes; list() materializes the stream.", "lesson16"),
      step(84, "Return the result dict with all required summary keys.", "lesson01"),
    ],
    explanation: "Walk cards and answers in parallel, normalize strings, and map percentage to letter grades.",
  },
  {
    id: "cap-09",
    title: "Weather Feed Merger",
    subtitle: "Blend JSON and CSV temperature feeds by city",
    difficulty: "advanced",
    expertLens: "Data integration merges heterogeneous feeds: JSON arrays plus CSV rows keyed by city, with averaging when both sources agree — a miniature ETL capstone.",
    topics: ["json","csv","merge","L1–L16 synthesis"],
    lessonCoverage: buildLessonCoverage({"lesson01":"forecast f-string with merged count and average temp","lesson02":"Average duplicate city temps arithmetically","lesson03":"if/elif when city exists in feed dict","lesson04":"Separate loops over JSON list and CSV rows","lesson05":"forecast helper with default wx tag","lesson06":"Clean city names to title case","lesson07":"Collect temps list from CSV rows","lesson08":"feed dict keyed by city; cities set","lesson09":"Comprehend heat HighlightRow for temp ≥ 70","lesson10":"try/except on both json and csv parsing","lesson11":"ResultRow per city temp; HighlightRow for heat","lesson12":"_rec_sum temps; O(n) merge complexity","lesson13":"Assert both texts not None; deepcopy feed dict","lesson14":"sorted feed items by temperature desc","lesson15":"json.loads JSON feed + csv.DictReader CSV","lesson16":"match merged count to sync mode; yield wx_log"}),
    description: "Implement `merge_weather_feeds(json_text: str, csv_text: str)`.\n\nJSON: `[{\"city\": str, \"temp\": number}, ...]`\nCSV: `city,temp`\n\nAverage temps when city appears in both. Return `merged` overlap count.",
    objectives: ["Load two feed formats","Merge on city key","Rank hottest cities"],
    starterCode: "def merge_weather_feeds(json_text: str, csv_text: str):\n    \"\"\"Merge JSON and CSV weather feeds by city.\"\"\"\n    pass",
    tests: ["import json\nj = json.dumps([{\"city\": \"Boston\", \"temp\": 70}])\nc = \"city,temp\\nBoston,72\\n\"\nr = merge_weather_feeds(j, c)\nassert r[\"merged\"] >= 1"],
    solution: wrapSolution(`
def merge_weather_feeds(json_text: str, csv_text: str) -> dict[str, Any]:
    """Merge JSON and CSV weather feeds by city name."""
    assert json_text is not None and csv_text is not None
    merged = 0
    cities: set[str] = set()
    temps: list[float] = []
    feed: dict[str, float] = {}
    try:
        json_rows = json.loads(json_text)
        if not isinstance(json_rows, list):
            json_rows = []
    except (json.JSONDecodeError, TypeError):
        json_rows = []
    for row in json_rows:
        city = _clean(str(row.get("city", "")))
        temp = float(row.get("temp", 0))
        if city:
            feed[city] = temp
            cities.add(city.lower())
    try:
        reader = csv.DictReader(io.StringIO(csv_text))
        csv_rows = list(reader)
    except (csv.Error, TypeError):
        csv_rows = []
    for i, row in enumerate(csv_rows):
        city = _clean(str(row.get("city", "")))
        try:
            temp = float(row.get("temp", "0"))
        except (ValueError, TypeError):
            continue
        if city:
            if city in feed:
                feed[city] = (feed[city] + temp) / 2.0
                merged += 1
            else:
                feed[city] = temp
            cities.add(city.lower())
            temps.append(temp)
    complexity = f"O({len(json_rows) + len(csv_rows)}) feed merge"
    warm_sum = _rec_sum(temps) if temps else 0.0
    ranked = sorted(feed.items(), key=lambda t: t[1], reverse=True)
    hottest = ranked[0][0] if ranked else ""
    snapshot = deepcopy(feed)
    assert len(snapshot) >= merged or merged == 0
    rows = [ResultRow(c, t) for c, t in ranked[:3]]
    heat = [HighlightRow(c, t) for c, t in ranked if t >= 70.0]
    highlights = [r.describe() for r in heat]
    def forecast(tag: str = "wx") -> str:
        avg = warm_sum / len(temps) if temps else 0.0
        return f"{tag}:{merged} merged@{avg:.1f}F"
    match merged:
        case 0:
            sync = "json_only"
        case m if m >= 1:
            sync = "blended"
        case _:
            sync = "partial"
    def wx_log() -> Iterator[str]:
        yield forecast()
        yield complexity
    return {
        "merged": merged,
        "cities": len(cities),
        "hottest": hottest,
        "warm_sum": round(warm_sum, 2),
        "sync": sync,
        "feed": snapshot,
        "rows": [r.describe() for r in rows],
        "highlights": highlights,
        "notes": list(wx_log()),
        "complexity": complexity,
    }
`),
    solutionSteps: [
      step(52, "Define the main function with a typed payload parameter.", "lesson01"),
      step(54, "Docstring states the domain purpose of this capstone entry point.", "lesson02"),
      step(56, "Assert the input is not None before parsing — a debug guard from L13.", "lesson03"),
      step(58, "Initialize counters and empty collections for aggregation.", "lesson04"),
      step(60, "try/except wraps JSON or CSV parsing for malformed input.", "lesson05"),
      step(62, "Extract the primary data structure from the parsed payload.", "lesson06"),
      step(64, "Loop over each record with enumerate for stable indexing.", "lesson07"),
      step(66, "Normalize string fields using strip, lower, and title helpers.", "lesson08"),
      step(68, "Apply numeric comparisons and threshold checks on values.", "lesson09"),
      step(70, "Update dict tallies and set membership as you scan records.", "lesson10"),
      step(72, "Call _rec_sum for recursive aggregation with O(n) complexity.", "lesson11"),
      step(74, "Rank items with sorted, zip, and a key function.", "lesson12"),
      step(76, "deepcopy snapshots dict state; assert invariants hold.", "lesson13"),
      step(78, "Instantiate ResultRow or HighlightRow for ranked highlights.", "lesson14"),
      step(80, "match/case maps a summary metric to a human-readable status.", "lesson15"),
      step(82, "Generator yields status notes; list() materializes the stream.", "lesson16"),
      step(84, "Return the result dict with all required summary keys.", "lesson01"),
    ],
    explanation: "Seed from JSON, overlay CSV, average on collision, and report merge statistics.",
  },
  {
    id: "cap-10",
    title: "Python Snippet Reviewer",
    subtitle: "Lint a code snippet for structure metrics",
    difficulty: "intermediate",
    expertLens: "Lightweight static analysis — counting defs, catching indent quirks, tokenizing identifiers — teaches that programs are data you can inspect programmatically.",
    topics: ["regex","strings","metrics","L1–L16 synthesis"],
    lessonCoverage: buildLessonCoverage({"lesson01":"summary f-string with line and def counts","lesson02":"Average line length from char_sum / count","lesson03":"Classify quality by number of def statements","lesson04":"Loop each source line with enumerate","lesson05":"summary helper with default lint tag","lesson06":"rstrip/strip lines; detect indent style","lesson07":"Collect line lengths as float list","lesson08":"Unique identifier tokens in a set","lesson09":"Comprehend critical HighlightRow for indent issues","lesson10":"No parse failures — structural scan only","lesson11":"ResultRow per issue; HighlightRow for indent warn","lesson12":"_rec_sum line lengths; O(n) scan note","lesson13":"Assert code not None; deepcopy stats dict","lesson14":"enumerate lines; sorted issue list","lesson15":"re.findall for identifiers; re.match indent check","lesson16":"match defs to quality; yield lint_feed generator"}),
    description: "Implement `review_python_snippet(code: str)` returning structural metrics:\n\n- `lines`: non-empty line count\n- `defs`: function definitions\n- `imports`: import statements\n- `indent_warn`: suspicious 2-space indents",
    objectives: ["Scan lines for defs/imports","Tokenize identifiers","Flag indent issues"],
    starterCode: "def review_python_snippet(code: str):\n    \"\"\"Return structural metrics for a Python snippet.\"\"\"\n    pass",
    tests: ["r = review_python_snippet(\"def f(x):\\n  return x+1\\n\")\nassert r[\"lines\"] >= 2","r = review_python_snippet(\"def f(x):\\n  return x+1\\n\")\nassert r[\"defs\"] == 1"],
    solution: wrapSolution(`
def review_python_snippet(code: str) -> dict[str, Any]:
    """Statically review a Python snippet for basic structure metrics."""
    assert code is not None
    lines = code.splitlines()
    defs = 0
    imports = 0
    issues: list[str] = []
    lengths: list[float] = []
    tokens: set[str] = set()
    indent_warn = 0
    for i, raw in enumerate(lines):
        line = raw.rstrip()
        stripped = line.strip()
        if not stripped:
            continue
        lengths.append(float(len(stripped)))
        for word in re.findall(r"\\b[a-zA-Z_]\\w*\\b", stripped):
            tokens.add(word.lower())
        if stripped.startswith("def "):
            defs += 1
        elif stripped.startswith("import ") or stripped.startswith("from "):
            imports += 1
        elif re.match(r"^  \\S", line) and not line.startswith("    "):
            indent_warn += 1
            issues.append(f"line {i + 1}: indent")
    complexity = f"O({len(lines)}) line scan"
    char_sum = _rec_sum(lengths) if lengths else 0.0
    ranked = sorted(issues)
    snapshot = deepcopy({"defs": defs, "imports": imports})
    assert snapshot["defs"] == defs
    rows = [ResultRow(issue, float(i)) for i, issue in enumerate(ranked[:3])]
    critical = [HighlightRow(issue, float(i)) for i, issue in enumerate(ranked) if "indent" in issue]
    highlights = [r.describe() for r in critical]
    avg_len = char_sum / len(lengths) if lengths else 0.0
    def summary(tag: str = "lint") -> str:
        return f"{tag}:{len(lines)} lines/{defs} defs"
    match defs:
        case 0:
            quality = "script"
        case d if d == 1:
            quality = "single_fn"
        case _:
            quality = "module"
    def lint_feed() -> Iterator[str]:
        yield summary()
        yield complexity
    return {
        "lines": len(lines),
        "defs": defs,
        "imports": imports,
        "avg_len": round(avg_len, 2),
        "indent_warn": indent_warn,
        "quality": quality,
        "tokens": len(tokens),
        "stats": snapshot,
        "rows": [r.describe() for r in rows],
        "highlights": highlights,
        "notes": list(lint_feed()),
        "complexity": complexity,
    }
`),
    solutionSteps: [
      step(52, "Define the main function with a typed payload parameter.", "lesson01"),
      step(54, "Docstring states the domain purpose of this capstone entry point.", "lesson02"),
      step(56, "Assert the input is not None before parsing — a debug guard from L13.", "lesson03"),
      step(58, "Initialize counters and empty collections for aggregation.", "lesson04"),
      step(60, "try/except wraps JSON or CSV parsing for malformed input.", "lesson05"),
      step(62, "Extract the primary data structure from the parsed payload.", "lesson06"),
      step(64, "Loop over each record with enumerate for stable indexing.", "lesson07"),
      step(66, "Normalize string fields using strip, lower, and title helpers.", "lesson08"),
      step(68, "Apply numeric comparisons and threshold checks on values.", "lesson09"),
      step(70, "Update dict tallies and set membership as you scan records.", "lesson10"),
      step(72, "Call _rec_sum for recursive aggregation with O(n) complexity.", "lesson11"),
      step(74, "Rank items with sorted, zip, and a key function.", "lesson12"),
      step(76, "deepcopy snapshots dict state; assert invariants hold.", "lesson13"),
      step(78, "Instantiate ResultRow or HighlightRow for ranked highlights.", "lesson14"),
      step(80, "match/case maps a summary metric to a human-readable status.", "lesson15"),
      step(82, "Generator yields status notes; list() materializes the stream.", "lesson16"),
      step(84, "Return the result dict with all required summary keys.", "lesson01"),
    ],
    explanation: "Treat source as line data, regex-scan for structure, and flag indent anomalies.",
  },
  {
    id: "cap-11",
    title: "Inventory Order Fulfillment",
    subtitle: "Fill orders against warehouse stock levels",
    difficulty: "intermediate",
    expertLens: "Order fulfillment mutates inventory state in a loop, tracks partial success, and sums revenue — the transactional pattern behind e-commerce backends.",
    topics: ["json","mutation","business logic","L1–L16 synthesis"],
    lessonCoverage: buildLessonCoverage({"lesson01":"ship_note f-string for filled vs backorder counts","lesson02":"Multiply qty by price; compare stock vs demand","lesson03":"if qty valid and stock sufficient else backorder","lesson04":"Process each order line sequentially","lesson05":"ship_note helper with default wh prefix","lesson06":"Normalize SKU item keys to lower case","lesson07":"lines list of (item, qty) tuples filled","lesson08":"working stock dict mutated; skus set","lesson09":"Comprehend bulk HighlightRow for qty ≥ 2","lesson10":"try/except on json and int coercion","lesson11":"ResultRow per filled line; HighlightRow bulk","lesson12":"_rec_sum revenue list; O(n) order complexity","lesson13":"deepcopy stock before mutating; assert equality","lesson14":"sorted lines by qty; enumerate orders","lesson15":"json.loads orders and stock mapping","lesson16":"match filled count to status; yield pick_list"}),
    description: "Implement `fulfill_inventory_orders(payload: str)` for:\n\n`{\"stock\": {sku: int}, \"orders\": [{\"item\": str, \"qty\": int}, ...]}`\n\nDecrement stock when sufficient. Return `filled` count.",
    objectives: ["Mutate stock safely","Track backorders","Sum revenue"],
    starterCode: "def fulfill_inventory_orders(payload: str):\n    \"\"\"Fulfill orders against inventory stock levels.\"\"\"\n    pass",
    tests: ["import json\np = json.dumps({\"stock\": {\"pen\": 5}, \"orders\": [{\"item\": \"pen\", \"qty\": 2}]})\nr = fulfill_inventory_orders(p)\nassert r[\"filled\"] == 1"],
    solution: wrapSolution(`
def fulfill_inventory_orders(payload: str) -> dict[str, Any]:
    """Fill customer orders against on-hand stock levels."""
    assert payload is not None
    filled = 0
    backorder = 0
    try:
        data = json.loads(payload)
        stock = {k: int(v) for k, v in data.get("stock", {}).items()}
        orders = data.get("orders", [])
    except (json.JSONDecodeError, TypeError, ValueError):
        stock, orders = {}, []
    working = deepcopy(stock)
    assert working == stock or not stock
    lines: list[tuple[str, float]] = []
    skus: set[str] = set()
    revenue: list[float] = []
    for i, order in enumerate(orders):
        item = str(order.get("item", "")).strip().lower()
        qty = int(order.get("qty", 0))
        skus.add(item)
        on_hand = working.get(item, 0)
        if qty > 0 and on_hand >= qty:
            working[item] = on_hand - qty
            filled += 1
            lines.append((item, float(qty)))
            revenue.append(float(qty * 10))
        else:
            backorder += 1
            lines.append((item, 0.0))
    complexity = f"O({len(orders)}) order lines"
    rev_sum = _rec_sum(revenue) if revenue else 0.0
    ranked = sorted(lines, key=lambda t: t[1], reverse=True)
    top_item = ranked[0][0] if ranked else ""
    snapshot = deepcopy(working)
    rows = [ResultRow(it, q) for it, q in ranked[:3] if q > 0]
    bulk = [HighlightRow(it, q) for it, q in ranked if q >= 2.0]
    highlights = [r.describe() for r in bulk]
    def ship_note(tag: str = "wh") -> str:
        return f"{tag}:{filled} filled/{backorder} backorder"
    match filled:
        case 0:
            status = "stalled"
        case f if f >= len(orders):
            status = "complete"
        case _:
            status = "partial"
    def pick_list() -> Iterator[str]:
        yield ship_note()
        yield complexity
    return {
        "filled": filled,
        "backorder": backorder,
        "top_item": top_item,
        "revenue": round(rev_sum, 2),
        "status": status,
        "skus": len(skus),
        "stock_left": snapshot,
        "rows": [r.describe() for r in rows],
        "highlights": highlights,
        "notes": list(pick_list()),
        "complexity": complexity,
    }
`),
    solutionSteps: [
      step(52, "Define the main function with a typed payload parameter.", "lesson01"),
      step(54, "Docstring states the domain purpose of this capstone entry point.", "lesson02"),
      step(56, "Assert the input is not None before parsing — a debug guard from L13.", "lesson03"),
      step(58, "Initialize counters and empty collections for aggregation.", "lesson04"),
      step(60, "try/except wraps JSON or CSV parsing for malformed input.", "lesson05"),
      step(62, "Extract the primary data structure from the parsed payload.", "lesson06"),
      step(64, "Loop over each record with enumerate for stable indexing.", "lesson07"),
      step(66, "Normalize string fields using strip, lower, and title helpers.", "lesson08"),
      step(68, "Apply numeric comparisons and threshold checks on values.", "lesson09"),
      step(70, "Update dict tallies and set membership as you scan records.", "lesson10"),
      step(72, "Call _rec_sum for recursive aggregation with O(n) complexity.", "lesson11"),
      step(74, "Rank items with sorted, zip, and a key function.", "lesson12"),
      step(76, "deepcopy snapshots dict state; assert invariants hold.", "lesson13"),
      step(78, "Instantiate ResultRow or HighlightRow for ranked highlights.", "lesson14"),
      step(80, "match/case maps a summary metric to a human-readable status.", "lesson15"),
      step(82, "Generator yields status notes; list() materializes the stream.", "lesson16"),
      step(84, "Return the result dict with all required summary keys.", "lesson01"),
    ],
    explanation: "Deep-copy stock before mutation, fill when possible, and report partial fulfillment status.",
  },
  {
    id: "cap-12",
    title: "Curriculum Readiness Report",
    subtitle: "Certify course completion from quiz scores",
    difficulty: "advanced",
    expertLens: "This meta-capstone closes the loop: it reads progress JSON, checks all 16 lessons complete, averages quiz scores, and gates certification — mirroring LMS completion rules.",
    topics: ["json","grading","certification","L1–L16 synthesis"],
    lessonCoverage: buildLessonCoverage({"lesson01":"progress f-string with lessons done and quiz average","lesson02":"Average quiz scores; compare to PASS_THRESHOLD","lesson03":"ready True only when completed ≥ 16 and avg passes","lesson04":"Loop quiz_scores to find sub-60 gaps","lesson05":"progress helper with default curriculum tag","lesson06":"Name gap modules as quiz-N strings","lesson07":"quiz_scores as float list for averaging","lesson08":"modules dict maps quiz id to score","lesson09":"Comprehend stars HighlightRow for scores ≥ 90","lesson10":"try/except on json and float conversion","lesson11":"ResultRow per module; HighlightRow star scores","lesson12":"_rec_sum quiz scores; O(n) quiz scan note","lesson13":"Assert payload not None; deepcopy modules dict","lesson14":"sorted modules by score descending","lesson15":"json.loads lessons_completed and quiz_scores","lesson16":"match ready flag to gate; yield report_lines"}),
    description: "Implement `build_curriculum_report(payload: str)` for:\n\n`{\"lessons_completed\": int, \"quiz_scores\": [number, ...]}`\n\n`ready` is True when lessons_completed ≥ 16, average ≥ 60, and no quiz below 60.",
    objectives: ["Gate on 16 lessons","Average quiz scores","List failing modules"],
    starterCode: "def build_curriculum_report(payload: str):\n    \"\"\"Report whether the learner is course-ready.\"\"\"\n    pass",
    tests: ["import json\np = json.dumps({\"lessons_completed\": 16, \"quiz_scores\": [90, 80, 70]})\nr = build_curriculum_report(p)\nassert r[\"ready\"] is True","import json\np = json.dumps({\"lessons_completed\": 10, \"quiz_scores\": [90]})\nr = build_curriculum_report(p)\nassert r[\"ready\"] is False"],
    solution: wrapSolution(`
def build_curriculum_report(payload: str) -> dict[str, Any]:
    """Report course readiness from lesson completion and quiz scores."""
    assert payload is not None
    ready = False
    try:
        data = json.loads(payload)
        completed = int(data.get("lessons_completed", 0))
        quiz_scores = [float(s) for s in data.get("quiz_scores", [])]
    except (json.JSONDecodeError, TypeError, ValueError):
        completed, quiz_scores = 0, []
    total_lessons = 16
    gaps: list[str] = []
    modules: dict[str, float] = {}
    seen: set[int] = set()
    for i, score in enumerate(quiz_scores):
        seen.add(i)
        modules[f"quiz-{i + 1}"] = score
        if score < PASS_THRESHOLD:
            gaps.append(f"quiz-{i + 1}")
    complexity = f"O({len(quiz_scores)}) quiz scan"
    avg = _rec_sum(quiz_scores) / len(quiz_scores) if quiz_scores else 0.0
    letter = _letter(avg)
    remaining = total_lessons - completed
    if completed >= total_lessons and avg >= PASS_THRESHOLD and not gaps:
        ready = True
    snapshot = deepcopy(modules)
    assert len(seen) == len(quiz_scores)
    ranked = sorted(modules.items(), key=lambda t: t[1], reverse=True)
    best = ranked[0][0] if ranked else ""
    rows = [ResultRow(k, v) for k, v in ranked[:3]]
    stars = [HighlightRow(k, v) for k, v in ranked if v >= 90.0]
    highlights = [r.describe() for r in stars]
    def progress(tag: str = "curriculum") -> str:
        return f"{tag}:{completed}/{total_lessons} @{avg:.1f}%"
    match ready:
        case True:
            gate = "certified"
        case False if remaining <= 2:
            gate = "almost"
        case _:
            gate = "in_progress"
    def report_lines() -> Iterator[str]:
        yield progress()
        yield complexity
    return {
        "ready": ready,
        "completed": completed,
        "remaining": remaining,
        "average": round(avg, 2),
        "grade": letter,
        "gate": gate,
        "best_module": best,
        "gaps": gaps,
        "modules": snapshot,
        "rows": [r.describe() for r in rows],
        "highlights": highlights,
        "notes": list(report_lines()),
        "complexity": complexity,
    }
`),
    solutionSteps: [
      step(52, "Define the main function with a typed payload parameter.", "lesson01"),
      step(54, "Docstring states the domain purpose of this capstone entry point.", "lesson02"),
      step(56, "Assert the input is not None before parsing — a debug guard from L13.", "lesson03"),
      step(58, "Initialize counters and empty collections for aggregation.", "lesson04"),
      step(60, "try/except wraps JSON or CSV parsing for malformed input.", "lesson05"),
      step(62, "Extract the primary data structure from the parsed payload.", "lesson06"),
      step(64, "Loop over each record with enumerate for stable indexing.", "lesson07"),
      step(66, "Normalize string fields using strip, lower, and title helpers.", "lesson08"),
      step(68, "Apply numeric comparisons and threshold checks on values.", "lesson09"),
      step(70, "Update dict tallies and set membership as you scan records.", "lesson10"),
      step(72, "Call _rec_sum for recursive aggregation with O(n) complexity.", "lesson11"),
      step(74, "Rank items with sorted, zip, and a key function.", "lesson12"),
      step(76, "deepcopy snapshots dict state; assert invariants hold.", "lesson13"),
      step(78, "Instantiate ResultRow or HighlightRow for ranked highlights.", "lesson14"),
      step(80, "match/case maps a summary metric to a human-readable status.", "lesson15"),
      step(82, "Generator yields status notes; list() materializes the stream.", "lesson16"),
      step(84, "Return the result dict with all required summary keys.", "lesson01"),
    ],
    explanation: "Combine completion count, recursive average, and per-quiz gap detection to certify readiness.",
  },
];

export const CAPSTONE_PROJECTS: CapstoneProject[] = [...BASE_CAPSTONES, ...EXPERT_CAPSTONES];

export function getCapstoneById(id: string): CapstoneProject | undefined {
  return CAPSTONE_PROJECTS.find((p) => p.id === id);
}

export function validateCapstones(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const project of CAPSTONE_PROJECTS) {
    const result = capstoneProjectSchema.safeParse(project);
    if (!result.success) {
      errors.push(`${project.id}: ${result.error.message}`);
    }
  }
  return { ok: errors.length === 0, errors };
}
