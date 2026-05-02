export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  reservationId: string | null;
  actionUrl: string | null;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt?: string | null;
};

export type AdminNotificationList = {
  unreadCount: number;
  notifications: AdminNotification[];
};
