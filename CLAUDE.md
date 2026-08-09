# AI-MAP

Cartographie l'écosystème IA d'un projet (Claude Code, OpenSpec, Cursor,
Copilot, Roo, Windsurf, MCP) en une **page HTML autoportante**, plus une
extension VS Code.

> AI-MAP se cartographie lui-même : `npm run map` sur ce dépôt lit le `.claude/`
> que vous êtes en train de lire. C'est le meilleur test de non-régression des
> adaptateurs — si une modification casse la lecture d'un `.claude/`, elle se
> voit immédiatement sur le projet lui-même.

---

## Règles absolues

### ✅ Toujours

- **`bin/ai-map.mjs` est GÉNÉRÉ.** Ne jamais l'éditer. Modifier `src/`, puis
  `node build.mjs`. Le bundle est aussi recopié dans `vscode-extension/media/`.
- **Zéro dépendance d'exécution.** `dependencies` doit rester `{}`. Seul
  `playwright-core` est admis, en `devDependencies`, pour la vérification
  visuelle. Aucun `import` hors `node:*` dans `src/`.
- **Vérifier VISUELLEMENT toute modification du rapport** : `npm run shots`,
  puis regarder les images. Voir la skill `verify-visual` — trois bugs de
  rendu ont échappé aux tests parce que personne ne regardait.
