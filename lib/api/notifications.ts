import { apiRequest, ApiEnvelope } from "@/lib/api/client";

export interface NotificationData {
  id: string;
  type: "commentaire" | "avis" | "reservation" | "utilisateur";
  titre: string;
  message: string;
  idLien?: string;
  lien?: string;
  lue: boolean;
  dateCreation: string;
  idUser?: string;
  nomUser?: string;
  idDestination?: string;
  nomDestination?: string;
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: NotificationData[];
  timestamp: string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data?: NotificationData;
  timestamp: string;
}

// Récupérer toutes les notifications non lues
export async function getNotificationsNonLues(token?: string): Promise<NotificationsResponse> {
  return apiRequest<NotificationsResponse>(
    '/api/notifications?lue=false',
    {
      method: "GET",
      token,
    }
  );
}

// Récupérer toutes les notifications
export async function getAllNotifications(token?: string): Promise<NotificationsResponse> {
  return apiRequest<NotificationsResponse>(
    '/api/notifications',
    {
      method: "GET",
      token,
    }
  );
}

// Marquer une notification comme lue
export async function marquerNotificationLue(notificationId: string, token?: string): Promise<NotificationResponse> {
  return apiRequest<NotificationResponse>(
    `/api/notifications/${notificationId}/lire`,
    {
      method: "PATCH",
      token,
    }
  );
}

// Marquer toutes les notifications comme lues
export async function marquerToutesNotificationsLues(token?: string): Promise<{success: boolean, message: string}> {
  return apiRequest<{success: boolean, message: string}>(
    '/api/notifications/lire-toutes',
    {
      method: "PATCH",
      token,
    }
  );
}

// Créer une notification (utilisé par les autres services)
export async function createNotification(
  type: NotificationData["type"],
  titre: string,
  message: string,
  lien?: string,
  idLien?: string,
  token?: string
): Promise<NotificationResponse> {
  return apiRequest<NotificationResponse>(
    '/api/notifications',
    {
      method: "POST",
      token,
      body: {
        type,
        titre,
        message,
        lien,
        idLien,
      },
    }
  );
}

// Supprimer une notification
export async function deleteNotification(notificationId: string, token?: string): Promise<{success: boolean, message: string}> {
  return apiRequest<{success: boolean, message: string}>(
    `/api/notifications/${notificationId}`,
    {
      method: "DELETE",
      token,
    }
  );
}
