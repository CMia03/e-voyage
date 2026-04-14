export type BudgetisationPlanificationVoyage = {
  id: string;
  idPlanificationVoyage: string;
  nomPlanificationVoyage?: string | null;
  idCategorieClient: string;
  nomCategorieClient: string;
  gamme: string;
  prixNormal: number;
  reduction: number;
  prixAvecReduction: number;
  nombrePersonnes: number;
  dateCreation?: string;
  dateModification?: string;
};

export type SaveBudgetisationPlanificationVoyagePayload = {
  idPlanificationVoyage: string;
  idCategorieClient: string;
  gamme: string;
  prixNormal: number;
  reduction?: number | null;
  nombrePersonnes: number;
};