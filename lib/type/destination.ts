export interface DestinationDetails {
  id: string;
  title: string;
  description: string;
  image: string;
  price: string;
  rating?: number;
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
  marketing: string[];
  features?: string[];
  galleryPrimary?: string[];
  galleryAll?: string[];
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
  marketing?: DestinationMarketingItem[];
};

export type DestinationMarketingItem = {
  id: string;
  libelle: string;
  description: string | null;
  ordreAffichage: number | null;
  estActif: boolean;
  dateCreation?: string;
  dateModification?: string;
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

export type TypeElementJour = {
  id: string;
  nom: string;
  code: string;
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
  budgetPrevu: number | null;
  geojsonTrajet: string;
  dateCreation?: string;
  dateModification?: string;
  idTypeTransport: string;
  nomTypeTransport: string;
  idPlanificationVoyage: string;
};

export type ElementJourPlanification = {
  id: string;
  titre: string | null;
  description: string | null;
  heureDebut: string | null;
  heureFin: string | null;
  ordreAffichage: number | null;
  budgetPrevu: number | null;
  minimumTarifParPersonne: number | null;
  maximumTarifParPersonne: number | null;
  devise: string | null;
  estActif: boolean;
  dateCreation?: string;
  dateModification?: string;
  idJourPlanificationVoyage: string;
  idTypeElementJour: string;
  nomTypeElementJour: string | null;
  codeTypeElementJour: string | null;
  idTransport: string | null;
  nomTransport: string | null;
  idActivite: string | null;
  nomActivite: string | null;
  idHebergement: string | null;
  nomHebergement: string | null;
};

export type JourPlanificationVoyage = {
  id: string;
  numeroJour: number | null;
  dateJour: string | null;
  titre: string | null;
  description: string | null;
  dateCreation?: string;
  dateModification?: string;
  idPlanificationVoyage: string;
  minimumTarifParPersonne: number | null;
  maximumTarifParPersonne: number | null;
  elements: ElementJourPlanification[];
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
  jours: JourPlanificationVoyage[];
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

export type SaveDestinationMarketingPayload = {
  libelle: string;
  description?: string | null;
  ordreAffichage?: number | null;
  estActif?: boolean;
};

export type SaveTypeTransportPayload = {
  nom: string;
};

export type SaveTypeElementJourPayload = {
  nom: string;
  code: string;
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
  budgetPrevu?: number | null;
  geojsonTrajet?: string;
  idTypeTransport: string;
  idPlanificationVoyage: string;
};

export type SaveJourPlanificationVoyagePayload = {
  numeroJour?: number | null;
  dateJour?: string | null;
  titre: string;
  description: string;
  idPlanificationVoyage?: string;
};

export type SaveElementJourPlanificationPayload = {
  titre: string;
  description: string;
  heureDebut?: string | null;
  heureFin?: string | null;
  ordreAffichage?: number | null;
  budgetPrevu?: number | null;
  devise?: string | null;
  estActif?: boolean;
  idJourPlanificationVoyage: string;
  idTypeElementJour: string;
  idTransport?: string | null;
  idActivite?: string | null;
  idHebergement?: string | null;
};
