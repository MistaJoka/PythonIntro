export interface TraceDisplayStep {
  line: number;
  vars: Record<string, string>;
  changed?: string[];
  /** Accumulated stdout after this step (optional, lesson-authored). */
  output?: string;
  /** Rare author override — prefer precise auto-generated summaries. */
  note?: string;
}

export interface StepSummary {
  line: number;
  source: string;
  action: string;
  effect: string;
}

export function computeChangedVars(
  steps: { vars: Record<string, string> }[],
  stepIndex: number,
): string[] {
  const step = steps[stepIndex];
  if (!step) return [];
  const prevVars = stepIndex > 0 ? (steps[stepIndex - 1]?.vars ?? {}) : {};
  return Object.keys(step.vars).filter((key) => prevVars[key] !== step.vars[key]);
}

export function inferVarType(value: string): string {
  const t = value.trim();
  if (t === 'True' || t === 'False') return 'bool';
  if (t.startsWith('"') || t.startsWith("'")) return 'str';
  if (/^-?\d+$/.test(t)) return 'int';
  if (/^-?\d*\.\d+([eE][+-]?\d+)?$/.test(t) || /^-?\d+[eE][+-]?\d+$/.test(t)) return 'float';
  if (t === 'None') return 'NoneType';
  if (t.startsWith('[')) return 'list';
  if (t.startsWith('(')) return 'tuple';
  if (t.startsWith('{')) return t.includes(':') ? 'dict' : 'set';
  return 'object';
}

function outputAddedThisStep(
  step: TraceDisplayStep,
  prevOutput: string,
): string | null {
  if (step.output === undefined) return null;
  if (!step.output.startsWith(prevOutput)) return step.output.replace(/\n$/, '');
  const added = step.output.slice(prevOutput.length).replace(/\n$/, '');
  return added.length > 0 ? added : null;
}

function formatStdoutLine(text: string): string {
  if (text.includes('\n')) {
    return text
      .split('\n')
      .map((line) => `"${line}"`)
      .join(', then ');
  }
  return `"${text}"`;
}

