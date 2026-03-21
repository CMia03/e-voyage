import { apiRequest, ApiEnvelope } from "@/lib/api/client";
import {
  AdminDestination,
  DestinationDetails,
  SaveDestinationPayload,
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
