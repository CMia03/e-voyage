import { NotationData } from '@/lib/api/notations';
import { promises as fs } from 'fs';
import path from 'path';

const NOTATIONS_FILE_PATH = path.join(process.cwd(), 'data', 'notations.json');

export class NotationsService {
  // Lire toutes les notations depuis le fichier JSON
  static async getAllNotations(): Promise<NotationData[]> {
    try {
      const data = await fs.readFile(NOTATIONS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading notations file:', error);
      return [];
    }
  }

  // Lire les notations pour une destination spécifique
  static async getNotationsByDestination(destinationId: string): Promise<NotationData[]> {
    const notations = await this.getAllNotations();
    return notations.filter(notation => notation.idDestination === destinationId);
  }

  // Lire la notation d'un utilisateur pour une destination spécifique
  static async getUserNotationForDestination(destinationId: string, userId: string): Promise<NotationData | null> {
    const notations = await this.getAllNotations();
    return notations.find(notation => 
      notation.idDestination === destinationId && notation.idUser === userId
    ) || null;
  }

  // Sauvegarder une nouvelle notation ou mettre à jour une existante
  static async saveNotation(notation: Omit<NotationData, 'idAvis' | 'dateCreation' | 'dateModification'>): Promise<NotationData> {
    const notations = await this.getAllNotations();
    
    // Vérifier si une notation existe déjà pour cet utilisateur et cette destination
    const existingIndex = notations.findIndex(n => 
      n.idDestination === notation.idDestination && n.idUser === notation.idUser
    );

    const newNotation: NotationData = {
      ...notation,
      idAvis: existingIndex >= 0 ? notations[existingIndex].idAvis : Date.now().toString(),
      dateCreation: existingIndex >= 0 ? notations[existingIndex].dateCreation : new Date().toISOString(),
      dateModification: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Mettre à jour la notation existante
      notations[existingIndex] = newNotation;
    } else {
      // Ajouter une nouvelle notation
      notations.push(newNotation);
    }

    // Sauvegarder dans le fichier
    await this.saveNotations(notations);
    
    return newNotation;
  }

  // Sauvegarder toutes les notations dans le fichier
  private static async saveNotations(notations: NotationData[]): Promise<void> {
    try {
      await fs.writeFile(NOTATIONS_FILE_PATH, JSON.stringify(notations, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving notations file:', error);
      throw error;
    }
  }

  // Supprimer une notation
  static async deleteNotation(idAvis: string): Promise<boolean> {
    try {
      const notations = await this.getAllNotations();
      const filteredNotations = notations.filter(n => n.idAvis !== idAvis);
      
      if (filteredNotations.length === notations.length) {
        return false; // Aucune notation trouvée à supprimer
      }

      await this.saveNotations(filteredNotations);
      return true;
    } catch (error) {
      console.error('Error deleting notation:', error);
      return false;
    }
  }
}
