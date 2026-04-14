import { apiRequest, ApiEnvelope } from "@/lib/api/client";
import axios from "axios";
import {
  AdminDestination,
  DestinationDetails,
  DestinationAssociations,
  ElementJourPlanification,
  JourPlanificationVoyage,
  PlanificationVoyage,
  SavePhotoDestinationBulkPayload,
  SaveElementJourPlanificationPayload,
  SaveJourPlanificationVoyagePayload,
  SavePlanificationVoyagePayload,
  SaveTransportPayload,
  SaveTypeElementJourPayload,
  SaveTypeTransportPayload,
  SaveDestinationPayload,
  SaveDestinationMarketingPayload,
  Transport,
  TypeElementJour,
  TypeTransport,
} from "@/lib/type/destination";

type DestinationApiResponse =
  | DestinationDetails[]
  | DestinationDetails
  | { data?: DestinationDetails[] | DestinationDetails };

function normalizeDestination(item: DestinationDetails): DestinationDetails {
  const galleryAll = item.galleryAll?.length ? item.galleryAll : item.gallery ?? [];
  const galleryPrimary = item.galleryPrimary?.length
    ? item.galleryPrimary
    : (item.gallery?.length ? item.gallery : (item.image ? [item.image] : []));

  return {
    ...item,
    marketing: item.marketing?.length ? item.marketing : item.features ?? [],
    galleryPrimary,
    galleryAll,
    gallery: galleryPrimary,
  };
}

function toArray(value: DestinationApiResponse): DestinationDetails[] {
  if (Array.isArray(value)) {
    return value.map(normalizeDestination);
  }

  if ("data" in value && Array.isArray(value.data)) {
    return value.data.map(normalizeDestination);
  }

  return [];
}

function toItem(value: DestinationApiResponse): DestinationDetails | null {
  if (Array.isArray(value)) {
    return value[0] ? normalizeDestination(value[0]) : null;
  }

  if ("data" in value) {
    if (Array.isArray(value.data)) {
      return value.data[0] ? normalizeDestination(value.data[0]) : null;
    }

    return value.data ? normalizeDestination(value.data) : null;
  }

  return "id" in value ? normalizeDestination(value) : null;
}

export async function listDestinations() {
  const response = await apiRequest<DestinationApiResponse>("/api/public/destinations");
  return toArray(response);
}

