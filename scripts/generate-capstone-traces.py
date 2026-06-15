#!/usr/bin/env python3
"""Generate line-by-line execution snapshots for capstone reference solutions."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from types import CodeType, FrameType
from typing import Any

ROOT = Path(__file__).parent.parent
BUILD_TS = ROOT / "src/content/capstones/buildSolution.ts"
PROJECTS_TS = ROOT / "src/content/capstones/projects.ts"

RUNS: list[tuple[str, str, tuple[Any, ...]]] = [
    ("cap-01", "analyze_academic_records", (json.dumps({"records": [{"name": "ada", "score": 95, "course": "py"}, {"name": "bob", "score": 72, "course": "py"}]}),)),
    ("cap-02", "process_task_board", (json.dumps({"tasks": [{"title": "read", "priority": 3, "done": False}]}),)),
    ("cap-03", "inspect_access_logs", ("127.0.0.1 - GET /ok 200\n127.0.0.1 - GET /fail 404\n",)),
    ("cap-04", "library_catalog_report", (json.dumps({"books": [{"title": "intro", "author": "mit", "pages": 400}]}),)),
    ("cap-05", "analyze_budget_csv", ("month,amount,category\n1,10.5,food\n1,5,food\n",)),
    ("cap-06", "audit_password_list", (json.dumps({"passwords": ["Abcdef1!", "weak"]}),)),
    ("cap-07", "manage_event_rsvp", (json.dumps({"guests": [{"name": "sam", "rsvp": "yes", "plus_one": True}]}),)),
    ("cap-08", "run_flashcard_session", (json.dumps({"cards": [{"q": "2+2", "a": "4"}], "answers": ["4"]}),)),
    ("cap-09", "merge_weather_feeds", (json.dumps([{"city": "Boston", "temp": 70}]), "city,temp\nBoston,72\n")),
    ("cap-10", "review_python_snippet", ("def f(x):\n  return x+1\n",)),
    ("cap-11", "fulfill_inventory_orders", (json.dumps({"stock": {"pen": 5}, "orders": [{"item": "pen", "qty": 2}]}),)),
    ("cap-12", "build_curriculum_report", (json.dumps({"lessons_completed": 16, "quiz_scores": [90, 80, 70]}),)),
]


def extract_ts_template(name: str) -> str:
    text = BUILD_TS.read_text()
    m = re.search(rf"{name} = `([\s\S]*?)`;", text)
    if not m:
        raise ValueError(f"Missing {name} in buildSolution.ts")
    return m.group(1)


def read_project_solution(project_id: str) -> str:
    text = PROJECTS_TS.read_text()
    m = re.search(rf'id: "{project_id}"[\s\S]*?solution: wrapSolution\(`([\s\S]*?)`\),', text)
    if not m:
        raise ValueError(f"No solution for {project_id}")
    preamble = extract_ts_template("PYTHON_PREAMBLE")
    helpers = extract_ts_template("PYTHON_HELPERS")
    oop = extract_ts_template("PYTHON_OOP")
    body = m.group(1).strip()
    return f"{preamble}\n{helpers}\n{oop}\n{body}\n"


def repr_val(v: Any, max_len: int = 56) -> str:
    try:
        s = repr(v)
    except Exception:
        s = f"<{type(v).__name__}>"
    if len(s) > max_len:
        return s[: max_len - 1] + "…"
    return s


def snapshot_locals(frame: FrameType) -> dict[str, str]:
    out: dict[str, str] = {}
    for k, v in frame.f_locals.items():
        if k.startswith("__"):
            continue
        out[k] = repr_val(v)
    return out


def trace_execution(source: str, fn_name: str, args: tuple[Any, ...]) -> dict[int, dict[str, str]]:
    namespace: dict[str, Any] = {"__name__": "__capstone__"}
    code = compile(source, "<capstone>", "exec")
    exec(code, namespace)
    fn = namespace[fn_name]
    runtime: dict[int, dict[str, str]] = {}

    def tracer(frame: FrameType, event: str, arg: Any):
        if event == "line" and frame.f_code.co_filename == "<capstone>":
            lineno = frame.f_lineno
            loc = snapshot_locals(frame)
            if loc:
                runtime[lineno] = loc
            elif frame.f_code.co_name in namespace and lineno not in runtime:
                runtime[lineno] = {}
        return tracer

    sys.settrace(tracer)
    try:
        fn(*args)
    finally:
        sys.settrace(None)
    return runtime


def synthetic_effect(line: str, namespace: dict[str, str], changed: list[str]) -> str:
    t = line.strip()
    if not t:
        return "Blank line — no execution; separates setup, helpers, classes, and main logic visually."
    if t.startswith("from __future__"):
        return "Activates postponed evaluation for type hints — enables dict[str, Any] syntax in annotations below."
    if t.startswith("import "):
        mods = changed or [t.replace("import ", "")]
        return f"Loads module(s) {', '.join(mods)} into namespace — required before json/csv/re calls in the pipeline."
    if t.startswith("from "):
        return f"Imports names from {t.split(' import ')[0].replace('from ', '')} — binds symbols used later in the main function."
    if re.match(r"^[A-Z_]+\s*=", t):
        name = t.split("=")[0].strip()
        return f"Stores policy constant {name} — comparisons like score >= PASS_THRESHOLD use this single source of truth."
    if t.startswith("def ") and not t.startswith("def __"):
        name = t.split("(")[0].replace("def ", "")
        return f"Registers helper {name}() — body not run until called; keeps main function focused on orchestration."
    if t.startswith("class "):
        name = t.split(":")[0].split("(")[0].replace("class ", "").strip()
        return f"Defines class {name} — instances format rows that become highlights[] in the returned dict."
    if t.startswith('"""') or t.startswith("'''"):
        return "Documentation string — no state change; describes parameters and return keys for readers."
    if t.startswith("if ") and ">=" in t:
        return "Conditional filter — controls which records enter passing lists and increment n."
    if t.startswith("elif ") or t.startswith("else:"):
        return "Alternate branch — only the matching path mutates state for this decision."
    if t.startswith("for "):
        return "Loop header — each iteration refreshes locals (name, score_val, …) and updates accumulators."
    if ".append(" in t:
        return "Mutates a list accumulator — len and contents feed average, ranking, or highlights later."
    if "json.loads" in t:
        return "Deserializes payload string → Python objects; records list drives the entire for-loop."
    if t.startswith("try:"):
        return "Enters guarded region — success path parses JSON; failure jumps to except without crashing."
    if t.startswith("except "):
        return "Malformed input lands here — sets safe empty records so return shape stays consistent."
    if "_rec_sum" in t:
        return "Recursive aggregation — sums scores with O(n) depth; result becomes avg numerator."
    if "sorted(" in t and "zip" in t:
        return "Ranks (name, score) pairs — pairs[0] becomes top_student in the output."
    if "deepcopy" in t:
        return "Clones tally dict — courses in return dict is independent snapshot."
    if t.startswith("match "):
        return "Structural pattern match on letter/band — sets status field consumed by return dict."
    if "yield " in t:
        return "Produces one streamed note — collected into notes[] in the result."
    if t.startswith("return {"):
        return "Execution completes — dict is the capstone output; tests assert keys like count, average, top_student."
    if t.startswith("return "):
        return "Returns value to caller — may exit helper or main function."
    if changed:
        return f"Mutates {', '.join(changed[:4])} — program state advances toward the final return dict."
    return "Executes as part of the data pipeline preparing the summary return value."


