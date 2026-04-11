"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Reply, Trash2, Filter, Search, User, Calendar, MapPin, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBreadcrumbs } from "../contexts/breadcrumbs-context";

interface Avis {
  id: string;
  clientName: string;
  clientAvatar?: string;
  rating: number;
  comment: string;
  destination?: string;
  hebergement?: string;
  activite?: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  helpful: number;
  notHelpful: number;
  response?: string;
  responseDate?: string;
}

export function AdminAvis() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [avis, setAvis] = useState<Avis[]>([
    {
      id: "1",
      clientName: "Sophie Martin",
      rating: 5,
      comment: "Excellent séjour! L'hébergement était impeccable et le personnel très accueillant. Je recommande vivement cette destination.",
      destination: "Bora Bora",
      hebergement: "Villa Paradis",
      date: "2024-01-15T10:30:00",
      status: "approved",
      helpful: 12,
      notHelpful: 1,
      response: "Merci Sophie pour votre excellent avis! Nous sommes ravis que votre séjour ait été parfait.",
      responseDate: "2024-01-16T09:15:00"
    },
    {
      id: "2",
      clientName: "Pierre Dubois",
      rating: 4,
      comment: "Très bonne expérience globale. L'activité était bien organisée et le guide était très compétent. Petite déception sur le timing qui était un peu serré.",
      activite: "Tour en bateau",
      destination: "Moorea",
      date: "2024-01-14T16:45:00",
      status: "pending",
      helpful: 8,
      notHelpful: 2
    },
    {
      id: "3",
      clientName: "Marie Laurent",
      rating: 2,
      comment: "Hébergement ne correspondant pas aux photos. La propreté était moyenne et les équipements étaient vieillissants. Rapport qualité-prix décevant.",
      hebergement: "Appartement Vue Mer",
      destination: "Tahiti",
      date: "2024-01-13T14:20:00",
      status: "pending",
      helpful: 3,
      notHelpful: 15
    },
    {
      id: "4",
      clientName: "Jean Bernard",
      rating: 5,
      comment: "Service exceptionnel! Le personnel a été au-delà de nos attentes. L'activité était fantastique et bien organisée. À refaire sans hésiter!",
      activite: "Plongée sous-marine",
      destination: "Raiatea",
      date: "2024-01-12T11:30:00",
      status: "approved",
      helpful: 18,
      notHelpful: 0,
      response: "Merci Jean pour votre retour! Nous sommes heureux que votre expérience de plongée ait été mémorable.",
      responseDate: "2024-01-13T08:45:00"
    },
    {
      id: "5",
      clientName: "Isabelle Petit",
      rating: 3,
      comment: "Correct mais sans plus. L'emplacement est bien mais l'hébergement mériterait une rénovation. Le rapport qualité-prix est moyen.",
      hebergement: "Bungalow Beach",
      destination: "Huahine",
      date: "2024-01-11T09:20:00",
      status: "rejected",
      helpful: 5,
      notHelpful: 7
    }
  ]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Avis", isActive: true }
    ]);
  }, [setBreadcrumbs]);

  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [ratingFilter, setRatingFilter] = useState<"all" | "5" | "4" | "3" | "2" | "1">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAvis, setSelectedAvis] = useState<Avis | null>(null);
  const [responseText, setResponseText] = useState("");
  const [showResponseModal, setShowResponseModal] = useState(false);

  const filteredAvis = avis.filter(review => {
    const matchesFilter = 
      filter === "all" || 
      review.status === filter;
    
    const matchesRating = 
      ratingFilter === "all" || 
      review.rating.toString() === ratingFilter;
    
    const matchesSearch = 
      review.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.destination && review.destination.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (review.hebergement && review.hebergement.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (review.activite && review.activite.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesRating && matchesSearch;
  });

  const approveAvis = (id: string) => {
    setAvis(prev => 
      prev.map(review => 
        review.id === id ? { ...review, status: "approved" as const } : review
      )
    );
  };

  const rejectAvis = (id: string) => {
    setAvis(prev => 
      prev.map(review => 
        review.id === id ? { ...review, status: "rejected" as const } : review
      )
    );
  };

  const deleteAvis = (id: string) => {
    setAvis(prev => prev.filter(review => review.id !== id));
  };

  const submitResponse = () => {
    if (selectedAvis && responseText.trim()) {
      setAvis(prev => 
        prev.map(review => 
          review.id === selectedAvis.id 
            ? { 
                ...review, 
                response: responseText.trim(),
                responseDate: new Date().toISOString()
              } 
            : review
        )
      );
      setResponseText("");
      setShowResponseModal(false);
      setSelectedAvis(null);
    }
  };

  const pendingCount = avis.filter(a => a.status === "pending").length;
  const approvedCount = avis.filter(a => a.status === "approved").length;
  const rejectedCount = avis.filter(a => a.status === "rejected").length;
  const averageRating = (avis.reduce((sum, a) => sum + a.rating, 0) / avis.length).toFixed(1);

  const renderStars = (rating: number, size: "sm" | "md" = "md") => {
    const starSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Avis des clients
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez et modérez tous les avis laissés par vos clients.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {avis.length} avis total
            </Badge>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              {averageRating} / 5
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{avis.length}</p>
                <p className="text-xs text-muted-foreground">Total avis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{averageRating}</p>
                <p className="text-xs text-muted-foreground">Note moyenne</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 flex items-center justify-center text-xs font-medium">
                !
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center justify-center text-xs">
                <Check className="h-3 w-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Approuvés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Filtrer les avis selon différents critères</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les avis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={filter} onValueChange={(value: "all" | "pending" | "approved" | "rejected") => setFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvés</SelectItem>
                  <SelectItem value="rejected">Rejetés</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note</label>
              <Select value={ratingFilter} onValueChange={(value: "all" | "5" | "4" | "3" | "2" | "1") => setRatingFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les notes</SelectItem>
                  <SelectItem value="5">5 étoiles</SelectItem>
                  <SelectItem value="4">4 étoiles</SelectItem>
                  <SelectItem value="3">3 étoiles</SelectItem>
                  <SelectItem value="2">2 étoiles</SelectItem>
                  <SelectItem value="1">1 étoile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredAvis.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Aucun avis trouvé
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || filter !== "all" || ratingFilter !== "all"
                  ? "Aucun avis ne correspond à vos critères de recherche."
                  : "Vous n'avez aucun avis pour le moment."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAvis.map((review) => (
            <Card key={review.id} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      {review.clientAvatar && <AvatarImage src={review.clientAvatar} />}
                      <AvatarFallback>
                        {review.clientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-foreground">{review.clientName}</h3>
                        <Badge variant="outline" className={getStatusColor(review.status)}>
                          {review.status === "approved" ? "Approuvé" : 
                           review.status === "rejected" ? "Rejeté" : "En attente"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-3">
                        {renderStars(review.rating)}
                        <span className="text-sm text-muted-foreground">
                          {formatDate(review.date)}
                        </span>
                      </div>

                      <p className="text-sm text-foreground mb-3">
                        {review.comment}
                      </p>

                      <div className="flex items-center gap-4 mb-3">
                        {review.destination && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {review.destination}
                          </div>
                        )}
                        {review.hebergement && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>·</span>
                            {review.hebergement}
                          </div>
                        )}
                        {review.activite && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>·</span>
                            {review.activite}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {review.helpful} utile{review.helpful > 1 ? "s" : ""}
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsDown className="h-3 w-3" />
                          {review.notHelpful} inutile{review.notHelpful > 1 ? "s" : ""}
                        </div>
                      </div>

                      {review.response && (
                        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-medium">
                              R
                            </div>
                            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                              Réponse de l équipe
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {review.responseDate && formatDate(review.responseDate)}
                            </span>
                          </div>
                          <p className="text-sm text-emerald-800 dark:text-emerald-200">
                            {review.response}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {review.status === "pending" && (
                      <>
                        <Button
                          onClick={() => approveAvis(review.id)}
                          variant="outline"
                          size="sm"
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approuver
                        </Button>
                        <Button
                          onClick={() => rejectAvis(review.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rejeter
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => {
                        setSelectedAvis(review);
                        setResponseText(review.response || "");
                        setShowResponseModal(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Répondre
                    </Button>
                    <Button
                      onClick={() => deleteAvis(review.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de réponse */}
      {showResponseModal && selectedAvis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Répondre à l avis</CardTitle>
              <CardDescription>
                Répondez à l avis de {selectedAvis.clientName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {selectedAvis.clientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{selectedAvis.clientName}</p>
                    {renderStars(selectedAvis.rating, "sm")}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{selectedAvis.comment}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Votre réponse</label>
                <Textarea
                  placeholder="Rédigez votre réponse..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
            <div className="flex justify-end gap-3 p-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedAvis(null);
                  setResponseText("");
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={submitResponse}
                disabled={!responseText.trim()}
              >
                Envoyer la réponse
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdminAvis;
