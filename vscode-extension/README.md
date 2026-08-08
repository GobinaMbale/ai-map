# AI-MAP — extension VS Code

Cartographie l'écosystème IA du workspace : **Claude Code**, **OpenSpec**, **MCP**.

## Ce que fait l'extension

- **Vue latérale « AI-MAP »** — arbre *Écosystèmes → Types → Entités*. Un clic
  ouvre le fichier réel.
- **Commande « AI-MAP : Générer la carte »** — rapport HTML complet dans un
  onglet : tableau de bord, timeline, graphe transverse (Réseau / MCD), fiches
  détaillées, liens vers le code source.

## Utilisation

1. Ouvrir un dossier contenant `.claude/`, `CLAUDE.md` ou `openspec/`.
2. Icône **AI-MAP** dans la barre d'activité, ou palette (`Ctrl/Cmd+Shift+P`) →
   **AI-MAP : Générer la carte**.

## Ce que l'extension ne fait pas

- **Aucun appel réseau, aucune télémétrie.** Tout est calculé localement.
- **Elle ne lit jamais le code.** Les liens vers le code source proviennent des
  chemins *cités* dans les fichiers de config IA, dont l'existence est vérifiée
  sur disque.
- **Aucune dépendance.** Le moteur embarqué est exécuté avec l'exécutable de
  VS Code en mode Node : Node n'a pas besoin d'être installé.

## Compatibilité

`engines.vscode ^1.75.0` — fonctionne aussi dans les éditeurs qui embarquent
l'API VS Code (Cursor, Windsurf, Trae, Kiro, Qoder).

## Licence

MIT — voir [LICENSE](LICENSE).
