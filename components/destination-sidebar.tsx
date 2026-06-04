"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { getDestinationNotations } from "@/lib/api/notations";
import { NotationData } from "@/lib/type/notation";
import { addCommentaire, getDestinationPublicCommentaires } from "@/lib/api/commentaires";
import { CommentaireData } from "@/lib/type/commentaire";
import { MessageCircle, Star, User, Calendar } from "lucide-react";
import { Comment, DestinationSidebarProps } from "@/lib/type/commentaire";


export function DestinationSidebar({ destinationId, destinationName, averageRating }: DestinationSidebarProps) {
  const { session, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [notations, setNotations] = useState<NotationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!feedback) return;

    const timeout = window.setTimeout(() => {
      setFeedback(null);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const ratingStats = useMemo(() => {
    const approvedNotations = notations.filter((notation) => notation.status === true);
    const total = approvedNotations.length;
    const distribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: approvedNotations.filter((notation) => notation.nombreEtoiles === rating).length,
    }));
    const average =
      total > 0
        ? approvedNotations.reduce((sum, notation) => sum + notation.nombreEtoiles, 0) / total
        : averageRating;
    const maxCount = Math.max(...distribution.map((item) => item.count), 1);

    return { average, total, distribution, maxCount };
  }, [averageRating, notations]);

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
          
          const allComments = transformedComments.sort((a, b) => 
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
        setFeedback({
          type: "success",
          message: "Votre commentaire a ete soumis et attend la validation de l'administrateur.",
        });
      } else {
        console.error('Error adding comment:', response.message);
        setFeedback({
          type: "error",
          message: "Erreur lors de l'ajout du commentaire. Veuillez reessayer.",
        });
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      setFeedback({
        type: "error",
        message: "Erreur lors de l'ajout du commentaire. Veuillez reessayer.",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="w-full lg:w-80 space-y-6">
      {feedback ? (
        <Alert variant={feedback.type === "success" ? "success" : "destructive"}>
          <AlertTitle>{feedback.type === "success" ? "Success" : "Erreur"}</AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      ) : null}
      <Card className="top-6">
        <CardHeader className="pb-3">
          <CardTitle>Evaluations et avis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-end gap-3">
              <p className="text-5xl font-semibold leading-none tracking-tight text-slate-900">
                {ratingStats.average.toFixed(1)}
              </p>
              <div className="pb-1">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(ratingStats.average)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-200 text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {ratingStats.total} avis client{ratingStats.total > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {ratingStats.distribution.map((item) => (
                <div key={item.rating} className="grid grid-cols-[28px_1fr_34px] items-center gap-2">
                  <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                    {item.rating}
                    <Star className="h-3 w-3 fill-slate-400 text-slate-400" />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${(item.count / ratingStats.maxCount) * 100}%` }}
                    />
                  </div>
                  <p className="text-right text-xs text-slate-500">{item.count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="mb-2 text-sm font-medium text-slate-900">Noter cette destination</p>
            <StarRating
              rating={0}
              destinationId={destinationId}
              destinationName={destinationName}
              isAuthenticated={isAuthenticated}
              size="lg"
              className="justify-center"
            />
            {!isAuthenticated ? (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Connectez-vous pour ajouter votre evaluation.
              </p>
            ) : (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {/* Votre note est affichee directement dans la moyenne. */}
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
                className="w-full border-transparent bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
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
