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
    const response = await axios.get(`/api/notations/destination/${destinationId}/utilisateur/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user rating:', error);
    throw error;
  }
}

// Ajouter ou mettre à jour la notation d'un utilisateur pour une destination
export async function saveUserRating(destinationId: string, userId: string, rating: number): Promise<{success: boolean, message: string, rating?: number, destinationId?: string, utilisateurId?: string, timestamp?: string}> {
  try {
    const response = await axios.post(
      `/api/notations/destination/${destinationId}/utilisateur/${userId}`,
      { rating }
    );
    return response.data;
  } catch (error) {
    console.error('Error saving user rating:', error);
    throw error;
  }
}

// Récupérer toutes les notations pour une destination
export async function getDestinationNotations(destinationId: string): Promise<AllNotationsResponse> {
  try {
    const response = await axios.get(`/api/notations/destination/${destinationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching destination notations:', error);
    throw error;
  }
}

// Récupérer toutes les notations (toutes destinations confondues)
export async function getAllNotations(): Promise<AllNotationsResponse> {
  try {
    const response = await axios.get('/api/notations');
    return response.data;
  } catch (error) {
    console.error('Error fetching all notations:', error);
    throw error;
  }
}
