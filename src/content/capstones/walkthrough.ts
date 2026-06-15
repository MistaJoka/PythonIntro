import type { SolutionStep } from './schema';
import { getExecutionTrace, type ExecutionTraceStep } from './traceLoader';
import { decomposeLine, type CodeSegment } from './lineSegments';

type Phase = 'setup' | 'helpers' | 'classes' | 'main' | 'output';

export type WalkthroughStep = SolutionStep & {
  phase: Phase;
  lineText: string;
  effect: string;
  segments: CodeSegment[];
  vars: Record<string, string>;
  changed: string[];
  outputNote: string;
};

const IMPORT_LESSON: Record<string, string> = {
  csv: 'lesson15',
  io: 'lesson10',
  json: 'lesson15',
  math: 'lesson02',
  re: 'lesson15',
  deepcopy: 'lesson13',
  typing: 'lesson16',
};

function detectPhase(_line: string, trimmed: string, inMain: boolean): Phase {
  if (!trimmed) return inMain ? 'main' : 'setup';
  if (trimmed.startsWith('from __future__') || trimmed.startsWith('import ') || trimmed.startsWith('from '))
    return 'setup';
  if (trimmed.startsWith('PASS_') || trimmed.match(/^[A-Z_]+\s=/)) return 'setup';
  if (trimmed.startsWith('class ')) return 'classes';
  if (trimmed.startsWith('def ') && !inMain) return 'helpers';
  if (trimmed.startsWith('return ')) return inMain ? 'output' : 'helpers';
  if (inMain) return 'main';
  return 'helpers';
}

function lessonForLine(trimmed: string, phase: Phase): string | undefined {
  if (trimmed.includes('f"') || trimmed.includes("f'")) return 'lesson01';
  if (trimmed.startsWith('assert ')) return 'lesson13';
  if (trimmed.includes('deepcopy')) return 'lesson13';
  if (trimmed.includes(' is ') || trimmed.includes(' is not ')) return 'lesson13';
  if (trimmed.startsWith('try:') || trimmed.includes('except ')) return 'lesson10';
  if (trimmed.startsWith('class ') || trimmed.includes('super()')) return 'lesson11';
  if (trimmed.startsWith('def ') && trimmed.includes('->')) return 'lesson16';
  if (trimmed.startsWith('match ') || trimmed.startsWith('case ')) return 'lesson16';
  if (trimmed.includes('yield ')) return 'lesson16';
  if (trimmed.includes('json.')) return 'lesson15';
  if (trimmed.includes('csv.') || trimmed.includes('StringIO')) return 'lesson15';
  if (trimmed.includes('re.')) return 'lesson15';
  if (trimmed.includes('enumerate(')) return 'lesson14';
  if (trimmed.includes('zip(')) return 'lesson14';
  if (trimmed.includes('sorted(')) return 'lesson14';
  if (
    trimmed.includes(' for ') &&
    trimmed.includes(' in ') &&
    (trimmed.includes('[') || trimmed.includes('{'))
  )
    return 'lesson09';
  if (phase === 'setup' && trimmed.startsWith('import ')) {
    const mod = trimmed.replace('import ', '').split(',')[0]?.trim().split(' ')[0];
    if (mod && IMPORT_LESSON[mod]) return IMPORT_LESSON[mod];
  }
  if (trimmed.startsWith('if ') || trimmed.startsWith('elif ') || trimmed.startsWith('else:'))
    return 'lesson03';
  if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) return 'lesson04';
  if (trimmed.startsWith('def ')) return 'lesson05';
  if (trimmed.includes('.strip') || trimmed.includes('.split') || trimmed.includes('.lower'))
    return 'lesson06';
  if (trimmed.includes('list[') || trimmed.includes('tuple') || trimmed.includes('.append'))
    return 'lesson07';
  if (trimmed.includes('dict[') || trimmed.includes('set[') || trimmed.includes('.get('))
    return 'lesson08';
  if (trimmed.includes('_rec_sum') || (trimmed.startsWith('def ') && trimmed.includes('index')))
    return 'lesson12';
  if (trimmed.includes('>= ') || trimmed.includes('<= ') || trimmed.includes('float('))
    return 'lesson02';
  if (trimmed.startsWith('return ')) return 'lesson05';
  return undefined;
}

