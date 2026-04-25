"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, MessageCircle, Check, Trash2, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getAllCommentairesAdmin, validateCommentaire, deleteCommentaire } from "@/lib/api/commentaires";
import { useRouter } from "next/navigation";
import { CommentaireData } from "@/lib/type/commentaire";

export function AdminNotifications() {
  const { session } = useAuth();
  const router = useRouter();
  const [commentaires, setCommentaires] = useState<CommentaireData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Charger les commentaires en attente
  const loadCommentaires = async () => {
    if (!session?.accessToken) return;

    try {
      setIsLoading(true);
      const response = await getAllCommentairesAdmin(session.accessToken);
      
      if (response.success) {
        // Filtrer uniquement les commentaires en attente (status = false)
        const commentairesEnAttente = response.data?.filter(c => c.status === false) || [];
        setCommentaires(commentairesEnAttente);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des commentaires:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommentaires();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadCommentaires, 30000);
    return () => clearInterval(interval);
  }, [session?.accessToken]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Approuver un commentaire
  const handleApprouver = async (commentaire: CommentaireData) => {
    if (!session?.accessToken) return;

    try {
      await validateCommentaire(commentaire.idDestination, commentaire.idUser, session.accessToken);
      setCommentaires(prev => prev.filter(c => !(c.idDestination === commentaire.idDestination && c.idUser === commentaire.idUser)));
    } catch (error) {
      console.error("Erreur lors de l'approbation du commentaire:", error);
    }
  };

  // Supprimer un commentaire
  const handleSupprimer = async (commentaire: CommentaireData) => {
    if (!session?.accessToken) return;

    try {
      await deleteCommentaire(commentaire.idDestination, commentaire.idUser, session.accessToken);
      setCommentaires(prev => prev.filter(c => !(c.idDestination === commentaire.idDestination && c.idUser === commentaire.idUser)));
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire:", error);
    }
  };

  // Voir la destination
  const handleVoirDestination = (destinationId: string) => {
    router.push(`/destinations/${destinationId}`);
    setIsOpen(false);
  };

  // Formater la date
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return date.toLocaleDateString('fr-FR');
  };

  const commentairesCount = commentaires.length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {commentairesCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {commentairesCount > 99 ? "99+" : commentairesCount}
          </Badge>
        )}
        <span className="sr-only">Commentaires en attente</span>
      </Button>

      {isOpen && (
        <Card 
          ref={notificationRef}
          className="absolute right-0 top-12 w-96 max-h-96 z-50 shadow-lg"
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-lg">Commentaires en attente</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Chargement...
                </div>
              ) : commentaires.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Aucun commentaire en attente
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {commentaires.map((commentaire, index) => (
                    <div
                      key={`${commentaire.idDestination}-${commentaire.idUser}-${index}`}
                      className="p-4 border-b last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <MessageCircle className="h-4 w-4 text-blue-500" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {commentaire.nomUser || `Utilisateur ${commentaire.idUser}`}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              En attente
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                            {commentaire.contenu}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(commentaire.dateCreation)}
                            </p>
                            
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVoirDestination(commentaire.idDestination)}
                                className="h-6 px-2 text-xs"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Voir
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprouver(commentaire)}
                                className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Approuver
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSupprimer(commentaire)}
                                className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
      )}
    </div>
  );
}
