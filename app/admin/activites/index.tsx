"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  createActivite,
  createActiviteCategorie,
  deleteActivite,
  getActivite,
  listActiviteCategories,
  listActivites,
  updateActivite,
} from "@/lib/api/activites";
import { getErrorMessage } from "@/lib/api/client";
import {
  Activite,
  CategorieActivite,
  SaveActivitePayload,
} from "@/lib/type/activite";

import { AdminActivitesCategories } from "./categories";
import { AdminActivitesCreation } from "./creation";
import { ActiviteFormState } from "./form";
import { AdminActivitesListe } from "./liste-view";
import { AdminActivitesModif } from "./modif";

type AdminActivitesProps = {
  accessToken: string;
  initialView?: "liste" | "creation" | "modif" | "categories";
  onRequestCreate?: () => void;
  onRequestEdit?: (id: string) => void;
  editId?: string | null;
};

const initialFormState: ActiviteFormState = {
  nom: "",
  slug: "",
  description: "",
  imagePrincipale: "",
  imageFile: null,
  dureeHeures: "0",
  participantMin: "0",
  participantsMax: "",
  niveauxDeDifficulte: "",
  latitude: "-18.8792",
  longitude: "47.5079",
  estActif: true,
  idCategorie: "",
  equipementsFournis: [],
};

function makeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formFromActivite(activite: Activite): ActiviteFormState {
  return {
    nom: activite.nom ?? "",
    slug: activite.slug ?? "",
    description: activite.description ?? "",
    imagePrincipale: activite.imagePrincipale ?? "",
    imageFile: null,
    dureeHeures: String(activite.dureeHeures ?? 0),
    participantMin: String(activite.participantMin ?? 0),
    participantsMax: activite.participantsMax ?? "",
    niveauxDeDifficulte: activite.niveauxDeDifficulte ?? "",
    latitude: String(activite.latitude ?? 0),
    longitude: String(activite.longitude ?? 0),
    estActif: Boolean(activite.estActif),
    idCategorie: activite.idCategorie ?? "",
    equipementsFournis: activite.equipementsFournis ?? [],
  };
}

function payloadFromForm(form: ActiviteFormState): SaveActivitePayload {
  return {
    nom: form.nom.trim(),
    slug: form.slug.trim(),
    description: form.description.trim(),
    imagePrincipale: form.imagePrincipale.trim(),
    imageFile: form.imageFile,
    dureeHeures: Number(form.dureeHeures),
    participantMin: Number(form.participantMin),
    participantsMax: form.participantsMax.trim(),
    niveauxDeDifficulte: form.niveauxDeDifficulte.trim(),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    estActif: form.estActif,
    idCategorie: form.idCategorie,
    equipementsFournis: form.equipementsFournis,
  };
}

