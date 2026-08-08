---
description: Prépare une release — version proposée, changelog, notes, et contrôle de la description Marketplace. Ne commite ni ne pousse rien.
allowed-tools: Bash, Read, Edit
---

# /release

Lance la **phase 1** d'une release : préparation seule. Cette commande ne
commite pas, ne taggue pas, ne pousse pas.

## Ce que je fais

```bash
npm run check              # build + tests + captures — jamais publier sans
npm run release:prepare    # proposition, sans aucune modification
```

Puis je te présente :

- l'**incrément SemVer** déduit des Conventional Commits, et pourquoi ;
- la **version CLI** et, si `vscode-extension/` a changé, la **version de
  l'extension** ;
- si la **description Marketplace** doit être relue, avec les fichiers en
  cause ;
- l'**entrée CHANGELOG** proposée ;
- les **breaking changes** éventuels, mis en tête.

## Puis je m'arrête

**J'attends ta décision.** Trois réponses possibles :

| Réponse | Ce que je fais |
|---|---|
| **approuve** | j'applique, commite, taggue, pousse, et crée la GitHub Release |
| **modifie** | tu me donnes la version ou le texte voulu, je régénère |
| **rejette** | je n'applique rien |

Je n'enchaîne jamais préparation et publication de moi-même — voir
`.claude/rules/versioning.md`.

## Si tu approuves

```bash
npm run release:apply                     # CHANGELOG + versions (sans commit)
git add CHANGELOG.md package.json vscode-extension/package.json
git commit -m "chore(release): prépare la vX.Y.Z"
git tag vX.Y.Z
git push origin main --follow-tags
cd vscode-extension && npm run package    # si la version d'extension a bougé
gh release create vX.Y.Z --notes-file …   # notes issues du CHANGELOG
```

Détail complet dans la skill `release`.