export function buildStepSummary(
  code: string,
  stepIndex: number,
  steps: TraceDisplayStep[],
): StepSummary {
  const step = steps[stepIndex];
  if (!step) {
    return { line: 0, source: '', action: 'Step', effect: 'No step data.' };
  }

  const source = code.split('\n')[step.line - 1]?.trim() ?? '';
  const changed = step.changed ?? computeChangedVars(steps, stepIndex);
  const prevVars = stepIndex > 0 ? (steps[stepIndex - 1]?.vars ?? {}) : {};
  const prevOutput = stepIndex > 0 ? (steps[stepIndex - 1]?.output ?? '') : '';

  const base = { line: step.line, source };

  // Assignment (single name binding)
  const assignMatch = source.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
  if (assignMatch && !source.includes('==') && !source.includes('+=') && !source.includes('-=')) {
    const name = assignMatch[1]!;
    const expr = assignMatch[2]!.trim();
    const value = step.vars[name];
    if (value !== undefined && changed.includes(name)) {
      const typeName = inferVarType(value);
      const prev = prevVars[name];
      if (prev === undefined) {
        return {
          ...base,
          action: 'Assignment',
          effect: `Binds ${name} to ${typeName} ${value} — evaluates \`${expr}\`.`,
        };
      }
      return {
        ...base,
        action: 'Assignment',
        effect: `Rebinds ${name} from ${prev} to ${value} — evaluates \`${expr}\`.`,
      };
    }
  }

  // Augmented assignment
  const augMatch = source.match(/^([a-zA-Z_]\w*)\s*(\+=|-=|\*=|\/\/=|\/=)\s*(.+)$/);
  if (augMatch) {
    const name = augMatch[1]!;
    const op = augMatch[2]!;
    const expr = augMatch[3]!.trim();
    const value = step.vars[name];
    if (value !== undefined) {
      return {
        ...base,
        action: 'Augmented assignment',
        effect: `Updates ${name} to ${value} using ${name} ${op} ${expr}.`,
      };
    }
  }

  // print()
  if (/^print\s*\(/.test(source)) {
    const added = outputAddedThisStep(step, prevOutput);
    if (added !== null) {
      return {
        ...base,
        action: 'print()',
        effect: `Writes ${formatStdoutLine(added)} to stdout.`,
      };
    }
    return {
      ...base,
      action: 'print()',
      effect: `Runs \`${source}\`. Check the Output panel for stdout.`,
    };
  }

  // import
  if (/^import\s+/.test(source) || /^from\s+/.test(source)) {
    return {
      ...base,
      action: 'Import',
      effect: `Loads modules from \`${source}\` into the namespace.`,
    };
  }

  // def / class
  if (/^def\s+/.test(source)) {
    const nameMatch = source.match(/^def\s+([a-zA-Z_]\w*)/);
    const fn = nameMatch?.[1] ?? 'function';
    return {
      ...base,
      action: 'Function definition',
      effect: `Defines function ${fn}() — body not run until called.`,
    };
  }

  if (/^class\s+/.test(source)) {
    const nameMatch = source.match(/^class\s+([a-zA-Z_]\w*)/);
    const cls = nameMatch?.[1] ?? 'class';
    return {
      ...base,
      action: 'Class definition',
      effect: `Defines class ${cls} — body runs to create the class object.`,
    };
  }

  // Control flow headers
  if (/^if\s+/.test(source)) {
    return {
      ...base,
      action: 'if condition',
      effect: `Evaluates \`${source}\` and chooses a branch.`,
    };
  }
  if (/^elif\s+/.test(source)) {
    return {
      ...base,
      action: 'elif condition',
      effect: `Evaluates \`${source}\` after prior branches were false.`,
    };
  }
  if (/^else\s*:/.test(source)) {
    return {
      ...base,
      action: 'else branch',
      effect: 'Runs because no prior if/elif condition was true.',
    };
  }
  if (/^while\s+/.test(source)) {
    return {
      ...base,
      action: 'while loop',
      effect: `Tests \`${source}\` — loop body runs while true.`,
    };
  }
  if (/^for\s+/.test(source)) {
    const loopVar = changed.find((k) => prevVars[k] !== step.vars[k]) ?? changed[0];
    if (loopVar && step.vars[loopVar] !== undefined) {
      return {
        ...base,
        action: 'for loop',
        effect: `Sets loop variable ${loopVar} to ${step.vars[loopVar]} for this iteration.`,
      };
    }
    return {
      ...base,
      action: 'for loop',
      effect: `Starts or continues \`${source}\`.`,
    };
  }

  // Function call line (x = fn() or bare call)
  if (changed.length === 1) {
    const key = changed[0]!;
    const next = step.vars[key] ?? '';
    const prev = prevVars[key];
    if (prev === undefined) {
      return {
        ...base,
        action: 'Call / bind',
        effect: `Sets ${key} to ${next}.`,
      };
    }
    return {
      ...base,
      action: 'Call / update',
      effect: `Changes ${key} from ${prev} to ${next}.`,
    };
  }

  if (changed.length > 1) {
    const parts = changed.map((k) => `${k}=${step.vars[k] ?? '?'}`).join(', ');
    return {
      ...base,
      action: 'Multi-bind',
      effect: `Updates ${parts}.`,
    };
  }

  if (Object.keys(step.vars).length === 0 && !step.output) {
    return {
      ...base,
      action: 'Execute',
      effect: `Runs line ${step.line}; no variables in scope yet.`,
    };
  }

  return {
    ...base,
    action: 'Execute',
    effect:
      changed.length === 0
        ? `Runs \`${source || `line ${step.line}`}\` — variable values unchanged.`
        : `Runs \`${source || `line ${step.line}`}\`.`,
  };
}

/** @deprecated Use buildStepSummary for UI copy. */
export function describeStepAction(
  code: string,
  stepIndex: number,
  steps: TraceDisplayStep[],
): string {
  const summary = buildStepSummary(code, stepIndex, steps);
  return `${summary.action}: ${summary.effect}`;
}

export function varDelta(
  prevVars: Record<string, string>,
  key: string,
  nextValue: string,
): string | null {
  const prev = prevVars[key];
  if (prev === undefined) return `new → ${nextValue}`;
  if (prev === nextValue) return null;
  return `${prev} → ${nextValue}`;
}
