"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { User, Mail, Shield, RefreshCw } from "lucide-react";

interface GoogleUserWelcomeProps {
  onCompleteProfile?: () => void;
  showCompletionPrompt?: boolean;
}

export function GoogleUserWelcome({ 
  onCompleteProfile, 
  showCompletionPrompt = true 
}: GoogleUserWelcomeProps) {
  const { googleUserInfo, isLoading, error, refreshGoogleProfile } = useGoogleAuth();
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Afficher le message de bienvenue seulement si c'est un utilisateur Google
    if (googleUserInfo && !isLoading) {
      // Vérifier si c'est la première connexion ou si le profil est incomplet
      const hasSeenWelcome = localStorage.getItem('google_welcome_seen');
      if (!hasSeenWelcome || !googleUserInfo.isComplete) {
        setShowWelcome(true);
        localStorage.setItem('google_welcome_seen', 'true');
      }
    }
  }, [googleUserInfo, isLoading]);

  if (isLoading || !googleUserInfo || !showWelcome) {
    return null;
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="default" className="bg-red-500">Administrateur</Badge>;
      case "USER":
        return <Badge variant="secondary">Client</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const handleCompleteProfile = () => {
    setShowWelcome(false);
    if (onCompleteProfile) {
      onCompleteProfile();
    } else {
      router.push('/profile/complete');
    }
  };

  const handleClose = () => {
    setShowWelcome(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={googleUserInfo.avatar} alt={googleUserInfo.displayName} />
              <AvatarFallback className="text-lg">
                {getInitials(googleUserInfo.firstName, googleUserInfo.lastName)}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl">
            Bonjour {googleUserInfo.firstName} ! 
          </CardTitle>
          <CardDescription>
            {googleUserInfo.isComplete 
              ? "Heureux de vous revoir parmi nous !" 
              : "Bienvenue ! Complétez votre profil pour une meilleure expérience."
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{googleUserInfo.displayName}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{googleUserInfo.email}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-4 h-4 text-muted-foreground" />
              {getRoleBadge(googleUserInfo.role)}
            </div>
          </div>

          {!googleUserInfo.isComplete && showCompletionPrompt && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Complétez votre profil pour accéder à toutes les fonctionnalités
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {!googleUserInfo.isComplete && showCompletionPrompt ? (
              <>
                <Button onClick={handleCompleteProfile} className="flex-1">
                  Compléter mon profil
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Plus tard
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleClose} className="flex-1">
                  Commencer
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={refreshGoogleProfile}
                  title="Actualiser"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
