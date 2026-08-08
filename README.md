# AI-MAP

**Visualiser, comprendre, gouverner et piloter l'écosystème IA d'un projet** —
en une page HTML autoportante.

> Mono-fichier · **zéro dépendance** · **zéro appel réseau** · **zéro télémétrie** ·
> **ordre de sortie stable** · fonctionne hors ligne.

<sub>« Ordre stable » et non « sortie identique au bit près » : le rapport
embarque sa date de génération et les dates de modification des fichiers, qui
changent par nature. À contenu égal, l'ordre des entités et des relations, lui,
ne bouge pas.</sub>

Les configurations IA d'un projet sont éparpillées : `.claude/`, `openspec/`,
`.cursor/`, `.github/`, `mcp.json`… Chaque outil ne voit que son propre dossier.
AI-MAP les convertit dans un **modèle universel** unique, puis en dérive un
**graphe transverse** — les liens que personne ne voit parce qu'ils traversent
les frontières d'outils.

---

## Ce que produit l'outil

Le rapport est découpé en **six onglets** plutôt qu'en un seul défilement — un
projet réel dépasse vite la centaine d'entités, et tout empiler rendait la page
illisible.

| Onglet | Contenu |
|---|---|
| ▦ **Vue d'ensemble** | bandeau d'indicateurs · tuiles par type de composant · écosystèmes détectés · répartition |
| 🎯 **Impact** | le **fil d'impact** : `Exigence › Skill › Outil MCP › Code source`, avec un **sélecteur d'origine** — on choisit ce qu'on veut suivre au lieu de tout déverser · avancement des changes |
| ⚖️ **Gouvernance** | détail du score · **« Ce qui ferait monter le score »** (actions chiffrées en points) · alertes actives |
| 🕸️ **Graphe** | contrôles en **barre latérale** (mode, types servant de légende *et* de filtre, relations, lisibilité) · vues **Réseau** et **MCD** · zoom, plein écran réel, clic → fiche |
| 🕰️ **Timeline** | activité des 12 derniers mois + ce qui a bougé récemment. Repère la config qui dort pendant que le code avance |
| 📇 **Entités** | recherche plein-texte + double filtre **type** × **écosystème**, groupes repliables, fiches avec relations navigables |
| 🌳 **Fichiers** | un arbre repliable par dossier IA détecté |

Thème clair/sombre.

### Score de maturité IA

Moyenne de quatre composantes, **toutes affichées avec leur définition** — un
score dont on ne peut pas vérifier le calcul ne permet d'arbitrer aucune
décision :

| Composante | Mesure |
|---|---|
| Connexion | part des entités reliées à au moins une autre |
| Traçabilité | part des skills / commandes / agents qui pointent vers du code réel |
| Fraîcheur | part des entités modifiées depuis moins de 90 jours |
| Hygiène | part des entités sans alerte de gouvernance |

Le score seul n'est qu'un constat. L'onglet **Gouvernance** le transforme en
levier : chaque action est chiffrée en points réellement gagnés.

```
+23 pts Traçabilité  — Relier 14 skills/commandes/agents à des fichiers de code réels
+ 1 pt  Hygiène      — Archiver 2 changes terminés
```

Les gains sont **dérivés des composantes**, pas estimés : une composante pèse
`1/N` du score, donc corriger `n` entités sur `u` rapporte `(n/u)/N × 100`
points. Conséquence vérifiée par les tests — appliquer **toutes** les
recommandations ne peut jamais dépasser 100. Sur le projet ci-dessus :
`23 + 1 = 24 = 100 − 76`. Cliquer une recommandation liste les entités visées.

### Fil d'impact

