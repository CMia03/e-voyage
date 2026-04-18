// lib/api/simulationService.ts

import { apiRequest } from "@/lib/api/client";
import { SimulationRequest, SimulationResponse } from "@/lib/type/simulation.types";

export function simulerPlanification(
    request: SimulationRequest,
    token?: string
) {
    return apiRequest<SimulationResponse>(
        "/api/client/simulation/planification",
        {
            method: "POST",
            token,
            body: request,
        }
    );
}
