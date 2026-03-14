"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { completeRegistration, initiateRegistration } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { saveAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/animated-background";

type RegisterForm = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  adress: string;
  login: string;
  motDePasse: string;
  nationalite: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    dateNaissance: "",
    adress: "",
    login: "",
    motDePasse: "",
    nationalite: "Malgache",
  });
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [confirmStep, setConfirmStep] = useState(false);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    setRegisterLoading(true);
    try {
      await initiateRegistration(registerForm);
      setConfirmStep(true);
      setRegisterSuccess("Code de confirmation envoy?? ?? votre email.");
    } catch (error) {
      setRegisterError(
        getErrorMessage(error, "Erreur r??seau. Veuillez r??essayer.")
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    setRegisterError("");
    setRegisterLoading(true);
    try {
      const response = await completeRegistration({
        email: registerForm.email,
        code: confirmCode,
      });
      const payload =
        response && typeof response === "object" && "data" in response
          ? (response as { data?: any }).data ?? {}
          : response ?? {};
      saveAuth({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        role: payload.role,
        userId: payload.userId,
        login: payload.login,
        nom: payload.nom,
        prenom: payload.prenom,
      });
      router.push("/admin");
    } catch (error) {
      setRegisterError(
        getErrorMessage(error, "Erreur r??seau. Veuillez r??essayer.")
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Arrière-plan animé */}
      <AnimatedBackground />

      {/* Contenu centré */}
      <div className="relative z-50 w-full max-w-3xl px-4 py-8">
        {/* En-tête */}
        <div className="text-center mb-8">
          
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent sm:text-2xl">🌴 Cool Voyage</h1>

          <p className="text-lg text-white/90 drop-shadow-md">
            Rejoignez l'aventure malgache
          </p>
        </div>

        <Card className="border-none bg-white/10 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold text-white drop-shadow-md">
              {!confirmStep ? "Créer un compte" : "Confirmation"}
            </CardTitle>
            <CardDescription className="text-base text-white/80 drop-shadow-md">
              {!confirmStep 
                ? "Remplissez le formulaire pour vous inscrire" 
                : "Entrez le code de confirmation reçu par email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!confirmStep ? (
              <form className="space-y-4" onSubmit={handleRegister}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium block text-white/90 drop-shadow-md">
                      Nom
                    </label>
                    <input
                      className="w-full h-11 rounded-md bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      value={registerForm.nom}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          nom: event.target.value,
                        }))
                      }
                      placeholder="Votre nom"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium block text-white/90 drop-shadow-md">
                      Prénom
                    </label>
                    <input
                      className="w-full h-11 rounded-md bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      value={registerForm.prenom}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          prenom: event.target.value,
                        }))
                      }
                      placeholder="Votre prénom"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium block text-white/90 drop-shadow-md">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full h-11 rounded-md bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      value={registerForm.email}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium block text-white/90 drop-shadow-md">
                      Téléphone
                    </label>
                    <input
                      className="w-full h-11 rounded-md bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      value={registerForm.telephone}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          telephone: event.target.value,
                        }))
                      }
                      placeholder="+261 34 00 000 00"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium block text-white/90 drop-shadow-md">
                      Date de naissance
                    </label>
                    <input
                      type="date"
                      className="w-full h-11 rounded-md bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm [color-scheme:dark]"
                      value={registerForm.dateNaissance}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          dateNaissance: event.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium block text-white/90 drop-shadow-md">
                      Nationalité
                    </label>
                    <input
                      className="w-full h-11 rounded-md bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      value={registerForm.nationalite}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          nationalite: event.target.value,
                        }))
                      }
                      placeholder="Malgache"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium block text-white/90 drop-shadow-md">
                    Adresse
                  </label>
                  <input
                    className="w-full h-11 rounded-md bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    value={registerForm.adress}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        adress: event.target.value,
                      }))
                    }
                    placeholder="Votre adresse complète"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium block text-white/90 drop-shadow-md">
                      Login
                    </label>
                    <input
                      className="w-full h-11 rounded-md bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      value={registerForm.login}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          login: event.target.value,
                        }))
                      }
                      placeholder="Choisissez un login"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium block text-white/90 drop-shadow-md">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      className="w-full h-11 rounded-md bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      value={registerForm.motDePasse}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          motDePasse: event.target.value,
                        }))
                      }
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {registerError && (
                  <div className="p-3 rounded-md bg-red-500/20 border border-red-500/50 backdrop-blur-sm">
                    <p className="text-sm text-red-200 text-center">
                      {registerError}
                    </p>
                  </div>
                )}
                
                {registerSuccess && (
                  <div className="p-3 rounded-md bg-emerald-500/20 border border-emerald-500/50 backdrop-blur-sm">
                    <p className="text-sm text-emerald-200 text-center">
                      {registerSuccess}
                    </p>
                  </div>
                )}

                <Button 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40 border-0"
                  type="submit" 
                  disabled={registerLoading}
                >
                  {registerLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Inscription en cours...</span>
                    </div>
                  ) : "Créer un compte"}
                </Button>

                <div className="text-center text-sm text-white/80 drop-shadow-md">
                  <span>Déjà un compte ? </span>
                  <Link href="/login" className="text-emerald-300 hover:text-emerald-200 font-semibold hover:underline transition-colors">
                    Se connecter
                  </Link>
                </div>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleConfirm}>
                <div className="space-y-2">
                  <label className="text-sm font-medium block text-white/90 drop-shadow-md">
                    Code de confirmation
                  </label>
                  <input
                    className="w-full h-12 rounded-md bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-center text-lg tracking-widest"
                    value={confirmCode}
                    onChange={(event) => setConfirmCode(event.target.value)}
                    placeholder="••••••"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-white/60 mt-1 text-center">
                    Un code à 6 chiffres a été envoyé à votre Email
                     {/* {registerForm.email} */}
                     
                  </p>
                </div>

                {registerError && (
                  <div className="p-3 rounded-md bg-red-500/20 border border-red-500/50 backdrop-blur-sm">
                    <p className="text-sm text-red-200 text-center">
                      {registerError}
                    </p>
                  </div>
                )}
                
                {registerSuccess && (
                  <div className="p-3 rounded-md bg-emerald-500/20 border border-emerald-500/50 backdrop-blur-sm">
                    <p className="text-sm text-emerald-200 text-center">
                      {registerSuccess}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmStep(false)}
                    className="flex-1 h-12 bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/40 transition-all duration-300 backdrop-blur-sm"
                  >
                    Retour
                  </Button>
                  <Button 
                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40 border-0"
                    type="submit" 
                    disabled={registerLoading}
                  >
                    {registerLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Validation...</span>
                      </div>
                    ) : "Valider"}
                  </Button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleRegister}
                    className="text-sm text-emerald-300 hover:text-emerald-200 transition-colors drop-shadow-md"
                  >
                    Renvoyer le code
                  </button>
                </div>

                <div className="text-center text-sm text-white/80 drop-shadow-md">
                  <span>Déjà un compte ? </span>
                  <Link href="/login" className="text-emerald-300 hover:text-emerald-200 font-semibold hover:underline transition-colors">
                    Se connecter
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Mention légale */}
        <p className="text-center mt-6 text-xs text-white/60 drop-shadow-md">
          © 2024 Cool Voyage. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
