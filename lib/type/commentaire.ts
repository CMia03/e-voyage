export interface CommentaireData {
  idDestination: string;
  idUser: string;
  contenu: string;
  dateCreation: string;
  nomUser?: string;
  status?: boolean; 
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

export interface Comment {
  id: string;
  user: string;
  content: string;
  date: string;
  rating?: number;
  userId?: string;
}

export interface DestinationSidebarProps {
  destinationId: string;
  destinationName: string;
  averageRating: number;
}