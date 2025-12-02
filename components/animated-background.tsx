"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const backgroundImages = [
  "/images/stMarie1.jpg",
  "/images/stMarie2.jpg",
  "/images/stMarie3.jpg",
  "/images/Manbt1.jpg",
  "/images/mnabt5.jpg",
  "/images/mnbt4.jpg",
  "/images/mntb880266369999819_n.jpg",
  "/images/65878577347693840355_n.jpg",
];

export function AnimatedBackground() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000); // Change d'image toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Images principales avec transition en fondu */}
      <div className="relative h-full w-full">
        {backgroundImages.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={src}
              alt={`Background ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              quality={90}
              sizes="100vw"
            />
            {/* Overlay sombre pour améliorer la lisibilité du texte */}
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
        ))}
      </div>
      
      {/* Animation de défilement continu en arrière-plan (effet parallaxe) */}
      <div className="absolute inset-0 overflow-hidden opacity-30 z-0">
        <div className="flex animate-scroll h-full">
          {[...backgroundImages, ...backgroundImages].map((src, index) => (
            <div key={`scroll-${index}`} className="relative h-full w-[33vw] flex-shrink-0">
              <Image
                src={src}
                alt={`Scrolling background ${index}`}
                fill
                className="object-cover"
                quality={70}
                sizes="33vw"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

