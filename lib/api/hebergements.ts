import { apiRequest } from "@/lib/api/client";
import {
  EquipementHebergement,
  Hebergement,
  SaveHebergementPayload,
  TypeHebergement,
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
