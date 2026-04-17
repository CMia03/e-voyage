"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Star, MapPin, Calendar } from "lucide-react";
import { getPublicCommentaires, CommentaireData } from "@/lib/api/commentaires";
import { listDestinations } from "@/lib/api/destinations";

interface CommentaireWithDestination extends CommentaireData {
  destinationName?: string;
}

export function HomeCommentaires() {
  const [commentaires, setCommentaires] = useState<CommentaireWithDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState<Array<{ id: string; nom: string }>>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger les destinations pour avoir les noms
        const destinationsData = await listDestinations();
        setDestinations(destinationsData.map(dest => ({ id: dest.id, nom: dest.nom })));
        
        // Charger les commentaires publics
        const response = await getPublicCommentaires();
        if (response.success && response.data) {
          // Filtrer uniquement les commentaires validés (status = true)
          const commentairesValidés = response.data.filter(commentaire => commentaire.status === true);
          
          // Ajouter les noms de destinations aux commentaires
          const commentairesWithDestinations = commentairesValidés.map(commentaire => ({
            ...commentaire,
            destinationName: destinationsData.find(dest => dest.id === commentaire.idDestination)?.nom || `Destination ${commentaire.idDestination}`
          }));
          
          // Trier par date du plus récent au plus ancien
          setCommentaires(commentairesWithDestinations.sort((a, b) => 
            new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
          ));
        }
      } catch (error) {
        console.error('Error loading commentaires:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <section className="py-16 sm:py-24 bg-gradient-to-b from-background via-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl mb-12 sm:mb-16 text-center">
            <h2 className="mb-6 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Témoignages Clients
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground px-4 leading-relaxed">
              Découvrez ce que nos clients pensent de leurs voyages
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (commentaires.length === 0) {
    return (
      <section className="py-16 sm:py-24 bg-gradient-to-b from-background via-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl mb-12 sm:mb-16 text-center">
            <h2 className="mb-6 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Témoignages Clients
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground px-4 leading-relaxed">
              Découvrez ce que nos clients pensent de leurs voyages
            </p>
          </div>
          <div className="text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun témoignage pour le moment</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.03),transparent_50%)]" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto max-w-4xl mb-12 sm:mb-16 text-center">
          <h2 className="mb-6 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Témoignages Clients
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground px-4 leading-relaxed">
            Découvrez ce que nos clients pensent de leurs voyages
          </p>
        </div>
        
        <div className="grid gap-6 sm:gap-8 md:gap-10 lg:grid-cols-2 xl:grid-cols-3 max-w-7xl mx-auto">
          {commentaires.slice(0, 6).map((commentaire) => (
            <Card key={`${commentaire.idUser}-${commentaire.idDestination}`} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-emerald-100 text-emerald-600">
                      {(commentaire.nomUser || commentaire.idUser).split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {commentaire.nomUser || 'Client'}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{commentaire.destinationName}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-muted/50 rounded-lg p-4 mb-3">
                  <p className="text-sm text-foreground leading-relaxed">
                    "{commentaire.contenu}"
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(commentaire.dateCreation)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {commentaires.length > 6 && (
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              {commentaires.length - 6} autres témoignages disponibles
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
