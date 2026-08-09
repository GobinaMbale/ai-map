# AI-MAP

Cartographie l'**écosystème IA** de votre projet — Claude Code, OpenSpec,
Cursor, GitHub Copilot, Roo Code, Windsurf, MCP — et révèle les liens que
personne ne voit parce qu'ils traversent les frontières d'outils.

> *Maps the AI configuration of your project across Claude Code, OpenSpec,
> Cursor, Copilot, Roo, Windsurf and MCP into a single navigable view.
> Runs entirely offline — no network calls, no telemetry. French UI.*

---

![Vue d'ensemble : score de maturité IA, alertes de gouvernance, composants détectés](https://raw.githubusercontent.com/GobinaMbale/ai-map/main/docs/screenshots/01-vue-ensemble.png)

## Le problème

Vos configurations IA sont éparpillées : `.claude/`, `openspec/`, `.cursor/`,
`.github/`, `.roo/`, `.windsurf/`, `mcp.json`. Chaque outil ne voit que son
propre dossier. Personne ne voit l'ensemble.

Résultat : une skill que plus rien n'appelle, un serveur MCP déclaré deux fois
dans deux fichiers qui divergent, un change terminé depuis des mois mais jamais
archivé, une règle au format hérité qui coexiste avec sa remplaçante.

## Ce que fait l'extension

### Vue latérale

Des **fiches**, pas une arborescence : nom, description, étiquettes, avancement
et date de dernière modification.

- **Onglets** *Entités* · *Alertes* · *Changes* — les deux derniers n'apparaissent
  que s'ils ont quelque chose à montrer.
- Fiches groupées par écosystème, ou **par statut** pour les changes
  (Proposé · Planifié · En cours · Terminé · Archivé).
- **Barre colorée à gauche** : le statut s'il existe, sinon l'urgence, sinon le
  type. Ce qui pose problème se repère sans lire.
- Recherche instantanée, groupes repliables.

<img src="https://raw.githubusercontent.com/GobinaMbale/ai-map/main/docs/screenshots/05-vue-laterale.png" alt="Vue latérale : onglets Entités, Alertes et Changes, avec fiches, badges et dates" width="360">


### Fiche détaillée

Un **onglet de l'éditeur**, pas une popup. Trois volets : *Contenu* (Markdown
rendu, blocs de code et cases à cocher compris), *Relations* (navigables) et
*Métadonnées*.

### Rapport complet

Une page HTML **autoportante** — elle s'ouvre hors ligne, se partage par mail,
se publie sur un intranet sans rien installer.

| Onglet | Contenu |
|---|---|
| **Vue d'ensemble** | score de maturité IA, alertes, composants détectés, écosystèmes |
| **Impact** | le fil `Exigence › Skill › Outil MCP › Code source`, avec sélecteur d'origine |
| **Gouvernance** | détail du score et **« ce qui ferait monter le score »**, chiffré en points |
| **Graphe** | relations réelles, vues Réseau et MCD (Merise), plein écran |
| **Timeline** | activité des 12 derniers mois — repère la config qui dort |
| **Entités** | recherche + double filtre type × écosystème |
| **Fichiers** | arborescence des dossiers IA détectés |

Le **fil d'impact** — ce qui prescrit, ce qui agit, ce que ça atteint :

