---
name: release
description: Publier AI-MAP — CLI npm, extension VS Code (.vsix), et dépôt Git. Ordre des opérations, métadonnées marketplace obligatoires, et pièges de packaging vécus. À utiliser avant toute publication ou incrément de version.
---

# Publier

## Ordre des opérations

Le bundle sert **à la fois** au paquet npm et à l'extension : il doit être
régénéré avant les deux.

```bash
npm run build          # bin/ai-map.mjs + copie dans vscode-extension/media/
npm test               # 120 vérifications
npm run shots          # vérification visuelle — voir la skill verify-visual
```

Puis seulement :

```bash
cd vscode-extension && npm run package    # → .vsix
```

## Métadonnées obligatoires

Ces champs doivent être corrects **avant** la première publication : plusieurs
sont immuables ensuite.

| Champ | Pourquoi |
|---|---|
| `publisher` | **immuable** après la première publication Marketplace |
| `repository` (+ `directory`) | sans lui, les liens et images relatifs du README sont cassés sur la fiche publique |
| `LICENSE` | doit être **physiquement dans `vscode-extension/`**, pas seulement à la racine |
| `icon` | PNG ≥ 128×128 — régénérable par `npm run icon` |
| `engines.vscode` | impacte aussi Cursor, Windsurf, Trae, Kiro (ils embarquent l'API VS Code) |
| `galleryBanner` | couleur de la fiche Marketplace |

L'icône est **générée par le dépôt** (`scripts/make-icon.mjs`, encodage PNG à
la main via `node:zlib`) : aucun binaire opaque n'est commité sans sa source.

## Règle de packaging

`vsce package` doit tourner **sans avertissement de métadonnées**. Un
avertissement en local devient une fiche cassée en public.

Le seul message toléré est la note de taille sur `media/ai-map.mjs` : elle est
inhérente au principe autoportant (le moteur est embarqué).

## Versions

Deux versions **indépendantes** :

- `package.json` à la racine → la CLI npm
- `vscode-extension/package.json` → l'extension

Incrémenter celle qui change. Le Marketplace refuse de republier une version
existante.

## Vérifier ce qui est publié

```bash
npm pack --dry-run                       # contenu du paquet npm
cd vscode-extension && npx vsce ls       # contenu du .vsix
```

`files` dans `package.json` est une **liste blanche** : `src/`, `examples/`,
`test/` et `docs/` ne sont pas publiés sur npm — seul `bin/` l'est.

## Piège vécu : la version installée masque celle de F5

Si une version a déjà été installée, elle prend le pas sur celle lancée par
**F5** dans VS Code. Symptôme : une correction évidente « ne marche pas ».

```bash
code --uninstall-extension gobinadaniel.ai-map-vscode
```

Puis `Developer: Reload Window`. Vérifier la version chargée : la vue latérale
doit commencer par une ligne de résumé `N entités · M relations`.

## Git

Brancher avant de committer si on est sur `main`. Messages en Conventional
Commits, terminés par `Co-Authored-By: Claude ...`.

Ne **pas** committer : `.shots/`, `.shots-dark/`, `*.vsix`,
`ai-map.report.html`, `node_modules/`. Tous sont dans `.gitignore` — vérifier
avec `git status --short` avant `git add -A`, qui ratisse large.
