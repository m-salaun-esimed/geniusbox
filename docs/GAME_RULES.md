# Smart 10 - Règles fonctionnelles

## 1. Préparation de partie

- 1 à 10 joueurs peuvent être configurés.
- Un objectif de points est défini avant le lancement.
- Un timer d'ambiance est configurable (15s, 30s, 45s).
- Le parcours est construit en sélectionnant des cartes dans l'étape Parcours.
- L'ordre des cartes est modifiable avant démarrage.

## 2. Modèle de carte

- Une carte contient exactement 10 propositions.
- Types de carte pris en charge :
	- Vrai / Faux
	- Classement
	- Choix multiple binaire (Homme/Femme)
	- Réponse libre

## 3. Déroulement d'un tour

1. Le joueur actif sélectionne une proposition non révélée.
2. Le joueur répond selon le type de la carte.
3. Si la réponse est correcte :
	 - +1 point temporaire ;
	 - choix entre capitaliser ou continuer.
4. Si la réponse est incorrecte :
	 - points temporaires remis à 0 ;
	 - joueur éliminé pour la carte ;
	 - passage au joueur actif suivant.

## 4. Règles de score

- Bonne réponse : +1 point temporaire.
- Capitalisation : transfert des points temporaires vers le score total.
- Mauvaise réponse : perte des points temporaires du tour en cours.

## 5. Fin de carte et fin de partie

- Fin de carte :
	- toutes les propositions ont été révélées, ou
	- il n'y a plus de joueur actif.
- Fin de partie :
	- un joueur atteint l'objectif de points, ou
	- la dernière carte du parcours est terminée.
- En cas d'égalité, plusieurs gagnants sont possibles.

## 6. Import / export et parcours

- Export : l'utilisateur peut exporter tout ou partie des cartes au format JSON.
- Import : un JSON valide ajoute des cartes au catalogue existant.
- Le parcours est choisi au lancement en sélectionnant les cartes à jouer.
- Les parcours sont sauvegardables localement (création, mise à jour, suppression).
- Le JSON d'export/import concerne les cartes, pas les parcours sauvegardés.
