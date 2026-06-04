"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Tag,
  User,
  Users,
  X,
} from "lucide-react";
import { Reservation, ReservationStatus } from "@/lib/type/reservation";

interface ReservationViewModalProps {
  reservation: Reservation | null;
  open: boolean;
  onClose: () => void;
}

const statusClasses: Record<ReservationStatus, string> = {
  EN_ATTENTE: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50",
  VALIDEE: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50",
  ANNULEE: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-50",
};

function formatCurrency(amount: number, devise = "MGA") {
  return `${Math.round(amount || 0).toLocaleString("fr-MG")} ${devise}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

function formatStatus(status: ReservationStatus) {
  return status.replaceAll("_", " ");
}

function formatSource(source: Reservation["source"]) {
  return source === "SIMULATION" ? "Simulation" : "Prix direct";
}

function formatReservationText(value?: string | number | null) {
  return String(value ?? "")
    .replace(/‚/g, "é")
    .replace(/…/g, "à")
    .replace(/–/g, "û")
    .replace(/“/g, "ô")
    .replace(/Š/g, "è")
    .replace(/Œ/g, "î")
    .replace(/×/g, "Î")
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ãª/g, "ê")
    .replace(/Ã«/g, "ë")
    .replace(/Ã‰/g, "É")
    .replace(/Ã /g, "à")
    .replace(/Ã¢/g, "â")
    .replace(/Ã®/g, "î")
    .replace(/Ã´/g, "ô")
    .replace(/Ã»/g, "û")
    .replace(/Ã¹/g, "ù")
    .replace(/Ã§/g, "ç");
}

function parseSummaryLines(summary: string | null | undefined) {
  if (!summary) return [];

  return summary
    .split("\n")
    .map((line) => formatReservationText(line).trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        return { label: "", value: line };
      }

      return {
        label: line.slice(0, separatorIndex).trim(),
        value: line.slice(separatorIndex + 1).trim(),
      };
    });
}

function DetailTile({
  icon: Icon,
  label,
  value,
  description,
  accent = false,
}: {
  icon: typeof User;
  label: string;
  value: string;
  description?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4"
          : "rounded-2xl border border-slate-200 bg-white p-4"
      }
    >
      <div className="flex items-start gap-3">
        <span className={accent ? "rounded-xl bg-white p-2 text-emerald-700" : "rounded-xl bg-slate-50 p-2 text-slate-500"}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className={accent ? "mt-1 text-2xl font-bold text-emerald-700" : "mt-1 font-semibold text-slate-950"}>
            {value}
          </p>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function ReservationViewModal({ reservation, open, onClose }: ReservationViewModalProps) {
  if (!reservation) return null;

  const clientName = `${reservation.prenomUtilisateur} ${reservation.nomUtilisateur}`.trim() || "-";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="!h-[90vh] !w-[min(1500px,calc(100vw-2rem))] !max-w-none grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-0 sm:!max-w-none"
      >
        <DialogHeader className="border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-xl font-bold text-slate-950">
                  Réservation {reservation.reference}
                </DialogTitle>
                <Badge className={statusClasses[reservation.status]}>{formatStatus(reservation.status)}</Badge>
                <Badge variant="outline">{formatSource(reservation.source)}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Créée le {formatDate(reservation.dateReservation)}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-6 py-5">
          <div className="space-y-5 pb-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.8fr]">
              <DetailTile
                icon={User}
                label="Client"
                value={formatReservationText(clientName)}
                description={formatReservationText(reservation.emailUtilisateur || "-")}
              />
              <DetailTile
                icon={Calendar}
                label="Suivi"
                value={`Réservation le ${formatDate(reservation.dateReservation)}`}
                description={`Dernière mise à jour : ${formatDate(reservation.dateModification)}`}
              />
              <DetailTile
                icon={CreditCard}
                label="Montant total"
                value={formatCurrency(reservation.montantTotal, reservation.devise)}
                description={formatSource(reservation.source)}
                accent
              />
            </div>

            {reservation.details.map((detail, detailIndex) => {
              const summaryItems = parseSummaryLines(detail.resumeSimulation);
              const profileSummaryItems = [
                { label: "Catégorie", value: formatReservationText(detail.nomCategorieClient) },
                { label: "Gamme", value: formatReservationText(detail.gamme) },
                { label: "Personnes", value: `${detail.nombrePersonnes} personne(s)` },
              ];
              const simulationSummaryItems = summaryItems.filter((item) => {
                const label = item.label.toLowerCase();
                return !["catégorie", "categorie", "gamme", "nombre de personnes"].includes(label);
              });

              return (
                <section key={detail.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  {/* <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.55fr_0.7fr_0.7fr]">
                    <DetailTile
                      icon={MapPin}
                      label="Destination"
                      value={formatReservationText(detail.nomDestination)}
                      description={formatReservationText(detail.nomPlanification)}
                    />
                    <DetailTile
                      icon={Users}
                      label="Voyageurs"
                      value={`${detail.nombrePersonnes} personne(s)`}
                      description={`Catégorie : ${formatReservationText(detail.nomCategorieClient)}`}
                    />
                    <DetailTile icon={Tag} label="Gamme" value={formatReservationText(detail.gamme)} />
                    <DetailTile
                      icon={CreditCard}
                      label="Prix unitaire"
                      value={formatCurrency(detail.prixUnitaire, reservation.devise)}
                    />
                    <DetailTile
                      icon={CreditCard}
                      label="Prix total"
                      value={formatCurrency(detail.prixTotal, reservation.devise)}
                    />
                  </div> */}

                  <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-slate-500" />
                          <p className="font-semibold text-slate-950">Éléments sélectionnés</p>
                        </div>
                        <Badge variant="outline">{detail.elementsSelectionnes.length} élément(s)</Badge>
                      </div>

                      {detail.elementsSelectionnes.length > 0 ? (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <div className="grid grid-cols-[minmax(0,1fr)_110px_90px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <span>Bloc</span>
                            <span>Type</span>
                            <span className="text-right">Nombre de personnes</span>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {detail.elementsSelectionnes.map((element, index) => (
                              <div
                                key={`${detail.id}-${element.elementId}-${index}`}
                                className="grid grid-cols-[minmax(0,1fr)_110px_90px] items-center gap-3 px-3 py-2 text-sm"
                              >
                                <span className="min-w-0 font-medium text-slate-900">
                                  {formatReservationText(element.nomElement || element.elementId)}
                                </span>
                                <span className="text-xs font-medium uppercase text-slate-500">
                                  {formatReservationText(element.type || "-")}
                                </span>
                                <span className="text-right font-semibold text-slate-900">{element.quantite}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                          Aucun élément sélectionné pour ce profil.
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <p className="font-semibold text-slate-950">Résumé simulation</p>
                      </div>

                      <div className="mb-3 grid gap-2 sm:grid-cols-3">
                        {profileSummaryItems.map((item) => (
                          <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
                            <p className="mt-1 font-semibold text-slate-950">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {simulationSummaryItems.length > 0 ? (
                        <div className="space-y-2">
                          {simulationSummaryItems.map((item, index) => (
                            <div
                              key={`${detail.id}-summary-${index}`}
                              className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2 text-sm"
                            >
                              <span className="text-slate-500">{item.label || `Info ${index + 1}`}</span>
                              <span className="text-right font-medium text-slate-950">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                          Aucun résumé simulation disponible.
                        </p>
                      )}
                    </div>
                  </div>

                  {reservation.details.length > 1 ? (
                    <p className="mt-3 text-xs text-slate-500">Profil {detailIndex + 1} sur {reservation.details.length}</p>
                  ) : null}
                </section>
              );
            })}

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-500" />
                  <p className="font-semibold text-slate-950">Commentaire client</p>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {formatReservationText(reservation.commentaireClient?.trim() || "Aucun commentaire client.")}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <p className="font-semibold text-slate-950">Commentaire admin</p>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {formatReservationText(reservation.commentaireAdmin?.trim() || "Aucun commentaire admin pour le moment.")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
