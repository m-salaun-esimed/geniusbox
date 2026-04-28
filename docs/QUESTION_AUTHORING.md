# Authoring des cartes et parcours

## 1. Création et édition des cartes

Dans l'étape Cartes de l'application :

1. Cliquer sur Créer une carte.
2. Saisir un titre.
3. Choisir le type de question :
   - `true_false` — Vrai / Faux
   - `ranking` — classement de 1 à 10
   - `choice` — choix parmi 2 ou 3 réponses définies
   - `free_text` — saisie texte libre
   - `free_number` — saisie numérique
   - `free_color` — sélection d'une couleur dans la palette
4. Renseigner exactement 10 propositions.
5. Renseigner la réponse attendue pour chaque proposition.
6. Valider la carte.

Règles de validation :
- titre obligatoire et unique (insensible à la casse) ;
- 10 propositions obligatoires, texte et réponse attendue renseignés ;
- pour `choice` : 2 ou 3 valeurs de `choices` non vides ; chaque réponse attendue doit appartenir à `choices` ;
- pour `free_number` : chaque réponse attendue doit être un nombre valide (la virgule décimale est acceptée) ;
- pour `free_color` : chaque réponse attendue doit correspondre à un identifiant de la palette (`rouge`, `bleu`, `vert`, `jaune`, `orange`, `violet`, `rose`, `noir`, `blanc`, `gris`).

## 2. Export / import des cartes

Le flux d'import/export est disponible dans l'étape Cartes.

Export :
- action Mode Export ;
- sélection des cartes à exporter ;
- génération d'un JSON copiable contenant uniquement la sélection.

Import :
- coller un JSON valide dans la zone d'import ;
- cliquer sur Importer le JSON (ajout) ;
- si valide, les cartes importées sont ajoutées au catalogue existant.

Remarques importantes :
- l'import est additif (il n'écrase pas les cartes existantes) ;
- si le JSON est invalide, l'import est refusé ;
- les cartes importées sont persistées localement.

## 3. Choix des cartes pour le parcours de partie

Le parcours se compose dans l'étape Parcours :

1. Ajouter des cartes depuis Cartes disponibles vers Parcours de la partie.
2. Réordonner les cartes avec les contrôles de déplacement.
3. Retirer les cartes non souhaitées.
4. Lancer la partie avec ce parcours ordonné.

Remarques importantes :
- le parcours est une sélection ordonnée de cartes ;
- les parcours peuvent être sauvegardés localement (nom + catégorie + ordre des cartes) ;
- le parcours n'est pas exporté/importé comme objet distinct en JSON.

## 4. Structure JSON attendue

Le JSON importé/exporté est un tableau de cartes.

Exemple minimal :

```json
[
  {
    "id": "card_123",
    "title": "Inventions celebres",
    "type": "true_false",
    "propositions": [
      { "id": "prop_1", "text": "Telephone", "correctAnswer": "true" },
      { "id": "prop_2", "text": "Ampoule", "correctAnswer": "true" },
      { "id": "prop_3", "text": "Radio", "correctAnswer": "true" },
      { "id": "prop_4", "text": "Television", "correctAnswer": "true" },
      { "id": "prop_5", "text": "Machine a ecrire", "correctAnswer": "false" },
      { "id": "prop_6", "text": "Boussole", "correctAnswer": "true" },
      { "id": "prop_7", "text": "Imprimerie", "correctAnswer": "true" },
      { "id": "prop_8", "text": "Parachute", "correctAnswer": "true" },
      { "id": "prop_9", "text": "Dynamite", "correctAnswer": "true" },
      { "id": "prop_10", "text": "Minitel", "correctAnswer": "false" }
    ]
  }
]
```