def build_namespace_step(line: str, namespace: dict[str, str]) -> list[str]:
    t = line.strip()
    changed: list[str] = []
    if t.startswith("from __future__"):
        namespace["(annotations)"] = "postponed eval ON"
        changed.append("(annotations)")
    elif t.startswith("import "):
        for part in t.replace("import ", "").split(","):
            mod = part.strip().split(" as ")[0].split(".")[0]
            namespace[mod] = f"<module {mod}>"
            changed.append(mod)
    elif t.startswith("from "):
        mod = t.split(" import ")[0].replace("from ", "").strip()
        for n in t.split(" import ")[1].split(","):
            n = n.strip().split(" as ")[0]
            if n:
                namespace[n] = f"<from {mod}>"
                changed.append(n)
    elif re.match(r"^[A-Z_]+\s*=", t):
        name = t.split("=")[0].strip()
        val = t.split("=", 1)[1].strip()
        namespace[name] = val
        changed.append(name)
    elif t.startswith("def "):
        name = t.split("(")[0].replace("def ", "").strip()
        namespace[name] = "<function>"
        changed.append(name)
    elif t.startswith("class "):
        name = t.split(":")[0].split("(")[0].replace("class ", "").strip()
        namespace[name] = "<class>"
        changed.append(name)
    mods = [k for k in namespace if not k.startswith("(") and namespace[k].startswith("<module")]
    if mods:
        namespace["(modules loaded)"] = ", ".join(sorted(set(m.split()[0] for m in mods if m != "(modules loaded)")))
    return changed


