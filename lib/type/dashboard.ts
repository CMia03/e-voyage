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
  avisEnAttente: {
    count: number;
    status: string;
  };
  monthlyActivity?: ActivityData[];
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
  timestamp: string;
}
