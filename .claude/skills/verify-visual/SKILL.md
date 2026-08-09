---
name: verify-visual
description: Vérifier visuellement le rapport AI-MAP après toute modification de l'interface — génération des captures onglet par onglet, points de contrôle, et bugs typiques que les tests ne voient pas. À utiliser dès qu'on touche app.js, styles.css, ou le rendu Markdown.
---

# Vérifier visuellement le rapport

## Pourquoi cette étape existe

`npm test` exécute le JS du rapport dans un DOM simulé. Il prouve que le rendu
**ne plante pas**. Il ne prouve jamais qu'il est **lisible**.

Trois bugs sont passés au travers des tests, tous trouvés en regardant :

| Bug | Ce que le test voyait | Ce que l'œil voyait |
|---|---|---|
| `if(N<=60 \|\| !dim)` sur les libellés | rendu sans erreur | 103 libellés empilés, illisibles |
| Fence Markdown indentée non reconnue | rendu sans erreur | ` ```bash ` visible, code non formaté |
| Score affiché en héros **et** en bandeau | rendu sans erreur | même chiffre deux fois |

Un quatrième cas mérite mention : `buildKpis()` était devenu **du code mort**
(défini, jamais appelé) et aucun test ne s'en apercevait.

## Procédure

```bash
npm run build          # obligatoire : le bundle sert à l'extension
npm test               # les tests logiques d'abord
npm run shots          # captures du rapport, onglet par onglet
```

Puis **ouvrir les images** de `.shots/` et les regarder. Sans cette dernière
étape la procédure ne sert à rien.

Variantes :

```bash
npm run shots -- ../qcm-factory      # sur un vrai projet, pas un exemple
npm run shots:dark                   # thème sombre → .shots-dark/
npm run shots -- . --width 1100      # largeur réduite (test responsive)
npm run shots:ws                     # VUE PORTEFEUILLE → .shots-ws/
npm run check                        # build + tests + captures d'un coup
```

⚠ `npm run shots` capture les onglets du rapport **mono-projet**. Un rapport
workspace a d'autres onglets : sans `shots:ws`, le script ne trouve rien et
sort sans rien signaler. Toute modification de `app.js` doit passer par les
deux.

Le script pilote un **Chrome ou Edge déjà installé** (aucun navigateur n'est
téléchargé) et échoue si la page émet la moindre erreur JS.

## Points de contrôle par onglet

**Vue d'ensemble** — le score est-il affiché *une seule fois* ? Les tuiles
tiennent-elles sur une ligne ? Le panneau d'alertes est-il à hauteur du score ?

**Impact** — le sélecteur d'origine tient-il en deux lignes maximum ? Les
cartes du fil sont-elles alignées, chevrons compris ? Un fil se lit-il
*Exigence › Skill › Outil › Code* sans avoir à deviner ?

**Gouvernance** — les boutons d'action sont-ils à droite, alignés ? Le gain en
points est-il visible sans lire toute la ligne ?

**Graphe** — **le point le plus fragile**. Les libellés se chevauchent-ils ?
Les nœuds sont-ils plaqués contre un bord (signe d'un bornage pendant la
convergence) ? Les grappes sont-elles distinctes ? Tester aussi le plein écran
et la vue MCD.

**Timeline** — les barres mensuelles ont-elles une hauteur exploitable ?

**Entités** — les fiches sont-elles de hauteur homogène ? Le pied (chemin +
date) est-il aligné en bas ?

**Portefeuille** *(workspace uniquement)* — les fiches ont-elles leur pied
aligné en bas ? Deux projets homonymes sont-ils distinguables (chemin affiché) ?
Les trois chiffres qui parlent d'écarts — sous-titre d'en-tête, badge de
l'onglet, KPI — **disent-ils le même nombre** ? Ils ont déjà divergé : 23 à côté
de « Divergences » pendant que l'en-tête annonçait 0.

**Divergences** *(workspace uniquement)* — capturer les **trois** familles
(`shots:ws` clique chaque pastille). La famille « copies alignées » doit être
regroupée par ensemble de projets : une ligne par artefact redonnait un mur de
23 lignes. Vérifier aussi le cas sans problème : le bandeau vert doit passer
avant la liste.

**Fiche détaillée** — c'est là que régresse le rendu Markdown. Vérifier :
blocs de code avec leur **langue** et le bouton **Copier** ; listes numérotées
qui ne repartent pas à 1 ; titres de section avec leur barre colorée ; cases à
cocher rendues comme telles.

## Choisir le bon projet à capturer

`examples/demo-project` (24 entités) valide la mise en forme.
**Il ne valide pas la densité.** Pour ça, capturer un vrai projet :

```bash
npm run shots -- ../qcm-factory      # 94 entités, 119 relations
npm run shots -- .                   # AI-MAP se cartographie lui-même
```

Le graphe ne devient difficile qu'au-delà de ~60 nœuds — un exemple ne le
révélera jamais.

Pour le portefeuille, `examples/` (3 projets) suffit à valider la mise en forme
mais **pas** la densité ni les vraies divergences :

```bash
npm run shots -- ../.. --workspace -o .shots-ws   # 6 projets réels
```

## Après vérification

Les captures sont des **artefacts**, pas de la documentation : `.shots/` est
ignoré par git. Ne pas les committer.
