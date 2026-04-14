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
