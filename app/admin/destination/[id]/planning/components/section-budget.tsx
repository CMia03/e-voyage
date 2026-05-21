"use client";

// COMPOSANT SECTION BUDGET
// Affiche un tableau detaille de budgetisation pour un voyage planifie
// + Budgets enregistrÃ©s (CRUD admin / lecture publique)

import { useMemo, useState } from "react";
import { Bed, Crown, Pencil, Plus, RefreshCw, Route, Trash2, UsersRound, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JourPlanificationVoyage, PlanificationVoyage, Transport } from "@/lib/type/destination";
import { TarifActivite } from "@/lib/type/activite";
import { TarifHebergement } from "@/lib/type/hebergement";
import { BudgetisationPlanificationVoyage } from "@/lib/type/budgetisation-planification";

// ====== TYPES ET INTERFACES ======

type Props = {
  planification: PlanificationVoyage;
  sortedDays: JourPlanificationVoyage[];
  tarifsActivites: TarifActivite[];
  tarifsHebergements: TarifHebergement[];

  budgetsPlanification?: BudgetisationPlanificationVoyage[];
  isAdmin?: boolean;
  onAddBudget?: () => void;
  onEditBudget?: (budget: BudgetisationPlanificationVoyage) => void;
  onDeleteBudget?: (budgetId: string) => void;
};

type BudgetCategory = "activite" | "hebergement" | "transport" | "autre";

type Gamme = string;

type TarificationCell = {
  moyenne: number | null;
  luxe: number | null;
  display: string;
};

type BudgetLine = {
  id: string;
  titre: string;
  categorie: BudgetCategory;
  tarifsDisplay: string;
  moyenne: number | null;
  luxe: number | null;
  budgetCalcule: number | null;
};

// ====== CONSTANTES ======

const TABLE_HEADER_CLASS = "bg-muted/35 text-xs uppercase tracking-wide text-muted-foreground";
const TABLE_CELL_CLASS = "px-4 py-4";
const TABLE_HEADER_CELL_CLASS = "px-4 py-3 font-semibold";

// ====== UTILITAIRES DE FORMATAGE ======

function formatAmount(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);
}

function formatMoney(value: number, devise: string): string {
  return `${formatAmount(value)} ${devise}`;
}

function formatMetricValue(value: string | number) {
  if (typeof value === "number") return value.toString();
  return value.replace(" jour(s)", "\njour(s)").replace(" activité(s)", "\nactivité(s)").replace(" hébergement(s)", "\nhébergement(s)");
}

function formatMoneySafe(value: number | null | undefined, devise: string): string {
  if (value === null || value === undefined) return `- ${devise}`;
  return `${formatAmount(value)} ${devise}`;
}

function formatGamme(value: string | null | undefined): string {
  const normalized = normalizeGamme(value);
  if (normalized === "luxe") return "LUXE";
  if (normalized === "moyenne") return "MOYENNE";
  return normalized.toUpperCase();
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizeGamme(value: string | null | undefined): string {
  return normalizeText(value) || "moyenne";
}

function isNamedClientCategory(value: string | null | undefined): value is string {
  const normalized = normalizeText(value);
  return normalized !== "" && !normalized.startsWith("sans cat");
}

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  activite: "ActivitÃ©",
  hebergement: "Hébergements",
  transport: "Transport",
  autre: "Autre",
};

function getCategoryLabel(category: BudgetCategory): string {
  return CATEGORY_LABELS[category];
}

// ====== FONCTIONS D'EXTRACTION DES CATÃ‰GORIES UNIQUES ======

function getUniqueClientCategories(
  sortedDays: JourPlanificationVoyage[],
  tarifsActivites: TarifActivite[]
): string[] {
  const categories = new Set<string>();

  for (const day of sortedDays) {
    for (const element of day.elements ?? []) {
      if (element.codeTypeElementJour === "ACTIVITE" && element.idActivite) {
        const tarifs = tarifsActivites.filter(
          (t) => t.idActivite === element.idActivite && t.estActif
        );
        tarifs.forEach((tarif) => {
          if (tarif.nomCategorieClient) {
            categories.add(tarif.nomCategorieClient);
          }
        });
      }
    }
  }

  return Array.from(categories).sort();
}

function getUniqueGammes(
  sortedDays: JourPlanificationVoyage[],
  tarifsHebergements: TarifHebergement[]
): string[] {
  const gammes = new Set<string>();

  for (const day of sortedDays) {
    for (const element of day.elements ?? []) {
      if (element.codeTypeElementJour === "HEBERGEMENT" && element.idHebergement) {
        const tarifs = tarifsHebergements.filter(
          (t) => t.idHebergement === element.idHebergement && t.estActif
        );
        tarifs.forEach((tarif) => {
          gammes.add(normalizeGamme(tarif.gamme));
        });
      }
    }
  }

  return Array.from(gammes).sort();
}

// ====== FONCTIONS D'EXTRACTION DE DONNÃ‰ES ======

function getLineTitle(element: JourPlanificationVoyage["elements"][number]): string {
  return (
    element.titre ||
    element.nomActivite ||
    element.nomHebergement ||
    element.nomTransport ||
    element.nomTypeElementJour ||
    "Sans titre"
  );
}

