"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { resetPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/animated-background";
import { BrandLogo } from "@/components/brand-logo";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const canSubmit = useMemo(
    () => token.length > 0 && password.length >= 8 && password === confirmation,
    [confirmation, password, token]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!token) {
      setErrorMessage("Lien de reinitialisation invalide.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }

    if (password !== confirmation) {
      setErrorMessage("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPassword({
        token,
        nouveauMotDePasse: password,
        confirmationMotDePasse: confirmation,
      });

      setSuccessMessage(response.message || "Mot de passe modifie avec succes.");
      setPassword("");
      setConfirmation("");

      setTimeout(() => {
        router.push("/login?message=Mot de passe modifie avec succes");
      }, 3000);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Impossible de modifier le mot de passe."));
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
          <AlertTitle>Mot de passe modifie</AlertTitle>
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
          <h1 className="inline-flex items-center justify-center">
            <BrandLogo className="h-32 w-32 rounded-full bg-white/90 p-3 shadow-2xl ring-1 ring-white/70" priority />
          </h1>
          <p className="text-lg text-white/90 drop-shadow-md">Choisissez un nouveau mot de passe.</p>
        </div>

        <Card className="border-none bg-white/10 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold text-white drop-shadow-md">
              Nouveau mot de passe
            </CardTitle>
            <CardDescription className="text-base text-white/80 drop-shadow-md">
              Le lien est valable pendant une duree limitee.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {!token ? (
                <div className="rounded-2xl border border-red-300/50 bg-red-500/15 p-4 text-sm text-red-100">
                  Le lien de reinitialisation est absent ou invalide.
                </div>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-white/90 drop-shadow-md">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/60" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 w-full rounded-md border border-white/30 bg-white/20 px-3 py-2 pl-10 text-sm text-white backdrop-blur-sm transition-all duration-200 placeholder:text-white/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="Minimum 8 caracteres"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmation" className="block text-sm font-medium text-white/90 drop-shadow-md">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/60" />
                  <input
                    id="confirmation"
                    type="password"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    className="h-12 w-full rounded-md border border-white/30 bg-white/20 px-3 py-2 pl-10 text-sm text-white backdrop-blur-sm transition-all duration-200 placeholder:text-white/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="Repetez le nouveau mot de passe"
                    required
                  />
                </div>
              </div>

              <Button
                className="h-12 w-full border-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl hover:shadow-emerald-500/40"
                type="submit"
                disabled={isLoading || !canSubmit}
              >
                {isLoading ? "Modification..." : "Modifier mon mot de passe"}
              </Button>

              <div className="text-center text-sm text-white/80 drop-shadow-md">
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
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
