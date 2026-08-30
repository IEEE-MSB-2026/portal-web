import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function ProtectedRoute({ children, requireCommittee = false }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!isAuthenticated) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />;
  }

  if (requireCommittee) {
    const hasCommitteeAccess = Boolean(
      user?.scopeType === 'committee' ||
      user?.committeeId ||
      (user?.availableScopes && user.availableScopes.some((s) => s.scopeType === 'committee' || s.committeeSlug || s.committeeName)) ||
      ['admin', 'officer'].includes(user?.role)
    );
    if (!hasCommitteeAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
