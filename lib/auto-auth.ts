import { AuthSession, loadAuth, saveAuth } from "./auth";
import { getProfile } from "./api/auth";

export interface UserProfile {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  dateNaissance?: string;
  adress?: string;
  nationalite?: string;
  role: string;
  estActif: boolean;
  photoProfilUrl?: string;
}

/**
 * Vérifie si l'utilisateur actuel est un utilisateur Google
 * et récupère automatiquement son profil complet
 */
export async function checkAndLoadGoogleUserProfile(): Promise<{
  session: AuthSession | null;
  profile: UserProfile | null;
  isGoogleUser: boolean;
}> {
  const session = loadAuth();
  
  if (!session) {
    return { session: null, profile: null, isGoogleUser: false };
  }

  // Vérifier si c'est un utilisateur Google (basé sur le format du login ou userId)
  const isGoogleUser = session.login?.includes('@gmail.com') || 
                       session.login?.includes('@google.com') ||
                       session.userId?.includes('google');

  if (!isGoogleUser) {
    return { session, profile: null, isGoogleUser: false };
  }

  try {
    // Récupérer le profil complet depuis l'API
    const response = await getProfile(session.accessToken);
    const profile = response.data as UserProfile;
    
    if (profile) {
      // Mettre à jour la session avec les informations complètes
      const updatedSession: AuthSession = {
        ...session,
        nom: profile.nom,
        prenom: profile.prenom,
        login: profile.email || session.login,
        userId: profile.id,
      };
      
      // Sauvegarder la session mise à jour
      saveAuth(updatedSession);
      
      return { session: updatedSession, profile, isGoogleUser: true };
    }
  } catch (error) {
    console.error("Erreur lors du chargement du profil Google:", error);
  }

  return { session, profile: null, isGoogleUser: true };
}

/**
 * Vérifie si un utilisateur Google s'est déjà connecté précédemment
 */
export function hasPreviousGoogleSession(): boolean {
  const session = loadAuth();
  if (!session) return false;
  
  return !!(session.login?.includes('@gmail.com') || 
         session.login?.includes('@google.com') ||
         session.userId?.includes('google'));
}

/**
 * Prépare les informations d'affichage pour un utilisateur Google
 */
export function prepareGoogleUserDisplay(session: AuthSession, profile: UserProfile | null) {
  const displayName = profile 
    ? `${profile.prenom} ${profile.nom}`.trim()
    : session.login?.split('@')[0] || 'Utilisateur';
    
  const firstName = profile?.prenom || session.login?.split('@')[0] || '';
  const lastName = profile?.nom || '';
  const email = profile?.email || session.login || '';
  const avatar = profile?.photoProfilUrl;

  return {
    displayName,
    firstName,
    lastName,
    email,
    avatar,
    role: session.role,
    isComplete: !!profile,
  };
}
