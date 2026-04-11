import { DashboardResponse } from "@/lib/type/dashboard";
import { apiRequest } from "@/lib/api/client";

export async function getDashboardData(token?: string): Promise<DashboardResponse> {
  return apiRequest<DashboardResponse>("/api/dashboard", {
    token,
  });
}
