import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { initSentry } from './lib/sentry.ts';
import { clerkEnabled, clerkPublishableKey } from './auth/clerkConfig';
import './index.css';

initSentry();

const tree = (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {clerkEnabled && clerkPublishableKey ? (
      <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
        {tree}
      </ClerkProvider>
    ) : (
      tree
    )}
  </StrictMode>,
);
