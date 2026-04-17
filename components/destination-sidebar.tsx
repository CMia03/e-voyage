"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { useAuth } from "@/hooks/useAuth";
import { getDestinationNotations } from "@/lib/api/notations";
import { NotationData } from "@/lib/type/notation";
import { addCommentaire, getDestinationPublicCommentaires } from "@/lib/api/commentaires";
import { CommentaireData } from "@/lib/type/commentaire";
import { createNotification } from "@/lib/api/notifications";
import { MessageCircle, Star, User, Calendar } from "lucide-react";
import { Comment, DestinationSidebarProps } from "@/lib/type/commentaire";


export function DestinationSidebar({ destinationId, destinationName, averageRating }: DestinationSidebarProps) {
  const { session, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [notations, setNotations] = useState<NotationData[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les notations et commentaires
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger les notations
        const notationsResponse = await getDestinationNotations(destinationId);
        if (notationsResponse.success && notationsResponse.data) {
          setNotations(notationsResponse.data);
        }
        
        // Charger les commentaires publics
        const commentairesResponse = await getDestinationPublicCommentaires(destinationId);
        if (commentairesResponse.success && commentairesResponse.data) {
          // Transformer les commentaires en format Comment (uniquement les approuvés)
          const transformedComments: Comment[] = commentairesResponse.data
            .filter((commentaire: CommentaireData) => commentaire.status === true)
            .map((commentaire: CommentaireData) => ({
              id: commentaire.idUser + commentaire.dateCreation, // ID unique
              user: commentaire.nomUser || 'Utilisateur',
              content: commentaire.contenu,
              date: new Date(commentaire.dateCreation).toLocaleDateString('fr-FR'),
              userId: commentaire.idUser
            }));
          
          // Ajouter les notations transformées en commentaires
          const notationComments: Comment[] = notationsResponse.data
            ?.filter(notation => notation.status === "APPROVED")
            ?.map(notation => ({
              id: notation.idAvis,
              user: notation.nomUser,
              content: `A noté cette destination ${notation.nombreEtoiles} étoiles`,
              date: new Date(notation.dateCreation).toLocaleDateString('fr-FR'),
              rating: notation.nombreEtoiles
            })) || [];
          
          // Combiner commentaires et notations, trier par date
          const allComments = [...transformedComments, ...notationComments].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          setComments(allComments);
        }
      } catch (error) {
        console.error('Error loading comments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [destinationId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !isAuthenticated) return;

    setIsSubmittingComment(true);
    try {
      const userId = session?.userId || session?.login || "";
      const nomUser = session?.nom || session?.login || "Anonyme";
      const token = session?.accessToken;
      
      const response = await addCommentaire(destinationId, userId, newComment, token, nomUser);
      
      if (response.success) {
        setNewComment("");
        
        // Créer une notification pour l'admin
        try {
          await createNotification(
            "commentaire",
            "Nouveau commentaire",
            `${nomUser} a commenté la destination "${destinationName}"`,
            "/admin?section=commentaires",
            destinationId,
            session?.accessToken
          );
        } catch (notifError) {
          console.error("Erreur lors de la création de la notification:", notifError);
        }
        
        alert("Votre commentaire a été soumis et est en attente de validation par l'administrateur.");
      } else {
        console.error('Error adding comment:', response.message);
        alert("Erreur lors de l'ajout du commentaire. Veuillez réessayer.");
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const calculateAverageRating = () => {
    if (notations.length === 0) return averageRating;
    const sum = notations.reduce((acc, notation) => acc + notation.nombreEtoiles, 0);
    return sum / notations.length;
  };

  return (
    <div className="w-full lg:w-80 space-y-6">
      <Card className="sticky top-6">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Notation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-center p-1 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary mb-0">
              {calculateAverageRating().toFixed(1)}/5
            </div>
            <div className="flex justify-center mb-0">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < calculateAverageRating()
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-300 text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {notations.length} avis
            </p>
          </div>

          {/* Interface de notation */}
          <div className="border-t pt-1">
            <p className="text-sm font-medium mb-0">Votre avis :</p>
            <StarRating
              rating={0}
              destinationId={destinationId}
              destinationName={destinationName}
              isAuthenticated={isAuthenticated}
              size="lg"
              className="justify-center"
            />
            {!isAuthenticated && (
              <p className="text-xs text-muted-foreground mt-0 text-center">
                Connectez-vous pour noter
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Commentaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Commentaires ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulaire d'ajout de commentaire */}
          {isAuthenticated && (
            <div className="space-y-3">
              <Textarea
                placeholder="Partagez votre expérience..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmittingComment}
                className="w-full"
                size="sm"
              >
                {isSubmittingComment ? "Envoi..." : "Publier"}
              </Button>
            </div>
          )}

          {!isAuthenticated && (
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Connectez-vous pour laisser un commentaire
              </p>
            </div>
          )}

          {/* Liste des commentaires */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-pulse">Chargement...</div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Soyez le premier à commenter !</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-b pb-3 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">{comment.user}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {comment.date}
                        </div>
                      </div>
                      {comment.rating && (
                        <div className="flex gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < (comment.rating || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-gray-300 text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground break-words">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
