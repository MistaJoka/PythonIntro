# Lesson Challenge Examples Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ~64 interview-grade ("leetcode-lite") challenge items (4 per lesson × 16 lessons) to the intro-Python app via a new additive content pool, without touching base lesson files or changing the schema/UI.

**Architecture:** A new `src/content/challengeExtras.ts` exports `CHALLENGE_EXTRAS: Record<lessonId, Example[]>`. A new `mergeChallengeExtras` step in `registry.ts` appends a dedicated "Challenge — interview-grade" *concept* to the end of each lesson at build time. All items reuse the existing `Example` discriminated-union schema, so the lesson queue, `CodeChallengeEditor` (live Pyodide test runner), trace viewer, and `validateAllLessons()` all work unchanged.

**Tech Stack:** TypeScript, Zod schema (`src/content/schema.ts`), Vitest (`tests/`), Pyodide for live Python (`src/engine/pyodide.ts`). Authoring is verified with local `python3` + `npx vitest`.

**Spec:** `docs/superpowers/specs/2026-06-16-lesson-challenge-examples-design.md`

---

## Background the engineer needs

**How content is assembled.** `src/content/registry.ts` imports the 16 base lessons and maps each through a chain of merge functions that fold in "extras" pools keyed by `lessonId`:

```ts
].map((l) => mergeBuildExtras(mergeInteractiveExtras(mergeLessonExtras(l))));
```

`mergeBuildExtras` / `mergeInteractiveExtras` append their examples into the **last existing concept**. We are adding a different merge: `mergeChallengeExtras` appends a **new concept** so challenges are grouped and appear last in each lesson.

**The `Example` schema** (`src/content/schema.ts`) is a discriminated union on `type`. The two types this plan uses:

- `codeChallenge` — fields: `id, type:'codeChallenge', stage, tags, prompt, explanation, trapNote?, starterCode, tests: string[], solutionHint?`. Each `tests[i]` is a Python statement (normally `assert ...`) run **after** the user's code in a shared namespace by `runCodeChallenge` (`src/engine/pyodide.ts:112`).
- `multipleChoice` — fields: `... options: string[] (min 2), answerIndex: number`.
- `traceSteps` — fields: `... code, steps: [{line, vars: Record<string,string>, output?, note?}], question, options (4–6), answerIndex`.

`stage` ∈ `'see'|'try'|'build'|'debug'|'stretch'`. `tags` are from `MISTAKE_TAGS` in `schema.ts` (e.g. `typeCoercion, floatPrecision, aliasing, mutation, offByOne, loopLogic, truthiness, recursion, comprehension, identity, shallowCopy, ...`).

**Per-lesson tool inventory** (source of truth: `src/content/capstones/lessonIndex.ts`). A lesson's challenges may use ONLY tools from its row and earlier rows:

| Lesson | Allowed tools (cumulative) |
|---|---|
| L1 | variables, types, `print`, `input`, int/float/str conversion, f-strings, round/arithmetic |
| L2 | + arithmetic operators, comparisons, boolean logic (`and/or/not`), `//`, `%`, `**` |
| L3 | + `if/elif/else`, truthiness |
| L4 | + `while`, `for`, `range` |
| L5 | + `def`, parameters, scope, `return`, default args |
| L6 | + string slicing, string methods, immutability |
| L7 | + lists, tuples, mutation, aliasing, indexing |
| L8 | + dicts, sets, keys, uniqueness |
| L9 | + comprehensions, `import` |
| L10 | + `try/except`, file I/O patterns |
| L11 | + classes, `__init__`, methods, inheritance, `super()` |
| L12 | + recursion, base cases, Big-O reasoning |
| L13 | + `is` vs `==`, `copy`/`deepcopy`, `assert` |
| L14 | + `enumerate`, `zip`, `sorted(key=...)` |
| L15 | + `re`, `json`, `csv` |
| L16 | + generators/`yield`, type hints, `match/case` |

**Difficulty bar.** Each item must be meaningfully harder than the base lesson items: edge/boundary cases, classic traps, distractor-dense options, multi-step traces, complexity reasoning (L12+). Early lessons (L1–L3) get their difficulty from type/coercion/float/branch subtleties, NOT algorithms.

---

## Authoring verification harness (use for every code & trace item)

**Verify a `codeChallenge`** — its reference solution must pass every assert. Run locally:

```bash
python3 - <<'PY'
# paste reference solution, then the test asserts
def to_cents(price):
    return round(float(price) * 100)

assert to_cents("12.34") == 1234
assert to_cents("0.10") == 10
assert to_cents("100") == 10000
print("OK")
PY
```
Expected: `OK` with no AssertionError. If it raises, the item is wrong — fix the tests or solution before adding it.

