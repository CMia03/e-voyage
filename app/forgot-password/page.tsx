"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";

import { forgotPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/animated-background";

export default function ForgotPasswordPage() {
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
      setSuccessMessage(
        response.message || "Si cet email existe, un lien de reinitialisation a ete envoye."
      );
      setEmailValue("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Impossible d'envoyer la demande pour le moment."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <AnimatedBackground />

      {successMessage ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <ShieldCheck className="size-4" />
          <AlertTitle>Demande envoyee</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="relative z-50 w-full max-w-md px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
            Cool Voyage
          </h1>
          <p className="text-lg text-white/90 drop-shadow-md">Retrouvez l&apos;acces a votre compte.</p>
        </div>

        <Card className="border-none bg-white/10 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold text-white drop-shadow-md">
              Mot de passe oublie
            </CardTitle>
            <CardDescription className="text-base text-white/80 drop-shadow-md">
              Entrez l&apos;email de votre compte Cool Voyage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>


              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-white/90 drop-shadow-md">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/60" />
                  <input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={emailValue}
                    onChange={(event) => setEmailValue(event.target.value)}
                    className="h-12 w-full rounded-md border border-white/30 bg-white/20 px-3 py-2 pl-10 text-sm text-white backdrop-blur-sm transition-all duration-200 placeholder:text-white/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    required
                  />
                </div>
              </div>

              <Button
                className="h-12 w-full border-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl hover:shadow-emerald-500/40"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Envoi en cours..." : "Envoyer le lien de reinitialisation"}
              </Button>

              <div className="text-center text-sm text-white/80 drop-shadow-md">
                <span>Vous vous souvenez de votre mot de passe ? </span>
                <Link
                  href="/login"
                  className="font-semibold text-emerald-300 transition-colors hover:text-emerald-200 hover:underline"
                >
                  Retour a la connexion
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-white/60 drop-shadow-md">
          2026 Cool Voyage. Tous droits reserves.
        </p>
      </div>
    </div>
  );
}
