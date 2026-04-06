"use client";

import { Plus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EquipementHebergement, TypeHebergement } from "@/lib/type/hebergement";

type AdminHebergementsTaxonomiesProps = {
  section: "types" | "equipements";
  types: TypeHebergement[];
  equipements: EquipementHebergement[];
  newTypeName: string;
  newEquipementName: string;
  taxonomyMessage: string;
  onTypeNameChange: (value: string) => void;
  onEquipementNameChange: (value: string) => void;
  onCreateType: () => void;
  onCreateEquipement: () => void;
};

export function AdminHebergementsTaxonomies({
  section,
  types,
  equipements,
  newTypeName,
  newEquipementName,
  taxonomyMessage,
  onTypeNameChange,
  onEquipementNameChange,
  onCreateType,
  onCreateEquipement,
}: AdminHebergementsTaxonomiesProps) {
  const isTypes = section === "types";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {isTypes ? "Types d'hebergement" : "Equipements"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isTypes
            ? "Gerer les types utilises par les hebergements."
            : "Gerer les equipements disponibles pour les hebergements."}
        </p>
      </div>

      {taxonomyMessage ? (
        <Alert variant="success">
          <AlertTitle>Succes</AlertTitle>
          <AlertDescription>{taxonomyMessage}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>{isTypes ? "Ajouter un type" : "Ajouter un equipement"}</CardTitle>
            <CardDescription>
              {isTypes
                ? "Exemple: Hotel, Villa, Lodge"
                : "Exemple: Wi-Fi, Piscine, Restaurant"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={isTypes ? newTypeName : newEquipementName}
                onChange={(event) =>
                  isTypes
                    ? onTypeNameChange(event.target.value)
                    : onEquipementNameChange(event.target.value)
                }
                placeholder={isTypes ? "Nouveau type" : "Nouvel equipement"}
              />
              <Button type="button" onClick={isTypes ? onCreateType : onCreateEquipement}>
                <Plus className="size-4" />
                Ajouter
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>{isTypes ? "Liste des types" : "Liste des equipements"}</CardTitle>
            <CardDescription>
              {isTypes ? `${types.length} type(s)` : `${equipements.length} equipement(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {isTypes
                ? types.map((type) => (
                    <span
                      key={type.id}
                      className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                    >
                      {type.nom}
                    </span>
                  ))
                : equipements.map((equipement) => (
                    <span
                      key={equipement.id}
                      className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                    >
                      {equipement.equipement}
                    </span>
                  ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
