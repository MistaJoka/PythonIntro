import { createRequire } from 'node:module';
import { validateAllLessons, getAllExamples, getCapstoneCount } from '../src/content/registry.ts';

const { ok, errors } = validateAllLessons();
const count = getAllExamples().length;
const capstones = getCapstoneCount();

if (!ok) {
  console.error('Content validation failed:');
  errors.forEach((e) => console.error(' -', e));
  process.exit(1);
}

console.log(`✓ ${count} examples validated across all lessons`);
console.log(`✓ ${capstones} capstone projects validated`);

/*
 * Every `requires` entry must name a package Pyodide actually ships, or the
 * learner meets the typo as a failed RUN. Zod can only check it is a string,
 * so cross-check against the lock file shipped with the pinned pyodide
 * package — this also catches a package vanishing on a future upgrade.
 */
const require = createRequire(import.meta.url);
const lock = require('pyodide/pyodide-lock.json') as { packages: Record<string, unknown> };
const available = new Set(Object.keys(lock.packages));

const badRequires: string[] = [];
const usedPackages = new Set<string>();
for (const example of getAllExamples()) {
  for (const pkg of example.requires ?? []) {
    usedPackages.add(pkg);
    if (!available.has(pkg)) {
      badRequires.push(`${example.id}: "${pkg}" is not in pyodide-lock.json`);
    }
  }
}

if (badRequires.length > 0) {
  console.error('Unknown Pyodide packages in `requires`:');
  badRequires.forEach((e) => console.error(' -', e));
  process.exit(1);
}

console.log(
  usedPackages.size > 0
    ? `✓ Pyodide packages resolve: ${[...usedPackages].sort().join(', ')}`
    : '✓ no Pyodide packages required yet',
);
