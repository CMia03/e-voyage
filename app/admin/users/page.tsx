"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SessionGuard } from "@/components/session-guard";
import { loadAuth, AuthSession } from "@/lib/auth";
import { getUsers, getUserById, updateUser } from "@/lib/api/users";
import { getErrorMessage } from "@/lib/api/client";
import { 
  Users, 
  Search, 
  User, 
  Edit, 
  Save, 
  X, 
  UserPlus
} from "lucide-react";
import { UserProfile } from "@/lib/type/data";
import { Label } from "@/components/ui/label";
import { useBreadcrumbs } from "../contexts/breadcrumbs-context";

export function AdminUsers() {
  const router = useRouter();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [auth, setAuth] = useState<AuthSession | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Utilisateurs", isActive: true }
    ]);
  }, [setBreadcrumbs]);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    dateNaissance: "",
    adress: "",
    nationalite: "",
    role: "USER",
    estActif: true,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const authData = loadAuth();
      if (!authData?.accessToken) {
        router.push("/login");
        return;
      }

      setAuth(authData);

      try {
        const result = await getUsers(authData.accessToken);
        if (result?.data) {
          setUsers(result.data as UserProfile[]);
        }
      } catch (error) {
        const message = getErrorMessage(error, "Erreur lors du chargement des utilisateurs");
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const handleUserSelect = async (userId: string) => {
    if (!auth?.accessToken) return;

    try {
      const result = await getUserById(auth.accessToken, userId);
      if (result?.data) {
        const userProfile = result.data as UserProfile;
        setSelectedUser(userProfile);
        setFormData({
          nom: userProfile.nom,
          prenom: userProfile.prenom,
          email: userProfile.email,
          telephone: userProfile.telephone,
          dateNaissance: userProfile.dateNaissance,
          adress: userProfile.adress,
          nationalite: userProfile.nationalite,
          role: userProfile.role,
          estActif: userProfile.estActif,
        });
        setIsEditing(false);
        setError("");
        setSuccess("");
      }
    } catch (error) {
      const message = getErrorMessage(error, "Erreur lors du chargement de l'utilisateur");
      setError(message);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = field === "estActif" ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!auth?.accessToken || !selectedUser) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await updateUser(auth.accessToken, selectedUser.id, {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        dateNaissance: formData.dateNaissance,
        adress: formData.adress,
        nationalite: formData.nationalite,
        role: formData.role,
        estActif: formData.estActif,
      });

      if (result?.data) {
        const updatedUser = result.data as UserProfile;
        setSelectedUser(updatedUser);
        
        // Mettre à jour la liste des utilisateurs
        setUsers(prev => prev.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        ));
        
        setSuccess("Utilisateur mis à jour avec succès");
        setIsEditing(false);
      }
    } catch (error) {
      const message = getErrorMessage(error, "Erreur lors de la mise à jour de l'utilisateur");
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (selectedUser) {
      setFormData({
        nom: selectedUser.nom,
        prenom: selectedUser.prenom,
        email: selectedUser.email,
        telephone: selectedUser.telephone,
        dateNaissance: selectedUser.dateNaissance,
        adress: selectedUser.adress,
        nationalite: selectedUser.nationalite,
        role: selectedUser.role,
        estActif: selectedUser.estActif,
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

  const filteredUsers = users.filter(user =>
    user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.login.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <SessionGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </SessionGuard>
    );
  }

  return (
    <SessionGuard>
      <div className="space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Gestion des utilisateurs
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gérez les comptes utilisateurs du système
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push("/admin")}
                  variant="outline"
                >
                  Retour
                </Button>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Nouvel utilisateur
                </Button>
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

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Liste des utilisateurs */}
            <Card className="lg:col-span-1 shadow-lg border-emerald-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  Utilisateurs ({users.length})
                </CardTitle>
                <CardDescription>
                  Liste de tous les utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Barre de recherche */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Liste */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserSelect(user.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedUser?.id === user.id
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                          : "border-border hover:border-emerald-500/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                            {user.prenom[0]}{user.nom[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {user.prenom} {user.nom}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "ADMIN"
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {getRoleLabel(user.role)}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${
                            user.estActif ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Détails de l'utilisateur */}
            <Card className="lg:col-span-2 shadow-lg border-emerald-500/20">
              {selectedUser ? (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-emerald-600" />
                        Détails de l utilisateur
                      </CardTitle>
                      {!isEditing ? (
                        <Button
                          onClick={() => setIsEditing(true)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Modifier
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            size="sm"
                            className="gap-2"
                          >
                            <Save className="h-4 w-4" />
                            {isSaving ? "Enregistrement..." : "Enregistrer"}
                          </Button>
                          <Button
                            onClick={handleCancel}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Annuler
                          </Button>
                        </div>
                      )}
                    </div>
                    <CardDescription>
                      {selectedUser.prenom} {selectedUser.nom} - {selectedUser.email}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Informations personnelles */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Informations personnelles</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="nom" className="font-normal">Nom</Label>
                            {isEditing ? (
                              <Input
                                id="nom"
                                value={formData.nom}
                                onChange={handleInputChange("nom")}
                                className="mt-1 font-semibold"
                              />
                            ) : (
                              <p className="mt-1 font-semibold">{selectedUser.nom}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="prenom" className="font-normal">Prénom</Label>
                            {isEditing ? (
                              <Input
                                id="prenom"
                                value={formData.prenom}
                                onChange={handleInputChange("prenom")}
                                className="mt-1 font-semibold"
                              />
                            ) : (
                              <p className="mt-1 font-semibold">{selectedUser.prenom}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="dateNaissance" className="font-normal">Date de naissance</Label>
                          {isEditing ? (
                            <Input
                              id="dateNaissance"
                              type="date"
                              value={formData.dateNaissance}
                              onChange={handleInputChange("dateNaissance")}
                              className="mt-1 font-semibold"
                            />
                          ) : (
                            <p className="mt-1 font-semibold">{selectedUser.dateNaissance}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="nationalite" className="font-normal">Nationalité</Label>
                          {isEditing ? (
                            <Input
                              id="nationalite"
                              value={formData.nationalite}
                              onChange={handleInputChange("nationalite")}
                              className="mt-1 font-semibold"
                            />
                          ) : (
                            <p className="mt-1 font-semibold">{selectedUser.nationalite}</p>
                          )}
                        </div>
                      </div>

                      {/* Contact et système */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Contact et système</h3>
                        <div>
                          <Label htmlFor="email" className="font-normal">Email</Label>
                          {isEditing ? (
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange("email")}
                              className="mt-1 font-semibold"
                            />
                          ) : (
                            <p className="mt-1 font-semibold">{selectedUser.email}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="telephone" className="font-normal">Téléphone</Label>
                          {isEditing ? (
                            <Input
                              id="telephone"
                              value={formData.telephone}
                              onChange={handleInputChange("telephone")}
                              className="mt-1 font-semibold"
                            />
                          ) : (
                            <p className="mt-1 font-semibold">{selectedUser.telephone}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="adress" className="font-normal">Adresse</Label>
                          {isEditing ? (
                            <Input
                              id="adress"
                              value={formData.adress}
                              onChange={handleInputChange("adress")}
                              className="mt-1 font-semibold"
                            />
                          ) : (
                            <p className="mt-1 font-semibold">{selectedUser.adress}</p>
                          )}
                        </div>

                        {isEditing && (
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="role" className="font-normal">Rôle</Label>
                              <select
                                id="role"
                                value={formData.role}
                                onChange={handleInputChange("role")}
                                className="w-full mt-1 px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md font-semibold"
                              >
                                <option value="USER">Utilisateur</option>
                                <option value="ADMIN">Administrateur</option>
                              </select>
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="estActif"
                                checked={formData.estActif}
                                onChange={handleInputChange("estActif")}
                                className="rounded"
                              />
                              <Label htmlFor="estActif" className="font-normal">Compte actif</Label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Informations système (lecture seule) */}
                    <div className="border-t pt-4">
                      <h3 className="font-semibold text-lg mb-4">Informations système</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Login</span>
                          <p className="font-medium">{selectedUser.login}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rôle actuel</span>
                          <p className="font-medium">{getRoleLabel(selectedUser.role)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Statut</span>
                          <p className="font-medium">
                            {selectedUser.estActif ? 'Actif' : 'Inactif'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Créé le</span>
                          <p className="font-medium">{formatDate(selectedUser.dateCreation)}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="text-muted-foreground text-sm">Dernière connexion</span>
                        <p className="font-medium">{formatDate(selectedUser.derniereConnexion)}</p>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Sélectionnez un utilisateur pour voir ses détails
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
      </div>
    </SessionGuard>
  );
}

export default AdminUsers;
