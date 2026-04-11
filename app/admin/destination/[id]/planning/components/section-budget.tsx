"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ElementJourPlanification, JourPlanificationVoyage, PlanificationVoyage, Transport } from "@/lib/type/destination";
import { TarifActivite } from "@/lib/type/activite";
import { TarifHebergement } from "@/lib/type/hebergement";

type Props = {
  planification: PlanificationVoyage;
  sortedDays: JourPlanificationVoyage[];
  tarifsActivites: TarifActivite[];
  tarifsHebergements: TarifHebergement[];
};

type BudgetCategory = "activite" | "hebergement" | "transport" | "autre";

type BudgetLine = {
  id: string;
  titre: string;
  categorie: BudgetCategory;
  montant: number;
  devise: string;
  minimumTarifParPersonne: number | null;
  maximumTarifParPersonne: number | null;
  source: "bloc" | "tarif" | "aucun";
  tarifsDisponibles: string[];
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);
}

function getCategory(element: ElementJourPlanification): BudgetCategory {
  if (element.codeTypeElementJour === "ACTIVITE") return "activite";
  if (element.codeTypeElementJour === "HEBERGEMENT") return "hebergement";
  if (element.codeTypeElementJour === "TRANSPORT" || element.codeTypeElementJour === "TRANSPORT_PRE_REMPLI") return "transport";
  return "autre";
}

function getLineTitle(element: ElementJourPlanification) {
  return element.titre || element.nomActivite || element.nomHebergement || element.nomTransport || element.nomTypeElementJour || "Bloc";
}

function getEstimatedTarif(
  element: ElementJourPlanification,
  transportsById: Map<string, Transport>,
  tarifsActivites: TarifActivite[],
  tarifsHebergements: TarifHebergement[]
) {
  if ((element.codeTypeElementJour === "TRANSPORT" || element.codeTypeElementJour === "TRANSPORT_PRE_REMPLI") && element.idTransport) {
    const transport = transportsById.get(element.idTransport);
    if (transport?.budgetPrevu !== null && transport?.budgetPrevu !== undefined) {
      return { montant: transport.budgetPrevu, devise: "MGA" };
    }
  }

  if (element.codeTypeElementJour === "ACTIVITE" && element.idActivite) {
    const tarif = tarifsActivites
      .filter((item) => item.idActivite === element.idActivite && item.estActif)
      .sort(
        (a, b) =>
          (a.prixParPersonne ?? a.prixParHeur ?? Number.MAX_SAFE_INTEGER) -
          (b.prixParPersonne ?? b.prixParHeur ?? Number.MAX_SAFE_INTEGER)
      )[0];
    const montant = tarif ? (tarif.prixParPersonne ?? tarif.prixParHeur ?? null) : null;
    return montant !== null && montant !== undefined
      ? { montant, devise: tarif?.devise || "MGA" }
      : null;
  }

  if (element.codeTypeElementJour === "HEBERGEMENT" && element.idHebergement) {
    const tarif = tarifsHebergements
      .filter((item) => item.idHebergement === element.idHebergement && item.estActif)
      .sort(
        (a, b) =>
          (a.prixParNuit ?? a.prixReservation ?? Number.MAX_SAFE_INTEGER) -
          (b.prixParNuit ?? b.prixReservation ?? Number.MAX_SAFE_INTEGER)
      )[0];
    const montant = tarif ? (tarif.prixParNuit ?? tarif.prixReservation ?? null) : null;
    return montant !== null && montant !== undefined
      ? { montant, devise: tarif?.devise || "MGA" }
      : null;
  }

  return null;
}

