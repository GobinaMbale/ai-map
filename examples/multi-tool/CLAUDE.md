# Multi-tool Project

Projet d'exemple où **sept écosystèmes IA coexistent** : Claude Code, Cursor,
GitHub Copilot, Roo Code, Windsurf, MCP universel — et le code source.

C'est le cas que AI-MAP existe pour rendre lisible : chaque outil ne voit que
son propre dossier, personne ne voit l'ensemble.

## Conventions

- Le déploiement passe par la skill `deploy-api`.
- L'implémentation des sessions vit dans `src/auth/session.ts`.
- Le serveur MCP `issue-tracker` sert à ouvrir les tickets.
