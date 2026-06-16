# Challenge Tier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a browsable "Challenge Tier" — 8 themed cross-lesson challenge bundles (~5 mixed code+reasoning items each, ~40 items) on a new `/challenges` surface, reusing the existing example schema and `ReviewSession` runner.

**Architecture:** A thin `ChallengeBundle` wrapper around the existing `Example` schema, registered in `registry.ts` so `getExampleById` resolves bundle items. A landing page (`/challenges`) lists bundles with difficulty badges; a solve page (`/challenges/:bundleId`) renders the bundle's example ids through the existing `ReviewSession`. No new runner or example renderers.

**Tech Stack:** TypeScript, React, react-router-dom, Zod (`src/content/schema.ts`), Vitest, Pyodide live runner (`src/engine/pyodide.ts`). Content authoring verified with local `python3`.

**Spec:** `docs/superpowers/specs/2026-06-16-challenge-tier-design.md`

---

## Background the engineer needs

**`ReviewSession`** (`src/components/ReviewSession.tsx`) renders a pool of example ids: props `{ exampleIds: string[], banner?, channel?, focusMode? }`. It resolves each id via `getExampleById` and filters misses (`ReviewSession.tsx:33-36`). `src/routes/Practice.tsx` is a working example consumer.

**`getExampleById`** (`src/content/registry.ts:122-136`) currently searches lessons then `EXAM_SETS`, returning `{ example, lessonId }` or `undefined`. We extend it to also search challenge bundles. This single hook is what makes the solve page work.

**`Example`** is a Zod discriminated union (`src/content/schema.ts`): `codeChallenge` (live tests via `runCodeChallenge`), `traceSteps`, `multipleChoice`, etc. `tags` must be valid `MISTAKE_TAGS`; `stage` ∈ `'see'|'try'|'build'|'debug'|'stretch'`.

**Landing-page pattern:** copy the structure/classNames of `src/routes/ExamPrep/ExamPrepHome.tsx` and `src/routes/Capstones/CapstoneHome.tsx` (both use `TacticalBrief` + a card grid + `Link`s).

**Nav:** `src/components/layout/CommandRail.tsx` has a `NAV_ITEMS` array; `src/components/layout/railLocus.ts` has a `NAV_BY_PATH` map + `startsWith` branches.

**Authoring verification harness** (use for every code & trace item):
```bash
python3 - <<'PY'
# reference solution, then the asserts
def f(...): ...
assert f(...) == ...
print("OK")
PY
```
Schema/structure: `npx vitest run tests/registry.test.ts`.

**Per-lesson tool inventory** (cumulative, source `src/content/capstones/lessonIndex.ts`): L1 types/IO/f-strings; L2 operators `//`/`%`/`**`/logic; L3 conditionals; L4 loops/range; L5 functions/defaults/scope; L6 strings/slicing; L7 lists/tuples/aliasing; L8 dicts/sets; L9 comprehensions/import; L10 try/except; L11 classes/inheritance; L12 recursion/Big-O; L13 is/==/copy/deepcopy/assert; L14 enumerate/zip/sorted-key; L15 re/json/csv; L16 generators/match-case/type-hints. Bundle items may combine constructs from the bundle's `lessonRefs` and any earlier lesson; never beyond L16.

---

## File Structure

- Create: `src/content/challenges/schema.ts` — `ChallengeBundle` type + `challengeBundleSchema` + `CHALLENGE_THEMES`.
- Create: `src/content/challenges/bundles.ts` — `CHALLENGE_BUNDLES: ChallengeBundle[]` (8 bundles, ~40 items).
- Modify: `src/content/registry.ts` — register, resolve (`getExampleById`), expose `getChallengeBundles`/`getChallengeBundleById`, validate.
- Create: `src/routes/Challenges/ChallengeHome.tsx` — landing page.
- Create: `src/routes/Challenges/ChallengeBundlePage.tsx` — solve page.
- Modify: `src/App.tsx` — 2 routes.
- Modify: `src/components/layout/CommandRail.tsx` — 1 nav item.
- Modify: `src/components/layout/railLocus.ts` — locus mapping.
- Modify: `tests/registry.test.ts` — bundle validation + resolution + uniqueness + contract tests.

