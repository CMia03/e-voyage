"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale/fr";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { AdminHeader } from "@/app/admin/components/header";
import { AdminSidebar, type AdminSection } from "@/app/admin/components/sidebar";
import { AdminFooter } from "@/app/admin/components/footer";
import { AdminDashboard } from "@/app/admin/dashboard";
import { AdminDestinations } from "@/app/admin/destinations";
import { AdminActivites } from "@/app/admin/activites/page";
import { AdminHebergements } from "@/app/admin/hebergements/page";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

const locales = {
  fr: fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function AdminPage() {
  const { session, isLoading, isAuthenticated, getValidToken } = useAuth();
  const searchParams = useSearchParams();
  const section = searchParams.get("section");
  const [active, setActive] = useState<AdminSection>(section as AdminSection || "dashboard");
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);
  const [selectedActiviteId, setSelectedActiviteId] = useState<string | null>(null);
  const [selectedHebergementId, setSelectedHebergementId] = useState<string | null>(null);
  
  const accessToken = session?.accessToken ?? null;
  const role = session?.role ?? null;

  const [events, setEvents] = useState<Array<{
    id: number;
    title: string;
    start: Date;
    end: Date;
  }>>([]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<{
    id: number;
    title: string;
    start: Date;
    end: Date;
  } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [destinations, setDestinations] = useState<Array<{ id: string; nom: string }>>([]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    destinationId: "",
    start: new Date(),
    end: new Date(),
  });

  // Générer les années (année actuelle à +10 ans)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear + i);

  // Mettre à jour la date du calendrier quand l'année ou la date change
  useEffect(() => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(selectedYear);
    setCalendarDate(newDate);
  }, [selectedYear, selectedDate]);

  // Mettre à jour la section active quand le paramètre d'URL change
  useEffect(() => {
    if (section) {
      setActive(section as AdminSection);
    }
  }, [section]);

  // Charger les destinations depuis l'API
  const loadDestinations = async () => {
    try {
      // Importer la fonction API ici pour éviter les dépendances circulaires
      const { listAdminDestinations } = await import("@/lib/api/destinations");
      const response = await listAdminDestinations(accessToken || "");
      if (response.data) {
        setDestinations(response.data.map(dest => ({ id: dest.id, nom: dest.nom })));
      }
    } catch {
      // Erreur silencieuse lors du chargement des destinations
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadDestinations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Gérer le clic sur une date du calendrier
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setSelectedEvent(null);
    setIsEditMode(false);
    setNewEvent({
      title: "",
      destinationId: "",
      start,
      end,
    });
    setShowEventModal(true);
  };

  // Gérer le clic sur un événement existant
  const handleSelectEvent = (event: { id: number; title: string; start: Date; end: Date }) => {
    setSelectedEvent(event);
    setSelectedSlot(null);
    setIsEditMode(true);
    setNewEvent({
      title: event.title.split(' - ')[0] || event.title,
      destinationId: "",
      start: event.start,
      end: event.end,
    });
    setShowEventModal(true);
  };

  // Enregistrer un nouvel événement ou modifier un existant
  const handleSaveEvent = () => {
    if (newEvent.title && newEvent.destinationId) {
      const destination = destinations.find(d => d.id === newEvent.destinationId);
      const eventData = {
        title: `${newEvent.title} - ${destination?.nom || 'Destination'}`,
        start: newEvent.start,
        end: newEvent.end,
      };

      if (isEditMode && selectedEvent) {
        // Modifier l'événement existant
        setEvents(events.map(event => 
          event.id === selectedEvent.id 
            ? { ...event, ...eventData }
            : event
        ));
      } else {
        // Créer un nouvel événement
        const event = {
          id: Date.now(),
          ...eventData,
        };
        setEvents([...events, event]);
      }

      setShowEventModal(false);
      resetEventForm();
    }
  };

  // Supprimer un événement
  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(events.filter(event => event.id !== selectedEvent.id));
      setShowEventModal(false);
      resetEventForm();
    }
  };

  // Annuler la création/modification d'événement
  const handleCancelEvent = () => {
    setShowEventModal(false);
    resetEventForm();
  };

  // Réinitialiser le formulaire
  const resetEventForm = () => {
    setSelectedEvent(null);
    setSelectedSlot(null);
    setIsEditMode(false);
    setNewEvent({
      title: "",
      destinationId: "",
      start: new Date(),
      end: new Date(),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Accès non autorisé</h1>
          <p className="text-muted-foreground">Vous devez être connecté pour accéder à cette page.</p>
          <Link href="/login">
            <Button>Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background text-foreground">
        <AdminHeader />
        <main className="mx-auto w-full max-w-[800px] px-4 py-10 sm:py-16">
          <div className="rounded-2xl border border-border/50 bg-card/50 p-8 text-center backdrop-blur-sm">
            <h1 className="text-2xl font-semibold">Back office</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please login to access the admin area.
            </p>
            <div className="mt-6">
              <Button asChild variant="default">
                <Link href="/login">Se connecter</Link>
              </Button>
            </div>
          </div>
        </main>
        <AdminFooter />
      </div>
    );
  }

  if (role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background text-foreground">
        <AdminHeader />
        <main className="mx-auto w-full max-w-[800px] px-4 py-10 sm:py-16">
          <div className="rounded-2xl border border-border/50 bg-card/50 p-8 text-center backdrop-blur-sm">
            <h1 className="text-2xl font-semibold">Back office</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Access is limited for standard users.
            </p>
          </div>
        </main>
        <AdminFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background text-foreground">
      <AdminHeader />
      <div className="mx-auto flex w-full max-w-[1400px] min-h-screen">
        <AdminSidebar active={active} onSelect={setActive} />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 overflow-auto min-h-0">
          {active === "dashboard" ? (
            <AdminDashboard accessToken={accessToken ?? ""} role={role} />
          ) : active === "destinations" ? (
            <AdminDestinations
              accessToken={accessToken ?? ""}
              initialView="liste"
              onRequestCreate={() => setActive("destinations-create")}
              onRequestEdit={(id) => {
                setSelectedDestinationId(id);
                setActive("destinations-edit");
              }}
            />
          ) : active === "destinations-create" ? (
            <AdminDestinations accessToken={accessToken ?? ""} initialView="creation" />
          ) : active === "destinations-edit" ? (
            <AdminDestinations
              accessToken={accessToken ?? ""}
              initialView="modif"
              editId={selectedDestinationId}
            />
          ) : active === "activites" ? (
            <AdminActivites
              accessToken={accessToken ?? ""}
              initialView="liste"
              onRequestCreate={() => setActive("activites-create")}
              onRequestEdit={(id) => {
                setSelectedActiviteId(id);
                setActive("activites-edit");
              }}
            />
          ) : active === "activites-create" ? (
            <AdminActivites accessToken={accessToken ?? ""} initialView="creation" />
          ) : active === "activites-edit" ? (
            <AdminActivites
              accessToken={accessToken ?? ""}
              initialView="modif"
              editId={selectedActiviteId}
            />
          ) : active === "activites-categories" ? (
            <AdminActivites accessToken={accessToken ?? ""} initialView="categories" />
          ) : active === "hebergements" ? (
            <AdminHebergements
              accessToken={accessToken ?? ""}
              initialView="liste"
              onRequestCreate={() => setActive("hebergements-create")}
              onRequestEdit={(id) => {
                setSelectedHebergementId(id);
                setActive("hebergements-edit");
              }}
            />
          ) : active === "hebergements-create" ? (
            <AdminHebergements accessToken={accessToken ?? ""} initialView="creation" />
          ) : active === "hebergements-tarifs" ? (
            <AdminHebergements accessToken={accessToken ?? ""} initialView="tarifs" />
          ) : active === "hebergements-edit" ? (
            <AdminHebergements
              accessToken={accessToken ?? ""}
              initialView="modif"
              editId={selectedHebergementId}
            />
          ) : active === "hebergements-types" ? (
            <AdminHebergements accessToken={accessToken ?? ""} initialView="types" />
          ) : active === "hebergements-equipements" ? (
            <AdminHebergements
              accessToken={accessToken ?? ""}
              initialView="equipements"
            />
          ) : active === "planification" ? (
            <div className="space-y-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Planification
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Gestion de la planification et des plannings.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-medium">Année</Label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-medium">Date</Label>
                    <Input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-40"
                    />
                  </div>
                </div>
              </div>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Calendrier de planification</CardTitle>
                  <CardDescription>
                    Cliquez sur une date pour créer un événement
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-[600px]">
                    <Calendar
                      localizer={localizer}
                      events={events}
                      startAccessor="start"
                      endAccessor="end"
                      date={calendarDate}
                      onNavigate={(date) => setCalendarDate(date)}
                      onSelectSlot={handleSelectSlot}
                      onSelectEvent={handleSelectEvent}
                      selectable
                      style={{ height: "100%" }}
                      culture="fr"
                      messages={{
                        next: "Suivant",
                        previous: "Précédent",
                        today: "Aujourd'hui",
                        month: "Mois",
                        week: "Semaine",
                        day: "Jour",
                        agenda: "Agenda",
                        date: "Date",
                        time: "Heure",
                        event: "Événement",
                        noEventsInRange: "Aucun événement dans cette période.",
                      }}
                      eventPropGetter={() => ({
                        style: {
                          backgroundColor: "#10b981",
                          borderRadius: "4px",
                          border: "none",
                          color: "white",
                          cursor: "pointer",
                        },
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <AdminDestinations accessToken={accessToken ?? ""} initialView="liste" />
          )}
        </main>
      </div>
      
      {/* Modale pour créer un événement */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {isEditMode ? "Modifier un événement" : "Ajouter un événement"}
              </CardTitle>
              <CardDescription>
                {isEditMode 
                  ? "Modifiez les informations de l&apos;événement"
                  : "Créez un nouvel événement sur le calendrier"
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l&apos;événement</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Entrez un titre"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Select value={newEvent.destinationId} onValueChange={(value) => setNewEvent({ ...newEvent, destinationId: value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner une destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map(destination => (
                      <SelectItem key={destination.id} value={destination.id}>
                        {destination.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Date de départ</Label>
                  <Input
                    id="start"
                    type="date"
                    value={newEvent.start.toISOString().split('T')[0]}
                    onChange={(e) => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end">Date d&apos;arrivée</Label>
                  <Input
                    id="end"
                    type="date"
                    value={newEvent.end.toISOString().split('T')[0]}
                    onChange={(e) => setNewEvent({ ...newEvent, end: new Date(e.target.value) })}
                    min={newEvent.start.toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </CardContent>
            
            <div className="flex justify-between gap-3 px-6 pb-6">
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancelEvent}>
                  Annuler
                </Button>
                {isEditMode && (
                  <Button variant="destructive" onClick={handleDeleteEvent}>
                    Supprimer
                  </Button>
                )}
              </div>
              <Button 
                onClick={handleSaveEvent}
                disabled={!newEvent.title || !newEvent.destinationId}
                className="cursor-pointer"
              >
                {isEditMode ? "Mettre à jour" : "Enregistrer"}
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      <AdminFooter />
    </div>
  );
}