function buildBudgetLine(
  element: ElementJourPlanification,
  defaultDevise: string,
  transportsById: Map<string, Transport>,
  tarifsActivites: TarifActivite[],
  tarifsHebergements: TarifHebergement[]
): BudgetLine {
  const categorie = getCategory(element);
  const titre = getLineTitle(element);
  let tarifsDisponibles: string[] = [];

  if (element.codeTypeElementJour === "ACTIVITE" && element.idActivite) {
    tarifsDisponibles = tarifsActivites
      .filter((item) => item.idActivite === element.idActivite && item.estActif)
      .map((item) => {
        const montant = item.prixParPersonne ?? item.prixParHeur;
        if (montant === null || montant === undefined) return null;
        const unite = item.prixParPersonne !== null && item.prixParPersonne !== undefined ? "par personne" : "par heure";
        return `${item.categorieAge || "Tarif"} (${unite}): ${formatAmount(montant)} ${item.devise || defaultDevise}`;
      })
      .filter((item): item is string => item !== null);
  }

  if (element.codeTypeElementJour === "HEBERGEMENT" && element.idHebergement) {
    tarifsDisponibles = tarifsHebergements
      .filter((item) => item.idHebergement === element.idHebergement && item.estActif)
      .map((item) => {
        const montant = item.prixParNuit ?? item.prixReservation;
        if (montant === null || montant === undefined) return null;
        const unite = item.prixParNuit !== null && item.prixParNuit !== undefined ? "par nuit" : "reservation";
        const capaciteLabel = item.capacite ? ` - ${item.capacite} pers/chambre` : "";
        return `${item.nomTypeChambre || "Tarif"} (${unite}${capaciteLabel}): ${formatAmount(montant)} ${item.devise || defaultDevise}`;
      })
      .filter((item): item is string => item !== null);
  }

  if ((element.codeTypeElementJour === "TRANSPORT" || element.codeTypeElementJour === "TRANSPORT_PRE_REMPLI") && element.idTransport) {
    const transport = transportsById.get(element.idTransport);
    if (transport?.budgetPrevu !== null && transport?.budgetPrevu !== undefined) {
      tarifsDisponibles = [`Budget transport: ${formatAmount(transport.budgetPrevu)} MGA`];
    }
  }

  if (element.budgetPrevu !== null && element.budgetPrevu !== undefined) {
    return {
      id: element.id,
      titre,
      categorie,
      montant: element.budgetPrevu,
      devise: element.devise || defaultDevise,
      minimumTarifParPersonne: element.minimumTarifParPersonne ?? null,
      maximumTarifParPersonne: element.maximumTarifParPersonne ?? null,
      source: "bloc",
      tarifsDisponibles,
    };
  }

  const estimated = getEstimatedTarif(element, transportsById, tarifsActivites, tarifsHebergements);
  if (estimated) {
    return {
      id: element.id,
      titre,
      categorie,
      montant: estimated.montant,
      devise: estimated.devise,
      minimumTarifParPersonne: element.minimumTarifParPersonne ?? null,
      maximumTarifParPersonne: element.maximumTarifParPersonne ?? null,
      source: "tarif",
      tarifsDisponibles,
    };
  }

  return {
    id: element.id,
    titre,
    categorie,
    montant: 0,
    devise: element.devise || defaultDevise,
    minimumTarifParPersonne: element.minimumTarifParPersonne ?? null,
    maximumTarifParPersonne: element.maximumTarifParPersonne ?? null,
    source: "aucun",
    tarifsDisponibles,
  };
}

function categoryLabel(category: BudgetCategory) {
  if (category === "activite") return "Activite";
  if (category === "hebergement") return "Hebergement";
  if (category === "transport") return "Route / Transport";
  return "Autre";
}