Chaque ligne se lit *ce qui prescrit → ce qui agit → ce que ça atteint*. Les
origines sont hiérarchisées (une **exigence** explique mieux qu'un `CLAUDE.md`)
et les cibles aussi : dès qu'un serveur MCP ou un fichier de code est atteint,
les outils génériques (`Bash`, `Read`…) sont écartés — ils diluent le fil sans
rien apprendre.

---

## Modèle universel

Peu importe l'outil d'origine, tout devient l'une de ces entités :

```
Skill · Commande · Agent · Règle · Prompt · Spécification · Exigence
Change · Tâche · Workflow · Connaissance · Mémoire · Configuration
Serveur MCP · Outil · Document · Code source
```

C'est ce qui rend le graphe transverse possible : une exigence OpenSpec et une
skill Claude deviennent comparables et reliables.

---

## Écosystèmes supportés

| Écosystème | Lu | État |
|---|---|---|
| **Claude Code** | `.claude/` (skills, commands, agents, rules, settings, hooks), `CLAUDE.md`, `.mcp.json` | ✅ V1 |
| **OpenSpec** | `openspec/` (project, specs + exigences, changes, tasks, design, deltas, archive) | ✅ V1 |
| **Cursor** | `.cursor/rules/*.mdc`, `.cursorrules`, `.cursor/commands/`, `.cursor/mcp.json` | ✅ V2 |
| **GitHub Copilot** | `.github/copilot-instructions.md`, `instructions/`, `prompts/`, `chatmodes/` | ✅ V2 |
| **Roo Code** | `.roo/rules*/`, `.roorules`, `.roomodes` (YAML), `.roo/mcp.json` | ✅ V2 |
| **Windsurf** | `.windsurf/rules/`, `.windsurfrules`, `workflows/`, `mcp_config.json` | ✅ V2 |
| **MCP universel** | `mcp.json`, `mcp.yaml`, `mcp.config.json`, `.vscode/mcp.json` | ✅ V2 |
| Git | historique local | ⏳ à venir |

Chaque fichier MCP propre à un éditeur reste géré par **son** adaptateur. C'est
volontaire : si le même serveur est déclaré dans `.cursor/mcp.json` **et** dans
`mcp.yaml`, AI-MAP montre les deux et les signale mutuellement (« aussi déclaré :
Cursor ») au lieu de les fondre silencieusement — deux copies finissent toujours
par diverger.

Les fichiers de règles au **format hérité** (`.cursorrules`, `.roorules`,
`.windsurfrules`) sont lus, et marqués « doublon » quand le format moderne
coexiste dans le même projet.

**Un adaptateur ne se déclenche que si son écosystème est présent.** Un projet
qui n'a que `.claude/` produit une carte parfaitement exploitable — les
écosystèmes absents sont affichés en grisé, pour distinguer « pas utilisé » de
« pas encore couvert par AI-MAP ».

### Décision : adaptateurs légers, jamais des remplaçants

Le marché comporte déjà des extensions matures **intra-écosystème** (dashboards
OpenSpec, UI Cursor…). AI-MAP ne les réplique pas. Chaque adaptateur reste un
**parser vers le modèle universel** ; la valeur d'AI-MAP est le **lien entre**
les systèmes, pas l'édition à l'intérieur de l'un d'eux.

---

## Installation et usage

**Prérequis : Node.js ≥ 16**, rien d'autre.

```bash
# Depuis la source
node src/ai-map.mjs .            # carte du projet courant
node src/ai-map.mjs . --open     # + ouverture navigateur

# Fichier autonome (après npm run build)
node bin/ai-map.mjs /chemin/projet --open
```

| Argument | Effet |
|---|---|
| `[chemin]` | racine du projet à analyser (défaut : `.`). Un dossier d'écosystème (`.claude/`, `openspec/`) est accepté : AI-MAP remonte au projet |
| `-o fichier.html` | fichier de sortie (défaut `<projet>/ai-map.report.html`) |
| `--open` | ouvrir le rapport dans le navigateur |
| `--json` | écrire aussi le modèle brut en JSON (CI, outils tiers) |

---

## Exemples fournis

```bash
node src/ai-map.mjs examples/demo-project --open   # Claude + OpenSpec + MCP
node src/ai-map.mjs examples/multi-tool   --open   # 6 écosystèmes côte à côte
node src/ai-map.mjs examples/claude-only  --open   # un seul écosystème
```

| Exemple | Écosystèmes | Résultat |
|---|---|---|
| `demo-project` | Claude + OpenSpec | 24 entités · 44 relations · **11 transverses** · 4 liens code |
| `multi-tool` | Claude, Cursor, Copilot, Roo, Windsurf, MCP | 16 entités · 27 relations · 6 transverses · 10 liens code |
| `claude-only` | Claude seul | 8 entités · 17 relations · 0 transverse · 2 liens code |

`claude-only` existe pour rendre visible le cas le plus courant : une équipe qui
n'utilise **qu'un** outil IA, avec ses specs dans Jira et son dépôt sur GitLab.
La carte y reste utile (quelle skill appelle quel serveur MCP, quelles
permissions ouvrent quoi, quel code chaque skill touche, ce que `CLAUDE.md`
référence vraiment) — seuls les liens *transverses* disparaissent, faute de
second écosystème.

## Lien vers le code source

La chaîne différenciante de la vision se termine par le code :

```
Exigence OpenSpec → Skill Claude → Outil MCP → src/auth/session.ts
```

AI-MAP **ne lit jamais le code**. Il relève les chemins cités dans les fichiers
de config IA — liens Markdown et code inline (`` `src/auth/session.ts` ``) —
puis vérifie sur disque lesquels existent. Un chemin qui n'existe pas ne produit
aucun lien : l'outil n'invente rien.

Garde-fous : jamais hors de la racine du projet (une référence `../../secret`
est refusée même si le fichier existe) · seules les extensions de code (sinon un
`README.md` cité serait étiqueté « code ») · pas de doublon si le chemin est déjà
une entité IA · plafond par entité.

Les nœuds de code sont **dérivés** : ils apparaissent dans le graphe mais ni dans
les fiches ni dans le compteur d'entités. Conséquence utile — ça fonctionne sur
un projet écrit à 100 % par des humains, et sur **un seul** écosystème IA.

---

## Architecture

Architecture **plug-in** : le cœur ignore tout des écosystèmes ; ajouter un
outil = ajouter un plugin et une ligne dans le registre.

```
ai-map/
├── src/
│   ├── ai-map.mjs                 # CLI : arguments, orchestration
│   ├── core/
│   │   ├── fs.mjs                 # accès disque
│   │   ├── parser.mjs             # frontmatter, Markdown, checklists, YAML minimal
│   │   ├── model.mjs              # MODÈLE UNIVERSEL : entités, types, sources
│   │   ├── mcp.mjs                # extraction MCP partagée par 5 adaptateurs
│   │   ├── registry.mjs           # registre des plugins (detect + scan)
│   │   ├── graph.mjs              # graphe transverse + liens `cross` + code
│   │   ├── explorer.mjs           # arborescences des dossiers détectés
│   │   └── reporting/
│   │       ├── render.mjs         # templating HTML + inline des assets
│   │       └── assets/{styles.css, app.js}
│   └── plugins/
│       ├── claude/index.mjs       ├── roo/index.mjs
│       ├── openspec/index.mjs     ├── windsurf/index.mjs
│       ├── cursor/index.mjs       └── mcp/index.mjs
│       └── copilot/index.mjs
├── vscode-extension/              # extension VS Code (vue latérale + webview)
├── scripts/make-icon.mjs          # génère l'icône PNG sans dépendance
├── examples/                      # 3 projets de démonstration
├── test/{smoke,tree}.mjs          # vérification bout-en-bout (npm test)
├── build.mjs                      # bundler zéro-dépendance → bin/ai-map.mjs
└── bin/ai-map.mjs                 # FICHIER AUTONOME distribué (généré)
```

## Extension VS Code

```bash
node build.mjs                      # embarque le moteur dans l'extension
node scripts/make-icon.mjs          # (re)génère l'icône
cd vscode-extension && npm run package
```

**Tester sans installer** : ouvrir `ai-map/` **ou** `ai-map/vscode-extension/`
dans VS Code, puis **F5**. Une configuration de lancement est fournie pour les
deux emplacements ; elle ouvre directement la fenêtre de développement sur un
projet d'exemple, sinon l'extension n'aurait aucun dossier à analyser.
Relancer `node build.mjs` après toute modification de `src/`.

> Si une version a déjà été **installée**, elle masque celle lancée par F5.
> Désinstaller d'abord : `code --uninstall-extension gobinadaniel.ai-map-vscode`.

### Vue latérale

C'est une **WebviewView**, pas une TreeView : une TreeView n'affiche qu'une ligne
de texte par nœud, impossible d'y mettre des fiches avec description, étiquettes,
avancement et date.

- **Onglets** *Entités* · *Alertes* · *Changes* — les deux derniers n'apparaissent
  que s'ils ont quelque chose à montrer.
- **Fiches** groupées par écosystème, ou **par statut** pour les changes
  (`Proposé` / `Planifié` / `En cours` / `Terminé` / `Archivé`).
- **Barre de gauche colorée** : le statut s'il existe, sinon l'urgence, sinon le
  type. Les entités en alerte reçoivent en plus un fond teinté.
- Recherche instantanée, groupes repliables, états vides explicites.

### Fiche détaillée

Un **onglet de l'éditeur**, pas une popup — une modale masque le reste, se ferme
au moindre clic à côté et interdit de comparer deux entités. Trois sous-onglets :
*Contenu* (Markdown rendu, cases à cocher comprises), *Relations* (navigables),
*Métadonnées*. Le rapport HTML suit la même règle : la fiche s'y ouvre en page
avec un bouton retour.

- **Vue latérale** — arbre *Écosystèmes → Types → Entités*, clic = ouvre le fichier.
- **Commande « AI-MAP : Générer la carte »** — rapport complet dans un onglet.
- Aucune dépendance : le moteur embarqué tourne via l'exécutable de VS Code en
  mode Node, donc **Node n'a pas besoin d'être sur le PATH**.

L'icône est un PNG **généré par le dépôt** (`node:zlib`, encodage PNG à la main,
suréchantillonnage ×4 pour l'anticrénelage) — aucun binaire opaque commité sans
sa source.

`npm test` analyse les deux projets d'exemple, contrôle le modèle et le graphe,
puis **exécute réellement le JS du rapport dans un DOM minimal** — un rapport
dont le script planterait au premier rendu ne passerait pas inaperçu.

### Contrat d'un plugin

```js
export const monPlugin = {
  id: 'mon-ecosysteme',              // doit exister dans model.SOURCES
  detect: (ctx) => ['chemin/trouvé'], // [] si absent → plugin ignoré
  scan:   (ctx) => [ /* Entity[] */ ],
};
```

Un adaptateur ne produit que des entités : il ignore le rendu, le graphe et la
gouvernance. Une erreur dans un adaptateur est isolée — les autres écosystèmes
continuent d'être cartographiés, et l'incident est signalé en fin de run.

```bash
npm run dev      # exécuter la source multi-fichiers
npm run build    # régénérer bin/ai-map.mjs depuis src/
```

> `bin/ai-map.mjs` est **généré** : modifier `src/`, puis `npm run build`.
> Le bundle est une portée plate ; `build.mjs` refuse de produire un fichier
> si deux modules déclarent le même identifiant racine.

---

## Feuille de route

| Version | Contenu |
|---|---|
| **V1** | ✅ socle plug-in · adaptateur Claude · adaptateur OpenSpec · dashboard · graphe transverse · lien vers le code source · rapport HTML |
| **V1.1** | ✅ Timeline · extension VS Code (vue latérale + icône + métadonnées marketplace) |
| **V2** | ✅ Cursor · Copilot · Roo · Windsurf · MCP universel · parseur YAML minimal |
| V3 | Actions OpenSpec · analyse d'impact · comparaison de changes |
| V4 | Gouvernance · AI Maturity Score · audit IA |

Quelques signaux de gouvernance sont déjà produits par les adaptateurs, sans
attendre la V4 : change OpenSpec terminé mais non archivé, fichier de règles au
format hérité coexistant avec le format moderne, serveur MCP déclaré dans deux
écosystèmes, configuration illisible.

---

## Licence

MIT — voir [LICENSE](LICENSE).