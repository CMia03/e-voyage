import { NextRequest, NextResponse } from "next/server";
import { TarifActivite } from "@/lib/type/activite";

const tarifs: TarifActivite[] = [];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token d'authentification requis" }, { status: 401 });
    }

    return NextResponse.json({ data: tarifs });
  } catch (error) {
    console.error("Erreur GET /api/activites/tarifs:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token d'authentification requis" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.idActivite || !body.idCategorieClient || (!body.prixParPersonne && !body.prixParHeur)) {
      return NextResponse.json(
        { error: "Champs requis manquants: idActivite, idCategorieClient, prixParPersonne ou prixParHeur" },
        { status: 400 }
      );
    }

    const nouveauTarif: TarifActivite = {
      id: (tarifs.length + 1).toString(),
      idCategorieClient: body.idCategorieClient,
      nomCategorieClient: body.nomCategorieClient || null,
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

    return NextResponse.json({ data: nouveauTarif }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/activites/tarifs:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
