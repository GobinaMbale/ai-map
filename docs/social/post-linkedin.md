# Publication LinkedIn — AI-MAP

Tout est prêt. Compte une minute.

**Image à joindre** : `docs/social/linkedin-tracabilite-7.png` (1200×1200)

---

## 1. Le post — à copier tel quel

Une skill traîne dans mon projet depuis des mois.
Aucune commande ne l'appelle. Elle ne touche aucun fichier.

Je l'ai découverte hier, en scannant mon propre dépôt.

Traçabilité : 7 %.

14 des 15 skills, commandes et agents que j'ai écrits pour piloter mon code ne pointent vers aucun fichier réel.

Ce n'est pas de la négligence, c'est structurel. Claude Code a son dossier. Cursor a le sien. Copilot, Roo, Windsurf, OpenSpec, MCP — chacun le sien. Vous en utilisez deux, peut-être trois.

Ils ne se parlent pas. Et aucun ne montre l'ensemble.

Alors ça dérive, en silence :

→ une skill que plus rien n'appelle
→ un serveur MCP déclaré deux fois, dans deux fichiers qui divergent
→ un change terminé depuis des mois, jamais archivé
→ une règle au format hérité qui coexiste avec sa remplaçante

Rien de tout ça ne casse un build. Tout ça oriente vos assistants.

J'ai écrit AI-MAP pour voir enfin l'ensemble. Il lit les 7 écosystèmes, les traduit dans un modèle unique, et reconstruit le fil que personne ne trace :

Exigence → Skill → Outil MCP → Code source

Puis il ne s'arrête pas au constat. Il chiffre ce qu'il faut réparer :

+23 pts Traçabilité — relier 14 skills à du code réel
+1 pt Hygiène — archiver 2 changes terminés

Il ne lit jamais votre code : il vérifie seulement que les chemins cités par vos configs existent vraiment. Quand ce n'est pas le cas, il le dit.

100 % local. Aucun appel réseau. Aucune télémétrie. Open source.

Votre config IA, elle est à combien ?
Trente secondes pour le savoir — lien en commentaire 👇

#IA #DevTools #ClaudeCode #Cursor

---

## 2. Premier commentaire — à poster juste après

L'extension, installable en un clic :
https://marketplace.visualstudio.com/items?itemName=gobinadaniel.ai-map-vscode

## 3. Second commentaire — optionnel, pour les curieux du code

Le code, la doc et le fonctionnement interne :
https://github.com/GobinaMbale/ai-map

---

## Marche à suivre

1. LinkedIn → **Créer un post**
2. Coller le texte de la partie 1
3. Joindre `linkedin-tracabilite-7.png`
4. Cliquer l'**icône horloge 🕐** à côté de *Publier*
5. Choisir **mardi ou mercredi, 8h30**
6. **Programmer**

⚠ **Le commentaire ne se programme pas.** Il faut le poster à la main après
la publication. Si tu ne peux pas être disponible à ce moment-là, mets le lien
directement dans le post : tu perds un peu de portée, mais un lien absent
coûte plus cher qu'un lien mal placé.

## Après publication

Reste joignable la première heure si possible : répondre tôt aux commentaires
pèse lourd dans la diffusion. À défaut, passe le soir même.