- **Un test par correctif.** `test/smoke.mjs` (modèle, graphe, rapport) et
  `test/view.mjs` (vues de l'extension). Lancer : `npm test`.
- **Git** : brancher avant de committer si on est sur `main`. Messages en
  **Conventional Commits** — ils déterminent la version et alimentent le
  changelog. Terminés par `Co-Authored-By: Claude ...`.
- **Une release par change livré.** Tout change publié donne lieu à une
  release : version SemVer, entrée `CHANGELOG.md`, nouvelle version de
  l'extension VS Code si elle a été touchée, et relecture de la description
  Marketplace si ce que voit l'utilisateur a changé. Lancer
  `npm run release:prepare`, puis suivre la skill `release`.

### ❌ Ne jamais

- **Inventer une donnée.** Un lien n'existe que si le fichier cité existe
  réellement sur disque ; un point de score n'est affiché que s'il est dérivé
  des composantes. Voir `.claude/rules/honest-data.md`.
- **Lire le code source du projet analysé.** AI-MAP lit les fichiers de
  *configuration IA* et vérifie l'*existence* des chemins cités. Rien d'autre.
- **Écrire dans le projet analysé**, hors du rapport demandé. Seule exception
  assumée : le bouton « Créer un CLAUDE.md » de l'état vide de l'extension,
  qui demande confirmation et n'écrase jamais un fichier existant.
- **Déclarer le même identifiant racine dans deux modules de `src/`** — le
  bundle est une portée plate. Voir `.claude/rules/bundle.md`.
- **Committer, tagguer, pousser ou publier une release sans accord humain
  explicite.** La préparation est automatique ; la publication ne l'est jamais.
  Présenter la proposition, s'arrêter, attendre. Voir
  `.claude/rules/versioning.md`.
- **Faire passer du texte français par un `-e` de shell.** Les apostrophes s'y
  cassent systématiquement. Voir `.claude/rules/text-pitfalls.md`.

---

## Architecture

Architecture **plug-in** : le cœur ignore tout des écosystèmes.

```
src/
├── ai-map.mjs              CLI : arguments, orchestration
├── core/
│   ├── fs.mjs              accès disque
│   ├── parser.mjs          frontmatter, Markdown, checklists, YAML minimal
│   ├── model.mjs           MODÈLE UNIVERSEL : entités, types, sources, statuts
│   ├── mcp.mjs             extraction MCP partagée par 5 adaptateurs
│   ├── registry.mjs        registre des plugins (detect + scan)
│   ├── graph.mjs           graphe transverse, liens `cross`, liens code
│   ├── explorer.mjs        arborescences des dossiers détectés
│   ├── workspace.mjs       PORTEFEUILLE : découverte multi-projets, divergences
│   └── reporting/
│       ├── render.mjs      templating HTML + inline des assets
│       └── assets/{styles.css, app.js}
└── plugins/{claude,openspec,cursor,copilot,roo,windsurf,mcp}/index.mjs
```

Le flux est toujours le même :

```
registry.runPlugins()  →  Entity[]        (chaque adaptateur ne produit que ça)
core/graph.buildGraph() →  nœuds + arêtes
core/model.buildModel() →  modèle sérialisé dans la page
core/reporting          →  HTML autoportant
```

**Ajouter un écosystème** = un fichier dans `src/plugins/` + une ligne dans
`registry.mjs` + une ligne dans `build.mjs`. Suivre la skill `add-adapter`.

### Deux produits, un seul rendu

`core/workspace.mjs` réutilise le pipeline mono-projet sur chaque projet trouvé,
puis produit un modèle d'un **autre genre** : `{ workspace:true, projects[],
models{}, divergences }`. Il n'a **pas** de `entities`, `graph` ni `sources`.

Conséquences à respecter dans tout code qui lit un modèle :

- `app.js` distingue `DATA` (charge utile) de `M` (**modèle courant** : le
  workspace, ou le projet ouvert). Écrire `DATA.entities` dans le rendu d'un
  projet est un bug — c'est `M`.
- Tout accès à `M.graph.x` doit tolérer l'absence de graphe (`(M.graph||{}).x`).
- `sidebar.js` bascule sur `workspaceHtml()` quand `model.workspace` : le garde-
  fou `totals.entities` ne suffit pas, un workspace en a beaucoup.
- Le niveau portefeuille ne montre **que ce qui n'a de sens qu'à ce niveau** :
  rang des projets, artefacts partagés, divergences. Pas de cumul d'entités.

---

## Commandes

| Script | Effet |
|---|---|
| `npm run build` | régénère `bin/ai-map.mjs` et le copie dans l'extension |
| `npm test` | modèle, graphe, rapport, vues VS Code, portefeuille |
| `npm run shots` | **capture le rapport onglet par onglet** (vérif visuelle) |
| `npm run shots:dark` | idem en thème sombre |
| `npm run shots:ws` | capture la vue portefeuille (chaque famille de divergence) |
| `npm run check` | build + tests + captures, dans l'ordre |
| `npm run map` | cartographie CE dépôt (auto-application) |
| `npm run demo` | ouvre le rapport de `examples/demo-project` |
| `npm run icon` | régénère l'icône PNG de l'extension |
| `npm run release:prepare` | **propose** une release — ne modifie rien |
| `npm run release:apply` | écrit CHANGELOG + versions — toujours sans commit |

Extension VS Code : `cd vscode-extension && npm run package`.
Tester sans installer : ouvrir `ai-map/` dans VS Code puis **F5**.
⚠ Une version déjà **installée** masque celle lancée par F5 —
`code --uninstall-extension gobinadaniel.ai-map-vscode` d'abord.

---

## Projets d'exemple

| Exemple | Sert à |
|---|---|
| `examples/demo-project` | Claude + OpenSpec : la chaîne d'impact complète |
| `examples/multi-tool` | 6 écosystèmes : doublons MCP, formats hérités |
| `examples/claude-only` | un seul écosystème : le cas le plus courant |

Les trois sont utilisés par les tests. **Modifier un exemple change les
compteurs attendus** dans `test/smoke.mjs` — mettre les deux à jour ensemble.

---

## Modèle universel

17 types d'entité (`skill`, `command`, `agent`, `rule`, `prompt`, `spec`,
`requirement`, `change`, `task`, `workflow`, `knowledge`, `memory`, `config`,
`mcp`, `tool`, `document`, `code`) et 6 types de relation (`contains`, `delta`,
`ref`, `tool`, `mention`, `code`).

`tool` et `code` sont des nœuds **dérivés** : ils apparaissent dans le graphe
mais ne comptent pas comme entités, pour ne pas gonfler les chiffres ni noyer
les fiches.

Une arête porte `cross: true` quand ses deux extrémités viennent d'écosystèmes
différents — c'est l'indicateur clé du produit. Les nœuds dérivés en sont
exclus : `Bash` n'est pas un écosystème.

---

## Docs de référence

- `README.md` — usage, écosystèmes supportés, feuille de route.
- `.claude/rules/` — contraintes non négociables (bundle, données, texte).
- `.claude/skills/` — procédures : ajouter un adaptateur, vérifier
  visuellement, publier.
- `CHANGELOG.md` — historique des versions ([Keep a Changelog](https://keepachangelog.com/)).
