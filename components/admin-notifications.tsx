"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, MessageCircle, Trash2, ExternalLink, X, Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  deleteAdminNotification,
  listAdminNotifications,
  markAdminNotificationAsRead,
} from "@/lib/api/admin-notifications";
import { getAllCommentairesAdmin } from "@/lib/api/commentaires";
import { AdminNotification } from "@/lib/type/admin-notification";
import { CommentaireData } from "@/lib/type/commentaire";

export function AdminNotifications() {
  const router = useRouter();
  const session = loadAuth();
  const token = session?.accessToken;
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [pendingCommentaires, setPendingCommentaires] = useState<CommentaireData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const [notificationsResponse, commentairesResponse] = await Promise.all([
        listAdminNotifications(token),
        getAllCommentairesAdmin(token),
      ]);

      setNotifications(notificationsResponse.data?.notifications ?? []);
      setPendingCommentaires(
        commentairesResponse.success
          ? commentairesResponse.data?.filter((commentaire) => commentaire.status !== true) ?? []
          : []
      );
    } catch (error) {
      console.error("Erreur lors du chargement des notifications admin:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadNotifications();
    const interval = setInterval(() => {
      void loadNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount =
    notifications.filter((notification) => !notification.read).length + pendingCommentaires.length;
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

  const handleOpenReservation = async (notification: AdminNotification) => {
    if (!token) return;

    try {
      if (!notification.read) {
        await markAdminNotificationAsRead(notification.id, token);
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
        );
      }
    } catch (error) {
      console.error("Erreur lecture notification:", error);
    }

    if (notification.reservationId) {
      router.push(`/admin/reservations/liste?reservationId=${encodeURIComponent(notification.reservationId)}`);
    } else if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else {
      router.push("/admin?section=notifications");
    }
    setIsOpen(false);
  };

  const handleOpenCommentaires = () => {
    router.push("/admin?section=commentaires");
    setIsOpen(false);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!token) return;

    try {
      await deleteAdminNotification(notificationId, token);
      setNotifications((current) => current.filter((item) => item.id !== notificationId));
    } catch (error) {
      console.error("Erreur suppression notification:", error);
    }
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
        <span className="sr-only">Notifications admin</span>
      </Button>

      {isOpen && (
        <Card 
          ref={notificationRef}
          className="absolute right-0 top-12 z-50 max-h-[520px] w-[420px] overflow-hidden rounded-xl border shadow-xl"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b px-4 py-4">
            <div>
              <CardTitle className="text-lg">Notifications</CardTitle>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} élément(s) à traiter` : "Tout est à jour"}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Chargement...</div>
            ) : notifications.length === 0 && pendingCommentaires.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
                Aucune notification
              </div>
            ) : (
              <div className="max-h-[440px] overflow-y-auto">
                {pendingCommentaires.length > 0 ? (
                  <div className="border-b bg-amber-50/50">
                    <button
                      type="button"
                      onClick={handleOpenCommentaires}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-amber-50"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Commentaires en attente
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {pendingCommentaires.length} commentaire(s) à modérer
                            </p>
                          </div>
                          <Badge className="bg-red-600 text-white hover:bg-red-600">
                            {pendingCommentaires.length > 99 ? "99+" : pendingCommentaires.length}
                          </Badge>
                        </div>
                        <div className="mt-2 rounded-lg border bg-white px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-medium text-foreground">
                              {pendingCommentaires[0].nomUser || pendingCommentaires[0].idUser}
                            </p>
                            <p className="shrink-0 text-xs text-muted-foreground">
                              {pendingCommentaires[0].nomDestination || "Destination"}
                            </p>
                          </div>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {pendingCommentaires[0].contenu}
                          </p>
                        </div>
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-800">
                          Voir les commentaires
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </button>
                  </div>
                ) : null}

                {notifications.slice(0, 8).map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b px-4 py-3 last:border-b-0 ${
                      !notification.read ? "bg-emerald-50/35" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Bell className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-1 text-sm font-semibold text-foreground">{notification.title}</p>
                          {!notification.read ? (
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              Nouveau
                            </Badge>
                          ) : null}
                        </div>

                        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                          {notification.message}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(notification.createdAt)}
                          </p>

                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleOpenReservation(notification)}
                              className="h-6 px-2 text-xs"
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              Voir
                            </Button>
                            {!notification.read ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void handleOpenReservation(notification)}
                                className="h-6 px-2 text-xs text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
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
