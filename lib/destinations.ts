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

export const destinationsData: DestinationDetails[] = [
  {
    id: "manambato",
    title: "Manambato",
    description: "Un havre de paix au bord du canal des Pangalanes, parfait pour se ressourcer en pleine nature. Découvrez la vie authentique malgache.",
    image: "/images/Manbt1.jpg",
    price: "À partir de 450.000 AR",
    priceDetails: {
      shared4: "450.000 AR/personne (4 par chambre)",
      shared2: "500.000 AR/personne (2 par chambre)"
    },
    duration: "5 jours et 4 nuits",
    dates: "8 au 12 septembre 2025",
    departure: {
      time: "6h",
      location: "Maraina Ampasapito - Gare routière"
    },
    included: [
      "Transport aller et retour Tana - Manambato - Tana",
      "Repas sur place",
      "Hébergement",
      "Visite du parc Le Palmarium (Ankany Ny Nofy)",
      "Ticket d'entrée et guide",
      "Visite du village Le Sable Blanc",
      "Visite du village d'Ambila Lemaintso",
      "Balade en bateau vers le canal de Pangalana",
      "Collation offerte"
    ],
    notIncluded: [
      "Repas sur route",
      "Eau minérale",
      "Dépenses personnelles",
      "Goûter"
    ],
    features: [
      "Navigation sur le canal",
      "Observation de la faune",
      "Village authentique",
      "Découverte culturelle"
    ],
    gallery: [
      "/images/Manbt1.jpg",
      "/images/mnabt5.jpg",
      "/images/mnbt4.jpg",
      "/images/mnbt3.jpg",
      "/images/mnbt2.jpg"
    ],
    reservation: {
      deposit: "25%",
      phone: "0346688542",
      orangeMoney: "0325559616",
      infoPhone: "0346688542"
    }
  },
  {
    id: "ambila-lemaintso",
    title: "Ambila Lemaintso - Manambato",
    description: "Découvrez cette station balnéaire idyllique avec ses plages de sable fin et ses eaux turquoise. Un paradis tropical au bord de l'océan Indien. Aventure en train et balade en bateau vers le canal de Pangalana.",
    image: "/images/mbntb8188311489601893394_n.jpg",
    price: "À partir de 300.000 AR",
    priceDetails: {
      shared4: "350.000 AR/personne (4 par chambre)",
      shared2: "400.000 AR/personne (2 par chambre)",
      children: "300.000 AR/personne (enfants)"
    },
    duration: "4 jours (3 au 6 août)",
    dates: "3 au 6 août 2025",
    departure: {
      time: "6h",
      location: "Maraina EO Mahamasina devant Kianja Barea"
    },
    included: [
      "Transport aller et retour",
      "Aventure en train (Mafinaritra io an)",
      "Balade en bateau vers le canal de Pangalana",
      "Hébergement",
      "Pension complète sur place",
      "Visite du village Le Sable Blanc",
      "Village de pêcheurs",
      "Surprise"
    ],
    notIncluded: [
      "Repas sur route",
      "Goûter",
      "Dépenses personnelles",
      "Eau minérale"
    ],
    features: [
      "Plages paradisiaques",
      "Aventure en train",
      "Balade en bateau",
      "Villages authentiques",
      "Hébergement confortable",
      "Pension complète"
    ],
    gallery: [
      "/images/65878577347693840355_n.jpg",
      "/images/Manbt1.jpg",
      "/images/mnabt5.jpg",
      "/images/mnbt4.jpg",
      "/images/mnbt2.jpg",
    ],
    reservation: {
      deposit: "25%",
      phone: "0346688542",
      orangeMoney: "0325559616",
      infoPhone: "034 66 885 42"
    }
  },
  {
    id: "sainte-marie",
    title: "Sainte-Marie",
    description: "L'île aux trésors avec ses baleines à bosse, ses plages de rêve et son histoire fascinante de pirates. Une destination unique et magique. Île paradisiaque !",
    image: "/images/stMarie1.jpg",
    price: "1.050.000 AR/personne",
    priceDetails: {
      shared2: "1.050.000 AR/personne (à base de 2 par chambre)"
    },
    duration: "8 jours",
    dates: "9 au 16 septembre 2025 ou 21 au 28 septembre 2025",
    departure: {
      time: "6h",
      location: "Maraina EO Ampasapito - Gare routière"
    },
    included: [
      "Transfert (terrestre - maritime aller retour)",
      "Hébergement (2 nuitées à Tamatave, 5 nuitées à Sainte-Marie)",
      "Pension complète sur place (à Sainte-Marie)",
      "Les droits de visite au site touristique",
      "Axe Sud : Tour île aux Nattes, Maison Blanche, La Pointe",
      "Axe Est : La Plage, Baie d'Ampanihy, Mangrove, Déjeuner au restaurant 'Chez Nono'",
      "Axe Nord : Les Cascades, Piscine naturelle",
      "Au centre ville : 1ère église catholique",
      "Cimetière des pirates, Îlot Forban, Îlot Madame",
      "Quartier libre"
    ],
    notIncluded: [
      "Repas sur route",
      "Besoin perso",
      "Goûter",
      "Eau minérale"
    ],
    features: [
      "Observation des baleines",
      "Plongée sous-marine",
      "Sites historiques",
      "Cocotiers et lagons",
      "Île paradisiaque"
    ],
    gallery: [
      "/images/stMarie1.jpg",
      "/images/stMarie2.jpg",
      "/images/stMarie3.jpg",
      "/images/stMarie4.jpg",
      "/images/stmarie251097444023115_6618703185983009317_n.jpg",
      "/images/stmarie40274023115_5224698941739936907_n.jpg"
    ],
    reservation: {
      deposit: "25%",
      phone: "0346688542",
      orangeMoney: "0325559616",
      infoPhone: "034 66 885 42"
    }
  },
  {
    id: "le-grand-sud",
    title: "Le Grand Sud",
    description: "Explorez les paysages époustouflants du sud malgache : baobabs majestueux, canyons impressionnants et plages sauvages. Une aventure inoubliable. Tena ahita tany anie ee !",
    image: "/images/sud1.jpg",
    price: "1.700.000 AR/personne",
    duration: "10 jours (1 au 10 septembre)",
    dates: "1 au 10 septembre 2025",
    departure: {
      time: "6h",
      location: "Tana - Maraina Mahamasina devant Kianja Barea"
    },
    included: [
      "Transport aller-retour en 4x4",
      "Hébergement (2 par chambre)",
      "Repas à Fort Dauphin",
      "Divers activités",
      "Visite des sites touristiques",
      "Excursion",
      "Route aller : RN13 (Tana - Fiarantsoa - Isoanala - Betroka - Beraketa - Ambovombe - Amboasary - Fort Dauphin)",
      "Route retour : RN12 (Fort Dauphin - Manantenina - Vangaindrano - Manakara - Ranomafana - Tana)",
      "Domaine du cascade à Manatantely (Détente, piscine naturelle, cascade)",
      "Visite du village de pêcheurs à Ambinanibe",
      "Port Ehoala",
      "Parc Nahampoana",
      "Plage Lakaro",
      "Plage Bevava",
      "Plage Ankoba",
      "Excursion à Evatraha",
      "Plage de Libanona (juste en bas de l'hôtel)"
    ],
    notIncluded: [
      "Repas sur route",
      "Eau minérale",
      "Goûter",
      "Dépenses personnelles"
    ],
    features: [
      "Allée des baobabs",
      "Parcs nationaux",
      "Plages paradisiaques",
      "Cascades et piscines naturelles",
      "Villages authentiques",
      "Aventure en 4x4",
      "Tena ahita tany anie !"
    ],
    gallery: [
      "/images/sud1.jpg",
      "/images/sud2.jpg",
      "/images/sud6.jpg",
      "/images/sud.jpg",
    
    ],
    reservation: {
      deposit: "25%",
      phone: "0346688542",
      orangeMoney: "0325559616",
      infoPhone: "034 66 885 42"
    }
  }
];

export function getDestinationById(id: string): DestinationDetails | undefined {
  return destinationsData.find(dest => dest.id === id);
}

