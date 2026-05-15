"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, initializeSessionManager } from "@/lib/session-manager";
import { loadAuth } from "@/lib/auth";

interface SessionGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export function SessionGuard({ 
  children, 
  redirectTo = "/login", 
  requireAuth = true 
}: SessionGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (typeof window !== "undefined") {
          initializeSessionManager();
        }

        const authenticated = isAuthenticated();

        // Ne rediriger que si c'est une route strictement protégée ET non authentifié
        if (requireAuth && !authenticated) {
          // Vérifier si on est déjà sur une page publique pour éviter les boucles
          const currentPath = window.location.pathname;
          const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/'];
          
          if (!publicPaths.includes(currentPath)) {
            router.push(redirectTo);
            return;
          }
        }
      } catch {
        // En cas d'erreur, ne pas rediriger automatiquement
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router, redirectTo, requireAuth]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cool_voyage_auth") {
        const authenticated = isAuthenticated();
        
        // Ne rediriger que si c'est une route strictement protégée
        if (requireAuth && !authenticated) {
          const currentPath = window.location.pathname;
          const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/'];
          
          if (!publicPaths.includes(currentPath)) {
            router.push(redirectTo);
          }
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, [router, redirectTo, requireAuth]);

  useEffect(() => {
    const handleFocus = () => {
      // Ne plus rediriger automatiquement au focus
      // Permettre la navigation même si session expirée
      // Mettre à jour l'état d'authentification sans rediriger
      isAuthenticated();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
      return () => window.removeEventListener("focus", handleFocus);
    }
  }, [redirectTo, requireAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthWrapper({ 
  children, 
  fallback = null,
  requireAuth = true 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}) {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (requireAuth && !isAuth) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function useAuth() {
  const [user, setUser] = useState(loadAuth());
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = loadAuth();
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
    };

    const interval = setInterval(checkAuth, 30000);

    const handleStorageChange = () => checkAuth();
    
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange);
      }
    };
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading: false,
  };
}
