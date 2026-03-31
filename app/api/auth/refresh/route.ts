import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Appel à votre backend pour rafraîchir le token
    const backendResponse = await fetch(`${process.env.API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || refreshToken,
      role: data.role,
      userId: data.userId,
      login: data.login,
      nom: data.nom,
      prenom: data.prenom,
    });

  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
