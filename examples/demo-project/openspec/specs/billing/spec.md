# billing

## Purpose

Calculer et émettre les factures mensuelles par locataire.

## Requirements

### Requirement: Le système SHALL émettre une facture par locataire et par mois

La facture agrège la consommation du mois écoulé pour un seul locataire.

#### Scenario: Locataire actif sur le mois

- **WHEN** le cycle mensuel se clôture
- **THEN** une facture est émise avec le détail de la consommation

### Requirement: Le système SHALL rendre les factures immuables après émission

Une facture émise ne peut plus être modifiée ; une correction passe par un avoir.

#### Scenario: Tentative de modification après émission

- **WHEN** une modification est demandée sur une facture émise
- **THEN** la demande est rejetée et un avoir est proposé