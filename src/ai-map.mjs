#!/usr/bin/env node
// ai-map — cartographie l'écosystème IA complet d'un projet en une page HTML
// autoportante : Claude Code, OpenSpec, et (à venir) Cursor, Copilot, Roo,
// Windsurf, MCP.
//
// Portable : Node >= 16, zéro dépendance, zéro appel réseau.
//
// Usage :
//   ai-map [chemin] [-o sortie.html] [--open] [--json]
//     chemin  racine du projet à analyser (défaut : .)
//     -o      fichier HTML de sortie (défaut : <chemin>/ai-map.report.html)
//     --open  ouvrir le rapport dans le navigateur
//     --json  écrire aussi le modèle brut en JSON (pour la CI / d'autres outils)
//
// Ce fichier n'est qu'un orchestrateur ; toute la logique vit dans core/ et plugins/.

import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { isDir } from './core/fs.mjs';
import { runPlugins } from './core/registry.mjs';
import { buildGraph } from './core/graph.mjs';
import { buildTrees } from './core/explorer.mjs';
import { buildModel } from './core/model.mjs';
import { renderHtml } from './core/reporting/render.mjs';

function parseArgs(argv) {
  const opts = { inputPath: '.', outPath: null, openAfter: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-o' || a === '--out') opts.outPath = argv[++i];
    else if (a === '--open') opts.openAfter = true;
    else if (a === '--json') opts.json = true;
    else if (a === '-h' || a === '--help') { printHelp(); process.exit(0); }
    else if (!a.startsWith('-')) opts.inputPath = a;
  }
  return opts;
}

function printHelp() {
  console.log('ai-map — carte HTML de l\'écosystème IA d\'un projet');
  console.log('  ai-map [chemin] [-o sortie.html] [--open] [--json]');
  console.log('');
  console.log('  chemin   racine du projet à analyser (défaut : .)');
  console.log('  -o       fichier HTML de sortie');
  console.log('  --open   ouvrir le rapport dans le navigateur');
  console.log('  --json   écrire aussi le modèle brut (.json) à côté du rapport');
}

// On accepte aussi un dossier d'écosystème (.claude/, openspec/) : on remonte
// alors d'un cran pour analyser le projet entier, qui est la bonne granularité
// pour une carte transverse.
const ECOSYSTEM_DIRS = new Set(['.claude', 'openspec', '.cursor', '.github', '.roo', '.windsurf']);

function resolveRoot(inputPath) {
  const resolved = path.resolve(inputPath);
  if (!isDir(resolved)) {
    console.error('Erreur : dossier introuvable — ' + resolved);
    process.exit(1);
  }
  if (ECOSYSTEM_DIRS.has(path.basename(resolved))) return path.dirname(resolved);
  return resolved;
}

function openInBrowser(file) {
  const platform = process.platform;
  const cmd = platform === 'win32' ? 'cmd' : (platform === 'darwin' ? 'open' : 'xdg-open');
  const args = platform === 'win32' ? ['/c', 'start', '', file] : [file];
  execFile(cmd, args, () => {});
}

function main() {
  const { inputPath, outPath, openAfter, json } = parseArgs(process.argv.slice(2));
  const ctx = { root: resolveRoot(inputPath) };
  const out = outPath ? path.resolve(outPath) : path.join(ctx.root, 'ai-map.report.html');

  const scan = runPlugins(ctx);
  if (!scan.detected.size) {
    console.error('Aucun écosystème IA détecté dans ' + ctx.root + '.');
    console.error('Attendu : .claude/, CLAUDE.md, .mcp.json ou openspec/.');
    process.exit(1);
  }

  const graph = buildGraph(ctx, scan.entities);
  const trees = buildTrees(ctx, scan.roots);
  const model = buildModel(ctx, scan, graph, trees);

  fs.writeFileSync(out, renderHtml(model), 'utf8');
  if (json) {
    const jsonPath = out.replace(/\.html?$/i, '') + '.json';
    fs.writeFileSync(jsonPath, JSON.stringify(model, null, 2), 'utf8');
    console.log('✔ Modèle JSON : ' + jsonPath);
  }

  console.log('✔ Carte générée : ' + out);
  console.log('  ' + model.totals.entities + ' entités · ' +
    model.totals.edges + ' relations · ' +
    model.sources.filter((s) => s.detected).map((s) => s.label + ' (' + s.count + ')').join(' · '));

  // Les erreurs d'adaptateur n'interrompent pas la génération, mais elles ne
  // doivent pas passer inaperçues : la carte serait silencieusement incomplète.
  for (const e of scan.errors) {
    console.warn('⚠ Adaptateur ' + e.plugin + ' (' + e.phase + ') : ' + e.message);
  }

  if (openAfter) openInBrowser(out);
}

main();