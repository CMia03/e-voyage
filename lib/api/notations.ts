import axios from 'axios';

export interface NotationData {
  idDestination: string;
  idAvis: string;
  idUser: string;
  nomUser: string;
  nomDestination: string;
  dateCreation: string;
  dateModification: string;
  status: string;
  nombreEtoiles: number;
}

export interface NotationResponse {
  success: boolean;
  message: string;
  data: NotationData | null;
  timestamp: string;
}

export interface AllNotationsResponse {
  success: boolean;
  message: string;
  data: NotationData[];
  timestamp: string;
}

// Récupérer la notation d'un utilisateur pour une destination
export async function getUserRating(destinationId: string, userId: string): Promise<NotationResponse> {
  try {
    const response = await axios.get(`http://localhost:8080/api/notations/destination/${destinationId}/utilisateur/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user rating:', error);
    throw error;
  }
}

export async function saveUserRating(destinationId: string, userId: string, rating: number, token?: string, nomUser?: string, nomDestination?: string): Promise<{success: boolean, message: string, data?: NotationData, timestamp?: string}> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const requestBody = {
      nomUser,
      nomDestination
    };

    const response = await axios.post(
      `http://localhost:8080/api/notations/destination/${destinationId}/utilisateur/${userId}?nombreEtoiles=${rating}`,
      requestBody,
      { headers }
    );
    console.log("tokken", token)
    console.log("destination", destinationId)
    console.log("userId", userId)
    console.log("rating", rating)
    console.log("valinyyyyyy", response.data)
    return response.data;
  } catch (error) {
    console.error('Error saving user rating:', error);
    throw error;
  }
}

// Récupérer toutes les notations pour une destination
export async function getDestinationNotations(destinationId: string): Promise<AllNotationsResponse> {
  try {
    const response = await axios.get(`http://localhost:8080/api/notations/destination/${destinationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching destination notations:', error);
    throw error;
  }
}

// Récupérer toutes les notations (toutes destinations confondues)
export async function getAllNotations(): Promise<AllNotationsResponse> {
  try {
    const response = await axios.get('http://localhost:8080/api/notations');
    return response.data;
  } catch (error) {
    console.error('Error fetching all notations:', error);
    throw error;
  }
}

// Récupérer toutes les notations depuis l'API /all
export async function getAllNotationsFromApi(): Promise<AllNotationsResponse> {
  try {
    const response = await axios.get('http://localhost:8080/api/notations/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching all notations from /all:', error);
    throw error;
  }
}
