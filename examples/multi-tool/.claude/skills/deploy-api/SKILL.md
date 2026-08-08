---
name: deploy-api
description: Déploie l'API après vérification des migrations et des tests.
allowed-tools: Bash, Read, issue-tracker
---

# Déploiement de l'API

Procédure unique. Tout passe par `scripts/deploy.sh`.

La rotation des secrets de session doit respecter `src/auth/session.ts`.
