"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X, Trash2, Eye, Clock, User, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useBreadcrumbs } from "../contexts/breadcrumbs-context";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  user?: string;
  priority: "low" | "medium" | "high";
}

export function AdminNotifications() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Nouvelle réservation",
      message: "Une nouvelle réservation a été effectuée pour l'hébergement 'Villa Paradis'",
      type: "info",
      read: false,
      createdAt: "2024-01-15T10:30:00",
      user: "Jean Dupont",
      priority: "medium"
    },
    {
      id: "2",
      title: "Paiement confirmé",
      message: "Le paiement pour la réservation #1234 a été confirmé avec succès",
      type: "success",
      read: false,
      createdAt: "2024-01-15T09:15:00",
      user: "Marie Martin",
      priority: "low"
    },
    {
      id: "3",
      title: "Alerte disponibilité",
      message: "L'hébergement 'Appartement Vue Mer' n'a plus de disponibilités pour la période demandée",
      type: "warning",
      read: true,
      createdAt: "2024-01-14T16:45:00",
      priority: "high"
    },
    {
      id: "4",
      title: "Nouvel avis client",
      message: "Un client a laissé un avis 5 étoiles pour l'activité 'Tour en bateau'",
      type: "success",
      read: true,
      createdAt: "2024-01-14T14:20:00",
      priority: "medium"
    },
    {
      id: "5",
      title: "Erreur système",
      message: "Une erreur est survenue lors de la synchronisation des données",
      type: "error",
      read: false,
      createdAt: "2024-01-14T11:30:00",
      priority: "high"
    }
  ]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Notifications", isActive: true }
    ]);
  }, [setBreadcrumbs]);

  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "info" | "success" | "warning" | "error">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = 
      filter === "all" || 
      (filter === "read" && notification.read) || 
      (filter === "unread" && !notification.read);
    
    const matchesType = 
      typeFilter === "all" || 
      notification.type === typeFilter;
    
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesType && matchesSearch;
  });

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAsUnread = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: false } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "info": return <Bell className="h-4 w-4 text-blue-500" />;
      case "success": return <Check className="h-4 w-4 text-green-500" />;
      case "warning": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "error": return <X className="h-4 w-4 text-red-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Il y a quelques minutes";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return "Hier";
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez toutes vos notifications et alertes système.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </Badge>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="mr-2 h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
          {notifications.length > 0 && (
            <Button onClick={clearAllNotifications} variant="outline" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Tout supprimer
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Filtrer les notifications selon différents critères</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <Input
                placeholder="Rechercher dans les notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={(value: "all" | "info" | "success" | "warning" | "error") => setTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="info">Informations</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="warning">Avertissements</SelectItem>
                  <SelectItem value="error">Erreurs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Aucune notification
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || filter !== "all" || typeFilter !== "all"
                  ? "Aucune notification ne correspond à vos critères de recherche."
                  : "Vous n'avez aucune notification pour le moment."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`border-border/50 transition-all duration-200 ${
                !notification.read 
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" 
                  : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`font-medium text-foreground ${
                          !notification.read ? "font-semibold" : ""
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <Badge variant="default" className="bg-emerald-500 text-white">
                            Nouveau
                          </Badge>
                        )}
                        <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                          {notification.priority === "high" ? "Haute" : 
                           notification.priority === "medium" ? "Moyenne" : "Basse"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(notification.createdAt)}
                        </div>
                        {notification.user && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {notification.user}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read ? (
                      <Button
                        onClick={() => markAsRead(notification.id)}
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => markAsUnread(notification.id)}
                        variant="ghost"
                        size="sm"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteNotification(notification.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
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