export function AdminActivites({
  accessToken,
  initialView = "liste",
  onRequestCreate,
  onRequestEdit,
  editId = null,
}: AdminActivitesProps) {
  const [activites, setActivites] = useState<Activite[]>([]);
  const [categories, setCategories] = useState<CategorieActivite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [mode, setMode] = useState<"liste" | "creation" | "modif" | "categories">(
    initialView
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ActiviteFormState>(initialFormState);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newEquipementName, setNewEquipementName] = useState("");
  const [taxonomyMessage, setTaxonomyMessage] = useState("");

  const sortedActivites = useMemo(
    () =>
      [...activites].sort((a, b) =>
        a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
      ),
    [activites]
  );

  const loadActivites = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await listActivites(accessToken);
      setActivites(response.data ?? []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Impossible de charger les activites"));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await listActiviteCategories(accessToken);
      setCategories(response.data ?? []);
    } catch (loadError) {
      setTaxonomyMessage(
        getErrorMessage(loadError, "Impossible de charger les categories")
      );
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    loadActivites();
  }, [accessToken, loadActivites]);

  useEffect(() => {
    if (initialView === "creation") {
      resetFormState();
      setMode("creation");
      return;
    }

    if (initialView === "modif") {
      setMode("modif");
      return;
    }

    if (initialView === "categories") {
      setMode("categories");
      return;
    }

    setMode("liste");
  }, [initialView]);

  useEffect(() => {
    if (!accessToken) return;
    if (mode === "creation" || mode === "modif" || mode === "categories") {
      loadCategories();
    }
  }, [accessToken, mode, loadCategories]);

  function updateForm<K extends keyof ActiviteFormState>(
    key: K,
    value: ActiviteFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetFormState() {
    setForm(initialFormState);
    setNewCategoryName("");
    setNewEquipementName("");
    setTaxonomyMessage("");
    setEditingId(null);
  }

  function openCreate() {
    if (onRequestCreate) {
      onRequestCreate();
      return;
    }
    resetFormState();
    setMode("creation");
    setError("");
    setSuccessMessage("");
  }

  const openEdit = useCallback(
    async (id: string) => {
      if (onRequestEdit) {
        onRequestEdit(id);
        return;
      }

      setMode("modif");
      setEditingId(id);
      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      try {
        const response = await getActivite(id, accessToken);
        await loadCategories();
        if (response.data) {
          setForm(formFromActivite(response.data));
        }
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Impossible de charger cette activite"));
        setMode("liste");
      } finally {
        setIsSaving(false);
      }
    },
    [accessToken, loadCategories, onRequestEdit]
  );

  useEffect(() => {
    if (initialView !== "modif" || !editId || !accessToken) return;
    void openEdit(editId);
  }, [initialView, editId, accessToken, openEdit]);

  function closeDialog() {
    setMode("liste");
    resetFormState();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = payloadFromForm(form);
      const response =
        mode === "modif" && editingId
          ? await updateActivite(editingId, payload, accessToken)
          : await createActivite(payload, accessToken);

      const saved = response.data;
      if (saved) {
        setActivites((current) => {
          if (mode === "modif" && editingId) {
            return current.map((item) => (item.id === editingId ? saved : item));
          }
          return [saved, ...current];
        });
      }

      setSuccessMessage(
        mode === "modif"
          ? "Activite modifiee avec succes."
          : "Activite creee avec succes."
      );

      if (initialView === "creation" && mode === "creation") {
        resetFormState();
      } else {
        closeDialog();
      }
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'enregistrer l'activite"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Supprimer cette activite ?");
    if (!confirmed) return;

    setIsDeletingId(id);
    setError("");
    setSuccessMessage("");

    try {
      await deleteActivite(id, accessToken);
      setActivites((current) => current.filter((item) => item.id !== id));
      setSuccessMessage("Activite supprimee avec succes.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer l'activite"));
    } finally {
      setIsDeletingId(null);
    }
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    setTaxonomyMessage("");

    try {
      const response = await createActiviteCategorie(newCategoryName.trim(), accessToken);
      if (response.data) {
        setCategories((current) => [...current, response.data!]);
        setForm((current) => ({
          ...current,
          idCategorie: response.data?.id ?? current.idCategorie,
        }));
      }
      setNewCategoryName("");
      setTaxonomyMessage("Categorie ajoutee avec succes.");
    } catch (createError) {
      setTaxonomyMessage(
        getErrorMessage(createError, "Impossible d'ajouter la categorie")
      );
    }
  }

  return (
    <>
      {mode === "liste" ? (
        <AdminActivitesListe
          activites={sortedActivites}
          isLoading={isLoading}
          isDeletingId={isDeletingId}
          error={error}
          successMessage={successMessage}
          onRefresh={loadActivites}
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ) : null}

      {mode === "categories" ? (
        <AdminActivitesCategories
          categories={categories}
          newCategoryName={newCategoryName}
          taxonomyMessage={taxonomyMessage}
          onCategoryNameChange={setNewCategoryName}
          onCreateCategory={handleCreateCategory}
        />
      ) : null}

      <AdminActivitesCreation
        open={mode === "creation"}
        embedded={mode === "creation" && initialView === "creation"}
        form={form}
        categories={categories}
        error={error}
        successMessage={successMessage}
        isSaving={isSaving}
        newCategoryName={newCategoryName}
        newEquipementName={newEquipementName}
        taxonomyMessage={taxonomyMessage}
        onOpenChange={(value) => {
          if (!value) closeDialog();
        }}
        onSubmit={handleSubmit}
        onCreateCategory={handleCreateCategory}
        onCategoryNameChange={setNewCategoryName}
        onEquipementNameChange={setNewEquipementName}
        onUpdate={updateForm}
        makeSlug={makeSlug}
      />

      <AdminActivitesModif
        open={mode === "modif"}
        embedded={mode === "modif" && initialView === "modif"}
        form={form}
        categories={categories}
        error={error}
        successMessage={successMessage}
        isSaving={isSaving}
        newCategoryName={newCategoryName}
        newEquipementName={newEquipementName}
        taxonomyMessage={taxonomyMessage}
        onOpenChange={(value) => {
          if (!value) closeDialog();
        }}
        onSubmit={handleSubmit}
        onCreateCategory={handleCreateCategory}
        onCategoryNameChange={setNewCategoryName}
        onEquipementNameChange={setNewEquipementName}
        onUpdate={updateForm}
        makeSlug={makeSlug}
      />
    </>
  );
}
