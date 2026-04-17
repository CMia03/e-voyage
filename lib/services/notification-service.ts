import { NotificationData } from "@/lib/api/notifications";

// Stockage en mémoire pour les notifications (à remplacer par une base de données réelle)
let notifications: NotificationData[] = [];
let notificationCounter = 1;

export async function getNotificationsNonLues(): Promise<NotificationData[]> {
  return notifications.filter(n => !n.lue);
}

export async function getAllNotifications(): Promise<NotificationData[]> {
  return notifications.sort((a, b) => 
    new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
  );
}

export async function createNotification(data: {
  type: NotificationData["type"];
  titre: string;
  message: string;
  lien?: string;
  idLien?: string;
  idUser?: string;
  nomUser?: string;
  idDestination?: string;
  nomDestination?: string;
}): Promise<NotificationData> {
  const notification: NotificationData = {
    id: `notif-${notificationCounter++}`,
    type: data.type,
    titre: data.titre,
    message: data.message,
    lien: data.lien,
    idLien: data.idLien,
    lue: false,
    dateCreation: new Date().toISOString(),
    idUser: data.idUser,
    nomUser: data.nomUser,
    idDestination: data.idDestination,
    nomDestination: data.nomDestination,
  };

  notifications.unshift(notification);
  return notification;
}

export async function marquerNotificationLue(notificationId: string): Promise<NotificationData | null> {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.lue = true;
  }
  return notification || null;
}

export async function marquerToutesNotificationsLues(): Promise<void> {
  notifications.forEach(n => n.lue = true);
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  const index = notifications.findIndex(n => n.id === notificationId);
  if (index !== -1) {
    notifications.splice(index, 1);
    return true;
  }
  return false;
}

// Fonction utilitaire pour créer une notification de commentaire
export async function creerNotificationCommentaire(
  nomUser: string,
  nomDestination: string,
  idDestination: string
): Promise<NotificationData> {
  return createNotification({
    type: "commentaire",
    titre: "Nouveau commentaire",
    message: `${nomUser} a commenté la destination "${nomDestination}"`,
    lien: `/admin?section=commentaires`,
    idLien: idDestination,
    nomDestination,
    idDestination,
  });
}

// Fonction utilitaire pour créer une notification d'avis
export async function creerNotificationAvis(
  nomUser: string,
  nomDestination: string,
  idDestination: string
): Promise<NotificationData> {
  return createNotification({
    type: "avis",
    titre: "Nouvel avis",
    message: `${nomUser} a donné un avis sur "${nomDestination}"`,
    lien: `/admin?section=avis`,
    idLien: idDestination,
    nomDestination,
    idDestination,
  });
}