---

### Task 1: Bundle schema + registry plumbing + template bundle (`ch-numbers`)

**Files:**
- Create: `src/content/challenges/schema.ts`, `src/content/challenges/bundles.ts`
- Modify: `src/content/registry.ts`
- Test: `tests/registry.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `tests/registry.test.ts` (inside `describe('content registry', ...)`). Add imports at top: `import { getChallengeBundles, getChallengeBundleById } from '../src/content/registry';`

```ts
  it('registers challenge bundles that all validate and resolve', () => {
    const bundles = getChallengeBundles();
    expect(bundles.length).toBeGreaterThanOrEqual(1);
    const { ok, errors } = validateAllLessons();
    expect(ok, errors.join('\n')).toBe(true);
    for (const b of bundles) {
      for (const ex of b.examples) {
        expect(getExampleById(ex.id)?.example.id, `${b.id}/${ex.id} unresolved`).toBe(ex.id);
      }
    }
  });

  it('challenge bundles satisfy the item contract and have unique ids', () => {
    const seen = new Set<string>();
    // collect ALL example ids across lessons + exams to guarantee no cross-pool collision
    for (const ex of getAllExamples()) seen.add(ex.id);
    for (const b of getChallengeBundles()) {
      expect(b.examples.length, `${b.id} item count`).toBeGreaterThanOrEqual(4);
      const code = b.examples.filter((e) => e.type === 'codeChallenge');
      const reasoning = b.examples.filter((e) => e.type !== 'codeChallenge');
      expect(code.length, `${b.id} needs >=2 code`).toBeGreaterThanOrEqual(2);
      expect(reasoning.length, `${b.id} needs >=2 reasoning`).toBeGreaterThanOrEqual(2);
      for (const ex of b.examples) {
        expect(seen.has(ex.id), `duplicate example id ${ex.id}`).toBe(false);
        seen.add(ex.id);
      }
    }
  });
```
(`getAllExamples`, `getExampleById`, `validateAllLessons` are already imported in this test file. `getChallengeBundleById` is imported for use in later tasks; reference it in a trivial assertion if the linter flags an unused import, or import only what you use now and add the rest in Task 2.)

- [ ] **Step 2: Run, confirm FAIL**

Run: `npx vitest run tests/registry.test.ts -t "challenge bundles"`
Expected: FAIL — `getChallengeBundles is not a function` / module not found.

- [ ] **Step 3: Create `src/content/challenges/schema.ts`**

```ts
import { z } from 'zod';
import { exampleSchema } from '../schema';

export const CHALLENGE_THEMES = [
  'numbers',
  'controlflow',
  'textparse',
  'datawrangling',
  'idioms',
  'objects',
  'recursion',
  'errors',
] as const;

export type ChallengeTheme = (typeof CHALLENGE_THEMES)[number];

export const challengeBundleSchema = z.object({
  id: z.string(),
  title: z.string(),
  blurb: z.string(),
  theme: z.enum(CHALLENGE_THEMES),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  lessonRefs: z.array(z.string()).min(1),
  examples: z.array(exampleSchema).min(1),
});

export type ChallengeBundle = z.infer<typeof challengeBundleSchema>;
```

- [ ] **Step 4: Create `src/content/challenges/bundles.ts` with the template bundle**

Author `ch-numbers` fully (the template). All items must be verified in Step 5 before proceeding.

```ts
import type { ChallengeBundle } from './schema';

