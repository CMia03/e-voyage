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
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (typeof window !== "undefined") {
          initializeSessionManager();
        }

        if (requireAuth) {
          const authenticated = isAuthenticated();
          setIsAuthenticatedState(authenticated);

          if (!authenticated) {
            router.push(redirectTo);
            return;
          }
        } else {
          setIsAuthenticatedState(isAuthenticated());
        }
      } catch {
        if (requireAuth) {
          router.push(redirectTo);
        }
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
        setIsAuthenticatedState(authenticated);
        
        if (requireAuth && !authenticated) {
          router.push(redirectTo);
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
      if (requireAuth && !isAuthenticated()) {
        router.push(redirectTo);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
      return () => window.removeEventListener("focus", handleFocus);
    }
  }, [router, redirectTo, requireAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticatedState) {
    return null;
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
