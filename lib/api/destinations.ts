import { apiRequest, ApiEnvelope } from "@/lib/api/client";
import {
  AdminDestination,
  DestinationDetails,
  PlanificationVoyage,
  SavePhotoDestinationBulkPayload,
  SavePlanificationVoyagePayload,
  SaveTransportPayload,
  SaveTypeTransportPayload,
  SaveDestinationPayload,
  Transport,
  TypeTransport,
} from "@/lib/type/destination";

type DestinationApiResponse =
  | DestinationDetails[]
  | DestinationDetails
  | { data?: DestinationDetails[] | DestinationDetails };

function toArray(value: DestinationApiResponse): DestinationDetails[] {
  if (Array.isArray(value)) {
    return value;
  }

  if ("data" in value && Array.isArray(value.data)) {
    return value.data;
  }

  return [];
}

function toItem(value: DestinationApiResponse): DestinationDetails | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  if ("data" in value) {
    if (Array.isArray(value.data)) {
      return value.data[0] ?? null;
    }

    return value.data ?? null;
  }

  return "id" in value ? value : null;
}

export async function listDestinations() {
  const response = await apiRequest<DestinationApiResponse>("/api/destinations");
  return toArray(response);
}

export async function getDestinationById(id: string) {
  const response = await apiRequest<DestinationApiResponse>(`/api/destinations/${id}`);
  return toItem(response);
}

function buildDestinationFormData(payload: SaveDestinationPayload) {
  const formData = new FormData();
  formData.append("nom", payload.nom);
  formData.append("slug", payload.slug);
  formData.append("description", payload.description);
  formData.append("adresse", payload.adresse);
  formData.append("urlImagePrincipale", payload.urlImagePrincipale);
  formData.append("latitude", String(payload.latitude));
  formData.append("longitude", String(payload.longitude));
  formData.append("nombreEtoiles", String(payload.nombreEtoiles));
  formData.append("estActif", String(payload.estActif));
  formData.append("region", payload.region);
  formData.append("district", payload.district);
  formData.append("commune", payload.commune);

  if (payload.imageFile) {
    formData.append("imageFile", payload.imageFile);
  }

  return formData;
}

export function listAdminDestinations(token?: string) {
  return apiRequest<ApiEnvelope<AdminDestination[]>>("/api/destinations", {
    token,
  });
}

export function getAdminDestination(id: string, token?: string) {
  return apiRequest<ApiEnvelope<AdminDestination>>(`/api/destinations/${id}`, {
    token,
  });
}

export function createAdminDestination(payload: SaveDestinationPayload, token?: string) {
  const body = payload.imageFile ? buildDestinationFormData(payload) : payload;

  return apiRequest<ApiEnvelope<AdminDestination>>("/api/destinations", {
    method: "POST",
    token,
    body,
  });
}

export function updateAdminDestination(
  id: string,
  payload: SaveDestinationPayload,
  token?: string
) {
  const body = payload.imageFile ? buildDestinationFormData(payload) : payload;

  return apiRequest<ApiEnvelope<AdminDestination>>(`/api/destinations/${id}`, {
    method: "PUT",
    token,
    body,
  });
}

export function deleteAdminDestination(id: string, token?: string) {
  return apiRequest<ApiEnvelope>(`/api/destinations/${id}`, {
    method: "DELETE",
    token,
  });
}

function buildPhotoDestinationBulkFormData(payload: SavePhotoDestinationBulkPayload) {
  const formData = new FormData();
  formData.append("titre", payload.titre);
  formData.append("description", payload.description);
  formData.append("ordreAffichage", String(payload.ordreAffichage));
  formData.append("estPrincipale", String(payload.estPrincipale));
  formData.append("dateObtenir", payload.dateObtenir);
  payload.imageFiles.forEach((file) => formData.append("imageFiles", file));
  return formData;
}

export function createDestinationPhotosBulk(
  destinationId: string,
  payload: SavePhotoDestinationBulkPayload,
  token?: string
) {
  return apiRequest<ApiEnvelope>(`/api/destinations/${destinationId}/photos/multiple`, {
    method: "POST",
    token,
    body: buildPhotoDestinationBulkFormData(payload),
  });
}

export function listTypeTransports(token?: string) {
  return apiRequest<ApiEnvelope<TypeTransport[]>>("/api/destinations/types-transport", {
    token,
  });
}

export function createTypeTransport(payload: SaveTypeTransportPayload, token?: string) {
  return apiRequest<ApiEnvelope<TypeTransport>>("/api/destinations/types-transport", {
    method: "POST",
    token,
    body: payload,
  });
}

export function listPlanificationsByDestination(destinationId: string, token?: string) {
  return apiRequest<ApiEnvelope<PlanificationVoyage[]>>(`/api/destinations/${destinationId}/planifications`, {
    token,
  });
}

export function getPlanificationVoyage(id: string, token?: string) {
  return apiRequest<ApiEnvelope<PlanificationVoyage>>(`/api/destinations/planifications/${id}`, {
    token,
  });
}

export function createPlanificationVoyage(payload: SavePlanificationVoyagePayload, token?: string) {
  return apiRequest<ApiEnvelope<PlanificationVoyage>>("/api/destinations/planifications", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updatePlanificationVoyage(id: string, payload: SavePlanificationVoyagePayload, token?: string) {
  return apiRequest<ApiEnvelope<PlanificationVoyage>>(`/api/destinations/planifications/${id}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deletePlanificationVoyage(id: string, token?: string) {
  return apiRequest<ApiEnvelope>(`/api/destinations/planifications/${id}`, {
    method: "DELETE",
    token,
  });
}

export function createTransport(payload: SaveTransportPayload, token?: string) {
  return apiRequest<ApiEnvelope<Transport>>("/api/destinations/transports", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateTransport(id: string, payload: SaveTransportPayload, token?: string) {
  return apiRequest<ApiEnvelope<Transport>>(`/api/destinations/transports/${id}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteTransport(id: string, token?: string) {
  return apiRequest<ApiEnvelope>(`/api/destinations/transports/${id}`, {
    method: "DELETE",
    token,
  });
}

export function calculateTransportRoute(id: string, token?: string) {
  return apiRequest<ApiEnvelope<Transport>>(`/api/destinations/transports/${id}/calcul-trajet`, {
    method: "POST",
    token,
  });
}
