"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MessageCircle,
  Plane,
  Star,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getPublicCommentaires } from "@/lib/api/commentaires";
import { listDestinations } from "@/lib/api/destinations";
import { getAllNotationsFromApi } from "@/lib/api/notations";
import { CommentaireData } from "@/lib/type/commentaire";

interface CommentaireWithDestination extends CommentaireData {
  destinationImage?: string;
  destinationName?: string;
  rating?: number;
}

const COMMENTS_PER_SLIDE = 3;
const FALLBACK_DESTINATION_IMAGE = "/images/Manbt1.jpg";

export function HomeCommentaires() {
  const [commentaires, setCommentaires] = useState<CommentaireWithDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const commentSlides = useMemo(() => {
    const slides: CommentaireWithDestination[][] = [];
    for (let index = 0; index < commentaires.length; index += COMMENTS_PER_SLIDE) {
      slides.push(commentaires.slice(index, index + COMMENTS_PER_SLIDE));
    }
    return slides;
  }, [commentaires]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [destinationsData, commentairesResponse, notationsResponse] = await Promise.all([
          listDestinations(),
          getPublicCommentaires(),
          getAllNotationsFromApi(),
        ]);
        const destinationSummaries = destinationsData.map((destination) => ({
          id: destination.id,
          nom: destination.title,
          image: destination.image || destination.gallery?.[0] || FALLBACK_DESTINATION_IMAGE,
        }));
        const notationsValidees = notationsResponse.success
          ? notationsResponse.data.filter((notation) => notation.status === true)
          : [];

        if (commentairesResponse.success && commentairesResponse.data) {
          const commentairesValides = commentairesResponse.data.filter((commentaire) => commentaire.status === true);
          const commentairesWithDestinations = commentairesValides.map((commentaire) => {
            const destination = destinationSummaries.find((item) => item.id === commentaire.idDestination);
            const notation = notationsValidees.find(
              (item) =>
                item.idDestination === commentaire.idDestination &&
                item.idUser === commentaire.idUser
            );

            return {
              ...commentaire,
              nomDestination: commentaire.nomDestination || destination?.nom || "Destination",
              destinationName: destination?.nom,
              destinationImage: destination?.image || FALLBACK_DESTINATION_IMAGE,
              rating: notation?.nombreEtoiles ?? 0,
            };
          });

          setCommentaires(
            commentairesWithDestinations.sort(
              (a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
            )
          );
        }
      } catch (error) {
        console.error("Error loading commentaires:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  useEffect(() => {
    if (commentSlides.length <= 1 || isPaused) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % commentSlides.length);
    }, 4500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [commentSlides.length, isPaused]);

  useEffect(() => {
    if (currentIndex >= commentSlides.length) {
      setCurrentIndex(0);
    }
  }, [commentSlides.length, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? commentSlides.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % commentSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const renderHeader = () => (
    <div className="mx-auto mb-12 max-w-4xl text-center sm:mb-16">
      <h2 className="mb-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl md:text-5xl">
        Témoignages Clients
      </h2>
      <p className="px-4 text-lg leading-relaxed text-muted-foreground sm:text-xl">
        Découvrez ce que nos clients pensent de leurs voyages avec nous
      </p>
    </div>
  );

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background py-16 sm:py-24">
        <div className="container mx-auto px-4">
          {renderHeader()}
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background py-16 sm:py-24">
      <div className="absolute left-6 top-10 hidden text-8xl text-emerald-900/5 lg:block">✦</div>
      <Plane className="absolute right-24 top-12 hidden h-10 w-10 rotate-45 text-emerald-900/25 lg:block" />
      <div className="absolute right-28 top-24 hidden h-24 w-44 rounded-full border-t border-dashed border-emerald-900/20 lg:block" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.04),transparent_45%)]" />

      <div className="container relative z-10 mx-auto px-4">
        {renderHeader()}

        <div className="relative mx-auto max-w-7xl">
          {commentSlides.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goToPrevious}
                className="absolute -left-3 top-1/2 z-20 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/95 shadow-xl shadow-slate-900/10 transition hover:-translate-x-1 hover:text-emerald-700 md:flex xl:-left-16"
                aria-label="Commentaire précédent"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="absolute -right-3 top-1/2 z-20 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/95 shadow-xl shadow-slate-900/10 transition hover:translate-x-1 hover:text-emerald-700 md:flex xl:-right-16"
                aria-label="Commentaire suivant"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}

          <div
            className="overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {commentSlides.length > 0 ? (
                commentSlides.map((slideCommentaires, slideIndex) => {
                  return (
                    <div key={slideIndex} className="w-full flex-shrink-0">
                      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
                        {slideCommentaires.map((commentaire, index) => {
                          const clientName = commentaire.nomUser || "Client Cool Voyage";
                          const destinationName =
                            commentaire.nomDestination || commentaire.destinationName || "Destination";
                          const rating = Math.max(0, Math.min(5, Math.round(commentaire.rating ?? 0)));

                          return (
                            <article
                              key={`${commentaire.idUser}-${commentaire.idDestination}-${slideIndex}-${index}`}
                              className="flex min-h-[430px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-xl shadow-slate-900/8 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/10"
                            >
                              <div className="relative h-40 w-full overflow-hidden">
                                <Image
                                  src={commentaire.destinationImage || FALLBACK_DESTINATION_IMAGE}
                                  alt={destinationName}
                                  fill
                                  className="object-cover transition duration-500 hover:scale-105"
                                  sizes="(max-width: 1024px) 100vw, 33vw"
                                />
                              </div>

                              <div className="flex flex-1 flex-col p-6">
                                <div className="mb-5 flex items-start justify-between gap-4">
                                  <div className="flex min-w-0 items-center gap-4">
                                    <Avatar className="h-14 w-14 shrink-0 border border-emerald-100 bg-emerald-50">
                                      <AvatarFallback className="bg-emerald-50 text-xl font-bold text-emerald-700">
                                        {getInitials(clientName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <h3 className="truncate text-base font-bold text-slate-950">
                                          {clientName}
                                        </h3>
                                        <BadgeCheck className="h-4 w-4 shrink-0 fill-emerald-600 text-white" />
                                      </div>
                                      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{destinationName}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    className="flex shrink-0 items-center gap-0.5"
                                    aria-label={`Evaluation ${rating} sur 5`}
                                  >
                                    {Array.from({ length: 5 }).map((_, starIndex) => (
                                      <Star
                                        key={starIndex}
                                        className={`h-4 w-4 ${
                                          starIndex < rating
                                            ? "fill-amber-400 text-amber-400"
                                            : "fill-slate-200 text-slate-200"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>

                                <p className="line-clamp-5 flex-1 text-sm leading-7 text-slate-800 sm:text-base">
                                  {commentaire.contenu}
                                </p>

                                <div className="mt-6 flex items-center justify-between gap-4 border-t border-border/70 pt-5">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDate(commentaire.dateCreation)}</span>
                                  </div>
                                  <Link
                                    href={`/destinations/${commentaire.idDestination}`}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:gap-3 hover:text-emerald-800"
                                  >
                                    Voir plus
                                    <ArrowRight className="h-4 w-4" />
                                  </Link>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex-shrink-0 text-center">
                  <div className="rounded-2xl border border-border/60 bg-background p-8 shadow-xl shadow-slate-900/5 sm:p-12">
                    <MessageCircle className="mx-auto mb-6 h-16 w-16 text-muted-foreground" />
                    <p className="mb-4 text-lg leading-relaxed text-foreground sm:text-xl">
                      Soyez le premier à partager votre expérience !
                    </p>
                    <p className="text-base text-muted-foreground">
                      Les témoignages de nos clients apparaîtront ici une fois validés.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {commentSlides.length > 1 ? (
            <div className="mt-7 flex justify-center gap-3">
              {commentSlides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex ? "w-8 bg-emerald-700" : "w-2.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                  aria-label={`Aller au slide ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
