"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SessionGuard } from "@/components/session-guard";
import { loadAuth, saveAuth, AuthSession } from "@/lib/auth";
import { getProfile, updateProfile } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit2, Save, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [auth, setAuth] = useState<AuthSession | null>(null);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    dateNaissance: "",
    adress: "",
    nationalite: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const authData = loadAuth();
      if (!authData?.accessToken) {
        router.push("/login");
        return;
      }

      setAuth(authData);

      try {
        const result = await getProfile(authData.accessToken);
        if (result?.data) {
          const userProfile = result.data as UserProfile;
          setProfile(userProfile);
          setFormData({
            nom: userProfile.nom,
            prenom: userProfile.prenom,
            email: userProfile.email,
            telephone: userProfile.telephone,
            dateNaissance: userProfile.dateNaissance,
            adress: userProfile.adress,
            nationalite: userProfile.nationalite,
          });
        }
      } catch (error) {
        const message = getErrorMessage(error, "Erreur lors du chargement du profil");
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSave = async () => {
    if (!auth?.accessToken) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await updateProfile(auth.accessToken, {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        dateNaissance: formData.dateNaissance,
        adress: formData.adress,
        nationalite: formData.nationalite,
      });

      if (result?.data) {
        const updatedProfile = result.data as UserProfile;
        setProfile(updatedProfile);
        setSuccess("Profil mis à jour avec succès");
        setIsEditing(false);
      }
    } catch (error) {
      const message = getErrorMessage(error, "Erreur lors de la mise à jour du profil");
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        nom: profile.nom,
        prenom: profile.prenom,
        email: profile.email,
        telephone: profile.telephone,
        dateNaissance: profile.dateNaissance,
        adress: profile.adress,
        nationalite: profile.nationalite,
      });
    }
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrateur";
      case "USER":
        return "Utilisateur";
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <SessionGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </SessionGuard>
    );
  }

  if (!profile) {
    return (
      <SessionGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Profil non trouvé</p>
            <Button onClick={() => router.push("/dashboard")} className="mt-4">
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </SessionGuard>
    );
  }

  return (
    <SessionGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Mon Profil
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gérez vos informations personnelles
                </p>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Modifier
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alertes */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-6 border-emerald-500/50 text-emerald-700 dark:text-emerald-400">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Cartes d'information */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informations personnelles */}
            <Card className="shadow-lg border-emerald-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Vos informations de base
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom">Nom</Label>
                    {isEditing ? (
                      <Input
                        id="nom"
                        value={formData.nom}
                        onChange={handleInputChange("nom")}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 font-medium">{profile.nom}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="prenom">Prénom</Label>
                    {isEditing ? (
                      <Input
                        id="prenom"
                        value={formData.prenom}
                        onChange={handleInputChange("prenom")}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 font-medium">{profile.prenom}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="dateNaissance">Date de naissance</Label>
                  {isEditing ? (
                    <Input
                      id="dateNaissance"
                      type="date"
                      value={formData.dateNaissance}
                      onChange={handleInputChange("dateNaissance")}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 font-medium">{profile.dateNaissance}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="nationalite">Nationalité</Label>
                  {isEditing ? (
                    <Input
                      id="nationalite"
                      value={formData.nationalite}
                      onChange={handleInputChange("nationalite")}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 font-medium">{profile.nationalite}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="shadow-lg border-emerald-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-emerald-600" />
                  Coordonnées
                </CardTitle>
                <CardDescription>
                  Vos informations de contact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange("email")}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 font-medium">{profile.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="telephone">Téléphone</Label>
                  {isEditing ? (
                    <Input
                      id="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange("telephone")}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 font-medium">{profile.telephone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="adress">Adresse</Label>
                  {isEditing ? (
                    <Textarea
                      id="adress"
                      value={formData.adress}
                      onChange={handleInputChange("adress")}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="mt-1 font-medium">{profile.adress}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informations système */}
            <Card className="shadow-lg border-emerald-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  Informations système
                </CardTitle>
                <CardDescription>
                  Détails de votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Login</span>
                  <span className="font-medium">{profile.login}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rôle</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {getRoleLabel(profile.role)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Statut</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    profile.estActif 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {profile.estActif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date de création</span>
                  <span className="font-medium">{formatDate(profile.dateCreation)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dernière connexion</span>
                  <span className="font-medium">{formatDate(profile.derniereConnexion)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card className="shadow-lg border-emerald-500/20">
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
                <CardDescription>
                  Raccourcis vers vos fonctionnalités
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  Tableau de bord
                </Button>
                {profile.role === "ADMIN" && (
                  <Button
                    onClick={() => router.push("/admin/users")}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    Gestion des utilisateurs
                  </Button>
                )}
                <Button
                  onClick={() => {
                    const authData = loadAuth();
                    if (authData) {
                      // TODO: Implémenter la déconnexion
                      router.push("/login");
                    }
                  }}
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Se déconnecter
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SessionGuard>
  );
}
