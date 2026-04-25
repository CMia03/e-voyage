"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, MapPin, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { getPublicCommentaires } from "@/lib/api/commentaires";
import { CommentaireData } from "@/lib/type/commentaire";
import { listDestinations } from "@/lib/api/destinations";

interface CommentaireWithDestination extends CommentaireData {
  nomDestination?: string;
}

export function HomeCommentaires() {
  const [commentaires, setCommentaires] = useState<CommentaireWithDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState<Array<{ id: string; nom: string }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const COMMENTS_PER_SLIDE = 3;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const destinationsData = await listDestinations();
        setDestinations(destinationsData.map(dest => ({ id: dest.id, nom: dest.title })));
        
        const response = await getPublicCommentaires();
        
        if (response.success && response.data) {
          
          const commentairesValidés = response.data.filter(commentaire => commentaire.status === true);
          
          const commentairesWithDestinations = commentairesValidés.map(commentaire => ({
            ...commentaire,
            destinationName: destinationsData.find(dest => dest.id === commentaire.idDestination)?.title || `Destination ${commentaire.idDestination}`
          }));
          
          setCommentaires(commentairesWithDestinations.sort((a, b) => 
            new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
          ));
        } else {
          console.log("Pas de commentaires ou erreur de chargement");
        }
      } catch (error) {
        console.error('Error loading commentaires:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (commentaires.length <= 1 || isPaused) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % commentaires.length);
    }, 4000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [commentaires.length, isPaused]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? commentaires.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % commentaires.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

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
        
        <div className="relative max-w-5xl mx-auto">
          {commentaires.length > COMMENTS_PER_SLIDE && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute -left-16 top-1/2 -translate-y-1/2 z-20 bg-background/90 backdrop-blur-sm border border-border/50 rounded-full p-3 hover:bg-background hover:shadow-lg transition-all duration-200 group shadow-lg cursor-pointer"
                aria-label="Commentaire précédent"
              >
                <ChevronLeft className="h-5 w-5 text-foreground group-hover:text-emerald-600 transition-colors" />
              </button>
              <button
                onClick={goToNext}
                className="absolute -right-16 top-1/2 -translate-y-1/2 z-20 bg-background/90 backdrop-blur-sm border border-border/50 rounded-full p-3 hover:bg-background hover:shadow-lg transition-all duration-200 group shadow-lg cursor-pointer"
                aria-label="Commentaire suivant"
              >
                <ChevronRight className="h-5 w-5 text-foreground group-hover:text-emerald-600 transition-colors" />
              </button>
            </>
          )}
          
          <div 
            className="relative overflow-hidden rounded-2xl"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div 
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {commentaires.length > 0 ? Array.from({ length: commentaires.length }).map((_, slideIndex) => {
                // Créer une boucle infinie : chaque slide commence à une position différente
                const slideCommentaires = [];
                for (let i = 0; i < COMMENTS_PER_SLIDE; i++) {
                  const commentIndex = (slideIndex + i) % commentaires.length;
                  slideCommentaires.push(commentaires[commentIndex]);
                }
                
                return (
                <div
                  key={slideIndex}
                  className="w-full flex-shrink-0"
                >
                  <div className="grid gap-8 sm:gap-10 md:gap-8 grid-cols-1 lg:grid-cols-3 justify-items-center">
                    {slideCommentaires.map((commentaire, index) => (
                      <div key={`${commentaire.idUser}-${commentaire.idDestination}-${slideIndex}-${index}`} className="bg-gradient-to-br from-muted/30 to-background border-2 border-border/50 rounded-2xl p-6 sm:p-8 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 h-full flex flex-col min-h-[280px] w-full max-w-md">
                        <div className="flex flex-col gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-emerald-200">
                              <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 font-semibold text-sm">
                                {(commentaire.nomUser || commentaire.idUser).split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                                {commentaire.nomUser || 'Client'}
                              </h3>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{commentaire.nomDestination}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(commentaire.dateCreation)}</span>
                          </div>
                        </div>
                        
                        <div className="relative flex-1">
                            <div className="absolute -top-2 left-6 w-3 h-3 bg-gradient-to-br from-muted/50 to-muted/30 transform rotate-45 border-l-4 border-t-4 border-border"></div>
                            <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-4 sm:p-6 border-4 border-border h-full">
                              <p className="text-sm sm:text-base text-foreground leading-relaxed italic">
                                {commentaire.contenu}
                              </p>
                            </div>
                          </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
              }) : (
                <div className="w-full flex-shrink-0 text-center">
                  <div className="relative">
                    <div className="bg-gradient-to-br from-muted/30 to-background border-2 border-border/50 rounded-2xl p-8 sm:p-12">
                      <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
                      <p className="text-lg sm:text-xl text-foreground leading-relaxed mb-4">
                        Soyez le premier à partager votre expérience !
                      </p>
                      <p className="text-base text-muted-foreground">
                        Les témoignages de nos clients apparaîtront ici une fois validés.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {commentaires.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: commentaires.length }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? "w-8 bg-emerald-500" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Aller au slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
