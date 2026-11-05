import { platform } from './platform/platform.ts';

// Placeholder until the app shell (change app-shell) replaces it.
export function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 32 }}>
      <h1>Orbit</h1>
      <p>Running on: {platform}</p>
    </main>
  );
}
