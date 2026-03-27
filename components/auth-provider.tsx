"use client";

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadAuth, clearAuth } from '@/lib/auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();

  useEffect(() => {
    const isProtectedRoute = () => {
      const path = window.location.pathname;
      return path.startsWith('/admin') || path.startsWith('/dashboard');
    };

    if (isProtectedRoute()) {
      const auth = loadAuth();
      if (!auth || !auth.accessToken) {
        clearAuth();
        router.push('/login');
      }
    }
  }, [router]);

  return <>{children}</>;
}
