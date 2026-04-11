import { NextRequest, NextResponse } from "next/server";

// Simuler une base de données en mémoire
const tarifs: Array<{
  id: string;
  idActivite: string;
  typeClient: string;
  prix: number;
  devise: string;
  description: string;
}> = [];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Simuler une vérification d'authentification
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token d'authentification requis" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const resolvedParams = await params;
    const tarifIndex = tarifs.findIndex(t => t.id === resolvedParams.id);

    if (tarifIndex === -1) {
      return NextResponse.json(
        { error: "Tarif non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour le tarif
    tarifs[tarifIndex] = {
      ...tarifs[tarifIndex],
      ...body,
      id: resolvedParams.id, // Préserver l'ID
    };

    return NextResponse.json({
      data: tarifs[tarifIndex],
    });
  } catch (error) {
    console.error("Erreur PUT /api/activites/tarifs/[id]:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Simuler une vérification d'authentification
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token d'authentification requis" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const tarifIndex = tarifs.findIndex(t => t.id === resolvedParams.id);

    if (tarifIndex === -1) {
      return NextResponse.json(
        { error: "Tarif non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le tarif
    const tarifSupprime = tarifs.splice(tarifIndex, 1)[0];

    return NextResponse.json({
      data: `Tarif "${tarifSupprime.typeClient}" supprimé avec succès`,
    });
  } catch (error) {
    console.error("Erreur DELETE /api/activites/tarifs/[id]:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
