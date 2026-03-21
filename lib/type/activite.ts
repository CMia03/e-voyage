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
