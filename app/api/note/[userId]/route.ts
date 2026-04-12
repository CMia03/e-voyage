import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api/client';

interface NoteRequest {
  destinationId: string;
  rating: number;
  destinationName: string;
}

interface Note {
  id: string;
  userId: string;
  destinationId: string;
  destinationName: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body: NoteRequest = await request.json();

    // Validation des données
    if (!body.destinationId || !body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Données invalides. La note doit être entre 1 et 5.' },
        { status: 400 }
      );
    }

    // Appel à l'API réelle pour enregistrer la notation
    try {
      const apiUrl = process.env.API_BASE_URL;
      
      // Vérifier si l'URL est valide
      if (!apiUrl) {
        console.error('API_BASE_URL n\'est pas configuré');
        return NextResponse.json(
          { error: 'Configuration API manquante' },
          { status: 500 }
        );
      }

      console.log('Tentative d\'appel API:', `${apiUrl}/api/notations`);
      
      const response = await fetch(`${apiUrl}/api/notations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idUser: userId,
          idDestination: body.destinationId,
          nomDestination: body.destinationName,
          nombreEtoiles: body.rating,
          dateCreation: new Date().toISOString(),
          dateModification: new Date().toISOString(),
          status: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        return NextResponse.json({
          success: true,
          message: 'Note enregistrée avec succès',
          rating: body.rating,
          data: result
        });
      } else {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.message || 'Erreur lors de l\'enregistrement de la note' },
          { status: response.status }
        );
      }
    } catch (fetchError) {
      console.error('Erreur lors de l\'appel à l\'API de notation:', fetchError);
      
      // Gestion spécifique des erreurs de connexion
      if (fetchError instanceof Error) {
        if (fetchError.message.includes('EAI_AGAIN') || fetchError.message.includes('getaddrinfo')) {
          return NextResponse.json(
            { error: 'Erreur de résolution d\'adresse. Vérifiez la configuration API_BASE_URL.' },
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Erreur de connexion au service de notation' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la note:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Erreur serveur') },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // Appel à l'API réelle pour récupérer les notations de l'utilisateur
    try {
      const apiUrl = process.env.API_BASE_URL;
      
      // Vérifier si l'URL est valide
      if (!apiUrl) {
        console.error('API_BASE_URL n\'est pas configuré');
        return NextResponse.json(
          { error: 'Configuration API manquante' },
          { status: 500 }
        );
      }

      console.log('Tentative d\'appel API:', `${apiUrl}/api/notations/utilisateur/${userId}`);
      
      const response = await fetch(`${apiUrl}/api/notations/utilisateur/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const userData = await response.json();
        const userNotations = userData.data || [];
        
        // Convertir les notations au format attendu par le frontend
        const userNotes = userNotations.map((notation: any) => ({
          id: notation.idAvis,
          userId: notation.idUser,
          destinationId: notation.idDestination,
          destinationName: notation.nomDestination,
          rating: notation.nombreEtoiles,
          createdAt: new Date(notation.dateCreation),
          updatedAt: new Date(notation.dateModification)
        }));
        
        // Calculer les statistiques
        const stats = {
          totalNotes: userNotes.length,
          averageRating: userNotes.length > 0 
            ? userNotes.reduce((sum: number, note: any) => sum + note.rating, 0) / userNotes.length 
            : 0,
          recentNotes: userNotes.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10)
        };

        return NextResponse.json({
          success: true,
          stats,
          notes: userNotes
        });
      } else {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.message || 'Erreur lors de la récupération des notations' },
          { status: response.status }
        );
      }
    } catch (fetchError) {
      console.error('Erreur lors de l\'appel à l\'API de notation:', fetchError);
      
      // Gestion spécifique des erreurs de connexion
      if (fetchError instanceof Error) {
        if (fetchError.message.includes('EAI_AGAIN') || fetchError.message.includes('getaddrinfo')) {
          return NextResponse.json(
            { error: 'Erreur de résolution d\'adresse. Vérifiez la configuration API_BASE_URL.' },
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Erreur de connexion au service de notation' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Erreur serveur') },
      { status: 500 }
    );
  }
}
