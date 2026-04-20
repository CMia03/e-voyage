import { apiRequest, ApiEnvelope } from "@/lib/api/client";
import axios from "axios";
import { AllNotationsResponse, NotationData, NotationResponse } from "../type/notation";

export async function getUserRating(destinationId: string, userId: string): Promise<NotationResponse> {
  return apiRequest<NotationResponse>(
    `/api/notations/destination/${destinationId}/utilisateur/${userId}`
  );
}

export async function saveUserRating(destinationId: string, userId: string, rating: number, token?: string, nomUser?: string, nomDestination?: string): Promise<{success: boolean, message: string, data?: NotationData, timestamp?: string}> {
  const requestBody = {
    nomUser,
    nomDestination
  };

  return apiRequest<{success: boolean, message: string, data?: NotationData, timestamp?: string}>(
    `/api/notations/destination/${destinationId}/utilisateur/${userId}?nombreEtoiles=${rating}`,
    {
      method: "POST",
      token,
      body: requestBody,
    }
  );
}

export async function getDestinationNotations(destinationId: string): Promise<AllNotationsResponse> {
  return apiRequest<AllNotationsResponse>(
    `/api/notations/destination/${destinationId}`
  );
}

export async function getAllNotations(): Promise<AllNotationsResponse> {
  return apiRequest<AllNotationsResponse>(
    '/api/notations'
  );
}

export async function deleteUserRating(destinationId: string, userId: string, token: string): Promise<{ success: boolean, message: string }> {
  return apiRequest<{ success: boolean, message: string }>(
    `/api/notations/destination/${destinationId}/utilisateur/${userId}`,
    {
      method: "DELETE",
      token,
    }
  );
}

export async function getAllNotationsFromApi(): Promise<AllNotationsResponse> {
  return apiRequest<AllNotationsResponse>(
    '/api/notations/all'
  );
}
