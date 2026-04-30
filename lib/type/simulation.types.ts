
export type VoyageurProfile = {
    categorieClientId: string;
    gamme: string;
    nombrePersonnes: number;
};

export type ElementSelection = {
    elementId: string;
    quantite: number;
};

export type SimulationRequest = {
    destinationId: string;
    planificationId: string;
    budgetClient: number;
    idCategorieClient: string;
    gamme: string;
    nombrePersonnes: number;
    profilsVoyageurs?: VoyageurProfile[];
    elementsSelectionnes?: ElementSelection[];
};

export type SeuilMinimumRequest = {
    destinationId: string;
    planificationId: string;
    idCategorieClient: string;
    gamme: string;
    nombrePersonnes: number;
    profilsVoyageurs?: VoyageurProfile[];
};

export type SeuilMinimumResponse = {
    coutObligatoire: number;
    margeMinimale: number;
    seuilMinimum: number;
};

export type DestinationType = {
    id: string;
    title: string;
    image: string;
    description: string;
    price: string;
};

export type PlanificationType = {
    id: string;
    nomPlanification: string;
    budgetTotal: number | null;
    jours?: unknown[];
    dateHeureDebut?: string | null;
    dateHeureFin?: string | null;
    depart?: string | null;
    arriver?: string | null;
    description?: string | null;
};

export type CategorieType = {
    id: string;
    nom: string;
};

export type ElementDetail = {
    capacite?: number;
    prixParNuit?: number;
    prixParPersonne?: number;
    nombreEtoiles?: number;
    adresse?: string;
    telephone?: string;
    duree?: string;
    difficulte?: string;
    participantMin?: number;
    participantsMax?: number;
    depart?: string;
    arrivee?: string;
    distance?: string;
    images?: string[];
};

export type ElementSimulation = {
    id: string;
    titre: string;
    type: string;
    prix: number;
    obligatoire: boolean;
    coche: boolean;
    quantiteSelectionnee?: number;
    quantiteMax?: number;
    details: ElementDetail;
};

export type JourSimulation = {
    numeroJour: number;
    titre: string;
    totalJour: number;
    elements: ElementSimulation[];
};

export type Recap = {
    budgetClient: number;
    coutObligatoire: number;
    margeMinimale: number;
    seuilMinimum: number;
    restePourOptionnels: number;
};

export type Resume = {
    totalObligatoire: number;
    totalOptionnel: number;
    totalCoche: number;
    margeBrute?: number;
    totalAvecMarge?: number;
    budgetClient: number;
    reste: number;
    obligatoiresCoches: number;
    optionnelsCoches: number;
};

export type SuggestionItem = {
    type: string;
    message: string;
    valeur: number | string | boolean | null;
};

export type SimulationResponse = {
    success: boolean;
    message: string;
    error?: string;
    recap?: Recap;
    jours?: JourSimulation[];
    resume?: Resume;
    suggestions?: {
        suggestions: SuggestionItem[];
    };
};
