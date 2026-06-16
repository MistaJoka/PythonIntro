# Challenge Tier (Browsable Hard-Problem Library) — Design

**Date:** 2026-06-16
**Status:** Draft for review
**Scope:** Piece 2 of 3. Piece 1 (per-lesson challenge examples) is complete. Piece 3 (harder capstone projects) is a separate spec.

## Problem

The app's gentle lesson flow plus the new per-lesson challenge concept cover single-lesson difficulty. There is no dedicated surface for **harder, cross-lesson, multi-concept** problems — the kind a final project or exam combines from several topics at once. We want a browsable library of such problems, distinct from the calm lesson path, so strong students can stretch.

## Goal

A new **Challenge Tier**: a browsable library of 8 themed "challenge bundles" (~5 items each, ~40 new items total). Each bundle mixes code-with-live-tests and reasoning items (trace / multiple-choice) drawn from **multiple lessons**. Reuse existing rendering machinery wholesale.

## Approach (chosen: A)

**Tier-only content pool of "challenge bundles" reusing the existing `Example` schema, surfaced via a new landing page + a `ReviewSession` solve route.**

Rejected alternatives:
- **B — mirror the full capstone subsystem** (rich per-project schema, walkthroughs, dedicated editor): overkill; bundles are item collections, not single large projects; duplicates machinery.
- **C — fold into ExamPrep as another exam-set type**: conflates "timed practice final" with "browsable hard library"; muddies both surfaces.

### Why A fits

`ReviewSession` (`src/components/ReviewSession.tsx`) already renders any pool of example ids: it maps each id through `getExampleById` and filters misses (`ReviewSession.tsx:33-36`). Props: `{ exampleIds: string[], banner?, channel?, focusMode? }`. `Practice.tsx` uses exactly this. So once a bundle's `Example` items are resolvable via `getExampleById`, the solve flow — including live code execution (`CodeChallengeEditor` → `runCodeChallenge` in `src/engine/pyodide.ts`), traces, and SRS — works with no new runner or renderers.

## Components

### 1. Data model — `src/content/challenges/schema.ts` + `src/content/challenges/bundles.ts`

New `src/content/challenges/schema.ts`:
```ts
import { z } from 'zod';
import { exampleSchema } from '../schema';

export const CHALLENGE_THEMES = [
  'numbers', 'controlflow', 'textparse', 'datawrangling',
  'idioms', 'objects', 'recursion', 'errors',
] as const;

export const challengeBundleSchema = z.object({
  id: z.string(),
  title: z.string(),
  blurb: z.string(),
  theme: z.enum(CHALLENGE_THEMES),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  lessonRefs: z.array(z.string()).min(1),  // lesson ids this bundle draws on, e.g. 'lesson07'
  examples: z.array(exampleSchema).min(1),
});

export type ChallengeBundle = z.infer<typeof challengeBundleSchema>;
```

New `src/content/challenges/bundles.ts` exporting `CHALLENGE_BUNDLES: ChallengeBundle[]` — the 8 bundles. Items reuse the existing `Example` discriminated union (codeChallenge / traceSteps / multipleChoice). Example id convention: `ch-<theme>-<k>` (e.g. `ch-textparse-1`), globally unique and distinct from lesson-challenge ids (`l<N>-chal-<k>`).

### 2. Registry integration — `src/content/registry.ts`

- Import `CHALLENGE_BUNDLES` and `challengeBundleSchema`.
- Add exports:
  - `getChallengeBundles(): ChallengeBundle[]`
  - `getChallengeBundleById(id: string): ChallengeBundle | undefined`
- Extend `getExampleById(id)` to also search bundle items (after lessons and exam sets). This is the integration point that makes `ReviewSession` resolve bundle items. Return `{ example, lessonId: 'challenge' }` for bundle items (the `lessonId` field is informational; `'challenge'` is a sentinel consistent with the existing `'exam'` sentinel).
- Extend validation: in `validateAllLessons()` (or a sibling that the registry test calls), parse each bundle with `challengeBundleSchema`, and assert globally-unique example ids across lessons + bundles (so a bundle id can never collide with a lesson-challenge id).

### 3. Routes & components

- `src/routes/Challenges/ChallengeHome.tsx` — landing page. Lists the 8 bundles as cards, grouped/ordered by difficulty and showing a difficulty badge (I/II/III) + theme + `blurb` + lesson refs + item count. Mirror the structure and class names of `src/routes/ExamPrep/ExamPrepHome.tsx` / `src/routes/Capstones/CapstoneHome.tsx`, including a `TacticalBrief` header. Each card links to `/challenges/:bundleId`.
- `src/routes/Challenges/ChallengeBundlePage.tsx` — solve page. Resolves the bundle via `getChallengeBundleById(useParams().bundleId)`; if missing, `<Navigate to="/challenges" replace />`. Otherwise renders:
  ```tsx
  <ReviewSession
    exampleIds={bundle.examples.map((e) => e.id)}
    channel="CHALLENGE"
    banner={`${bundle.title} — ${bundle.examples.length} items`}
    focusMode
  />
  ```
  Wrap with a `TacticalBrief` like `Practice.tsx`.
- `src/App.tsx` — add inside the `AppLayout` route:
  ```tsx
  <Route path="challenges" element={<ChallengeHomePage />} />
  <Route path="challenges/:bundleId" element={<ChallengeBundlePage />} />
  ```
