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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Animation d'entrée */}
      <div
        className="relative h-full w-full animate-in fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 bg-black/50 text-white hover:bg-black/70"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Image principale avec animation */}
        <div className="flex h-full items-center justify-center p-2 sm:p-4">
          <div className="relative h-full w-full max-w-7xl animate-zoom-in-95">
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

        {/* Navigation précédent */}
        {images.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
          </Button>
        )}

        {/* Navigation suivant */}
        {images.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
            onClick={handleNext}
          >
            <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
          </Button>
        )}

        {/* Indicateur d'image */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="flex gap-2 rounded-full bg-black/50 px-4 py-2">
              <span className="text-sm text-white">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          </div>
        )}

        {/* Miniatures en bas */}
        {images.length > 1 && images.length <= 10 && (
          <div className="absolute bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2">
            <div className="flex gap-1 sm:gap-2 overflow-x-auto px-2 sm:px-4 max-w-[90vw]">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded border-2 transition-all ${
                    index === currentIndex
                      ? "border-white scale-110"
                      : "border-transparent opacity-60 hover:opacity-100"
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
  );
}

