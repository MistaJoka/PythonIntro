import { describe, it, expect } from 'vitest';
import { gradeExample } from '../src/engine/grader';
import type { Example } from '../src/content/schema';

const mcExample: Example = {
  id: 'test-mc',
  type: 'multipleChoice',
  stage: 'try',
  tags: [],
  prompt: 'test',
  options: ['a', 'b', 'c'],
  answerIndex: 1,
  explanation: 'b is correct',
};

const traceExample: Example = {
  id: 'test-trace',
  type: 'traceSteps',
  stage: 'see',
  tags: [],
  prompt: 'test',
  code: 'x = 1',
  steps: [{ line: 1, vars: { x: '1' } }],
  question: 'x?',
  options: ['1', '2', '0', '10'],
  answerIndex: 0,
  explanation: 'x is 1',
};

describe('grader', () => {
  it('grades multiple choice correctly', () => {
    expect(gradeExample(mcExample, 1).correct).toBe(true);
    expect(gradeExample(mcExample, 0).correct).toBe(false);
  });

  it('grades trace steps with multiple choice', () => {
    expect(gradeExample(traceExample, 0).correct).toBe(true);
    expect(gradeExample(traceExample, 1).correct).toBe(false);
  });

  it('grades orderLines', () => {
    const ex: Example = {
      id: 'ol',
      type: 'orderLines',
      stage: 'try',
      tags: [],
      prompt: 'order',
      lines: ['a', 'b'],
      correctOrder: [0, 1],
      explanation: 'ab',
    };
    expect(gradeExample(ex, JSON.stringify([0, 1])).correct).toBe(true);
    expect(gradeExample(ex, JSON.stringify([1, 0])).correct).toBe(false);
  });

  it('grades matchPairs', () => {
    const ex: Example = {
      id: 'mp',
      type: 'matchPairs',
      stage: 'try',
      tags: [],
      prompt: 'match',
      leftItems: ['a', 'b'],
      rightItems: ['1', '2'],
      pairs: [[0, 0], [1, 1]],
      explanation: 'ok',
    };
    expect(gradeExample(ex, JSON.stringify([[0, 0], [1, 1]])).correct).toBe(true);
  });

  it('grades dragBlank', () => {
    const ex: Example = {
      id: 'db',
      type: 'dragBlank',
      stage: 'try',
      tags: [],
      prompt: 'fill',
      code: '{{x}}',
      blanks: [{ id: 'x', answer: 'print' }],
      distractors: ['pass'],
      explanation: 'ok',
    };
    expect(gradeExample(ex, JSON.stringify({ x: 'print' })).correct).toBe(true);
  });
});
