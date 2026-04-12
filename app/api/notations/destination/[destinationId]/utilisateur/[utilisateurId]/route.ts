import { NextRequest, NextResponse } from 'next/server';
import { NotationsService } from '@/lib/data/notations-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { destinationId: string; utilisateurId: string } }
) {
  try {
    const { destinationId, utilisateurId } = params;

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

    console.log(`Saving rating ${body.rating} for destination ${destinationId} by user ${utilisateurId}`);
    
    // Sauvegarder la notation dans les vraies données
    const savedNotation = await NotationsService.saveNotation({
      idDestination: destinationId,
      idUser: utilisateurId,
      nomUser: body.nomUser || `User ${utilisateurId}`,
      nomDestination: body.nomDestination || `Destination ${destinationId}`,
      status: "actif",
      nombreEtoiles: body.rating
    });

    return NextResponse.json({
      success: true,
      message: 'Rating saved successfully',
      rating: savedNotation.nombreEtoiles,
      destinationId,
      utilisateurId,
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
