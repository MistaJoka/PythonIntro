import { describe, it, expect } from 'vitest';
import { version as npmPyodideVersion } from 'pyodide';
import {
  PYODIDE_INDEX_URL,
  PYODIDE_PACKAGE_VERSION,
  humanizePyodideLoadError,
} from '../src/engine/pyodide';

describe('pyodide loader config', () => {
  it('index URL matches the installed npm pyodide version', () => {
    expect(PYODIDE_PACKAGE_VERSION).toBe(npmPyodideVersion);
    expect(PYODIDE_INDEX_URL).toBe(
      `https://cdn.jsdelivr.net/pyodide/v${npmPyodideVersion}/full/`,
    );
  });

  it('does not pin the removed v0.27.7 CDN path', () => {
    expect(PYODIDE_INDEX_URL).not.toContain('v0.27.7');
  });

  it('humanizes CDN fetch failures for learners', () => {
    const msg =
      'Failed to fetch dynamically imported module: https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.asm.mjs';
    const h = humanizePyodideLoadError(msg);
    expect(h.friendly).toMatch(/download|network/i);
    expect(h.friendly).not.toContain('dynamically imported module');
  });

  it('humanizes version mismatch errors', () => {
    const h = humanizePyodideLoadError(
      "Pyodide version does not match: '314.0.0' <==> '0.27.7'",
    );
    expect(h.friendly).toMatch(/refresh|cache/i);
  });
});
