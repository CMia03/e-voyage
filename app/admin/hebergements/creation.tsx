"use client";

import { CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { HebergementForm, HebergementFormState } from "./form";
import { EquipementHebergement, TypeHebergement } from "@/lib/type/hebergement";

type AdminHebergementsCreationProps = {
  open: boolean;
  embedded?: boolean;
  form: HebergementFormState;
  types: TypeHebergement[];
  equipements: EquipementHebergement[];
  error?: string;
  successMessage?: string;
  isSaving: boolean;
  newTypeName: string;
  newEquipementName: string;
  taxonomyMessage: string;
  onOpenChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCreateType: () => void;
  onCreateEquipement: () => void;
  onTypeNameChange: (value: string) => void;
  onEquipementNameChange: (value: string) => void;
  onUpdate: <K extends keyof HebergementFormState>(
    key: K,
    value: HebergementFormState[K]
  ) => void;
  makeSlug: (value: string) => string;
};

export function AdminHebergementsCreation({
  open,
  embedded = false,
  form,
  types,
  equipements,
  error = "",
  successMessage = "",
  isSaving,
  newTypeName,
  newEquipementName,
  taxonomyMessage,
  onOpenChange,
  onSubmit,
  onCreateType,
  onCreateEquipement,
  onTypeNameChange,
  onEquipementNameChange,
  onUpdate,
  makeSlug,
}: AdminHebergementsCreationProps) {
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  // Gérer l'affichage des alertes
  useEffect(() => {
    if (successMessage) {
      const showTimeout = setTimeout(() => setShowSuccessAlert(true), 0);
      const hideTimeout = setTimeout(() => setShowSuccessAlert(false), 3000);
      return () => {
        clearTimeout(showTimeout);
        clearTimeout(hideTimeout);
      };
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const showTimeout = setTimeout(() => setShowErrorAlert(true), 0);
      const hideTimeout = setTimeout(() => setShowErrorAlert(false), 3000);
      return () => {
        clearTimeout(showTimeout);
        clearTimeout(hideTimeout);
      };
    }
  }, [error]);

  const successAlert = successMessage && showSuccessAlert ? (
    <Alert
      key={successMessage}
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
    <HebergementForm
      form={form}
      types={types}
      equipements={equipements}
      isSaving={isSaving}
      newTypeName={newTypeName}
      newEquipementName={newEquipementName}
      taxonomyMessage={taxonomyMessage}
      submitLabel="Creer"
      onSubmit={onSubmit}
      onCancel={() => onOpenChange(false)}
      onCreateType={onCreateType}
      onCreateEquipement={onCreateEquipement}
      onTypeNameChange={onTypeNameChange}
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
            Ajouter un hebergement
          </h1>
          <p className="text-sm text-muted-foreground">
            Remplis le formulaire et clique sur la carte pour choisir latitude et longitude.
          </p>
        </div>
        {errorAlert}
        {successAlert}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Formulaire</CardTitle>
            <CardDescription>Creation d&apos;un hebergement</CardDescription>
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
          <DialogTitle>Creation d&apos;un hebergement</DialogTitle>
          <DialogDescription>
            Clique sur la carte pour choisir la latitude et la longitude.
          </DialogDescription>
        </DialogHeader>
        {errorAlert}
        {successAlert}
        {content}
      </DialogContent>
    </Dialog>
  );
}
