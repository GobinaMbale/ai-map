# AI-MAP n'invente rien

Un outil de gouvernance qui affiche une donnée fausse est pire qu'un outil
absent : on prend des décisions dessus. Toute valeur affichée doit être
**dérivable** et **vérifiable**.

## Les liens

Un lien vers le code n'est créé que si le fichier **existe réellement** sur
disque (`isFile`). Un chemin cité mais inexistant ne produit rien — pas de
nœud « fantôme ».

Garde-fous en place dans `core/graph.mjs`, tous couverts par
`test/smoke.mjs` :

- jamais hors de la racine du projet — une référence `../../secret` est refusée
  **même si le fichier existe** ;
- uniquement les extensions de code (`CODE_EXT`), sinon un `README.md` cité
  serait étiqueté « code » ;
- pas de doublon si le chemin est déjà une entité IA ;
- plafond par entité (`MAX_CODE_REFS_PER_ENTITY`).

Les citations nominatives (`mention`) exigent un nom **distinctif** (kebab/snake
case, ou ≥ 6 caractères) et ne se créent pas entre entités homonymes : deux
déclarations de la même chose ne se citent pas l'une l'autre.

## Le score

Le score de maturité est la **moyenne de composantes affichées avec leur
définition**. Un score dont on ne peut pas vérifier le calcul ne permet
d'arbitrer aucune décision.

Les recommandations (« +23 pts Traçabilité ») sont **calculées**, pas estimées :
une composante pèse `1/N` du score, donc corriger `n` entités sur `u` rapporte
`(n/u)/N × 100`.

**Invariant testé** : appliquer toutes les recommandations ne peut jamais
dépasser 100. Le test compare la somme des gains à `100 − score`. Si un jour
une recommandation est ajoutée sans respecter cette arithmétique, le test tombe.

## Ce qui est interdit

- Une **tendance** (« +3 ce mois-ci ») tant qu'aucun historique n'est persisté.
  AI-MAP ne calcule que des `mtime` ; une tendance supposerait d'écrire un
  fichier d'état dans le projet, ce qui est une décision produit non prise.
- Un **bouton d'action** que le contexte ne peut pas honorer. Le rapport HTML
  est hors ligne : il ne peut ni archiver ni modifier. Ses boutons sont donc
  « Voir la fiche » et « Copier le chemin », pas « Archiver ».
- Un **écosystème affiché comme absent** alors qu'il n'est simplement pas
  couvert. Le tableau de bord distingue « non détecté » de « adaptateur prévu ».

## Quand une donnée manque

Le dire. `null` et un message explicite valent mieux qu'un zéro plausible :
une composante du score sans données mesurables est **retirée de la moyenne**,
pas comptée à 0.
