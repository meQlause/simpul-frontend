import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Providers } from './app/providers';
import { AppRoutes } from './app/router';
import { IconSprite } from './shared/ui/IconSprite';
import './styles/base.css';
import './styles/screen-state.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing application root');
}

createRoot(root).render(
  <StrictMode>
    <IconSprite />
    <Providers>
      <BrowserRouter>
        <main id="page-content" tabIndex={-1}>
          <AppRoutes />
        </main>
      </BrowserRouter>
    </Providers>
  </StrictMode>,
);
