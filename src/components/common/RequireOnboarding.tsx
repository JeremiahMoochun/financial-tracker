import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** Sends new accounts to baseline onboarding before the rest of the app. */
export function RequireOnboarding({ children }: { children: ReactNode }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading || (token && !user)) {
    return (
      <div className="loading-screen">
        <p>Loading…</p>
      </div>
    );
  }

  if (user?.onboardingComplete === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
