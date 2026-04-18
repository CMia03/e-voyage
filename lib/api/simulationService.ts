// lib/api/simulationService.ts

import { apiRequest } from "@/lib/api/client";
import {
    SeuilMinimumRequest,
    SeuilMinimumResponse,
    SimulationRequest,
    SimulationResponse,
} from "@/lib/type/simulation.types";

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

export function calculerSeuilMinimum(
    request: SeuilMinimumRequest,
    token?: string
) {
    return apiRequest<SeuilMinimumResponse>(
        "/api/client/simulation/planification/seuil-minimum",
        {
            method: "POST",
            token,
            body: request,
        }
    );
}