![Fil d'impact : Exigence, Skill, Outil MCP, Code source, reliés par chevrons](https://raw.githubusercontent.com/GobinaMbale/ai-map/main/docs/screenshots/02-impact.png)

La **gouvernance**, où le score devient un levier plutôt qu'un constat :

![Gouvernance : détail du score, recommandations chiffrées en points, alertes actives](https://raw.githubusercontent.com/GobinaMbale/ai-map/main/docs/screenshots/03-gouvernance.png)

Le **graphe transverse**, avec ses filtres par type et par relation :

![Graphe transverse : contrôles en barre latérale, nœuds dimensionnés par degré](https://raw.githubusercontent.com/GobinaMbale/ai-map/main/docs/screenshots/04-graphe.png)

## Commandes

| Commande | Effet |
|---|---|
| **AI-MAP : Générer la carte** | rapport complet dans un onglet |
| **AI-MAP : Ouvrir la carte dans le navigateur** | plein écran, impression, partage |
| **AI-MAP : Enregistrer le rapport HTML…** | choisir où déposer le fichier |
| **AI-MAP : Rafraîchir** | ré-analyser le workspace |

## Utilisation

1. Ouvrir un dossier contenant l'un de ces emplacements :
   `.claude/` · `CLAUDE.md` · `.mcp.json` · `openspec/` · `.cursor/` ·
   `.github/` · `.roo/` · `.windsurf/` · `mcp.json`
2. Cliquer l'icône **AI-MAP** dans la barre d'activité.

L'extension se réveille seule sur un projet concerné et se ré-analyse quand une
configuration IA change. Si rien n'est détecté, elle le dit — et propose de
créer un `CLAUDE.md` de départ.

## Écosystèmes lus

| Écosystème | Fichiers |
|---|---|
| **Claude Code** | `.claude/` (skills, commands, agents, rules, settings, hooks), `CLAUDE.md`, `.mcp.json` |
| **OpenSpec** | `openspec/` — specs, exigences, changes, tâches, deltas, archive |
| **Cursor** | `.cursor/rules/*.mdc`, `.cursorrules`, `.cursor/commands/`, `.cursor/mcp.json` |
| **GitHub Copilot** | `copilot-instructions.md`, `instructions/`, `prompts/`, `chatmodes/` |
| **Roo Code** | `.roo/rules*/`, `.roorules`, `.roomodes`, `.roo/mcp.json` |
| **Windsurf** | `.windsurf/rules/`, `.windsurfrules`, `workflows/`, `mcp_config.json` |
| **MCP universel** | `mcp.json`, `mcp.yaml`, `mcp.config.json`, `.vscode/mcp.json` |

**Un adaptateur ne se déclenche que si son écosystème est présent.** Un projet
qui n'a que `.claude/` produit une carte parfaitement exploitable.

## Ce que l'extension ne fait pas

- **Aucun appel réseau, aucune télémétrie.** Tout est calculé localement.
- **Elle ne lit jamais votre code.** Les liens vers le code source proviennent
  des chemins *cités* dans vos fichiers de configuration IA ; seule leur
  existence est vérifiée sur disque. Un chemin inexistant ne produit aucun lien.
- **Elle n'écrit rien dans votre projet**, hors du rapport que vous demandez.
- **Aucune dépendance.** Le moteur est embarqué et exécuté par VS Code lui-même :
  Node.js n'a pas besoin d'être installé.

## Confiance

Cette extension lit les fichiers de configuration de vos projets. Vous avez
raison de vous demander ce qu'elle en fait — voici de quoi vérifier plutôt que
de me croire.

### « Éditeur non vérifié » — ce message est normal

À la première installation, VS Code affiche :

> *Faites-vous confiance à l'éditeur… ? Il s'agit de la première extension que
> vous installez à partir de cet éditeur.*

Ce message apparaît pour **tout éditeur dont vous n'avez encore rien installé**,
y compris des extensions à des millions d'installations. VS Code ne contrôlant
pas les extensions tierces, il vous demande une décision consciente. Ce n'est
pas un signalement sur ce paquet.

### Ce que vous pouvez vérifier vous-même

Le moteur entier tient en **un seul fichier** (`media/ai-map.mjs`). Il
n'importe que trois modules Node :

```js
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
```

Aucun `http`, aucun `net`, aucun `fetch` — vous pouvez le vérifier d'un `grep`.
Un module qui ne peut pas ouvrir de socket ne peut rien envoyer.

| Affirmation | Comment la contrôler |
|---|---|
| Aucune dépendance | `package.json` → `"dependencies": {}` |
| Aucun appel réseau | les trois imports ci-dessus sont les seuls du moteur |
| Aucune télémétrie | conséquence directe : pas de réseau, pas d'envoi |
| Ne lit pas votre code | les liens viennent des chemins **cités** dans vos configs ; seule leur existence est testée |
| N'écrit que sur demande | **deux** écritures dans tout le code, déclenchées par vous |

Ces deux écritures sont : *Enregistrer le rapport HTML…* (vous choisissez où) et
le bouton **« Créer un CLAUDE.md »** de l'état vide, qui demande confirmation et
n'écrase jamais un fichier existant.

Le code est sous licence MIT, intégralement public :
**[github.com/GobinaMbale/ai-map](https://github.com/GobinaMbale/ai-map)**

Le fichier `media/ai-map.mjs` embarqué dans ce paquet est généré depuis `src/`
par `node build.mjs` — vous pouvez le régénérer et comparer.

## Compatibilité

`engines.vscode ^1.75.0`. Fonctionne aussi dans les éditeurs qui embarquent
l'API VS Code : **Cursor**, **Windsurf**, Trae, Kiro, Qoder.

## Aussi disponible en ligne de commande

```bash
npx github:GobinaMbale/ai-map . --open
```

## Liens

- [Dépôt et documentation](https://github.com/GobinaMbale/ai-map)
- [Journal des versions](https://github.com/GobinaMbale/ai-map/blob/main/CHANGELOG.md)
- [Signaler un problème](https://github.com/GobinaMbale/ai-map/issues)

## Licence

MIT — voir [LICENSE](LICENSE).
