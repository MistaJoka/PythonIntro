import { NavLink, useLocation, useParams } from 'react-router-dom';
import { LESSON_META } from '../../content/registry';
import { useProgressStore } from '../../store/progress';
import { getRailLocus } from './railLocus';

const NAV_ITEMS = [
  { to: '/', label: 'C2', glyph: '⊕', end: true },
  { to: '/practice', label: 'Drill', glyph: '⚡', end: false },
  { to: '/review', label: 'SRS', glyph: '↻', end: false },
  { to: '/capstones', label: 'Dev', glyph: '◆', end: false },
  { to: '/exam-prep', label: 'Test', glyph: '◎', end: false },
  { to: '/dashboard', label: 'Log', glyph: '▣', end: false },
] as const;

interface CommandRailProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function CommandRail({ collapsed, onToggle }: CommandRailProps) {
  const { pathname } = useLocation();
  const { lessonId } = useParams();
  const courseProgress = useProgressStore((s) => s.courseProgress);
  const locus = getRailLocus(pathname, lessonId);

  return (
    <aside
      className={`command-rail${collapsed ? ' command-rail--collapsed' : ''}`}
      aria-label="Command navigation"
    >
      <div className="rail-head">
        <button
          type="button"
          className="rail-toggle"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-controls="command-rail-nav"
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          <span className="rail-toggle-icon" aria-hidden="true">
            {collapsed ? '›' : '‹'}
          </span>
          <span className="sr-only">{collapsed ? 'Expand navigation' : 'Collapse navigation'}</span>
        </button>

        {!collapsed && <span className="rail-head-label">C2 nav</span>}

        <div
          className={`rail-locus${collapsed ? '' : ' rail-locus--compact-only'}`}
          title={locus.label}
          aria-label={`Current: ${locus.label}`}
        >
          <span className={`rail-locus-mark rail-locus-mark--${locus.kind}`}>{locus.glyph}</span>
          <span className="rail-locus-label">{locus.shortLabel}</span>
        </div>
      </div>

      <nav id="command-rail-nav" className="rail-nav">
        {NAV_ITEMS.map(({ to, label, glyph, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
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
        <span className="rail-section-label">{collapsed ? 'MOD' : 'Modules'}</span>
        <ul className="module-list">
          {LESSON_META.map((meta, index) => {
            const progress = courseProgress[meta.id] ?? 0;
            const num = String(index + 1).padStart(2, '0');
            return (
              <li key={meta.id}>
                <NavLink
                  to={`/lesson/${meta.id}`}
                  title={`${meta.title} — ${progress}%`}
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
