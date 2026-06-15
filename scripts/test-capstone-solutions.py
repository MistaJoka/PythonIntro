#!/usr/bin/env python3
"""Smoke-test all capstone reference solutions."""
import json
import importlib.util
import sys
from pathlib import Path

# Load solutions from a generated temp module
SOLUTIONS_PATH = Path(__file__).parent / "_capstone_solutions.py"

TESTS = [
    ("analyze_academic_records", [json.dumps({"records": [{"name": "ada", "score": 95, "course": "py"}]})], lambda r: r["count"] == 1),
    ("process_task_board", [json.dumps({"tasks": [{"title": "read", "priority": 3, "done": False}]})], lambda r: r["pending"] >= 1),
    ("inspect_access_logs", ["127.0.0.1 - GET /ok 200\n127.0.0.1 - GET /fail 404\n"], lambda r: r["errors"] >= 1),
    ("library_catalog_report", [json.dumps({"books": [{"title": "intro", "author": "mit", "pages": 400}]})], lambda r: r["titles"] >= 1),
    ("analyze_budget_csv", ["month,amount,category\n1,10.5,food\n1,5,food\n"], lambda r: r["total"] == 15.5),
    ("audit_password_list", [json.dumps({"passwords": ["Abcdef1!", "weak"]})], lambda r: r["strong"] >= 1),
    ("manage_event_rsvp", [json.dumps({"guests": [{"name": "sam", "rsvp": "yes", "plus_one": True}]})], lambda r: r["headcount"] >= 2),
    ("run_flashcard_session", [json.dumps({"cards": [{"q": "2+2", "a": "4"}], "answers": ["4"]})], lambda r: r["correct"] == 1),
    ("merge_weather_feeds", [json.dumps([{"city": "Boston", "temp": 70}]), "city,temp\nBoston,72\n"], lambda r: r["merged"] >= 1),
    ("review_python_snippet", ["def f(x):\n  return x+1\n"], lambda r: r["lines"] >= 2),
    ("fulfill_inventory_orders", [json.dumps({"stock": {"pen": 5}, "orders": [{"item": "pen", "qty": 2}]})], lambda r: r["filled"] == 1),
    ("build_curriculum_report", [json.dumps({"lessons_completed": 16, "quiz_scores": [90, 80, 70]})], lambda r: r["ready"] is True),
]

if __name__ == "__main__":
    if not SOLUTIONS_PATH.exists():
        print("Run generate-capstone-solutions first")
        sys.exit(1)
    spec = importlib.util.spec_from_file_location("cap", SOLUTIONS_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    failed = 0
    for name, args, check in TESTS:
        fn = getattr(mod, name)
        result = fn(*args)
        if not check(result):
            print(f"FAIL {name}: {result}")
            failed += 1
        else:
            print(f"OK {name}")
    sys.exit(failed)
