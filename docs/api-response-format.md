# Format de Réponse API Notations

Ce document décrit le format de réponse de l'API de notations externe et comment il est converti pour le frontend.

## Format de Réponse API Externe

### GET /api/notations ou /api/notations/utilisateur/{userId}

```json
{
  "success": true,
  "data": [
    {
      "idDestination": "550e8400-e29b-41d4-a716-446655440000",
      "idAvis": "550e8400-e29b-41d4-a716-446655440001",
      "idUser": "550e8400-e29b-41d4-a716-446655440002",
      "nomUser": "Jean Dupont",
      "nomDestination": "Plage de Belle-Mare",
      "dateCreation": "2026-04-11T16:06:00",
      "dateModification": "2026-04-11T16:06:00",
      "status": true,
      "nombreEtoiles": 4
    }
  ],
  "message": "Notations récupérées avec succès"
}
```

### POST /api/notations

**Request Body:**
```json
{
  "idUser": "550e8400-e29b-41d4-a716-446655440002",
  "idDestination": "550e8400-e29b-41d4-a716-446655440000",
  "nomDestination": "Plage de Belle-Mare",
  "nombreEtoiles": 4,
  "dateCreation": "2026-04-11T16:06:00",
  "dateModification": "2026-04-11T16:06:00",
  "status": true
}
```

## Conversion vers le Frontend

Les API Next.js transforment les données de l'API externe vers un format standardisé pour le frontend.

### Format Frontend (Standard)

```typescript
interface Note {
  id: string;
  userId: string;
  destinationId: string;
  destinationName: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Mapping des Champs

| API Externe | Frontend | Description |
|-------------|----------|-------------|
| `idAvis` | `id` | ID unique de la notation |
| `idUser` | `userId` | ID de l'utilisateur |
| `idDestination` | `destinationId` | ID de la destination |
| `nomDestination` | `destinationName` | Nom de la destination |
| `nombreEtoiles` | `rating` | Note de 1 à 5 |
| `dateCreation` | `createdAt` | Date de création |
| `dateModification` | `updatedAt` | Date de modification |

### Fonction de Conversion

```typescript
function convertNotationToFrontend(notation: any): Note {
  return {
    id: notation.idAvis,
    userId: notation.idUser,
    destinationId: notation.idDestination,
    destinationName: notation.nomDestination,
    rating: notation.nombreEtoiles,
    createdAt: new Date(notation.dateCreation),
    updatedAt: new Date(notation.dateModification)
  };
}
```

## Flux de Données Complet

### 1. Client note une destination

```
StarRating (Frontend)
    POST /api/note/[userId]
        Next.js API (Conversion)
            POST /api/notations
                API Externe
                    Base de données
```

**Format Request Frontend:**
```json
{
  "destinationId": "dest1",
  "destinationName": "Plage de Belle-Mare",
  "rating": 4
}
```

**Format Request API Externe:**
```json
{
  "idUser": "user123",
  "idDestination": "dest1",
  "nomDestination": "Plage de Belle-Mare",
  "nombreEtoiles": 4,
  "dateCreation": "2026-04-11T16:06:00",
  "dateModification": "2026-04-11T16:06:00",
  "status": true
}
```

### 2. Récupération des notations

```
Frontend (AdminAvis)
    GET /api/notes
        Next.js API (Conversion)
            GET /api/notations
                API Externe
                    Base de données
```

**Format Réponse API Externe:**
```json
{
  "success": true,
  "data": [
    {
      "idDestination": "dest1",
      "idAvis": "avis1",
      "idUser": "user123",
      "nomUser": "Jean Dupont",
      "nomDestination": "Plage de Belle-Mare",
      "dateCreation": "2026-04-11T16:06:00",
      "dateModification": "2026-04-11T16:06:00",
      "status": true,
      "nombreEtoiles": 4
    }
  ]
}
```

**Format Réponse Frontend:**
```json
{
  "success": true,
  "notes": [
    {
      "id": "avis1",
      "userId": "user123",
      "destinationId": "dest1",
      "destinationName": "Plage de Belle-Mare",
      "rating": 4,
      "createdAt": "2026-04-11T16:06:00.000Z",
      "updatedAt": "2026-04-11T16:06:00.000Z"
    }
  ],
  "stats": { ... }
}
```

## Gestion des Champs Supplémentaires

L'API externe retourne des champs supplémentaires qui ne sont pas utilisés directement par le frontend :

### Champs ignorés
- `nomUser`: Nom de l'utilisateur (utilisé pour l'affichage admin uniquement)
- `status`: Statut de la notation (toujours true dans notre cas)

### Champs traités spécialement
- `dateCreation`/`dateModification`: Convertis en objets `Date`
- `nombreEtoiles`: Renommé en `rating` pour plus de clarté

## Validation des Données

### Validation à la réception
```typescript
// Validation des champs requis
const requiredFields = ['idAvis', 'idUser', 'idDestination', 'nomDestination', 'nombreEtoiles'];
const isValid = requiredFields.every(field => notation[field] !== undefined);

// Validation de la note
const isValidRating = notation.nombreEtoiles >= 1 && notation.nombreEtoiles <= 5;

// Validation des dates
const isValidDate = !isNaN(Date.parse(notation.dateCreation));
```

### Validation à l'envoi
```typescript
// Validation avant envoi à l'API externe
if (!body.destinationId || !body.destinationName || !body.rating) {
  return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
}

if (body.rating < 1 || body.rating > 5) {
  return NextResponse.json({ error: 'La note doit être entre 1 et 5' }, { status: 400 });
}
```

## Erreurs Courantes

### 1. Format de réponse incorrect
```json
// Erreur: réponse sans champ "data"
{
  "success": true,
  "notations": [...]  // Au lieu de "data"
}
```

**Solution:** Les API Next.js gèrent les deux formats avec fallback.

### 2. Champs manquants
```json
// Erreur: champ idAvis manquant
{
  "idDestination": "dest1",
  "idUser": "user123",
  // "idAvis": "avis1"  // Manquant
}
```

**Solution:** Génération automatique d'un ID composite.

### 3. Format de date invalide
```json
// Erreur: format de date non ISO
"dateCreation": "11/04/2026 16:06"
```

**Solution:** Tentative de parsing multiple avec fallback.

## Tests

### Test unitaire de conversion
```typescript
describe('Conversion API', () => {
  test('convertit correctement une notation', () => {
    const apiNotation = {
      idAvis: 'avis1',
      idUser: 'user1',
      idDestination: 'dest1',
      nomDestination: 'Test Destination',
      nombreEtoiles: 4,
      dateCreation: '2026-04-11T16:06:00',
      dateModification: '2026-04-11T16:06:00'
    };

    const frontendNote = convertNotationToFrontend(apiNotation);

    expect(frontendNote).toEqual({
      id: 'avis1',
      userId: 'user1',
      destinationId: 'dest1',
      destinationName: 'Test Destination',
      rating: 4,
      createdAt: new Date('2026-04-11T16:06:00'),
      updatedAt: new Date('2026-04-11T16:06:00')
    });
  });
});
```

## Performance

### Optimisations
1. **Conversion paresseuse**: Ne convertir que les données nécessaires
2. **Cache**: Mettre en cache les conversions fréquentes
3. **Validation minimale**: Valider uniquement les champs critiques

### Monitoring
- **Temps de conversion**: Surveiller le temps de transformation
- **Taux d'erreur**: Suivre les échecs de conversion
- **Volume**: Monitorer le nombre de conversions par seconde
