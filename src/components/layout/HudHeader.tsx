import { NavLink, useLocation, useParams } from 'react-router-dom';
import { getLessonById } from '../../content/registry';
import { getOverallCompletion, useProgressStore } from '../../store/progress';
import { buildSmartPracticeQueue } from '../../engine/practiceQueue';
import { computeReadinessScore } from '../../engine/readiness';

function viewportTitle(pathname: string, params: Record<string, string | undefined>): string {
  if (pathname === '/') return 'C2 — COMMAND POST';
  if (pathname === '/practice') return 'TRG — ADAPTIVE DRILL';
  if (pathname === '/review') return 'TRG — SRS REVIEW';
  if (pathname === '/dashboard') return 'LOG — MISSION TELEMETRY';
  if (pathname === '/capstones') return 'DEV — CAPSTONE OPS';
  if (pathname.startsWith('/capstones/')) return 'DEV — CAPSTONE WORKSPACE';
  if (pathname === '/exam-prep') return 'TST — EXAM PREPARATION';
  if (pathname === '/exam-prep/diagnostic') return 'TST — DIAGNOSTIC SWEEP';
  if (pathname.startsWith('/exam-prep/sim/')) return 'TST — TIMED EXAM';
  if (pathname.startsWith('/exam-prep/review/')) return 'TST — EXAM DEBRIEF';
  if (pathname.endsWith('/check') && params.lessonId) {
    const lesson = getLessonById(params.lessonId);
    return lesson ? `CHK — ${lesson.title.toUpperCase()}` : 'CHK — MODULE';
  }
  if (params.lessonId) {
    const lesson = getLessonById(params.lessonId);
    return lesson ? `MOD — ${lesson.title.toUpperCase()}` : 'MOD — TRAINING';
  }
  return 'C2 — TERMINAL';
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
  const focusLesson = /^\/lesson\/[^/]+$/.test(pathname);

  return (
    <header className={`hud-top${focusLesson ? ' hud-top--lesson' : ''}`}>
      <NavLink to="/" className="logo hud-logo">
        <span className="logo-mark" aria-hidden="true" />
        Python<span className="logo-accent">DOJO</span>
      </NavLink>

      <div className="hud-main">
        {!focusLesson && (
          <div className="hud-title-block">
            <span className="hud-label">Active channel</span>
            <h1 className="hud-title">{title}</h1>
          </div>
        )}

        <div className="hud-chips" aria-label="System metrics">
        <span className="hud-chip">
          <span className="chip-key">C-RATE</span>
          <span className="chip-val">{readiness}</span>
        </span>
        <span className="hud-chip">
          <span className="chip-key">TALLY</span>
          <span className="chip-val">{completion}%</span>
        </span>
        <span className="hud-chip">
          <span className="chip-key">PEND</span>
          <span className="chip-val">{queueCount}</span>
        </span>
      </div>
      </div>
    </header>
  );
}
