import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { loadAuth, clearAuth } from '@/lib/auth';
import { setLogoutCallback } from '@/lib/session-manager';

export function useAuthSession() {
  const router = useRouter();

  const logout = useCallback(() => {
    clearAuth();
    // Ne rediriger vers login que si on est sur une route protégée
    const path = window.location.pathname;
    if (path.startsWith('/admin') || path.startsWith('/dashboard')) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    // Enregistrer le callback de déconnexion global
    setLogoutCallback(logout);

    const checkSession = () => {
      const auth = loadAuth();
      
      if (!auth || !auth.accessToken) {
        // Ne déconnecter que si on est sur une route protégée
        const path = window.location.pathname;
        if (path.startsWith('/admin') || path.startsWith('/dashboard')) {
          logout();
        }
        return;
      }

      if (auth.expiresAt && Date.now() > auth.expiresAt) {
        console.log('Session expired - logging out');
        // Ne déconnecter que si on est sur une route protégée
        const path = window.location.pathname;
        if (path.startsWith('/admin') || path.startsWith('/dashboard')) {
          logout();
        }
        return;
      }
    };

    checkSession();
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
      // Nettoyer le callback de déconnexion
      setLogoutCallback(() => {});
    };
  }, [logout]);

  return { logout };
}
