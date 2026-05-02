"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Trash2, Eye, Clock, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useBreadcrumbs } from "../contexts/breadcrumbs-context";
import { loadAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api/client";
import {
  deleteAdminNotification,
  deleteAllAdminNotifications,
  listAdminNotifications,
  markAdminNotificationAsRead,
  markAdminNotificationAsUnread,
  markAllAdminNotificationsAsRead,
} from "@/lib/api/admin-notifications";
import { AdminNotification } from "@/lib/type/admin-notification";

export function AdminNotifications() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const router = useRouter();
  const session = useMemo(() => loadAuth(), []);
  const token = session?.accessToken;

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Notifications", isActive: true }
    ]);
  }, [setBreadcrumbs]);

  const loadNotifications = async () => {
    if (!token) {
      setError("Connexion requise pour consulter les notifications.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await listAdminNotifications(token);
      setNotifications(response.data?.notifications ?? []);
      setError(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Impossible de charger les notifications."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, [token]);

  const filteredNotifications = notifications.filter((notification) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "read" && notification.read) ||
      (filter === "unread" && !notification.read);

    const haystack = `${notification.title} ${notification.message}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Il y a quelques minutes";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return "Hier";
    return date.toLocaleDateString("fr-FR");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const handleOpenNotification = async (notification: AdminNotification) => {
    if (!token) return;

    try {
      if (!notification.read) {
        await markAdminNotificationAsRead(notification.id, token);
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
        );
      }
    } catch {
      // silent open fallback
    }

    if (notification.reservationId) {
      router.push(`/admin/reservations/liste?reservationId=${encodeURIComponent(notification.reservationId)}`);
      return;
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (!token) return;
    await markAdminNotificationAsRead(id, token);
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const handleMarkAsUnread = async (id: string) => {
    if (!token) return;
    await markAdminNotificationAsUnread(id, token);
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: false } : item))
    );
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    await deleteAdminNotification(id, token);
    setNotifications((current) => current.filter((item) => item.id !== id));
  };

  const handleReadAll = async () => {
    if (!token) return;
    await markAllAdminNotificationsAsRead(token);
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  };

  const handleDeleteAll = async () => {
    if (!token) return;
    await deleteAllAdminNotifications(token);
    setNotifications([]);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Suivez les nouvelles reservations et accedez rapidement aux demandes clients.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
            {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
          </Badge>
          {unreadCount > 0 ? (
            <Button onClick={handleReadAll} variant="outline" size="sm">
              <Check className="mr-2 h-4 w-4" />
              Tout marquer comme lu
            </Button>
          ) : null}
          {notifications.length > 0 ? (
            <Button onClick={handleDeleteAll} variant="outline" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Tout supprimer
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Affinez la liste des notifications du back-office.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Recherche</label>
            <Input
              placeholder="Rechercher dans les notifications..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Statut</label>
            <Select value={filter} onValueChange={(value: "all" | "read" | "unread") => setFilter(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="unread">Non lues</SelectItem>
                <SelectItem value="read">Lues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Chargement des notifications...
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium text-foreground">Aucune notification</h3>
              <p className="text-muted-foreground">
                {searchTerm || filter !== "all"
                  ? "Aucune notification ne correspond a vos criteres."
                  : "Vous n'avez aucune notification pour le moment."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border-border/50 transition-all duration-200 ${
                !notification.read ? "border-emerald-200 bg-emerald-50/40" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`text-base text-foreground ${!notification.read ? "font-semibold" : "font-medium"}`}>
                        {notification.title}
                      </h3>
                      {!notification.read ? (
                        <Badge className="bg-emerald-500 text-white">Nouveau</Badge>
                      ) : null}
                      <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                        {notification.priority === "high" ? "Haute" : notification.priority === "medium" ? "Moyenne" : "Basse"}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{notification.message}</p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(notification.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => void handleOpenNotification(notification)}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {!notification.read ? (
                      <Button variant="ghost" size="sm" onClick={() => void handleMarkAsRead(notification.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => void handleMarkAsUnread(notification.id)}>
                        <Bell className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => void handleDelete(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminNotificationsPage() {
  return <AdminNotifications />;
}
