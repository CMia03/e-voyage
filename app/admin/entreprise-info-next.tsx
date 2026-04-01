"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { getEntrepriseInfoAdmin, getEntrepriseInfoPublic, updateEntrepriseInfo } from "@/lib/api/entreprise-info";
import { EntrepriseInfo } from "@/lib/type/entreprise-info";

type Props = {
  accessToken: string;
};

type FormState = {
  nomEntreprise: string;
  description: string;
  contactYas: string;
  contactOrange: string;
  contactAirtel: string;
  contactGmail: string;
  contactPlusInfos: string;
  adresse: string;
};

const initialForm: FormState = {
  nomEntreprise: "",
  description: "",
  contactYas: "",
  contactOrange: "",
  contactAirtel: "",
  contactGmail: "",
  contactPlusInfos: "",
  adresse: "",
};

function mapInfoToForm(info: EntrepriseInfo | null): FormState {
  if (!info) return initialForm;
  return {
    nomEntreprise: info.nomEntreprise ?? "",
    description: info.description ?? "",
    contactYas: info.contactYas ?? "",
    contactOrange: info.contactOrange ?? "",
    contactAirtel: info.contactAirtel ?? "",
    contactGmail: info.contactGmail ?? "",
    contactPlusInfos: info.contactPlusInfos ?? "",
    adresse: info.adresse ?? "",
  };
}

export function AdminEntrepriseInfo({ accessToken }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => setSuccess(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [success]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await getEntrepriseInfoAdmin(accessToken);
        if (!active) return;
        setForm(mapInfoToForm(response.data ?? null));
      } catch (loadError) {
        if (!active) return;
        if (loadError instanceof ApiError && loadError.status === 403) {
          try {
            const publicResponse = await getEntrepriseInfoPublic();
            if (!active) return;
            setForm(mapInfoToForm(publicResponse.data ?? null));
          } catch {
            // ignore fallback failure; we still show auth error below
          }
          setError("Acces refuse (403). Verifiez votre session admin puis reconnectez-vous.");
        } else {
          setError(getErrorMessage(loadError, "Impossible de charger les informations de l'entreprise."));
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [accessToken]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await updateEntrepriseInfo(
        {
          nomEntreprise: form.nomEntreprise.trim(),
          description: form.description.trim() || null,
          contactYas: form.contactYas.trim() || null,
          contactOrange: form.contactOrange.trim() || null,
          contactAirtel: form.contactAirtel.trim() || null,
          contactGmail: form.contactGmail.trim() || null,
          contactPlusInfos: form.contactPlusInfos.trim() || null,
          adresse: form.adresse.trim() || null,
        },
        accessToken
      );
      setForm(mapInfoToForm(response.data ?? null));
      setSuccess("Informations de l'entreprise mises a jour avec succes.");
    } catch (saveError) {
      if (saveError instanceof ApiError && saveError.status === 403) {
        setError("Acces refuse (403) pendant l'enregistrement. Reconnectez-vous avec un compte admin.");
      } else {
        setError(getErrorMessage(saveError, "Impossible de sauvegarder les informations de l'entreprise."));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {success ? (
        <div className="fixed right-6 top-20 z-50 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-lg">
          {success}
        </div>
      ) : null}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Info d'entreprise</h1>
        <p className="text-sm text-muted-foreground">
          Configurez la presentation et les contacts affiches sur votre plateforme.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Modifiez ici les informations officielles de Cool Voyage.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom de l'entreprise</label>
                  <Input value={form.nomEntreprise} onChange={(e) => updateField("nomEntreprise", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Yas</label>
                    <Input value={form.contactYas} onChange={(e) => updateField("contactYas", e.target.value)} placeholder="+261 34 ..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Orange</label>
                    <Input value={form.contactOrange} onChange={(e) => updateField("contactOrange", e.target.value)} placeholder="+261 32 ..." />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Airtel</label>
                    <Input value={form.contactAirtel} onChange={(e) => updateField("contactAirtel", e.target.value)} placeholder="+261 33 ..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Gmail</label>
                    <Input type="email" value={form.contactGmail} onChange={(e) => updateField("contactGmail", e.target.value)} placeholder="contact@..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Plus d'infos (telephone)</label>
                  <Input value={form.contactPlusInfos} onChange={(e) => updateField("contactPlusInfos", e.target.value)} placeholder="+261 34 ..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adresse</label>
                  <Input value={form.adresse} onChange={(e) => updateField("adresse", e.target.value)} placeholder="Antananarivo, Madagascar" />
                </div>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apercu</CardTitle>
            <CardDescription>Affichage recommande pour la section entreprise.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{form.nomEntreprise || "Cool Voyage"}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {form.description || "Votre agence de voyage de confiance pour decouvrir Madagascar."}
              </p>
            </div>
            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
              <p className="font-medium">Contact</p>
              <p>Yas : {form.contactYas || "-"}</p>
              <p>Orange : {form.contactOrange || "-"}</p>
              <p>Airtel : {form.contactAirtel || "-"}</p>
              <p>Gmail : {form.contactGmail || "-"}</p>
              <p>Plus d'infos : {form.contactPlusInfos || "-"}</p>
              <p>Adresse : {form.adresse || "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
