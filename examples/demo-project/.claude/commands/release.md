---
description: Publie une version : change de version, taggue, puis déclenche le déploiement.
allowed-tools: Bash(git:*), Read, Write
---

# /release

Point d'entrée unique de publication.

1. Vérifier qu'aucun change OpenSpec n'est `en cours` sur les capacités touchées.
2. Incrémenter la version et créer le tag.
3. Enchaîner sur la skill `deploy-api`.