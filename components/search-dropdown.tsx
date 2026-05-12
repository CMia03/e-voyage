"use client";

import { useState, useEffect, useRef } from "react";
import { DestinationDetails } from "@/lib/type/destination";
import { listDestinations } from "@/lib/api/destinations";
import { destinationsData as fallbackDestinations } from "@/lib/destinations";
import { Search, MapPin, Clock, DollarSign, ExternalLink } from "lucide-react";

interface SearchDropdownProps {
  searchQuery: string;
  onSelect: (destination: DestinationDetails) => void;
  onClose: () => void;
}

export function SearchDropdown({ searchQuery, onSelect, onClose }: SearchDropdownProps) {
  const [destinations, setDestinations] = useState<DestinationDetails[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<DestinationDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger les destinations au montage
  useEffect(() => {
    const loadDestinations = async () => {
      setLoading(true);
      try {
        const apiDestinations = await listDestinations();
        const destinationsList = apiDestinations.length > 0 ? apiDestinations : fallbackDestinations;
        setDestinations(destinationsList);
        setFilteredDestinations(destinationsList);
      } catch (error) {
        console.error("Erreur lors du chargement des destinations:", error);
        setDestinations(fallbackDestinations);
        setFilteredDestinations(fallbackDestinations);
      } finally {
        setLoading(false);
      }
    };

    loadDestinations();
  }, []);

  // Filtrer les résultats en fonction de la recherche
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDestinations(destinations.slice(0, 5)); // Afficher les 5 premières par défaut
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = destinations.filter((destination) => {
        return (
          (destination.title && destination.title.toLowerCase().includes(query)) ||
          (destination.description && destination.description.toLowerCase().includes(query)) ||
          (destination.features && destination.features.some(feature => feature.toLowerCase().includes(query))) ||
          (destination.price && destination.price.toLowerCase().includes(query)) ||
          (destination.duration && destination.duration.toLowerCase().includes(query))
        );
      }).slice(0, 8); // Limiter à 8 résultats
      setFilteredDestinations(filtered);
    }
  }, [searchQuery, destinations]);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleDestinationClick = (destination: DestinationDetails) => {
    onSelect(destination);
    onClose();
  };

  if (loading) {
    return (
      <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {filteredDestinations.length === 0 ? (
        <div className="p-4 text-center">
          <Search className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {searchQuery.trim() === "" 
              ? "Commencez à taper pour voir les destinations"
              : `Aucune destination trouvée pour "${searchQuery}"`
            }
          </p>
        </div>
      ) : (
        <div className="py-2">
          {searchQuery.trim() !== "" && (
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {filteredDestinations.length} résultat{filteredDestinations.length > 1 ? 's' : ''} trouvé{filteredDestinations.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
          {filteredDestinations.map((destination) => (
            <div
              key={destination.id}
              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => handleDestinationClick(destination)}
            >
              <div className="flex items-start space-x-3">
                {destination.image && (
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={destination.image}
                      alt={destination.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {destination.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                    {destination.description?.substring(0, 60)}...
                  </p>
                  <div className="flex items-center space-x-3 mt-2">
                    {destination.price && (
                      <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {destination.price}
                      </div>
                    )}
                    {destination.duration && (
                      <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {destination.duration}
                      </div>
                    )}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
