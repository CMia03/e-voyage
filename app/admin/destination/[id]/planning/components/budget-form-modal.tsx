"use client";

import { useState, useEffect } from "react";
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

type BudgetFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  planificationId: string;
  initialBudget?: any;
  categoriesClient?: Array<{ id: string; nom: string }>; // ← AJOUTE cette prop
};

export function BudgetFormModal({ 
  open, 
  onClose, 
  onSave, 
  planificationId, 
  initialBudget,
  categoriesClient = [] // ← Valeur par défaut
}: BudgetFormModalProps) {
  const [formData, setFormData] = useState({
    idCategorieClient: "", // ← CHANGE: utilise l'ID au lieu du nom
    gamme: "MOYENNE",
    nombrePersonnes: 1,
    prixNormal: "",
    prixAvecReduction: "",
    reduction: 0,
  });

  useEffect(() => {
    if (initialBudget) {
      setFormData({
        idCategorieClient: initialBudget.idCategorieClient || "", // ← utilise l'ID
        gamme: initialBudget.gamme || "MOYENNE",
        nombrePersonnes: initialBudget.nombrePersonnes || 1,
        prixNormal: initialBudget.prixNormal?.toString() || "",
        prixAvecReduction: initialBudget.prixAvecReduction?.toString() || "",
        reduction: initialBudget.reduction || 0,
      });
    } else {
      setFormData({
        idCategorieClient: "",
        gamme: "MOYENNE",
        nombrePersonnes: 1,
        prixNormal: "",
        prixAvecReduction: "",
        reduction: 0,
      });
    }
  }, [initialBudget, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      idCategorieClient: formData.idCategorieClient, // ← Envoie l'ID
      gamme: formData.gamme,
      nombrePersonnes: formData.nombrePersonnes,
      prixNormal: parseFloat(formData.prixNormal),
      reduction: formData.reduction,
      prixAvecReduction: formData.prixAvecReduction 
        ? parseFloat(formData.prixAvecReduction) 
        : parseFloat(formData.prixNormal) * (100 - formData.reduction) / 100,
      planificationId,
    });
    onClose();
  };

  // Trouver le nom de la catégorie sélectionnée pour l'affichage
  const selectedCategorie = categoriesClient.find(c => c.id === formData.idCategorieClient);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialBudget ? "Modifier le budget" : "Ajouter un budget"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Catégorie client</Label>
            <Select
              value={formData.idCategorieClient}
              onValueChange={(value) => setFormData({ ...formData, idCategorieClient: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie client" />
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
                <SelectValue placeholder="Sélectionner une gamme" />
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
              onChange={(e) => setFormData({ ...formData, nombrePersonnes: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Prix normal</Label>
            <Input
              type="number"
              value={formData.prixNormal}
              onChange={(e) => {
                const prixNormal = e.target.value;
                const reduction = formData.reduction;
                const prixAvecReduction = parseFloat(prixNormal) * (100 - reduction) / 100;
                setFormData({ 
                  ...formData, 
                  prixNormal,
                  prixAvecReduction: isNaN(prixAvecReduction) ? "" : prixAvecReduction.toString()
                });
              }}
              placeholder="Ex: 50000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Réduction (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.reduction}
              onChange={(e) => {
                const reduction = parseInt(e.target.value);
                const prixNormal = parseFloat(formData.prixNormal);
                const prixAvecReduction = prixNormal * (100 - reduction) / 100;
                setFormData({ 
                  ...formData, 
                  reduction,
                  prixAvecReduction: isNaN(prixAvecReduction) ? "" : prixAvecReduction.toString()
                });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Prix après réduction</Label>
            <Input
              type="number"
              value={formData.prixAvecReduction}
              onChange={(e) => setFormData({ ...formData, prixAvecReduction: e.target.value })}
              placeholder="Calculé automatiquement"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              {initialBudget ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}