export type LoginPayload = {
  login: string;
  motDePasse: string;
};

export type RegisterPayload = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  adress: string;
  login: string;
  motDePasse: string;
  nationalite: string;
};

export type ConfirmRegistrationPayload = {
  email: string;
  code: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string;
  role: string;
  userId?: string;
  login?: string;
  nom?: string;
  prenom?: string;
  [key: string]: unknown;
};
