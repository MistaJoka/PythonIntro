import { describe, it, expect } from 'vitest';
import {
  validateAllLessons,
  getAllLessons,
  getAllExamples,
  getCapstoneCount,
  CAPSTONE_PROJECTS,
} from '../src/content/registry';
import { COURSE_LESSONS } from '../src/content/capstones/lessonIndex';

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
});
