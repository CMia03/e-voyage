export interface DestinationDetails {
  id: string;
  title: string;
  description: string;
  image: string;
  price: string;
  priceDetails?: {
    shared4?: string;
    shared2?: string;
    children?: string;
  };
  duration: string;
  dates?: string;
  departure?: {
    time: string;
    location: string;
  };
  included: string[];
  notIncluded: string[];
  features: string[];
  gallery: string[];
  reservation?: {
    deposit: string;
    phone: string;
    orangeMoney?: string;
    infoPhone?: string;
  };
}

export type PhotoDestination = {
  id: string;
  titre: string;
  description: string;
  ordreAffichage: number;
  url: string;
  estPrincipale: boolean;
  dateObtenir?: string;
};

export type PhotoDestinationGroup = {
  titre: string;
  description: string;
  ordreAffichage: number;
  estPrincipale: boolean;
  dateObtenir?: string;
  images: PhotoDestination[];
};

export type AdminDestination = {
  id: string;
  nom: string;
  slug: string;
  description: string;
  adresse: string;
  urlImagePrincipale: string;
  latitude: number;
  longitude: number;
  nombreEtoiles: number;
  estActif: boolean;
  dateCreation?: string;
  dateModification?: string;
  region: string;
  district: string;
  commune: string;
  photos: PhotoDestinationGroup[];
};

export type DestinationAssociationItem = {
  id: string;
  nom: string;
  image: string | null;
  place: string | null;
  region: string | null;
  meta?: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  estSelectionne: boolean;
  estActif: boolean;
};

export type DestinationAssociations = {
  idDestination: string;
  nomDestination: string;
  hebergements: DestinationAssociationItem[];
  activites: DestinationAssociationItem[];
  prestations: DestinationPrestationItem[];
};

export type DestinationPrestationItem = {
  id: string;
  libelle: string;
  description: string | null;
  ordreAffichage: number | null;
  estSelectionne: boolean;
  estActif: boolean;
  statut: "INCLUS" | "EN_SUS";
};

export type TypeTransport = {
  id: string;
  nom: string;
  dateCreation?: string;
  dateModification?: string;
};

export type Transport = {
  id: string;
  ordreEtape: number | null;
  depart: string;
  arrivee: string;
  longitudeDepart: number | null;
  latitudeDepart: number | null;
  longitudeArrivee: number | null;
  latitudeArrivee: number | null;
  duree: string;
  distanceKm: number | null;
  geojsonTrajet: string;
  dateCreation?: string;
  dateModification?: string;
  idTypeTransport: string;
  nomTypeTransport: string;
  idPlanificationVoyage: string;
};

export type PlanificationVoyage = {
  id: string;
  nomPlanification: string;
  budgetTotal: number | null;
  deviseBudget: string;
  dateHeureDebut: string | null;
  depart: string;
  dateHeureFin: string | null;
  arriver: string;
  dateCreation?: string;
  dateModification?: string;
  idDestination: string;
  nomDestination: string;
  transports: Transport[];
};

export type SaveDestinationPayload = {
  nom: string;
  slug: string;
  description: string;
  adresse: string;
  urlImagePrincipale: string;
  imageFile?: File | null;
  latitude: number;
  longitude: number;
  nombreEtoiles: number;
  estActif: boolean;
  region: string;
  district: string;
  commune: string;
};

export type SavePhotoDestinationBulkPayload = {
  titre: string;
  description: string;
  ordreAffichage: number;
  estPrincipale: boolean;
  dateObtenir: string;
  imageFiles: File[];
};

export type SaveTypeTransportPayload = {
  nom: string;
};

export type SavePlanificationVoyagePayload = {
  nomPlanification: string;
  budgetTotal?: number | null;
  deviseBudget: string;
  dateHeureDebut?: string;
  depart: string;
  dateHeureFin?: string;
  arriver: string;
  idDestination: string;
};

export type SaveTransportPayload = {
  ordreEtape?: number | null;
  depart: string;
  arrivee: string;
  longitudeDepart?: number | null;
  latitudeDepart?: number | null;
  longitudeArrivee?: number | null;
  latitudeArrivee?: number | null;
  duree: string;
  distanceKm?: number | null;
  geojsonTrajet?: string;
  idTypeTransport: string;
  idPlanificationVoyage: string;
};
