"use client";

import { Plus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CategorieActivite } from "@/lib/type/activite";

type AdminActivitesCategoriesProps = {
  categories: CategorieActivite[];
  newCategoryName: string;
  taxonomyMessage: string;
  onCategoryNameChange: (value: string) => void;
  onCreateCategory: () => void;
};

export function AdminActivitesCategories({
  categories,
  newCategoryName,
  taxonomyMessage,
  onCategoryNameChange,
  onCreateCategory,
}: AdminActivitesCategoriesProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Categories d&apos;activites
        </h1>
        <p className="text-sm text-muted-foreground">
          Gere les categories utilisees par les activites.
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
            <CardTitle>Ajouter une categorie</CardTitle>
            <CardDescription>Exemple: Randonnee, Plongee, Detente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={newCategoryName}
                onChange={(event) => onCategoryNameChange(event.target.value)}
                placeholder="Nouvelle categorie"
              />
              <Button type="button" onClick={onCreateCategory}>
                <Plus className="size-4" />
                Ajouter
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Liste des categories</CardTitle>
            <CardDescription>{categories.length} categorie(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((categorie) => (
                <span
                  key={categorie.id}
                  className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                >
                  {categorie.nom}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
