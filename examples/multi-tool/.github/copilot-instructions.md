# Instructions Copilot

Ce dépôt applique les mêmes conventions à tous les assistants.

- Le déploiement passe par la skill `deploy-api`, jamais de commande manuelle.
- Les sessions sont gérées dans `src/auth/session.ts`.
- Tout correctif embarque le test qui échouait avant lui.
