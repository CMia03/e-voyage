export interface Reservation {
  id: string;
  nomPrenom: string;
  destination: string;
  budget: number;
  nombrePersonnes: number;
  status: 'validé' | 'en cours' | 'rejeté';
  createdAt: Date;
}

export interface CreateReservationPayload {
  nomPrenom: string;
  destination: string;
  budget: number;
  nombrePersonnes: number;
}

export interface UpdateReservationPayload {
  nomPrenom?: string;
  destination?: string;
  budget?: number;
  nombrePersonnes?: number;
  status?: 'validé' | 'en cours' | 'rejeté';
}
