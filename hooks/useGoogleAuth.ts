"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  checkAndLoadGoogleUserProfile, 
  hasPreviousGoogleSession,
  prepareGoogleUserDisplay,
  type UserProfile 
} from "@/lib/auto-auth";
import { useAuth } from "./useAuth";

export interface GoogleUserInfo {
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: string;
  isComplete: boolean;
}

export function useGoogleAuth() {
  const { session, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [googleUserInfo, setGoogleUserInfo] = useState<GoogleUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated && session) {
      // Vérifier si c'est un utilisateur Google
      if (hasPreviousGoogleSession()) {
        loadGoogleUserInfo();
      }
    }
  }, [authLoading, isAuthenticated, session]);

  const loadGoogleUserInfo = async () => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await checkAndLoadGoogleUserProfile();
      
      if (result.isGoogleUser && result.profile) {
        const userInfo = prepareGoogleUserDisplay(result.session, result.profile);
        setGoogleUserInfo(userInfo);
        
        console.log("Profil Google chargé automatiquement:", userInfo);
      } else if (result.isGoogleUser && !result.profile) {
        // Utilisateur Google mais profil pas encore complété
        const userInfo = prepareGoogleUserDisplay(result.session, null);
        setGoogleUserInfo(userInfo);
        
        console.log("Utilisateur Google détecté, profil incomplet");
      }
    } catch (err) {
      setError("Erreur lors du chargement du profil Google");
      console.error("Erreur useGoogleAuth:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshGoogleProfile = async () => {
    await loadGoogleUserInfo();
  };

  const redirectToProfileCompletion = () => {
    router.push('/complete-profile');
  };

  return {
    googleUserInfo,
    isLoading: isLoading || authLoading,
    error,
    isGoogleUser: !!googleUserInfo,
    refreshGoogleProfile,
    redirectToProfileCompletion,
  };
}
