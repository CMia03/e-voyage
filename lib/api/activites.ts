import { apiRequest } from "@/lib/api/client";
import {
  Activite,
  CategorieActivite,
  PhotoActivite,
  SaveActivitePayload,
  SavePhotoActivitePayload,
  SaveTarifActivitePayload,
  TarifActivite,
} from "@/lib/type/activite";

type ApiDataEnvelope<T> = {
  data?: T;
};

export function listActivites(token?: string) {
  return apiRequest<ApiDataEnvelope<Activite[]>>("/api/activites", {
    token,
  });
}

export function getActivite(id: string, token?: string) {
  return apiRequest<ApiDataEnvelope<Activite>>(`/api/activites/${id}`, {
    token,
  });
}

function buildActiviteFormData(payload: SaveActivitePayload) {
  const formData = new FormData();
  formData.append("nom", payload.nom);
  formData.append("slug", payload.slug);
  formData.append("description", payload.description);
  formData.append("imagePrincipale", payload.imagePrincipale);
  formData.append("dureeHeures", String(payload.dureeHeures));
  formData.append("participantMin", String(payload.participantMin));
  formData.append("participantsMax", payload.participantsMax);
  formData.append("niveauxDeDifficulte", payload.niveauxDeDifficulte);
  formData.append("latitude", String(payload.latitude));
  formData.append("longitude", String(payload.longitude));
  formData.append("estActif", String(payload.estActif));
  formData.append("idCategorie", payload.idCategorie);

  payload.equipementsFournis.forEach((equipement) => {
    formData.append("equipementsFournis", equipement);
  });

  if (payload.imageFile) {
    formData.append("imageFile", payload.imageFile);
  }

  return formData;
}

export function createActivite(payload: SaveActivitePayload, token?: string) {
  const body = payload.imageFile ? buildActiviteFormData(payload) : payload;

  return apiRequest<ApiDataEnvelope<Activite>>("/api/activites", {
    method: "POST",
    token,
    body,
  });
}

export function updateActivite(
  id: string,
  payload: SaveActivitePayload,
  token?: string
) {
  const body = payload.imageFile ? buildActiviteFormData(payload) : payload;

  return apiRequest<ApiDataEnvelope<Activite>>(`/api/activites/${id}`, {
    method: "PUT",
    token,
    body,
  });
}

export function deleteActivite(id: string, token?: string) {
  return apiRequest<ApiDataEnvelope<string>>(`/api/activites/${id}`, {
    method: "DELETE",
    token,
  });
}

export function listActiviteCategories(token?: string) {
  return apiRequest<ApiDataEnvelope<CategorieActivite[]>>(
    "/api/activites/categories",
    {
      token,
    }
  );
}

export function createActiviteCategorie(nom: string, token?: string) {
  return apiRequest<ApiDataEnvelope<CategorieActivite>>(
    "/api/activites/categories",
    {
      method: "POST",
      token,
      body: { nom },
    }
  );
}

export function listTarifsActivites(token?: string) {
  return apiRequest<ApiDataEnvelope<TarifActivite[]>>("/api/activites/tarifs", {
    token,
  });
}

export function createTarifActivite(
  payload: SaveTarifActivitePayload,
  token?: string
) {
  return apiRequest<ApiDataEnvelope<TarifActivite>>("/api/activites/tarifs", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateTarifActivite(
  id: string,
  payload: SaveTarifActivitePayload,
  token?: string
) {
  return apiRequest<ApiDataEnvelope<TarifActivite>>(`/api/activites/tarifs/${id}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteTarifActivite(id: string, token?: string) {
  return apiRequest<ApiDataEnvelope<string>>(`/api/activites/tarifs/${id}`, {
    method: "DELETE",
    token,
  });
}

function buildPhotoActiviteFormData(payload: SavePhotoActivitePayload) {
  const formData = new FormData();
  payload.imageFiles.forEach((file) => formData.append("imageFiles", file));
  return formData;
}

export function createActivitePhotos(
  activiteId: string,
  payload: SavePhotoActivitePayload,
  token?: string
) {
  return apiRequest<ApiDataEnvelope<PhotoActivite[]>>(`/api/activites/${activiteId}/photos`, {
    method: "POST",
    token,
    body: buildPhotoActiviteFormData(payload),
  });
}

export function deleteActivitePhoto(photoId: string, token?: string) {
  return apiRequest<ApiDataEnvelope<string>>(`/api/activites/photos/${photoId}`, {
    method: "DELETE",
    token,
  });
}
