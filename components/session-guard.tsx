"use client";

import { useEffect } from 'react';
import { useAuthSession } from '@/lib/hooks/useAuthSession';

interface SessionGuardProps {
  children: React.ReactNode;
}

export function SessionGuard({ children }: SessionGuardProps) {
  const { logout } = useAuthSession(true);

  useEffect(() => {
    // Le hook gère déjà la vérification de session
  }, [logout]);

  return <>{children}</>;
}
