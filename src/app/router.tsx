import { Route, Routes } from 'react-router';
import { OverviewPage } from '../features/overview';
import { WorkPage } from '../features/work';
import { ReviewQueuePage } from '../features/review-queue';
import { RulesPage } from '../features/rules';
import { PeoplePage } from '../features/people';
import { ChannelsPage } from '../features/channels';
import { AuditPage } from '../features/audit';
import { SettingsPage } from '../features/settings';
import { ScreenState } from '../shared/ui/ScreenState';
import { SignInPage } from '../features/auth';
import { SessionGuard } from './SessionGuard';
import { Shell } from './shell/Shell';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route element={<SessionGuard />}>
        <Route element={<Shell />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/work" element={<WorkPage />} />
          <Route path="/work/:displayId" element={<WorkPage />} />
          <Route path="/queue" element={<ReviewQueuePage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/people/:personId" element={<PeoplePage />} />
          <Route path="/channels/*" element={<ChannelsPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<ScreenState state="not-found" />} />
        </Route>
      </Route>
    </Routes>
  );
}
