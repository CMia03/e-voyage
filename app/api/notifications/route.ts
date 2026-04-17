import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getNotificationsNonLues, 
  getAllNotifications, 
  createNotification as createNotificationService,
  marquerNotificationLue as marquerNotificationLueService,
  marquerToutesNotificationsLues as marquerToutesNotificationsLuesService,
  deleteNotification as deleteNotificationService
} from "@/lib/services/notification-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const lue = searchParams.get('lue');
    
    let notifications;
    if (lue === 'false') {
      notifications = await getNotificationsNonLues();
    } else {
      notifications = await getAllNotifications();
    }

    return NextResponse.json({
      success: true,
      message: "Notifications récupérées avec succès",
      data: notifications,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Erreur lors de la récupération des notifications",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, titre, message, lien, idLien } = body;

    if (!type || !titre || !message) {
      return NextResponse.json(
        { success: false, message: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const notification = await createNotificationService({
      type,
      titre,
      message,
      lien,
      idLien,
      idUser: session.user?.id,
      nomUser: session.user?.name || session.user?.email,
    });

    return NextResponse.json({
      success: true,
      message: "Notification créée avec succès",
      data: notification,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Erreur lors de la création de la notification",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
