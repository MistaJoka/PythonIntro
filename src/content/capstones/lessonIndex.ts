/** Canonical list of all Intro Python lessons — used by every capstone. */
export const COURSE_LESSONS = [
  { id: 'lesson01', title: 'Foundations', short: 'variables, types, I/O, f-strings' },
  { id: 'lesson02', title: 'Operators & Expressions', short: 'arithmetic, comparisons, logic' },
  { id: 'lesson03', title: 'Conditionals', short: 'if/elif/else, truthiness' },
  { id: 'lesson04', title: 'Loops', short: 'while, for, range' },
  { id: 'lesson05', title: 'Functions', short: 'def, scope, return, defaults' },
  { id: 'lesson06', title: 'Strings', short: 'slicing, methods, immutability' },
  { id: 'lesson07', title: 'Lists & Tuples', short: 'mutation, aliasing, sequences' },
  { id: 'lesson08', title: 'Dicts & Sets', short: 'mappings, keys, uniqueness' },
  { id: 'lesson09', title: 'Comprehensions & Modules', short: 'comprehensions, imports' },
  { id: 'lesson10', title: 'Files & Exceptions', short: 'try/except, I/O patterns' },
  { id: 'lesson11', title: 'Object-Oriented Python', short: 'classes, inheritance' },
  { id: 'lesson12', title: 'Recursion & Big-O', short: 'base cases, complexity' },
  { id: 'lesson13', title: 'Debug & Identity', short: 'is vs ==, copy, assert' },
  { id: 'lesson14', title: 'Python Idioms', short: 'enumerate, zip, sorted keys' },
  { id: 'lesson15', title: 'Regex, JSON & CSV', short: 'structured & pattern data' },
  { id: 'lesson16', title: 'Modern Intro Python', short: 'generators, hints, match/case' },
] as const;

export type CourseLessonId = (typeof COURSE_LESSONS)[number]['id'];

export type LessonCoverageEntry = {
  lessonId: CourseLessonId;
  lessonTitle: string;
  conceptUsed: string;
};

/** Build full 16-lesson coverage; pass project-specific conceptUsed for each lesson id. */
export function buildLessonCoverage(
  concepts: Record<CourseLessonId, string>,
): LessonCoverageEntry[] {
  return COURSE_LESSONS.map((lesson) => ({
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    conceptUsed: concepts[lesson.id],
  }));
}

export const FULL_COURSE_NOTE =
  'Every capstone is a full-course synthesis: you must apply concepts from all 16 lessons. ' +
  'The reference solution demonstrates how an expert weaves the entire curriculum into one program.';
