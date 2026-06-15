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

export function humanizePythonError(raw: string): HumanizedError {
  const line = extractExceptionLine(raw);

  return (
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
