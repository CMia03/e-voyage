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