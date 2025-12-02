"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageLightbox } from "@/components/image-lightbox";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { destinationsData } from "@/lib/destinations";

export function HomeGallery() {
  // Récupérer toutes les images de toutes les destinations et prendre les 4 premières
  const allImages = destinationsData.flatMap(dest => 
    dest.gallery.map(img => ({
      src: img,
      destination: dest.title
    }))
  ).slice(0, 4);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const imageSources = allImages.map(img => img.src);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {allImages.map((image, index) => (
          <div
            key={`${image.destination}-${index}`}
            className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer transition-transform hover:scale-105"
            onClick={() => handleImageClick(index)}
          >
            <Image
              src={image.src}
              alt={`${image.destination} - Image ${index + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        ))}
      </div>

      <div className="mt-6 sm:mt-8 text-center">
        <Button asChild size="lg" className="text-base sm:text-lg px-6 sm:px-8">
          <Link href="/galerie">
            Voir plus
          </Link>
        </Button>
      </div>

      <ImageLightbox
        images={imageSources}
        currentIndex={selectedImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={allImages[selectedImageIndex]?.destination}
      />
    </>
  );
}
