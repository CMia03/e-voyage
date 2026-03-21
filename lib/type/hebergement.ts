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
