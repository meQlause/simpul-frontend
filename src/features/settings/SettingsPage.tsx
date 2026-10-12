import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ScreenState } from '../../shared/ui/ScreenState';
import { useScreenState } from '../../shared/useScreenState';
import { databaseCopy, useDatabase } from '../database-setup';
import { useSettings, useSettingsWorkspace } from './settings.api';
import { NotificationSettingsForm } from './NotificationSettingsForm';
import { settingsCopy as copy } from './settings.copy';

export function SettingsPage() {
  const query = useSettings();
  const workspace = useSettingsWorkspace();
  const database = useDatabase();
  const [saved, setSaved] = useState(false);
  const mailToast: unknown = useLocation().state?.toast;
  const state = useScreenState(query, false);

  if (!query.data) {
    return (
      <ScreenState
        state={state}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  }

  return (
    <section data-component="SettingsPage" data-variant="default">
      <div className="page-heading" data-component="PageHeading" data-variant="default">
        <div>
          <p className="eyebrow" data-role="eyebrow">
            {copy.eyebrow}
          </p>
          <h1 className="page-title" data-role="page-title">
            {copy.title}
          </h1>
          <p className="page-description" data-role="page-description">
            {copy.description}
          </p>
        </div>
        <Link className="button" to="/settings/onboarding">
          <svg className="icon" aria-hidden="true">
            <use href="#i-play" />
          </svg>
          {copy.onboarding}
        </Link>
      </div>
      <NotificationSettingsForm
        settings={query.data.data}
        workspace={workspace.data?.data.workspace}
        save={query.save.mutateAsync}
        pending={query.save.isPending}
        onSaved={() => {
          setSaved(true);
        }}
      />
      {(saved || typeof mailToast === 'string') && (
        <p role="status" className="toast" data-component="Toast" data-variant="default">
          {saved ? copy.saved : String(mailToast)}
        </p>
      )}
      <SettingsCallouts hasDatabase={Boolean(database.data)} />
    </section>
  );
}

function SettingsCallouts({ hasDatabase }: { hasDatabase: boolean }) {
  return (
    <>
      {[
        {
          title: copy.vocabulary,
          description: copy.vocabularyDescription,
          action: copy.manage,
          path: '/settings/vocabulary',
          icon: 'layers',
        },
        {
          title: copy.preview,
          description: copy.previewDescription,
          action: copy.openPreview,
          path: '/settings/recipient-preview',
          icon: 'telegram',
        },
        {
          title: copy.email,
          description: copy.emailDescription,
          action: copy.configure,
          path: '/settings/mail',
          icon: 'mail',
        },
        ...(hasDatabase
          ? [
              {
                title: databaseCopy.calloutTitle,
                description: databaseCopy.calloutDescription,
                action: databaseCopy.view,
                path: '/settings/database',
                icon: 'shield',
              },
            ]
          : []),
      ].map((entry) => (
        <div
          className="directory-callout"
          key={entry.path}
          data-component="Callout"
          data-variant="default"
        >
          <span className="directory-icon">
            <svg className="icon" aria-hidden="true">
              <use href={`#i-${entry.icon}`} />
            </svg>
          </span>
          <div>
            <h3>{entry.title}</h3>
            <p>{entry.description}</p>
          </div>
          <Link className="button" to={entry.path}>
            {entry.action}
            <svg className="icon" aria-hidden="true">
              <use href="#i-arrow-right" />
            </svg>
          </Link>
        </div>
      ))}
    </>
  );
}
