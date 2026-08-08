# Delta — billing

## ADDED Requirements

### Requirement: Le système SHALL produire un PDF pour chaque facture émise

Le PDF est généré au moment de l'émission et conservé avec la facture.

#### Scenario: Émission d'une facture

- **WHEN** une facture est émise
- **THEN** un PDF est généré et attaché à la facture
