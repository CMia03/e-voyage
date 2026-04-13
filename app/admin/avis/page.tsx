"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Search, Calendar, MapPin, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBreadcrumbs } from "../contexts/breadcrumbs-context";
import { getAllNotationsFromApi, NotationData } from "@/lib/api/notations";

export function AdminAvis() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [avis, setAvis] = useState<NotationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState("dest1"); // Destination par défaut

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Avis", isActive: true }
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const fetchNotations = async () => {
      try {
        setLoading(true);
        const response = await getAllNotationsFromApi();
        if (response.success) {
          setAvis(response.data);
        }
      } catch (error) {
        console.error('Error fetching notations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotations();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const filteredAvis = avis.filter((avi) =>
    avi.nomUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
    avi.nomDestination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Avis des clients
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez et modérez les avis pour la destination sélectionnée.
          </p>
        </div>
      </div>

    

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Recherche</CardTitle>
          <CardDescription>Rechercher dans les avis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les avis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Chargement des avis...
              </h3>
            </CardContent>
          </Card>
        ) : filteredAvis.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? "Aucun avis trouvé pour cette recherche" : "Aucun avis trouvé"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Essayez une autre recherche." : "Vous n'avez aucun avis pour le moment."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAvis.map((avi) => (
            <Card key={avi.idAvis} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {avi.nomUser?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground">{avi.nomUser}</h3>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < avi.nombreEtoiles
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-300 text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium text-foreground">
                          {avi.nombreEtoiles}/5
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{avi.nomDestination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(avi.dateCreation)}</span>
                    </div>
                    {avi.status && (
                      <div className="mt-2">
                        <Badge variant={avi.status === 'actif' ? 'default' : 'secondary'}>
                          {avi.status}
                        </Badge>
                      </div>
                    )}
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

export default AdminAvis;