export function SectionBudget({ planification, sortedDays, tarifsActivites, tarifsHebergements }: Props) {
  const [benefices, setBenefices] = useState<Record<string, string>>({});
  const devise = planification.deviseBudget || "MGA";
  const transportsById = new Map((planification.transports ?? []).map((transport) => [transport.id, transport] as const));
  const dayBudgets = sortedDays.map((day) => {
    const lines = (day.elements ?? []).map((element) =>
      buildBudgetLine(element, devise, transportsById, tarifsActivites, tarifsHebergements)
    );
    const byCategory = {
      activite: lines.filter((line) => line.categorie === "activite").reduce((sum, line) => sum + line.montant, 0),
      hebergement: lines.filter((line) => line.categorie === "hebergement").reduce((sum, line) => sum + line.montant, 0),
      transport: lines.filter((line) => line.categorie === "transport").reduce((sum, line) => sum + line.montant, 0),
      autre: lines.filter((line) => line.categorie === "autre").reduce((sum, line) => sum + line.montant, 0),
    };
    const total = byCategory.activite + byCategory.hebergement + byCategory.transport + byCategory.autre;
    return { day, lines, byCategory, total };
  });

  const budgetTotal = planification.budgetTotal ?? 0;
  const budgetElements = dayBudgets.reduce((sum, day) => sum + day.total, 0);
  const reste = budgetTotal - budgetElements;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Budget</CardTitle>
        <CardDescription>
          Detail par jour, puis detail des lignes de budget (activites, hebergements, route/transport et autres).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Budget total planification</p>
            <p className="text-lg font-semibold">{formatAmount(budgetTotal)} {devise}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Somme estimative des jours</p>
            <p className="text-lg font-semibold">{formatAmount(budgetElements)} {devise}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">Reste estimatif</p>
            <p className="text-lg font-semibold">{formatAmount(reste)} {devise}</p>
          </div>
        </div>

        <div className="space-y-4">
          {dayBudgets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
              Aucun jour disponible pour le detail budget.
            </div>
          ) : (
            dayBudgets.map(({ day, lines, byCategory, total }) => (
              <div key={day.id} className="rounded-2xl border border-border/60 bg-card/40 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Jour {day.numeroJour ?? "-"} - {day.titre || "Sans titre"}</p>
                  <p className="text-sm font-semibold">Total jour: {formatAmount(total)} {devise}</p>
                </div>

                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  <p className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-900">
                    Minimum / personne: {formatAmount(day.minimumTarifParPersonne ?? 0)} {devise}
                  </p>
                  <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
                    Maximum / personne: {formatAmount(day.maximumTarifParPersonne ?? 0)} {devise}
                  </p>
                </div>

                <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <p className="rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs">Activite: {formatAmount(byCategory.activite)} {devise}</p>
                  <p className="rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs">Hebergement: {formatAmount(byCategory.hebergement)} {devise}</p>
                  <p className="rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs">Route/Transport: {formatAmount(byCategory.transport)} {devise}</p>
                  <p className="rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs">Autre: {formatAmount(byCategory.autre)} {devise}</p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Bloc</th>
                        <th className="px-3 py-2 text-left font-medium">Categorie</th>
                        <th className="px-3 py-2 text-left font-medium">Tarif</th>
                        <th className="px-3 py-2 text-left font-medium">Min / pers</th>
                        <th className="px-3 py-2 text-left font-medium">Max / pers</th>
                        <th className="px-3 py-2 text-left font-medium">Benefice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                            Aucun bloc budget pour ce jour.
                          </td>
                        </tr>
                      ) : (
                        lines.map((line) => (
                          <tr key={line.id} className="border-t border-border/40">
                            <td className="px-3 py-2">{line.titre}</td>
                            <td className="px-3 py-2">{categoryLabel(line.categorie)}</td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {line.tarifsDisponibles.length > 0 ? (
                                <div className="space-y-1">
                                  {line.tarifsDisponibles.map((tarif, index) => (
                                    <p key={`${line.id}-tarif-${index}`} className="text-xs">
                                      {tarif}
                                    </p>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {line.minimumTarifParPersonne !== null && line.minimumTarifParPersonne !== undefined
                                ? `${formatAmount(line.minimumTarifParPersonne)} ${line.devise}`
                                : "-"}
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {line.maximumTarifParPersonne !== null && line.maximumTarifParPersonne !== undefined
                                ? `${formatAmount(line.maximumTarifParPersonne)} ${line.devise}`
                                : "-"}
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={benefices[line.id] ?? ""}
                                onChange={(event) =>
                                  setBenefices((current) => ({
                                    ...current,
                                    [line.id]: event.target.value,
                                  }))
                                }
                                placeholder="Optionnel"
                                className="min-w-28"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
