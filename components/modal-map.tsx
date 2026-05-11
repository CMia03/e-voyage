"use client";

import React from "react";
import { MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ModalMapProps {
  isOpen: boolean;
  onClose: () => void;
  destinationName: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export function ModalMap({ isOpen, onClose, destinationName, location, coordinates }: ModalMapProps) {
  // Generate Google Maps embed URL
  const getMapUrl = () => {
    if (coordinates) {
      return `https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=13&output=embed`;
    }
    if (location) {
      // For Madagascar locations, use a broader zoom to show the country
      return `https://maps.google.com/maps?q=${encodeURIComponent(location)}, Madagascar&z=6&output=embed`;
    }
    // Default to Madagascar with broader zoom
    return `https://maps.google.com/maps?q=${encodeURIComponent(destinationName)}, Madagascar&z=6&output=embed`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Localisation : {destinationName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative flex-1 h-[calc(80vh-4rem)]">
          {/* Map iframe */}
          <div className="w-full h-full">
            <iframe
              src={getMapUrl()}
              className="w-full h-full border-0"
              title={`Carte de ${destinationName}`}
              allowFullScreen
              loading="lazy"
            />
          </div>
          
          {/* Location info overlay */}
          {(location || coordinates) && (
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 max-w-sm">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">{destinationName}</span>
              </div>
              {location && (
                <p className="text-xs text-muted-foreground">{location}</p>
              )}
              {coordinates && (
                <p className="text-xs text-muted-foreground">
                  Coordonnées : {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
