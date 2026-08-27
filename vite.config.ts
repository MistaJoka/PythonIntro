import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/*
 * Progress lives in localStorage, which the browser scopes per ORIGIN — so
 * http://localhost:5173 and http://localhost:5174 are separate stores. Vite's
 * default is to silently pick the next free port when 5173 is busy (a stale
 * dev server is the usual cause), which makes a learner's progress look erased
 * when it is actually intact one port over.
 *
 * strictPort turns that silent, alarming failure into a loud, obvious one: the
 * server refuses to start and says the port is taken. Preview is pinned to the
 * same port deliberately, so progress carries between `npm run dev` and
 * `npm run preview` instead of living in two disconnected stores.
 */
const APP_PORT = 5173;

export default defineConfig({
  plugins: [react()],
  server: {
    port: APP_PORT,
    strictPort: true,
  },
  preview: {
    port: APP_PORT,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['pyodide'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
});
