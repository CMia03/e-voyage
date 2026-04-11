import { NextRequest, NextResponse } from "next/server";
import { CategorieActivite } from "@/lib/type/activite";

// Simuler une base de données en mémoire
const categories: CategorieActivite[] = [];

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
      data: categories,
    });
  } catch (error) {
    console.error("Erreur GET /api/activites/categories:", error);
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
    if (!body.nom) {
      return NextResponse.json(
        { error: "Champ requis manquant: nom" },
        { status: 400 }
      );
    }

    // Créer la nouvelle catégorie
    const nouvelleCategorie: CategorieActivite = {
      id: (categories.length + 1).toString(),
      nom: body.nom,
      dateCreation: new Date().toISOString(),
      dateModification: new Date().toISOString(),
    };

    categories.push(nouvelleCategorie);

    return NextResponse.json({
      data: nouvelleCategorie,
    }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/activites/categories:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
