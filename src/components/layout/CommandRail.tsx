import { NavLink } from 'react-router-dom';
import { LESSON_META } from '../../content/registry';
import { useProgressStore } from '../../store/progress';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', glyph: '◈', end: true },
  { to: '/practice', label: 'Practice', glyph: '⚡', end: false },
  { to: '/review', label: 'Review', glyph: '↻', end: false },
  { to: '/capstones', label: 'Capstones', glyph: '◆', end: false },
  { to: '/exam-prep', label: 'Exam', glyph: '◉', end: false },
  { to: '/dashboard', label: 'Telemetry', glyph: '▣', end: false },
] as const;

export function CommandRail() {
  const courseProgress = useProgressStore((s) => s.courseProgress);

  return (
    <aside className="command-rail" aria-label="Command navigation">
      <nav className="rail-nav">
        {NAV_ITEMS.map(({ to, label, glyph, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => (isActive ? 'rail-link active' : 'rail-link')}
          >
            <span className="rail-glyph" aria-hidden="true">
              {glyph}
            </span>
            <span className="rail-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="rail-divider" aria-hidden="true" />

      <div className="rail-modules">
        <span className="rail-section-label">Modules</span>
        <ul className="module-list">
          {LESSON_META.map((meta, index) => {
            const progress = courseProgress[meta.id] ?? 0;
            const num = String(index + 1).padStart(2, '0');
            return (
              <li key={meta.id}>
                <NavLink
                  to={`/lesson/${meta.id}`}
                  className={({ isActive }) =>
                    `module-link ${meta.hasContent ? '' : 'stub'} ${progress === 100 ? 'complete' : ''} ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="module-num">{num}</span>
                  <span className="module-info">
                    <span className="module-title">{meta.title}</span>
                    <span className="module-track">
                      <span className="module-fill" style={{ width: `${progress}%` }} />
                    </span>
                  </span>
                  <span className="module-pct">{progress}%</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
