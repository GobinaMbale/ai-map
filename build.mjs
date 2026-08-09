#!/usr/bin/env node
// build.mjs — bundle la source multi-fichiers (src/) en UN fichier autonome
// (bin/ai-map.mjs), sans aucune dépendance externe.
//
// Principe : on concatène les modules dans l'ordre de dépendance, on retire les
// imports/exports internes, on dédoublonne les imports `node:`, et on inline les
// assets via globalThis.__AI_MAP_ASSETS.
//
// Contrainte : le bundle est une PORTÉE PLATE. Deux modules ne doivent jamais
// déclarer le même identifiant au niveau racine (d'où les préfixes `cl*`/`os*`
// dans les plugins et les constantes `CLAUDE_SOURCE`/`OPENSPEC_SOURCE`).
//
// Usage : node build.mjs   →   écrit bin/ai-map.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'src');
const OUT = path.join(HERE, 'bin', 'ai-map.mjs');

// Ordre de dépendance strict. Les plugins doivent précéder le registre, qui
// les référence dès l'évaluation de sa constante PLUGINS.
const MODULES = [
  'core/fs.mjs',
  'core/parser.mjs',
  'core/model.mjs',
  'core/mcp.mjs',
  'plugins/claude/index.mjs',
  'plugins/openspec/index.mjs',
  'plugins/cursor/index.mjs',
  'plugins/copilot/index.mjs',
  'plugins/roo/index.mjs',
  'plugins/windsurf/index.mjs',
  'plugins/mcp/index.mjs',
  'core/registry.mjs',
  'core/graph.mjs',
  'core/explorer.mjs',
  'core/workspace.mjs',
  'core/reporting/render.mjs',
  'ai-map.mjs',
];

const externalImports = new Map(); // ligne d'import node: → dédup
const bodies = [];

for (const rel of MODULES) {
  let text = fs.readFileSync(path.join(SRC, rel), 'utf8');

  // Retire chaque `import ... from '...';` (mono ou multi-lignes, ancré en
  // début de ligne). Les imports `node:` sont collectés, les internes supprimés.
  text = text.replace(/^import\b[^;]*?from\s+'([^']+)';/gm, (stmt, source) => {
    if (source.startsWith('node:')) externalImports.set(stmt.replace(/\s+/g, ' ').trim(), true);
    return '';
  });
  // Retire le mot-clé `export` (en gardant l'indentation) et le shebang.
  text = text.replace(/^(\s*)export\s+/gm, '$1').replace(/^#!.*\r?\n/, '');

  bodies.push('// ===== ' + rel + ' =====\n' + text.trim());
}

// Garde-fou : une collision d'identifiant produirait un bundle qui plante à
// l'exécution avec un message peu parlant. On la détecte à la construction.
const declared = new Map();
const collisions = [];
MODULES.forEach((rel, i) => {
  const re = /^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = re.exec(bodies[i]))) {
    if (declared.has(m[1])) collisions.push(m[1] + ' (' + declared.get(m[1]) + ' et ' + rel + ')');
    else declared.set(m[1], rel);
  }
});
if (collisions.length) {
  console.error('✖ Collision d\'identifiants dans la portée plate du bundle :');
  for (const c of collisions) console.error('  - ' + c);
  process.exit(1);
}

const assetsDir = path.join(SRC, 'core', 'reporting', 'assets');
const assetsLine = 'globalThis.__AI_MAP_ASSETS = ' + JSON.stringify({
  'styles.css': fs.readFileSync(path.join(assetsDir, 'styles.css'), 'utf8'),
  'app.js': fs.readFileSync(path.join(assetsDir, 'app.js'), 'utf8'),
}) + ';';

const out = [
  '#!/usr/bin/env node',
  '// ai-map — fichier autonome généré par build.mjs. NE PAS ÉDITER À LA MAIN.',
  '// Source : src/ (multi-fichiers). Régénérer : node build.mjs',
  '',
  [...externalImports.keys()].join('\n'),
  '',
  assetsLine,
  '',
  bodies.join('\n\n'),
  '',
].join('\n');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out, 'utf8');
console.log('✔ Bundle écrit : ' + path.relative(HERE, OUT) + ' (' + out.length + ' octets)');

// Copie dans l'extension VS Code si elle existe (elle doit être autoportante).
const VSCODE_MEDIA = path.join(HERE, 'vscode-extension', 'media');
if (fs.existsSync(path.join(HERE, 'vscode-extension'))) {
  fs.mkdirSync(VSCODE_MEDIA, { recursive: true });
  fs.copyFileSync(OUT, path.join(VSCODE_MEDIA, 'ai-map.mjs'));
  console.log('✔ Copié vers : ' + path.relative(HERE, path.join(VSCODE_MEDIA, 'ai-map.mjs')));
}