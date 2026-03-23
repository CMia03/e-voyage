import { apiRequest } from "@/lib/api/client";
import {
  EquipementHebergement,
  Hebergement,
  PhotoHebergementChambre,
  SaveHebergementPayload,
  SaveTarifHebergementPayload,
  SaveTarifPhotoPayload,
  TarifHebergement,
  TypeChambre,
  TypeHebergement,
  TypeSalle,
} from "@/lib/type/hebergement";

type ApiDataEnvelope<T> = {
  data?: T;
};

export function listHebergements(token?: string) {
  return apiRequest<ApiDataEnvelope<Hebergement[]>>("/api/hebergements", {
    token,
  });
}

export function getHebergement(id: string, token?: string) {
  return apiRequest<ApiDataEnvelope<Hebergement>>(`/api/hebergements/${id}`, {
    token,
  });
}

function buildHebergementFormData(payload: SaveHebergementPayload) {
  const formData = new FormData();
  formData.append("nom", payload.nom);
  formData.append("slug", payload.slug);
  formData.append("description", payload.description);
  formData.append("adresse", payload.adresse);
  formData.append("urlImagePrincipale", payload.urlImagePrincipale);
  formData.append("latitude", String(payload.latitude));
  formData.append("longitude", String(payload.longitude));
  formData.append("nombreEtoiles", String(payload.nombreEtoiles));
  formData.append("telephone", payload.telephone);
  formData.append("email", payload.email);
  formData.append("siteWeb", payload.siteWeb);
  formData.append("estActif", String(payload.estActif));
  formData.append("idTypeHebergement", payload.idTypeHebergement);

  payload.idsPlus.forEach((idPlus) => {
    formData.append("idsPlus", idPlus);
  });

  if (payload.imageFile) {
    formData.append("imageFile", payload.imageFile);
  }

  return formData;
}

export function createHebergement(
  payload: SaveHebergementPayload,
  token?: string
) {
  const body = payload.imageFile ? buildHebergementFormData(payload) : payload;

  return apiRequest<ApiDataEnvelope<Hebergement>>("/api/hebergements", {
    method: "POST",
    token,
    body,
  });
}

export function updateHebergement(
  id: string,
  payload: SaveHebergementPayload,
  token?: string
) {
  const body = payload.imageFile ? buildHebergementFormData(payload) : payload;

  return apiRequest<ApiDataEnvelope<Hebergement>>(`/api/hebergements/${id}`, {
    method: "PUT",
    token,
    body,
  });
}

export function deleteHebergement(id: string, token?: string) {
  return apiRequest<ApiDataEnvelope<string>>(`/api/hebergements/${id}`, {
    method: "DELETE",
    token,
  });
}

export function listHebergementTypes(token?: string) {
  return apiRequest<ApiDataEnvelope<TypeHebergement[]>>("/api/hebergements/types", {
    token,
  });
}

export function createHebergementType(nom: string, token?: string) {
  return apiRequest<ApiDataEnvelope<TypeHebergement>>("/api/hebergements/types", {
    method: "POST",
    token,
    body: { nom },
  });
}

export function listHebergementEquipements(token?: string) {
  return apiRequest<ApiDataEnvelope<EquipementHebergement[]>>(
    "/api/hebergements/equipements",
    {
      token,
    }
  );
}

export function createHebergementEquipement(equipement: string, token?: string) {
  return apiRequest<ApiDataEnvelope<EquipementHebergement>>(
    "/api/hebergements/equipements",
    {
      method: "POST",
      token,
      body: { equipement },
    }
  );
}

export function listTypeChambres(token?: string) {
  return apiRequest<ApiDataEnvelope<TypeChambre[]>>("/api/hebergements/types-chambres", {
    token,
  });
}

export function createTypeChambre(nom: string, token?: string) {
  return apiRequest<ApiDataEnvelope<TypeChambre>>("/api/hebergements/types-chambres", {
    method: "POST",
    token,
    body: { nom },
  });
}

export function listTypeSalles(token?: string) {
  return apiRequest<ApiDataEnvelope<TypeSalle[]>>("/api/hebergements/types-salles", {
    token,
  });
}

export function createTypeSalle(nom: string, token?: string) {
  return apiRequest<ApiDataEnvelope<TypeSalle>>("/api/hebergements/types-salles", {
    method: "POST",
    token,
    body: { nom },
  });
}

export function listTarifsHebergements(token?: string) {
  return apiRequest<ApiDataEnvelope<TarifHebergement[]>>("/api/hebergements/tarifs", {
    token,
  });
}

export function listTarifsByHebergement(hebergementId: string, token?: string) {
  return apiRequest<ApiDataEnvelope<TarifHebergement[]>>(
    `/api/hebergements/${hebergementId}/tarifs`,
    { token }
  );
}

export function getTarifHebergement(id: string, token?: string) {
  return apiRequest<ApiDataEnvelope<TarifHebergement>>(`/api/hebergements/tarifs/${id}`, {
    token,
  });
}

export function createTarifHebergement(
  payload: SaveTarifHebergementPayload,
  token?: string
) {
  return apiRequest<ApiDataEnvelope<TarifHebergement>>("/api/hebergements/tarifs", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateTarifHebergement(
  id: string,
  payload: SaveTarifHebergementPayload,
  token?: string
) {
  return apiRequest<ApiDataEnvelope<TarifHebergement>>(`/api/hebergements/tarifs/${id}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteTarifHebergement(id: string, token?: string) {
  return apiRequest<ApiDataEnvelope<string>>(`/api/hebergements/tarifs/${id}`, {
    method: "DELETE",
    token,
  });
}

function buildTarifPhotoFormData(payload: SaveTarifPhotoPayload) {
  const formData = new FormData();
  formData.append("idTypeSalle", payload.idTypeSalle);
  payload.imageFiles.forEach((file) => formData.append("imageFiles", file));
  return formData;
}

export function createTarifPhotos(
  tarifId: string,
  payload: SaveTarifPhotoPayload,
  token?: string
) {
  return apiRequest<ApiDataEnvelope<PhotoHebergementChambre[]>>(
    `/api/hebergements/tarifs/${tarifId}/photos`,
    {
      method: "POST",
      token,
      body: buildTarifPhotoFormData(payload),
    }
  );
}

export function deleteTarifPhoto(photoId: string, token?: string) {
  return apiRequest<ApiDataEnvelope<string>>(`/api/hebergements/tarifs/photos/${photoId}`, {
    method: "DELETE",
    token,
  });
}