export const CHALLENGE_BUNDLES: ChallengeBundle[] = [
  {
    id: 'ch-numbers',
    title: 'Numbers & Precision',
    blurb: 'Type coercion, float pitfalls, and operator precedence under one roof.',
    theme: 'numbers',
    difficulty: 1,
    lessonRefs: ['lesson01', 'lesson02'],
    examples: [
      {
        id: 'ch-numbers-1',
        type: 'codeChallenge',
        stage: 'build',
        tags: ['floatPrecision', 'typeCoercion'],
        prompt:
          'Write tax_total(price, rate) where price is a dollar string like "19.99" and rate is a float like 0.0825. Return the total (price + price*rate) as a string rounded to exactly 2 decimals, e.g. "21.64".',
        starterCode: 'def tax_total(price, rate):\n    pass',
        tests: [
          'assert tax_total("19.99", 0.0825) == "21.64"',
          'assert tax_total("100", 0.10) == "110.00"',
          'assert tax_total("0", 0.2) == "0.00"',
        ],
        explanation:
          'Convert with float(price), add the tax, and format with an f-string: f"{total:.2f}". The :.2f spec rounds and pads trailing zeros so "110" becomes "110.00".',
        trapNote: 'str(round(total, 2)) drops the trailing zero ("110.0"); use :.2f formatting.',
      },
      {
        id: 'ch-numbers-2',
        type: 'codeChallenge',
        stage: 'build',
        tags: ['typeCoercion'],
        prompt:
          'Write clock(total_seconds) that returns a string "H:MM:SS" for a whole number of seconds, e.g. clock(3909) == "1:05:09". Hours are not zero-padded; minutes and seconds are two digits.',
        starterCode: 'def clock(total_seconds):\n    pass',
        tests: [
          'assert clock(3909) == "1:05:09"',
          'assert clock(0) == "0:00:00"',
          'assert clock(59) == "0:00:59"',
          'assert clock(3600) == "1:00:00"',
        ],
        explanation:
          'h = total_seconds // 3600; m = total_seconds % 3600 // 60; s = total_seconds % 60; return f"{h}:{m:02d}:{s:02d}". Floor division and modulo split the value; :02d zero-pads.',
        trapNote: 'Using % 60 for minutes forgets to strip the hours first — use (total % 3600) // 60.',
      },
      {
        id: 'ch-numbers-3',
        type: 'multipleChoice',
        stage: 'stretch',
        tags: ['typeCoercion'],
        prompt: 'What does 10 % 3 ** 2 evaluate to in Python?',
        options: ['1', '0', '9', '100'],
        answerIndex: 0,
        explanation:
          '** binds tighter than %, so this is 10 % (3 ** 2) = 10 % 9 = 1. Evaluating left-to-right as (10 % 3) ** 2 = 1 ** 2 = 1 happens to also be 1 here only by coincidence in value — but the grouping is 10 % 9.',
        trapNote: 'Exponentiation has higher precedence than % / * / //.',
      },
      {
        id: 'ch-numbers-4',
        type: 'multipleChoice',
        stage: 'stretch',
        tags: ['typeCoercion'],
        prompt: 'In Python 3, what is type(6 / 2)?',
        options: ['float', 'int', 'str', 'bool'],
        answerIndex: 0,
        explanation:
          'The / operator is true division and ALWAYS returns a float, even when the result is a whole number. 6 / 2 is 3.0 (float). Use // for an int result.',
        trapNote: '6 / 2 is 3.0, not 3.',
      },
      {
        id: 'ch-numbers-5',
        type: 'traceSteps',
        stage: 'stretch',
        tags: ['typeCoercion'],
        prompt: 'Trace the coercion as each line runs.',
        code: 'a = 5\nb = 2\nc = a / b\nd = a // b\ne = a % b',
        steps: [
          { line: 1, vars: { a: '5' } },
          { line: 2, vars: { a: '5', b: '2' } },
          { line: 3, vars: { a: '5', b: '2', c: '2.5' } },
          { line: 4, vars: { a: '5', b: '2', c: '2.5', d: '2' } },
          { line: 5, vars: { a: '5', b: '2', c: '2.5', d: '2', e: '1' } },
        ],
        question: 'What are the values of c, d, e?',
        options: ['2.5, 2, 1', '2, 2, 1', '2.5, 2.5, 1', '2.5, 2, 0'],
        answerIndex: 0,
        explanation:
          'a / b is true division → 2.5 (float). a // b is floor division → 2 (int). a % b is the remainder → 1.',
      },
    ],
  },
];
```

- [ ] **Step 5: Verify the template bundle's code & trace in `python3`**

Run `tax_total` and `clock` reference solutions + their asserts via the harness (expect `OK`). Run the `ch-numbers-5` snippet and confirm `c=2.5, d=2, e=1`. Run `10 % 3 ** 2` (→ 1) and `type(6/2)` (→ float). Fix any item that does not match before continuing.

- [ ] **Step 6: Wire the registry** — edit `src/content/registry.ts`

Add imports near the other content imports:
```ts
import { CHALLENGE_BUNDLES } from './challenges/bundles';
import { challengeBundleSchema, type ChallengeBundle } from './challenges/schema';
```
Add accessors (near `getExampleById`):
```ts
export function getChallengeBundles(): ChallengeBundle[] {
  return CHALLENGE_BUNDLES;
}

