export interface ActivityData {
  month: string;
  destination: number;
  hebergement: number;
  activite: number;
}

export interface DashboardData {
  destinations: {
    count: number;
    lastUpdate: string;
  };
  hebergements: {
    count: number;
    pendingReviews: number;
  };
  activites: {
    count: number;
    newThisMonth: number;
  };
  notations: {
    totalCount: number;
    status: string;
  };
  voyageursParDestination?: {
    destinationId: string;
    destinationName: string;
    nombrePersonnes: number;
    pourcentage: number;
  }[];
  performancePlanifications?: {
    destinationId: string;
    destinationName: string;
    planificationId: string;
    planificationName: string;
    periodMonth: string;
    validees: number;
    enAttente: number;
    annulees: number;
    total: number;
  }[];

  monthlyActivity?: ActivityData[];
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
  timestamp: string;
}
