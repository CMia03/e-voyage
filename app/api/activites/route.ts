import { NextRequest, NextResponse } from "next/server";
import { Activite } from "@/lib/type/activite";

// Simuler une base de données en mémoire
const activites: Activite[] = [];

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

    // Retourner la liste des activités
    return NextResponse.json({
      data: activites,
    });
  } catch (error) {
    console.error("Erreur GET /api/activites:", error);
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

    const contentType = request.headers.get("content-type");
    let body;

    if (contentType?.includes("multipart/form-data")) {
      // Gérer FormData
      const formData = await request.formData();
      const formDataBody = Object.fromEntries(formData.entries());
      
      // Gérer les équipements fournis séparément
      let equipementsFournis: string[] = [];
      if (formDataBody.equipementsFournis) {
        const equipementsValue = formDataBody.equipementsFournis;
        if (Array.isArray(equipementsValue)) {
          equipementsFournis = equipementsValue.filter(item => typeof item === 'string') as string[];
        } else if (typeof equipementsValue === 'string') {
          equipementsFournis = [equipementsValue];
        }
      }
      
      // Convertir les champs numériques
      body = {
        ...formDataBody,
        dureeHeures: formDataBody.dureeHeures ? Number(formDataBody.dureeHeures) : undefined,
        participantMin: formDataBody.participantMin ? Number(formDataBody.participantMin) : undefined,
        participantsMax: formDataBody.participantsMax ? Number(formDataBody.participantsMax) : undefined,
        latitude: formDataBody.latitude ? Number(formDataBody.latitude) : undefined,
        longitude: formDataBody.longitude ? Number(formDataBody.longitude) : undefined,
        estActif: formDataBody.estActif === "true",
        equipementsFournis,
      };
    } else {
      // Gérer JSON
      body = await request.json();
    }

    // Validation de base
    if (!body.nom || !body.slug || !body.description || !body.idCategorie) {
      return NextResponse.json(
        { error: "Champs requis manquants: nom, slug, description, idCategorie" },
        { status: 400 }
      );
    }

    // Créer la nouvelle activité
    const nouvelleActivite = {
      id: (activites.length + 1).toString(),
      ...body,
      dateCreation: new Date().toISOString(),
    };

    activites.push(nouvelleActivite);

    return NextResponse.json({
      data: nouvelleActivite,
    }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/activites:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
