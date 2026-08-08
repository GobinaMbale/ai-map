#!/usr/bin/env node
// test/view.mjs — vérifie les deux rendus HTML de l'extension VS Code, sans
// VS Code : la vue latérale (fiches) et la fiche détaillée (onglet).
//
// Ni sidebar.js ni detail.js ne dépendent du module `vscode` — c'est
// délibéré : ça les rend testables ici.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { runPlugins } from '../src/core/registry.mjs';
import { buildGraph } from '../src/core/graph.mjs';
import { buildTrees } from '../src/core/explorer.mjs';
import { buildModel } from '../src/core/model.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const require_ = createRequire(import.meta.url);
const sidebar = require_('../vscode-extension/sidebar.js');
const detail = require_('../vscode-extension/detail.js');

let failures = 0;
function check(label, cond, detailMsg) {
  if (cond) { console.log('  ✔ ' + label); return; }
  failures++;
  console.log('  ✖ ' + label + (detailMsg ? ' — ' + detailMsg : ''));
}
const count = (s, re) => (s.match(re) || []).length;

function analyse(dir) {
  const ctx = { root: path.join(ROOT, dir) };
  const scan = runPlugins(ctx);
  const graph = buildGraph(ctx, scan.entities);
  return buildModel(ctx, scan, graph, buildTrees(ctx, scan.roots));
}

// ----- Vue latérale --------------------------------------------------------
console.log('\nvue latérale (fiches)');
const model = analyse('examples/demo-project');
const html = sidebar.render(null, model, 'ready');

// Les fiches sont dupliquées entre les volets (Entités / Alertes / Changes) :
// les comptages doivent se faire dans le volet « Entités » seul.
function pane(src, name) {
  const start = src.indexOf(`data-pane="${name}"`);
  if (start === -1) return '';
  const next = src.indexOf('<div class="vpane"', start + 1);
  return src.slice(start, next === -1 ? src.length : next);
}
const allPane = pane(html, 'all');

const detected = model.sources.filter((s) => s.detected).length;
check('un groupe par écosystème détecté', count(allPane, /class="group"/g) === detected,
  count(allPane, /class="group"/g) + ' vs ' + detected);
check('une fiche par entité', count(allPane, /class="card/g) === model.totals.entities,
  count(allPane, /class="card/g) + ' vs ' + model.totals.entities);
check('les fiches portent nom, description et étiquettes',
  /<h3 style="color:#[0-9a-f]{6}">/.test(html) && /<p>/.test(html) && /class="tags"/.test(html));
check('champ de recherche présent', /id="q"/.test(html));
check('résumé chiffré en tête', /class="summary"/.test(html) && html.includes(String(model.totals.entities)));
check('chaque fiche expose un index de recherche',
  count(allPane, /data-search="/g) === model.totals.entities);
check('barre d\'avancement sur les entités qui en ont une',
  /class="bar"/.test(html), 'aucune barre trouvée');

// Onglets et couleur par statut — la lecture demandée : pas une liste plate.
check('des onglets découpent la vue', /class="vtabs"/.test(html));
check('un onglet Changes existe', /data-tab="changes"/.test(html));
check('les changes sont groupés par statut',
  pane(html, 'changes').includes('En cours') && pane(html, 'changes').includes('Archivé'),
  pane(html, 'changes').slice(0, 200));
check('la barre de gauche porte une couleur de statut',
  /class="card[^"]*" style="border-left-color:#[0-9a-f]{6}"/.test(html));
// demo-project n'a aucune alerte : c'est multi-tool qui en produit
// (règle au format hérité, serveur MCP déclaré deux fois).
const multiHtml = sidebar.render(null, analyse('examples/multi-tool'), 'ready');
check('les entités en alerte sont mises en évidence', /class="card flag"/.test(multiHtml));
check('un onglet Alertes apparaît quand il y en a', /data-tab="alerts"/.test(multiHtml));
check('aucun onglet Alertes sans alerte', !/data-tab="alerts"/.test(html));

// Le contenu vient de fichiers du projet : il ne doit jamais s'exécuter.
const hostile = {
  ...model,
  entities: [{
    id: 'x', kind: 'skill', source: 'claude',
    name: '<img src=x onerror=alert(1)>',
    description: '</script><script>alert(2)</script>',
    path: 'a"b.md', meta: [], badges: [], mtime: null,
  }],
  totals: { ...model.totals, entities: 1 },
};
const hostileHtml = sidebar.render(null, hostile, 'ready');
check('le HTML des entités est échappé',
  !hostileHtml.includes('<img src=x') && !hostileHtml.includes('<script>alert(2)'),
  'injection possible');

// ----- États sans données --------------------------------------------------
console.log('\nétats sans données');
for (const [state, needle] of [
  ['empty', 'Aucune configuration IA détectée'],
  ['nofolder', 'Aucun dossier ouvert'],
  ['loading', 'Analyse en cours'],
  ['error', 'analyse a échoué'],
]) {
  const s = sidebar.render(null, null, state);
  check('état « ' + state +' » affiche un message', s.includes(needle), s.slice(0, 120));
  check('état « ' + state + ' » affiche une icône', /class="state-icon">.{1,8}</su.test(s));
}
const emptyHtml = sidebar.render(null, null, 'empty');
check('l\'état vide propose une action', /data-cmd="bootstrap"/.test(emptyHtml));
check('l\'état vide liste les emplacements cherchés', emptyHtml.includes('.windsurf/'));

// ----- Fiche détaillée -----------------------------------------------------
console.log('\nfiche détaillée (onglet)');
const skill = model.entities.find((e) => e.kind === 'skill');
const page = detail.render(skill, model);

check('trois sous-onglets', count(page, /data-pane="/g) === 3);
check('les trois volets existent',
  /id="content"/.test(page) && /id="relations"/.test(page) && /id="meta"/.test(page));
check('le nom et le chemin sont en en-tête',
  page.includes(skill.name) && page.includes(skill.path));
check('bouton d\'ouverture du fichier', /data-cmd="open"/.test(page));
check('les relations sont libellées par leur verbe', /class="rel-verb"/.test(page));
check('les métadonnées sont tabulées', /class="meta"/.test(page));

const md = detail.render({
  ...skill,
  content: '## Titre\n\n- [x] fait\n- [ ] à faire\n\n`code` et **gras**\n\n<script>alert(3)</script>',
}, model);
check('les titres de section reçoivent la barre colorée', /<h2 class="sec">/.test(md));
check('les cases à cocher sont rendues', /class="task done"/.test(md) && /class="task "/.test(md));
check('code inline et gras rendus', /<code>code<\/code>/.test(md) && /<strong>gras<\/strong>/.test(md));
check('le HTML du contenu est échappé', !md.includes('<script>alert(3)'), 'injection possible');

// Une entité dérivée n'a pas de fichier : la page ne doit pas proposer de l'ouvrir.
const derived = detail.render(
  { ...skill, path: null, content: '' }, model);
check('sans fichier, pas de bouton « Ouvrir »', !/data-cmd="open"/.test(derived));
check('sans contenu, un message explicite', derived.includes('Aucun contenu textuel'));

console.log('');
if (failures) { console.error(failures + ' test(s) en échec.'); process.exit(1); }
console.log('Vues : tous les tests passent.');
