# GeniusBox — Règles fonctionnelles

## 1. Préparation de partie

- 1 à 10 joueurs peuvent être configurés (minimum 1 nom).
- Un **mode de jeu** est choisi avant le lancement :
  - **Flash** — une seule carte jouée, idéal pour une démonstration ou une partie éclair.
  - **Parcours** — plusieurs cartes enchaînées ; un objectif de points est défini.
- Un **timer d'ambiance** est configurable : 15 s, 30 s ou 45 s.
- Un mode **Mort subite** est disponible (optionnel) : chaque joueur dispose d'un temps limité par tour (5 s à 120 s, par défaut 30 s). Si le temps s'écoule, le tour est forfait — équivalent à une mauvaise réponse.
- Le parcours est constitué en sélectionnant des cartes depuis l'éditeur.
- L'ordre des cartes est modifiable par glisser-déposer avant le démarrage.
- Des parcours peuvent être sauvegardés, chargés, mis à jour ou supprimés.

## 2. Modèle de carte

- Une carte contient **exactement 10 propositions**.
- Chaque proposition possède un texte et une réponse attendue.
- **Types de carte pris en charge** :

| Type                    | Identifiant   | Description                                        |
| ----------------------- | ------------- | -------------------------------------------------- |
| Vrai / Faux             | `true_false`  | Le joueur répond Vrai ou Faux.                     |
| Classement              | `ranking`     | Le joueur place une réponse de 1 à 10.             |
| Question fermée         | `choice`      | Le joueur choisit parmi 2 ou 3 réponses définies.  |
| Réponse libre (texte)   | `free_text`   | Le joueur saisit une réponse textuelle.            |
| Réponse libre (nombre)  | `free_number` | Le joueur saisit un nombre.                        |
| Réponse libre (couleur) | `free_color`  | Le joueur sélectionne une couleur dans la palette. |

## 3. Déroulement d'un tour

1. Le joueur actif sélectionne une proposition non encore révélée.
2. Il répond selon le type de la carte.
3. **Si la réponse est correcte** :
   - +1 point temporaire.
   - Le joueur choisit : **Capitaliser** (sécuriser les points) ou **Risquer** (continuer sur la même carte).
4. **Si la réponse est incorrecte** :
   - Points temporaires remis à zéro.
   - Joueur éliminé pour la carte en cours.
   - Passage au joueur actif suivant.

## 4. Cas particulier — Réponse libre (texte)

- La comparaison est normalisée : accents supprimés, minuscules, espaces rognés.
- En cas de non-correspondance, une **validation manuelle** est proposée à l'animateur :
  - _Accepter quand même_ → la réponse est comptée correcte.
  - _Compter faux_ → le joueur perd ses points temporaires et est éliminé.

## 5. Règles de score

| Événement                              | Effet                                                          |
| -------------------------------------- | -------------------------------------------------------------- |
| Bonne réponse                          | +1 point temporaire                                            |
| Capitaliser                            | Points temporaires → score total ; joueur arrêté pour la carte |
| Mauvaise réponse                       | Points temporaires perdus ; joueur éliminé                     |
| Fin de carte (joueurs actifs restants) | Points temporaires transférés automatiquement au score total   |

## 6. Fin de carte et fin de partie

**Fin de carte** — l'une des conditions suivantes :

- Toutes les propositions ont été révélées.
- Il n'y a plus de joueur actif (tous arrêtés ou éliminés).

**Fin de partie** — l'une des conditions suivantes :

- Un joueur atteint ou dépasse l'objectif de points (mode Parcours).
- Le parcours est entièrement joué.

En cas d'égalité, **plusieurs gagnants** sont possibles (podium partagé).

## 7. Mode Mort subite

Le mode **Mort subite** s'active dans la configuration de partie (étape Mode de jeu).

- Lorsqu'il est activé, un compte à rebours démarre dès que le joueur actif commence son tour.
- La durée est configurable entre 5 et 120 secondes (paliers proposés : 15 s, 30 s, 45 s ; saisie libre également acceptée).
- Si le temps atteint zéro, le tour est automatiquement comptabilisé comme une mauvaise réponse (message « Temps écoulé »).
- Le timer se relance à chaque changement de joueur actif.
- Le badge **Mort subite** est affiché en permanence dans la vue de jeu lorsque ce mode est actif.

## 8. Import / Export et parcours

- **Export** : tout ou partie des cartes exportées au format JSON.
- **Import** : un fichier JSON valide ajoute des cartes au catalogue existant (additif).
- Le JSON porte sur les **cartes** (catalogue), pas sur les parcours sauvegardés.
- Les parcours sauvegardés sont stockés localement et peuvent être rechargés à tout moment.
