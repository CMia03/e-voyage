export type ReservationStatus =
  | "EN_ATTENTE"
  | "VALIDEE"
  | "ANNULEE";

export type ReservationSource = "PRIX_DIRECT" | "SIMULATION";

export type VoyageurProfile = {
  categorieClientId: string;
  gamme: string;
  nombrePersonnes: number;
};

export type ElementSelection = {
  elementId: string;
  nomElement?: string | null;
  quantite: number;
  type?: string;
};

export interface ReservationDetail {
  id: string;
  destinationId: string;
  nomDestination: string;
  planificationVoyageId: string;
  nomPlanification: string;
  categorieClientId: string;
  nomCategorieClient: string;
  gamme: string;
  nombrePersonnes: number;
  prixUnitaire: number;
  prixTotal: number;
  elementsSelectionnes: ElementSelection[];
  resumeSimulation: string | null;
  dateCreation: string;
}

export interface Reservation {
  id: string;
  reference: string;
  status: ReservationStatus;
  source: ReservationSource;
  montantTotal: number;
  devise: string;
  commentaireClient: string | null;
  commentaireAdmin: string | null;
  clientNom?: string | null;
  clientPrenom?: string | null;
  clientContact?: string | null;
  elementsSelectionnes: ElementSelection[];
  resumeSimulation: string | null;
  dateReservation: string;
  dateModification: string | null;
  utilisateurId: string;
  nomUtilisateur: string;
  prenomUtilisateur: string;
  emailUtilisateur: string;
  details: ReservationDetail[];
}

export interface ReservationQuote {
    devise: string;
    prixUnitaire: number;
    prixTotal: number;
    dureeJours: number;
    lignes?: Array<{
      categorieClientId: string;
      categorieClientNom: string;
      gamme: string;
      nombrePersonnes: number;
      prixUnitaire: number;
      prixTotal: number;
    }>;
  }

export interface ReservationCreatePayload {
  utilisateurId?: string;
  clientNom?: string;
  clientPrenom?: string;
  clientContact?: string;
  source?: ReservationSource;
  destinationId: string;
  planificationVoyageId: string;
  categorieClientId: string;
  gamme: string;
  nombrePersonnes: number;
  profilsVoyageurs?: VoyageurProfile[];
  commentaireClient?: string;
  elementsSelectionnes?: ElementSelection[];
  resumeSimulation?: string;
}

export interface ReservationStatusUpdatePayload {
  status: ReservationStatus;
  commentaireAdmin?: string;
}
