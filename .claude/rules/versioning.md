# Commits, versions et releases

## Conventional Commits — obligatoire

Tout commit suit [conventionalcommits.org](https://www.conventionalcommits.org/) :

```
<type>(<portée>)<!>: <description>
```

| Type | Effet sur la version | Publié dans le changelog |
|---|---|---|
| `feat` | **MINOR** | ✅ Added |
| `fix` | **PATCH** | ✅ Fixed |
| `perf` | PATCH | ✅ Changed |
| `refactor`, `style` | — | ✅ Changed |
| `docs` | — | ✅ Documentation |
| `security` | PATCH | ✅ Security |
| `chore`, `test`, `ci`, `build` | — | ❌ omis |
| `!` ou `BREAKING CHANGE:` | **MAJOR** | ⚠ en tête |

`chore` et `test` sont silencieux **volontairement** : ils n'apprennent rien à
qui lit une release. Ne pas les utiliser pour masquer un vrai changement.

Portées utilisées ici : `rapport`, `extension`, `graphe`, `adaptateur`,
`modele`, `release`.

La description est en **français**, à l'impératif ou au constat, sans point
final. Elle finit dans le changelog telle quelle : l'écrire pour un lecteur,
pas pour soi.

Terminer par `Co-Authored-By: Claude ...`.

## Deux versions indépendantes

| Fichier | Ce qu'il versionne | Quand l'incrémenter |
|---|---|---|
| `package.json` | la CLI npm | à chaque release |
| `vscode-extension/package.json` | l'extension VS Code | **uniquement si `vscode-extension/` a changé** |

`scripts/release-prepare.mjs` détecte cette condition tout seul. Le Marketplace
**refuse** de republier une version existante : ne jamais réutiliser un numéro.

## Description Marketplace

Elle doit être relue dès qu'un fichier change **ce que l'utilisateur voit** :

- `vscode-extension/package.json` (commandes, vues) ou son `README.md`
- `src/core/reporting/assets/app.js` (les onglets du rapport — mono-projet
  **et** portefeuille)
- `src/core/model.mjs` (les écosystèmes supportés)
- `src/core/workspace.mjs` (la vue portefeuille, et ce qu'elle compare)
- `src/plugins/` (un adaptateur ajouté ou retiré)

Le script signale ces fichiers et affiche la description actuelle. Vérifier
qu'elle nomme toujours les **bons écosystèmes** et les **bonnes
fonctionnalités** — une description qui promet un adaptateur retiré, ou qui
tait un adaptateur ajouté, est une fiche publique fausse.

## La règle qui prime sur toutes les autres

> **La génération est automatique ; le commit, le tag, le push et la
> publication n'ont lieu qu'après une décision humaine explicite.**

Concrètement, pour un agent : présenter la proposition, **s'arrêter**, et
attendre un « approuve » avant de toucher à Git. Ne jamais enchaîner
préparation et publication dans le même mouvement.

`release-prepare.mjs` respecte cette séparation par construction : même avec
`--apply`, il écrit des fichiers mais ne commite ni ne pousse jamais.