function getElementCategory(element: JourPlanificationVoyage["elements"][number]): BudgetCategory {
  if (element.codeTypeElementJour === "ACTIVITE") return "activite";
  if (element.codeTypeElementJour === "HEBERGEMENT") return "hebergement";
  if (
    element.codeTypeElementJour === "TRANSPORT" ||
    element.codeTypeElementJour === "TRANSPORT_PRE_REMPLI"
  ) {
    return "transport";
  }
  return "autre";
}

function getTransportAmount(
  idTransport: string | null | undefined,
  transportsById: Map<string, Transport>
): number | null {
  if (!idTransport) return null;
  const transport = transportsById.get(idTransport);
  return transport?.budgetPrevu ?? null;
}

function getActivityTarifsForElement(
  idActivite: string | null | undefined,
  tarifsActivites: TarifActivite[]
): Array<{ categorieClient: string; montant: number; devise: string }> {
  if (!idActivite) return [];
  return tarifsActivites
    .filter((item) => item.idActivite === idActivite && item.estActif)
    .map((item) => {
      const montant = item.prixParPersonne ?? item.prixParHeur;
      if (montant === null || montant === undefined) return null;
      return {
        categorieClient: item.nomCategorieClient || "Sans catégorie",
        montant,
        devise: item.devise || "MGA",
      };
    })
    .filter(
      (item): item is { categorieClient: string; montant: number; devise: string } => item !== null
    );
}

function getHebergementTarifsForElement(
  idHebergement: string | null | undefined,
  tarifsHebergements: TarifHebergement[]
): Array<{
  gamme: Gamme;
  montant: number;
  devise: string;
  capacite: number;
  nomTypeChambre: string;
}> {
  if (!idHebergement) return [];
  return tarifsHebergements
    .filter((item) => item.idHebergement === idHebergement && item.estActif)
    .map((item) => {
      const brut = item.prixParNuit ?? item.prixReservation;
      if (brut === null || brut === undefined) return null;

      const montant = item.capacite && item.capacite > 0 ? brut / item.capacite : brut;

      return {
        gamme: normalizeGamme(item.gamme),
        montant,
        devise: item.devise || "MGA",
        capacite: item.capacite || 0,
        nomTypeChambre: item.nomTypeChambre || "Sans type",
      };
    })
    .filter(
      (
        item
      ): item is {
        gamme: Gamme;
        montant: number;
        devise: string;
        capacite: number;
        nomTypeChambre: string;
      } => item !== null
    );
}

// ====== FONCTIONS DE CONSTRUCTION DE CELLULES ======

function createEmptyCell(): TarificationCell {
  return { moyenne: null, luxe: null, display: "-" };
}

function buildActivityCell(
  tarifs: Array<{ categorieClient: string; montant: number; devise: string }>,
  selectedCategorieClient: string
): TarificationCell {
  const filteredTarifs =
    selectedCategorieClient && selectedCategorieClient.trim() !== ""
      ? tarifs.filter((item) => {
          const categorie = item.categorieClient ?? "";
          if (categorie === "") return false;
          return categorie.toLowerCase().includes(selectedCategorieClient.toLowerCase());
        })
      : tarifs;

  const parts: string[] = [];
  let totalMoyenne = 0;

  for (const tarif of filteredTarifs) {
    const details = formatMoney(tarif.montant, tarif.devise);
    parts.push(`${tarif.categorieClient || "Sans catégorie"}: ${details}`);
    totalMoyenne += tarif.montant;
  }

  return {
    moyenne: totalMoyenne || null,
    luxe: null,
    display: parts.length > 0 ? parts.join(" | ") : "-",
  };
}

function buildHebergementCell(
  tarifs: Array<{
    gamme: Gamme;
    montant: number;
    devise: string;
    capacite: number;
    nomTypeChambre: string;
  }>,
  selectedGamme: string
): TarificationCell {
  const filteredTarifs =
    selectedGamme && selectedGamme.trim() !== ""
      ? tarifs.filter((item) => normalizeGamme(item.gamme) === normalizeGamme(selectedGamme))
      : tarifs;

  const display = filteredTarifs
    .map((item) => {
      const prixTotal = item.montant * (item.capacite || 1);
      const gammeLabel = normalizeGamme(item.gamme) === "luxe" ? "Luxe" : "Moyenne";
      return `${gammeLabel} - ${formatMoney(prixTotal, item.devise)} (${item.nomTypeChambre || "Sans type"} - Cap: ${
        item.capacite || 0
      }) - ${formatMoney(item.montant, item.devise)}/pers`;
    })
    .join("\n");

  const totalMoyenne = filteredTarifs
    .filter((item) => normalizeGamme(item.gamme) === "moyenne")
    .reduce((sum, item) => sum + item.montant, 0);
  const totalLuxe = filteredTarifs
    .filter((item) => normalizeGamme(item.gamme) === "luxe")
    .reduce((sum, item) => sum + item.montant, 0);

  return {
    moyenne: totalMoyenne || null,
    luxe: totalLuxe || null,
    display: display.length > 0 ? display : "-",
  };
}

function buildSharedCell(amount: number | null, devise: string): TarificationCell {
  if (amount === null || amount === undefined) return createEmptyCell();
  return {
    moyenne: amount,
    luxe: amount,
    display: formatMoney(amount, devise),
  };
}

// ====== FONCTION DE CONSTRUCTION DE LIGNES ======

