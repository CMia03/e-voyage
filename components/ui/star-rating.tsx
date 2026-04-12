"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserRating, saveUserRating } from "@/lib/api/notations";

interface StarRatingProps {
  rating: number;
  destinationId: string;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  isAuthenticated?: boolean;
}

export function StarRating({
  rating,
  destinationId,
  maxRating = 5,
  size = "md",
  className = "",
  isAuthenticated = false,
}: StarRatingProps) {
  const [currentRating, setCurrentRating] = useState(0); // Commence à 0 (gris)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();
  const userId = session?.userId;

  console.log("StarRating props:", { rating, destinationId, isAuthenticated, userId });

  // Effet pour charger la notation existante de l'utilisateur
  useEffect(() => {
    const fetchUserRating = async () => {
      if (!isAuthenticated || !userId || !destinationId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await getUserRating(destinationId, userId);

        if (response.success && response.data) {
          // L'utilisateur a déjà noté, afficher sa notation
          setCurrentRating(response.data.nombreEtoiles);
          console.log("User existing rating found:", response.data.nombreEtoiles);
        } else {
          // L'utilisateur n'a pas encore noté, garder 0 (gris)
          setCurrentRating(0);
          console.log("No existing rating found for user");
        }
      } catch (error) {
        console.error("Error fetching user rating:", error);
        setCurrentRating(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRating();
  }, [isAuthenticated, userId, destinationId]);

  const starSize = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const handleRatingClick = async (starValue: number) => {
    if (!isAuthenticated || !userId) {
      // Gérer le cas où l'utilisateur n'est pas authentifié ou l'ID utilisateur est manquant
      console.log("User not authenticated or userId is missing.");
      return;
    }

    if (isSubmitting) {
      console.log("Already submitting rating...");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await saveUserRating(destinationId, userId, starValue);

      if (response.success) {
        setCurrentRating(starValue);
        console.log("Rating saved successfully:", starValue);
      } else {
        console.error("Failed to save rating:", response.message);
      }
    } catch (error) {
      console.error("Error saving rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMouseEnter = (index: number) => {
    setHoveredRating(index + 1);
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {isLoading && (
        <div className="mr-2 text-sm text-blue-600 animate-pulse">
          Chargement...
        </div>
      )}
      {isSubmitting && (
        <div className="mr-2 text-sm text-green-600 animate-pulse">
          Envoi en cours...
        </div>
      )}
      {[...Array(maxRating)].map((_, i) => {
        const starValue = i + 1;
        const hasBeenRated = currentRating > 0; // Vérifie si l'utilisateur a déjà noté
        const isActive = hasBeenRated && starValue <= currentRating;
        const isHovered = starValue <= hoveredRating;
        
        return (
          <Star
            key={starValue}
            className={cn(
              starSize[size],
              "cursor-pointer transition-colors duration-200",
              // Couleur initiale grise, jaune seulement si noté ou en survol
              (isActive || isHovered)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-300 text-gray-300",
              (isLoading || isSubmitting) && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !isLoading && !isSubmitting && handleRatingClick(starValue)}
            onMouseEnter={() => !isLoading && !isSubmitting && handleMouseEnter(i)}
            onMouseLeave={() => !isLoading && !isSubmitting && handleMouseLeave()}
          />
        );
      })}
      <span className={`ml-2 text-sm ${
        size === "sm" ? "text-xs" : 
        size === "md" ? "text-sm" : 
        "text-base"
      } text-muted-foreground`}>
        {isLoading ? "Chargement..." : 
         currentRating > 0 ? `${currentRating}/${maxRating}` : 
         "Non noté"}
      </span>
    </div>
  );
}
