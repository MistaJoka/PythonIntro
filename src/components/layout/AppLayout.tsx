import { Outlet } from 'react-router-dom';
import { CommandRail } from './CommandRail';
import { HudHeader } from './HudHeader';
import { StatusBar } from './StatusBar';
import { TelemetryPanel } from './TelemetryPanel';

export function AppLayout() {
  return (
    <div className="app-shell command-center">
      <div className="ambient" aria-hidden="true">
        <div className="ambient-grid" />
        <div className="ambient-orb ambient-orb--cyan" />
        <div className="ambient-orb ambient-orb--amber" />
        <div className="ambient-scanline" />
      </div>

      <HudHeader />
      <CommandRail />

      <main className="viewport-panel">
        <div className="viewport-inner">
          <Outlet />
        </div>
      </main>

      <TelemetryPanel />
      <StatusBar />
    </div>
  );
}
