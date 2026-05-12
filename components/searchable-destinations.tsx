"use client";

import { useState, useEffect } from "react";
import { DestinationCard } from "@/components/destination-card";
import { listDestinations } from "@/lib/api/destinations";
import { destinationsData as fallbackDestinations } from "@/lib/destinations";
import { DestinationDetails } from "@/lib/type/destination";

interface SearchableDestinationsProps {
  initialDestinations: DestinationDetails[];
}

export function SearchableDestinations({ initialDestinations }: SearchableDestinationsProps) {
  const [destinations] = useState<DestinationDetails[]>(initialDestinations);
  const [filteredDestinations, setFilteredDestinations] = useState<DestinationDetails[]>(initialDestinations);
  const [searchQuery, setSearchQuery] = useState("");

  // Effet pour écouter les événements de recherche du header
  useEffect(() => {
    const handleSearchChange = (event: CustomEvent<{ query: string }>) => {
      const query = event.detail.query.toLowerCase();
      setSearchQuery(query);
      
      if (query.trim() === "") {
        setFilteredDestinations(destinations);
      } else {
        const filtered = destinations.filter((destination) => {
          return (
            (destination.title && destination.title.toLowerCase().includes(query)) ||
            (destination.description && destination.description.toLowerCase().includes(query)) ||
            (destination.features && destination.features.some(feature => feature.toLowerCase().includes(query))) ||
            (destination.price && destination.price.toLowerCase().includes(query)) ||
            (destination.duration && destination.duration.toLowerCase().includes(query))
          );
        });
        setFilteredDestinations(filtered);
      }
    };

    // Écouter l'événement personnalisé du header
    window.addEventListener('searchChange', handleSearchChange as EventListener);
    
    // Initialiser la recherche depuis l'URL au chargement
    const urlParams = new URLSearchParams(window.location.search);
    const initialSearch = urlParams.get('search') || '';
    if (initialSearch) {
      handleSearchChange(new CustomEvent('searchChange', { detail: { query: initialSearch } }));
    }

    return () => {
      window.removeEventListener('searchChange', handleSearchChange as EventListener);
    };
  }, [destinations]);

  return (
    <div className="space-y-6">
      {/* Message de recherche */}
      {searchQuery && (
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            {filteredDestinations.length === 0 
              ? `Aucune destination trouvée pour "${searchQuery}"`
              : `${filteredDestinations.length} destination${filteredDestinations.length > 1 ? 's' : ''} trouvée${filteredDestinations.length > 1 ? 's' : ''} pour "${searchQuery}"`
            }
          </p>
        </div>
      )}
      
      {/* Grille des destinations */}
      <div className="grid gap-6 sm:gap-8 md:gap-10 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        {filteredDestinations.map((destination) => (
          <DestinationCard 
            key={destination.id} 
            destination={destination} 
          />
        ))}
      </div>
      
      {/* Message si aucun résultat */}
      {searchQuery && filteredDestinations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">Aucune destination trouvée</h3>
          <p className="text-muted-foreground mb-4">
            Essayez d'autres mots-clés ou contactez-nous pour un voyage sur mesure
          </p>
          <button
            onClick={() => {
              // Effacer la recherche
              window.history.replaceState({}, '', window.location.pathname);
              window.dispatchEvent(new CustomEvent('searchChange', { detail: { query: '' } }));
            }}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Afficher toutes les destinations
          </button>
        </div>
      )}
    </div>
  );
}
