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

export function createHebergement(
  payload: SaveHebergementPayload,
  token?: string
) {
  return apiRequest<ApiDataEnvelope<Hebergement>>("/api/hebergements", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateHebergement(
  id: string,
  payload: SaveHebergementPayload,
  token?: string
) {
  return apiRequest<ApiDataEnvelope<Hebergement>>(`/api/hebergements/${id}`, {
    method: "PUT",
    token,
    body: payload,
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
