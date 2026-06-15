import { describe, it, expect } from 'vitest';
import { CAPSTONE_PROJECTS } from '../src/content/capstones/projects';
import { buildWalkthroughSteps } from '../src/content/capstones/walkthrough';
import { decomposeLine } from '../src/content/capstones/lineSegments';

describe('capstone walkthrough', () => {
  it('generates one step per solution line', () => {
    const project = CAPSTONE_PROJECTS[0]!;
    const lines = project.solution.split('\n');
    const steps = buildWalkthroughSteps(project.solution, project.id);
    expect(steps).toHaveLength(lines.length);
  });

  it('starts with setup teaching on imports', () => {
    const project = CAPSTONE_PROJECTS[0]!;
    const steps = buildWalkthroughSteps(project.solution, project.id);
    expect(steps[0]?.line).toBe(1);
    expect(steps[0]?.phase).toBe('setup');
    expect(steps[6]?.lineText.trim()).toBe('import re');
    expect(steps[6]?.effect.toLowerCase()).toContain('re');
    expect(steps[6]?.vars.re).toBeDefined();
  });

  it('line numbers match highlighted source', () => {
    for (const project of CAPSTONE_PROJECTS.slice(0, 3)) {
      const steps = buildWalkthroughSteps(project.solution, project.id);
      for (const s of steps) {
        expect(project.solution.split('\n')[s.line - 1]).toBeDefined();
      }
    }
  });

  it('includes execution state for main function lines', () => {
    const project = CAPSTONE_PROJECTS[0]!;
    const steps = buildWalkthroughSteps(project.solution, project.id);
    const mainSteps = steps.filter((s) => s.phase === 'main' && Object.keys(s.vars).length > 0);
    expect(mainSteps.length).toBeGreaterThan(10);
  });

  it('decomposes chained return into primitive segments', () => {
    const segs = decomposeLine('return re.sub(r"\\s+", " ", text.strip()).title()');
    expect(segs.map((s) => s.code)).toEqual([
      'text',
      '.strip()',
      're.sub(r"\\s+", " ", …)',
      '.title()',
      'return',
    ]);
    expect(segs[0]!.explain).toContain('text');
    expect(segs[2]!.explain.toLowerCase()).toContain('regex');
  });
});
