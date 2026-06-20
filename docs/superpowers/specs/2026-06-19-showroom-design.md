# Showroom Feature Design

**Date:** 2026-06-19
**Status:** Approved

## Overview

A read-only gallery of complete, annotated Python programs demonstrating advanced-for-intro techniques. Users browse a list on the left and read annotated code on the right. No interaction beyond selection — pure reading and learning.

## Layout

Master/detail split, single `/showroom` route. No sub-routes; selected program is local component state.

- **Left panel (~38%):** Scrollable list of program cards. Clicking a card loads its code into the right panel. First program selected by default.
- **Right panel (~62%):** Annotated code viewer with title/description header, line-numbered code, and inline annotation blocks.

## Data Schema

**Location:** `src/content/showroom/`

```typescript
// src/content/showroom/schema.ts
interface ShowroomAnnotation {
  afterLine: number      // annotation block appears after this 1-based line number
  technique: string      // short label, e.g. "Generator expression"
  explanation: string    // 1-2 sentences on why/how this technique is used here
}

interface ShowroomProgram {
  id: string
  title: string
  description: string    // one sentence — used on card and in detail header
  difficulty: 'intermediate' | 'advanced'
  techniques: string[]   // tag chips shown on the card
  code: string           // full Python program text
  annotations: ShowroomAnnotation[]
}
```

**Content file:** `src/content/showroom/programs.ts` — exports `SHOWROOM_PROGRAMS: ShowroomProgram[]` with all 10 programs as typed constants.

## Programs (all 10)

| # | Title | Difficulty | Core techniques |
|---|-------|------------|-----------------|
| 1 | Word Frequency Counter | Intermediate | Counter, generator expressions, sorted key, f-strings |
| 2 | Apache Log Parser | Advanced | regex, defaultdict, named groups, exception handling |
| 3 | CSV Budget Tracker | Intermediate | @dataclass, @property, csv module, comprehensions |
| 4 | File Tree Walker | Advanced | yield, generator function, pathlib, recursion, type hints |
| 5 | Contact Book | Intermediate | @dataclass, __repr__, set operations, multi-key sort |
| 6 | Config File Reader | Intermediate | context manager, raise from, pathlib, json module |
| 7 | Score Aggregator | Advanced | functools.reduce, walrus :=, namedtuple, starred unpacking |
| 8 | Report Formatter | Advanced | f-string format specs, match/case, Enum |
| 9 | Task Queue | Advanced | deque, itertools.islice, dataclass ordering (__lt__), generators |
| 10 | Mini CLI Tool | Intermediate | argparse, __name__ guard, sys.exit, context manager |

## Components

### `src/routes/Showroom/ShowroomPage.tsx`
- Manages `selectedId` state (defaults to first program)
- Renders split layout: left `ProgramList`, right `AnnotatedCodeViewer`
- Includes `TacticalBrief` description at top (above the split)

### `src/components/showroom/ProgramCard.tsx`
- Props: `program`, `isSelected`, `onClick`
- Shows: title, difficulty badge (amber = Intermediate, red = Advanced), technique tag chips
- Active state: bright phosphor left border + subtle glow (consistent with existing card styles)

### `src/components/showroom/AnnotatedCodeViewer.tsx`
- Props: `program: ShowroomProgram`
- Header: title + description
- Renders code lines with annotation blocks injected after `annotation.afterLine`
- **Syntax highlighting:** CSS-class-based tokenizer (no external library) — covers Python keywords, string literals, comments, built-in names, numbers
- **Annotation block:** left-bordered inset block, technique label in amber, explanation in muted green — visually distinct from code

## Navigation Updates

### `src/components/layout/CommandRail.tsx`
Add after Challenges entry:
```typescript
{ to: '/showroom', label: 'Showroom', glyph: '◈', end: false }
```

### `src/components/layout/HudHeader.tsx`
```typescript
if (pathname === '/showroom') return 'Showroom';
```

### `src/components/layout/StatusBar.tsx`
```typescript
if (pathname === '/showroom') return 'Showroom';
```

### `src/App.tsx`
```tsx
import { ShowroomPage } from './routes/Showroom/ShowroomPage';
// ...
<Route path="showroom" element={<ShowroomPage />} />
```

## Styling

New `.showroom-*` block in `src/styles/terminal-dojo.css`. Key rules:

- `.showroom-layout` — CSS Grid, two columns (38% / 62%), full viewport height minus header/footer
- `.showroom-list` — left panel, overflow-y scroll
- `.showroom-detail` — right panel, overflow-y scroll
- `.program-card` — card in left panel, left border for difficulty color, hover/active states
- `.annotation-block` — inset block between code lines: `border-left: 2px solid var(--amber)`, background tint
- `.annotation-technique` — amber label text
- `.annotation-explanation` — muted green explanation text
- `.code-kw`, `.code-str`, `.code-cm`, `.code-num`, `.code-builtin` — syntax token classes

## File List

```
src/content/showroom/schema.ts          (types)
src/content/showroom/programs.ts        (all 10 program data)
src/routes/Showroom/ShowroomPage.tsx    (page + split layout)
src/components/showroom/ProgramCard.tsx
src/components/showroom/AnnotatedCodeViewer.tsx
```

Modified files:
```
src/App.tsx                             (add route)
src/components/layout/CommandRail.tsx   (add nav item)
src/components/layout/HudHeader.tsx     (add title)
src/components/layout/StatusBar.tsx     (add sector label)
src/styles/terminal-dojo.css            (add showroom styles)
```

## Out of Scope

- No search or filter on the program list (can add later)
- No user progress tracking for Showroom programs
- No syntax highlighting library — hand-rolled tokenizer only
- No copy-to-clipboard button on code (can add later)
