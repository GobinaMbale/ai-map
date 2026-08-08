# add-2fa

## Why

Les comptes administrateurs ne sont protégés que par un mot de passe. Un second
facteur est exigé par le référentiel de sécurité interne avant la prochaine
mise en production.

## What Changes

- Ajout d'un second facteur TOTP à la connexion administrateur.
- Nouvelle exigence de session dans la capacité `user-auth`.
- Le déploiement suivra la procédure de la skill `deploy-api`.
- La publication passera par la commande `/release` une fois les tâches closes.

## Impact

L'agent `security-reviewer` doit relire l'ensemble du change avant fusion.