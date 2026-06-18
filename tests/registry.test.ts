import { describe, it, expect } from 'vitest';
import {
  validateAllLessons,
  getAllLessons,
  getAllExamples,
  getCapstoneCount,
  getExampleById,
  CAPSTONE_PROJECTS,
  EXAM_SETS,
} from '../src/content/registry';
import { getChallengeBundles } from '../src/content/registry';
import { COURSE_LESSONS } from '../src/content/capstones/lessonIndex';
import { CHALLENGE_EXTRAS } from '../src/content/challengeExtras';

describe('content registry', () => {
  it('validates all lessons against schema', () => {
    const { ok, errors } = validateAllLessons();
    expect(ok, errors.join('\n')).toBe(true);
  });

  it('has 16 lessons', () => {
    expect(getAllLessons()).toHaveLength(16);
  });

  it('has Phase 1 content in lessons 1-3', () => {
    const l1 = getAllLessons()[0];
    expect(l1.concepts.length).toBeGreaterThanOrEqual(4);
    expect(getAllExamples().length).toBeGreaterThanOrEqual(275);
  });

  it('has at least 10 capstone projects', () => {
    expect(getCapstoneCount()).toBeGreaterThanOrEqual(10);
  });

  it('has at least 6 expert capstones with cap-exp- ids', () => {
    const expert = CAPSTONE_PROJECTS.filter((p) => p.difficulty === 'expert');
    expect(expert.length, 'expert capstone count').toBeGreaterThanOrEqual(6);
    for (const p of expert) {
      expect(p.id.startsWith('cap-exp-'), `${p.id} should be a cap-exp- id`).toBe(true);
    }
  });

  it('each capstone covers all 16 lessons', () => {
    for (const project of CAPSTONE_PROJECTS) {
      expect(project.lessonCoverage).toHaveLength(COURSE_LESSONS.length);
      const ids = project.lessonCoverage.map((e) => e.lessonId);
      expect(new Set(ids).size).toBe(COURSE_LESSONS.length);
    }
  });

  it('appends a challenge concept with 4 items to lesson 1', () => {
    const l1 = getAllLessons()[0];
    const challenge = l1.concepts.find((c) => c.id === 'lesson01-challenge');
    expect(challenge, 'lesson01 challenge concept missing').toBeDefined();
    expect(challenge!.title).toBe('Challenge — interview-grade');
    expect(challenge!.examples).toHaveLength(4);
    expect(challenge!.examples.filter((e) => e.type === 'codeChallenge')).toHaveLength(2);
  });

  it('every lesson has a 4-item challenge concept (2 code + 2 reasoning)', () => {
    for (const lesson of getAllLessons()) {
      const challenge = lesson.concepts.find((c) => c.id === `${lesson.id}-challenge`);
      expect(challenge, `${lesson.id} missing challenge concept`).toBeDefined();
      expect(challenge!.examples, `${lesson.id} challenge count`).toHaveLength(4);
      const code = challenge!.examples.filter((e) => e.type === 'codeChallenge');
      expect(code.length, `${lesson.id} should have 2 code challenges`).toBe(2);
    }
  });

  it('every challenge entry has 4 items (2 code) with unique ids', () => {
    const seen = new Set<string>();
    for (const [lessonId, items] of Object.entries(CHALLENGE_EXTRAS)) {
      expect(items, `${lessonId} item count`).toHaveLength(4);
      expect(
        items.filter((e) => e.type === 'codeChallenge'),
        `${lessonId} code-challenge count`,
      ).toHaveLength(2);
      for (const e of items) {
        expect(seen.has(e.id), `duplicate example id ${e.id}`).toBe(false);
        seen.add(e.id);
      }
    }
  });

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

  it('challenge bundles satisfy the item contract and have unique ids', () => {
    // Seed from every other example pool (lessons + lesson-challenges + exams) so a
    // bundle id can never collide with — and be shadowed by — an existing example id.
    const seen = new Set<string>();
    for (const ex of getAllExamples()) seen.add(ex.id);
    for (const exam of EXAM_SETS) for (const q of exam.questions) seen.add(q.id);
    const themes = new Set<string>();
    for (const b of getChallengeBundles()) {
      expect(themes.has(b.theme), `duplicate theme ${b.theme}`).toBe(false);
      themes.add(b.theme);
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
});
