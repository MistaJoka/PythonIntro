/**
 * Repair broken MC migration output.
 * Run: npx tsx scripts/repair-mc-migration.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const files = [
  ...fs
    .readdirSync(path.join(root, 'src/content/lessons'))
    .filter((f) => f.startsWith('lesson'))
    .map((f) => path.join(root, 'src/content/lessons', f)),
  path.join(root, 'src/content/lessonExtras.ts'),
];

for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(/explanation:explanation:/g, 'explanation:');
  text = text.replace(/\n\s*explanation:acceptableAnswers:[^\n]+\n/g, '\n');
  text = text.replace(
    /\n(\s+)(type: '(?:traceSteps|fillBlank)')\n(\s+options:)/g,
    '\n$3',
  );
  text = text.replace(/, type: '(?:traceSteps|fillBlank)' options:/g, ', options:');
  text = text.replace(
    /(\n\s+question: '[^']*')\n(\s+options:)/g,
    '$1,\n$2',
  );
  text = text.replace(
    /(\n\s+blankLabel: '[^']*')\n(\s+options:)/g,
    '$1,\n$2',
  );
  fs.writeFileSync(file, text);
  console.log('repaired', path.basename(file));
}

console.log('Done');
