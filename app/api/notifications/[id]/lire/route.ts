import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { marquerNotificationLue as marquerNotificationLueService } from "@/lib/services/notification-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const notification = await marquerNotificationLueService(id);

    if (!notification) {
      return NextResponse.json(
        { success: false, message: "Notification non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification marquée comme lue",
      data: notification,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur lors du marquage de la notification comme lue:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Erreur lors du marquage de la notification comme lue",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
