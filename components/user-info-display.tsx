"use client";

import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail } from "lucide-react";

interface UserInfoDisplayProps {
  variant?: "compact" | "detailed";
  showAvatar?: boolean;
  className?: string;
}

export function UserInfoDisplay({ 
  variant = "compact", 
  showAvatar = true,
  className = ""
}: UserInfoDisplayProps) {
  const { googleUserInfo, isLoading, isGoogleUser } = useGoogleAuth();

  if (isLoading || !isGoogleUser || !googleUserInfo) {
    return null;
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="default" className="bg-red-500 text-xs">Admin</Badge>;
      case "USER":
        return <Badge variant="secondary" className="text-xs">Client</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{role}</Badge>;
    }
  };

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showAvatar && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={googleUserInfo.avatar} alt={googleUserInfo.displayName} />
            <AvatarFallback className="text-xs">
              {getInitials(googleUserInfo.firstName, googleUserInfo.lastName)}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{googleUserInfo.firstName}</span>
          {getRoleBadge(googleUserInfo.role)}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {showAvatar && (
        <div className="flex justify-center">
          <Avatar className="w-16 h-16">
            <AvatarImage src={googleUserInfo.avatar} alt={googleUserInfo.displayName} />
            <AvatarFallback className="text-lg">
              {getInitials(googleUserInfo.firstName, googleUserInfo.lastName)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">{googleUserInfo.displayName}</h3>
        
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-4 h-4" />
          <span>{googleUserInfo.email}</span>
        </div>
        
        <div className="flex justify-center">
          {getRoleBadge(googleUserInfo.role)}
        </div>
      </div>
      
      {!googleUserInfo.isComplete && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg text-center">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Profil incomplet - Certaines fonctionnalités peuvent être limitées
          </p>
        </div>
      )}
    </div>
  );
}
