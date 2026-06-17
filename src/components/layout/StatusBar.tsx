import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getLessonById, getCapstoneById } from '../../content/registry';
import { formatZuluTime } from '../../engine/zuluClock';
import { getOverallCompletion, useProgressStore } from '../../store/progress';

function sectorLabel(pathname: string, params: Record<string, string | undefined>): string {
  if (pathname === '/') return 'C2 // OVERVIEW';
  if (pathname === '/practice') return 'TRG // DRILL QUEUE';
  if (pathname === '/review') return 'TRG // SRS REVIEW';
  if (pathname === '/dashboard') return 'LOG // TELEMETRY';
  if (pathname === '/capstones') return 'DEV // CAPSTONE BAY';
  if (pathname.startsWith('/capstones/') && params.projectId) {
    const project = getCapstoneById(params.projectId);
    return project ? `DEV // ${project.title.toUpperCase()}` : 'DEV // CAPSTONE';
  }
  if (pathname === '/exam-prep') return 'TST // EXAM PREP';
  if (pathname === '/exam-prep/diagnostic') return 'TST // DIAGNOSTIC';
  if (pathname.startsWith('/exam-prep/sim/')) return 'TST // EXAM SIM';
  if (pathname.startsWith('/exam-prep/review/')) return 'TST // DEBRIEF';
  if (pathname.endsWith('/check') && params.lessonId) {
    const lesson = getLessonById(params.lessonId);
    return lesson ? `CHK // ${lesson.title.toUpperCase()}` : 'CHK // MODULE';
  }
  if (params.lessonId) {
    const lesson = getLessonById(params.lessonId);
    return lesson ? `MOD // ${lesson.title.toUpperCase()}` : 'MOD // TRAINING';
  }
  return 'C2 // TERMINAL';
}

export function StatusBar() {
  const { pathname } = useLocation();
  const params = useParams();
  const completion = getOverallCompletion();
  const srsCount = useProgressStore((s) => s.srsQueue.length);

  const sector = sectorLabel(pathname, params);
  const [zulu, setZulu] = useState(() => formatZuluTime());

  useEffect(() => {
    const id = setInterval(() => setZulu(formatZuluTime()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="status-bar" aria-label="System status">
      <span className="status-sector">{sector}</span>
      <span className="status-path">{pathname}</span>
      <span className="status-meta">
        <span className="status-pill online">NET: UP</span>
        <span className="status-pill">TALLY {completion}%</span>
        <span className="status-pill">PEND {srsCount}</span>
        <span className="status-clock" title="Zulu time">
          {zulu}
        </span>
      </span>
    </footer>
  );
}
