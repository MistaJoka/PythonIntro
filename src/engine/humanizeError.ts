export interface HumanizedError {
  short: string;
  friendly: string;
  raw: string;
}

function extractExceptionLine(raw: string): string {
  const lines = raw.trim().split('\n').filter(Boolean);
  return lines[lines.length - 1] ?? raw;
}

function matchName(raw: string): HumanizedError | null {
  const m = raw.match(/NameError: name '([^']+)' is not defined/);
  if (!m) return null;
  return {
    short: `Name '${m[1]}' is not defined`,
    friendly: `You used '${m[1]}' before defining it. Assign a value first or check your spelling.`,
    raw,
  };
}

function matchType(raw: string): HumanizedError | null {
  if (!raw.includes('TypeError')) return null;
  if (raw.includes('unsupported operand type'))
    return {
      short: 'Incompatible types for operation',
      friendly:
        'You tried an operation on values that do not fit together (for example adding a string and an int). Convert types or check your operands.',
      raw,
    };
  if (raw.includes("'NoneType'"))
    return {
      short: 'Operation on None',
      friendly: 'A function returned None, but you treated it like another type. Check return values.',
      raw,
    };
  return {
    short: 'Type error',
    friendly: 'Python expected a different type. Read the message and check arguments and return values.',
    raw,
  };
}

/**
 * Errors specific to the ML bridge tier (pandas / NumPy / scikit-learn).
 *
 * These are checked before the generic handlers because the generic message for
 * each is actively unhelpful here: "Invalid value" tells a learner nothing about
 * why `and` failed on a Series, and the raw sklearn shape error is a wall of
 * numbers. The real traceback is still carried in `raw` and shown under
 * "Show details" — this only changes the first thing they read.
 */
function matchDataScience(raw: string): HumanizedError | null {
  // The single most common pandas error: `and`/`or` on a boolean Series.
  if (raw.includes('truth value of a') && raw.includes('ambiguous')) {
    return {
      short: 'Used `and` / `or` on a whole column',
      friendly:
        'A comparison like df["a"] > 1 produces a whole column of True/False values, and `and` ' +
        'needs a single one. Use & for "and", | for "or", and wrap each comparison in its own ' +
        'parentheses: df[(df["a"] > 1) & (df["b"] < 2)].',
      raw,
    };
  }

  const missingModule = raw.match(/ModuleNotFoundError: No module named '([^']+)'/);
  if (missingModule) {
    return {
      short: `${missingModule[1]} is not loaded`,
      friendly:
        `This challenge did not declare '${missingModule[1]}' as one of its required packages, ` +
        'so it was never downloaded. That is a fault in the exercise rather than in your code — ' +
        'the import itself is correct.',
      raw,
    };
  }

  // sklearn: X and y row counts disagree, almost always a mis-ordered split.
  if (raw.includes('Found input variables with inconsistent numbers of samples')) {
    return {
      short: 'X and y have different row counts',
      friendly:
        'The features and the target must line up row for row. This usually means the four ' +
        'results of train_test_split were unpacked in the wrong order — it returns ' +
        'X_train, X_test, y_train, y_test, in that order.',
      raw,
    };
  }

  if (raw.includes('Expected 2D array, got 1D array instead')) {
    return {
      short: 'Features must be 2-D',
      friendly:
        'scikit-learn expects X as a table with one row per sample, even when there is a single ' +
        'feature. df[["amount"]] (double brackets) gives a DataFrame; df["amount"] gives a 1-D ' +
        'Series, which is why the shape is wrong.',
      raw,
    };
  }

  if (raw.includes('could not convert string to float')) {
    return {
      short: 'A text value reached a numeric operation',
      friendly:
        'Some value in the column is not a number — CSV values arrive as text, and one bad entry ' +
        'keeps the whole column as text. Inspect it with df.dtypes, then convert with ' +
        'pd.to_numeric(col, errors="coerce"), which turns unparseable values into NaN instead of ' +
        'raising.',
      raw,
    };
  }

  // KeyError from a DataFrame column reads identically to a dict KeyError, but
  // the fix is different — point at the column list rather than dict keys.
  const columnKey = raw.match(/KeyError: ['"]([^'"]+)['"]/);
  if (columnKey && /\b(df|DataFrame|frame)\b/.test(raw)) {
    return {
      short: `No column named '${columnKey[1]}'`,
      friendly:
        `The DataFrame has no column '${columnKey[1]}'. Print df.columns to see the real names — ` +
        'a stray space or different capitalisation is the usual cause.',
      raw,
    };
  }

  if (raw.includes('SettingWithCopyWarning')) {
    return {
      short: 'Modifying a filtered frame',
      friendly:
        'You are writing to a frame that came from a filter. Under pandas 3 that copy is already ' +
        'independent, so the parent is safe — but call .copy() explicitly to make the intent clear ' +
        'and to keep the behaviour the same on older versions.',
      raw,
    };
  }

  return null;
}

export function humanizePythonError(raw: string): HumanizedError {
  const line = extractExceptionLine(raw);

  return (
    matchDataScience(raw) ??
    matchName(raw) ??
    matchName(line) ??
    (raw.includes('SyntaxError') || line.includes('SyntaxError')
      ? {
          short: 'Syntax error',
          friendly:
            'Python could not parse your code. Check colons, parentheses, quotes, and indentation on the line mentioned.',
          raw,
        }
      : null) ??
    (raw.includes('IndentationError') || line.includes('IndentationError')
      ? {
          short: 'Indentation error',
          friendly:
            'Indented blocks must line up consistently. Use the same number of spaces for each nesting level.',
          raw,
        }
      : null) ??
    matchType(raw) ??
    matchType(line) ??
    (raw.includes('ValueError') || line.includes('ValueError')
      ? {
          short: 'Invalid value',
          friendly: 'A value was the right type but not acceptable here (for example int("abc")). Check your input.',
          raw,
        }
      : null) ??
    (raw.includes('IndexError') || line.includes('IndexError')
      ? {
          short: 'Index out of range',
          friendly: 'You indexed past the end of a sequence. Remember valid indices run from 0 to len-1.',
          raw,
        }
      : null) ??
    (raw.includes('KeyError') || line.includes('KeyError')
      ? {
          short: 'Missing dictionary key',
          friendly: 'That key is not in the dict. Use .get() or check the key exists before accessing.',
          raw,
        }
      : null) ??
    (raw.includes('AttributeError') || line.includes('AttributeError')
      ? {
          short: 'Missing attribute',
          friendly: 'That object does not have the attribute or method you called. Check the type and spelling.',
          raw,
        }
      : null) ??
    (raw.includes('AssertionError') || line.includes('AssertionError')
      ? {
          short: 'Assertion failed',
          friendly: 'Your code ran but a test assertion failed. Compare your result to what the test expects.',
          raw,
        }
      : null) ??
    {
      short: line.length > 80 ? `${line.slice(0, 77)}…` : line,
      friendly: 'Something went wrong while running your code. Expand details below and fix the line mentioned.',
      raw,
    }
  );
}

export function formatFeedback(error: HumanizedError, prefix?: string): string {
  return prefix ? `${prefix}: ${error.friendly}` : error.friendly;
}
