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
