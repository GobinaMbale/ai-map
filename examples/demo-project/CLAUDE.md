# Demo Project

Projet de démonstration pour AI-MAP. Il embarque volontairement **deux
écosystèmes IA** (Claude Code et OpenSpec) plus une déclaration MCP, afin de
montrer les liens transverses qu'AI-MAP reconstruit.

> Ce n'est qu'un exemple : AI-MAP fonctionne tout aussi bien sur un projet qui
> n'a **que** `.claude/`, ou **que** `openspec/`. Chaque adaptateur se déclenche
> uniquement si son écosystème est présent. Voir `examples/claude-only/`.

## Conventions

- Toute évolution passe par un change OpenSpec avant d'être implémentée.
- Le déploiement est piloté par la skill `deploy-api`, jamais à la main.
- La commande `/release` est le seul point d'entrée de publication.
- L'agent `security-reviewer` relit toute modification touchant `user-auth`.

## Outillage

Le serveur MCP `issue-tracker` sert à ouvrir les tickets de suivi ; il est
volontairement générique — l'hébergeur Git (GitHub, GitLab, Forgejo…) n'est pas
une hypothèse d'AI-MAP.
