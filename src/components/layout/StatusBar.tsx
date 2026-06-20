import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getLessonById, getCapstoneById } from '../../content/registry';
import { getOverallCompletion, useProgressStore } from '../../store/progress';

function sectorLabel(pathname: string, params: Record<string, string | undefined>): string {
  if (pathname === '/') return 'Overview';
  if (pathname === '/practice') return 'Practice';
  if (pathname === '/review') return 'Spaced Review';
  if (pathname === '/dashboard') return 'History';
  if (pathname === '/capstones') return 'Projects';
  if (pathname.startsWith('/capstones/') && params.projectId) {
    const project = getCapstoneById(params.projectId);
    return project ? `Projects — ${project.title}` : 'Projects';
  }
  if (pathname === '/exam-prep') return 'Exam Prep';
  if (pathname === '/exam-prep/diagnostic') return 'Diagnostic';
  if (pathname.startsWith('/exam-prep/sim/')) return 'Timed Exam';
  if (pathname.startsWith('/exam-prep/review/')) return 'Exam Review';
  if (pathname.endsWith('/check') && params.lessonId) {
    const lesson = getLessonById(params.lessonId);
    return lesson ? `Check — ${lesson.title}` : 'Module Check';
  }
  if (params.lessonId) {
    const lesson = getLessonById(params.lessonId);
    return lesson ? `Module — ${lesson.title}` : 'Module';
  }
  if (pathname === '/showroom') return 'Showroom';
  return 'Challenges';
}

export function StatusBar() {
  const { pathname } = useLocation();
  const params = useParams();
  const completion = getOverallCompletion();
  const srsCount = useProgressStore((s) => s.srsQueue.length);

  const sector = sectorLabel(pathname, params);
  const fmtClock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [clock, setClock] = useState(fmtClock);

  useEffect(() => {
    const id = setInterval(() => setClock(fmtClock()), 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="status-bar" aria-label="System status">
      <span className="status-sector">{sector}</span>
      <span className="status-path">{pathname}</span>
      <span className="status-meta">
        <span className="status-pill online">Online</span>
        <span className="status-pill">Progress {completion}%</span>
        <span className="status-pill">Due {srsCount}</span>
        <span className="status-clock">{clock}</span>
      </span>
    </footer>
  );
}
