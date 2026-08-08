# add-invoice-pdf

## Why

Les clients réclamaient un export PDF des factures ; l'export CSV existant ne
convenait pas aux services comptables.

## What Changes

- Génération d'un PDF par facture émise, dans la capacité `billing`.
- Stockage du PDF avec la facture, sans régénération à la volée.