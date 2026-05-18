"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit2, Save, User, X } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/client";
import { getProfile, updateProfile } from "@/lib/api/auth";
import { AuthSession, loadAuth, saveAuth } from "@/lib/auth";

type UserProfile = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  adress: string;
  login: string;
  role: string;
  nationalite: string;
  estActif: boolean;
  dateCreation: string;
  derniereConnexion: string;
  photoProfilUrl: string | null;
};

type ProfileForm = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  adress: string;
  nationalite: string;
};

const emptyForm: ProfileForm = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  dateNaissance: "",
  adress: "",
  nationalite: "",
};

function toForm(profile: UserProfile): ProfileForm {
  return {
    nom: profile.nom ?? "",
    prenom: profile.prenom ?? "",
    email: profile.email ?? "",
    telephone: profile.telephone ?? "",
    dateNaissance: profile.dateNaissance ?? "",
    adress: profile.adress ?? "",
    nationalite: profile.nationalite ?? "",
  };
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRole(role?: string | null) {
  if (role === "ADMIN") return "Administrateur";
  if (role === "USER") return "Utilisateur";
  return role || "-";
}

export default function ClientProfilePage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const auth = loadAuth();
      setSession(auth);

      if (!auth?.accessToken) {
        setError("Vous devez etre connecte pour consulter votre profil.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await getProfile(auth.accessToken);
        if (response.data) {
          const nextProfile = response.data as UserProfile;
          setProfile(nextProfile);
          setForm(toForm(nextProfile));
        }
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Impossible de charger votre profil."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfile();
  }, []);

  const fullName = useMemo(() => {
    if (!profile) return session?.login || "Utilisateur";
    return [profile.prenom, profile.nom].filter(Boolean).join(" ").trim() || profile.login || "Utilisateur";
  }, [profile, session?.login]);

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleCancel() {
    if (profile) {
      setForm(toForm(profile));
    }
    setError("");
    setSuccess("");
    setIsEditing(false);
  }

  async function handleSave() {
    if (!session?.accessToken) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await updateProfile(session.accessToken, form);
      if (response.data) {
        const nextProfile = response.data as UserProfile;
        setProfile(nextProfile);
        setForm(toForm(nextProfile));
        setIsEditing(false);
        setSuccess("Profil mis a jour avec succes.");

        saveAuth({
          ...session,
          nom: nextProfile.nom,
          prenom: nextProfile.prenom,
          login: nextProfile.login || nextProfile.email || session.login,
        });
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Impossible de mettre a jour votre profil."));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        {error || "Profil non trouve."}
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <User className="size-5 text-emerald-700" />
              <h1 className="text-xl font-semibold text-slate-950">Details de l utilisateur</h1>
            </div>
            <p className="mt-4 break-words text-sm text-slate-500">
              {fullName} - {profile.email || "-"}
            </p>
          </div>

          {!isEditing ? (
            <Button type="button" variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
              <Edit2 className="size-4" />
              Modifier
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleSave} disabled={isSaving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Save className="size-4" />
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} className="gap-2">
                <X className="size-4" />
                Annuler
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-10 py-7 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Informations personnelles</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <ProfileField label="Nom" value={profile.nom} editing={isEditing}>
                <Input value={form.nom} onChange={(event) => updateField("nom", event.target.value)} />
              </ProfileField>
              <ProfileField label="Prenom" value={profile.prenom} editing={isEditing}>
                <Input value={form.prenom} onChange={(event) => updateField("prenom", event.target.value)} />
              </ProfileField>
              <ProfileField label="Date de naissance" value={profile.dateNaissance} editing={isEditing}>
                <Input type="date" value={form.dateNaissance} onChange={(event) => updateField("dateNaissance", event.target.value)} />
              </ProfileField>
              <ProfileField label="Nationalite" value={profile.nationalite} editing={isEditing}>
                <Input value={form.nationalite} onChange={(event) => updateField("nationalite", event.target.value)} />
              </ProfileField>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">Contact et systeme</h2>
            <div className="mt-6 grid gap-6">
              <ProfileField label="Email" value={profile.email} editing={isEditing}>
                <Input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
              </ProfileField>
              <ProfileField label="Telephone" value={profile.telephone} editing={isEditing}>
                <Input value={form.telephone} onChange={(event) => updateField("telephone", event.target.value)} />
              </ProfileField>
              <ProfileField label="Adresse" value={profile.adress} editing={isEditing}>
                <Textarea value={form.adress} onChange={(event) => updateField("adress", event.target.value)} rows={3} />
              </ProfileField>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-7">
          <h2 className="text-lg font-semibold text-slate-950">Informations systeme</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ProfileValue label="Login" value={profile.login} />
            <ProfileValue label="Role actuel" value={formatRole(profile.role)} />
            <div>
              <p className="text-sm text-slate-500">Statut</p>
              <Badge className={profile.estActif ? "mt-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "mt-2 bg-rose-100 text-rose-800 hover:bg-rose-100"}>
                {profile.estActif ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <ProfileValue label="Cree le" value={formatDate(profile.dateCreation)} />
            <ProfileValue label="Derniere connexion" value={formatDate(profile.derniereConnexion)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileField({
  label,
  value,
  editing,
  children,
}: {
  label: string;
  value?: string | null;
  editing: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-normal text-slate-500">{label}</Label>
      {editing ? children : <p className="break-words text-base font-semibold text-slate-950">{value || "-"}</p>}
    </div>
  );
}

function ProfileValue({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 break-words text-base font-semibold text-slate-950">{value || "-"}</p>
    </div>
  );
}
