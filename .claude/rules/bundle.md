# Le bundle est une portée plate

`bin/ai-map.mjs` est produit par `build.mjs`, qui **concatène** les modules de
`src/` dans l'ordre de dépendance, retire les `import`/`export` internes et
dédoublonne les imports `node:`.

Conséquence : tous les modules partagent **une seule portée**. Deux modules qui
déclarent le même identifiant racine produisent un bundle qui plante au
chargement avec `Identifier 'X' has already been declared` — un message qui ne
dit pas d'où vient le conflit.

## Ce que ça impose

**Préfixer les fonctions internes des adaptateurs.** Chaque plugin utilise un
préfixe court et unique :

| Adaptateur | Préfixe | Constante de source |
|---|---|---|
| claude | `cl*` | `CLAUDE_SOURCE` |
| openspec | `os*` | `OPENSPEC_SOURCE` |
| cursor | `cu*` | `CURSOR_SOURCE` |
| copilot | `co*` | `COPILOT_SOURCE` |
| roo | `ro*` | `ROO_SOURCE` |
| windsurf | `wi*` | `WINDSURF_SOURCE` |
| mcp | `mc*` | `MCP_SOURCE` |

Ne **jamais** écrire `const SOURCE = '...'` dans un plugin : c'est exactement
la collision qui s'est produite entre `claude` et `openspec`.

`core/workspace.mjs` applique la même règle avec le préfixe `ws*` (`wsTrim`,
`wsFingerprint`, `wsKey`, `WS_COMPARABLE`…). Ce n'est pas un adaptateur, mais il
partage la portée plate et manipule les mêmes notions que `model.mjs` — sans
préfixe, `fingerprint` ou `trim` seraient des collisions en puissance.

**Respecter l'ordre de `MODULES` dans `build.mjs`.** `registry.mjs` référence
les plugins dès l'évaluation de sa constante `PLUGINS` : les plugins doivent
donc être concaténés AVANT lui. De même, `model.mjs` avant `graph.mjs`, et
`workspace.mjs` après `registry`, `graph`, `explorer` et `model` — il les
appelle tous pour analyser chaque projet.

## Le garde-fou

`build.mjs` détecte les collisions et **refuse de produire le fichier** :

```
✖ Collision d'identifiants dans la portée plate du bundle :
  - SOURCE (plugins/claude/index.mjs et plugins/openspec/index.mjs)
```

Si ce message apparaît, renommer — ne pas contourner.

## Ne pas oublier

Après toute modification de `src/`, lancer `node build.mjs`. Sans ça :

- `bin/ai-map.mjs` reste périmé (c'est lui qui est publié sur npm) ;
- `vscode-extension/media/ai-map.mjs` aussi (c'est lui que l'extension exécute).

Les tests utilisent `src/`, pas le bundle : **ils passent même si le bundle est
périmé**. `npm run check` fait le build en premier pour cette raison.
