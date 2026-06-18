# Expert Capstones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 new `expert`-tier "robustness / adversarial" capstones that reuse the existing capstone schema, solve page, and live test runner, distinguished by a new `expert` difficulty badge.

**Architecture:** New `src/content/capstones/expertProjects.ts` exports `EXPERT_CAPSTONES: CapstoneProject[]`, spread into the existing `CAPSTONE_PROJECTS` array in `projects.ts` via a minimal boundary edit. Add one `expert` enum value + its label + CSS badge. Everything downstream (CapstoneHome list, `/capstones/:id` route, `CapstoneEditor` Pyodide test runner, `validateCapstones`) works unchanged.

**Tech Stack:** TypeScript, React, Zod (`src/content/capstones/schema.ts`), Vitest, Pyodide live runner. Content verified with local `python3`.

**Spec:** `docs/superpowers/specs/2026-06-16-expert-capstones-design.md`

---

## Background the engineer needs

**A capstone** (`CapstoneProject`, `src/content/capstones/schema.ts`) is one object with: `id, title, subtitle, difficulty, expertLens, topics[], lessonCoverage (EXACTLY 16 entries), description, objectives[], starterCode, tests[] (≥1), solution, solutionSteps[] (≥1), explanation, solutionHint?`.

**Authoring helpers:**
- `wrapSolution(body)` (`buildSolution.ts:56`) returns `PYTHON_PREAMBLE + "\n" + PYTHON_HELPERS + "\n" + PYTHON_OOP + "\n" + body.trim() + "\n"`. The preamble imports `csv, io, json, math, re`, `from copy import deepcopy`, `from typing import Any, Iterator`, and defines `PASS_THRESHOLD = 60.0`. `PYTHON_HELPERS` defines `_letter(score)`, `_clean(text)`, `_rec_sum(values, index=0)` (recursive). `PYTHON_OOP` defines `ResultRow` (class attr `built`, `__init__`, `describe()`) and `HighlightRow(ResultRow)` (uses `super()`). Your `solution` body may call all of these.
- **Line-number offset:** the wrapped prefix is a fixed 51 lines, so **body line N → wrapped line N+51** (in existing `cap-01`, the body's first `def` is `solutionSteps` line 52). Set each `solutionStep.line` to the body line number + 51. Verify: your first step should point at your function's `def`.
- `buildLessonCoverage(concepts: Record<lessonId, string>)` (`lessonIndex.ts:30`) maps an object with a `conceptUsed` string (≥8 chars) for EACH of `lesson01..lesson16` into the 16-entry `lessonCoverage` array. You must supply all 16 keys.
- `step(line, teaching, lessonId?)` builds a `solutionStep`.

**Full-course synthesis convention:** like the existing 12 capstones, each expert capstone's reference solution must genuinely weave in all 16 lessons (use `_rec_sum` or your own recursion for L12; build `ResultRow`/`HighlightRow` for L11; a `yield` generator for L16 generators; `match/case` for L16; `deepcopy`+`assert` for L13; comprehensions for L9; `re`/`json`/`csv` for L15; etc.). The adversarial-robustness logic is the CORE; the weaving makes coverage honest. Read `cap-01` in `projects.ts` (lines ~8-105) as the structural template before authoring.

**Tests** run via `CapstoneEditor` → Pyodide: each `tests[i]` is a Python statement (usually `assert ...`) executed after the user's code in a shared namespace. Verify locally by running the wrapped reference solution + the asserts in `python3`.

**Difficulty CSS** lives at `src/styles/terminal-dojo.css:3345-3360` (`.difficulty`, `.difficulty.beginner|intermediate|advanced`).

---

## File Structure

- Modify: `src/content/capstones/schema.ts` — add `'expert'` to `CAPSTONE_DIFFICULTIES`.
- Create: `src/content/capstones/expertProjects.ts` — `EXPERT_CAPSTONES` (6 projects).
- Modify: `src/content/capstones/projects.ts` — rename inline array to `BASE_CAPSTONES`; import + spread into `CAPSTONE_PROJECTS`.
- Modify: `src/routes/Capstones/CapstoneHome.tsx` — `DIFFICULTY_LABEL` entry.
- Modify: `src/styles/terminal-dojo.css` — `.difficulty.expert` rule.
- Modify: `tests/registry.test.ts` — expert-count test.

---

### Task 1: Expert tier wiring + first capstone (`cap-exp-01`)

**Files:**
- Modify: `src/content/capstones/schema.ts`, `src/content/capstones/projects.ts`, `src/routes/Capstones/CapstoneHome.tsx`, `src/styles/terminal-dojo.css`
- Create: `src/content/capstones/expertProjects.ts`
- Test: `tests/registry.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/registry.test.ts` inside `describe('content registry', ...)`. The capstone list is exported as `CAPSTONE_PROJECTS` (already imported in this file):
```ts
  it('has at least 6 expert capstones with cap-exp- ids', () => {
    const expert = CAPSTONE_PROJECTS.filter((p) => p.difficulty === 'expert');
    expect(expert.length, 'expert capstone count').toBeGreaterThanOrEqual(6);
    for (const p of expert) {
      expect(p.id.startsWith('cap-exp-'), `${p.id} should be a cap-exp- id`).toBe(true);
    }
  });
```
(If `CAPSTONE_PROJECTS` is not yet imported in the test file, add it to the existing `from '../src/content/registry'` import.)

- [ ] **Step 2: Run, confirm FAIL**

Run: `npx vitest run tests/registry.test.ts -t "expert capstones"`
Expected: FAIL — 0 expert capstones (≥6 expected). (It may also fail earlier on the `'expert'` enum not existing once content is added — that's fine, this step just needs the assertion to fail.)

- [ ] **Step 3: Add the `expert` enum value** — `src/content/capstones/schema.ts`

Change:
```ts
export const CAPSTONE_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
```
to:
```ts
export const CAPSTONE_DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
```

- [ ] **Step 4: Add the difficulty label + CSS**

In `src/routes/Capstones/CapstoneHome.tsx`, the `DIFFICULTY_LABEL` map — add the `expert` entry:
```ts
const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};
```
In `src/styles/terminal-dojo.css`, after the `.difficulty.advanced { ... }` rule (around line 3360), add:
```css
.difficulty.expert {
  color: var(--magenta, #ff5cff);
}
```
(If `--magenta` is not a defined variable in this file, use a literal hot color like `#ff5cff` directly, or whichever "hottest" accent the theme defines — check the `:root` variables and pick the most intense one not already used by advanced/`--red`.)

- [ ] **Step 5: Create `src/content/capstones/expertProjects.ts` with `cap-exp-01`**

Author the **Resilient CSV Parser**. Use `cap-01` in `projects.ts` as the exact structural template (same field set, `buildLessonCoverage` with all 16 keys, `wrapSolution` body, `step(...)` walkthrough). The file skeleton:
```ts
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
    expertLens: '<one sentence on why this mirrors real data-ingestion work>',
    topics: ['csv', 'validation', 'strings', 'L1–L16 synthesis'],
    lessonCoverage: buildLessonCoverage({
      lesson01: '<concept used, >=8 chars>',
      lesson02: '...', lesson03: '...', lesson04: '...', lesson05: '...',
      lesson06: '...', lesson07: '...', lesson08: '...', lesson09: '...',
      lesson10: '...', lesson11: '...', lesson12: '...', lesson13: '...',
      lesson14: '...', lesson15: '...', lesson16: '...',
    }),
    description: 'Implement `parse_csv(text: str)` that returns a list of dict rows keyed by the header, tolerant of quoted fields with embedded commas, ragged rows (pad missing cells with ""), blank lines (skipped), and surrounding whitespace (trimmed). Empty/whitespace-only input returns [].',
    objectives: [
      'Parse quoted CSV fields containing commas',
      'Pad short rows and skip blank lines without raising',
      'Trim whitespace and handle empty input safely',
    ],
    starterCode: 'def parse_csv(text):\n    """Return a list of header-keyed dict rows from CSV text."""\n    pass',
    tests: [
      'assert parse_csv("a,b\\n1,2") == [{"a": "1", "b": "2"}]',
      'assert parse_csv(\'name,note\\n"Doe, J",hi\') == [{"name": "Doe, J", "note": "hi"}]',
      'assert parse_csv("a,b,c\\n1,2") == [{"a": "1", "b": "2", "c": ""}]',
      'assert parse_csv("a,b\\n\\n1,2\\n\\n") == [{"a": "1", "b": "2"}]',
      'assert parse_csv("") == [] and parse_csv("   ") == []',
      'assert parse_csv("a, b \\n 1 , 2 ") == [{"a": "1", "b": "2"}]',
    ],
    solution: wrapSolution(`
<full reference solution body — see Step 6 for requirements>
`),
    solutionSteps: [
      // step(bodyLineNumber + 51, 'teaching', 'lessonNN') for each meaningful line
    ],
    explanation: '<2-3 sentences on the robustness strategy and the full-course weave>',
  },
];
```

- [ ] **Step 6: Author cap-exp-01's reference solution (the core + the weave)**

The `solution` body must:
1. **Robustness core:** implement `parse_csv` so ALL six tests pass. Use `csv.reader(io.StringIO(text))` (handles quoted commas), filter blank lines (`if any(cell.strip() for cell in row)`), strip cells, pad short rows against the header (`values[i] if i < len(values) else ""`), and return `[]` for empty/whitespace input.
2. **Full-course weave (for honest 16-lesson coverage):** also exercise — without breaking the contract — recursion (call `_rec_sum` or a small recursive helper on row counts/lengths), an `OOP` row (`ResultRow`/`HighlightRow`), a comprehension (L9), a generator `yield` (L16), a `match/case` (L16), `deepcopy`+`assert` (L13), `re` or `json` usage (L15), `enumerate`/`zip`/`sorted` (L14). It is fine for `parse_csv` to be the public function and for the weave to live in small internal helpers it calls, as long as `parse_csv` still returns exactly the keyed rows the tests expect. Mirror how `cap-01` weaves everything around its core dict result.

- [ ] **Step 7: Wire the spread in `src/content/capstones/projects.ts`**

- Add the import below the existing imports at the top:
  ```ts
  import { EXPERT_CAPSTONES } from './expertProjects';
  ```
- Change the array declaration (line ~6) from:
  ```ts
  export const CAPSTONE_PROJECTS: CapstoneProject[] = [
  ```
  to:
  ```ts
  const BASE_CAPSTONES: CapstoneProject[] = [
  ```
- After the array's closing `];` (line ~1177, before `export function getCapstoneById`), add:
  ```ts
  export const CAPSTONE_PROJECTS: CapstoneProject[] = [...BASE_CAPSTONES, ...EXPERT_CAPSTONES];
  ```

- [ ] **Step 8: Verify cap-exp-01 in `python3`**

Reconstruct the wrapped solution and run it + the exact asserts. Because the preamble is imported stdlib, you can paste the body with `import csv, io` at top (or the full preamble) and run all six asserts:
```bash
python3 - <<'PY'
import csv, io
# <paste the parse_csv body + any helpers>
assert parse_csv("a,b\n1,2") == [{"a": "1", "b": "2"}]
assert parse_csv('name,note\n"Doe, J",hi') == [{"name": "Doe, J", "note": "hi"}]
assert parse_csv("a,b,c\n1,2") == [{"a": "1", "b": "2", "c": ""}]
assert parse_csv("a,b\n\n1,2\n\n") == [{"a": "1", "b": "2"}]
assert parse_csv("") == [] and parse_csv("   ") == []
assert parse_csv("a, b \n 1 , 2 ") == [{"a": "1", "b": "2"}]
print("OK")
PY
```
Expected: `OK`. Then confirm a **naive** `parse_csv` that splits on `,` FAILS the quoted-comma and/or ragged test (proves the adversarial tests bite). Also confirm the full woven body (with the L11–L16 weave) still returns the same results.

- [ ] **Step 9: Run gates**

Run: `npx vitest run tests/registry.test.ts` → expect PASS (the expert-count test now sees ≥1... it requires ≥6, so it will still FAIL until Tasks 2-3 add the rest — that is expected; the SCHEMA/coverage tests must pass). Confirm the "validates all lessons against schema", "≥10 capstones", and "each capstone covers all 16 lessons" tests PASS for cap-exp-01.
Run: `npx tsc --noEmit` → no errors.

> Note: the `-t "expert capstones"` count test stays red until 6 exist (Task 3). That is the expected TDD state; do not weaken the test. All OTHER tests must be green.

- [ ] **Step 10: Commit**

```bash
git add src/content/capstones/schema.ts src/content/capstones/expertProjects.ts src/content/capstones/projects.ts src/routes/Capstones/CapstoneHome.tsx src/styles/terminal-dojo.css tests/registry.test.ts
git commit -m "feat: add expert capstone tier + cap-exp-01 (Resilient CSV Parser)"
```

---

### Tasks 2–4: Author `cap-exp-02` … `cap-exp-06`

Append each new project to the `EXPERT_CAPSTONES` array in `src/content/capstones/expertProjects.ts`, mirroring the `cap-exp-01` structure exactly (full field set, `buildLessonCoverage` with all 16 keys, `wrapSolution` body with the robustness core + full-course weave, `step(bodyLine+51, ...)` walkthrough). **Batch:** Task 2 = `cap-exp-02` + `cap-exp-03`; Task 3 = `cap-exp-04` + `cap-exp-05`; Task 4 = `cap-exp-06`.

Per capstone, the adversarial core and a starting public-function contract:

| id | title | function | adversarial core (tests must hammer these) |
|---|---|---|---|
| cap-exp-02 | JSON Config Validator | `validate_config(payload: str)` | missing keys → defaults; wrong types → reject with reason; `null` values; nested defaults; malformed JSON → safe error result (not a crash) |
| cap-exp-03 | Log Stream Triage | `triage_logs(text: str)` | mixed/malformed lines, partial records, blank lines; skip-and-COUNT bad lines, summarize good ones (e.g. counts by level), never raise |
| cap-exp-04 | Messy Metrics Aggregator | `aggregate(values: list)` | items like `"NaN"`, `"$1,200"`, `""`, `None`, negatives, outliers; coerce what you can, drop what you can't, return safe stats (count/mean/max) with NO ZeroDivisionError on all-bad/empty input |
| cap-exp-05 | Form Field Validator | `validate_form(fields: dict)` | email/date/phone via `re`; trim/normalize; collect ALL field errors into a dict (not just the first); valid form → normalized dict |
| cap-exp-06 | Two-Source Reconciler | `reconcile(primary: list, secondary: list)` | merge two lists of dict records by an id key; handle missing-in-one, duplicate ids (last wins or merge), and conflicting values (deterministic resolution); return merged + a conflict report |

**The loop for each capstone (do all, commit once per task batch):**

- [ ] **Step 1: Author the project object** in `EXPERT_CAPSTONES` per the table — full field set, `difficulty: 'expert'`, id `cap-exp-0N`, ≥3 `tests` (aim 4-6) including the adversarial cases, full `solution` (core + 16-lesson weave), `solutionSteps` with `line = bodyLine + 51`, all-16 `lessonCoverage`, `expertLens`, `objectives`, `explanation`.

- [ ] **Step 2: Verify the solution in `python3`** — paste the body (with needed imports: `import re, json, csv, io, math`) + the exact asserts; confirm all pass (`OK`). Confirm a naive happy-path solution FAILS ≥1 adversarial test.

- [ ] **Step 3: Sanity-check solutionStep line numbers** — confirm the first step points at the function `def` (body line 1 → step line 52) and later steps are monotonic and within the wrapped solution's length.

- [ ] **Step 4: Run gates** — `npx vitest run tests/registry.test.ts` (schema, ≥10, all-16-coverage must pass; expert-count passes once 6 exist) and `npx tsc --noEmit` (no errors).

- [ ] **Step 5: Commit**
```bash
git add src/content/capstones/expertProjects.ts
git commit -m "feat: author expert capstones <ids in this batch>"
```

---

### Task 5: Final verification + UI smoke

**Files:** none (verification only), unless the expert-count test needs no further change.

- [ ] **Step 1: Run the expert-count test**

Run: `npx vitest run tests/registry.test.ts -t "expert capstones"`
Expected: PASS (6 expert capstones, all `cap-exp-` ids). If FAIL, finish the missing capstone.

- [ ] **Step 2: Full suite**

Run: `npx vitest run`
Expected: all green (incl. "validates all lessons against schema", "has at least 10 capstone projects" → now 18, "each capstone covers all 16 lessons"). Report any failure; if unrelated to capstones, report but do not fix.

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit` → no errors. Run: `npm run build` → success.

- [ ] **Step 4: UI smoke**

Start the dev server (or use Playwright via the project's `@playwright/test`). Open `/capstones`; confirm the home lists 18 cards including 6 with an "Expert" badge in the new color; open one expert capstone (`/capstones/cap-exp-01`); confirm the Work tab renders the starter code and the Solution tab renders the reference solution + walkthrough; optionally run its tests in the editor and confirm pass with the reference solution. (If a browser cannot run, confirm `npm run build` succeeds and report UI smoke as pending.)

- [ ] **Step 5: Commit (if anything changed in Step 1)**

Only if you adjusted a capstone in this task:
```bash
git add -A
git commit -m "test: finalize expert capstone verification"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** `expert` enum (Task 1 Step 3) ✓; label+CSS (Task 1 Step 4) ✓; `expertProjects.ts` + 6 projects (Task 1 Step 5-6, Tasks 2-4) ✓; `projects.ts` spread via `BASE_CAPSTONES` rename (Task 1 Step 7) ✓; 6 robustness domains (table in Tasks 2-4 + cap-exp-01) ✓; all-16 coverage + full-course weave (Background + Step 6) ✓; python3 verification + naive-fails-adversarial (Step 8, Task loop Step 2) ✓; expert-count test (Task 1 Step 1, Task 5) ✓; build/UI smoke (Task 5) ✓; YAGNI — no new route/home/schema beyond one enum value ✓.
- **Placeholders:** Task 1 carries complete wiring code and a fully-specified cap-exp-01 (contract, exact adversarial tests, file skeleton, weave checklist, python3 gate). The `<...>` markers inside the cap-exp-01 object are author-supplied prose/solution that the python3 + schema gates verify — hand-writing 6× ~70-line woven-and-verified Python solutions verbatim in the plan would be performing the implementation; the established `cap-01` template + per-capstone verification is the correct altitude (same approach used for Pieces 1-2). Each remaining capstone has an explicit function contract + adversarial core + verification gate.
- **Type consistency:** `CapstoneProject` / `EXPERT_CAPSTONES` / `CAPSTONE_PROJECTS` / `BASE_CAPSTONES` names consistent across Tasks 1-4; `buildLessonCoverage`/`wrapSolution`/`step` signatures match `buildSolution.ts`/`lessonIndex.ts`; the `+51` line offset and `cap-exp-0N` id convention are uniform; `difficulty: 'expert'` matches the enum added in Task 1.
