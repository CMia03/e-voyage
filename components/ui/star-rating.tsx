"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = "sm",
  className = "" 
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [clickedRating, setClickedRating] = useState(0);

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5"
  };

  const handleStarClick = (index: number) => {
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