def output_note(line: str, vars_snap: dict[str, str]) -> str:
    t = line.strip()
    if t.startswith("return {"):
        keys = [k for k in ("count", "average", "top_student", "grade", "filled", "merged", "ready") if k in t or k in vars_snap]
        return "Return dict is the deliverable — " + (f"includes {', '.join(keys)}" if keys else "caller receives full summary")
    if "n += 1" in t or (t.startswith("n =") and "0" in t):
        return f"count in output ← n (currently {vars_snap.get('n', '?')})"
    if "top =" in t or "top_student" in t:
        return f"top_student in output ← {vars_snap.get('top', vars_snap.get('top_task', vars_snap.get('top_student', '?')))}"
    if "avg =" in t or "average" in t:
        return f"average in output ← computed mean of passing scores"
    if "letter =" in t or "grade" in t:
        return "grade in output ← letter mapping from numeric average"
    if "scores.append" in t:
        return "scores list grows — later used for avg and ranking"
    if "names.append" in t:
        return "names list grows — paired with scores for sorted ranking"
    return ""


PRIORITY_KEYS = (
    "payload",
    "body",
    "records",
    "n",
    "scores",
    "names",
    "avg",
    "top",
    "top_student",
    "top_task",
    "letter",
    "grade",
    "band",
    "count",
    "pending",
    "done",
    "filled",
    "merged",
    "ready",
    "headcount",
    "total",
    "strong",
    "correct",
    "errors",
    "ok",
    "rows",
    "highlights",
    "courses",
    "unique",
    "complexity",
    "rec",
    "name",
    "score_val",
    "i",
    "pairs",
    "snapshot",
    "notes",
    "PASS_THRESHOLD",
    "(modules loaded)",
)


def trim_vars(vars_snap: dict[str, str], changed: list[str], max_keys: int = 10) -> dict[str, str]:
    ordered: list[str] = []
    for k in changed:
        if k in vars_snap and k not in ordered:
            ordered.append(k)
    for k in PRIORITY_KEYS:
        if k in vars_snap and k not in ordered:
            ordered.append(k)
    for k in sorted(vars_snap):
        if k not in ordered and not k.startswith("_"):
            ordered.append(k)
    out: dict[str, str] = {}
    for k in ordered[:max_keys]:
        out[k] = vars_snap[k]
    return out


def merge_traces(project_id: str, fn_name: str, args: tuple[Any, ...]) -> list[dict[str, Any]]:
    source = read_project_solution(project_id)
    lines = source.splitlines()
    runtime = trace_execution(source, fn_name, args)

    namespace: dict[str, str] = {}
    prev: dict[str, str] = {}
    steps: list[dict[str, Any]] = []

    for i, raw in enumerate(lines):
        line_num = i + 1
        changed = build_namespace_step(raw, namespace)

        if line_num in runtime and runtime[line_num]:
            vars_snap = {**namespace, **runtime[line_num]}
        else:
            vars_snap = dict(namespace)

        effect = synthetic_effect(raw, vars_snap, changed)
        if line_num in runtime and runtime[line_num]:
            rt_keys = [k for k in runtime[line_num] if prev.get(k) != runtime[line_num].get(k)]
            if rt_keys:
                effect = synthetic_effect(raw, vars_snap, rt_keys)
                changed = list(dict.fromkeys(changed + rt_keys))

        note = output_note(raw, vars_snap)
        teaching = effect
        if note:
            teaching = f"{effect} → {note}"

        display_vars = trim_vars(vars_snap, changed)

        steps.append(
            {
                "line": line_num,
                "effect": effect,
                "teaching": teaching,
                "vars": display_vars,
                "changed": changed[:8],
                "outputNote": note,
            }
        )
        prev = vars_snap

    return steps


def main() -> None:
    out_dir = ROOT / "src/content/capstones/traces"
    out_dir.mkdir(parents=True, exist_ok=True)

    for project_id, fn_name, args in RUNS:
        steps = merge_traces(project_id, fn_name, args)
        dest = out_dir / f"{project_id}.json"
        dest.write_text(json.dumps(steps))
        print(f"✓ {project_id}: {len(steps)} steps ({dest.stat().st_size // 1024} KB)")

    manifest = [pid for pid, _, _ in RUNS]
    (out_dir / "manifest.json").write_text(json.dumps(manifest))
    print(f"Wrote {len(manifest)} trace files to {out_dir}")


if __name__ == "__main__":
    main()
