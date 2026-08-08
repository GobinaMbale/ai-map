# Claude-only Project

Exemple **volontairement mono-écosystème** : ce projet n'a que `.claude/`.
Pas d'OpenSpec, pas de Cursor, pas de Copilot. Les specs vivent dans Jira, le
dépôt est hébergé sur GitLab — deux outils qu'AI-MAP ne lit pas.

Objectif : montrer ce qu'AI-MAP apporte **sans** aucun lien transverse.

## Conventions

- Le déploiement passe par la skill `deploy-api`.
- La commande `/release` est le seul point d'entrée de publication.
- L'agent `security-reviewer` relit les modifications sensibles.
- Les tickets sont créés via le serveur MCP `issue-tracker`.