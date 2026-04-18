"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { mockDestinations } from "@/lib/data/mock-reservations";
import { CreateReservationPayload } from "@/lib/type/reservation";
import { useBreadcrumbs } from "@/app/admin/contexts/breadcrumbs-context";

export default function AjoutReservationPage() {
  const router = useRouter();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateReservationPayload>({
    nomPrenom: "",
    destination: "",
    budget: 0,
    nombrePersonnes: 1
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Réservations", href: "/admin?section=reservations" },
      { label: "Ajouter une réservation", isActive: true }
    ]);
  }, [setBreadcrumbs]);

  const handleInputChange = (field: keyof CreateReservationPayload, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulation d'ajout de réservation
      console.log("Nouvelle réservation:", formData);
      
      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Rediriger vers la liste des réservations
      router.push("/admin/reservations");
    } catch (error) {
      console.error("Erreur lors de l'ajout de la réservation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.nomPrenom.trim() !== "" && 
                     formData.destination !== "" && 
                     formData.budget > 0 && 
                     formData.nombrePersonnes > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Ajouter une réservation</h1>
          <p className="text-muted-foreground">
            Créer une nouvelle réservation pour un client
          </p>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Informations de la réservation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom et Prénom *</label>
                <Input
                  value={formData.nomPrenom}
                  onChange={(e) => handleInputChange("nomPrenom", e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Destination *</label>
                <Select
                  value={formData.destination}
                  onValueChange={(value) => handleInputChange("destination", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDestinations.map((destination) => (
                      <SelectItem key={destination} value={destination}>
                        {destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Budget (Ar) *</label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => handleInputChange("budget", parseInt(e.target.value) || 0)}
                  placeholder="Ex: 1500000"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de personnes *</label>
                <Input
                  type="number"
                  value={formData.nombrePersonnes}
                  onChange={(e) => handleInputChange("nombrePersonnes", parseInt(e.target.value) || 1)}
                  placeholder="Ex: 4"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
