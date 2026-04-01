import { NextRequest, NextResponse } from "next/server";

// Simuler une base de données en mémoire
let activites: any[] = [
  {
    id: "1",
    nom: "Randonnée dans les mangroves",
    slug: "randonnee-mangroves",
    description: "Explorez les magnifiques mangroves de Madagascar",
    dureeHeures: 3,
    participantMin: 2,
    participantsMax: 10,
    niveauxDeDifficulte: "Facile",
    latitude: -18.766947,
    longitude: 46.869107,
    estActif: true,
    idCategorie: "1",
    equipementsFournis: ["Bottines", "Eau", "Snacks"],
    imagePrincipale: "/images/activite1.jpg",
    dateCreation: new Date().toISOString(),
  },
  {
    id: "2",
    nom: "Kayak sur la rivière",
    slug: "kayak-riviere",
    description: "Balade en kayak sur les rivières tranquilles",
    dureeHeures: 2,
    participantMin: 1,
    participantsMax: 8,
    niveauxDeDifficulte: "Moyen",
    latitude: -18.866947,
    longitude: 46.969107,
    estActif: true,
    idCategorie: "2",
    equipementsFournis: ["Kayak", "Pagaie", "Gilet de sauvetage"],
    imagePrincipale: "/images/activite2.jpg",
    dateCreation: new Date().toISOString(),
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
      body = Object.fromEntries(formData.entries());
      
      // Convertir les champs numériques
      if (body.dureeHeures) body.dureeHeures = Number(body.dureeHeures);
      if (body.participantMin) body.participantMin = Number(body.participantMin);
      if (body.participantsMax) body.participantsMax = Number(body.participantsMax);
      if (body.latitude) body.latitude = Number(body.latitude);
      if (body.longitude) body.longitude = Number(body.longitude);
      if (body.estActif) body.estActif = body.estActif === "true";
      
      // Gérer les équipements fournis
      if (body.equipementsFournis) {
        if (Array.isArray(body.equipementsFournis)) {
          body.equipementsFournis = body.equipementsFournis;
        } else {
          body.equipementsFournis = [body.equipementsFournis];
        }
      }
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
