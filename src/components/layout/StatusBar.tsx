import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getLessonById, getCapstoneById } from '../../content/registry';
import { getOverallCompletion, useProgressStore } from '../../store/progress';

function sectorLabel(pathname: string, params: Record<string, string | undefined>): string {
  if (pathname === '/') return 'OVERVIEW';
  if (pathname === '/practice') return 'PRACTICE QUEUE';
  if (pathname === '/review') return 'REVIEW DRILL';
  if (pathname === '/dashboard') return 'TELEMETRY LOG';
  if (pathname === '/capstones') return 'CAPSTONE BAY';
  if (pathname.startsWith('/capstones/') && params.projectId) {
    const project = getCapstoneById(params.projectId);
    return project ? `CAPSTONE // ${project.title.toUpperCase()}` : 'CAPSTONE BAY';
  }
  if (pathname === '/exam-prep') return 'EXAM PREP';
  if (pathname === '/exam-prep/diagnostic') return 'DIAGNOSTIC RUN';
  if (pathname.startsWith('/exam-prep/sim/')) return 'EXAM SIMULATION';
  if (pathname.startsWith('/exam-prep/review/')) return 'EXAM DEBRIEF';
  if (pathname.endsWith('/check') && params.lessonId) {
    const lesson = getLessonById(params.lessonId);
    return lesson ? `CHECK // ${lesson.title.toUpperCase()}` : 'LESSON CHECK';
  }
  if (params.lessonId) {
    const lesson = getLessonById(params.lessonId);
    return lesson ? `MODULE // ${lesson.title.toUpperCase()}` : 'MODULE';
  }
  return 'COMMAND CENTER';
}

export function StatusBar() {
  const { pathname } = useLocation();
  const params = useParams();
  const completion = getOverallCompletion();
  const srsCount = useProgressStore((s) => s.srsQueue.length);

  const sector = sectorLabel(pathname, params);
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="status-bar" aria-label="System status">
      <span className="status-sector">{sector}</span>
      <span className="status-path">{pathname}</span>
      <span className="status-meta">
        <span className="status-pill online">SYS ONLINE</span>
        <span className="status-pill">SYNC {completion}%</span>
        <span className="status-pill">SRS {srsCount}</span>
        <span className="status-clock">{time}</span>
      </span>
    </footer>
  );
}
