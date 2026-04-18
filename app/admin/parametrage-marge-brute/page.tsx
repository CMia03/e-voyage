// app/admin/parametrage-marge-brute/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Pencil, Plus, Trash2, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { loadAuth } from "@/lib/auth";
import { listCategorieClientActivites } from "@/lib/api/activites";
import {
  listParametrages,
  createParametrage,
  updateParametrage,
  deleteParametrage,
  toggleParametrageActif
} from "@/lib/api/parametre";
import { ParametrageMargeBrute, ParametrageMargeBruteRequest } from "@/lib/type/Parametre";

type CategorieClient = {
  id: string;
  nom: string;
};

type Props = {
  accessToken: string;  // ← AJOUTE CETTE PROP
};

export function AdminParametrageMargeBrute({ accessToken }: Props) {
  const [parametrages, setParametrages] = useState<ParametrageMargeBrute[]>([]);
  const [categories, setCategories] = useState<CategorieClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingParametrage, setEditingParametrage] = useState<ParametrageMargeBrute | null>(null);
  
  const [formData, setFormData] = useState({
    minimumMargeBrute: "",
    pourcentageMargeBrute: "",
    idCategorieClient: "",
    estActif: true
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [parametragesRes, categoriesRes] = await Promise.all([
        listParametrages(accessToken),
        listCategorieClientActivites(accessToken)
      ]);
      
      if (parametragesRes.data) {
        setParametrages(parametragesRes.data);
      }
      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    } catch (err) {
      console.error("Erreur:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingParametrage(null);
    setFormData({
      minimumMargeBrute: "",
      pourcentageMargeBrute: "",
      idCategorieClient: "",
      estActif: true
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(parametrage: ParametrageMargeBrute) {
    setEditingParametrage(parametrage);
    setFormData({
      minimumMargeBrute: parametrage.minimumMargeBrute.toString(),
      pourcentageMargeBrute: parametrage.pourcentageMargeBrute.toString(),
      idCategorieClient: parametrage.idCategorieClient,
      estActif: parametrage.estActif
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: ParametrageMargeBruteRequest = {
        minimumMargeBrute: parseFloat(formData.minimumMargeBrute),
        pourcentageMargeBrute: parseFloat(formData.pourcentageMargeBrute),
        idCategorieClient: formData.idCategorieClient,
        estActif: formData.estActif
      };
      
      if (editingParametrage) {
        await updateParametrage(editingParametrage.id, payload, accessToken);
      } else {
        await createParametrage(payload, accessToken);
      }
      
      setIsDialogOpen(false);
      await loadData();
    } catch (err) {
      console.error("Erreur:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce paramétrage ?")) return;
    try {
      await deleteParametrage(id, accessToken);
      await loadData();
    } catch (err) {
      console.error("Erreur:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la suppression";
      setError(errorMessage);
    }
  }

  async function handleToggleActif(id: string) {
    try {
      await toggleParametrageActif(id, accessToken);
      await loadData();
    } catch (err) {
      console.error("Erreur:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du changement de statut";
      setError(errorMessage);
    }
  }

  const getCategorieNom = (id: string) => {
    return categories.find(c => c.id === id)?.nom || id;
  };

  if (loading && parametrages.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Paramétrage marge brute</h1>
          <p className="text-sm text-muted-foreground">
            Définissez les marges minimales et pourcentages par catégorie client
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une marge brute
        </Button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
          ❌ {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Liste des paramétrages</CardTitle>
          <CardDescription>
            Gestion des marges par catégorie client
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parametrages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun paramétrage enregistré.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Catégorie client</th>
                    <th className="text-left p-3">Marge minimale (Ar)</th>
                    <th className="text-left p-3">Pourcentage marge (%)</th>
                    <th className="text-left p-3">Statut</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parametrages.map((param) => (
                    <tr key={param.id} className="hover:bg-muted/20">
                      <td className="p-3 font-medium">
                        {getCategorieNom(param.idCategorieClient)}
                      </td>
                      <td className="p-3">
                        {param.minimumMargeBrute.toLocaleString()} Ar
                      </td>
                      <td className="p-3">
                        {param.pourcentageMargeBrute}%
                      </td>
                      <td className="p-3">
                        {param.estActif ? (
                          <Badge className="bg-emerald-500">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEditDialog(param)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleToggleActif(param.id)}>
                            {param.estActif ? (
                              <PowerOff className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Power className="h-4 w-4 text-emerald-500" />
                            )}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(param.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal d'ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingParametrage ? "Modifier le paramétrage" : "Ajouter un paramétrage"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Catégorie client *</Label>
              <Select
                value={formData.idCategorieClient}
                onValueChange={(value) => setFormData({ ...formData, idCategorieClient: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Marge brute minimale (Ar) *</Label>
              <Input
                type="number"
                min="0"
                step="1000"
                value={formData.minimumMargeBrute}
                onChange={(e) => setFormData({ ...formData, minimumMargeBrute: e.target.value })}
                placeholder="Ex: 50000"
                required
              />
              <p className="text-xs text-muted-foreground">Marge minimale acceptable pour cette catégorie</p>
            </div>

            <div className="space-y-2">
              <Label>Pourcentage de marge (%) *</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.pourcentageMargeBrute}
                onChange={(e) => setFormData({ ...formData, pourcentageMargeBrute: e.target.value })}
                placeholder="Ex: 30"
                required
              />
              <p className="text-xs text-muted-foreground">Pourcentage de marge souhaité</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="estActif"
                checked={formData.estActif}
                onChange={(e) => setFormData({ ...formData, estActif: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="estActif" className="text-sm font-normal">Paramétrage actif</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {editingParametrage ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export par défaut pour le lazy loading
export default AdminParametrageMargeBrute;