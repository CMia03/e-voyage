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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const activite = activites.find(a => a.id === params.id);

    if (!activite) {
      return NextResponse.json(
        { error: "Activité non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: activite,
    });
  } catch (error) {
    console.error("Erreur GET /api/activites/[id]:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const activiteIndex = activites.findIndex(a => a.id === params.id);

    if (activiteIndex === -1) {
      return NextResponse.json(
        { error: "Activité non trouvée" },
        { status: 404 }
      );
    }

    // Mettre à jour l'activité
    activites[activiteIndex] = {
      ...activites[activiteIndex],
      ...body,
      id: params.id, // Préserver l'ID
    };

    return NextResponse.json({
      data: activites[activiteIndex],
    });
  } catch (error) {
    console.error("Erreur PUT /api/activites/[id]:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const activiteIndex = activites.findIndex(a => a.id === params.id);

    if (activiteIndex === -1) {
      return NextResponse.json(
        { error: "Activité non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer l'activité
    const activiteSupprimee = activites.splice(activiteIndex, 1)[0];

    return NextResponse.json({
      data: `Activité "${activiteSupprimee.nom}" supprimée avec succès`,
    });
  } catch (error) {
    console.error("Erreur DELETE /api/activites/[id]:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
