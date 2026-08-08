#!/usr/bin/env node
// scripts/screenshot.mjs — capture le rapport, onglet par onglet.
//
// POURQUOI. `npm test` exécute le JS du rapport dans un DOM simulé : il prouve
// que le rendu ne PLANTE pas, jamais qu'il est LISIBLE. Libellés empilés,
// contraste illisible, panneau écrasé, bloc de code non reconnu : rien de tout
// cela n'échoue en test. Il faut regarder.
//
// Ce script pilote un Chrome ou un Edge DÉJÀ INSTALLÉ — aucun navigateur n'est
// téléchargé. Seul `playwright-core` (~5 Mo, le pilote) est nécessaire :
//
//     npm install
//
// Usage :
//   node scripts/screenshot.mjs [projet] [-o dossier] [--dark] [--width 1600]
//     projet   projet à cartographier (défaut : examples/demo-project)
//     -o       dossier de sortie (défaut : .shots/)
//     --dark   force le thème sombre
//
// Les captures NE SONT PAS versionnées (.shots/ est ignoré) : ce sont des
// artefacts de vérification, pas de la documentation.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');

// Onglets du rapport, dans l'ordre d'affichage.
const TABS = ['Vue d\'ensemble', 'Impact', 'Gouvernance', 'Graphe', 'Timeline', 'Entités', 'Fichiers'];

// Navigateurs cherchés, dans l'ordre de préférence.
const BROWSERS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/microsoft-edge',
];

function parseArgs(argv) {
  const o = { project: 'examples/demo-project', out: '.shots', dark: false, width: 1600 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-o' || a === '--out') o.out = argv[++i];
    else if (a === '--dark') o.dark = true;
    else if (a === '--width') o.width = Number(argv[++i]) || o.width;
    else if (a === '-h' || a === '--help') { help(); process.exit(0); }
    else if (!a.startsWith('-')) o.project = a;
  }
  return o;
}
function help() {
  console.log('screenshot — capture le rapport AI-MAP, onglet par onglet');
  console.log('  node scripts/screenshot.mjs [projet] [-o dossier] [--dark] [--width 1600]');
}

function findBrowser() {
  for (const p of BROWSERS) if (fs.existsSync(p)) return p;
  return null;
}

const opts = parseArgs(process.argv.slice(2));

let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  console.error('✖ playwright-core est absent. Installez-le : npm install');
  console.error('  (c\'est une dépendance de DÉVELOPPEMENT ; AI-MAP lui-même');
  console.error('   n\'a aucune dépendance d\'exécution.)');
  process.exit(1);
}

const browserPath = findBrowser();
if (!browserPath) {
  console.error('✖ Aucun Chrome ou Edge trouvé. Chemins testés :');
  for (const p of BROWSERS) console.error('    ' + p);
  process.exit(1);
}

// On régénère toujours le rapport : capturer un HTML périmé donnerait une
// fausse assurance sur une modification qu'on vient d'écrire.
const projectDir = path.resolve(ROOT, opts.project);
const report = path.join(os.tmpdir(), 'ai-map.shot.' + process.pid + '.html');
console.log('→ génération du rapport pour ' + path.relative(ROOT, projectDir));
execFileSync(process.execPath,
  [path.join(ROOT, 'src', 'ai-map.mjs'), projectDir, '-o', report],
  { stdio: 'inherit' });

const outDir = path.resolve(ROOT, opts.out);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: browserPath, headless: true });
const page = await browser.newPage({
  viewport: { width: opts.width, height: 1000 },
  deviceScaleFactor: 2,                       // lisible une fois relu
  colorScheme: opts.dark ? 'dark' : 'light',
});

// Toute erreur JS de la page est une régression : le rapport doit être muet.
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto('file:///' + report.replace(/\\/g, '/'), { waitUntil: 'load' });
await page.waitForTimeout(1000);

for (const [i, name] of TABS.entries()) {
  const btn = page.locator('.tab', { hasText: name }).first();
  if (!(await btn.count())) { console.log('✖ onglet introuvable : ' + name); continue; }
  await btn.click();
  await page.waitForTimeout(1400);            // laisse converger la disposition du graphe
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
  const file = path.join(outDir, `${String(i + 1).padStart(2, '0')}-${slug}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log('✔ ' + name.padEnd(15) + ' → ' + path.relative(ROOT, file));
}

// La fiche détaillée : c'est là que se voient le rendu Markdown et les blocs
// de code, qui ont déjà régressé sans qu'aucun test ne le remarque.
await page.locator('.tab', { hasText: 'Entités' }).first().click();
await page.waitForTimeout(600);
const details = page.locator('.details-btn').first();
if (await details.count()) {
  await details.click();
  await page.waitForTimeout(700);
  const file = path.join(outDir, '08-fiche.png');
  await page.screenshot({ path: file, fullPage: true });
  console.log('✔ ' + 'fiche détaillée'.padEnd(15) + ' → ' + path.relative(ROOT, file));
}

await browser.close();
try { fs.unlinkSync(report); } catch { /* fichier temporaire */ }

if (errors.length) {
  console.error('\n✖ ERREURS JS DANS LA PAGE :');
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log('\n✔ Aucune erreur JS. Ouvrez les captures pour juger la lisibilité.');
