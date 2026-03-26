"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, loginWithGoogle } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { saveAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/animated-background";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginValue, setLoginValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Gérer le retour de Google OAuth
  useEffect(() => {
    const googleLogin = searchParams.get('google_login');
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const picture = searchParams.get('picture');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (googleLogin === 'true' && email && accessToken) {
      // Sauvegarder les informations de l'utilisateur
      const authPayload = {
        accessToken,
        refreshToken: refreshToken || undefined,
        role: 'USER', // ou déterminer le rôle depuis votre backend
        userId: email,
        login: email,
        nom: name?.split(' ')[1] || '',
        prenom: name?.split(' ')[0] || '',
      };

      saveAuth(authPayload);
      router.push('/admin');
    }

    // Gérer les erreurs OAuth
    const error = searchParams.get('error');
    if (error) {
      setLoginError('Erreur lors de la connexion avec Google');
    }
  }, [searchParams, router]);

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

      const payload = response && typeof response === "object" && "data" in response ? response.data ?? response : response;
      
      // Type assertion to ensure payload has required properties
      const authPayload = payload as {
        accessToken: string;
        refreshToken?: string;
        role: string;
        userId?: string;
        login?: string;
        nom?: string;
        prenom?: string;
      };

      saveAuth({
        accessToken: authPayload.accessToken,
        refreshToken: authPayload.refreshToken,
        role: authPayload.role,
        userId: authPayload.userId,
        login: authPayload.login,
        nom: authPayload.nom,
        prenom: authPayload.prenom,
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

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-white/60">Ou continuer avec</span>
                </div>
              </div>

              <Button 
                type="button"
                variant="outline"
                className="cursor-pointer w-full h-12 text-base font-semibold bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300"
                onClick={() => {
                  loginWithGoogle();
                }}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Se connecter avec Google
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
