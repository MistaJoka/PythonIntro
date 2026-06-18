# Expert Capstones (Robustness / Adversarial) — Design

**Date:** 2026-06-16
**Status:** Draft for review
**Scope:** Piece 3 of 3. Pieces 1 (lesson challenge examples) and 2 (challenge tier) are complete.

## Problem

The 12 existing capstones (`src/content/capstones/projects.ts`) are mostly `beginner`/`intermediate` single-function data pipelines over well-formed input. None demand the defensive, adversarial-input handling a real final project or interview problem requires. We want harder capstones whose difficulty comes from **robustness**: malformed/hostile input, edge cases, validation, and error handling the solution must survive.

## Goal

Add **6 new "expert" capstones** that reuse the existing capstone schema, solve page, and live test runner, but whose tests hammer the solution with adversarial input. Introduce an `expert` difficulty tier so they are visually distinct from existing `advanced` capstones.

## Approach (chosen: A)

**New `expertProjects.ts` file concatenated into `CAPSTONE_PROJECTS`, reusing the existing schema/runner.**

Rejected: **B** (append directly into the already-1,178-line `projects.ts` — worse separation); **C** (a separate expert subsystem with its own schema/route — overkill; these are capstones).

### Why A fits

`CapstoneEditor` (`src/components/capstones/CapstoneEditor.tsx`) already runs a capstone's `tests` against the user's code via Pyodide — adversarial tests are just more `assert` strings. The `/capstones/:projectId` route, the solution walkthrough (`solutionSteps`), and `validateCapstones` all operate on any `CapstoneProject`. So the only new things are content + one difficulty enum value + its label/CSS.

## Components

### 1. Difficulty tier — `src/content/capstones/schema.ts`

Add `'expert'` to the existing tuple:
```ts
export const CAPSTONE_DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
```
No other schema change. `difficulty: z.enum(CAPSTONE_DIFFICULTIES)` already gates the field.

### 2. UI label + style

- `src/routes/Capstones/CapstoneHome.tsx` — add to the `DIFFICULTY_LABEL` map: `expert: 'Expert'`.
- `src/styles/terminal-dojo.css` — add a `.difficulty.expert { ... }` rule alongside the existing `.difficulty.beginner|intermediate|advanced` rules (a distinct hot color, e.g. red/magenta, to read as "hardest"). Match the shape of the existing rules (find them around line 3345-3360 and mirror their properties/variables).
- `CapstoneProject.tsx` renders `project.difficulty` text raw, so it needs no change.

### 3. Content — `src/content/capstones/expertProjects.ts` (new)

Exports `EXPERT_CAPSTONES: CapstoneProject[]` — 6 projects, ids `cap-exp-01`..`cap-exp-06`, all `difficulty: 'expert'`. Reuse the existing authoring helpers from `buildSolution.ts` (`wrapSolution`, `step`) and `lessonIndex.ts` (`buildLessonCoverage`). Each project has the full schema payload: `title, subtitle, expertLens, topics, lessonCoverage (all 16), description, objectives, starterCode, tests, solution, solutionSteps, explanation`.

### 4. Wiring — `src/content/capstones/projects.ts`

Minimal edit at the array boundary:
- Rename the existing inline export `export const CAPSTONE_PROJECTS: CapstoneProject[] = [ /* 12 */ ];` to `const BASE_CAPSTONES: CapstoneProject[] = [ /* 12 */ ];`.
- Add an import: `import { EXPERT_CAPSTONES } from './expertProjects';`
- Add after the array: `export const CAPSTONE_PROJECTS: CapstoneProject[] = [...BASE_CAPSTONES, ...EXPERT_CAPSTONES];`

`validateCapstones()` (iterates `CAPSTONE_PROJECTS`) and the registry re-export pick up all 18 automatically. The solve route resolves expert ids via the existing `getCapstoneById`.

### 5. The 6 capstones (robustness / adversarial)

Each is a defensive function (a second helper function is allowed within the same `starterCode`/solution if it aids clarity). Tests must include hostile inputs that a naive happy-path solution fails. Domains are chosen to be distinct from the existing 12 and to exercise messy real-world data:

