import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const STALE_TIME = 30_000;
const client = new QueryClient({
  defaultOptions: { queries: { staleTime: STALE_TIME, retry: false } },
});

export function Providers({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
