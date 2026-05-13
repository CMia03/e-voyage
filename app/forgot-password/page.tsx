"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { forgotPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/animated-background";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [emailValue, setEmailValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await forgotPassword(emailValue);
      
      setSuccessMessage("Un email de réinitialisation a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception.");
      setEmailValue("");
      // api de réinitialisation de mot de passe réussie, afficher un message de succès et rediriger vers la page de connexion après 3 secondes
      // Redirection vers login après 3 secondes
      setTimeout(() => {
        router.push("/login?message=Veuillez vérifier votre email pour réinitialiser votre mot de passe");
      }, 3000);
      
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Une erreur est survenue. Veuillez réessayer plus tard."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Utilisation du composant AnimatedBackground */}
      <AnimatedBackground />

      {/* Contenu centré */}
      <div className="relative z-50 w-full max-w-md px-4 py-8">
        {/* En-tête avec logo ou texte */}
        <div className="text-center mb-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent sm:text-2xl">🌴 Cool Voyage</h1>
          <p className="text-lg text-white/90 drop-shadow-md">
            Découvrez Madagascar avec Cool Voyage.
          </p>
        </div>

        {/* Formulaire de mot de passe oublié */}
        <Card className="border-none bg-white/10 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold text-white drop-shadow-md">
              Mot de passe oublié
            </CardTitle>
            <CardDescription className="text-base text-white/80 drop-shadow-md">
              Entrez votre email pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium block text-white/90 drop-shadow-md">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={emailValue}
                    onChange={(event) => setEmailValue(event.target.value)}
                    className="w-full h-12 rounded-md bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

              {successMessage ? (
                <div className="p-3 rounded-md bg-green-500/20 border border-green-500/50 backdrop-blur-sm">
                  <p className="text-sm text-green-200 text-center">
                    {successMessage}
                  </p>
                </div>
              ) : null}

              {errorMessage ? (
                <div className="p-3 rounded-md bg-red-500/20 border border-red-500/50 backdrop-blur-sm">
                  <p className="text-sm text-red-200 text-center">
                    {errorMessage}
                  </p>
                </div>
              ) : null}

              <Button 
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40 border-0"
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Envoi en cours...</span>
                  </div>
                ) : "Envoyer le lien de réinitialisation"}
              </Button>

              <div className="text-center text-sm text-white/80 drop-shadow-md">
                <span>Vous vous souvenez de votre mot de passe ? </span>
                <Link href="/login" className="text-emerald-300 hover:text-emerald-200 font-semibold hover:underline transition-colors">
                  Retour à la connexion
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Mention légale */}
        <p className="text-center mt-6 text-xs text-white/60 drop-shadow-md">
          © 2026 Cool Voyage. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
