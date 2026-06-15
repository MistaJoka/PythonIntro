"""Run user code in an isolated namespace with captured stdout/stderr."""
import contextlib
import io


def run_user_code(source: str) -> dict:
    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()
    namespace = {"__name__": "__main__"}
    error = None

    try:
        code = compile(source, "<user>", "exec")
    except SyntaxError as exc:
        return {
            "stdout": "",
            "stderr": "",
            "error": f"SyntaxError: {exc.msg} (line {exc.lineno})",
        }

    try:
        with contextlib.redirect_stdout(stdout_buf), contextlib.redirect_stderr(stderr_buf):
            exec(code, namespace)
    except Exception as exc:
        error = f"{type(exc).__name__}: {exc}"

    result = {
        "stdout": stdout_buf.getvalue(),
        "stderr": stderr_buf.getvalue(),
    }
    if error:
        result["error"] = error
    return result
