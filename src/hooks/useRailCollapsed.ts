import { useCallback, useState } from 'react';

const STORAGE_KEY = 'python-dojo:rail-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  } catch {
    /* ignore quota / private mode */
  }
}

export function useRailCollapsed() {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      writeCollapsed(next);
      return next;
    });
  }, []);

  return { collapsed, toggle };
}
