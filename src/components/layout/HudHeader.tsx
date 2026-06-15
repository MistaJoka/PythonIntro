import { NavLink, useLocation, useParams } from 'react-router-dom';
import { getLessonById } from '../../content/registry';
import { getOverallCompletion, useProgressStore } from '../../store/progress';
import { buildSmartPracticeQueue } from '../../engine/practiceQueue';
import { computeReadinessScore } from '../../engine/readiness';

function viewportTitle(pathname: string, params: Record<string, string | undefined>): string {
  if (pathname === '/') return 'Command Overview';
  if (pathname === '/practice') return 'Smart Practice';
  if (pathname === '/review') return 'Review Session';
  if (pathname === '/dashboard') return 'Telemetry Log';
  if (pathname === '/capstones') return 'Capstone Projects';
  if (pathname.startsWith('/capstones/')) return 'Capstone Workspace';
  if (pathname === '/exam-prep') return 'Exam Preparation';
  if (pathname === '/exam-prep/diagnostic') return 'Diagnostic Assessment';
  if (pathname.startsWith('/exam-prep/sim/')) return 'Timed Exam';
  if (pathname.startsWith('/exam-prep/review/')) return 'Exam Review';
  if (pathname.endsWith('/check') && params.lessonId) {
    const lesson = getLessonById(params.lessonId);
    return lesson ? `${lesson.title} — Check` : 'Lesson Check';
  }
  if (params.lessonId) {
    const lesson = getLessonById(params.lessonId);
    return lesson?.title ?? 'Module';
  }
  return 'Viewport';
}

export function HudHeader() {
  const { pathname } = useLocation();
  const params = useParams();
  const examples = useProgressStore((s) => s.examples);
  const lessonChecks = useProgressStore((s) => s.lessonChecks);
  const diagnostic = useProgressStore((s) => s.diagnostic);
  const srsQueue = useProgressStore((s) => s.srsQueue);
  const sessionPosition = useProgressStore((s) => s.sessionPosition);

  const readiness = computeReadinessScore({ examples, lessonChecks, diagnostic });
  const completion = getOverallCompletion();
  const queueCount = buildSmartPracticeQueue(srsQueue, examples, sessionPosition).length;
  const title = viewportTitle(pathname, params);

  return (
    <header className="hud-top">
      <NavLink to="/" className="logo hud-logo">
        <span className="logo-mark" aria-hidden="true" />
        Python<span>Dojo</span>
      </NavLink>

      <div className="hud-title-block">
        <span className="hud-label">Active viewport</span>
        <h1 className="hud-title">{title}</h1>
      </div>

      <div className="hud-chips" aria-label="System metrics">
        <span className="hud-chip">
          <span className="chip-key">RDY</span>
          <span className="chip-val">{readiness}</span>
        </span>
        <span className="hud-chip">
          <span className="chip-key">SYNC</span>
          <span className="chip-val">{completion}%</span>
        </span>
        <span className="hud-chip">
          <span className="chip-key">QUE</span>
          <span className="chip-val">{queueCount}</span>
        </span>
      </div>
    </header>
  );
}
