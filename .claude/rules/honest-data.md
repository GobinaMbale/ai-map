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

## La règle qui prime : ne reprocher qu'une promesse non tenue

**AI-MAP signale une contradiction entre ce qu'un fichier annonce et ce qui
existe. Jamais l'absence de quelque chose qu'il n'a jamais promis.**

C'est la seule formulation qui tienne à l'échelle. Les usages légitimes d'un
outil IA sont innombrables et personne ne peut les énumérer : trois faux
positifs ont été trouvés en trois questions, tous produits par une règle
générique appliquée là où elle ne valait pas.

| Cas | Verdict générique (faux) | Verdict correct |
|---|---|---|
| Hook `Stop` dans `settings.json` | « rien ne le cite → à supprimer » | déclenché par un événement : **hors sujet** |
| Skill pilotant Jira via MCP | « ne touche aucun code » | cible distante **vérifiable** dans `.mcp.json` |
| Skill « traiter des images » | « ne touche aucun code » | n'annonce aucune cible : **hors périmètre** |
| Skill citant `backend/x.py` inexistant | — | **vrai défaut** : promesse non tenue |

### Ce que ça impose

**Le silence est le défaut.** Une entité qui n'annonce rien n'entre pas dans le
dénominateur. C'est ce qui rend la mesure sûre face aux cas jamais vus : nul
besoin de les recenser, ils ne déclenchent rien.

**Une règle qui ne peut pas nommer sa preuve ne doit pas exister.** Toute alerte
produit trois choses, sinon elle n'est pas écrite :

| Champ | Contenu |
|---|---|
| `facts` | ce qui a été **mesuré** (`0 relation dans le graphe`, `description absente`) |
| `why` | la **règle d'activation** qui rend ce fait problématique |
| `todo` | l'action concrète |

Sans `facts`, le lecteur doit croire l'outil sur parole et ne peut pas le
contester. C'est un test de `test/smoke.mjs`.

**Un pourcentage s'affiche avec son dénominateur ET son hors-périmètre.**
« Traçabilité 50 % » ne dit pas que la moitié des skills n'est pas concernée
par la mesure ; `part.scope` le dit.

**Avant d'ajouter une règle**, chercher l'usage légitime qu'elle condamnerait.
S'il en existe un, la règle est trop large — restreindre au cas où une
promesse écrite est démentie par le disque.

## Les divergences entre projets

Signaler une divergence, c'est accuser quelqu'un d'avoir laissé dériver un
fichier. Un faux positif ici coûte plus cher qu'un silence : on cesse de lire
l'onglet.

**Ne comparer que ce qu'on copie délibérément d'un projet à l'autre.**
`WS_COMPARABLE` (`core/workspace.mjs`) limite la comparaison aux skills,
commandes, agents, règles, prompts, workflows et déclarations MCP. Un `CLAUDE.md`
par projet **doit** différer — c'est de la mémoire locale, pas une copie qui a
dérivé. Deux tâches « 3. Tests » dans deux projets sont une collision de titre.
Ce piège est verrouillé par `test/workspace.mjs`.

**Figer l'empreinte avant toute transformation.** Le contenu est tronqué en
aperçu au niveau portefeuille, et la note ajoutée contient le chemin du projet :
comparer après coup rendait 21 copies identiques artificiellement divergentes.
`e.print` est calculé en premier, dans `wsTrim`.

**Compter les projets, pas les occurrences.** Un même projet peut porter deux
entités homonymes ; « 2/6 projets » doit rester vrai.

Les trois chiffres qui parlent d'écarts — sous-titre, badge d'onglet, KPI —
dérivent tous de `totals.misaligned`. Ils ont déjà divergé une fois : l'un
comptait les artefacts partagés, l'autre les seules divergences strictes.

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
