"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  isAuthenticated?: boolean;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = "sm",
  className = "",
  isAuthenticated = false
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [clickedRating, setClickedRating] = useState(0);
  const router = useRouter();

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5"
  };

  const handleStarClick = (index: number) => {
    console.log("Star clicked - isAuthenticated:", isAuthenticated);
    if (!isAuthenticated) {
      // Rediriger vers la page de connexion avec un message
      console.log("Redirecting to login...");
      router.push("/login?message=Pour noter, vous devez vous connecter");
      return;
    }
    // Si connecté, permettre la notation
    console.log("User is authenticated, setting rating...");
    setClickedRating(index + 1);
  };

  const handleMouseEnter = (index: number) => {
    setHoveredRating(index + 1);
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[...Array(maxRating)].map((_, index) => {
        const isActive = clickedRating > 0 ? index < clickedRating : index < hoveredRating;
        
        return (
          <Star
            key={index}
            className={`${sizeClasses[size]} cursor-pointer transition-colors duration-200 ${
              isActive 
                ? "fill-yellow-400 text-yellow-400" 
                : "fill-gray-300 text-gray-300"
            }`}
            onClick={() => handleStarClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          />
        );
      })}
      <span className={`ml-2 text-sm ${
        size === "sm" ? "text-xs" : 
        size === "md" ? "text-sm" : 
        "text-base"
      } text-muted-foreground`}>
        {clickedRating || rating}/{maxRating}
      </span>
    </div>
  );
}
