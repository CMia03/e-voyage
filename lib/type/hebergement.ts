export type Hebergement = {
  id: string;
  nom: string;
  slug: string;
  description: string;
  adresse: string;
  urlImagePrincipale: string;
  latitude: number;
  longitude: number;
  nombreEtoiles: number;
  telephone: string;
  email: string;
  siteWeb: string;
  estActif: boolean;
  dateCreation: string;
  dateModification: string;
  idTypeHebergement: string;
  nomTypeHebergement: string;
  idsPlus: string[];
  equipements: string[];
  tarifs: TarifHebergement[];
};

export type SaveHebergementPayload = {
  nom: string;
  slug: string;
  description: string;
  adresse: string;
  urlImagePrincipale: string;
  imageFile?: File | null;
  latitude: number;
  longitude: number;
  nombreEtoiles: number;
  telephone: string;
  email: string;
  siteWeb: string;
  estActif: boolean;
  idTypeHebergement: string;
  idsPlus: string[];
};

export type TypeHebergement = {
  id: string;
  nom: string;
  dateCreation: string;
  dateModification: string;
};

export type EquipementHebergement = {
  id: string;
  equipement: string;
  dateCreation: string;
  dateModification: string;
};

export type TypeChambre = {
  id: string;
  nom: string;
  dateCreation: string;
  dateModification: string;
};

export type TypeSalle = {
  id: string;
  nom: string;
  dateCreation: string;
  dateModification: string;
};

export type PhotoHebergementChambre = {
  id: string;
  urlImage: string;
  idTypeSalle: string;
  nomTypeSalle: string;
};

export type TarifHebergement = {
  id: string;
  prixReservation: number | null;
  prixParNuit: number;
  devise: string;
  capacite: number;
  petitDejeunerInclus: boolean;
  estActif: boolean;
  dateValiditeDebut: string | null;
  dateValiditeFin: string | null;
  dateCreation: string;
  dateModification: string | null;
  idTypeChambre: string;
  nomTypeChambre: string;
  idHebergement: string;
  nomHebergement: string;
  photos: PhotoHebergementChambre[];
};

export type SaveTarifHebergementPayload = {
  prixReservation?: number | null;
  prixParNuit: number;
  devise: string;
  capacite: number;
  petitDejeunerInclus: boolean;
  estActif: boolean;
  dateValiditeDebut?: string;
  dateValiditeFin?: string;
  idTypeChambre: string;
  idHebergement: string;
};

export type SaveTarifPhotoPayload = {
  idTypeSalle: string;
  imageFiles: File[];
};
