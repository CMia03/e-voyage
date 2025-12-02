"use client";

import Image from "next/image";
import { ImageLightbox } from "@/components/image-lightbox";
import { useState } from "react";
import Link from "next/link";

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

  const imageSources = images.map(img => img.src);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {images.map((image, index) => (
          <div
            key={`${image.destinationId}-${index}`}
            className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer transition-transform hover:scale-105"
            onClick={() => handleImageClick(index)}
          >
            <Image
              src={image.src}
              alt={`${image.destination} - Image ${index + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs text-white font-medium truncate">{image.destination}</p>
            </div>
          </div>
        ))}
      </div>

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

