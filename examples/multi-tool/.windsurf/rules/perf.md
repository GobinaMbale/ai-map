---
trigger: always_on
description: Budget de performance
---

# Performance

Aucune requête base dans une boucle. Le rendu initial reste sous 200 ms.

Les vérifications de session sont en mémoire, jamais en base : cf.
`src/auth/session.ts`.
