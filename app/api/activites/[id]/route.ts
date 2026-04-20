import { NextRequest, NextResponse } from "next/server";
import { Activite } from "@/lib/type/activite";

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
  [key: string]: string | number | boolean | string[] | undefined;
}

const activites: Activite[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      const formData = await request.formData();
      const formDataEntries: Record<string, string> = {};
      
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          formDataEntries[key] = value;
        }
      }
      
      body = {
        ...formDataEntries,
        dureeHeures: formDataEntries.dureeHeures ? Number(formDataEntries.dureeHeures) : undefined,
        participantMin: formDataEntries.participantMin ? Number(formDataEntries.participantMin) : undefined,
        participantsMax: formDataEntries.participantsMax ? Number(formDataEntries.participantsMax) : undefined,
        latitude: formDataEntries.latitude ? Number(formDataEntries.latitude) : undefined,
        longitude: formDataEntries.longitude ? Number(formDataEntries.longitude) : undefined,
        estActif: formDataEntries.estActif === "true",
      };
      
      if (formDataEntries.equipementsFournis) {
        if (Array.isArray(formDataEntries.equipementsFournis)) {
          body.equipementsFournis = formDataEntries.equipementsFournis;
        } else {
          body.equipementsFournis = [formDataEntries.equipementsFournis];
        }
      }
    } else {
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

    const updatedActivite: Activite = {
      ...activites[activiteIndex],
      ...body,
      id: resolvedParams.id,
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
