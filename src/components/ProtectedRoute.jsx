import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute
 * TEMPORARY: fake auth for prototype, replace with real backend auth
 * Checks sessionStorage for { isAuthenticated, role } to keep user logged in across page refreshes.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const authDataRaw = typeof window !== 'undefined' ? sessionStorage.getItem('salvex_demo_auth') : null;
  let auth = null;
  try {
    auth = authDataRaw ? JSON.parse(authDataRaw) : null;
  } catch {
    auth = null;
  }

  if (!auth?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(auth.role)) {
    // If authenticated under a different persona, redirect to corresponding dashboard
    if (auth.role === 'admin') return <Navigate to="/admin" replace />;
    if (auth.role === 'seller') return <Navigate to="/seller/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
