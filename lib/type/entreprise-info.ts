export type EntrepriseInfo = {
  id: string;
  nomEntreprise: string;
  description: string | null;
  contactYas: string | null;
  contactOrange: string | null;
  contactAirtel: string | null;
  contactGmail: string | null;
  contactPlusInfos: string | null;
  adresse: string | null;
  dateCreation?: string;
  dateModification?: string;
};

export type SaveEntrepriseInfoPayload = {
  nomEntreprise: string;
  description?: string | null;
  contactYas?: string | null;
  contactOrange?: string | null;
  contactAirtel?: string | null;
  contactGmail?: string | null;
  contactPlusInfos?: string | null;
  adresse?: string | null;
};