function teachLine(trimmed: string, phase: Phase): string {
  if (!trimmed) {
    return 'Blank line — separates logical blocks so you can scan setup, helpers, and main logic quickly.';
  }

  if (trimmed.startsWith('from __future__ import annotations')) {
    return (
      'Turns on postponed annotation evaluation (Python 3.10+ style). ' +
      'This lets type hints like dict[str, Any] refer to names defined later in the file — ' +
      'no setup cost at runtime, but your editor and readers get clearer contracts before the main function runs.'
    );
  }

  if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
    const mod = trimmed.replace(/^(import|from) /, '').split(/[\s,.]/)[0];
    return (
      `Loads the ${mod} module before any logic runs. ` +
      'Imports belong at the top so dependencies are obvious and available when the main function parses data or handles errors.'
    );
  }

  if (trimmed.match(/^[A-Z_]+\s*=/)) {
    const name = trimmed.split('=')[0]?.trim();
    return (
      `Defines ${name} once for the whole program. ` +
      'Thresholds and policy constants live here so comparisons later share the same rule — change one line, update every pass/fail decision.'
    );
  }

  if (trimmed.startsWith('class ') && !trimmed.includes('(')) {
    const name = trimmed.split(/\s+/)[1];
    return (
      `Declares the ${name} class — a template for objects you'll build while assembling the final report. ` +
      'Classes bundle data (attributes) with behavior (methods) instead of scattering loose dicts.'
    );
  }

  if (trimmed.startsWith('class ') && trimmed.includes('(')) {
    return (
      'Subclass inherits from the base row class. ' +
      'Override describe() to mark honor rows — reuse parent logic with super(), then append a visual cue for the output list.'
    );
  }

  if (trimmed.startsWith('def __init__')) {
    return (
      'Constructor runs when you instantiate the object. ' +
      'Bind incoming values to self.* so every method on this instance can read them when building output strings.'
    );
  }

  if (trimmed.startsWith('def ') && phase === 'helpers') {
    const fn = trimmed.split('(')[0]?.replace('def ', '');
    return (
      `Helper ${fn}() — small, testable unit called from the main function. ` +
      'Extracting this keeps the main pipeline readable: parse → transform → aggregate → return.'
    );
  }

  if (trimmed.startsWith('def ') && phase === 'main') {
    const fn = trimmed.split('(')[0]?.replace('def ', '');
    return (
      `Nested function ${fn} defined inside the main routine. ` +
      'Closes over variables from the outer scope (like top or avg) when the final dict is assembled.'
    );
  }

  if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
    return 'Docstring documents parameters and return shape — read this first to know what keys the caller expects in the result dict.';
  }

  if (trimmed.startsWith('assert ')) {
    return (
      'Runtime check: fail fast if an invariant breaks. ' +
      'Catches impossible states during development before bad data reaches the returned summary.'
    );
  }

  if (trimmed.startsWith('try:')) {
    return (
      'Start guarded block — the next lines assume parsing succeeded. ' +
      'If the payload is malformed, control jumps to except instead of crashing the whole run.'
    );
  }

  if (trimmed.includes('except ')) {
    return (
      'Recovery path when parsing fails. ' +
      'Fallback to empty records keeps the function returning a valid dict shape — count 0, safe defaults — instead of raising to the caller.'
    );
  }

  if (trimmed.startsWith('for ') && trimmed.includes('enumerate')) {
    return (
      'Walk the collection with index i and item rec. ' +
      'enumerate gives you stable numbering for defaults (e.g. Student0) while you accumulate scores and course tallies.'
    );
  }

  if (trimmed.startsWith('for ')) {
    return (
      'Loop body runs once per item — each pass updates shared accumulators (lists, dicts, counters) ' +
      'that the return statement reads after the loop finishes.'
    );
  }

  if (trimmed.startsWith('if ') && trimmed.includes('>=')) {
    return (
      'Filter gate: only records meeting the pass threshold enter scores/names and increment count. ' +
      'This if-branch directly controls what average, top_student, and grade can become.'
    );
  }

  if (trimmed.startsWith('if n == 0') || trimmed.startsWith('if not ')) {
    return (
      'Early exit when there is nothing to aggregate. ' +
      'Return a complete dict immediately — avoids divide-by-zero and keeps test assertions stable on empty input.'
    );
  }

  if (trimmed.includes('.get(')) {
    return (
      'Safe dict lookup with default when a key is missing. ' +
      'Raw JSON may omit fields; .get prevents KeyError and supplies sensible fallbacks before math runs.'
    );
  }

  if (trimmed.includes('.append(')) {
    return (
      'Push one value onto a list accumulator. ' +
      'After the loop, this list drives ranking, averaging, or highlight rows in the final output.'
    );
  }

  if (trimmed.includes('.add(') && trimmed.includes('unique')) {
    return 'Add to a set — duplicates ignored automatically. len(unique) becomes a cheap distinct-count in the result.';
  }

  if (trimmed.includes('courses[') || trimmed.includes('tally')) {
    return (
      'Increment a per-key counter in a dict. ' +
      'Tally dict becomes part of the returned snapshot showing how many records hit each course tag.'
    );
  }

  if (trimmed.includes('_rec_sum')) {
    return (
      'Recursive sum walks the list via index + base case. ' +
      'Same numeric result as sum(scores), but demonstrates O(n) stack depth — noted in complexity for the report.'
    );
  }

  if (trimmed.includes('sorted(') && trimmed.includes('zip')) {
    return (
      'Pair names with scores, then sort by score descending. ' +
      'pairs[0] becomes top_student — this line decides who headline fields in the output dict refer to.'
    );
  }

  if (trimmed.includes('deepcopy')) {
    return (
      'Clone the tally dict so later mutations cannot alias the original. ' +
      'Returned courses snapshot stays stable even if caller modifies their copy afterward.'
    );
  }

  if (trimmed.includes('HighlightRow') || trimmed.includes('ResultRow')) {
    return (
      'Instantiate a row object for ranked entries. ' +
      'describe() feeds the highlights list in the output — OOP wraps formatting rules in one place.'
    );
  }

  if (trimmed.includes('isinstance(')) {
    return 'Type check filters which row objects count as honors — only HighlightRow instances land in highlights.';
  }

  if (trimmed.startsWith('match ')) {
    return (
      'Pattern match on letter grade — cleaner than a long if-chain. ' +
      'Sets band (honors/pass/fail) consumed by the returned dict for downstream display.'
    );
  }

  if (trimmed.startsWith('case ')) {
    return 'Match arm: assign band string for this grade range. Multiple cases can share one outcome.';
  }

  if (trimmed.includes('yield ')) {
    return (
      'Generator yields one status string per call — lazy production. ' +
      'Wrapping with list() materializes notes[] placed in the final return dict.'
    );
  }

  if (trimmed.startsWith('return {')) {
    return (
      'Assemble the result dict — every prior line prepared a field here. ' +
      'Tests assert on these keys; this return is the capstone deliverable.'
    );
  }

  if (trimmed.startsWith('return ')) {
    return 'Return value exits the function immediately — caller receives this object as the capstone output.';
  }

  if (trimmed.includes(': list[') || trimmed.includes(': dict[') || trimmed.includes(': set[')) {
    return (
      'Typed empty collection — documents intent and starts accumulation. ' +
      'Filled in the loop below, then read when computing averages and rankings.'
    );
  }

  if (trimmed.includes('=') && trimmed.includes('float(')) {
    return 'Coerce to float before comparisons — JSON numbers may arrive as int or str; float() normalizes for threshold checks.';
  }

  if (trimmed.includes('.strip') || trimmed.includes('.title()')) {
    return (
      'Normalize display text: strip whitespace, fix casing. ' +
      'top_student and labels in output use consistent Title Case regardless of messy input.'
    );
  }

  if (trimmed.includes('complexity')) {
    return 'Record Big-O note as a string — documents linear scan cost bundled into the returned metadata.';
  }

  if (trimmed.includes('round(')) {
    return 'Round for presentation — average in the dict matches what a human-readable report would show (2 decimal places).';
  }

  if (trimmed.includes('_letter(')) {
    return 'Map numeric average to letter grade via helper — grade key in output dict comes from this line.';
  }

  // Fallback: tactical generic
  const preview = trimmed.length > 60 ? `${trimmed.slice(0, 57)}…` : trimmed;
  return `Execute: ${preview} — read with the next line to see how this updates state toward the returned dict.`;
}

