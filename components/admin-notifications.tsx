"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Trash2, ExternalLink, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { AdminNotification } from "@/lib/type/admin-notification";

export function AdminNotifications() {
  const router = useRouter();
  
  // Données statiques initialisées directement pour éviter les erreurs API
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => [
    {
      id: "1",
      title: "Nouveau commentaire sur Manambato",
      message: "Un utilisateur a laissé un commentaire sur la destination Manambato",
      type: "info",
      read: false,
      reservationId: null,
      actionUrl: "/admin/commentaires",
      priority: "medium",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    },
    {
      id: "2", 
      title: "Nouvelle réservation - Nosy Be",
      message: "Une nouvelle réservation a été effectuée pour Nosy Be",
      type: "success",
      read: false,
      reservationId: "res123",
      actionUrl: "/admin/reservations",
      priority: "high",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 heures ago
    },
    {
      id: "3",
      title: "Nouveau message de contact",
      message: "Un utilisateur a envoyé un message via le formulaire de contact",
      type: "info",
      read: true,
      reservationId: null,
      actionUrl: "/admin/messages",
      priority: "low",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 jour ago
    }
  ]);
  
  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "A l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return date.toLocaleDateString("fr-FR");
  };

  const handleMarkAsRead = (notification: AdminNotification) => {
    // Marquer comme lu localement
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item
      )
    );

    // Rediriger vers l'action appropriée
    if (notification.reservationId) {
      router.push(`/admin/reservations/liste?reservationId=${encodeURIComponent(notification.reservationId)}`);
    } else if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else {
      router.push("/admin?section=notifications");
    }
    setIsOpen(false);
  };

  const handleDeleteNotification = (notificationId: string) => {
    // Supprimer localement
    setNotifications((current) => current.filter((item) => item.id !== notificationId));
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setIsOpen(!isOpen)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        ) : null}
        <span className="sr-only">Notifications de reservations</span>
      </Button>

      {isOpen && (
        <Card 
          ref={notificationRef}
          className="absolute right-0 top-12 w-96 max-h-96 z-50 shadow-lg"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-lg">Notifications</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
                Aucune notification de reservation
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 8).map((notification) => (
                  <div key={notification.id} className="border-b p-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <Bell className="h-4 w-4 text-emerald-600" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{notification.title}</p>
                          {!notification.read ? (
                            <Badge variant="secondary" className="text-xs">
                              Nouveau
                            </Badge>
                          ) : null}
                        </div>

                        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                          {notification.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(notification.createdAt)}
                          </p>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleMarkAsRead(notification)}
                              className="h-6 px-2 text-xs"
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              Voir
                            </Button>
                            {!notification.read ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void handleMarkAsRead(notification)}
                                className="h-6 px-2 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                Lire
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleDeleteNotification(notification.id)}
                              className="h-6 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}