export type Activite = {
  id: string;
  nom: string;
  slug: string;
  description: string;
  imagePrincipale: string;
  dureeHeures: number;
  participantMin: number;
  participantsMax: string;
  niveauxDeDifficulte: string;
  latitude: number;
  longitude: number;
  estActif: boolean;
  dateCreation: string;
  idCategorie: string;
  nomCategorie: string;
  equipementsFournis: string[];
  tarifs: TarifActivite[];
  photos: PhotoActivite[];
};

export type SaveActivitePayload = {
  nom: string;
  slug: string;
  description: string;
  imagePrincipale: string;
  imageFile?: File | null;
  dureeHeures: number;
  participantMin: number;
  participantsMax: string;
  niveauxDeDifficulte: string;
  latitude: number;
  longitude: number;
  estActif: boolean;
  idCategorie: string;
  equipementsFournis: string[];
};

export type CategorieActivite = {
  id: string;
  nom: string;
  dateCreation: string;
  dateModification: string;
};

export type CategorieClientActivite = {
  id: string;
  nom: string;
  dateCreation: string;
  dateModification: string;
};

export type TarifActivite = {
  id: string;
  idCategorieClient: string | null;
  nomCategorieClient: string | null;
  prixParPersonne: number | null;
  prixParHeur: number | null;
  devise: string;
  estActif: boolean;
  dateValiditeDebut: string | null;
  dateValiditeFin: string | null;
  dateCreation: string;
  dateModification: string | null;
  idActivite: string;
  nomActivite: string;
};

export type PhotoActivite = {
  id: string;
  urlImage: string;
  idActivite: string;
};

export type SaveTarifActivitePayload = {
  idCategorieClient: string;
  prixParPersonne?: number | null;
  prixParHeur?: number | null;
  devise: string;
  estActif: boolean;
  dateValiditeDebut?: string;
  dateValiditeFin?: string;
  idActivite: string;
};

export type SavePhotoActivitePayload = {
  imageFiles: File[];
};
