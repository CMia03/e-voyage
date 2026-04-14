"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  createAdminDestination,
  deleteAdminDestination,
  getAdminDestination,
  listAdminDestinations,
  updateAdminDestination,
} from "@/lib/api/destinations";
import { getErrorMessage } from "@/lib/api/client";
import type { AdminDestination as AdminDestinationItem, SaveDestinationPayload } from "@/lib/type/destination";

import { AdminDestinationCreation } from "./creation";
import { DestinationFormState } from "./form";
import { AdminDestinationListe } from "./liste-view";
import { AdminDestinationModif } from "./modif";

type AdminDestinationProps = {
  accessToken: string;
  initialView?: "liste" | "creation" | "modif";
  onRequestCreate?: () => void;
  onRequestEdit?: (id: string) => void;
  editId?: string | null;
};

const initialFormState: DestinationFormState = {
  nom: "",
  slug: "",
  description: "",
  adresse: "",
  urlImagePrincipale: "",
  imageFile: null,
  latitude: "-18.8792",
  longitude: "47.5079",
  estActif: true,
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

function formFromDestination(destination: AdminDestinationItem): DestinationFormState {
  return {
    nom: destination.nom ?? "",
    slug: destination.slug ?? "",
    description: destination.description ?? "",
    adresse: destination.adresse ?? "",
    urlImagePrincipale: destination.urlImagePrincipale ?? "",
    imageFile: null,
    latitude: String(destination.latitude ?? 0),
    longitude: String(destination.longitude ?? 0),
    estActif: Boolean(destination.estActif),
  };
}

function payloadFromForm(form: DestinationFormState): SaveDestinationPayload {
  return {
    nom: form.nom.trim(),
    slug: form.slug.trim(),
    description: form.description.trim(),
    adresse: form.adresse.trim(),
    urlImagePrincipale: form.urlImagePrincipale.trim(),
    imageFile: form.imageFile,
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    estActif: form.estActif,
  };
}

export function AdminDestination({
  accessToken,
  initialView = "liste",
  onRequestCreate,
  onRequestEdit,
  editId = null,
}: AdminDestinationProps) {
  const [destinations, setDestinations] = useState<AdminDestinationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [mode, setMode] = useState<"liste" | "creation" | "modif">(initialView);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DestinationFormState>(initialFormState);

  const sortedDestinations = useMemo(
    () =>
      [...destinations].sort((a, b) =>
        a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
      ),
    [destinations]
  );

  const loadDestinations = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await listAdminDestinations(accessToken);
      setDestinations(response.data ?? []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Impossible de charger les destinations"));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    loadDestinations();
  }, [accessToken, loadDestinations]);

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

    setMode("liste");
  }, [initialView]);

  function updateForm<K extends keyof DestinationFormState>(
    key: K,
    value: DestinationFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetFormState() {
    setForm(initialFormState);
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
        const response = await getAdminDestination(id, accessToken);
        if (response.data) {
          setForm(formFromDestination(response.data));
        }
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Impossible de charger cette destination"));
        setMode("liste");
      } finally {
        setIsSaving(false);
      }
    },
    [accessToken, onRequestEdit]
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
          ? await updateAdminDestination(editingId, payload, accessToken)
          : await createAdminDestination(payload, accessToken);

      const saved = response.data;
      if (saved) {
        setDestinations((current) => {
          if (mode === "modif" && editingId) {
            return current.map((item) => (item.id === editingId ? saved : item));
          }
          return [saved, ...current];
        });
      }

      setSuccessMessage(
        mode === "modif"
          ? "Destination modifiee avec succes."
          : "Destination creee avec succes."
      );

      if (initialView === "creation" && mode === "creation") {
        resetFormState();
      } else {
        closeDialog();
      }
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'enregistrer la destination"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Supprimer cette destination ?");
    if (!confirmed) return;

    setIsDeletingId(id);
    setError("");
    setSuccessMessage("");

    try {
      await deleteAdminDestination(id, accessToken);
      setDestinations((current) => current.filter((item) => item.id !== id));
      setSuccessMessage("Destination supprimee avec succes.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer la destination"));
    } finally {
      setIsDeletingId(null);
    }
  }

  return (
    <>
      {mode === "liste" ? (
        <AdminDestinationListe
          destinations={sortedDestinations}
          isLoading={isLoading}
          isDeletingId={isDeletingId}
          error={error}
          successMessage={successMessage}
          onRefresh={loadDestinations}
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ) : null}

      <AdminDestinationCreation
        open={mode === "creation" && initialView !== "creation"}
        embedded={mode === "creation" && initialView === "creation"}
        form={form}
        error={error}
        successMessage={successMessage}
        isSaving={isSaving}
        onOpenChange={(value) => {
          if (!value) closeDialog();
        }}
        onSubmit={handleSubmit}
        onUpdate={updateForm}
        makeSlug={makeSlug}
      />

      <AdminDestinationModif
        open={mode === "modif" && initialView !== "modif"}
        embedded={mode === "modif" && initialView === "modif"}
        form={form}
        error={error}
        successMessage={successMessage}
        isSaving={isSaving}
        onOpenChange={(value) => {
          if (!value) closeDialog();
        }}
        onSubmit={handleSubmit}
        onUpdate={updateForm}
        makeSlug={makeSlug}
      />
    </>
  );
}
