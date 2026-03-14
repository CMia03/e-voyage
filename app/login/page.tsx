"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { saveAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/animated-background";

export default function LoginPage() {
  const router = useRouter();
  const [loginValue, setLoginValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const response = await login({
        login: loginValue,
        motDePasse: passwordValue,
      });

      console.log("Login response:", response);

      const payload =
        response && typeof response === "object" && "data" in response
          ? (response as { data?: typeof response }).data ?? response
          : response;

      saveAuth({
        accessToken: (payload as { accessToken: string })?.accessToken,
        refreshToken: (payload as { refreshToken: string })?.refreshToken,
        role: (payload as { role: string })?.role,
        userId: (payload as { userId: string })?.userId,
        login: (payload as { login?: string })?.login,
        nom: (payload as { nom?: string })?.nom,
        prenom: (payload as { prenom?: string })?.prenom,
      });

      router.push("/admin");

    } catch (error) {
      setLoginError(getErrorMessage(error, "Network error. Please try again."));
    } finally {
      setLoginLoading(false);
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

        {/* Formulaire de connexion */}
        <Card className="border-none bg-white/10 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold text-white drop-shadow-md">
              Connexion
            </CardTitle>
            <CardDescription className="text-base text-white/80 drop-shadow-md">
              Connectez-vous pour accéder à votre espace personnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="login" className="text-sm font-medium block text-white/90 drop-shadow-md">
                    Identifiant
                  </label>
                  <input
                    id="login"
                    type="text"
                    placeholder="Votre identifiant"
                    value={loginValue}
                    onChange={(event) => setLoginValue(event.target.value)}
                    className="w-full h-12 rounded-md bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-white/90 drop-shadow-md">
                      Mot de passe
                    </label>
                    {/* <Link 
                      href="/forgot-password" 
                      className="text-sm text-emerald-300 hover:text-emerald-200 transition-colors drop-shadow-md"
                    >
                      Mot de passe oublié ?
                    </Link> */}
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={passwordValue}
                    onChange={(event) => setPasswordValue(event.target.value)}
                    className="w-full h-12 rounded-md bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-white/20 border-white/30 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-0"
                  />
                  <label htmlFor="remember" className="text-sm text-white/80 drop-shadow-md">
                    Se souvenir de moi
                  </label>
                </div>
              </div>

              {loginError ? (
                <div className="p-3 rounded-md bg-red-500/20 border border-red-500/50 backdrop-blur-sm">
                  <p className="text-sm text-red-200 text-center">
                    {loginError}
                  </p>
                </div>
              ) : null}

              <Button 
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40 border-0"
                type="submit" 
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connexion...</span>
                  </div>
                ) : "Se connecter"}
              </Button>

              <div className="text-center text-sm text-white/80 drop-shadow-md">
                <span>Pas de compte ? </span>
                <Link href="/register" className="text-emerald-300 hover:text-emerald-200 font-semibold hover:underline transition-colors">
                  S inscrire
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
