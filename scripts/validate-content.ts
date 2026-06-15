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