function buildBudgetLine(
  element: JourPlanificationVoyage["elements"][number],
  devise: string,
  transportsById: Map<string, Transport>,
  tarifsActivites: TarifActivite[],
  tarifsHebergements: TarifHebergement[],
  globalSelections: { gamme: string; categorieClient: string }
): BudgetLine {
  const categorie = getElementCategory(element);

  if (categorie === "activite") {
    const tarifs = getActivityTarifsForElement(element.idActivite, tarifsActivites);
    const cell = buildActivityCell(tarifs, globalSelections.categorieClient);
    return {
      id: element.id,
      titre: getLineTitle(element),
      categorie,
      tarifsDisplay:
        cell.display || (element.budgetPrevu !== null ? formatMoney(element.budgetPrevu, devise) : "-"),
      moyenne: cell.moyenne || (element.budgetPrevu ?? null),
      luxe: cell.luxe,
      budgetCalcule: null,
    };
  }

  if (categorie === "hebergement") {
    const tarifs = getHebergementTarifsForElement(element.idHebergement, tarifsHebergements);
    const cell = buildHebergementCell(tarifs, globalSelections.gamme);
    return {
      id: element.id,
      titre: getLineTitle(element),
      categorie,
      tarifsDisplay: cell.display,
      moyenne: cell.moyenne,
      luxe: cell.luxe,
      budgetCalcule: null,
    };
  }

  const sharedAmount =
    categorie === "transport"
      ? getTransportAmount(element.idTransport, transportsById)
      : (element.budgetPrevu ?? null);

  const sharedCell = buildSharedCell(sharedAmount, devise);

  return {
    id: element.id,
    titre: getLineTitle(element),
    categorie,
    tarifsDisplay: sharedCell.display,
    moyenne: sharedCell.moyenne,
    luxe: sharedCell.luxe,
    budgetCalcule: null,
  };
}

// ====== COMPOSANT BADGES BUDGETS ENREGISTRÃ‰S ======

type BudgetBadgeListProps = {
  budgetsPlanification: BudgetisationPlanificationVoyage[];
  devise: string;
  isAdmin?: boolean;
  onAddBudget?: () => void;
  onEditBudget?: (budget: BudgetisationPlanificationVoyage) => void;
  onDeleteBudget?: (budgetId: string) => void;
};