| id | title | the adversarial core |
|---|---|---|
| cap-exp-01 | Resilient CSV Parser | quoted fields with embedded commas, ragged/short rows, blank lines, header coercion with fallbacks; never raise on a bad row |
| cap-exp-02 | JSON Config Validator | missing keys, wrong types, `null`s, nested defaults; normalize valid config and reject invalid with a reason |
| cap-exp-03 | Log Stream Triage | mixed/malformed log lines, partial records; skip-and-count bad lines, summarize the good ones, never crash |
| cap-exp-04 | Messy Metrics Aggregator | values like `"NaN"`, `"$1,200"`, `""`, `None`, negatives/outliers; compute safe stats (no ZeroDivisionError on empty) |
| cap-exp-05 | Form Field Validator | emails/dates/phones via regex; trim/normalize; collect ALL field errors, not just the first |
| cap-exp-06 | Two-Source Reconciler | merge two messy datasets by key; handle missing, duplicate, and conflicting records deterministically |

**Authoring constraints:**
- All Python is within the course's taught surface (≤ lesson 16: types, control flow, functions, strings, lists/tuples, dicts/sets, comprehensions, files/exceptions, OOP, recursion, identity/copy, idioms, re/json/csv, generators/match). Use `try/except`, `.get` defaults, `re`, `json`, `csv` + `io.StringIO` (no real filesystem — Pyodide has no FS).
- `tests` (≥3 per capstone, realistically 4-6) must include at least one adversarial input (malformed/empty/wrong-type) that the naive solution fails. The reference `solution` must pass every test.
- `lessonCoverage` must cover all 16 lessons via `buildLessonCoverage({...})` with a `conceptUsed` string (≥8 chars) per lesson, consistent with `FULL_COURSE_NOTE`.
- `solutionSteps` provide a line-by-line teaching walkthrough of the reference solution (line numbers ≥1; `lessonId` optional per step).

## Data flow

`expertProjects.ts` → spread into `CAPSTONE_PROJECTS` in `projects.ts` → registry re-export → `CapstoneHome` lists all 18 (expert ones badged) → `/capstones/cap-exp-0N` → `CapstoneProject` page → `CapstoneEditor` runs the adversarial `tests` live via Pyodide. The "Solution" tab renders the reference solution + `solutionSteps` walkthrough. No consumer changes.

## Error handling

- Unknown capstone id → existing route behavior (the page handles a missing project; no change).
- A malformed expert project is caught at test/build time by `capstoneProjectSchema` parsing in `validateCapstones`.

## Testing & verification

- **Schema/registry:** `validateCapstones()` parses all 18; existing registry tests "has at least 10 capstone projects" and "each capstone covers all 16 lessons" still pass (now over 18).
- **New test** in `tests/registry.test.ts`: assert at least 6 capstones have `difficulty === 'expert'` (and, optionally, that their ids start with `cap-exp-`).
- **Solution correctness:** each expert `solution` verified in `python3` against its exact `tests` (all pass); a naive happy-path solution fails ≥1 adversarial test (confirm the trap bites).
- **Gates:** `npx vitest run` all green; `npx tsc --noEmit` clean; `npm run build` succeeds.
- **UI smoke:** Capstones home shows Expert-badged cards with the new color; opening one runs its tests; the Solution tab renders the walkthrough.

## File structure

- Modify: `src/content/capstones/schema.ts` (one enum value)
- Create: `src/content/capstones/expertProjects.ts` (6 projects)
- Modify: `src/content/capstones/projects.ts` (rename inline array to `BASE_CAPSTONES`; import + spread)
- Modify: `src/routes/Capstones/CapstoneHome.tsx` (`DIFFICULTY_LABEL` entry)
- Modify: `src/styles/terminal-dojo.css` (`.difficulty.expert` rule)
- Modify: `tests/registry.test.ts` (expert-count test)

## Risks

- **Solution must be self-consistent** (the reference solution genuinely passes the adversarial tests) — mitigated by python3 verification per capstone.
- **`solution` uses the shared preamble** (`wrapSolution` injects stdlib + helper classes) — authors must ensure expert solutions are compatible with that preamble (or write a self-contained solution string). Verify the wrapped solution runs.
- **16-lesson coverage is heavy** per capstone — mitigated by reusing `buildLessonCoverage` and concise `conceptUsed` strings.

## Build sequence (for the plan)

1. Add `'expert'` enum + label + CSS; create `expertProjects.ts` with the first capstone (`cap-exp-01`) and wire the spread into `projects.ts`; confirm validation + UI render with one expert capstone.
2. Author `cap-exp-02..06` in batches, verifying each solution in python3 against its adversarial tests.
3. Add the expert-count test; full validation, build, and UI smoke.
