"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BudgetFormPayload = {
  idCategorieClient: string;
  gamme: string;
  nombrePersonnes: number;
  prixNormal: number;
  reduction: number;
  prixAvecReduction: number;
  planificationId: string;
};

type BudgetFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: BudgetFormPayload) => Promise<void>;
  planificationId: string;
  initialBudget?: {
    idCategorieClient?: string;
    gamme?: string;
    nombrePersonnes?: number;
    prixNormal?: number;
    prixAvecReduction?: number;
    reduction?: number;
  } | null;
  categoriesClient?: Array<{ id: string; nom: string }>;
};

export function BudgetFormModal({
  open,
  onClose,
  onSave,
  planificationId,
  initialBudget,
  categoriesClient = [],
}: BudgetFormModalProps) {
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    idCategorieClient: "",
    gamme: "MOYENNE",
    nombrePersonnes: 1,
    prixNormal: "",
    prixAvecReduction: "",
    reduction: 0,
  });

  useEffect(() => {
    setSubmitError("");

    if (initialBudget) {
      setFormData({
        idCategorieClient: initialBudget.idCategorieClient || "",
        gamme: initialBudget.gamme || "MOYENNE",
        nombrePersonnes: initialBudget.nombrePersonnes || 1,
        prixNormal: initialBudget.prixNormal?.toString() || "",
        prixAvecReduction: initialBudget.prixAvecReduction?.toString() || "",
        reduction: initialBudget.reduction || 0,
      });
      return;
    }

    setFormData({
      idCategorieClient: "",
      gamme: "MOYENNE",
      nombrePersonnes: 1,
      prixNormal: "",
      prixAvecReduction: "",
      reduction: 0,
    });
  }, [initialBudget, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const prixNormal = parseFloat(formData.prixNormal);
    const prixAvecReduction = formData.prixAvecReduction
      ? parseFloat(formData.prixAvecReduction)
      : prixNormal * (100 - formData.reduction) / 100;

    if (!planificationId) {
      setSubmitError("Aucune planification n'est selectionnee.");
      return;
    }

    if (!formData.idCategorieClient) {
      setSubmitError("La categorie client est obligatoire.");
      return;
    }

    if (!Number.isFinite(prixNormal) || prixNormal < 0) {
      setSubmitError("Le prix normal doit etre valide.");
      return;
    }

    if (!Number.isFinite(formData.nombrePersonnes) || formData.nombrePersonnes <= 0) {
      setSubmitError("Le nombre de personnes doit etre superieur a 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        idCategorieClient: formData.idCategorieClient,
        gamme: formData.gamme,
        nombrePersonnes: formData.nombrePersonnes,
        prixNormal,
        reduction: formData.reduction,
        prixAvecReduction,
        planificationId,
      });
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Impossible d'enregistrer le budget.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialBudget ? "Modifier le budget" : "Ajouter un budget"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Categorie client</Label>
            <Select
              value={formData.idCategorieClient}
              onValueChange={(value) => setFormData({ ...formData, idCategorieClient: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner une categorie client" />
              </SelectTrigger>
              <SelectContent>
                {categoriesClient.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Gamme</Label>
            <Select
              value={formData.gamme}
              onValueChange={(value) => setFormData({ ...formData, gamme: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner une gamme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MOYENNE">Moyenne</SelectItem>
                <SelectItem value="LUXE">Luxe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nombre de personnes</Label>
            <Input
              type="number"
              min="1"
              value={formData.nombrePersonnes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nombrePersonnes: parseInt(e.target.value, 10) || 1,
                })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Prix normal</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.prixNormal}
              onChange={(e) => {
                const prixNormal = e.target.value;
                const reduction = formData.reduction;
                const prixAvecReduction = parseFloat(prixNormal) * (100 - reduction) / 100;
                setFormData({
                  ...formData,
                  prixNormal,
                  prixAvecReduction: Number.isNaN(prixAvecReduction) ? "" : prixAvecReduction.toString(),
                });
              }}
              placeholder="Ex: 50000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Reduction (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.reduction}
              onChange={(e) => {
                const reduction = parseInt(e.target.value, 10) || 0;
                const prixNormal = parseFloat(formData.prixNormal);
                const prixAvecReduction = prixNormal * (100 - reduction) / 100;
                setFormData({
                  ...formData,
                  reduction,
                  prixAvecReduction: Number.isNaN(prixAvecReduction) ? "" : prixAvecReduction.toString(),
                });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Prix apres reduction</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.prixAvecReduction}
              onChange={(e) => setFormData({ ...formData, prixAvecReduction: e.target.value })}
              placeholder="Calcule automatiquement"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              {isSubmitting ? "Enregistrement..." : initialBudget ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
