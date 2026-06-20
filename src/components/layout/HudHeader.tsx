import { NavLink, useLocation, useParams } from 'react-router-dom';
import { getLessonById } from '../../content/registry';
import { getOverallCompletion, useProgressStore } from '../../store/progress';
import { buildSmartPracticeQueue } from '../../engine/practiceQueue';
import { computeReadinessScore } from '../../engine/readiness';

function viewportTitle(pathname: string, params: Record<string, string | undefined>): string {
  if (pathname === '/') return 'Overview';
  if (pathname === '/practice') return 'Practice';
  if (pathname === '/review') return 'Spaced Review';
  if (pathname === '/dashboard') return 'History';
  if (pathname === '/capstones') return 'Capstone Projects';
  if (pathname.startsWith('/capstones/')) return 'Project Workspace';
  if (pathname === '/exam-prep') return 'Exam Prep';
  if (pathname === '/exam-prep/diagnostic') return 'Diagnostic';
  if (pathname.startsWith('/exam-prep/sim/')) return 'Timed Exam';
  if (pathname.startsWith('/exam-prep/review/')) return 'Exam Review';
  if (pathname.endsWith('/check') && params.lessonId) {
    const lesson = getLessonById(params.lessonId);
    return lesson ? `${lesson.title} — Check` : 'Module Check';
  }
  if (params.lessonId) {
    const lesson = getLessonById(params.lessonId);
    return lesson ? lesson.title : 'Module';
  }
  if (pathname === '/showroom') return 'Showroom';
  return 'Challenges';
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
            <h1 className="hud-title">{title}</h1>
          </div>
        )}

        <div className="hud-chips" aria-label="Progress metrics">
          <span className="hud-chip">
            <span className="chip-key">Accuracy</span>
            <span className="chip-val">{readiness}</span>
          </span>
          <span className="hud-chip">
            <span className="chip-key">Progress</span>
            <span className="chip-val">{completion}%</span>
          </span>
          <span className="hud-chip">
            <span className="chip-key">Due</span>
            <span className="chip-val">{queueCount}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
