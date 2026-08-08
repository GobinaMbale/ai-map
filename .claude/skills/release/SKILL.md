---
name: release
description: Publier AI-MAP en deux phases — préparation automatique (version, changelog, notes) puis publication après validation humaine explicite. Couvre le versionnage npm et VS Code, la description Marketplace, le tag et la GitHub Release. À utiliser dès qu'un change est prêt à être publié.
---

# Publier une release

Deux phases, séparées par une **décision humaine**. La phase 1 ne touche jamais
à Git.

```
Phase 1 — PRÉPARATION (automatique, sans effet)
    analyse des commits → version proposée → changelog → notes
                              ↓
                    ┌─────────────────────┐
                    │  DÉCISION HUMAINE   │
                    │ approuve / modifie /│
                    │      rejette        │
                    └─────────────────────┘
                              ↓ approuve
Phase 2 — PUBLICATION
    commit → tag → push → build → GitHub Release
```

## Phase 1 — Préparer

```bash
npm run check                    # build + tests + captures : jamais publier sans
npm run release:prepare          # proposition, AUCUNE modification
```

Le script analyse les Conventional Commits depuis le dernier tag et affiche :

- l'**incrément SemVer** déduit (`fix` → patch, `feat` → minor, `!` → major) ;
- la **version CLI** proposée ;
- la **version de l'extension**, incrémentée *uniquement* si `vscode-extension/`
  a changé ;
- si la **description Marketplace** doit être relue, avec la liste des fichiers
  qui ont changé ce que l'utilisateur voit ;
- l'**entrée CHANGELOG** au format Keep a Changelog ;

Puis, si la proposition convient :

```bash
npm run release:apply            # écrit CHANGELOG.md + versions
```

`--apply` **écrit des fichiers mais ne commite ni ne pousse jamais.** Pour
imposer une autre version : `node scripts/release-prepare.mjs --as 1.2.0 --apply`.

## La décision humaine

**Un agent doit s'arrêter ici.** Présenter la proposition — version, nombre de
changements par catégorie, breaking changes éventuels — et attendre un accord
explicite. Ne jamais enchaîner préparation et publication.

Ce que le mainteneur vérifie :

- la version proposée correspond-elle à la nature réelle des changements ?
- un breaking change est-il passé inaperçu (renommage de champ du modèle,
  option CLI retirée, format du JSON modifié) ?
- le changelog est-il lisible par quelqu'un qui n'a pas suivi le développement ?
- la description Marketplace est-elle encore vraie ?

## Phase 2 — Publier

Uniquement après accord.

```bash
git add CHANGELOG.md package.json vscode-extension/package.json
git commit -m "chore(release): prépare la v1.4.0"
git tag v1.4.0
git push origin main --follow-tags
```

Puis l'extension, si sa version a bougé :

```bash
npm run build                             # le bundle est embarqué dans le VSIX
cd vscode-extension && npm run package
```

Puis la GitHub Release, avec les notes issues du CHANGELOG :

```bash
gh release create v1.4.0 --title "v1.4.0" --notes-file <(sed -n '/^## \[1.4.0\]/,/^## \[/p' CHANGELOG.md)
```

Si `gh` n'est pas disponible : créer la release depuis l'interface GitHub, en
collant la section correspondante du CHANGELOG.

## Métadonnées Marketplace

À vérifier avant toute première publication — plusieurs sont immuables.

| Champ | Pourquoi |
|---|---|
| `publisher` | **immuable** après la première publication |
| `repository` (+ `directory`) | sans lui, liens et images relatifs du README cassés sur la fiche publique |
| `LICENSE` | doit être **physiquement dans `vscode-extension/`** |
| `icon` | PNG ≥ 128×128 — `npm run icon` |
| `engines.vscode` | impacte aussi Cursor, Windsurf, Trae, Kiro |
| `galleryBanner` | couleur de la fiche |

L'icône est **générée par le dépôt** (`scripts/make-icon.mjs`, PNG encodé à la
main via `node:zlib`) : aucun binaire opaque n'est commité sans sa source.

`vsce package` doit tourner **sans avertissement de métadonnées** — un
avertissement en local devient une fiche cassée en public. Seule la note de
taille sur `media/ai-map.mjs` est tolérée : elle est inhérente au principe
autoportant.

## Pièges vécus

**La version installée masque celle de F5.** Une extension déjà installée prend
le pas sur celle lancée en développement. Symptôme : une correction évidente
« ne marche pas ».

```bash
code --uninstall-extension gobinadaniel.ai-map-vscode
```

Puis `Developer: Reload Window`. La vue latérale doit commencer par
`N entités · M relations` — sinon c'est encore l'ancienne.

**`git add -A` ratisse large.** Vérifier `git status --short` avant : ni
`.shots/`, ni `*.vsix`, ni rapport HTML, ni `node_modules/`.

**Les tests passent sur `src/`, pas sur le bundle.** Ils réussissent même si
`bin/ai-map.mjs` est périmé — et c'est le bundle qui est publié. D'où
`npm run build` en premier, toujours.
