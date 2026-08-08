# Tâches — add-2fa

## 1. Socle TOTP

- [x] 1.1 Choisir la bibliothèque TOTP et figer la version
- [x] 1.2 Générer et stocker les secrets chiffrés
- [ ] 1.3 Écrire les tests de dérive d'horloge

## 2. Parcours utilisateur

- [ ] 2.1 Écran d'enrôlement du second facteur
- [ ] 2.2 Codes de récupération à usage unique
- [ ] 2.3 Parcours de désactivation encadré

## 3. Mise en production

- [ ] 3.1 Rotation des secrets de session via `deploy-api`
- [ ] 3.2 Publication via `/release`