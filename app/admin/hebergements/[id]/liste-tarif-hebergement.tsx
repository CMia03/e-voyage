"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TarifHebergement } from "@/lib/type/hebergement";

function formatMoney(value: number | null | undefined, devise: string) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toLocaleString("fr-FR")} ${devise}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Non definie";
  return new Date(value).toLocaleDateString("fr-FR");
}

type ListeTarifHebergementProps = {
  tarifs: TarifHebergement[];
  isDeletingTarifId: string | null;
  isDeletingPhotoId: string | null;
  onEditTarif: (tarif: TarifHebergement) => void;
  onDeleteTarif: (tarifId: string) => void;
  onDeletePhoto: (photoId: string) => void;
  onOpenPhotoModal: (tarifId: string) => void;
};

export function ListeTarifHebergement({
  tarifs,
  isDeletingTarifId,
  isDeletingPhotoId,
  onEditTarif,
  onDeleteTarif,
  onDeletePhoto,
  onOpenPhotoModal,
}: ListeTarifHebergementProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Tarifs de l&apos;hebergement</CardTitle>
        <CardDescription>
          {tarifs.length} tarif{tarifs.length > 1 ? "s" : ""} enregistres.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tarifs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun tarif ajoute pour cet hebergement.
          </p>
        ) : (
          <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-2">
            {tarifs.map((tarif) => (
              <div
                key={tarif.id}
                className="rounded-2xl border border-border/50 bg-card/50 p-5"
              >
                <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">{tarif.nomTypeChambre}</h3>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-muted px-2.5 py-1">
                          {formatMoney(tarif.prixParNuit, tarif.devise)} / nuit
                        </span>
                        <span className="rounded-full bg-muted px-2.5 py-1">
                          Reservation: {formatMoney(tarif.prixReservation, tarif.devise)}
                        </span>
                        <span className="rounded-full bg-muted px-2.5 py-1">
                          Capacite: {tarif.capacite}
                        </span>
                        <span className="rounded-full bg-muted px-2.5 py-1">
                          {tarif.petitDejeunerInclus
                            ? "Petit dejeuner inclus"
                            : "Sans petit dejeuner"}
                        </span>
                        <span className="rounded-full bg-muted px-2.5 py-1">
                          {formatDate(tarif.dateValiditeDebut)} - {formatDate(tarif.dateValiditeFin)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => onEditTarif(tarif)}>
                        Modifier
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onOpenPhotoModal(tarif.id)}>
                        Ajouter image
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteTarif(tarif.id)}
                        disabled={isDeletingTarifId === tarif.id}
                      >
                        {isDeletingTarifId === tarif.id ? "Suppression..." : "Supprimer"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Photos de chambre</h4>
                    <span className="text-sm text-muted-foreground">
                      {tarif.photos.length} photo{tarif.photos.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {tarif.photos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucune photo pour ce tarif.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {tarif.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="group relative z-0 overflow-visible rounded-xl transition-all hover:z-20"
                        >
                          <div className="rounded-xl border border-border/50 bg-muted/20 transition-all hover:shadow-lg">
                          <img
                            src={photo.urlImage}
                            alt={photo.nomTypeSalle}
                            className="relative z-10 h-36 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.45] group-hover:shadow-2xl"
                          />
                          <div className="space-y-2 p-2.5">
                            <p className="line-clamp-1 text-sm font-medium">{photo.nomTypeSalle}</p>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 px-3 text-xs"
                              onClick={() => onDeletePhoto(photo.id)}
                              disabled={isDeletingPhotoId === photo.id}
                            >
                              {isDeletingPhotoId === photo.id ? "Suppression..." : "Supprimer"}
                            </Button>
                          </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
