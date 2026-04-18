export type ParametrageMargeBrute = {
  id: string;
  minimumMargeBrute: number;
  pourcentageMargeBrute: number;
  idCategorieClient: string;
  nomCategorieClient: string;
  dateCreation: string;
  dateModification: string;
  estActif: boolean;
};

export type ParametrageMargeBruteRequest = {
  minimumMargeBrute: number;
  pourcentageMargeBrute: number;
  idCategorieClient: string;
  estActif?: boolean;
};