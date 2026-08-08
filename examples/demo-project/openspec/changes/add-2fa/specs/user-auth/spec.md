# Delta — user-auth

## ADDED Requirements

### Requirement: Le système SHALL exiger un second facteur pour les comptes administrateurs

Un compte disposant du rôle administrateur doit valider un code TOTP après le
mot de passe.

#### Scenario: Connexion administrateur

- **WHEN** un administrateur soumet un mot de passe valide
- **THEN** un code TOTP est demandé avant l'ouverture de session

## MODIFIED Requirements

### Requirement: Le système SHALL expirer les sessions inactives

Le seuil passe de 30 à 15 minutes pour les sessions administrateur.

#### Scenario: Session administrateur inactive

- **WHEN** une session administrateur reste inactive 15 minutes
- **THEN** la session est invalidée