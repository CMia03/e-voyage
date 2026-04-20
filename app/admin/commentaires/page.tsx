"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Search, Calendar, Trash2, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "../contexts/breadcrumbs-context";
import { getAllCommentairesAdmin, validateCommentaire, deleteCommentaire, CommentaireData } from "@/lib/api/commentaires";
import { useAuth } from "@/hooks/useAuth";

export function AdminCommentaires() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { session } = useAuth();
  const [commentaires, setCommentaires] = useState<CommentaireData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCommentaires = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllCommentairesAdmin(session?.accessToken);
      if (response.success && response.data) {
        setCommentaires(response.data);
      }
    } catch (error) {
      console.error('Error fetching commentaires:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Commentaires", isActive: true }
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    fetchCommentaires();
  }, [fetchCommentaires]);

  const handleValidateCommentaire = async (commentaire: CommentaireData) => {
    if (!session?.accessToken) {
      alert("Vous devez être authentifié pour valider un commentaire");
      return;
    }

    try {
      setActionLoading(`validate-${commentaire.idUser}-${commentaire.idDestination}`);
      await validateCommentaire(commentaire.idDestination, commentaire.idUser, session.accessToken);
      // Rafraîchir la liste des commentaires
      fetchCommentaires();
    } catch (error) {
      console.error('Error validating commentaire:', error);
      alert("Erreur lors de la validation du commentaire");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCommentaire = async (commentaire: CommentaireData) => {
    if (!session?.accessToken) {
      alert("Vous devez être authentifié pour supprimer un commentaire");
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le commentaire de ${commentaire.nomUser || commentaire.idUser} ?`)) {
      return;
    }

    try {
      setActionLoading(`delete-${commentaire.idUser}-${commentaire.idDestination}`);
      await deleteCommentaire(commentaire.idDestination, commentaire.idUser, session.accessToken);
      // Rafraîchir la liste des commentaires
      fetchCommentaires();
    } catch (error) {
      console.error('Error deleting commentaire:', error);
      alert("Erreur lors de la suppression du commentaire");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredCommentaires = commentaires.filter((commentaire) =>
    (commentaire.nomUser || commentaire.idUser).toLowerCase().includes(searchTerm.toLowerCase()) ||
    commentaire.contenu.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Commentaires des clients
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez et modérez les commentaires des utilisateurs.
          </p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Recherche</CardTitle>
          <CardDescription>Rechercher dans les commentaires</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les commentaires..."
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
            <CardContent className="py-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Chargement des commentaires...
              </h3>
            </CardContent>
          </Card>
        ) : filteredCommentaires.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-4 text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? "Aucun commentaire trouvé pour cette recherche" : "Aucun commentaire trouvé"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Essayez une autre recherche." : "Vous n'avez aucun commentaire pour le moment."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCommentaires.map((commentaire) => (
            <Card key={`${commentaire.idUser}-${commentaire.idDestination}`} className="border-border/50">
              <CardContent className="px-6 py-2">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {(commentaire.nomUser || commentaire.idUser).split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground">{commentaire.nomUser || commentaire.idUser}</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleValidateCommentaire(commentaire)}
                          disabled={actionLoading === `validate-${commentaire.idUser}-${commentaire.idDestination}`}
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-800 hover:bg-green-50"
                        >
                          {actionLoading === `validate-${commentaire.idUser}-${commentaire.idDestination}` ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          onClick={() => handleDeleteCommentaire(commentaire)}
                          disabled={actionLoading === `delete-${commentaire.idUser}-${commentaire.idDestination}`}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          {actionLoading === `delete-${commentaire.idUser}-${commentaire.idDestination}` ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-foreground">{commentaire.contenu}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={commentaire.status === true ? "default" : "secondary"}>
                        {commentaire.status === true ? "Validé" : "En attente"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(commentaire.dateCreation)}</span>
                    </div>
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

export default AdminCommentaires;