**Verify a `traceSteps`** — run the `code` in `python3` and confirm each `steps[i].vars` and `output` matches real execution. Mismatched traces ship as "correct" and are a bug.

**Validate schema + structure:**
```bash
npx vitest run tests/registry.test.ts
```

---

## File Structure

- **Create** `src/content/challengeExtras.ts` — the `CHALLENGE_EXTRAS` pool (all 64 items). One responsibility: challenge content.
- **Modify** `src/content/registry.ts` — add `mergeChallengeExtras`, wire it into the map chain, export nothing new.
- **Modify** `tests/registry.test.ts` — add structural assertions for the challenge concept.

---

### Task 1: Mechanism + Lesson 1 challenges (proves the pipeline end-to-end)

**Files:**
- Create: `src/content/challengeExtras.ts`
- Modify: `src/content/registry.ts`
- Test: `tests/registry.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/registry.test.ts` inside the `describe('content registry', ...)` block:

```ts
  it('appends a challenge concept with 4 items to lesson 1', () => {
    const l1 = getAllLessons()[0];
    const challenge = l1.concepts.find((c) => c.id === 'lesson01-challenge');
    expect(challenge, 'lesson01 challenge concept missing').toBeDefined();
    expect(challenge!.title).toBe('Challenge — interview-grade');
    expect(challenge!.examples).toHaveLength(4);
    expect(challenge!.examples.filter((e) => e.type === 'codeChallenge')).toHaveLength(2);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/registry.test.ts -t "challenge concept"`
Expected: FAIL — `lesson01 challenge concept missing` (concept does not exist yet).

- [ ] **Step 3: Create `src/content/challengeExtras.ts` with lesson 1's 4 items**

These 4 are the canonical template for all later lessons. All solutions/traces below are verified with the harness. Note: L1 may NOT use loops, conditionals, or comparisons (those are L2–L4) — difficulty comes from coercion/float/format traps.

```ts
import type { Example } from './schema';

/**
 * Interview-grade challenge items, keyed by lessonId.
 * Constraint: each lesson's items use ONLY tools taught up to and including
 * that lesson (see capstones/lessonIndex.ts). 4 per lesson: 2 codeChallenge + 2 reasoning.
 */
export const CHALLENGE_EXTRAS: Record<string, Example[]> = {
  lesson01: [
    {
      id: 'l1-chal-1',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['floatPrecision', 'typeCoercion'],
      prompt:
        'Write to_cents(price) that takes a price as a string of dollars (e.g. "12.34") and returns the whole number of cents as an int.',
      starterCode: 'def to_cents(price):\n    pass',
      tests: [
        'assert to_cents("12.34") == 1234',
        'assert to_cents("0.10") == 10',
        'assert to_cents("100") == 10000',
      ],
      explanation:
        'float("0.10") * 100 is 10.000000000000002. int() would truncate to 9 — round() gives the correct 10. Return round(float(price) * 100).',
      trapNote: 'int(float(price) * 100) silently loses a cent on values like 0.10 and 0.29.',
      solutionHint: 'Use round(...), not int(...), after multiplying.',
    },
    {
      id: 'l1-chal-2',
      type: 'codeChallenge',
      stage: 'build',
      tags: ['typeCoercion'],
      prompt:
        'Write percent(part, whole) that returns a string like "33.3%": part/whole as a percentage rounded to one decimal place.',
      starterCode: 'def percent(part, whole):\n    pass',
      tests: [
        'assert percent(1, 3) == "33.3%"',
        'assert percent(0, 5) == "0.0%"',
        'assert percent(5, 4) == "125.0%"',
      ],
      explanation:
        'Return f"{part / whole * 100:.1f}%". The :.1f format spec rounds to one decimal and forces a trailing zero (0.0, not 0).',
      trapNote: 'Plain str(part/whole*100) gives "33.33333333333333", not "33.3".',
    },
    {
      id: 'l1-chal-3',
      type: 'multipleChoice',
      stage: 'stretch',
      tags: ['typeCoercion'],
      prompt: 'In Python 3, what is type(7 // 2 + 1.0)?',
      options: ['float', 'int', 'str', 'NoneType'],
      answerIndex: 0,
      explanation:
        '7 // 2 is 3 (int floor division), but 3 + 1.0 promotes to float. Any float in the expression makes the result a float.',
      trapNote: '// is integer division, but mixing with a float still yields a float.',
    },
    {
      id: 'l1-chal-4',
      type: 'multipleChoice',
      stage: 'debug',
      tags: ['floatPrecision'],
      prompt: 'What does 0.1 + 0.2 == 0.3 evaluate to?',
      options: ['False', 'True', '0.3', 'TypeError'],
      answerIndex: 0,
      explanation:
        '0.1 + 0.2 is 0.30000000000000004 in IEEE-754 binary floating point, which is not exactly 0.3. Compare floats with a tolerance (abs(a - b) < 1e-9), never ==.',
      trapNote: 'Never test float equality with ==.',
    },
  ],
};
```

