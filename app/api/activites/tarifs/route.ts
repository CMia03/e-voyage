import { NextRequest, NextResponse } from "next/server";

// Simuler une base de données en mémoire
let tarifs: any[] = [
  {
    id: "1",
    idActivite: "1",
    typeClient: "Adulte",
    prix: 25000,
    devise: "MGA",
    description: "Tarif adulte pour la randonnée",
  },
  {
    id: "2",
    idActivite: "1", 
    typeClient: "Enfant",
    prix: 15000,
    devise: "MGA",
    description: "Tarif enfant pour la randonnée",
  },
  {
    id: "3",
    idActivite: "2",
    typeClient: "Adulte",
    prix: 30000,
    devise: "MGA",
    description: "Tarif adulte pour le kayak",
  },
];

export async function GET(request: NextRequest) {
  try {
    // Simuler une vérification d'authentification
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token d'authentification requis" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      data: tarifs,
    });
  } catch (error) {
    console.error("Erreur GET /api/activites/tarifs:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Validation de base
    if (!body.idActivite || !body.typeClient || !body.prix) {
      return NextResponse.json(
        { error: "Champs requis manquants: idActivite, typeClient, prix" },
        { status: 400 }
      );
    }

    // Créer le nouveau tarif
    const nouveauTarif = {
      id: (tarifs.length + 1).toString(),
      ...body,
      devise: body.devise || "MGA",
      description: body.description || "",
    };

    tarifs.push(nouveauTarif);

    return NextResponse.json({
      data: nouveauTarif,
    }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/activites/tarifs:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