- Navigation:
  - `src/components/layout/CommandRail.tsx` — add one `NAV_ITEMS` entry, e.g. `{ to: '/challenges', label: 'Arena', glyph: '✦', end: false }` (final label/glyph chosen to fit the existing tactical set; keep consistent with siblings).
  - `src/components/layout/railLocus.ts` — add `'/challenges': { glyph: '✦', label: 'Challenges' }` to `NAV_BY_PATH`, and a `startsWith('/challenges/')` branch returning a challenge-workspace locus (mirroring the existing `/capstones/` branch).

### 4. The 8 themed bundles

Each bundle ~5 items mixing code + reasoning, drawing on multiple lessons. Difficulty is a 1–3 badge.

| id | title (theme) | difficulty | lessonRefs |
|---|---|---|---|
| `ch-numbers` | Numbers & Precision | 1 | lesson01, lesson02 |
| `ch-controlflow` | Control-Flow Traps | 1 | lesson03, lesson04 |
| `ch-textparse` | Text & Parsing | 2 | lesson06, lesson15 |
| `ch-datawrangling` | Data Wrangling | 2 | lesson07, lesson08, lesson09 |
| `ch-idioms` | Idioms & Iteration | 2 | lesson14, lesson16 |
| `ch-objects` | Objects & State | 2 | lesson11, lesson13 |
| `ch-recursion` | Recursion & Structure | 3 | lesson12, lesson07 |
| `ch-errors` | Errors & Edge Cases | 3 | lesson10, lesson05 |

**Authoring constraints** (same rigor as Piece 1):
- Each bundle: ~5 items, at least 2 executable `codeChallenge` and at least 2 reasoning items (mix of `traceSteps` / `multipleChoice`).
- Items may combine constructs from any lesson listed in `lessonRefs` (and earlier) — that is the point; they are cross-lesson. They must NOT require constructs beyond what the course teaches (≤ lesson 16).
- Genuine difficulty: edge cases, multi-step reasoning, plausible distractors. Harder than single-lesson challenges by virtue of combining concepts.
- `tags` are valid `MISTAKE_TAGS`; `stage` valid (`build` for code, `stretch`/`debug` for reasoning).
- traceSteps `line` numbers count blank lines; verify against the snippet.
- `codeChallenge` tests include boundary/edge cases and actually fail a naive/trap solution.

### 5. Difficulty model

`difficulty: 1 | 2 | 3` on each bundle, rendered as a badge (I / II / III). Purely presentational ordering/labeling. No gating, locking, or unlock progression in v1.

## Data flow

`bundles.ts` → registered in `registry.ts` → `ChallengeHome` lists `getChallengeBundles()` → user opens `/challenges/:bundleId` → `ChallengeBundlePage` resolves the bundle and passes its example ids to `ReviewSession` → `ReviewSession` resolves each via the extended `getExampleById` → existing example components render (incl. live `CodeChallengeEditor`). SRS/progress participate exactly as for any other example.

## Error handling

- Unknown `:bundleId` → redirect to `/challenges` (consistent with the app's `Navigate` fallback pattern).
- Empty/edge: bundles always have ≥1 item (schema `min(1)`); `ReviewSession` already handles an empty resolved list with its own empty state, but this should not occur.
- Validation failure (a malformed item) is caught at build/test time by `challengeBundleSchema` parsing in the registry validation test.

## Testing & verification

- **Schema validation:** registry validation parses every bundle with `challengeBundleSchema`; a registry test asserts it returns ok.
- **Resolution test:** a registry test asserts there are 8 bundles, every bundle example id resolves via `getExampleById`, and all example ids are globally unique across lessons, lesson-challenges, exams, and bundles.
- **Code-challenge correctness:** each `codeChallenge` reference solution verified against its `tests` in `python3` during authoring; a naive/trap solution should fail at least one test.
- **traceSteps accuracy:** each trace re-executed; `vars`/`output`/`answerIndex`/`line` confirmed.
- **Route/UI:** `ChallengeHome` lists 8 bundles with badges; a bundle opens and renders items; a code challenge runs and passes with a correct solution (manual UI smoke on 2 bundles).
- **Gates:** `npx vitest run` all green; `npx tsc --noEmit` clean; `npm run build` succeeds.

## File structure

- Create: `src/content/challenges/schema.ts` (bundle schema/types)
- Create: `src/content/challenges/bundles.ts` (the 8 bundles + ~40 items)
- Modify: `src/content/registry.ts` (register, resolve, validate)
- Create: `src/routes/Challenges/ChallengeHome.tsx`
- Create: `src/routes/Challenges/ChallengeBundlePage.tsx`
- Modify: `src/App.tsx` (2 routes)
- Modify: `src/components/layout/CommandRail.tsx` (1 nav item)
- Modify: `src/components/layout/railLocus.ts` (locus mapping)
- Modify: `tests/registry.test.ts` (bundle validation + resolution + uniqueness tests)

## Risks

- **Example-id collisions** with the 64 lesson-challenge ids — mitigated by the `ch-*` prefix and the global-uniqueness test.
- **Out-of-scope constructs** in cross-lesson items — mitigated by the ≤L16 constraint and python3 verification.
- **Nav crowding** — one new rail entry; keep label/glyph consistent with the existing tactical set.

## Build sequence (for the plan)

1. Schema + registry plumbing (resolve/validate) with an empty/stub bundle list; confirm app + tests still pass.
2. Routes + components + nav wired against stub bundles; confirm `/challenges` renders and a stub bundle solves.
3. Author the 8 bundles (~40 items) in batches, verifying each batch (schema + python3 + traces).
4. Final validation, strict resolution/uniqueness test, build, and UI smoke.
