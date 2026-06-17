import { Outlet } from 'react-router-dom';
import { CommandRail } from './CommandRail';
import { HudHeader } from './HudHeader';
import { NatoClassStrip } from './NatoClassStrip';
import { StatusBar } from './StatusBar';
import { useRailCollapsed } from '../../hooks/useRailCollapsed';

export function AppLayout() {
  const { collapsed, toggle } = useRailCollapsed();

  return (
    <div className={`app-shell command-center${collapsed ? ' rail-collapsed' : ''}`}>
      <div className="ambient" aria-hidden="true">
        <div className="ambient-grid" />
        <div className="ambient-hex" />
        <div className="ambient-scanline" />
      </div>

      <NatoClassStrip />
      <HudHeader />
      <CommandRail collapsed={collapsed} onToggle={toggle} />

      <main className="viewport-panel">
        <div className="viewport-inner">
          <Outlet />
        </div>
      </main>

      <StatusBar />
    </div>
  );
}
