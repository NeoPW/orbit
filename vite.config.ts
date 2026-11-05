import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Tauri expects a fixed dev server port; it loads http://localhost:1420.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  // sqlite-wasm loads its .wasm relative to its own module; pre-bundling breaks that.
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  worker: {
    format: 'es',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
  },
});
