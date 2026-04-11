"use client";

import { ReactNode, useEffect } from 'react';
import { loadAuth } from '@/lib/auth';
import { useAuthSession } from '@/lib/hooks/useAuthSession';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { logout } = useAuthSession();

  useEffect(() => {
    const isProtectedRoute = () => {
      const path = window.location.pathname;
      return path.startsWith('/admin') || path.startsWith('/dashboard');
    };

    // Only check authentication on protected routes
    if (isProtectedRoute()) {
      const auth = loadAuth();
      if (!auth || !auth.accessToken) {
        logout();
      }
    }
  }, [logout]);

  return <>{children}</>;
}
