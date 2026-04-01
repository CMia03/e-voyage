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
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
  timestamp: string;
}
