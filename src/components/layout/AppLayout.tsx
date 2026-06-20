import { NavLink, Outlet } from 'react-router-dom';
import { CommandRail } from './CommandRail';
import { HudHeader } from './HudHeader';
import { StatusBar } from './StatusBar';
import { useRailCollapsed } from '../../hooks/useRailCollapsed';

const MOBILE_NAV = [
  { to: '/',          label: 'Home',     glyph: '⊕', end: true  },
  { to: '/practice',  label: 'Practice', glyph: '⚡', end: false },
  { to: '/review',    label: 'Review',   glyph: '↻', end: false },
  { to: '/capstones', label: 'Projects', glyph: '◆', end: false },
  { to: '/exam-prep', label: 'Exams',    glyph: '◎', end: false },
] as const;

export function AppLayout() {
  const { collapsed, toggle } = useRailCollapsed();

  return (
    <div className={`app-shell command-center${collapsed ? ' rail-collapsed' : ''}`}>
      <div className="ambient" aria-hidden="true">
        <div className="ambient-grid" />
        <div className="ambient-hex" />
        <div className="ambient-scanline" />
      </div>

      <HudHeader />
      <CommandRail collapsed={collapsed} onToggle={toggle} />

      <main className="viewport-panel">
        <div className="viewport-inner">
          <Outlet />
        </div>
      </main>

      <StatusBar />

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {MOBILE_NAV.map(({ to, label, glyph, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="mobile-nav-glyph" aria-hidden="true">{glyph}</span>
            <span className="mobile-nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
