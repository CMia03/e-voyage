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

  monthlyActivity?: ActivityData[];
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
  timestamp: string;
}
