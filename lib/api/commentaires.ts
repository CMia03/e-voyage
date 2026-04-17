import axios from 'axios';

export interface CommentaireData {
  idDestination: string;
  idUser: string;
  contenu: string;
  dateCreation: string;
  nomUser?: string;
  status?: boolean; // true = validé, false = en attente (par défaut)
}

export interface CommentaireResponse {
  success: boolean;
  message: string;
  data: CommentaireData | null;
  timestamp: string;
}

export interface AllCommentairesResponse {
  success: boolean;
  message: string;
  data: CommentaireData[];
  timestamp: string;
}

// Ajouter un commentaire pour une destination
export async function addCommentaire(
  destinationId: string, 
  userId: string, 
  contenu: string,
  token?: string,
  nomUser?: string
): Promise<CommentaireResponse> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const requestBody = nomUser ? { nomUser } : {};

    const response = await axios.post(
      `http://localhost:8080/api/commentaires/destination/${destinationId}/utilisateur/${userId}?contenu=${encodeURIComponent(contenu)}`,
      requestBody,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error adding commentaire:', error);
    throw error;
  }
}

// Récupérer tous les commentaires pour une destination
export async function getDestinationCommentaires(destinationId: string): Promise<AllCommentairesResponse> {
  try {
    const response = await axios.get(`http://localhost:8080/api/commentaires/destination/${destinationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching destination commentaires:', error);
    throw error;
  }
}

// Récupérer tous les commentaires (admin)
export async function getAllCommentairesAdmin(token?: string): Promise<AllCommentairesResponse> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get('http://localhost:8080/api/commentaires/all', { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching all commentaires:', error);
    throw error;
  }
}

// Valider un commentaire
export async function validateCommentaire(destinationId: string, utilisateurId: string, token?: string): Promise<{ success: boolean, message: string }> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.put(
      `http://localhost:8080/api/commentaires/destination/${destinationId}/utilisateur/${utilisateurId}/activate`,
      {},
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error validating commentaire:', error);
    throw error;
  }
}

// Supprimer un commentaire
export async function deleteCommentaire(destinationId: string, utilisateurId: string, token?: string): Promise<{ success: boolean, message: string }> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.delete(
      `http://localhost:8080/api/commentaires/destination/${destinationId}/utilisateur/${utilisateurId}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting commentaire:', error);
    throw error;
  }
}

// Récupérer les commentaires publiques (validés) pour la page d'accueil
export async function getPublicCommentaires(): Promise<AllCommentairesResponse> {
  try {
    const response = await axios.get('http://localhost:8080/api/commentaires/public');
    return response.data;
  } catch (error) {
    console.error('Error fetching public commentaires:', error);
    throw error;
  }
}

// Récupérer les commentaires validés par destination (public)
export async function getDestinationPublicCommentaires(destinationId: string): Promise<AllCommentairesResponse> {
  try {
    const response = await axios.get(`http://localhost:8080/api/commentaires/destination/${destinationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching destination public commentaires:', error);
    throw error;
  }
}
