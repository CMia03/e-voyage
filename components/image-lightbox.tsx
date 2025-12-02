"use client";

import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function ImageLightbox({ images, currentIndex: initialIndex, isOpen, onClose, title }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
      onClick={onClose}
    >
      {/* Container centré avec taille limitée */}
      <div
        className="relative w-full max-w-5xl max-h-[90vh] animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Carte avec l'image */}
        <div className="relative bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-border/50">
          {/* Header avec titre et bouton fermer */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
            <div className="flex-1">
              {title && (
                <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                  {title}
                </h3>
              )}
              {images.length > 1 && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Image {currentIndex + 1} sur {images.length}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Image principale */}
          <div className="relative bg-muted/30">
            <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
              <Image
                src={images[currentIndex]}
                alt={title ? `${title} - Image ${currentIndex + 1}` : `Image ${currentIndex + 1}`}
                fill
                className="object-contain"
                priority
                quality={95}
              />
            </div>
          </div>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg border border-border/50"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg border border-border/50"
                onClick={handleNext}
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </>
          )}

          {/* Miniatures en bas */}
          {images.length > 1 && images.length <= 10 && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50 bg-muted/30">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`relative h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      index === currentIndex
                        ? "border-primary scale-105 shadow-lg"
                        : "border-border/50 opacity-60 hover:opacity-100 hover:border-primary/50"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

