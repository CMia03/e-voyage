import { apiRequest, ApiEnvelope } from "@/lib/api/client";
import { EntrepriseInfo, SaveEntrepriseInfoPayload } from "@/lib/type/entreprise-info";

export function getEntrepriseInfoPublic() {
  return apiRequest<ApiEnvelope<EntrepriseInfo>>("/api/public/entreprise-info");
}

export function getEntrepriseInfoAdmin(token?: string) {
  return apiRequest<ApiEnvelope<EntrepriseInfo>>("/api/entreprise-info", { token });
}

export function updateEntrepriseInfo(payload: SaveEntrepriseInfoPayload, token?: string) {
  return apiRequest<ApiEnvelope<EntrepriseInfo>>("/api/entreprise-info", {
    method: "PUT",
    token,
    body: payload,
  });
}

