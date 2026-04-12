"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Search, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBreadcrumbs } from "../contexts/breadcrumbs-context";

export function AdminAvis() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [avis] = useState<any[]>([]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Avis", isActive: true }
    ]);
  }, [setBreadcrumbs]);

  const [searchTerm, setSearchTerm] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Avis des clients
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez et modérez tous les avis laissés par vos clients.
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
        {avis.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Aucun avis trouvé
              </h3>
              <p className="text-muted-foreground">
                Vous n'avez aucun avis pour le moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          avis.map((review) => (
            <Card key={review.id} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    {review.clientAvatar && <AvatarImage src={review.clientAvatar} />}
                    <AvatarFallback>
                      {review.clientName?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{review.clientName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(review.date)}
                    </p>
                    <p className="text-sm text-foreground mt-2">
                      {review.comment}
                    </p>
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
