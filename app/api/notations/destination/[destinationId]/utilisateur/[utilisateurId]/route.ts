import { NextRequest, NextResponse } from 'next/server';
import { NotationsService } from '@/lib/data/notations-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ destinationId: string; utilisateurId: string }> }
) {
  try {
    const { destinationId, utilisateurId } = await params;

    console.log(`Fetching user rating for destination ${destinationId} by user ${utilisateurId}`);
    
    // Récupérer la vraie notation de l'utilisateur depuis le service de données
    const userNotation = await NotationsService.getUserNotationForDestination(destinationId, utilisateurId);
    
    if (userNotation) {
      return NextResponse.json({
        success: true,
        message: 'User rating retrieved successfully',
        data: userNotation,
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
  { params }: { params: Promise<{ destinationId: string; utilisateurId: string }> }
) {
  try {
    const { destinationId, utilisateurId } = await params;
    const { searchParams } = new URL(request.url);
    const nombreEtoiles = searchParams.get('nombreEtoiles');
    const body = await request.json().catch(() => ({}));

    // Validation des données
    if (!nombreEtoiles) {
      return NextResponse.json(
        { error: 'nombreEtoiles parameter is required' },
        { status: 400 }
      );
    }

    const rating = parseInt(nombreEtoiles);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'nombreEtoiles must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    console.log(`Saving rating ${rating} for destination ${destinationId} by user ${utilisateurId}`);
    
    // Récupérer les vrais noms depuis les données existantes ou utiliser les valeurs fournies
    const allNotations = await NotationsService.getAllNotations();
    
    // Chercher une notation existante pour récupérer les noms
    const existingNotation = allNotations.find(n => 
      n.idDestination === destinationId || n.idUser === utilisateurId
    );
    
    // Récupérer le nom de la destination depuis une notation existante
    const destinationName = body.nomDestination || 
      existingNotation?.nomDestination || 
      allNotations.find(n => n.idDestination === destinationId)?.nomDestination ||
      `Destination ${destinationId}`;
    
    // Récupérer le nom de l'utilisateur depuis une notation existante
    const userName = body.nomUser || 
      existingNotation?.nomUser || 
      allNotations.find(n => n.idUser === utilisateurId)?.nomUser ||
      `User ${utilisateurId}`;
    
    // Sauvegarder la notation dans les vraies données
    const savedNotation = await NotationsService.saveNotation({
      idDestination: destinationId,
      idUser: utilisateurId,
      nomUser: userName,
      nomDestination: destinationName,
      status: "actif",
      nombreEtoiles: rating
    });

    return NextResponse.json({
      success: true,
      message: 'Notation créée/mise à jour avec succès',
      data: savedNotation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error saving rating:', error);
    return NextResponse.json(
      { error: 'Failed to save rating. Please try again.' },
      { status: 500 }
    );
  }
}
