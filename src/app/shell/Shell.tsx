import { Outlet } from 'react-router';
import { OfflineControls } from '../../shared/ui/OfflineControls';
import { TopBar } from './TopBar';
import { shellCopy } from './shell.copy';
import { Sidebar } from './Sidebar';
import { WorkspaceDrawer } from './WorkspaceDrawer';

export function Shell() {
  const [expanded, setExpanded] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  return (
    <>
      <a className="skip-link" href="#page-content">
        {shellCopy.skip}
      </a>
      <Sidebar
        expanded={expanded}
        onWorkspace={() => {
          setWorkspaceOpen(true);
        }}
        onNavigate={() => {
          setExpanded(false);
        }}
      />
      <div className="app-shell" data-component="Shell">
        <TopBar
          expanded={expanded}
          onMenu={() => {
            setExpanded((open) => !open);
          }}
        />
        <main id="page-content" tabIndex={-1}>
          <OfflineControls>
            <Outlet />
          </OfflineControls>
        </main>
      </div>
      {workspaceOpen && (
        <WorkspaceDrawer
          onClose={() => {
            setWorkspaceOpen(false);
          }}
        />
      )}
    </>
  );
}

import { useState } from 'react';
