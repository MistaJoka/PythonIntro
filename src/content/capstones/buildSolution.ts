/** Shared Python preamble — every capstone solution imports the full stdlib surface taught in L9–L15. */
export const PYTHON_PREAMBLE = `from __future__ import annotations

import csv
import io
import json
import math
import re
from copy import deepcopy
from typing import Any, Iterator

PASS_THRESHOLD = 60.0
`;

export const PYTHON_HELPERS = `def _letter(score: float) -> str:
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    elif score >= PASS_THRESHOLD:
        return "D"
    return "F"


def _clean(text: str) -> str:
    return re.sub(r"\\s+", " ", text.strip()).title()


def _rec_sum(values: list[float], index: int = 0) -> float:
    if index >= len(values):
        return 0.0
    return values[index] + _rec_sum(values, index + 1)
`;

export const PYTHON_OOP = `class ResultRow:
    """L11 — base row wrapper with class-level counter."""
    built = 0

    def __init__(self, label: str, value: float):
        self.label = _clean(label)
        self.value = value
        ResultRow.built += 1

    def describe(self) -> str:
        return f"{self.label}: {self.value:.2f}"


class HighlightRow(ResultRow):
    """L11 — inheritance + super()."""
    def describe(self) -> str:
        return super().describe() + " *"
`;

export function wrapSolution(body: string): string {
  return `${PYTHON_PREAMBLE}\n${PYTHON_HELPERS}\n${PYTHON_OOP}\n${body.trim()}\n`;
}

/** Step helper — attach lesson id for the walkthrough UI. */
export function step(
  line: number,
  teaching: string,
  lessonId?: string,
): { line: number; teaching: string; lessonId?: string } {
  return lessonId ? { line, teaching, lessonId } : { line, teaching };
}

export function countLines(code: string): number {
  return code.split('\n').length;
}