- [ ] **Step 4: Verify lesson 1's code challenges pass their tests**

Run the harness for `l1-chal-1` and `l1-chal-2` (see "Authoring verification harness"). Expected: `OK` for each.

- [ ] **Step 5: Add `mergeChallengeExtras` to `src/content/registry.ts`**

Add the import near the other extras imports:

```ts
import { CHALLENGE_EXTRAS } from './challengeExtras';
```

Add this function next to `mergeBuildExtras`:

```ts
function mergeChallengeExtras<T extends { id: string; concepts: { id: string; title: string; objective: string; miniNote?: string; examples: Example[] }[] }>(
  lesson: T,
): T {
  const extras = CHALLENGE_EXTRAS[lesson.id];
  if (!extras?.length) return lesson;
  const challengeConcept = {
    id: `${lesson.id}-challenge`,
    title: 'Challenge — interview-grade',
    objective: 'Apply this lesson under exam pressure: edge cases, complexity, and distractors.',
    miniNote: 'Optional stretch. Uses only what this lesson and earlier lessons taught.',
    examples: extras,
  };
  return { ...lesson, concepts: [...lesson.concepts, challengeConcept] };
}
```

Update the map chain (append `mergeChallengeExtras` as the OUTERMOST call so the challenge concept lands last):

```ts
].map((l) => mergeChallengeExtras(mergeBuildExtras(mergeInteractiveExtras(mergeLessonExtras(l)))));
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/registry.test.ts`
Expected: PASS — all existing tests plus the new "challenge concept" test. (The existing "validates all lessons against schema" test now also validates the 4 new items.)

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/content/challengeExtras.ts src/content/registry.ts tests/registry.test.ts
git commit -m "feat: add challenge concept mechanism + lesson 1 challenges"
```

---

### Tasks 2–16: Author challenges for lessons 2–16

Each task is identical in shape — author 4 items for one lesson, verify, commit. Repeat the loop below for each lesson, substituting that lesson's allowed tools (from the inventory table) and trap focus. **Do NOT exceed the lesson's tool inventory.**

Per-lesson trap focus (use these to pick genuinely hard, in-scope problems):

- **L2** (operators): operator precedence, `%` with negatives, `and`/`or` short-circuit & return values, `**` right-associativity, int vs float division.
- **L3** (conditionals): truthiness of `0`/`""`/`[]`/`None`, chained comparisons (`1 < x < 10`), `elif` fall-through, boundary `>=` vs `>`.
- **L4** (loops): off-by-one in `range`, `range(start, stop, step)` boundaries, accumulator bugs, `while` termination, nested-loop counts.
- **L5** (functions): default-argument evaluation, `return` vs `print`, local vs enclosing scope, multiple returns, missing return → `None`.
- **L6** (strings): negative/step slicing (`s[::-1]`, `s[1:-1]`), immutability (methods return new strings), `.split()`/`.join()` edge cases, `in` substring.
- **L7** (lists/tuples): aliasing (`b = a` vs `b = a[:]`), mutation during iteration, `list.sort()` returns `None`, tuple immutability, nested-list shallow copy. Tags: `aliasing`, `mutation`, `shallowCopy`.
- **L8** (dicts/sets): missing-key `KeyError` vs `.get`, dict insertion order, set dedup, `dict.keys()` view, hashability. Tags: `dictKeys`.
- **L9** (comprehensions/modules): nested comprehension order, conditional comprehension, set/dict comprehension, `if` filter vs `if/else` expression. Tags: `comprehension`.
- **L10** (files/exceptions): `except` ordering (specific before general), `try/except/else/finally` flow, exception type matching. Tags: `exceptionType`, `traceback`.
- **L11** (OOP): `__init__` vs class attribute, mutable class-attribute sharing, `super()`, method resolution, `self`. Tags: `oopAttrs`.
- **L12** (recursion/Big-O): base case correctness, recursion depth/accumulation, Big-O of a snippet (distractors O(n) vs O(n²) vs O(log n)). Tags: `recursion`.
- **L13** (identity/debug): `is` vs `==`, small-int caching, `copy` vs `deepcopy` of nested structures, `assert` semantics. Tags: `identity`, `shallowCopy`, `assertLogic`.
- **L14** (idioms): `enumerate(start=...)`, `zip` truncation to shortest, `sorted(key=...)` stability, `sorted` reverse. Tags: `sortedKey`, `unpacking`.
- **L15** (regex/JSON/CSV): greedy vs non-greedy, `re.findall` groups, `json.loads` types (JSON `null`→`None`, numbers→int/float), CSV quoting. Tags: `regex`, `jsonCsv`.
- **L16** (modern): generator laziness/one-shot exhaustion, `yield` order, `match/case` patterns & guards, type-hint runtime no-op. Tags: `generators`, `patternMatch`, `typeHints`.

**The loop for lesson N (do this as its own task + commit):**

- [ ] **Step 1: Author 4 items** in `CHALLENGE_EXTRAS['lessonNN']` (zero-padded id, e.g. `lesson02`): exactly **2 `codeChallenge`** (`stage:'build'`) + **2 reasoning** (`traceSteps` or `multipleChoice`; use `stage:'stretch'` for tricky-output/complexity and `stage:'debug'` for find-the-bug). Item ids `l<N>-chal-1..4`. Use only allowed tools; pick traps from the focus list. Give every item an accurate `explanation`; add `trapNote` where a classic mistake applies; use real `MISTAKE_TAGS`.

- [ ] **Step 2: Verify each `codeChallenge`** with the python3 harness — reference solution must pass all asserts. Expected: `OK`. Ensure tests include at least one boundary/empty/negative case, not just the happy path.

- [ ] **Step 3: Verify each `traceSteps`** (if used) by running its `code` in python3 and confirming every `steps[i].vars`/`output` matches.

- [ ] **Step 4: Validate schema**

Run: `npx vitest run tests/registry.test.ts`
Expected: PASS (the schema test validates the new items).

- [ ] **Step 5: Commit**

```bash
git add src/content/challengeExtras.ts
git commit -m "feat: add lesson NN interview-grade challenges"
```

---

### Task 17: Final validation, strict structural test, and UI pass

**Files:**
- Modify: `tests/registry.test.ts`

- [ ] **Step 1: Write the failing strict test**

Add to `tests/registry.test.ts`:

```ts
  it('every lesson has a 4-item challenge concept (2 code + 2 reasoning)', () => {
    for (const lesson of getAllLessons()) {
      const challenge = lesson.concepts.find((c) => c.id === `${lesson.id}-challenge`);
      expect(challenge, `${lesson.id} missing challenge concept`).toBeDefined();
      expect(challenge!.examples, `${lesson.id} challenge count`).toHaveLength(4);
      const code = challenge!.examples.filter((e) => e.type === 'codeChallenge');
      expect(code.length, `${lesson.id} should have 2 code challenges`).toBe(2);
    }
  });
