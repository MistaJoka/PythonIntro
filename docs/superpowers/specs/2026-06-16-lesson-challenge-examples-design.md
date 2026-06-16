# Lesson Challenge Examples — Design

**Date:** 2026-06-16
**Status:** Draft for review
**Scope:** First of three planned pieces. This spec covers **lesson examples only**. The future "challenge tier" surface and harder capstone projects are separate specs.

## Problem

The in-lesson examples and demonstrations are too basic for what a final exam or project demands. Concretely:

- Base lesson items (`src/content/lessons/lesson01–16.ts`) are single-concept, predict-the-output one-liners (`type(y)`, `int(3.9)`).
- The executable code challenges (`src/content/buildExtras.ts`) are trivial (`double(x)`, `is_even(n)`, `greet(name)`).
- There is a cliff: trivial lesson drills on one side, full multi-lesson capstone pipelines on the other, with nothing exam-realistic in between.

**Target difficulty:** coding-interview / leetcode-lite — edge cases, complexity reasoning, distractor-heavy logic — **scoped to intro Python** and to the tools each lesson has taught so far.

## Goal

Add ~64 harder, interview-grade items (4 per lesson × 16 lessons) without disturbing the gentle learning path, the base lesson files, or the existing trivial on-ramp challenges.

## Approach

**New additive content pool, surfaced as a dedicated "Challenge" concept per lesson.**

Mirror the existing extras pattern (`lessonExtras`, `interactiveExtras`, `buildExtras` are pools keyed by `lessonId`, merged into lessons at registry build time). Add one new pool and one new merge step.

### Components

1. **`src/content/challengeExtras.ts`** (new)
   - `export const CHALLENGE_EXTRAS: Record<string, Example[]>` keyed by `lessonId`.
   - 4 items per lesson: **2 executable `codeChallenge` + 2 reasoning items** (`traceSteps` and/or `multipleChoice`).
   - All items use existing `Example` schema types — **no schema changes**.
   - Item ids follow the existing convention: `l<N>-chal-<k>` (e.g. `l1-chal-1`).

2. **`src/content/registry.ts`** (edit)
   - Add `mergeChallengeExtras(lesson)` that appends a **new concept** to the end of the lesson's `concepts` array, rather than appending into the last existing concept (the behavior of `mergeBuildExtras` / `mergeInteractiveExtras`).
   - The appended concept:
     ```ts
     {
       id: `${lesson.id}-challenge`,
       title: 'Challenge — interview-grade',
       objective: 'Apply this lesson under exam pressure: edge cases, complexity, and distractors.',
       miniNote: 'Optional stretch. Uses only what this lesson and earlier lessons taught.',
       examples: CHALLENGE_EXTRAS[lesson.id] ?? [],
     }
     ```
   - Wire into the existing map chain:
     `.map((l) => mergeChallengeExtras(mergeBuildExtras(mergeInteractiveExtras(mergeLessonExtras(l)))))`
   - If a lesson has no challenge entries, append nothing (guard on empty/undefined), so `countLessonExamples` and the lesson UI stay correct.

### Data flow

`challengeExtras.ts` → `registry.ts` merge → `ALL_LESSONS` → existing lesson queue / `LessonSession` / example renderers. No consumer changes: the new items are ordinary `Example`s in an ordinary `Concept`, so the lesson queue, `ConceptStepper`, `CodeChallengeEditor` (live Pyodide test runner), trace viewer, and validation all work unchanged.

## Authoring constraints (the core of the work)

Each item must:

1. **Stay within taught tools.** Use only Python constructs introduced up to and including that lesson. Source of truth: the per-lesson inventory in `src/content/capstones/lessonIndex.ts` (`COURSE_LESSONS`). Examples:
   - L1 (variables, types, I/O, f-strings): **no** loops, conditionals, functions-with-logic beyond a single return, lists, etc. Difficulty comes from type/coercion edge cases and format-spec subtleties.
   - L3 (conditionals): branching edge cases, truthiness traps, boundary conditions — but no loops yet.
   - L4 (loops): off-by-one, loop-invariant, accumulation, `range` boundaries.
   - L7+ (lists/dicts/etc.): aliasing, mutation-during-iteration, complexity.
2. **Be genuinely harder** than the base items: edge cases, boundary values, complexity/Big-O reasoning (where lesson ≥ 12), distractor-dense options for MC, multi-step traces, and "what's the bug" framings for the `debug` stage.
3. **Carry correct metadata:** appropriate `stage` (`build` for code, `debug`/`stretch` for reasoning), accurate `tags` from `MISTAKE_TAGS`, a real `explanation`, and `trapNote` where a classic mistake applies.
4. **Have valid, edge-case-covering `tests`** for code challenges — each test is an `assert` string executed in the Pyodide namespace after the user's code. Tests must include boundary/empty/negative cases, not just the happy path. The spec author writes a reference solution mentally and verifies the asserts hold.

## Item-type guidance

- **codeChallenge (2/lesson):** a function with a non-obvious edge case in the tests. Tags reflect the trap. `starterCode` is a signature + `pass`. `solutionHint` optional.
- **Reasoning (2/lesson):** prefer `traceSteps` when execution order/state is the lesson (steps array must be accurate line-by-line), and `multipleChoice` when the point is a single sharp judgment with tempting distractors. Distractors must be plausible (common wrong answers), not filler.

## What we are NOT doing (YAGNI)

- No schema changes.
- No new UI components, routes, or skip/gating logic. The Challenge concept is just the last concept in the lesson; strong students reach it last, beginners can stop before it. Formal "optional/skippable" gating is deferred (belongs to the future challenge-tier piece).
- No changes to exam sets or capstones in this piece (the `finals.ts` exam assembly could later pull from this pool — out of scope here).
- No changes to the base `lesson01–16.ts` files.

## Testing & verification

- **Schema validation:** existing `validateAllLessons()` parses every merged lesson; run it (via the existing test suite, e.g. the registry/validation test path) to confirm all 64 new items satisfy `exampleSchema`.
- **Code-challenge correctness:** each new `codeChallenge`'s reference solution must pass all its `tests`. Verify by running the asserts against the reference solution in Pyodide (or a local Python) during authoring.
- **traceSteps accuracy:** the `steps` array (line numbers, `vars`, `output`) must match real execution.
- **Type-check & lint:** `tsc` / existing quality gates must pass.
- **Count sanity:** `LESSON_META.exampleCount` increases by 4 per lesson (or fewer if any lesson is intentionally lighter).

## Risks

- **Hardest authoring risk: out-of-scope tools.** Mitigated by the `lessonIndex.ts` inventory constraint and per-lesson review.
- **Incorrect tests/traces** shipping as "correct." Mitigated by executing reference solutions and traces before finalizing.
- **Difficulty creep making early lessons unfair.** Early lessons (L1–L3) have a thin toolset; their "hard" is type/format/branch subtlety, not algorithms. The reviewer should sanity-check that L1 challenges are solvable with L1 tools.

## Build sequence (for the implementation plan)

1. Add `mergeChallengeExtras` to `registry.ts` + create empty `CHALLENGE_EXTRAS` skeleton; confirm app + validation still pass with empty pool.
2. Author challenges lesson-by-lesson (or in small batches), validating each batch against schema + executing code-challenge solutions.
3. Final full-suite validation, type-check, and a manual UI pass on 2–3 lessons.
