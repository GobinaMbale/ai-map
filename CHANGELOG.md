# Changelog

Toutes les évolutions notables de ce projet.

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · versions : [Semantic Versioning](https://semver.org/lang/fr/).

## [1.1.0] - 2026-08-09

### Added

- **vue portefeuille** — un rapport pour tous les projets IA d'un dossier,
  classés du moins mature au plus mature, avec descente dans chaque projet
  *(`--workspace`, ou « Générer la carte du portefeuille » dans VS Code)*
- **onglet Divergences** — repère un artefact copié entre projets dont les
  contenus ont divergé, et les conventions adoptées partout sauf à un endroit
- une bannière signale les autres projets IA présents sous le dossier ouvert
- chaque alerte de gouvernance indique désormais **ce qui a été constaté** et
  **l'action à faire**, en plus de la raison

### Fixed

- **la gouvernance ne reproche plus l'impossible.** Un hook, une skill pilotant
  un service distant via MCP, ou une skill décrivant une procédure étaient
  signalés « jamais référencés, candidats à la suppression » — c'était faux.
  Seule une cible *annoncée* mais invérifiable est désormais signalée
- la traçabilité reconnaît les serveurs MCP déclarés comme cibles valides, et
  affiche son dénominateur ainsi que ce qu'elle laisse hors périmètre
- « Ouvrir dans le navigateur » et « Enregistrer le rapport » repartaient en vue
  mono-projet lorsqu'on regardait le portefeuille *(extension)*
- titres des fiches illisibles en thème sombre

### Documentation

- règle de gouvernance : ne reprocher qu'une promesse non tenue
- la vue portefeuille dans le README et la fiche de l'extension

## [1.0.1] - 2026-08-09

### Fixed

- le bouton Quitter ne sortait pas du plein écran dans VS Code *(graphe)*

### Documentation

- ajoute des captures à la fiche Marketplace et au README
- aligne les README sur le produit publié

## [1.0.0] - 2026-08-09

### Added

- processus de release en deux phases, avec validation humaine *(release)*
- gouvernance actionnable, sélecteur d'impact, graphe en barre latérale *(rapport)*
- AI-MAP — cartographie transverse d'un écosystème IA

### Fixed

- blocs de code, lisibilité du graphe, relations groupées *(rapport)*

### Documentation

- donne à AI-MAP son propre .claude/ — et de quoi se vérifier
