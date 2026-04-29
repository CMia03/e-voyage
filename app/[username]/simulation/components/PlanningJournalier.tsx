"use client";

import { CalendarDays, CheckSquare, Clock3, Map, Square, Users } from "lucide-react";

import { ElementSimulation, JourSimulation } from "@/lib/type/simulation.types";

type PlanningJournalierProps = {
  jours: JourSimulation[];
  elementsSelectionnes: string[];
  onToggleElement: (elementId: string) => void;
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
  onToggleElement,
}: PlanningJournalierProps) {
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
          const totalSelectionnes = jour.elements.filter((element) =>
            elementsSelectionnes.includes(element.id)
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
                  const estCoche = elementsSelectionnes.includes(element.id);

                  return (
                    <article
                      key={element.id}
                      className={`rounded-[24px] border p-4 transition ${
                        estCoche
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-slate-200 bg-slate-50/70"
                      } ${element.obligatoire ? "cursor-default" : "cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/40"}`}
                      onClick={() => {
                        if (!element.obligatoire) {
                          onToggleElement(element.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!element.obligatoire) {
                              onToggleElement(element.id);
                            }
                          }}
                          disabled={element.obligatoire}
                          aria-label={estCoche ? "Retirer ce bloc" : "Ajouter ce bloc"}
                          className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                            estCoche
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 bg-white text-slate-400"
                          } ${element.obligatoire ? "cursor-not-allowed opacity-80" : "hover:border-emerald-400"}`}
                        >
                          {estCoche ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="text-lg font-semibold leading-6 text-slate-900">
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

                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold text-slate-900">
                                {formatAr(element.prix)}
                              </p>
                            </div>
                          </div>

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
                          </div>

                          {!element.obligatoire ? (
                            <p className="text-xs text-slate-500">
                              {estCoche
                                ? "Ce bloc optionnel est actuellement inclus dans votre simulation."
                                : "Cochez ce bloc si vous souhaitez l'ajouter a votre voyage."}
                            </p>
                          ) : (
                            <p className="text-xs text-emerald-700">
                              Ce bloc fait partie du coeur de votre voyage.
                            </p>
                          )}
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
    </div>
  );
}
