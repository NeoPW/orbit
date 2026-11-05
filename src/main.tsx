import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './core/ui/theme.css';
import { AppRoot } from './app/AppRoot.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
