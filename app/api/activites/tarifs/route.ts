import { NextRequest, NextResponse } from "next/server";
import { TarifActivite } from "@/lib/type/activite";

// Simuler une base de données en mémoire
const tarifs: TarifActivite[] = [];

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
    const nouveauTarif: TarifActivite = {
      id: (tarifs.length + 1).toString(),
      categorieAge: body.categorieAge || null,
      prixParPersonne: body.prixParPersonne || null,
      prixParHeur: body.prixParHeur || null,
      devise: body.devise || "MGA",
      estActif: body.estActif ?? true,
      dateValiditeDebut: body.dateValiditeDebut || null,
      dateValiditeFin: body.dateValiditeFin || null,
      dateCreation: new Date().toISOString(),
      dateModification: null,
      idActivite: body.idActivite,
      nomActivite: body.nomActivite || "",
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
