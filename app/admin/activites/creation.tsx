"use client";

import { CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategorieActivite } from "@/lib/type/activite";

import { ActiviteForm, ActiviteFormState } from "./form";

type AdminActivitesCreationProps = {
  open: boolean;
  embedded?: boolean;
  form: ActiviteFormState;
  categories: CategorieActivite[];
  error?: string;
  successMessage?: string;
  isSaving: boolean;
  newCategoryName: string;
  newEquipementName: string;
  taxonomyMessage: string;
  onOpenChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCreateCategory: () => void;
  onCategoryNameChange: (value: string) => void;
  onEquipementNameChange: (value: string) => void;
  onUpdate: <K extends keyof ActiviteFormState>(
    key: K,
    value: ActiviteFormState[K]
  ) => void;
  makeSlug: (value: string) => string;
};

export function AdminActivitesCreation({
  open,
  embedded = false,
  form,
  categories,
  error = "",
  successMessage = "",
  isSaving,
  newCategoryName,
  newEquipementName,
  taxonomyMessage,
  onOpenChange,
  onSubmit,
  onCreateCategory,
  onCategoryNameChange,
  onEquipementNameChange,
  onUpdate,
  makeSlug,
}: AdminActivitesCreationProps) {
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!successMessage) {
      setShowSuccessAlert(false);
      return;
    }

    setShowSuccessAlert(true);
    const timeout = window.setTimeout(() => {
      setShowSuccessAlert(false);
    }, 3000);

    // Redirection automatique vers la liste des activités après succès
    const redirectTimeout = window.setTimeout(() => {
      router.push("/admin?section=activites");
    }, 1500);

    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(redirectTimeout);
    };
  }, [successMessage, router]);

  useEffect(() => {
    if (!error) {
      setShowErrorAlert(false);
      return;
    }

    setShowErrorAlert(true);
    const timeout = window.setTimeout(() => {
      setShowErrorAlert(false);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [error]);

  const successAlert = successMessage && showSuccessAlert ? (
    <Alert
      variant="success"
      className="fixed right-6 top-24 z-[70] w-[min(420px,calc(100vw-2rem))] border-emerald-300 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <AlertTitle>Succes</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </div>
        <button
          type="button"
          onClick={() => setShowSuccessAlert(false)}
          className="rounded-md p-1 text-emerald-700/70 transition-colors hover:bg-emerald-100 hover:text-emerald-900"
          aria-label="Fermer l'alerte"
        >
          <X className="size-4" />
        </button>
      </div>
    </Alert>
  ) : null;

  const errorAlert = error && showErrorAlert ? (
    <Alert
      variant="destructive"
      className="fixed right-6 top-24 z-[70] w-[min(420px,calc(100vw-2rem))] shadow-xl"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </div>
        <button
          type="button"
          onClick={() => setShowErrorAlert(false)}
          className="rounded-md p-1 text-red-700/70 transition-colors hover:bg-red-100 hover:text-red-900"
          aria-label="Fermer l'alerte"
        >
          <X className="size-4" />
        </button>
      </div>
    </Alert>
  ) : null;

  const content = (
    <ActiviteForm
      form={form}
      categories={categories}
      isSaving={isSaving}
      newCategoryName={newCategoryName}
      newEquipementName={newEquipementName}
      taxonomyMessage={taxonomyMessage}
      submitLabel="Creer"
      onSubmit={onSubmit}
      onCancel={() => onOpenChange(false)}
      onCreateCategory={onCreateCategory}
      onCategoryNameChange={onCategoryNameChange}
      onEquipementNameChange={onEquipementNameChange}
      onUpdate={onUpdate}
      makeSlug={makeSlug}
    />
  );

  if (embedded) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Ajouter une activite
          </h1>
          <p className="text-sm text-muted-foreground">
            Cree une activite et positionne-la sur la carte.
          </p>
        </div>
        {errorAlert}
        {successAlert}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Formulaire</CardTitle>
            <CardDescription>Creation d&apos;une activite</CardDescription>
          </CardHeader>
          <CardContent>{content}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter une activite</DialogTitle>
          <DialogDescription>
            Remplis les informations de l&apos;activite puis choisis sa position.
          </DialogDescription>
        </DialogHeader>
        {errorAlert}
        {successAlert}
        {content}
      </DialogContent>
    </Dialog>
  );
}
