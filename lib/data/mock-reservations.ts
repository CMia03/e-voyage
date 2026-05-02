import { Reservation } from '@/lib/type/reservation';

export interface MockReservation {
  id: string;
  nomPrenom: string;
  destination: string;
  budget: number;
  nombrePersonnes: number;
  status: string;
  createdAt: Date;
}

export const mockReservations: MockReservation[] = [
  {
    id: '1',
    nomPrenom: 'Jean Dupont',
    destination: 'Ambila Lemaintso',
    budget: 1500000,
    nombrePersonnes: 4,
    status: 'EN_ATTENTE',
    createdAt: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: '2',
    nomPrenom: 'Marie Razafindrabe',
    destination: 'Sainte-Marie',
    budget: 2500000,
    nombrePersonnes: 2,
    status: 'VALIDEE',
    createdAt: new Date('2024-01-14T14:20:00Z')
  },
  {
    id: '3',
    nomPrenom: 'Pierre Rakotoarisoa',
    destination: 'Manambato',
    budget: 800000,
    nombrePersonnes: 6,
    status: 'ANNULEE',
    createdAt: new Date('2024-01-13T16:45:00Z')
  },
  {
    id: '4',
    nomPrenom: 'Sophie Andriamampianina',
    destination: 'Grand Sud',
    budget: 3200000,
    nombrePersonnes: 3,
    status: 'VALIDEE',
    createdAt: new Date('2024-01-10T11:00:00Z')
  },
  {
    id: '5',
    nomPrenom: 'Thomas Rabe',
    destination: 'Nosy Be',
    budget: 1800000,
    nombrePersonnes: 5,
    status: 'EN_ATTENTE',
    createdAt: new Date('2024-01-16T09:30:00Z')
  },
  {
    id: '6',
    nomPrenom: 'Catherine Ralison',
    destination: 'Antananarivo',
    budget: 1200000,
    nombrePersonnes: 2,
    status: 'EN_ATTENTE',
    createdAt: new Date('2024-01-17T15:20:00Z')
  },
  {
    id: '7',
    nomPrenom: 'Marc Randrianarisoa',
    destination: 'Fianarantsoa',
    budget: 950000,
    nombrePersonnes: 1,
    status: 'VALIDEE',
    createdAt: new Date('2024-01-18T08:45:00Z')
  },
  {
    id: '8',
    nomPrenom: 'Lucie Razafy',
    destination: 'Toamasina',
    budget: 2100000,
    nombrePersonnes: 4,
    status: 'ANNULEE',
    createdAt: new Date('2024-01-19T13:10:00Z')
  }
];

export const mockDestinations = [
  'Ambila Lemaintso',
  'Sainte-Marie',
  'Manambato',
  'Grand Sud',
  'Nosy Be',
  'Antananarivo',
  'Fianarantsoa',
  'Toamasina'
];
