export type ReservationStatus =
  | "EN_ATTENTE"
  | "A_REVOIR"
  | "EN_ATTENTE_DISPONIBILITE"
  | "VALIDEE"
  | "ANNULEE";

export type ReservationSource = "PRIX_DIRECT" | "SIMULATION";

export type VoyageurProfile = {
  categorieClientId: string;
  gamme: string;
  nombrePersonnes: number;
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
  elementsSelectionnes: string[];
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
}

export interface ReservationCreatePayload {
  utilisateurId?: string;
  source?: ReservationSource;
  destinationId: string;
  planificationVoyageId: string;
  categorieClientId: string;
  gamme: string;
  nombrePersonnes: number;
  profilsVoyageurs?: VoyageurProfile[];
  commentaireClient?: string;
  elementsSelectionnes?: string[];
  resumeSimulation?: string;
}

export interface ReservationStatusUpdatePayload {
  status: ReservationStatus;
  commentaireAdmin?: string;
}
