import { NextRequest, NextResponse } from "next/server";
import { Activite } from "@/lib/type/activite";

// Type pour le corps de la requête PUT
interface UpdateActiviteBody {
  nom?: string;
  slug?: string;
  description?: string;
  imagePrincipale?: string;
  dureeHeures?: number;
  participantMin?: number;
  participantsMax?: string | number;
  niveauxDeDifficulte?: string;
  latitude?: number;
  longitude?: number;
  estActif?: boolean;
  idCategorie?: string;
  equipementsFournis?: string[];
  [key: string]: string | number | boolean | string[] | undefined; // Pour les autres propriétés de formData
}

// Simuler une base de données en mémoire
const activites: Activite[] = [];

export async function GET(
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
    const activite = activites.find(a => a.id === resolvedParams.id);

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

    const contentType = request.headers.get("content-type");
    let body: UpdateActiviteBody;

    if (contentType?.includes("multipart/form-data")) {
      // Gérer FormData
      const formData = await request.formData();
      const formDataEntries: Record<string, string> = {};
      
      // Filtrer les objets File pour ne garder que les chaînes
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          formDataEntries[key] = value;
        }
      }
      
      // Convertir les champs numériques et créer un objet typé
      body = {
        ...formDataEntries,
        dureeHeures: formDataEntries.dureeHeures ? Number(formDataEntries.dureeHeures) : undefined,
        participantMin: formDataEntries.participantMin ? Number(formDataEntries.participantMin) : undefined,
        participantsMax: formDataEntries.participantsMax ? Number(formDataEntries.participantsMax) : undefined,
        latitude: formDataEntries.latitude ? Number(formDataEntries.latitude) : undefined,
        longitude: formDataEntries.longitude ? Number(formDataEntries.longitude) : undefined,
        estActif: formDataEntries.estActif === "true",
      };
      
      // Gérer les équipements fournis
      if (formDataEntries.equipementsFournis) {
        if (Array.isArray(formDataEntries.equipementsFournis)) {
          body.equipementsFournis = formDataEntries.equipementsFournis;
        } else {
          body.equipementsFournis = [formDataEntries.equipementsFournis];
        }
      }
    } else {
      // Gérer JSON
      body = await request.json();
    }

    const resolvedParams = await params;
    const activiteIndex = activites.findIndex(a => a.id === resolvedParams.id);

    if (activiteIndex === -1) {
      return NextResponse.json(
        { error: "Activité non trouvée" },
        { status: 404 }
      );
    }

    // Mettre à jour l'activité
    const updatedActivite: Activite = {
      ...activites[activiteIndex],
      ...body,
      id: resolvedParams.id, // Préserver l'ID
      // Ensure participantsMax is always a string to match Activite type
      participantsMax: body.participantsMax !== undefined 
        ? String(body.participantsMax) 
        : activites[activiteIndex].participantsMax,
    };
    
    activites[activiteIndex] = updatedActivite;

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
    const activiteIndex = activites.findIndex(a => a.id === resolvedParams.id);

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
