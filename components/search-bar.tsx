"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, MapPin, Home, Calendar } from "lucide-react";
import { destinationsData } from "@/lib/destinations";
import { listHebergements } from "@/lib/api/hebergements";
import { listActivites } from "@/lib/api/activites";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  type: "destination" | "hebergement" | "activite";
  description: string;
  url: string;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const searchResults: SearchResult[] = [];
    const queryLower = searchQuery.toLowerCase();

    // Search destinations
    destinationsData.forEach((dest) => {
      if (
        dest.title.toLowerCase().includes(queryLower) ||
        dest.description.toLowerCase().includes(queryLower)
      ) {
        searchResults.push({
          id: dest.id,
          title: dest.title,
          type: "destination",
          description: dest.description,
          url: `/destinations/${dest.id}`,
        });
      }
    });

    // Search accommodations
    try {
      const hebergements = await listHebergements();
      hebergements.forEach((heberg) => {
        if (
          heberg.nom.toLowerCase().includes(queryLower) ||
          heberg.description?.toLowerCase().includes(queryLower)
        ) {
          searchResults.push({
            id: heberg.id,
            title: heberg.nom,
            type: "hebergement",
            description: heberg.description || "",
            url: `/hebergements/${heberg.id}`,
          });
        }
      });
    } catch (error) {
      console.error("Error fetching accommodations:", error);
    }

    // Search activities
    try {
      const activites = await listActivites();
      activites.forEach((activite) => {
        if (
          activite.nom.toLowerCase().includes(queryLower) ||
          activite.description?.toLowerCase().includes(queryLower)
        ) {
          searchResults.push({
            id: activite.id,
            title: activite.nom,
            type: "activite",
            description: activite.description || "",
            url: `/activites/${activite.id}`,
          });
        }
      });
    } catch (error) {
      console.error("Error fetching activities:", error);
    }

    setResults(searchResults);
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      setIsOpen(true);
      performSearch(value);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch(query);
    }
  };

  const handleSearchClick = () => {
    performSearch(query);
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "destination":
        return <MapPin className="h-4 w-4" />;
      case "hebergement":
        return <Home className="h-4 w-4" />;
      case "activite":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "destination":
        return "Destination";
      case "hebergement":
        return "Hébergement";
      case "activite":
        return "Activité";
      default:
        return "";
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Input
          type="text"
          placeholder="Rechercher une destination, hébergement ou activité..."
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="pr-20 h-11 text-sm"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setResults([]);
                setIsOpen(false);
              }}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSearchClick}
            className="h-8 w-8 p-0"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Recherche en cours...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <a
                  key={`${result.type}-${result.id}`}
                  href={result.url}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
                    "border-b border-border/50 last:border-b-0"
                  )}
                >
                  <div className="mt-0.5 text-muted-foreground">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {result.title}
                      </span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {result.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucun résultat trouvé pour "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
