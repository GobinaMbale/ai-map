# user-auth

## Purpose

Authentifier les utilisateurs et gérer le cycle de vie des sessions.

## Requirements

### Requirement: Le système SHALL expirer les sessions inactives

Une session sans activité pendant 30 minutes doit être invalidée côté serveur.

L'implémentation vit dans `src/auth/session.ts`. Le déploiement de cette règle
est assuré par la skill `deploy-api`, qui pilote la rotation des secrets.

#### Scenario: Session inactive au-delà du seuil

- **WHEN** aucune requête n'est reçue pendant 30 minutes
- **THEN** la session est invalidée et un nouveau login est requis

#### Scenario: Activité avant le seuil

- **WHEN** une requête arrive à la 29e minute
- **THEN** le compteur d'inactivité est réinitialisé

### Requirement: Le système SHALL journaliser les échecs d'authentification

Chaque échec est journalisé avec l'horodatage et l'origine, sans le mot de passe.

L'agent `security-reviewer` vérifie cette exigence à chaque modification.

#### Scenario: Mot de passe invalide

- **WHEN** un mot de passe incorrect est soumis
- **THEN** l'échec est journalisé sans donnée secrète