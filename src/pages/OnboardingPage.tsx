import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { User } from '../types/auth.types';
import { BaselineSpreadsheetForm } from '../components/baseline/BaselineSpreadsheetForm';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, token, loading, refreshUser } = useAuth();

  if (loading || (token && !user)) {
    return (
      <div className="loading-screen">
        <p>Loading…</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.onboardingComplete !== false) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <BaselineSpreadsheetForm
      variant="onboarding"
      onSubmit={async (body) => {
        await api.request<{ user: User }>('/auth/onboarding', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        await refreshUser();
        navigate('/dashboard', { replace: true });
      }}
      submitLabel="Save baseline & continue"
    />
  );
}
