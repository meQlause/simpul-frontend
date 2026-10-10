import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Providers } from './app/providers';
import { AppRoutes } from './app/router';
import { TopBar } from './app/shell/TopBar';
import { OfflineControls } from './shared/ui/OfflineControls';
import { IconSprite } from './shared/ui/IconSprite';
import './styles/base.css';
import './styles/screen-state.css';
import './styles/shell.css';
import './styles/offline-controls.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing application root');
}

createRoot(root).render(
  <StrictMode>
    <IconSprite />
    <Providers>
      <BrowserRouter>
        <TopBar />
        <main id="page-content" tabIndex={-1}>
          <OfflineControls>
            <AppRoutes />
          </OfflineControls>
        </main>
      </BrowserRouter>
    </Providers>
  </StrictMode>,
);
