"use client";

import Image from "next/image";
import { ImageLightbox } from "@/components/image-lightbox";
import { useState } from "react";
import Link from "next/link";
import { destinationsData } from "@/lib/destinations";

interface GalleryImage {
  src: string;
  destination: string;
  destinationId: string;
}

interface GalleryClientProps {
  images: GalleryImage[];
}

export function GalleryClient({ images }: GalleryClientProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedDestination, setSelectedDestination] = useState<string>("all");

  // Filtrer les images selon la destination sélectionnée
  const filteredImages = selectedDestination === "all" 
    ? images 
    : images.filter(img => img.destinationId === selectedDestination);

  const imageSources = filteredImages.map(img => img.src);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  // Obtenir les destinations uniques
  const destinations = [
    { id: "all", name: "Toutes les destinations" },
    ...destinationsData.map(dest => ({ id: dest.id, name: dest.title }))
  ];

  return (
    <>
      {/* Filtres par destination */}
      <div className="mb-8 sm:mb-12">
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
          {destinations.map((dest) => (
            <button
              key={dest.id}
              onClick={() => setSelectedDestination(dest.id)}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-medium transition-all duration-300 ${
                selectedDestination === dest.id
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 scale-105"
                  : "bg-card/50 border border-border/50 text-muted-foreground hover:bg-card hover:border-emerald-500/30 hover:text-foreground hover:scale-105"
              }`}
            >
              {dest.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
        {filteredImages.map((image, index) => (
          <div
            key={`${image.destinationId}-${index}`}
            className="group relative aspect-square overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20 border border-border/50 bg-card/50 backdrop-blur-sm"
            onClick={() => handleImageClick(index)}
          >
            <Image
              src={image.src}
              alt={`${image.destination} - Image ${index + 1}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-teal-500/0 to-cyan-500/0 group-hover:from-emerald-500/10 group-hover:via-teal-500/10 group-hover:to-cyan-500/10 transition-all duration-500" />
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-xs sm:text-sm text-white font-semibold truncate drop-shadow-lg">
                {image.destination}
              </p>
            </div>
            {/* Badge de numéro */}
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {index + 1}/{filteredImages.length}
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucune image */}
      {filteredImages.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">Aucune image disponible pour cette destination</p>
        </div>
      )}

      <ImageLightbox
        images={imageSources}
        currentIndex={selectedImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={images[selectedImageIndex]?.destination}
      />
    </>
  );
}

