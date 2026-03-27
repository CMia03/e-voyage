import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { loadAuth, clearAuth } from '@/lib/auth';

export function useAuthSession(checkImmediately = false) {
  const router = useRouter();

  const logout = useCallback(() => {
    clearAuth();
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const checkSession = () => {
      const auth = loadAuth();
      
      if (!auth || !auth.accessToken) {
        logout();
        return;
      }

      if (auth.expiresAt && Date.now() > auth.expiresAt) {
        console.log('Session expired - logging out');
        logout();
        return;
      }
    };

    if (checkImmediately) {
      checkSession();
    }

    const interval = setInterval(checkSession, 30 * 1000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSession();
      }
    };

    const handleFocus = () => {
      checkSession();
    };

    const handleBeforeUnload = () => {
      checkSession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [logout, checkImmediately]);

  return { logout };
}
