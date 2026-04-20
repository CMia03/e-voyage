"use client";

// COMPOSANT SECTION BUDGET
// Affiche un tableau détaillé de budgétisation pour un voyage planifié
// + Budgets enregistrés (CRUD admin / lecture publique)

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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

type Gamme = "MOYENNE" | "LUXE";

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

function formatMoneySafe(value: number | null | undefined, devise: string): string {
  if (value === null || value === undefined) return `- ${devise}`;
  return `${formatAmount(value)} ${devise}`;
}

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  activite: "Activité",
  hebergement: "Hébergement",
  transport: "Transport",
  autre: "Autre",
};

function getCategoryLabel(category: BudgetCategory): string {
  return CATEGORY_LABELS[category];
}

// ====== FONCTIONS D'EXTRACTION DES CATÉGORIES UNIQUES ======

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
          if (tarif.gamme) {
            gammes.add(tarif.gamme.toLowerCase());
          }
        });
      }
    }
  }

  return Array.from(gammes).sort();
}

// ====== FONCTIONS D'EXTRACTION DE DONNÉES ======

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
        gamme: item.gamme as Gamme,
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
      ? tarifs.filter((item) => {
          const gamme = item.gamme ?? "";
          if (gamme === "") return false;
          return gamme.toLowerCase() === selectedGamme.toLowerCase();
        })
      : tarifs;

  const display = filteredTarifs
    .map((item) => {
      const prixTotal = item.montant * (item.capacite || 1);
      return `${formatMoney(prixTotal, item.devise)} (${item.nomTypeChambre || "Sans type"} - Cap: ${
        item.capacite || 0
      }) - ${formatMoney(item.montant, item.devise)}/pers`;
    })
    .join("\n");

  const totalParPersonne = filteredTarifs.reduce((sum, item) => sum + item.montant, 0) || null;

  return {
    moyenne: totalParPersonne,
    luxe: totalParPersonne,
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

// ====== COMPOSANT BADGES BUDGETS ENREGISTRÉS ======

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
    <div className="rounded-2xl border border-border/50 bg-background/80 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border/50 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Budgets enregistrés</h3>
          <p className="text-xs text-muted-foreground">
            Budgets saisis par l’administrateur pour cette planification.
          </p>
        </div>

        {isAdmin ? (
          <Button size="sm" onClick={onAddBudget}>
            <Plus className="size-4" />
            Ajouter un budget
          </Button>
        ) : null}
      </div>

      

      <div className="p-4">
        {budgetsPlanification.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            Aucun budget enregistré pour cette planification.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {budgetsPlanification.map((budget) => (
              <div
                key={budget.id}
                className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-sm"
              >
                <Badge variant="secondary">{budget.nomCategorieClient}</Badge>
                <Badge variant="outline">{budget.gamme}</Badge>

                <span className="text-xs text-muted-foreground">{budget.nombrePersonnes} pers</span>

                {budget.reduction > 0 ? (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatMoneySafe(budget.prixNormal, devise)}
                  </span>
                ) : null}

                <span className="text-sm font-medium text-emerald-600">
                  {formatMoneySafe(budget.prixAvecReduction, devise)}
                </span>

                {budget.reduction > 0 ? (
                  <Badge variant="outline">-{budget.reduction}%</Badge>
                ) : null}

                {isAdmin ? (
                  <div className="ml-1 flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => onEditBudget?.(budget)}
                    >
                      <Pencil className="size-4" />
                    </Button>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => onDeleteBudget?.(budget.id)}
                    >
                      <Trash2 className="size-4" />
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

// ====== COMPOSANT TABLEAU RÉCAPITULATIF ======

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
            if (tarif.categorieClient && tarif.categorieClient !== "Sans catégorie") {
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
            const gamme = tarif.gamme?.toLowerCase() || "moyenne";
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
            if (categorieClient && categorieClient !== "Sans catégorie") {
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

    return totals;
  };

  const totals = calculateTotals();

  const allCategories = new Set<string>();
  for (const day of sortedDays) {
    for (const element of day.elements ?? []) {
      if (element.codeTypeElementJour === "ACTIVITE" && element.idActivite) {
        const tarifs = getActivityTarifsForElement(element.idActivite, tarifsActivites);
        tarifs.forEach((tarif) => {
          if (tarif.categorieClient && tarif.categorieClient !== "Sans catégorie") {
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
    <div className="rounded-2xl border border-border/50 bg-background/80 overflow-hidden mb-6">
      <div className="bg-muted/20 px-4 py-3 border-b border-border/50">
        <h3 className="font-semibold">Récapitulatif des tarifs</h3>
        <p className="text-xs text-muted-foreground">
          Gammes vs Catégories client (prix par personne)
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
      if (globalSelections.categorieClient) {
        return line.moyenne;
      }
      return null;
    }

    if (line.categorie === "activite") {
      if (globalSelections.categorieClient) {
        return line.moyenne;
      }
      if (globalSelections.gamme) {
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
    <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
      <CardHeader className="border-b border-border/50 bg-muted/20">
        <CardTitle>Budgétisation</CardTitle>
        <CardDescription>
          Vue d&apos;ensemble et détails journaliers de la budgétisation du voyage.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <BudgetBadgeList
          budgetsPlanification={budgetsPlanification}
          devise={devise}
          isAdmin={isAdmin}
          onAddBudget={onAddBudget}
          onEditBudget={onEditBudget}
          onDeleteBudget={onDeleteBudget}
        />

        <RecapTable
          planification={planification}
          sortedDays={sortedDays}
          tarifsActivites={tarifsActivites}
          tarifsHebergements={tarifsHebergements}
          devise={devise}
        />

        <div className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
