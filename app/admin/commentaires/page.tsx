"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Check, MapPin, MessageCircle, RotateCcw, Search, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBreadcrumbs } from "../contexts/breadcrumbs-context";
import { getAllCommentairesAdmin, validateCommentaire, deleteCommentaire, CommentaireData } from "@/lib/api/commentaires";
import { useAuth } from "@/hooks/useAuth";

export function AdminCommentaires() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { session } = useAuth();
  const [commentaires, setCommentaires] = useState<CommentaireData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCommentaires = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllCommentairesAdmin(session?.accessToken);
      if (response.success && response.data) {
        setCommentaires(response.data);
      }
    } catch (error) {
      console.error("Error fetching commentaires:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Commentaires", isActive: true },
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
      fetchCommentaires();
    } catch (error) {
      console.error("Error validating commentaire:", error);
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
      fetchCommentaires();
    } catch (error) {
      console.error("Error deleting commentaire:", error);
      alert("Erreur lors de la suppression du commentaire");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const destinationOptions = useMemo(() => {
    const destinations = new Map<string, string>();

    commentaires.forEach((commentaire) => {
      if (commentaire.idDestination) {
        destinations.set(commentaire.idDestination, commentaire.nomDestination || commentaire.idDestination);
      }
    });

    return Array.from(destinations.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [commentaires]);

  const pendingCount = commentaires.filter((commentaire) => commentaire.status !== true).length;
  const validatedCount = commentaires.filter((commentaire) => commentaire.status === true).length;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const hasActiveFilters =
    normalizedSearch.length > 0 ||
    selectedDestination !== "all" ||
    selectedStatus !== "all" ||
    dateFrom.length > 0 ||
    dateTo.length > 0;

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedDestination("all");
    setSelectedStatus("all");
    setDateFrom("");
    setDateTo("");
  };

  const filteredCommentaires = commentaires.filter((commentaire) => {
    const searchableText = [
      commentaire.nomUser || commentaire.idUser,
      commentaire.nomDestination || commentaire.idDestination,
      commentaire.contenu,
      commentaire.status === true ? "valide" : "en attente",
    ]
      .join(" ")
      .toLowerCase();

    const commentaireDate = new Date(commentaire.dateCreation);

    return (
      searchableText.includes(normalizedSearch) &&
      (selectedDestination === "all" || commentaire.idDestination === selectedDestination) &&
      (
        selectedStatus === "all" ||
        (selectedStatus === "validated" && commentaire.status === true) ||
        (selectedStatus === "pending" && commentaire.status !== true)
      ) &&
      (!dateFrom || commentaireDate >= new Date(`${dateFrom}T00:00:00`)) &&
      (!dateTo || commentaireDate <= new Date(`${dateTo}T23:59:59`))
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Commentaires des clients
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez et modérez les commentaires des utilisateurs avec leur destination.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg border bg-card p-2 text-center shadow-sm sm:min-w-[360px]">
          <div className="rounded-md bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{commentaires.length}</p>
          </div>
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-800">
            <p className="text-xs">Validés</p>
            <p className="text-lg font-semibold">{validatedCount}</p>
          </div>
          <div className="rounded-md bg-amber-50 px-3 py-2 text-amber-800">
            <p className="text-xs">En attente</p>
            <p className="text-lg font-semibold">{pendingCount}</p>
          </div>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle>Recherche</CardTitle>
          <CardDescription>Client, destination, contenu, statut ou période.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Client, destination, commentaire..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_180px_170px_170px_150px]">
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

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="validated">Validés</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              aria-label="Date de début"
              className="h-10"
            />

            <Input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              aria-label="Date de fin"
              className="h-10"
            />

            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="h-10 gap-2 md:col-span-2 xl:col-span-1"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {filteredCommentaires.length} résultat(s) sur {commentaires.length} commentaire(s).
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <Card className="border-border/50">
            <CardContent className="py-8 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              <h3 className="text-lg font-medium text-foreground">
                Chargement des commentaires...
              </h3>
            </CardContent>
          </Card>
        ) : filteredCommentaires.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-10 text-center">
              <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium text-foreground">
                {hasActiveFilters ? "Aucun commentaire trouvé pour ces filtres" : "Aucun commentaire trouvé"}
              </h3>
              <p className="text-muted-foreground">
                {hasActiveFilters ? "Essayez d'élargir les critères." : "Vous n'avez aucun commentaire pour le moment."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCommentaires.map((commentaire) => {
            const isValidated = commentaire.status === true;
            const destinationLabel = commentaire.nomDestination || commentaire.idDestination;

            return (
              <Card key={`${commentaire.idUser}-${commentaire.idDestination}`} className="border-border/60 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    <Avatar className="h-12 w-12 border bg-muted">
                      <AvatarFallback className="font-semibold">
                        {(commentaire.nomUser || commentaire.idUser)
                          .split(" ")
                          .map((namePart: string) => namePart[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground">{commentaire.nomUser || commentaire.idUser}</h3>
                            <Badge
                              variant={isValidated ? "default" : "secondary"}
                              className={
                                isValidated
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              }
                            >
                              {isValidated ? "Validé" : "En attente"}
                            </Badge>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span className="font-medium text-foreground">{destinationLabel}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {formatDate(commentaire.dateCreation)}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {!isValidated && (
                            <Button
                              onClick={() => handleValidateCommentaire(commentaire)}
                              disabled={actionLoading === `validate-${commentaire.idUser}-${commentaire.idDestination}`}
                              size="sm"
                            >
                              {actionLoading === `validate-${commentaire.idUser}-${commentaire.idDestination}` ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                              ) : (
                                <Check className="mr-2 h-4 w-4" />
                              )}
                              Valider
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDeleteCommentaire(commentaire)}
                            disabled={actionLoading === `delete-${commentaire.idUser}-${commentaire.idDestination}`}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 hover:text-red-800"
                          >
                            {actionLoading === `delete-${commentaire.idUser}-${commentaire.idDestination}` ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Supprimer
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-lg border bg-muted/20 p-4">
                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                          {commentaire.contenu}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminCommentaires;
