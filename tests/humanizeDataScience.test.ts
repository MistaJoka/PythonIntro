import { describe, it, expect } from 'vitest';
import { humanizePythonError } from '../src/engine/humanizeError';

describe('humanizePythonError - dataScience errors', () => {
  it('handles pandas ambiguous truth value with `and`/`or`', () => {
    const raw = `ValueError: The truth value of a Series is ambiguous. Use a.empty, a.bool(), a.item(), a.any() or a.all().`;
    const result = humanizePythonError(raw);

    expect(result.short).toContain('`and` / `or`');
    expect(result.friendly).toContain('&');
    expect(result.raw).toBe(raw);
  });

  it('handles ModuleNotFoundError for pandas', () => {
    const raw = `ModuleNotFoundError: No module named 'pandas'`;
    const result = humanizePythonError(raw);

    expect(result.short).toContain('pandas');
    expect(result.short).toContain('not loaded');
    expect(result.raw).toBe(raw);
  });

  it('handles ModuleNotFoundError for sklearn', () => {
    const raw = `ModuleNotFoundError: No module named 'sklearn'`;
    const result = humanizePythonError(raw);

    expect(result.short).toContain('sklearn');
    expect(result.raw).toBe(raw);
  });

  it('handles sklearn inconsistent samples X and y mismatch', () => {
    const raw = `ValueError: Found input variables with inconsistent numbers of samples: [100, 80]`;
    const result = humanizePythonError(raw);

    expect(result.short).toContain('different row counts');
    expect(result.friendly).toContain('train_test_split');
    expect(result.raw).toBe(raw);
  });

  it('handles sklearn 1D array instead of 2D', () => {
    const raw = `ValueError: Expected 2D array, got 1D array instead:\narray([1, 2, 3])`;
    const result = humanizePythonError(raw);

    expect(result.short).toContain('2-D');
    expect(result.friendly).toContain('double brackets');
    expect(result.raw).toBe(raw);
  });

  it('handles could not convert string to float', () => {
    const raw = `ValueError: could not convert string to float: 'abc'`;
    const result = humanizePythonError(raw);

    expect(result.short).toContain('text value');
    expect(result.friendly).toContain('to_numeric');
    expect(result.raw).toBe(raw);
  });

  it('handles DataFrame KeyError with column name', () => {
    const raw = `KeyError: 'age'\noccurred when indexing on a DataFrame`;
    const result = humanizePythonError(raw);

    expect(result.short).toContain("'age'");
    expect(result.short).toContain('column');
    expect(result.friendly).toContain('df.columns');
    expect(result.raw).toBe(raw);
  });

  it('handles DataFrame KeyError with quoted column name and df reference', () => {
    const raw = `KeyError: "salary"\ndf["salary"]`;
    const result = humanizePythonError(raw);

    expect(result.short).toContain('salary');
    expect(result.short).toContain('column');
    expect(result.raw).toBe(raw);
  });

  it('handles SettingWithCopyWarning', () => {
    const raw = `SettingWithCopyWarning: A value is trying to be set on a copy of a slice from a DataFrame`;
    const result = humanizePythonError(raw);

    expect(result.short).toContain('Modifying a filtered frame');
    expect(result.friendly).toContain('.copy()');
    expect(result.raw).toBe(raw);
  });

  // Regression tests: ensure new data science matcher did not break generic handlers
  it('still handles plain NameError without hijacking to data science', () => {
    const raw = `NameError: name 'foo' is not defined`;
    const result = humanizePythonError(raw);

    expect(result.short).toContain('foo');
    expect(result.short).toContain('not defined');
    expect(result.raw).toBe(raw);
  });

  it('handles generic KeyError without DataFrame context', () => {
    const raw = `KeyError: 'age'`;
    const result = humanizePythonError(raw);

    // Should NOT be the DataFrame column message, but the generic dict key message
    expect(result.short).toBe('Missing dictionary key');
    expect(result.friendly).toContain('.get()');
    expect(result.raw).toBe(raw);
  });
});
