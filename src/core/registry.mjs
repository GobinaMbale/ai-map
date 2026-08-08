// core/registry.mjs — registre des adaptateurs (architecture plug-in).
//
// Contrat d'un plugin :
//   {
//     id      : identifiant d'écosystème, doit exister dans model.SOURCES
//     detect  : (ctx) => string[]   dossiers/fichiers racine trouvés (vide = absent)
//     scan    : (ctx) => Entity[]   entités au format universel
//   }
//
// Le cœur n'appelle jamais un plugin nommément : ajouter un écosystème = ajouter
// une entrée dans PLUGINS, rien d'autre à modifier.

import { claudePlugin } from '../plugins/claude/index.mjs';
import { openspecPlugin } from '../plugins/openspec/index.mjs';
import { cursorPlugin } from '../plugins/cursor/index.mjs';
import { copilotPlugin } from '../plugins/copilot/index.mjs';
import { rooPlugin } from '../plugins/roo/index.mjs';
import { windsurfPlugin } from '../plugins/windsurf/index.mjs';
import { mcpPlugin } from '../plugins/mcp/index.mjs';

export const PLUGINS = [
  claudePlugin, openspecPlugin, cursorPlugin,
  copilotPlugin, rooPlugin, windsurfPlugin, mcpPlugin,
];

export function runPlugins(ctx) {
  const entities = [];
  const detected = new Set();
  const roots = new Map();
  const errors = [];

  for (const plugin of PLUGINS) {
    let found = [];
    try {
      found = plugin.detect(ctx) || [];
    } catch (err) {
      errors.push({ plugin: plugin.id, phase: 'detect', message: String(err && err.message || err) });
      continue;
    }
    if (!found.length) continue;

    detected.add(plugin.id);
    roots.set(plugin.id, found);

    // Un adaptateur qui échoue ne doit jamais faire tomber la carte entière :
    // on isole l'erreur et on continue avec les autres écosystèmes.
    try {
      for (const e of plugin.scan(ctx) || []) entities.push(e);
    } catch (err) {
      errors.push({ plugin: plugin.id, phase: 'scan', message: String(err && err.message || err) });
    }
  }

  // Ordre stable (source, type, nom) → sortie reproductible d'un run à l'autre.
  entities.sort((a, b) =>
    a.source.localeCompare(b.source) || a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));

  return { entities, detected, roots, errors };
}