# Design — add-2fa

## Décision : TOTP plutôt que SMS

Le SMS est vulnérable au portage de numéro et dépend d'un opérateur tiers. TOTP
fonctionne hors ligne et n'ajoute aucune dépendance réseau à l'authentification.

## Décision : secrets chiffrés au repos

Les secrets TOTP sont chiffrés avec la clé de service, jamais stockés en clair.
La rotation suit la procédure existante de la skill `deploy-api`.

## Écarté : second facteur obligatoire pour tous

Trop coûteux en support pour les comptes non privilégiés à ce stade. Réservé aux
comptes administrateurs, réévalué au prochain audit.