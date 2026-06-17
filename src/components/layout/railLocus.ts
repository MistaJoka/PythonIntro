import { LESSON_META, getLessonById } from '../../content/registry';

const NAV_BY_PATH: Record<string, { glyph: string; label: string }> = {
  '/': { glyph: '◈', label: 'Overview' },
  '/practice': { glyph: '⚡', label: 'Practice' },
  '/review': { glyph: '↻', label: 'Review' },
  '/capstones': { glyph: '◆', label: 'Capstones' },
  '/exam-prep': { glyph: '◉', label: 'Exam' },
  '/dashboard': { glyph: '▣', label: 'Telemetry' },
};

export interface RailLocus {
  glyph: string;
  label: string;
  shortLabel: string;
  kind: 'nav' | 'module' | 'capstone';
}

export function getRailLocus(pathname: string, lessonId?: string): RailLocus {
  if (lessonId) {
    const lesson = getLessonById(lessonId);
    const index = LESSON_META.findIndex((m) => m.id === lessonId);
    const num = index >= 0 ? String(index + 1).padStart(2, '0') : '??';
    const title = lesson?.title ?? 'Module';
    return {
      glyph: num,
      label: title,
      shortLabel: title.split(/\s+/)[0] ?? title,
      kind: 'module',
    };
  }

  if (pathname.startsWith('/capstones/')) {
    return { glyph: '◆', label: 'Capstone workspace', shortLabel: 'Capstone', kind: 'capstone' };
  }

  const nav = NAV_BY_PATH[pathname];
  if (nav) {
    return { ...nav, shortLabel: nav.label, kind: 'nav' };
  }

  if (pathname.startsWith('/exam-prep')) {
    return { glyph: '◉', label: 'Exam prep', shortLabel: 'Exam', kind: 'nav' };
  }

  return { glyph: '◈', label: 'Python Dojo', shortLabel: 'Dojo', kind: 'nav' };
}
