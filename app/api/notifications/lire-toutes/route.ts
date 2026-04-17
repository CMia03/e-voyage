import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { marquerToutesNotificationsLues as marquerToutesNotificationsLuesService } from "@/lib/services/notification-service";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    await marquerToutesNotificationsLuesService();

    return NextResponse.json({
      success: true,
      message: "Toutes les notifications ont été marquées comme lues",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur lors du marquage de toutes les notifications comme lues:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Erreur lors du marquage de toutes les notifications comme lues",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
