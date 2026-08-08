#!/usr/bin/env bash
# Déploiement de l'API. Appelé par la skill `deploy-api`, jamais à la main.
set -euo pipefail

echo "→ Vérification des migrations en attente"
npm run migrate:check

echo "→ Tests d'intégration"
npm run test:integration

echo "→ Déploiement"
npm run deploy:api

echo "→ Surveillance des erreurs (10 min)"
npm run watch:errors -- --duration 600