function isCapstoneEntry(trimmed: string): boolean {
  if (!trimmed.startsWith('def ')) return false;
  const name = trimmed.slice(4).split('(')[0]?.trim() ?? '';
  if (name.startsWith('_')) return false;
  if (name === 'describe' || name === '__init__') return false;
  return true;
}

function detectMainStart(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i]?.trim() ?? '';
    if (isCapstoneEntry(t)) return i;
  }
  return lines.length;
}

/** Build one walkthrough step per source line with execution-aware state snapshots. */
export function buildWalkthroughSteps(solution: string, projectId: string): WalkthroughStep[] {
  const lines = solution.split('\n');
  const mainStart = detectMainStart(lines);
  const trace = getExecutionTrace(projectId);
  const steps: WalkthroughStep[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i] ?? '';
    const trimmed = raw.trim();
    const inMain = i >= mainStart;
    let phase = detectPhase(raw, trimmed, inMain);

    if (trimmed.startsWith('class ')) phase = 'classes';
    if (trimmed.startsWith('return ') && inMain) phase = 'output';
    if (inMain && phase === 'helpers' && !trimmed.startsWith('def ')) phase = 'main';

    const traced: ExecutionTraceStep | undefined = trace?.[i];
    const segments = decomposeLine(raw);
    const teaching = traced?.teaching ?? teachLine(trimmed, phase);

    steps.push({
      line: lineNum,
      lineText: raw,
      phase,
      teaching,
      effect: traced?.effect ?? teaching,
      segments,
      vars: traced?.vars ?? {},
      changed: traced?.changed ?? [],
      outputNote: traced?.outputNote ?? '',
      lessonId: lessonForLine(trimmed, phase),
    });
  }

  return steps;
}

export const PHASE_LABEL: Record<Phase, string> = {
  setup: 'Setup — imports & constants',
  helpers: 'Helpers — reusable pieces',
  classes: 'Classes — objects for output',
  main: 'Main — build the result',
  output: 'Output — return the dict',
};
