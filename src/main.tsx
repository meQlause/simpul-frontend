import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing application root');
}

createRoot(root).render(
  <StrictMode>
    <main id="page-content" tabIndex={-1} />
  </StrictMode>,
);
