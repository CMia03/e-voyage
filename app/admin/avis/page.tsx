"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, MessageSquare, Search, Star, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBreadcrumbs } from "../contexts/breadcrumbs-context";
import { getAllNotationsFromApi, deleteUserRating } from "@/lib/api/notations";
import { NotationData } from "@/lib/type/notation";
import { useAuth } from "@/hooks/useAuth";

export function AdminAvis() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { session } = useAuth();
  const [avis, setAvis] = useState<NotationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const fetchNotations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllNotationsFromApi();
      if (response.success && response.data) {
        setAvis(response.data);
      }
    } catch (error) {
      console.error("Error fetching notations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Avis", isActive: true },
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    fetchNotations();
  }, [fetchNotations]);

  const handleDeleteAvis = async (avi: NotationData) => {
    if (!session?.accessToken) {
      setFeedback({ type: "error", message: "Vous devez etre authentifie pour supprimer un avis." });
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'avis de ${avi.nomUser} pour ${avi.nomDestination} ?`)) {
      return;
    }

    try {
      setDeletingId(avi.idAvis);
      await deleteUserRating(avi.idDestination, avi.idUser, session.accessToken);
      setFeedback({ type: "success", message: "Avis supprime avec succes." });
      fetchNotations();
    } catch (error) {
      console.error("Error deleting avis:", error);
      setFeedback({ type: "error", message: "Erreur lors de la suppression de l'avis." });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const destinationOptions = useMemo(() => {
    const destinations = new Map<string, string>();

    avis.forEach((avi) => {
      if (avi.idDestination) {
        destinations.set(avi.idDestination, avi.nomDestination || avi.idDestination);
      }
    });

    return Array.from(destinations.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [avis]);

  const destinationFilteredAvis = useMemo(() => {
    if (selectedDestination === "all") {
      return avis;
    }

    return avis.filter((avi) => avi.idDestination === selectedDestination);
  }, [avis, selectedDestination]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredAvis = useMemo(() => {
    return destinationFilteredAvis.filter((avi) => {
      const searchableText = [
        avi.nomUser,
        avi.nomDestination,
        `${avi.nombreEtoiles}/5`,
        avi.status ? "visible actif valide" : "masque inactif",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [destinationFilteredAvis, normalizedSearch]);

  const stats = useMemo(() => {
    const total = filteredAvis.length;
    const visible = filteredAvis.filter((avi) => avi.status === true).length;
    const average = total > 0
      ? filteredAvis.reduce((sum, avi) => sum + (avi.nombreEtoiles || 0), 0) / total
      : 0;
    const distribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: filteredAvis.filter((avi) => avi.nombreEtoiles === rating).length,
    }));

    return { total, visible, average, distribution };
  }, [filteredAvis]);

  return (
    <div className="space-y-8">
      {feedback ? (
        <Alert variant={feedback.type === "success" ? "success" : "destructive"}>
          <AlertTitle>{feedback.type === "success" ? "Success" : "Erreur"}</AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Avis des clients
          </h1>
          <p className="text-sm text-muted-foreground">
            Consultez et modérez les notes laissées sur chaque destination.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg border bg-card p-2 text-center shadow-sm sm:min-w-[360px]">
          <div className="rounded-md bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">Avis</p>
            <p className="text-lg font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-md bg-amber-50 px-3 py-2 text-amber-800">
            <p className="text-xs">Moyenne</p>
            <p className="text-lg font-semibold">{stats.average.toFixed(1)}/5</p>
          </div>
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-800">
            <p className="text-xs">Visibles</p>
            <p className="text-lg font-semibold">{stats.visible}</p>
          </div>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle>Recherche</CardTitle>
          <CardDescription>Filtrez par destination, puis affinez avec la recherche.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client, une destination, une note..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedDestination} onValueChange={setSelectedDestination}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Toutes les destinations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les destinations</SelectItem>
                {destinationOptions.map((destination) => (
                  <SelectItem key={destination.id} value={destination.id}>
                    {destination.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {stats.distribution.map(({ rating, count }) => {
              const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;

              return (
                <div key={rating} className="grid grid-cols-[42px_1fr_36px] items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    {rating}
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <Card className="border-border/50">
            <CardContent className="py-8 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              <h3 className="text-lg font-medium text-foreground">
                Chargement des avis...
              </h3>
            </CardContent>
          </Card>
        ) : filteredAvis.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-10 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium text-foreground">
                {searchTerm || selectedDestination !== "all" ? "Aucun avis trouvé pour ce filtre" : "Aucun avis trouvé"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedDestination !== "all" ? "Essayez une autre recherche ou une autre destination." : "Vous n'avez aucun avis pour le moment."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAvis.map((avi) => (
            <Card key={avi.idAvis} className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <Avatar className="h-12 w-12 border bg-muted">
                    <AvatarFallback className="font-semibold">
                      {avi.nomUser
                        ?.split(" ")
                        .map((namePart: string) => namePart[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{avi.nomUser}</h3>
                          <Badge
                            variant={avi.status ? "default" : "secondary"}
                            className={
                              avi.status
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                            }
                          >
                            {avi.status ? "Visible" : "Masqué"}
                          </Badge>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">{avi.nomDestination}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {formatDate(avi.dateCreation)}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleDeleteAvis(avi)}
                        disabled={deletingId === avi.idAvis}
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-800"
                      >
                        {deletingId === avi.idAvis ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Supprimer
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 p-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            className={`h-5 w-5 ${
                              index < avi.nombreEtoiles
                                ? "fill-amber-400 text-amber-400"
                                : "fill-slate-200 text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold text-foreground">
                        {avi.nombreEtoiles}/5
                      </span>
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

export default AdminAvis;