export function getChallengeBundleById(id: string): ChallengeBundle | undefined {
  return CHALLENGE_BUNDLES.find((b) => b.id === id);
}
```
Extend `getExampleById` — add this block immediately before the final `return undefined;` (registry.ts:135):
```ts
  for (const bundle of CHALLENGE_BUNDLES) {
    const ex = bundle.examples.find((e) => e.id === id);
    if (ex) return { example: ex, lessonId: 'challenge' };
  }
```
Extend `validateAllLessons` — add before its `return` (registry.ts:160), after the capstone block:
```ts
  for (const bundle of CHALLENGE_BUNDLES) {
    const result = challengeBundleSchema.safeParse(bundle);
    if (!result.success) {
      errors.push(`${bundle.id}: ${result.error.message}`);
    }
  }
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run tests/registry.test.ts`
Expected: PASS (new bundle tests + existing schema test). Then `npx tsc --noEmit` → no errors.

- [ ] **Step 8: Commit**

```bash
git add src/content/challenges/ src/content/registry.ts tests/registry.test.ts
git commit -m "feat: add challenge bundle schema, registry plumbing, ch-numbers template"
```
Only add those paths.

---

### Task 2: Routes, landing page, solve page, and nav

**Files:**
- Create: `src/routes/Challenges/ChallengeHome.tsx`, `src/routes/Challenges/ChallengeBundlePage.tsx`
- Modify: `src/App.tsx`, `src/components/layout/CommandRail.tsx`, `src/components/layout/railLocus.ts`

- [ ] **Step 1: Create `src/routes/Challenges/ChallengeHome.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { getChallengeBundles } from '../../content/registry';
import { TacticalBrief } from '../../components/layout/TacticalBrief';

const ROMAN: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III' };

