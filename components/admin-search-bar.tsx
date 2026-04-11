"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, MapPin, Home, Calendar, Users, Settings } from "lucide-react";
import { listAdminDestinations } from "@/lib/api/destinations";
import { listHebergements } from "@/lib/api/hebergements";
import { listActivites } from "@/lib/api/activites";
import { listUsers } from "@/lib/api/users";
import { loadAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  type: "destination" | "hebergement" | "activite" | "user";
  description: string;
  url: string;
  metadata?: {
    role?: string;
    status?: string;
    price?: string;
  };
}

export function AdminSearchBar() {
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
    
    // Get auth token
    const auth = loadAuth();
    const token = auth?.accessToken;

    // Search destinations from database
    try {
      const response = await listAdminDestinations(token);
      const destinations = response.data || [];
      destinations.forEach((dest: any) => {
        if (
          dest.nom.toLowerCase().includes(queryLower) ||
          dest.description?.toLowerCase().includes(queryLower) ||
          dest.slug?.toLowerCase().includes(queryLower)
        ) {
          searchResults.push({
            id: dest.id,
            title: dest.nom,
            type: "destination",
            description: dest.description || "",
            url: `/admin/destination/${dest.id}`,
            metadata: {
              status: dest.estActif ? "Actif" : "Inactif",
            },
          });
        }
      });
    } catch (error) {
      console.error("Error fetching destinations:", error);
    }

    // Search accommodations from database
    try {
      const response = await listHebergements(token);
      const hebergements = response.data || [];
      hebergements.forEach((heberg: any) => {
        if (
          heberg.nom.toLowerCase().includes(queryLower) ||
          heberg.description?.toLowerCase().includes(queryLower) ||
          heberg.slug?.toLowerCase().includes(queryLower)
        ) {
          searchResults.push({
            id: heberg.id,
            title: heberg.nom,
            type: "hebergement",
            description: heberg.description || "",
            url: `/admin/hebergements/${heberg.id}`,
            metadata: {
              status: heberg.estActif ? "Actif" : "Inactif",
            },
          });
        }
      });
    } catch (error) {
      console.error("Error fetching accommodations:", error);
    }

    // Search activities from database
    try {
      const response = await listActivites(token);
      const activites = response.data || [];
      activites.forEach((activite: any) => {
        if (
          activite.nom.toLowerCase().includes(queryLower) ||
          activite.description?.toLowerCase().includes(queryLower) ||
          activite.slug?.toLowerCase().includes(queryLower)
        ) {
          searchResults.push({
            id: activite.id,
            title: activite.nom,
            type: "activite",
            description: activite.description || "",
            url: `/admin/activites/${activite.id}`,
            metadata: {
              status: activite.estActif ? "Actif" : "Inactif",
            },
          });
        }
      });
    } catch (error) {
      console.error("Error fetching activities:", error);
    }

    // Search users from database (admin specific)
    if (token) {
      try {
        const response = await listUsers(token);
        const users = response.data || [];
        users.forEach((user: any) => {
          if (
            user.nom?.toLowerCase().includes(queryLower) ||
            user.prenom?.toLowerCase().includes(queryLower) ||
            user.email?.toLowerCase().includes(queryLower)
          ) {
            searchResults.push({
              id: user.id,
              title: `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email,
              type: "user",
              description: user.email || "",
              url: `/admin/users`,
              metadata: {
                role: user.role,
                status: user.estActif ? "Actif" : "Inactif",
              },
            });
          }
        });
      } catch (error) {
        console.error("Error fetching users:", error);
      }
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
      case "user":
        return <Users className="h-4 w-4" />;
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
      case "user":
        return "Utilisateur";
      default:
        return "";
    }
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "destination":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "hebergement":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "activite":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "user":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Input
          type="text"
          placeholder="Rechercher destinations, hébergements, activités, utilisateurs..."
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="pr-20 h-10 text-sm"
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
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSearchClick}
            className="h-7 w-7 p-0"
          >
            <Search className="h-3 w-3" />
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
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", getTypeColor(result.type))}>
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                      {result.description}
                    </p>
                    {result.metadata && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {result.metadata.role && (
                          <span className="bg-muted/50 px-1.5 py-0.5 rounded">
                            {result.metadata.role}
                          </span>
                        )}
                        {result.metadata.status && (
                          <span className={cn(
                            "px-1.5 py-0.5 rounded",
                            result.metadata.status === "Actif" 
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {result.metadata.status}
                          </span>
                        )}
                      </div>
                    )}
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
