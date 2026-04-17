"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Search, Calendar, MapPin, Star, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBreadcrumbs } from "../contexts/breadcrumbs-context";
import { getAllNotationsFromApi, deleteUserRating, NotationData } from "@/lib/api/notations";
import { useAuth } from "@/hooks/useAuth";

export function AdminAvis() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { session } = useAuth();
  const [avis, setAvis] = useState<NotationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState("all"); // Destination par défaut, 'all' pour afficher tous les avis
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchNotations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllNotationsFromApi();
      if (response.success) {
        // Filtrer les avis par destination sélectionnée
        const filteredAvis = selectedDestination === "all" 
          ? response.data 
          : response.data.filter(avi => avi.idDestination === selectedDestination);
        setAvis(filteredAvis);
      }
    } catch (error) {
      console.error('Error fetching notations:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDestination]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Avis", isActive: true }
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    fetchNotations();
  }, [selectedDestination, fetchNotations]);

  const [searchTerm, setSearchTerm] = useState("");

  const handleDeleteAvis = async (avi: NotationData) => {
    if (!session?.accessToken) {
      alert("Vous devez être authentifié pour supprimer un avis");
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'avis de ${avi.nomUser} pour ${avi.nomDestination} ?`)) {
      return;
    }

    try {
      setDeletingId(avi.idAvis);
      await deleteUserRating(avi.idDestination, avi.idUser, session.accessToken);
      // Rafraîchir la liste des avis
      fetchNotations();
    } catch (error) {
      console.error('Error deleting avis:', error);
      alert("Erreur lors de la suppression de l'avis");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const filteredAvis = avis.filter((avi) =>
    avi.nomUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
    avi.nomDestination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Avis des clients
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez et modérez les avis pour la destination sélectionnée.
          </p>
        </div>
      </div>

    

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Recherche</CardTitle>
          <CardDescription>Rechercher dans les avis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les avis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <Card className="border-border/50">
            <CardContent className="py-2 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Chargement des avis...
              </h3>
            </CardContent>
          </Card>
        ) : filteredAvis.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-2 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? "Aucun avis trouvé pour cette recherche" : "Aucun avis trouvé"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Essayez une autre recherche." : "Vous n'avez aucun avis pour le moment."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAvis.map((avi) => (
            <Card key={avi.idAvis} className="border-border/50">
              <CardContent className="px-6 py-0.5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {avi.nomUser?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground">{avi.nomUser}</h3>
                      <button
                        onClick={() => handleDeleteAvis(avi)}
                        disabled={deletingId === avi.idAvis}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === avi.idAvis ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < avi.nombreEtoiles
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-300 text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium text-foreground">
                          {avi.nombreEtoiles}/5
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{avi.nomDestination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(avi.dateCreation)}</span>
                    </div>
                    {avi.status && (
                      <div className="mt-2">
                        <Badge variant={avi.status === 'actif' ? 'default' : 'secondary'}>
                          {avi.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminAvis;