export function ChallengeHomePage() {
  const bundles = [...getChallengeBundles()].sort((a, b) => a.difficulty - b.difficulty);

  return (
    <div className="challenge-page">
      <TacticalBrief msgType="OPORD" sector="ARENA">
        Cross-lesson trials — {bundles.length} themed bundles combining multiple modules. Harder
        than module drills; each mixes live-coded tasks and reasoning.
      </TacticalBrief>
      <div className="challenge-grid">
        {bundles.map((bundle) => (
          <Link key={bundle.id} to={`/challenges/${bundle.id}`} className="challenge-card">
            <span className={`challenge-badge difficulty-${bundle.difficulty}`}>
              {ROMAN[bundle.difficulty]}
            </span>
            <div className="challenge-card-body">
              <h2>{bundle.title}</h2>
              <p>{bundle.blurb}</p>
              <div className="challenge-meta">
                <span>{bundle.examples.length} items</span>
                <span>{bundle.lessonRefs.length} modules</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/routes/Challenges/ChallengeBundlePage.tsx`**

```tsx
import { Navigate, useParams } from 'react-router-dom';
import { getChallengeBundleById } from '../../content/registry';
import { ReviewSession } from '../../components/ReviewSession';
import { TacticalBrief } from '../../components/layout/TacticalBrief';

export function ChallengeBundlePage() {
  const { bundleId } = useParams();
  const bundle = bundleId ? getChallengeBundleById(bundleId) : undefined;

  if (!bundle) {
    return <Navigate to="/challenges" replace />;
  }

  return (
    <div className="challenge-bundle-page">
      <TacticalBrief msgType="SITREP" sector="ARENA">
        {bundle.title} — {bundle.blurb}
      </TacticalBrief>
      <ReviewSession
        exampleIds={bundle.examples.map((e) => e.id)}
        channel="CHALLENGE"
        banner={`${bundle.title} — ${bundle.examples.length} items`}
        focusMode
      />
    </div>
  );
}
```

- [ ] **Step 3: Add routes in `src/App.tsx`**

Add imports with the other route imports:
```tsx
import { ChallengeHomePage } from './routes/Challenges/ChallengeHome';
import { ChallengeBundlePage } from './routes/Challenges/ChallengeBundlePage';
```
Add these two routes inside the `<Route element={<AppLayout />}>` block, just before the `capstones` routes:
```tsx
          <Route path="challenges" element={<ChallengeHomePage />} />
          <Route path="challenges/:bundleId" element={<ChallengeBundlePage />} />
```

- [ ] **Step 4: Add the nav entry in `src/components/layout/CommandRail.tsx`**

In the `NAV_ITEMS` array, add after the `/exam-prep` entry:
```ts
  { to: '/challenges', label: 'Arena', glyph: '✦', end: false },
```

- [ ] **Step 5: Add the locus mapping in `src/components/layout/railLocus.ts`**

Add to the `NAV_BY_PATH` object:
```ts
  '/challenges': { glyph: '✦', label: 'Challenges' },
```
And add a branch alongside the existing `startsWith('/capstones/')` branch:
```ts
  if (pathname.startsWith('/challenges/')) {
    return { glyph: '✦', label: 'Challenge bundle', shortLabel: 'Challenge', kind: 'nav' };
  }
```
(Use `kind: 'nav'` since `RailLocus.kind` is `'nav' | 'module' | 'capstone'`. If TypeScript complains, match the exact union in that file.)

- [ ] **Step 6: Add minimal styles**

Append to `src/styles/terminal-dojo.css` (reuse existing card/grid variables; mirror `.capstone-grid`/`.capstone-card` rules already in that file — find them and copy their look). Add:
```css
.challenge-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
.challenge-card { display: flex; gap: 0.75rem; padding: 1rem; border: 1px solid var(--line, #2a3a2a); border-radius: 8px; text-decoration: none; color: inherit; }
.challenge-card:hover { border-color: var(--accent, #7CFC9B); }
.challenge-badge { font-weight: 700; align-self: flex-start; padding: 0.1rem 0.5rem; border-radius: 4px; border: 1px solid currentColor; }
.challenge-badge.difficulty-1 { color: #8fd6a6; }
.challenge-badge.difficulty-2 { color: #d6c98f; }
.challenge-badge.difficulty-3 { color: #d68f8f; }
.challenge-meta { display: flex; gap: 0.75rem; opacity: 0.75; font-size: 0.85em; margin-top: 0.4rem; }
```
(If `terminal-dojo.css` uses different variable names, match them — open the file and reuse the variables the capstone cards use.)

- [ ] **Step 7: Verify build + type-check + dev render**

Run: `npx tsc --noEmit` → no errors. Run: `npx vitest run tests/registry.test.ts` → pass. Run `npm run build` → success. Start the dev server, navigate to `/challenges`, confirm the "Arena" nav item appears, the page lists the `ch-numbers` card with an `I` badge, clicking it opens the solve session and the first code challenge runs. (If you cannot run a browser, at minimum confirm `npm run build` succeeds and report that the UI smoke is pending.)

- [ ] **Step 8: Commit**

```bash
git add src/routes/Challenges/ src/App.tsx src/components/layout/CommandRail.tsx src/components/layout/railLocus.ts src/styles/terminal-dojo.css
git commit -m "feat: add challenge tier routes, landing page, solve page, and nav"
```

---

### Tasks 3–5: Author the remaining 7 bundles

Add each bundle as a new object in the `CHALLENGE_BUNDLES` array in `src/content/challenges/bundles.ts`, matching the `ch-numbers` template's style and field set. **Batch them:** Task 3 = `ch-controlflow` + `ch-textparse`; Task 4 = `ch-datawrangling` + `ch-idioms`; Task 5 = `ch-objects` + `ch-recursion` + `ch-errors`.

**Each bundle:** ~5 items, **≥2 `codeChallenge` + ≥2 reasoning** (`traceSteps`/`multipleChoice`), ids `ch-<theme>-1..5` (globally unique). Items combine constructs across the bundle's lessons (that is what makes them harder) but never exceed L16. Verify EVERY code challenge and trace in `python3`; verify EVERY multiple-choice answer empirically.

| id | title | difficulty | lessonRefs | trap focus (mix concepts) |
|---|---|---|---|---|
| `ch-controlflow` | Control-Flow Traps | 1 | lesson03, lesson04 | truthiness + boundary `>=`/`>`, `range` exclusive-stop & off-by-one, accumulator bugs, nested-loop counts, `break`/`else`-on-loop |
| `ch-textparse` | Text & Parsing | 2 | lesson06, lesson15 | slicing (`[::-1]`,`[1:-1]`), `.split`/`.join`, greedy vs non-greedy regex, `re.findall` capture groups, `json.loads` type mapping |
| `ch-datawrangling` | Data Wrangling | 2 | lesson07, lesson08, lesson09 | list aliasing/mutation, dict `.get`/missing-key, set dedup, comprehension filter-vs-ternary, building a freq dict |
| `ch-idioms` | Idioms & Iteration | 2 | lesson14, lesson16 | `enumerate(start=)`, `zip` shortest-truncation, `sorted(key=)` stability/reverse, `*rest` unpacking, generator one-shot exhaustion, `match`/`case` guard |
| `ch-objects` | Objects & State | 2 | lesson11, lesson13 | mutable class attr shared across instances, `__init__` per-instance state, `super()`, `is` vs `==`, shallow vs deep copy of nested data |
| `ch-recursion` | Recursion & Structure | 3 | lesson12, lesson07 | recursive sum/flatten of nested lists, correct base case, depth/accumulation, Big-O of a snippet (one MC) |
| `ch-errors` | Errors & Edge Cases | 3 | lesson10, lesson05 | `except` clause-order shadowing, try/except/else/finally flow, exception type matching, a `safe_*` function with defaults handling bad input (NO real file I/O — Pyodide has no FS) |

**The loop for each bundle (per task, then one commit per task batch):**

- [ ] **Step 1: Author the bundle object(s)** in `CHALLENGE_BUNDLES` per the table. Read the existing `ch-numbers` entry first for exact style. Use valid `MISTAKE_TAGS` and stages (`build` for code; `stretch`/`debug` for reasoning). traceSteps `line` numbers count blank lines.

- [ ] **Step 2: Verify every code challenge** with the python3 harness — reference solution passes all asserts (`OK`), and tests include a boundary/edge case that a naive/trap solution would fail.

- [ ] **Step 3: Verify every traceSteps** — run the `code` in python3; confirm each `steps[i].vars`/`output`, the `answerIndex`, and each `line` number (count blanks).

- [ ] **Step 4: Verify every multipleChoice** — evaluate the expression in python3; confirm the option at `answerIndex` is correct (regex/zip/generator/dict/exception gotchas especially).

- [ ] **Step 5: Run gates** — `npx vitest run tests/registry.test.ts` (schema + contract + uniqueness) → pass; `npx tsc --noEmit` → no errors.

- [ ] **Step 6: Commit**
```bash
git add src/content/challenges/bundles.ts
git commit -m "feat: author challenge bundles <ids in this batch>"
```

---

### Task 6: Final strict test, full suite, build, UI smoke

**Files:**
- Modify: `tests/registry.test.ts`

- [ ] **Step 1: Write the failing strict test**

Add to `tests/registry.test.ts`:
```ts
  it('has all 8 challenge bundles with the expected themes', () => {
    const ids = getChallengeBundles().map((b) => b.id).sort();
    expect(ids).toEqual(
      [
        'ch-controlflow',
        'ch-datawrangling',
        'ch-errors',
        'ch-idioms',
        'ch-numbers',
        'ch-objects',
        'ch-recursion',
        'ch-textparse',
      ].sort(),
    );
  });
```

- [ ] **Step 2: Run it**

Run: `npx vitest run tests/registry.test.ts -t "all 8 challenge bundles"`
Expected: PASS if all 8 authored; FAIL listing the mismatch otherwise — finish missing bundles first.

- [ ] **Step 3: Full suite**

Run: `npx vitest run`
Expected: all green. Report any failure. (Unrelated pre-existing working-tree changes may exist — if some unrelated test fails, report but do not fix.)

- [ ] **Step 4: Type-check + build**

Run: `npx tsc --noEmit` → no errors. Run: `npm run build` → success.

- [ ] **Step 5: UI smoke**

Start the dev server; open `/challenges`; confirm 8 cards ordered by difficulty with I/II/III badges; open two bundles (one difficulty-1, one difficulty-3); confirm items render, a code challenge runs and passes with a correct solution, and a trace steps correctly.

- [ ] **Step 6: Commit**
```bash
git add tests/registry.test.ts
git commit -m "test: enforce all 8 challenge bundles present"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** data model (Task 1 Steps 3–4) ✓; registry resolve+validate+accessors (Task 1 Step 6) ✓; routes + landing + solve page (Task 2) ✓; nav + railLocus (Task 2 Steps 4–5) ✓; 8 themed bundles w/ difficulty (Tasks 1,3–5 + table) ✓; difficulty badge presentational (ChallengeHome ROMAN badge) ✓; unknown-id redirect (ChallengeBundlePage `Navigate`) ✓; tests: schema validation, resolution, uniqueness, contract, strict-8 (Task 1 + Task 6) ✓; build/tsc/UI smoke (Task 2 Step 7, Task 6 Steps 4–5) ✓; YAGNI (no scoring/gating — none added) ✓.
- **Placeholders:** none — Task 1 & 2 carry complete code; the template bundle is fully authored and gated by python3 verification; the 7 remaining bundles are proceduralized with an explicit trap-focus table + per-item verification (authoring 40 fixed problems verbatim would be doing the implementation in the plan).
- **Type consistency:** `ChallengeBundle`/`challengeBundleSchema`/`CHALLENGE_THEMES` defined in Task 1 Step 3 and used unchanged in `bundles.ts`, `registry.ts`, and the routes. `getChallengeBundles`/`getChallengeBundleById` signatures match between Task 1 (definition) and Task 2 (consumers). `getExampleById` return shape `{ example, lessonId }` preserved (sentinel `'challenge'`). Example-id convention `ch-<theme>-<k>` consistent across tasks and the uniqueness test.
