---
description: Vérifie AI-MAP de bout en bout — build, tests, captures visuelles, et auto-cartographie du dépôt.
allowed-tools: Bash, Read
---

# /check

Chaîne de vérification complète d'AI-MAP. À lancer avant tout commit touchant
`src/` ou `vscode-extension/`.

## Étapes

```bash
npm run build     # bin/ai-map.mjs + copie dans l'extension — SANS ça les tests
                  # passent sur src/ pendant que le bundle publié reste périmé
npm test          # modèle, graphe, rapport, vues, portefeuille
npm run shots     # captures onglet par onglet → .shots/
npm run shots:ws  # vue portefeuille → .shots-ws/  (ce sont d'AUTRES onglets)
npm run map       # AI-MAP se cartographie lui-même
```

Puis **ouvrir les images** de `.shots/` **et** de `.shots-ws/` et les regarder.
Les tests prouvent que le rendu ne plante pas, jamais qu'il est lisible — voir
la skill `verify-visual` pour les points de contrôle par onglet.

Le rapport a deux formes — mono-projet et portefeuille — rendues par le **même**
`app.js`. Ne capturer que la première laisse la moitié du rendu invérifiée.

## Densité

Les exemples (24 entités) ne révèlent pas les problèmes de densité. Capturer
aussi un vrai projet :

```bash
npm run shots -- ../qcm-factory
```

## Ce qui doit être vrai à la fin

- `npm test` : aucun `✖`
- `npm run shots` **et** `npm run shots:ws` : « Aucune erreur JS »
- `npm run map` : le rapport liste bien le `.claude/` de ce dépôt — skills,
  règles, commandes et `CLAUDE.md`. C'est l'auto-application : si un adaptateur
  régresse, ça se voit ici en premier.
- `git status --short` : ni `.shots/`, ni `*.vsix`, ni rapport HTML
