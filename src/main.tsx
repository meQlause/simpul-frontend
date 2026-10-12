import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Providers } from './app/providers';
import { AppRoutes } from './app/router';
import { IconSprite } from './shared/ui/IconSprite';
import './styles/fonts.css';
import './styles/base.css';
import './styles/screen-state.css';
import './styles/shell.css';
import './styles/offline-controls.css';
import './styles/sidebar.css';
import './styles/flow.css';
import './styles/forms.css';
import './styles/logo.css';
import './styles/overview.css';
import './styles/responsive.css';
import './styles/nav-links.css';
import './styles/auth.css';
import './styles/directory.css';
import './styles/settings.css';
import './styles/channels.css';
import './styles/rules.css';
import './styles/onboarding.css';
import './styles/recipient-preview.css';
import './styles/parity.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing application root');
}

createRoot(root).render(
  <StrictMode>
    <IconSprite />
    <Providers>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Providers>
  </StrictMode>,
);
