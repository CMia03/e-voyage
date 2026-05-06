import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email est requis' },
        { status: 400 }
      );
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    // TODO: Implémenter la logique de réinitialisation du mot de passe
    // 1. Vérifier si l'email existe dans la base de données
    // 2. Générer un token de réinitialisation sécurisé
    // 3. Sauvegarder le token avec une date d'expiration
    // 4. Envoyer un email avec le lien de réinitialisation
    
    // Simulation d'un traitement réussi
    // En production, vous devriez:
    // - Vérifier l'existence de l'utilisateur
    // - Générer un token unique et l'enregistrer
    // - Envoyer un email réel avec le lien de réinitialisation
    
    console.log(`Demande de réinitialisation pour l'email: ${email}`);
    
    // Simuler un délai d'envoi d'email
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Toujours retourner un succès pour des raisons de sécurité
    // Même si l'email n'existe pas, on ne veut pas révéler cette information
    return NextResponse.json(
      { 
        message: 'Si cet email existe dans notre base de données, un lien de réinitialisation a été envoyé.' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer plus tard.' },
      { status: 500 }
    );
  }
}
