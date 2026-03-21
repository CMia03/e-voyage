"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  createHebergement,
  createHebergementEquipement,
  createHebergementType,
  deleteHebergement,
  getHebergement,
  listHebergementEquipements,
  listHebergementTypes,
  listHebergements,
  updateHebergement,
} from "@/lib/api/hebergements";
import { getErrorMessage } from "@/lib/api/client";
import {
  EquipementHebergement,
  Hebergement,
  SaveHebergementPayload,
  TypeHebergement,
} from "@/lib/type/hebergement";

import { AdminHebergementsCreation } from "./creation";
import { HebergementFormState } from "./form";
import { AdminHebergementsListe } from "./liste";
import { AdminHebergementsModif } from "./modif";
import { AdminHebergementsTaxonomies } from "./taxonomies";

type AdminHebergementsProps = {
  accessToken: string;
  initialView?: "liste" | "creation" | "modif" | "types" | "equipements";
  onRequestCreate?: () => void;
  onRequestEdit?: (id: string) => void;
  editId?: string | null;
};

const initialFormState: HebergementFormState = {
  nom: "",
  slug: "",
  description: "",
  adresse: "",
  urlImagePrincipale: "",
  imageFile: null,
  latitude: "-18.8792",
  longitude: "47.5079",
  nombreEtoiles: "0",
  telephone: "",
  email: "",
  siteWeb: "",
  estActif: true,
  idTypeHebergement: "",
  idsPlus: [],
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

function formFromHebergement(hebergement: Hebergement): HebergementFormState {
  return {
    nom: hebergement.nom ?? "",
    slug: hebergement.slug ?? "",
    description: hebergement.description ?? "",
    adresse: hebergement.adresse ?? "",
    urlImagePrincipale: hebergement.urlImagePrincipale ?? "",
    imageFile: null,
    latitude: String(hebergement.latitude ?? 0),
    longitude: String(hebergement.longitude ?? 0),
    nombreEtoiles: String(hebergement.nombreEtoiles ?? 0),
    telephone: hebergement.telephone ?? "",
    email: hebergement.email ?? "",
    siteWeb: hebergement.siteWeb ?? "",
    estActif: Boolean(hebergement.estActif),
    idTypeHebergement: hebergement.idTypeHebergement ?? "",
    idsPlus: hebergement.idsPlus ?? [],
  };
}

function payloadFromForm(form: HebergementFormState): SaveHebergementPayload {
  return {
    nom: form.nom.trim(),
    slug: form.slug.trim(),
    description: form.description.trim(),
    adresse: form.adresse.trim(),
    urlImagePrincipale: form.urlImagePrincipale.trim(),
    imageFile: form.imageFile,
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    nombreEtoiles: Number(form.nombreEtoiles),
    telephone: form.telephone.trim(),
    email: form.email.trim(),
    siteWeb: form.siteWeb.trim(),
    estActif: form.estActif,
    idTypeHebergement: form.idTypeHebergement,
    idsPlus: form.idsPlus,
  };
}

export function AdminHebergements({
  accessToken,
  initialView = "liste",
  onRequestCreate,
  onRequestEdit,
  editId = null,
}: AdminHebergementsProps) {
  const [hebergements, setHebergements] = useState<Hebergement[]>([]);
  const [types, setTypes] = useState<TypeHebergement[]>([]);
  const [equipements, setEquipements] = useState<EquipementHebergement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [mode, setMode] = useState<
    "liste" | "creation" | "modif" | "types" | "equipements"
  >(initialView);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HebergementFormState>(initialFormState);
  const [newTypeName, setNewTypeName] = useState("");
  const [newEquipementName, setNewEquipementName] = useState("");
  const [taxonomyMessage, setTaxonomyMessage] = useState("");

  const sortedHebergements = useMemo(
    () =>
      [...hebergements].sort((a, b) =>
        a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
      ),
    [hebergements]
  );

  const loadHebergements = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const hebergementsResponse = await listHebergements(accessToken);
      setHebergements(hebergementsResponse.data ?? []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Impossible de charger les hebergements"));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const loadTaxonomies = useCallback(async () => {
    try {
      const [typesResponse, equipementsResponse] = await Promise.all([
        listHebergementTypes(accessToken),
        listHebergementEquipements(accessToken),
      ]);

      setTypes(typesResponse.data ?? []);
      setEquipements(equipementsResponse.data ?? []);
    } catch (loadError) {
      setTaxonomyMessage(
        getErrorMessage(loadError, "Impossible de charger types et equipements")
      );
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    loadHebergements();
  }, [accessToken, loadHebergements]);

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

    if (initialView === "types" || initialView === "equipements") {
      setMode(initialView);
      return;
    }

    setMode("liste");
  }, [initialView]);

  useEffect(() => {
    if (!accessToken) return;
    if (
      mode === "creation" ||
      mode === "modif" ||
      mode === "types" ||
      mode === "equipements"
    ) {
      loadTaxonomies();
    }
  }, [accessToken, mode, loadTaxonomies]);

  function updateForm<K extends keyof HebergementFormState>(
    key: K,
    value: HebergementFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetFormState() {
    setForm(initialFormState);
    setNewTypeName("");
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

  const openEdit = useCallback(async (id: string) => {
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
      const response = await getHebergement(id, accessToken);
      await loadTaxonomies();
      if (response.data) {
        setForm(formFromHebergement(response.data));
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Impossible de charger cet hebergement"));
      setMode("liste");
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, loadTaxonomies, onRequestEdit]);

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
          ? await updateHebergement(editingId, payload, accessToken)
          : await createHebergement(payload, accessToken);

      const saved = response.data;
      if (saved) {
        setHebergements((current) => {
          if (mode === "modif" && editingId) {
            return current.map((item) => (item.id === editingId ? saved : item));
          }
          return [saved, ...current];
        });
      }

      setSuccessMessage(
        mode === "modif"
          ? "Hebergement modifie avec succes."
          : "Hebergement cree avec succes."
      );

      if (initialView === "creation" && mode === "creation") {
        resetFormState();
      } else {
        closeDialog();
      }
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'enregistrer l'hebergement"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Supprimer cet hebergement ?");
    if (!confirmed) return;

    setIsDeletingId(id);
    setError("");
    setSuccessMessage("");

    try {
      await deleteHebergement(id, accessToken);
      setHebergements((current) => current.filter((item) => item.id !== id));
      setSuccessMessage("Hebergement supprime avec succes.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer l'hebergement"));
    } finally {
      setIsDeletingId(null);
    }
  }

  async function handleCreateType() {
    if (!newTypeName.trim()) return;
    setTaxonomyMessage("");

    try {
      const response = await createHebergementType(newTypeName.trim(), accessToken);
      if (response.data) {
        setTypes((current) => [...current, response.data!]);
        setForm((current) => ({
          ...current,
          idTypeHebergement: response.data?.id ?? current.idTypeHebergement,
        }));
      }
      setNewTypeName("");
      setTaxonomyMessage("Type ajoute avec succes.");
    } catch (createError) {
      setTaxonomyMessage(
        getErrorMessage(createError, "Impossible d'ajouter le type")
      );
    }
  }

  async function handleCreateEquipement() {
    if (!newEquipementName.trim()) return;
    setTaxonomyMessage("");

    try {
      const response = await createHebergementEquipement(
        newEquipementName.trim(),
        accessToken
      );
      if (response.data) {
        setEquipements((current) => [...current, response.data!]);
        setForm((current) => ({
          ...current,
          idsPlus: response.data?.id
            ? [...new Set([...current.idsPlus, response.data.id])]
            : current.idsPlus,
        }));
      }
      setNewEquipementName("");
      setTaxonomyMessage("Equipement ajoute avec succes.");
    } catch (createError) {
      setTaxonomyMessage(
        getErrorMessage(createError, "Impossible d'ajouter l'equipement")
      );
    }
  }

  return (
    <>
      {mode === "liste" ? (
        <AdminHebergementsListe
          hebergements={sortedHebergements}
          isLoading={isLoading}
          isDeletingId={isDeletingId}
          error={error}
          successMessage={successMessage}
          onRefresh={loadHebergements}
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ) : null}

      {mode === "types" ? (
        <AdminHebergementsTaxonomies
          section="types"
          types={types}
          equipements={equipements}
          newTypeName={newTypeName}
          newEquipementName={newEquipementName}
          taxonomyMessage={taxonomyMessage}
          onTypeNameChange={setNewTypeName}
          onEquipementNameChange={setNewEquipementName}
          onCreateType={handleCreateType}
          onCreateEquipement={handleCreateEquipement}
        />
      ) : null}

      {mode === "equipements" ? (
        <AdminHebergementsTaxonomies
          section="equipements"
          types={types}
          equipements={equipements}
          newTypeName={newTypeName}
          newEquipementName={newEquipementName}
          taxonomyMessage={taxonomyMessage}
          onTypeNameChange={setNewTypeName}
          onEquipementNameChange={setNewEquipementName}
          onCreateType={handleCreateType}
          onCreateEquipement={handleCreateEquipement}
        />
      ) : null}

      <AdminHebergementsCreation
        open={mode === "creation" && initialView !== "creation"}
        embedded={mode === "creation" && initialView === "creation"}
        form={form}
        types={types}
        equipements={equipements}
        error={error}
        successMessage={successMessage}
        isSaving={isSaving}
        newTypeName={newTypeName}
        newEquipementName={newEquipementName}
        taxonomyMessage={taxonomyMessage}
        onOpenChange={(value) => {
          if (!value) closeDialog();
        }}
        onSubmit={handleSubmit}
        onCreateType={handleCreateType}
        onCreateEquipement={handleCreateEquipement}
        onTypeNameChange={setNewTypeName}
        onEquipementNameChange={setNewEquipementName}
        onUpdate={updateForm}
        makeSlug={makeSlug}
      />

      <AdminHebergementsModif
        open={mode === "modif" && initialView !== "modif"}
        embedded={mode === "modif" && initialView === "modif"}
        form={form}
        types={types}
        equipements={equipements}
        error={error}
        successMessage={successMessage}
        isSaving={isSaving}
        newTypeName={newTypeName}
        newEquipementName={newEquipementName}
        taxonomyMessage={taxonomyMessage}
        onOpenChange={(value) => {
          if (!value) closeDialog();
        }}
        onSubmit={handleSubmit}
        onCreateType={handleCreateType}
        onCreateEquipement={handleCreateEquipement}
        onTypeNameChange={setNewTypeName}
        onEquipementNameChange={setNewEquipementName}
        onUpdate={updateForm}
        makeSlug={makeSlug}
      />
    </>
  );
}
