import { NextRequest, NextResponse } from "next/server";

type BackendGoogleAuthResponse = {
  accessToken: string;
  refreshToken?: string;
  role?: string;
  userId?: string;
  login?: string;
  nom?: string;
  prenom?: string;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    // Rediriger vers Google pour l'autorisation
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google`;
    const scope = 'openid email profile';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`;

    return NextResponse.redirect(authUrl);
  }

  try {
    // Échanger le code contre des tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error('Token exchange failed');
    }

    // Obtenir les informations de l'utilisateur
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    // Créer ou mettre à jour l'utilisateur dans votre base de données
    // Ici vous devriez appeler votre service utilisateur
    
    // Rediriger vers le frontend avec les informations de l'utilisateur
    const splitName = String(userData.name || "").trim().split(/\s+/).filter(Boolean);
    const prenom = splitName.length > 0 ? splitName[0] : "";
    const nom = splitName.length > 1 ? splitName.slice(1).join(" ") : splitName[0] || "Utilisateur";

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    const backendResponse = await fetch(`${apiBaseUrl}/api/auth/google-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userData.email,
        nom,
        prenom,
        photoProfilUrl: userData.picture,
      }),
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      throw new Error("Backend google login failed");
    }

    const backendData = await backendResponse.json() as BackendGoogleAuthResponse;

    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('google_login', 'true');
    redirectUrl.searchParams.set('email', String(userData.email || ''));
    redirectUrl.searchParams.set('access_token', String(backendData.accessToken || ''));
    redirectUrl.searchParams.set('refresh_token', String(backendData.refreshToken || ''));
    redirectUrl.searchParams.set('role', String(backendData.role || 'USER'));
    redirectUrl.searchParams.set('user_id', String(backendData.userId || userData.email || ''));
    redirectUrl.searchParams.set('login', String(backendData.login || userData.email || ''));
    redirectUrl.searchParams.set('nom', String(backendData.nom || nom || ''));
    redirectUrl.searchParams.set('prenom', String(backendData.prenom || prenom || ''));

    return NextResponse.redirect(redirectUrl);

  } catch {
    return NextResponse.redirect(
      new URL('/login?error=auth_failed', request.url)
    );
  }
}
