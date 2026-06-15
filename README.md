# Python Dojo — Learn by Doing

Full Intro Python course taught through practice. Sixteen lessons, varied examples, instant feedback, optional exam prep, and capstone projects.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run test` | Unit tests (47) |
| `npm run test:e2e` | Playwright smoke tests |
| `npm run lint` | ESLint |
| `npm run validate-content` | Validate 394 examples + 12 capstones against schema |

## Features

### Course (16 lessons)
- **Lessons 1–16** — full example sets (trace, MC, fill-blank, fix-the-line, code challenges, order-lines, match-pairs, drag-blank)
- **Smart practice** — mixed queue of due SRS, misses, and next incomplete examples (`/practice`)
- **Resume card** — continue last lesson from course map
- **Tag-driven review** — click heatmap tags or practice weakest concept from dashboard
- **State visualizer** — step through Python execution line by line
- **Free navigation** — every lesson unlocked from the course map
- **Lesson checks** — mixed review at the end of each lesson
- **Capstone projects** — apply skills in guided build projects (`/capstones`)

### Progress
- localStorage persistence
- Export / import JSON
- SRS review queue for misses
- Concept tag heatmap on dashboard

### Exam prep (optional)
- 20-question diagnostic across all lessons
- 3 timed practice finals
- Review sheet with tag breakdown
- Readiness score
- Anki CSV export of missed examples

### Live coding (Pyodide)
- Code challenges in Lessons 4 & 5 (and expandable)
- Runs in-browser via Pyodide CDN (~8MB, cached after first load)

## Project structure

```
src/content/   — lesson data + Zod schemas
src/engine/    — grading, queues, Pyodide, traces
src/store/     — progress (Zustand + localStorage)
src/routes/    — page components
src/components/ — UI
tests/         — Vitest unit tests
e2e/           — Playwright smoke tests
```

AI IDE rules live in `.cursor/rules/` for consistent agent behavior across sessions.

## Stack

Vite · React 19 · TypeScript · React Router · Zustand · Zod · Pyodide · CodeMirror
