---
description: Relit une pull request selon les conventions du dépôt
mode: agent
tools: ["search", "editFiles"]
---

# Relecture de pull request

Vérifier, dans l'ordre :

1. Les tests couvrent le correctif.
2. Aucun secret en clair.
3. Les changements de session respectent `src/auth/session.ts`.
