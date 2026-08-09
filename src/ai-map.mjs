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
import { buildWorkspace, discoverProjects } from './core/workspace.mjs';
import { renderHtml } from './core/reporting/render.mjs';

function parseArgs(argv) {
  const opts = {
    inputPath: '.', outPath: null, openAfter: false, json: false,
    workspace: false, depth: 3,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-o' || a === '--out') opts.outPath = argv[++i];
    else if (a === '--open') opts.openAfter = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--workspace' || a === '-w') opts.workspace = true;
    else if (a === '--depth') opts.depth = Number(argv[++i]) || opts.depth;
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
  console.log('  -w       vue portefeuille : un rapport pour tous les projets sous ce dossier');
  console.log('  --depth  profondeur de recherche des projets (défaut : 3)');
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
  const { inputPath, outPath, openAfter, json, workspace, depth } = parseArgs(process.argv.slice(2));
  const ctx = { root: resolveRoot(inputPath) };
  const out = outPath ? path.resolve(outPath) : path.join(ctx.root, 'ai-map.report.html');

  const scan = runPlugins(ctx);

  // Mode workspace : demandé explicitement, ou déduit quand la racine ne porte
  // aucune configuration mais que ses sous-dossiers en portent — c'est le cas
  // d'un monorepo ou d'un dossier de travail regroupant plusieurs dépôts.
  let model = null;
  if (workspace || !scan.detected.size) {
    const ws = buildWorkspace(ctx, depth);
    if (ws) {
      model = ws;
      console.log('✔ Carte workspace : ' + ws.totals.projects + ' projets');
      for (const p of ws.projects) {
        console.log('  · ' + p.name.padEnd(28) + String(p.entities).padStart(4) + ' entités · '
          + p.sources.join(', '));
      }
    }
  }

  let nearby = [];
  if (!model) {
    // La racine porte elle-même une configuration : on reste en mono-projet,
    // car basculer sans qu'on l'ait demandé changerait le rapport sous les
    // pieds de l'utilisateur. On signale simplement que l'autre vue existe.
    if (scan.detected.size) {
      nearby = discoverProjects(ctx.root, depth);
      if (nearby.length > 1) {
        console.log('ℹ ' + nearby.length + ' projets IA sous cette racine — '
          + 'vue portefeuille : ai-map ' + inputPath + ' --workspace');
      }
    }

    if (!scan.detected.size) {
      console.error('Aucun écosystème IA détecté dans ' + ctx.root + ',');
      console.error('ni dans ses sous-dossiers (profondeur ' + depth + ').');
      console.error('Attendu : .claude/, CLAUDE.md, .mcp.json, openspec/, .cursor/…');
      process.exit(1);
    }
    const graph = buildGraph(ctx, scan.entities);
    const trees = buildTrees(ctx, scan.roots);
    model = buildModel(ctx, scan, graph, trees);

    // Le message ci-dessus part sur stdout — invisible depuis VS Code, où le
    // rapport est le seul canal. On le transporte donc DANS le modèle, pour que
    // l'interface puisse proposer la vue portefeuille au lieu de laisser croire
    // que ce dossier ne contient qu'un projet.
    if (nearby.length > 1) {
      model.nearby = {
        count: nearby.length,
        others: nearby.filter((p) => p.rel !== '.').map((p) => p.rel),
      };
    }
  }

  fs.writeFileSync(out, renderHtml(model), 'utf8');
  if (json) {
    const jsonPath = out.replace(/\.html?$/i, '') + '.json';
    fs.writeFileSync(jsonPath, JSON.stringify(model, null, 2), 'utf8');
    console.log('✔ Modèle JSON : ' + jsonPath);
  }

  console.log('✔ Carte générée : ' + out);
  if (!model.workspace) {
    console.log('  ' + model.totals.entities + ' entités · ' +
      model.totals.edges + ' relations · ' +
      model.sources.filter((s) => s.detected).map((s) => s.label + ' (' + s.count + ')').join(' · '));
  } else {
    const shared = model.totals.duplicated + model.totals.diverged;
    console.log('  ' + model.totals.entities + ' entités · ' + shared +
      ' artefact(s) partagé(s) · ' + model.totals.misaligned + ' écart(s) à réaligner');
  }

  // Les erreurs d'adaptateur n'interrompent pas la génération, mais elles ne
  // doivent pas passer inaperçues : la carte serait silencieusement incomplète.
  for (const e of (model.workspace ? model.errors : scan.errors)) {
    console.warn('⚠ Adaptateur ' + e.plugin + ' (' + e.phase + ') : ' + e.message);
  }

  if (openAfter) openInBrowser(out);
}

main();