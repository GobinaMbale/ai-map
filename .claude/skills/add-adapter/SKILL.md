---
name: add-adapter
description: Ajouter un adaptateur d'écosystème IA à AI-MAP (Zed, Aider, Continue, Kilo Code…) — contrat du plugin, points de câblage, projet d'exemple et tests. À utiliser dès qu'il faut faire lire un nouveau format de configuration IA.
---

# Ajouter un adaptateur

Un adaptateur **convertit** un écosystème en entités du modèle universel. Il ne
sait rien du rendu, du graphe ni de la gouvernance : il produit des `Entity`,
c'est tout.

## Contrat

```js
export const monPlugin = {
  id: 'mon-outil',                    // doit exister dans model.SOURCES
  detect: (ctx) => ['chemin/trouvé'], // [] si absent → plugin ignoré
  scan:   (ctx) => [ /* Entity[] */ ],
};
```

`ctx` vaut `{ root }` — la racine du projet analysé. Rien d'autre.

`detect` doit être **précis** : `.github/` existe dans énormément de dépôts
sans le moindre fichier Copilot, d'où le fait que l'adaptateur copilot ne
s'active que si un artefact Copilot est réellement présent.

## Les six points de câblage

1. **`src/plugins/<id>/index.mjs`** — l'adaptateur. Préfixer toutes les
   fonctions internes (voir `.claude/rules/bundle.md`) et nommer la constante
   `<ID>_SOURCE`, jamais `SOURCE`.
2. **`src/core/model.mjs`** — ajouter l'entrée dans `SOURCES` (id, label, icône,
   couleur, `status`).
3. **`src/core/registry.mjs`** — importer et ajouter à `PLUGINS`.
4. **`src/build.mjs`** → `MODULES` — **avant** `core/registry.mjs`.
5. **`examples/multi-tool/`** — ajouter des fichiers représentatifs.
6. **`test/smoke.mjs`** — assertions sur ce que l'adaptateur doit extraire.

Oublier le point 4 donne un bundle qui plante ; oublier le 2 donne un
écosystème sans nom ni couleur.

**Effet sur le portefeuille.** `core/workspace.mjs` décide qu'un dossier est un
projet en appelant `plugin.detect()` de chaque adaptateur. Un `detect()` trop
large — qui répond vrai sur un dossier quelconque — fait apparaître des projets
fantômes dans la vue portefeuille, bien au-delà du rapport de l'adaptateur.
Vérifier avec `npm run shots:ws`.

Si l'adaptateur produit des entités **censées être copiées d'un projet à
l'autre** (skills, commandes, règles…), leur `kind` doit figurer dans
`WS_COMPARABLE` ; sinon leurs divergences resteront invisibles. À l'inverse,
n'y ajoutez jamais un type propre au projet : ce serait un faux positif
permanent (voir `.claude/rules/honest-data.md`).

## Écrire le scan

Utiliser les helpers existants plutôt que de reparser :

- `core/fs.mjs` — `isDir`, `isFile`, `read`, `listSubdirs`, `listFiles`, `walk`
- `core/parser.mjs` — `parseFrontmatter`, `parseYamlLite`, `firstHeading`,
  `firstParagraph`, `headings`, `sectionsOf`, `parseChecklist`, `findMdLinks`,
  `findWikiLinks`, `findCodePaths`, `buildMeta`, `clip`
- `core/mcp.mjs` — `mcpEntitiesFrom` pour tout fichier déclarant des serveurs MCP

Alimenter systématiquement `links.code: findCodePaths(body)` : c'est ce qui
raccroche l'entité au code réel, donc à la composante Traçabilité du score.

## Choisir le bon type d'entité

Le modèle a 17 types ; ne pas en inventer. Correspondances retenues :

| Ce qu'on lit | Type |
|---|---|
| instructions chargées à chaque session | `memory` |
| convention/contrainte, éventuellement ciblée par des globs | `rule` |
| persona + jeu d'outils (chat mode, custom mode) | `agent` |
| gabarit de prompt réutilisable | `prompt` |
| enchaînement d'étapes invocable | `workflow` |
| hooks d'un fichier de réglages | `workflow` (pas `config`) |
| déclaration de serveur MCP | `mcp` |

## Signaux de gouvernance

Un bon adaptateur ne se contente pas d'extraire, il **signale**. Exemples déjà
en place, à reproduire :

- fichier de règles au **format hérité** (`.cursorrules`, `.roorules`,
  `.windsurfrules`) coexistant avec le format moderne → badge `warn` « doublon »
- configuration **illisible** → badge `danger`, jamais un silence
- serveur MCP déclaré dans **deux écosystèmes** → signalé par `model.mjs`

Un badge de ton `warn` ou `danger` fait automatiquement baisser la composante
Hygiène et remonter l'entité dans les alertes : c'est le seul câblage à faire.

## Vérifier

```bash
npm run build && npm test
node src/ai-map.mjs examples/multi-tool --json -o /tmp/t.html
npm run shots -- examples/multi-tool
```

Contrôler dans le JSON que les entités ont un `path`, une `description` non
vide, et que le graphe les relie à quelque chose. Une entité isolée est
signalée comme telle dans les alertes — c'est souvent le signe que
`links.code` ou `links.files` n'a pas été alimenté.
