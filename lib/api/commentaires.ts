import { apiRequest } from "@/lib/api/client";
import { AllCommentairesResponse, CommentaireResponse } from "../type/commentaire";

export async function addCommentaire(
  destinationId: string, 
  userId: string, 
  contenu: string,
  token?: string,
  nomUser?: string
): Promise<CommentaireResponse> {
  const requestBody = nomUser ? { nomUser } : {};
  
  return apiRequest<CommentaireResponse>(
    `/api/commentaires/destination/${destinationId}/utilisateur/${userId}?contenu=${encodeURIComponent(contenu)}`,
    {
      method: "POST",
      token,
      body: requestBody,
    }
  );
}

export async function getDestinationCommentaires(destinationId: string): Promise<AllCommentairesResponse> {
  return apiRequest<AllCommentairesResponse>(
    `/api/commentaires/destination/${destinationId}`
  );
}

export async function getAllCommentairesAdmin(token?: string): Promise<AllCommentairesResponse> {
  return apiRequest<AllCommentairesResponse>(
    '/api/commentaires/all',
    {
      method: "GET",
      token,
    }
  );
}

export async function validateCommentaire(destinationId: string, utilisateurId: string, token?: string): Promise<{ success: boolean, message: string }> {
  return apiRequest<{ success: boolean, message: string }>(
    `/api/commentaires/destination/${destinationId}/utilisateur/${utilisateurId}/activate`,
    {
      method: "PUT",
      token,
      body: {},
    }
  );
}

export async function deleteCommentaire(destinationId: string, utilisateurId: string, token?: string): Promise<{ success: boolean, message: string }> {
  return apiRequest<{ success: boolean, message: string }>(
    `/api/commentaires/destination/${destinationId}/utilisateur/${utilisateurId}`,
    {
      method: "DELETE",
      token,
    }
  );
}

export async function getPublicCommentaires(): Promise<AllCommentairesResponse> {
  return apiRequest<AllCommentairesResponse>(
    '/api/commentaires/all'
  );
}

export async function getDestinationPublicCommentaires(destinationId: string): Promise<AllCommentairesResponse> {
  return apiRequest<AllCommentairesResponse>(
    `/api/commentaires/destination/${destinationId}`
  );
}
