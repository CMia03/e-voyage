import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { destinationId: string; utilisateurId: string } }
) {
  try {
    const { destinationId, utilisateurId } = params;

    // Simuler la récupération de la notation spécifique de l'utilisateur
    // Dans un vrai projet, vous auriez une base de données ici
    console.log(`Fetching user rating for destination ${destinationId} by user ${utilisateurId}`);
    
    // Simuler une recherche en base de données
    // Pour la démo, on retourne une notation aléatoire ou aucune
    const hasRated = Math.random() > 0.5; // 50% de chance que l'utilisateur ait déjà noté
    
    if (hasRated) {
      const mockRating = {
        idDestination: destinationId,
        idAvis: "123",
        idUser: utilisateurId,
        nomUser: "Utilisateur Actuel",
        nomDestination: "Destination Test",
        dateCreation: "2024-01-15T10:30:00Z",
        dateModification: "2024-01-15T10:30:00Z",
        status: "actif",
        nombreEtoiles: Math.floor(Math.random() * 5) + 1 // Rating aléatoire entre 1 et 5
      };

      return NextResponse.json({
        success: true,
        message: 'User rating retrieved successfully',
        data: mockRating,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'No rating found for this user',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error fetching user rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { destinationId: string; utilisateurId: string } }
) {
  try {
    const { destinationId, utilisateurId } = params;
    const body = await request.json();

    // Validation des données
    if (!body.rating || typeof body.rating !== 'number') {
      return NextResponse.json(
        { error: 'Rating is required and must be a number' },
        { status: 400 }
      );
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Simuler l'enregistrement en base de données
    // Dans un vrai projet, vous auriez une base de données ici
    console.log(`Saving rating ${body.rating} for destination ${destinationId} by user ${utilisateurId}`);
    
    // Simuler une sauvegarde réussie
    const success = Math.random() > 0.1; // 90% de chance de succès pour la démo

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Rating saved successfully',
        rating: body.rating,
        destinationId,
        utilisateurId,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to save rating. Please try again.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error saving rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
