"use client";

import { useState } from "react";
import { CalendarDays, Clock3, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { ElementSelection, ElementSimulation, JourSimulation } from "@/lib/type/simulation.types";

type PlanningJournalierProps = {
  jours: JourSimulation[];
  elementsSelectionnes: ElementSelection[];
  onChangeElementQuantity: (elementId: string, quantite: number) => void;
  totalVoyageurs: number;
};

function formatAr(value: number) {
  return `${value.toLocaleString("fr-MG")} Ar`;
}

function getTypeLabel(type: string) {
  const normalized = type.trim().toUpperCase();
  if (normalized === "HEBERGEMENT") return "Hebergement";
  if (normalized === "TRANSPORT") return "Transport";
  if (normalized === "ACTIVITE") return "Activite";
  return type;
}

function getDayHeading(jour: JourSimulation) {
  const title = (jour.titre || "").trim();
  const defaultTitle = `Jour ${jour.numeroJour}`;
  return title && title.toLowerCase() !== defaultTitle.toLowerCase() ? title : defaultTitle;
}

export function PlanningJournalier({
  jours,
  elementsSelectionnes,
  onChangeElementQuantity,
  totalVoyageurs,
}: PlanningJournalierProps) {
  const [gallery, setGallery] = useState<{ title: string; images: string[]; activeIndex: number } | null>(null);
  const quantityMap = new Map(elementsSelectionnes.map((item) => [item.elementId, item.quantite]));

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        
        {/* <h2 className="text-xl font-semibold text-slate-900">Planning journalier</h2>
        <p className="text-sm text-slate-600">
          Visualisez votre voyage jour par jour et ajustez les options selon vos envies.
        </p> */}

      </div>

      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
        {jours.map((jour) => {
          const totalElements = jour.elements.length;
          const totalSelectionnes = jour.elements.filter(
            (element) => (quantityMap.get(element.id) ?? element.quantiteSelectionnee ?? 0) > 0
          ).length;

          return (
            <section
              key={jour.numeroJour}
              className="min-w-[300px] max-w-[300px] shrink-0 snap-start rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_50px_-40px_rgba(15,23,42,0.45)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    <CalendarDays className="h-3.5 w-3.5 text-emerald-600" />
                    Jour {jour.numeroJour}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
                      {getDayHeading(jour)}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {totalSelectionnes} selectionne(s) sur {totalElements} bloc(s)
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Total du jour
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900">
                    {formatAr(jour.totalJour)}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {jour.elements.map((element: ElementSimulation) => {
                  const quantiteCourante = Math.max(
                    quantityMap.get(element.id) ?? element.quantiteSelectionnee ?? 0,
                    0
                  );
                  const quantiteMax = Math.max(element.quantiteMax ?? totalVoyageurs, 0);
                  const estSelectionne = quantiteCourante > 0;

                  return (
                    <article
                      key={element.id}
                      className={`rounded-[24px] border p-4 transition ${
                        estSelectionne
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-slate-200 bg-slate-50/70"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-[84px] shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Pers.
                            </p>
                            <input
                              type="number"
                              min={element.obligatoire ? quantiteMax : 0}
                              max={quantiteMax}
                              value={element.obligatoire ? quantiteMax : quantiteCourante}
                              readOnly={element.obligatoire}
                              onChange={(event) =>
                                void onChangeElementQuantity(
                                  element.id,
                                  Math.max(
                                    element.obligatoire ? quantiteMax : 0,
                                    Math.min(Number(event.target.value) || 0, quantiteMax)
                                  )
                                )
                              }
                              className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-center text-sm font-semibold text-slate-900 outline-none"
                            />
                          </div>

                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-col gap-3">
                              <div className="min-w-0">
                                <h4 className="text-lg font-semibold leading-7 text-slate-900">
                                  {element.titre}
                                </h4>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                                    {getTypeLabel(element.type)}
                                  </span>
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                      element.obligatoire
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {element.obligatoire ? "Obligatoire" : "Optionnel"}
                                  </span>
                                </div>
                              </div>

                              <div className="rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                  Montant
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                  {formatAr(element.prix)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                          <div className="pl-[97px]">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              {element.details?.duree ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                                  <Clock3 className="h-3.5 w-3.5 text-violet-500" />
                                  {element.details.duree}
                                </span>
                              ) : null}

                              {element.details?.capacite ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                                  <Users className="h-3.5 w-3.5 text-violet-500" />
                                  Capacite : {element.details.capacite} pers
                                </span>
                              ) : null}

                              {element.details?.images && element.details.images.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setGallery({
                                      title: element.titre,
                                      images: element.details?.images?.filter(Boolean) ?? [],
                                      activeIndex: 0,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  Voir les images
                                </button>
                              ) : null}
                            </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="text-xs text-slate-500">
        Faites glisser horizontalement pour parcourir tous les jours du voyage.
      </div>

      <Dialog open={Boolean(gallery)} onOpenChange={(open) => !open && setGallery(null)}>
        <DialogContent className="!h-[92vh] !w-[94vw] !max-w-[1200px] overflow-hidden rounded-[28px] p-0 sm:!max-w-[1200px]">
          <DialogHeader>
            <div className="border-b border-slate-200 px-6 py-5">
              <DialogTitle>{gallery?.title ?? "Images du bloc"}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="h-[calc(92vh-88px)] overflow-y-auto bg-[linear-gradient(180deg,_rgba(248,250,252,0.94),_rgba(255,255,255,0.98))] px-6 py-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
              <section className="rounded-[30px] border border-slate-200/90 bg-white/92 p-5 shadow-[0_18px_55px_-36px_rgba(15,23,42,0.45)]">
                <div className="flex h-[48vh] min-h-[300px] items-center justify-center overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,_rgba(15,23,42,0.94),_rgba(30,41,59,0.96))] p-5 sm:h-[54vh]">
                  {gallery?.images?.[gallery.activeIndex] ? (
                    <img
                      src={gallery.images[gallery.activeIndex]}
                      alt={`${gallery.title} ${gallery.activeIndex + 1}`}
                      className="max-h-full w-auto max-w-full rounded-[18px] object-contain shadow-[0_24px_55px_-30px_rgba(15,23,42,0.85)] transition duration-300 hover:scale-[1.03]"
                    />
                  ) : null}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{gallery?.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                      Image {(gallery?.activeIndex ?? 0) + 1} sur {gallery?.images.length ?? 0}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    Survolez l&apos;image pour l&apos;agrandir legerement.
                  </p>
                </div>
              </section>

              {(gallery?.images.length ?? 0) > 1 ? (
                <aside className="rounded-[28px] border border-slate-200/90 bg-white/88 p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Galerie
                  </p>
                  <div className="grid max-h-[62vh] gap-3 overflow-y-auto pr-1">
                    {(gallery?.images ?? []).map((image, index) => {
                      const isActive = index === gallery?.activeIndex;
                      return (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() =>
                            setGallery((current) =>
                              current ? { ...current, activeIndex: index } : current
                            )
                          }
                          className={`overflow-hidden rounded-2xl border bg-white text-left transition ${
                            isActive
                              ? "border-emerald-400 ring-2 ring-emerald-200"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${gallery?.title ?? "Bloc"} miniature ${index + 1}`}
                            className="h-24 w-full object-cover"
                          />
                          <div className="px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Image {index + 1}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </aside>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