export async function getDestinationById(id: string) {
  const response = await apiRequest<DestinationApiResponse>(`/api/public/destinations/${id}`);
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
  formData.append("estActif", String(payload.estActif));

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

export function updateDestinationPhotoPrincipale(
  photoId: string,
  estPrincipale: boolean,
  token?: string
) {
  return apiRequest<ApiEnvelope>(`/api/destinations/photos/${photoId}/principale`, {
    method: "PUT",
    token,
    body: { estPrincipale },
  });
}

export function getDestinationAssociations(destinationId: string, token?: string) {
  return apiRequest<ApiEnvelope<DestinationAssociations>>(`/api/destinations/${destinationId}/associations`, {
    token,
  });
}

export function linkDestinationActivite(
  destinationId: string,
  activiteId: string,
  token?: string
) {
  return apiRequest<ApiEnvelope<DestinationAssociations>>(`/api/destinations/${destinationId}/activites/${activiteId}`, {
    method: "POST",
    token,
    body: { estActif: true },
  });
}

export function unlinkDestinationActivite(
  destinationId: string,
  activiteId: string,
  token?: string
) {
  return apiRequest<ApiEnvelope>(`/api/destinations/${destinationId}/activites/${activiteId}`, {
    method: "DELETE",
    token,
  });
}

export function linkDestinationHebergement(
  destinationId: string,
  hebergementId: string,
  token?: string
) {
  return apiRequest<ApiEnvelope<DestinationAssociations>>(`/api/destinations/${destinationId}/hebergements/${hebergementId}`, {
    method: "POST",
    token,
    body: { estActif: true },
  });
}

export function unlinkDestinationHebergement(
  destinationId: string,
  hebergementId: string,
  token?: string
) {
  return apiRequest<ApiEnvelope>(`/api/destinations/${destinationId}/hebergements/${hebergementId}`, {
    method: "DELETE",
    token,
  });
}

export function linkDestinationPrestation(
  destinationId: string,
  prestationId: string,
  statut: "INCLUS" | "EN_SUS",
  token?: string
) {
  return apiRequest<ApiEnvelope<DestinationAssociations>>(`/api/destinations/${destinationId}/prestations/${prestationId}`, {
    method: "POST",
    token,
    body: { estActif: true, statut },
  });
}

export function unlinkDestinationPrestation(
  destinationId: string,
  prestationId: string,
  token?: string
) {
  return apiRequest<ApiEnvelope>(`/api/destinations/${destinationId}/prestations/${prestationId}`, {
    method: "DELETE",
    token,
  });
}

export function createPrestationReference(
  payload: {
    libelle: string;
    description: string;
    estActif: boolean;
    ordreAffichage: number;
  },
  token?: string
) {
  return apiRequest<ApiEnvelope>(`/api/destinations/prestations-reference`, {
    method: "POST",
    token,
    body: payload,
  });
}

export function listDestinationMarketing(destinationId: string, token?: string) {
  return apiRequest<ApiEnvelope>(`/api/destinations/${destinationId}/marketing`, {
    token,
  });
}

export function createDestinationMarketing(
  destinationId: string,
  payload: SaveDestinationMarketingPayload,
  token?: string
) {
  return apiRequest<ApiEnvelope>(`/api/destinations/${destinationId}/marketing`, {
    method: "POST",
    token,
    body: payload,
  });
}

export function deleteDestinationMarketing(
  destinationId: string,
  marketingId: string,
  token?: string
) {
  return apiRequest<ApiEnvelope>(`/api/destinations/${destinationId}/marketing/${marketingId}`, {
    method: "DELETE",
    token,
  });
}

export function listTypeTransports(token?: string) {
  return apiRequest<ApiEnvelope<TypeTransport[]>>("/api/destinations/types-transport", {
    token,
  });
}

export function listTypeElementJours(token?: string) {
  return apiRequest<ApiEnvelope<TypeElementJour[]>>("/api/destinations/types-element-jour", {
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

export function createTypeElementJour(payload: SaveTypeElementJourPayload, token?: string) {
  return apiRequest<ApiEnvelope<TypeElementJour>>("/api/destinations/types-element-jour", {
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

export function listJoursPlanificationVoyage(planificationId: string, token?: string) {
  return apiRequest<ApiEnvelope<JourPlanificationVoyage[]>>(`/api/destinations/planifications/${planificationId}/jours`, {
    token,
  });
}

export function createJourPlanificationVoyage(
  planificationId: string,
  payload: SaveJourPlanificationVoyagePayload,
  token?: string
) {
  return apiRequest<ApiEnvelope<JourPlanificationVoyage>>(`/api/destinations/planifications/${planificationId}/jours`, {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateJourPlanificationVoyage(
  id: string,
  payload: SaveJourPlanificationVoyagePayload,
  token?: string
) {
  return apiRequest<ApiEnvelope<JourPlanificationVoyage>>(`/api/destinations/jours-planification/${id}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteJourPlanificationVoyage(id: string, token?: string) {
  return apiRequest<ApiEnvelope>(`/api/destinations/jours-planification/${id}`, {
    method: "DELETE",
    token,
  });
}

export function createElementJourPlanification(
  payload: SaveElementJourPlanificationPayload,
  token?: string
) {
  return apiRequest<ApiEnvelope<ElementJourPlanification>>("/api/destinations/elements-jour", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateElementJourPlanification(
  id: string,
  payload: SaveElementJourPlanificationPayload,
  token?: string
) {
  return apiRequest<ApiEnvelope<ElementJourPlanification>>(`/api/destinations/elements-jour/${id}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteElementJourPlanification(id: string, token?: string) {
  return apiRequest<ApiEnvelope>(`/api/destinations/elements-jour/${id}`, {
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

export function getDestinationDetailsFromBackend(id: string, token?: string) {
  return apiRequest<ApiEnvelope<DestinationDetails>>(`/api/public/destinations/${id}`, {
    method: "GET",
    token,
  });
}
