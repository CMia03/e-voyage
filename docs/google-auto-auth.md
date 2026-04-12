# Authentification Automatique Google

Cette fonctionnalité permet aux utilisateurs qui se connectent avec Google de voir leurs informations s'afficher automatiquement lors de leurs prochaines visites.

## Fonctionnalités

### 1. Détection Automatique
- Le système détecte automatiquement si un utilisateur s'est connecté via Google
- Vérifie la présence d'adresses email Google (@gmail.com, @google.com) ou d'identifiants Google

### 2. Chargement du Profil
- Récupère automatiquement le profil complet de l'utilisateur depuis l'API
- Met à jour la session avec les informations complètes (nom, prénom, email, etc.)
- Sauvegarde ces informations pour un accès rapide ultérieur

### 3. Affichage des Informations
- Affiche un message de bienvenue personnalisé au retour de l'utilisateur
- Montre l'avatar, le nom complet et le rôle de l'utilisateur
- Propose de compléter le profil si des informations sont manquantes

## Composants

### `GoogleUserWelcome`
- Affiche une modale de bienvenue pour les utilisateurs Google
- Détecte si c'est la première connexion ou un retour
- Propose la complétion du profil si nécessaire

### `UserInfoDisplay`
- Affiche les informations utilisateur dans différents formats
- Variante "compact" pour les headers/barres de navigation
- Variante "detailed" pour les pages de profil

### `useGoogleAuth` Hook
- Gère la logique d'authentification Google
- Charge automatiquement le profil utilisateur
- Fournit les informations utilisateur aux composants

## Fichiers Implémentés

1. **`lib/auto-auth.ts`** - Logique métier de l'authentification Google
2. **`hooks/useGoogleAuth.ts`** - Hook React pour l'authentification Google
3. **`components/google-user-welcome.tsx`** - Modale de bienvenue
4. **`components/user-info-display.tsx`** - Affichage des informations utilisateur
5. **`hooks/useAuth.ts`** - Modifié pour intégrer la logique Google

## Flux d'Authentification

1. **Connexion Initiale**
   - Utilisateur clique sur "Se connecter avec Google"
   - Redirection vers l'OAuth Google
   - Retour avec les tokens et informations de base
   - Sauvegarde de la session

2. **Retour sur le Site**
   - Détection automatique d'une session Google existante
   - Chargement du profil complet depuis l'API
   - Mise à jour de la session avec les informations complètes
   - Affichage du message de bienvenue

3. **Utilisation Continue**
   - Les informations sont conservées en localStorage
   - Affichage automatique du profil utilisateur
   - Pas besoin de se reconnecter à chaque visite

## Personnalisation

### Modifier le message de bienvenue
Dans `GoogleUserWelcome`, modifiez les textes dans `CardDescription` et `CardTitle`.

### Changer l'apparence de l'affichage utilisateur
Dans `UserInfoDisplay`, ajustez les classes CSS et les composants UI selon vos besoins.

### Ajouter des informations supplémentaires
Étendez `UserProfile` dans `lib/auto-auth.ts` pour inclure plus de champs.

## Sécurité

- Les tokens expirent automatiquement après 1 heure
- Rafraîchissement automatique des tokens expirés
- Validation de la session à chaque chargement
- Nettoyage automatique en cas d'erreur

## Utilisation

```tsx
// Dans un composant React
import { GoogleUserWelcome } from "@/components/google-user-welcome";
import { UserInfoDisplay } from "@/components/user-info-display";

function MonComposant() {
  return (
    <>
      <GoogleUserWelcome />
      <UserInfoDisplay variant="compact" />
    </>
  );
}
```

## Dépannage

### Problème: Les informations ne s'affichent pas
- Vérifiez que l'utilisateur est bien connecté via Google
- Confirmez que l'API `/api/auth/me` retourne bien les données
- Vérifiez la console pour d'éventuelles erreurs

### Problème: La modale ne s'affiche qu'une fois
- C'est normal ! La modale utilise `localStorage` pour éviter de s'afficher répétitivement
- Pour la réafficher, supprimez la clé `google_welcome_seen` du localStorage

### Problème: Le profil reste incomplet
- L'utilisateur doit compléter son profil via l'interface dédiée
- Vérifiez que l'endpoint de mise à jour du profil fonctionne correctement
