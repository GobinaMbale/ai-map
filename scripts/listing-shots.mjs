#!/usr/bin/env node
// scripts/listing-shots.mjs — captures destinées à la FICHE MARKETPLACE.
//
// Différent de screenshot.mjs, qui sert à la vérification : ici on produit des
// images de présentation, en thème sombre, cadrées et de taille maîtrisée.
//
// Elles vont dans docs/screenshots/ — donc HORS du .vsix : le paquet installé
// n'a pas à embarquer ses propres captures. La fiche les charge par URL
// absolue depuis GitHub (les chemins relatifs ne sont pas fiables côté
// Marketplace).
//
//   node scripts/listing-shots.mjs [projet]
//
// La vue latérale et la fiche détaillée sont des composants de l'extension :
// on rend leur HTML réel en lui injectant les variables de thème de VS Code,
// ce qui donne exactement ce que l'utilisateur voit, sans le châssis de
// l'éditeur autour.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require_ = createRequire(import.meta.url);
const OUT = path.join(ROOT, 'docs', 'screenshots');
const PROJECT = process.argv[2] || '../qcm-factory';

const BROWSERS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
];

// Palette Dark+ de VS Code : le composant s'y attend, sinon il retombe sur ses
// valeurs par défaut et ne ressemble plus à ce qu'on verra dans l'éditeur.
const VSCODE_DARK = `
:root{
  --vscode-foreground:#cccccc;
  --vscode-editor-background:#1f1f1f;
  --vscode-descriptionForeground:#9d9d9d;
  --vscode-panel-border:#2b2b2b;
  --vscode-focusBorder:#0078d4;
  --vscode-badge-background:#4d4d4d;
  --vscode-badge-foreground:#f8f8f8;
  --vscode-input-background:#313131;
  --vscode-input-foreground:#cccccc;
  --vscode-input-border:#3c3c3c;
  --vscode-textLink-foreground:#4daafc;
  --vscode-button-background:#0078d4;
  --vscode-button-foreground:#ffffff;
  --vscode-button-hoverBackground:#026ec1;
  --vscode-list-hoverBackground:#2a2d2e;
  --vscode-textCodeBlock-background:#2b2b2b;
  --vscode-toolbar-hoverBackground:#383a49;
  --vscode-inputValidation-warningBackground:#352a05;
  --vscode-font-family:system-ui,-apple-system,Segoe UI,sans-serif;
  --vscode-font-size:13px;
  --vscode-editor-font-family:Consolas,Menlo,monospace;
}
body{background:var(--vscode-editor-background)}`;

const withTheme = (html) => html.replace('</style>', VSCODE_DARK + '\n</style>');

let chromium;
try { ({ chromium } = await import('playwright-core')); }
catch { console.error('✖ playwright-core absent : npm install'); process.exit(1); }

const browserPath = BROWSERS.find((p) => fs.existsSync(p));
if (!browserPath) { console.error('✖ Aucun Chrome ou Edge trouvé.'); process.exit(1); }

fs.mkdirSync(OUT, { recursive: true });
const tmp = os.tmpdir();

// ----- 1. Le rapport, en thème sombre --------------------------------------
const projectDir = path.resolve(ROOT, PROJECT);
const report = path.join(tmp, 'ai-map.listing.html');
console.log('→ rapport pour ' + path.relative(ROOT, projectDir));
execFileSync(process.execPath,
  [path.join(ROOT, 'src', 'ai-map.mjs'), projectDir, '-o', report], { stdio: 'inherit' });

const browser = await chromium.launch({ executablePath: browserPath, headless: true });

const page = await browser.newPage({
  viewport: { width: 1500, height: 940 },
  colorScheme: 'dark',
});
await page.goto('file:///' + report.replace(/\\/g, '/'), { waitUntil: 'load' });
await page.waitForTimeout(1200);

// Onglets retenus : ceux qui montrent la valeur en une image.
for (const [file, tab, wait] of [
  ['01-vue-ensemble.png', "Vue d'ensemble", 900],
  ['02-impact.png', 'Impact', 900],
  ['03-gouvernance.png', 'Gouvernance', 900],
  ['04-graphe.png', 'Graphe', 2000],
]) {
  await page.locator('.tab', { hasText: tab }).first().click();
  await page.waitForTimeout(wait);
  // `fullPage: false` : une capture de fiche doit tenir dans un écran, pas
  // dérouler toute la page.
  await page.screenshot({ path: path.join(OUT, file) });
  console.log('✔ ' + file);
}

// ----- 2. La vue latérale de l'extension -----------------------------------
const { runPlugins } = await import('../src/core/registry.mjs');
const { buildGraph } = await import('../src/core/graph.mjs');
const { buildTrees } = await import('../src/core/explorer.mjs');
const { buildModel } = await import('../src/core/model.mjs');
const sidebar = require_('../vscode-extension/sidebar.js');

const ctx = { root: projectDir };
const scan = runPlugins(ctx);
const model = buildModel(ctx, scan, buildGraph(ctx, scan.entities), buildTrees(ctx, scan.roots));

const sidePage = await browser.newPage({ viewport: { width: 400, height: 940 }, colorScheme: 'dark' });
await sidePage.setContent(withTheme(sidebar.render(null, model, 'ready')), { waitUntil: 'load' });
await sidePage.waitForTimeout(400);
await sidePage.screenshot({ path: path.join(OUT, '05-vue-laterale.png') });
console.log('✔ 05-vue-laterale.png');

await browser.close();
try { fs.unlinkSync(report); } catch { /* temporaire */ }

const total = fs.readdirSync(OUT)
  .filter((f) => f.endsWith('.png'))
  .reduce((n, f) => n + fs.statSync(path.join(OUT, f)).size, 0);
console.log('\nTotal : ' + Math.round(total / 1024) + ' Ko dans docs/screenshots/');
