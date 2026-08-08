---
name: deploy-api
description: Déploie l'API sur l'environnement cible après vérification des migrations et des tests.
allowed-tools: Bash, Read, issue-tracker
---

# Déploiement de l'API

Procédure unique de déploiement. Aucune mise en production manuelle.

## Étapes

Tout passe par `scripts/deploy.sh` — ne jamais enchaîner les commandes à la main.

1. Vérifier que les migrations en attente sont réversibles.
2. Lancer la suite de tests d'intégration.
3. Déployer, puis surveiller les erreurs pendant 10 minutes.
4. En cas d'échec, ouvrir un ticket via le serveur MCP `issue-tracker`.

## Contraintes

Cette skill met en œuvre la capacité `user-auth` : toute rotation de secret doit
respecter les exigences de session décrites dans `src/auth/session.ts`.