function BudgetBadgeList({
  budgetsPlanification,
  devise,
  isAdmin = false,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
}: BudgetBadgeListProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold">Budgets enregistrés</h3>
          <p className="text-sm text-slate-500">
            Budgets saisis par l&apos;administrateur pour cette planification.
          </p>
        </div>

        {isAdmin ? (
          <Button size="sm" variant="outline" className="h-10 border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm hover:bg-emerald-100" onClick={onAddBudget}>
            <Plus className="size-4" />
            Ajouter un budget
          </Button>
        ) : null}
      </div>

      <div className="mt-5">
        {budgetsPlanification.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Aucun budget enregistré pour cette planification.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {budgetsPlanification.map((budget) => (
              <div
                key={budget.id}
                className="flex min-h-[150px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-100">
                    {budget.nomCategorieClient}
                  </Badge>
                  <Badge variant="outline" className="bg-white font-semibold text-slate-800">
                    {formatGamme(budget.gamme)}
                  </Badge>
                </div>

                <p className="mt-3 text-xs text-slate-500">{budget.nombrePersonnes} personne(s)</p>

                <p className="mt-2 break-words text-xl font-semibold leading-tight text-emerald-700">
                  {formatMoneySafe(budget.prixAvecReduction, devise)}
                </p>

                <div className="mt-1 min-h-5">
                  {budget.reduction > 0 ? (
                    <p className="text-xs text-slate-500">
                      Avant remise: <span className="line-through">{formatMoneySafe(budget.prixNormal, devise)}</span>
                    </p>
                  ) : null}
                </div>

                {isAdmin ? (
                  <div className="mt-auto flex items-center gap-2 pt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 border-slate-200 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => onEditBudget?.(budget)}
                      aria-label="Modifier le budget"
                    >
                      <Pencil className="size-3.5" />
                      Modifier
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 border-red-200 bg-white px-3 text-xs text-red-700 hover:bg-red-50"
                      onClick={() => onDeleteBudget?.(budget.id)}
                      aria-label="Supprimer le budget"
                    >
                      <Trash2 className="size-3.5" />
                      Supprimer
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ====== COMPOSANT TABLEAU RECAPITULATIF ======

interface RecapTableProps {
  sortedDays: JourPlanificationVoyage[];
  tarifsActivites: TarifActivite[];
  tarifsHebergements: TarifHebergement[];
  devise: string;
  planification: PlanificationVoyage;
}

function RecapTable({ sortedDays, tarifsActivites, tarifsHebergements, devise, planification }: RecapTableProps) {
  const calculateTotals = () => {
    const totals: Record<string, Record<string, number>> = {
      moyenne: {},
      luxe: {},
    };

    const transportsById = new Map(
      (planification.transports ?? []).map((transport) => [transport.id, transport] as const)
    );

    for (const day of sortedDays) {
      const categoriesDuJour = new Set<string>();
      let totalCommunDuJour = 0;

      for (const element of day.elements ?? []) {
        if (element.codeTypeElementJour === "ACTIVITE" && element.idActivite) {
          const tarifs = getActivityTarifsForElement(element.idActivite, tarifsActivites);
          tarifs.forEach((tarif) => {
            if (isNamedClientCategory(tarif.categorieClient)) {
              categoriesDuJour.add(tarif.categorieClient);
            }
          });
        }

        const categorie = getElementCategory(element);
        if (categorie === "transport") {
          totalCommunDuJour += getTransportAmount(element.idTransport, transportsById) ?? 0;
        } else if (categorie === "autre") {
          totalCommunDuJour += element.budgetPrevu ?? 0;
        }
      }

      let hebergementMoyenneParPers = 0;
      let hebergementLuxeParPers = 0;
      let aDesHebergements = false;

      for (const element of day.elements ?? []) {
        if (element.codeTypeElementJour === "HEBERGEMENT" && element.idHebergement) {
          const tarifs = getHebergementTarifsForElement(element.idHebergement, tarifsHebergements);
          for (const tarif of tarifs) {
            const gamme = normalizeGamme(tarif.gamme);
            if (gamme === "moyenne") {
              hebergementMoyenneParPers += tarif.montant;
              aDesHebergements = true;
            } else if (gamme === "luxe") {
              hebergementLuxeParPers += tarif.montant;
              aDesHebergements = true;
            }
          }
        }
      }

      const activitesParCategorie: Record<string, { moyenne: number; luxe: number }> = {};

      for (const element of day.elements ?? []) {
        if (element.codeTypeElementJour === "ACTIVITE" && element.idActivite) {
          const tarifs = getActivityTarifsForElement(element.idActivite, tarifsActivites);
          for (const tarif of tarifs) {
            const categorieClient = tarif.categorieClient;
            if (isNamedClientCategory(categorieClient)) {
              if (!activitesParCategorie[categorieClient]) {
                activitesParCategorie[categorieClient] = { moyenne: 0, luxe: 0 };
              }
              activitesParCategorie[categorieClient].moyenne += tarif.montant;
              activitesParCategorie[categorieClient].luxe += tarif.montant;
            }
          }
        }
      }

      for (const cat of categoriesDuJour) {
        const activites = activitesParCategorie[cat] || { moyenne: 0, luxe: 0 };

        if (aDesHebergements && hebergementMoyenneParPers > 0) {
          totals.moyenne[cat] =
            (totals.moyenne[cat] || 0) + totalCommunDuJour + hebergementMoyenneParPers + activites.moyenne;
        } else {
          totals.moyenne[cat] = (totals.moyenne[cat] || 0) + totalCommunDuJour + activites.moyenne;
        }

        if (aDesHebergements && hebergementLuxeParPers > 0) {
          totals.luxe[cat] =
            (totals.luxe[cat] || 0) + totalCommunDuJour + hebergementLuxeParPers + activites.luxe;
        } else {
          totals.luxe[cat] = (totals.luxe[cat] || 0) + totalCommunDuJour + activites.luxe;
        }
      }
    }

    const tripTotals: Record<string, Record<string, number>> = {
      moyenne: {},
      luxe: {},
    };
    const tripCategories = new Set<string>();
    const activityTotalsByCategory: Record<string, number> = {};
    let commonTripTotal = 0;
    let hebergementMoyenneTotal = 0;
    let hebergementLuxeTotal = 0;

    for (const day of sortedDays) {
      for (const element of day.elements ?? []) {
        const categorie = getElementCategory(element);

        if (categorie === "transport") {
          commonTripTotal += getTransportAmount(element.idTransport, transportsById) ?? 0;
        } else if (categorie === "autre") {
          commonTripTotal += element.budgetPrevu ?? 0;
        }

        if (element.codeTypeElementJour === "HEBERGEMENT" && element.idHebergement) {
          const tarifs = getHebergementTarifsForElement(element.idHebergement, tarifsHebergements);
          for (const tarif of tarifs) {
            const gamme = normalizeGamme(tarif.gamme);
            if (gamme === "moyenne") {
              hebergementMoyenneTotal += tarif.montant;
            } else if (gamme === "luxe") {
              hebergementLuxeTotal += tarif.montant;
            }
          }
        }

        if (element.codeTypeElementJour === "ACTIVITE" && element.idActivite) {
          const tarifs = getActivityTarifsForElement(element.idActivite, tarifsActivites);
          for (const tarif of tarifs) {
            const categorieClient = tarif.categorieClient;
            if (isNamedClientCategory(categorieClient)) {
              tripCategories.add(categorieClient);
              activityTotalsByCategory[categorieClient] =
                (activityTotalsByCategory[categorieClient] ?? 0) + tarif.montant;
            }
          }
        }
      }
    }

    for (const cat of tripCategories) {
      const activityTotal = activityTotalsByCategory[cat] ?? 0;
      tripTotals.moyenne[cat] = commonTripTotal + hebergementMoyenneTotal + activityTotal;
      tripTotals.luxe[cat] = commonTripTotal + hebergementLuxeTotal + activityTotal;
    }

    return tripTotals;
  };

  const totals = calculateTotals();

  const allCategories = new Set<string>();
  for (const day of sortedDays) {
    for (const element of day.elements ?? []) {
      if (element.codeTypeElementJour === "ACTIVITE" && element.idActivite) {
        const tarifs = getActivityTarifsForElement(element.idActivite, tarifsActivites);
        tarifs.forEach((tarif) => {
          if (isNamedClientCategory(tarif.categorieClient)) {
            allCategories.add(tarif.categorieClient);
          }
        });
      }
    }
  }

  const categoryList = Array.from(allCategories).sort();

  if (categoryList.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/30 shadow-sm">
      <div className="border-b border-blue-100 bg-white/70 px-4 py-3">
        <h3 className="font-semibold">Récapitulatif des tarifs</h3>
        <p className="text-xs text-slate-500">
          Gammes vs catégories client (prix par personne)
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={TABLE_HEADER_CLASS}>
            <tr>
              <th className={`${TABLE_HEADER_CELL_CLASS} text-left`}>Gamme</th>
              {categoryList.map((cat) => (
                <th key={cat} className={`${TABLE_HEADER_CELL_CLASS} text-left`}>
                  {cat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border/40">
              <td className={`${TABLE_CELL_CLASS} font-medium`}>Gamme Moyenne</td>
              {categoryList.map((cat) => {
                const value = totals.moyenne[cat];
                return (
                  <td key={`moyenne-${cat}`} className={`${TABLE_CELL_CLASS} text-muted-foreground`}>
                    {value && value > 0 ? formatMoney(value, devise) : "-"}
                  </td>
                );
              })}
            </tr>

            <tr className="border-t border-border/40">
              <td className={`${TABLE_CELL_CLASS} font-medium`}>Gamme Luxe</td>
              {categoryList.map((cat) => {
                const value = totals.luxe[cat];
                return (
                  <td key={`luxe-${cat}`} className={`${TABLE_CELL_CLASS} text-muted-foreground`}>
                    {value && value > 0 ? formatMoney(value, devise) : "-"}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ====== COMPOSANT DayBudgetTable ======

interface DayBudgetTableProps {
  day: JourPlanificationVoyage;
  lines: BudgetLine[];
  devise: string;
  globalSelections: { gamme: string; categorieClient: string };
  updateGlobalSelection: (type: "gamme" | "categorieClient", value: string) => void;
  availableGammes: string[];
  availableCategories: string[];
}

function DayBudgetTable({
  day,
  lines,
  devise,
  globalSelections,
  updateGlobalSelection,
  availableGammes,
  availableCategories,
}: DayBudgetTableProps) {
  const calculateBudgetForLine = (line: BudgetLine): number | null => {
    if (!globalSelections.gamme && !globalSelections.categorieClient) {
      return null;
    }

    if (line.categorie === "hebergement") {
      if (globalSelections.gamme && globalSelections.gamme.trim() !== "") {
        if (globalSelections.gamme === "moyenne") {
          return line.moyenne;
        }
        if (globalSelections.gamme === "luxe") {
          return line.luxe;
        }
      }
      return null;
    }

    if (line.categorie === "activite") {
      if (globalSelections.categorieClient) {
        return line.moyenne;
      }
      return null;
    }

    if (line.categorie === "transport") {
      if (globalSelections.gamme || globalSelections.categorieClient) {
        return line.moyenne;
      }
      return null;
    }

    return null;
  };

  return (
    <div className="rounded-3xl border border-border/60 bg-card/60 p-5 shadow-sm">
      <div className="mb-4 border-b border-border/40 pb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Planning journalier
        </p>
        <h3 className="mt-1 text-lg font-semibold">
          Jour {day.numeroJour ?? "-"} - {day.titre || "Sans titre"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {day.description || "Aucune description pour ce jour."}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-background/80">
        <table className="w-full min-w-[320px] text-sm">
          <thead className={TABLE_HEADER_CLASS}>
            <tr>
              <th className={`${TABLE_HEADER_CELL_CLASS} text-left`}>Bloc</th>
              <th className={`${TABLE_HEADER_CELL_CLASS} text-left`}>Catégorie</th>
              <th className={`${TABLE_HEADER_CELL_CLASS} text-left`}>Tarifs</th>
              <th className={`${TABLE_HEADER_CELL_CLASS} text-left`}>
                <div className="space-y-2">
                  <div className="font-semibold">Budget calculé</div>
                  <div className="flex gap-2 text-xs">
                    {availableGammes.length > 0 && (
                      <select
                        className="px-2 py-1 border rounded text-xs"
                        value={globalSelections.gamme}
                        onChange={(e) => updateGlobalSelection("gamme", e.target.value)}
                      >
                        <option value="">Sélectionner une gamme</option>
                        {availableGammes.map((gamme) => (
                          <option key={gamme} value={gamme}>
                            {gamme === "moyenne" ? "Moyenne" : gamme === "luxe" ? "Luxe" : gamme}
                          </option>
                        ))}
                      </select>
                    )}

                    {availableCategories.length > 0 && (
                      <select
                        className="px-2 py-1 border rounded text-xs"
                        value={globalSelections.categorieClient}
                        onChange={(e) => updateGlobalSelection("categorieClient", e.target.value)}
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {availableCategories.map((categorie) => (
                          <option key={categorie} value={categorie}>
                            {categorie}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={4} className={`${TABLE_CELL_CLASS} text-center text-muted-foreground`}>
                  Aucun bloc budget pour ce jour.
                </td>
              </tr>
            ) : (
              lines.map((line) => (
                <tr key={line.id} className="border-t border-border/40 align-top">
                  <td className={`${TABLE_CELL_CLASS} font-medium`}>{line.titre}</td>
                  <td className={`${TABLE_CELL_CLASS} text-muted-foreground`}>
                    {getCategoryLabel(line.categorie)}
                  </td>
                  <td className={`${TABLE_CELL_CLASS} text-xs text-muted-foreground whitespace-pre-line`}>
                    {line.tarifsDisplay}
                  </td>
                  <td className={`${TABLE_CELL_CLASS} text-xs`}>
                    {(() => {
                      const budget = calculateBudgetForLine(line);
                      if (
                        (globalSelections.gamme || globalSelections.categorieClient) &&
                        budget !== null &&
                        budget > 0
                      ) {
                        return <div className="text-emerald-600 font-medium">{formatMoney(budget, devise)}</div>;
                      }
                      return <span className="text-muted-foreground">-</span>;
                    })()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="border-t-2 border-border bg-muted/20">
            <tr>
              <td colSpan={3} className={`${TABLE_CELL_CLASS} font-semibold`}>
                Total sélectionné
              </td>
              <td className={`${TABLE_CELL_CLASS} text-xs font-medium text-foreground`}>
                {globalSelections.gamme || globalSelections.categorieClient ? (
                  formatMoney(
                    lines.reduce((total, line) => {
                      const budget = calculateBudgetForLine(line);
                      return total + (budget || 0);
                    }, 0),
                    devise
                  )
                ) : (
                  <span className="text-muted-foreground">Sélectionnez une option</span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ====== COMPOSANT PRINCIPAL - SectionBudget ======

function BudgetOverview({
  sortedDays,
  budgetsPlanification,
  devise,
}: {
  sortedDays: JourPlanificationVoyage[];
  budgetsPlanification: BudgetisationPlanificationVoyage[];
  devise: string;
}) {
  const prices = budgetsPlanification
    .map((budget) => budget.prixAvecReduction)
    .filter((value) => Number.isFinite(value));
  const minBudget = prices.length > 0 ? Math.min(...prices) : null;
  const maxBudget = prices.length > 0 ? Math.max(...prices) : null;
  const totalActivites = sortedDays.reduce(
    (sum, day) => sum + (day.elements?.filter((element) => element.codeTypeElementJour === "ACTIVITE").length ?? 0),
    0
  );
  const totalHebergements = sortedDays.reduce(
    (sum, day) => sum + (day.elements?.filter((element) => element.codeTypeElementJour === "HEBERGEMENT").length ?? 0),
    0
  );

  const cards = [
    {
      label: "Budget minimum",
      value: minBudget === null ? "-" : formatMoney(minBudget, devise),
      caption: "Estimation la plus basse",
      icon: WalletCards,
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Budget maximum",
      value: maxBudget === null ? "-" : formatMoney(maxBudget, devise),
      caption: "Estimation la plus élevée",
      icon: Crown,
      className: "bg-purple-50 text-purple-700",
    },
    {
      label: "Nombre de jours",
      value: `${sortedDays.length} jour(s)`,
      caption: "Durée du voyage",
      icon: Route,
      className: "bg-slate-50 text-slate-700",
    },
    {
      label: "Nombre d'activités",
      value: `${totalActivites} activité(s)`,
      caption: "Planifiées",
      icon: UsersRound,
      className: "bg-orange-50 text-orange-700",
    },
    {
      label: "Nombre d'hébergements",
      value: `${totalHebergements} hébergement(s)`,
      caption: "Sélectionnés",
      icon: Bed,
      className: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Vue d&apos;ensemble du budget</h2>
      <div className="mt-4 grid overflow-hidden rounded-xl border border-slate-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="border-b border-slate-200 bg-white p-4 last:border-b-0 sm:border-r sm:last:border-r-0 xl:border-b-0">
              <div className="flex items-center gap-2">
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${card.className}`}>
                  <Icon className="size-4" />
                </span>
                <p className="min-w-0 text-sm font-medium leading-5 text-slate-700">{card.label}</p>
              </div>
              <p className="mt-4 whitespace-pre-line text-xl font-semibold leading-tight text-emerald-700">
                {formatMetricValue(card.value)}
              </p>
              <p className="mt-2 text-xs text-slate-500">{card.caption}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getSelectedBudget(line: BudgetLine, selections: { gamme: string; categorieClient: string }) {
  if (!selections.gamme && !selections.categorieClient) return null;

  if (line.categorie === "hebergement") {
    if (selections.gamme === "luxe") return line.luxe;
    if (selections.gamme === "moyenne") return line.moyenne;
    return null;
  }

  if (line.categorie === "activite") {
    return selections.categorieClient ? line.moyenne : null;
  }

  if (line.categorie === "transport") {
    return selections.gamme || selections.categorieClient ? line.moyenne : null;
  }

  return line.moyenne;
}

function getBudgetTotal(lines: BudgetLine[], selections: { gamme: string; categorieClient: string }) {
  return lines.reduce((sum, line) => sum + (getSelectedBudget(line, selections) || 0), 0);
}

function getBudgetLineIcon(category: BudgetCategory) {
  if (category === "transport") return Route;
  if (category === "hebergement") return Bed;
  if (category === "activite") return UsersRound;
  return WalletCards;
}

function getBudgetLineTone(category: BudgetCategory) {
  if (category === "transport") return "bg-emerald-50 text-emerald-700";
  if (category === "hebergement") return "bg-purple-50 text-purple-700";
  if (category === "activite") return "bg-orange-50 text-orange-700";
  return "bg-slate-100 text-slate-600";
}

function BudgetDetailsPanel({
  dayBudgets,
  devise,
  globalSelections,
  updateGlobalSelection,
  availableGammes,
  availableCategories,
}: {
  dayBudgets: Array<{ day: JourPlanificationVoyage; lines: BudgetLine[] }>;
  devise: string;
  globalSelections: { gamme: string; categorieClient: string };
  updateGlobalSelection: (type: "gamme" | "categorieClient", value: string) => void;
  availableGammes: string[];
  availableCategories: string[];
}) {
  const [selectedDayId, setSelectedDayId] = useState(dayBudgets[0]?.day.id ?? "");
  const selected = dayBudgets.find((item) => item.day.id === selectedDayId) ?? dayBudgets[0] ?? null;
  const activeSelections = {
    gamme: globalSelections.gamme || availableGammes[0] || "",
    categorieClient: globalSelections.categorieClient || availableCategories[0] || "",
  };
  const tripTotal = dayBudgets.reduce((sum, item) => sum + getBudgetTotal(item.lines, activeSelections), 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Détails par jour</h2>
      <p className="mt-1 text-sm text-slate-500">
        Le budget est calculé automatiquement selon la gamme et la catégorie client sélectionnées.
      </p>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="grid flex-1 gap-1 text-sm font-medium text-slate-700">
          Gamme
          <select
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
            value={activeSelections.gamme}
            onChange={(event) => updateGlobalSelection("gamme", event.target.value)}
          >
            <option value="">Sélectionner une gamme</option>
            {availableGammes.map((gamme) => (
              <option key={gamme} value={gamme}>
                {formatGamme(gamme)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid flex-1 gap-1 text-sm font-medium text-slate-700">
          Catégorie client
          <select
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
            value={activeSelections.categorieClient}
            onChange={(event) => updateGlobalSelection("categorieClient", event.target.value)}
          >
            <option value="">Sélectionner une catégorie</option>
            {availableCategories.map((categorie) => (
              <option key={categorie} value={categorie}>
                {categorie}
              </option>
            ))}
          </select>
        </label>

        <Button
          type="button"
          variant="outline"
          className="h-10 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          onClick={() => {
            updateGlobalSelection("gamme", "");
            updateGlobalSelection("categorieClient", "");
          }}
        >
          <RefreshCw className="size-4" />
          Réinitialiser
        </Button>
      </div>

      {dayBudgets.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          Aucun jour disponible pour la budgétisation.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white px-4 py-5">
            <div
              className="grid min-w-[720px] items-start"
              style={{ gridTemplateColumns: `repeat(${dayBudgets.length}, minmax(120px, 1fr))` }}
            >
            {dayBudgets.map(({ day }, index) => {
              const active = selected?.day.id === day.id;
              return (
                <button
                  key={day.id}
                  type="button"
                  className="group relative px-3 pb-1 pt-1 text-center text-sm"
                  onClick={() => setSelectedDayId(day.id)}
                >
                  <span
                    className="absolute left-0 right-0 top-4 h-0.5 bg-slate-200"
                    aria-hidden="true"
                  />
                  <span
                    className={[
                      "relative z-10 mx-auto flex size-8 items-center justify-center rounded-full text-xs font-bold shadow-sm transition-colors",
                      active ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700 group-hover:bg-emerald-50",
                    ].join(" ")}
                  >
                    {day.numeroJour ?? index + 1}
                  </span>
                  <span className="mt-2 block font-semibold text-slate-950">Jour {day.numeroJour ?? index + 1}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{day.titre || "Sans titre"}</span>
                </button>
              );
            })}
            </div>
          </div>

          {selected ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-base font-bold uppercase text-slate-950">
                  Jour {selected.day.numeroJour ?? "-"} - {selected.day.titre || "Sans titre"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selected.day.description || "Aucune description pour ce jour."}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className={`${TABLE_HEADER_CELL_CLASS} text-left`}>Bloc</th>
                      <th className={`${TABLE_HEADER_CELL_CLASS} text-left`}>Catégorie</th>
                      <th className={`${TABLE_HEADER_CELL_CLASS} text-left`}>Détails</th>
                      <th className={`${TABLE_HEADER_CELL_CLASS} text-right`}>Coût estimé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={`${TABLE_CELL_CLASS} text-center text-slate-500`}>
                          Aucun bloc budget pour ce jour.
                        </td>
                      </tr>
                    ) : (
                      selected.lines.map((line) => {
                        const amount = getSelectedBudget(line, activeSelections);
                        const Icon = getBudgetLineIcon(line.categorie);
                        return (
                          <tr key={line.id} className="border-t border-slate-200 align-top">
                            <td className={`${TABLE_CELL_CLASS} font-semibold text-slate-950`}>
                              <div className="flex items-center gap-3">
                                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${getBudgetLineTone(line.categorie)}`}>
                                  <Icon className="size-4" />
                                </span>
                                <span>{line.titre}</span>
                              </div>
                            </td>
                            <td className={`${TABLE_CELL_CLASS} text-slate-600`}>{getCategoryLabel(line.categorie)}</td>
                            <td className={`${TABLE_CELL_CLASS} whitespace-pre-line text-xs text-slate-500`}>
                              {line.tarifsDisplay}
                            </td>
                            <td className={`${TABLE_CELL_CLASS} text-right font-semibold text-emerald-700`}>
                              {amount && amount > 0 ? formatMoney(amount, devise) : "-"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="border-t border-emerald-200 bg-emerald-50/70">
                    <tr>
                      <td colSpan={2} className={`${TABLE_CELL_CLASS} font-semibold text-emerald-800`}>
                        Total sélectionné pour ce jour
                      </td>
                      <td colSpan={2} className={`${TABLE_CELL_CLASS} text-right text-lg font-bold text-emerald-700`}>
                        {formatMoney(getBudgetTotal(selected.lines, activeSelections), devise)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <span className="font-semibold text-emerald-800">Total du voyage ({dayBudgets.length} jour(s))</span>
            <span className="text-xl font-bold text-emerald-700">{formatMoney(tripTotal, devise)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function SectionBudget({
  planification,
  sortedDays,
  tarifsActivites,
  tarifsHebergements,
  budgetsPlanification = [],
  isAdmin = false,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
}: Props) {
  const devise = planification.deviseBudget || "MGA";

  const [globalSelections, setGlobalSelections] = useState({
    gamme: "",
    categorieClient: "",
  });

  const updateGlobalSelection = (type: "gamme" | "categorieClient", value: string) => {
    setGlobalSelections((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const availableGammes = useMemo(
    () => getUniqueGammes(sortedDays, tarifsHebergements),
    [sortedDays, tarifsHebergements]
  );

  const availableCategories = useMemo(
    () => getUniqueClientCategories(sortedDays, tarifsActivites),
    [sortedDays, tarifsActivites]
  );

  const transportsById = useMemo(
    () => new Map((planification.transports ?? []).map((transport) => [transport.id, transport] as const)),
    [planification.transports]
  );

  const dayBudgets = useMemo(
    () =>
      sortedDays.map((day) => {
        const lines = (day.elements ?? []).map((element) =>
          buildBudgetLine(
            element,
            devise,
            transportsById,
            tarifsActivites,
            tarifsHebergements,
            globalSelections
          )
        );
        return { day, lines };
      }),
    [sortedDays, devise, transportsById, tarifsActivites, tarifsHebergements, globalSelections]
  );

  return (
    <Card className="overflow-hidden border-slate-200 bg-slate-50/60 shadow-sm">
      <CardHeader className="border-b border-slate-200 bg-white">
        <CardTitle>Budgétisation</CardTitle>
        <CardDescription>
          Vue d&apos;ensemble et détails journaliers de la budgétisation du voyage.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <BudgetOverview
          sortedDays={sortedDays}
          budgetsPlanification={budgetsPlanification}
          devise={devise}
        />

        <BudgetDetailsPanel
          dayBudgets={dayBudgets}
          devise={devise}
          globalSelections={globalSelections}
          updateGlobalSelection={updateGlobalSelection}
          availableGammes={availableGammes}
          availableCategories={availableCategories}
        />

        <div className="hidden">
          <h2 className="text-lg font-semibold text-slate-950">Détails par jour</h2>
          <p className="mt-1 text-sm text-slate-500">
            Le budget est calculé automatiquement selon la gamme et la catégorie client sélectionnées.
          </p>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Gamme
              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
                value={globalSelections.gamme}
                onChange={(e) => updateGlobalSelection("gamme", e.target.value)}
              >
                <option value="">Sélectionner une gamme</option>
                {availableGammes.map((gamme) => (
                  <option key={gamme} value={gamme}>
                    {formatGamme(gamme)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Catégorie client
              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
                value={globalSelections.categorieClient}
                onChange={(e) => updateGlobalSelection("categorieClient", e.target.value)}
              >
                <option value="">Sélectionner une catégorie</option>
                {availableCategories.map((categorie) => (
                  <option key={categorie} value={categorie}>
                    {categorie}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="outline"
              className="h-10 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => setGlobalSelections({ gamme: "", categorieClient: "" })}
            >
              <RefreshCw className="size-4" />
              Réinitialiser
            </Button>
          </div>
        </div>

        <div className="hidden">
          <h2 className="text-xl font-semibold">Détails par jour</h2>

          {dayBudgets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
              Aucun jour disponible pour la budgétisation.
            </div>
          ) : (
            dayBudgets.map(({ day, lines }) => (
              <DayBudgetTable
                key={day.id}
                day={day}
                lines={lines}
                devise={devise}
                globalSelections={globalSelections}
                updateGlobalSelection={updateGlobalSelection}
                availableGammes={availableGammes}
                availableCategories={availableCategories}
              />
            ))
          )}
        </div>

        <RecapTable
          planification={planification}
          sortedDays={sortedDays}
          tarifsActivites={tarifsActivites}
          tarifsHebergements={tarifsHebergements}
          devise={devise}
        />

        <BudgetBadgeList
          budgetsPlanification={budgetsPlanification}
          devise={devise}
          isAdmin={isAdmin}
          onAddBudget={onAddBudget}
          onEditBudget={onEditBudget}
          onDeleteBudget={onDeleteBudget}
        />
      </CardContent>
    </Card>
  );
}
