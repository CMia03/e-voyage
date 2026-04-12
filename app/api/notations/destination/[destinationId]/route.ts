import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { destinationId: string } }
) {
  try {
    const { destinationId } = params;

    // Simuler la récupération des notations depuis la base de données
    // Dans un vrai projet, vous auriez une base de données ici
    console.log(`Fetching notations for destination ${destinationId}`);
    
    // Simuler des données de notation pour la démo
    const mockNotations = [
      {
        idDestination: destinationId,
        idAvis: "1",
        idUser: "user1",
        nomUser: "Jean Dupont",
        nomDestination: "Destination Test",
        dateCreation: "2024-01-15T10:30:00Z",
        dateModification: "2024-01-15T10:30:00Z",
        status: "actif",
        nombreEtoiles: 4
      },
      {
        idDestination: destinationId,
        idAvis: "2", 
        idUser: "user2",
        nomUser: "Marie Martin",
        nomDestination: "Destination Test",
        dateCreation: "2024-01-16T14:20:00Z",
        dateModification: "2024-01-16T14:20:00Z",
        status: "actif",
        nombreEtoiles: 5
      }
    ];

    return NextResponse.json({
      success: true,
      message: 'Notations retrieved successfully',
      data: mockNotations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching notations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
