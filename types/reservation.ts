export interface Reservation {
  id: string;
  nomPrenom: string;
  destination: string;
  budget: number;
  nombrePersonnes: number;
  status: 'validé' | 'en cours' | 'rejeté';
  createdAt: Date;
}
