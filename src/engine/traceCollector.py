"""Line-by-line execution tracer for Pyodide — no external packages."""
import sys

MAX_LINES = 200
TRACE_FILENAME = "<user>"


def _snapshot_locals(frame):
    return {
        k: repr(v)
        for k, v in frame.f_locals.items()
        if not k.startswith("__")
    }


def collect_trace(source: str, max_lines: int = MAX_LINES):
    """Execute *source* under sys.settrace and return step snapshots as a dict."""
    steps = []
    prev_locals = {}
    line_count = 0
    error = None

    try:
        code = compile(source, TRACE_FILENAME, "exec")
    except SyntaxError as exc:
        return {"steps": [], "error": f"SyntaxError: {exc.msg} (line {exc.lineno})"}

    namespace = {"__name__": "__trace__"}

    def tracer(frame, event, arg):
        nonlocal prev_locals, line_count
        if event != "line" or frame.f_code.co_filename != TRACE_FILENAME:
            return tracer
        line_count += 1
        if line_count > max_lines:
            raise RuntimeError(
                f"Stopped after {max_lines} lines (possible infinite loop)"
            )
        loc = _snapshot_locals(frame)
        changed = [k for k in loc if loc.get(k) != prev_locals.get(k)]
        steps.append({"line": frame.f_lineno, "vars": loc, "changed": changed})
        prev_locals = dict(loc)
        return tracer

    sys.settrace(tracer)
    try:
        exec(code, namespace)
    except Exception as exc:
        error = f"{type(exc).__name__}: {exc}"
    finally:
        sys.settrace(None)

    return {"steps": steps, **({"error": error} if error else {})}
