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
  photos: PhotoDestination[];
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
