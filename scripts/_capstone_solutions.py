from __future__ import annotations

import csv
import io
import json
import math
import re
from copy import deepcopy
from typing import Any, Iterator

PASS_THRESHOLD = 60.0


def _letter(score: float) -> str:
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    elif score >= PASS_THRESHOLD:
        return "D"
    return "F"


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip()).title()


def _rec_sum(values: list[float], index: int = 0) -> float:
    if index >= len(values):
        return 0.0
    return values[index] + _rec_sum(values, index + 1)


class ResultRow:
    """L11 — base row wrapper with class-level counter."""
    built = 0

    def __init__(self, label: str, value: float):
        self.label = _clean(label)
        self.value = value
        ResultRow.built += 1

    def describe(self) -> str:
        return f"{self.label}: {self.value:.2f}"


class HighlightRow(ResultRow):
    """L11 — inheritance + super()."""
    def describe(self) -> str:
        return super().describe() + " *"


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


def inspect_access_logs(log_text: str) -> dict[str, Any]:
    """Parse Apache-style access logs and flag error responses."""
    assert log_text is not None
    lines = log_text.strip().splitlines()
    errors = 0
    ok = 0
    ips: set[str] = set()
    routes: dict[str, int] = {}
    error_rows: list[tuple[str, int]] = []
    pattern = re.compile(r"^(\S+)\s+-\s+\S+\s+(\S+)\s+(\d{3})$")
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
        return f"{tag}:${total:.2f} across {len(months)} mo"
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
    policy = re.compile(r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$")
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
        for word in re.findall(r"\b[a-zA-Z_]\w*\b", stripped):
            tokens.add(word.lower())
        if stripped.startswith("def "):
            defs += 1
        elif stripped.startswith("import ") or stripped.startswith("from "):
            imports += 1
        elif re.match(r"^  \S", line) and not line.startswith("    "):
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