```

- [ ] **Step 2: Run it**

Run: `npx vitest run tests/registry.test.ts -t "every lesson has a 4-item"`
Expected: PASS if all 16 lessons authored; FAIL naming any lesson still missing/short — finish those before continuing.

- [ ] **Step 3: Run the full test suite**

Run: `npx vitest run`
Expected: all green (no regressions in lessonQueue, practiceQueue, progress, pyodide, etc.).

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual UI pass**

Run the dev server (`npm run dev` or the project's start command), open 2–3 lessons (include L1, a mid lesson, L16), confirm the "Challenge — interview-grade" concept appears last, the items render, a `codeChallenge` runs and its tests pass with a correct solution, and a `traceSteps` steps correctly.

- [ ] **Step 6: Commit**

```bash
git add tests/registry.test.ts
git commit -m "test: enforce challenge concept on all 16 lessons"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** new pool (Task 1) ✓; merge-as-new-concept (Task 1 Step 5) ✓; 4/lesson 2 code + 2 reasoning (Tasks 1–16 + strict test Task 17) ✓; tool-scope constraint (inventory table + per-lesson focus) ✓; no schema/UI/base-file changes ✓; validation + executed solutions + accurate traces (harness, Tasks’ verify steps, Task 17) ✓; count sanity (Task 17 strict test) ✓.
- **Placeholders:** none — mechanism code is complete; lesson-1 items are fully written and verified; later lessons are proceduralized with explicit per-lesson constraints and a verification gate (authoring 64 fixed problems verbatim here would be doing the implementation in the plan).
- **Type consistency:** `mergeChallengeExtras` generic includes the concept fields (`id,title,objective,miniNote?,examples`) it constructs; concept id pattern `${lesson.id}-challenge` and title `'Challenge — interview-grade'` are identical in Task 1, the Task 1 test, and the Task 17 strict test.
