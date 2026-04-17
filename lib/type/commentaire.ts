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