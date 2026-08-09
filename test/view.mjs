#!/usr/bin/env node
// test/view.mjs — vérifie les deux rendus HTML de l'extension VS Code, sans
// VS Code : la vue latérale (fiches) et la fiche détaillée (onglet).
//
// Ni sidebar.js ni detail.js ne dépendent du module `vscode` — c'est
// délibéré : ça les rend testables ici.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { runPlugins } from '../src/core/registry.mjs';
import { buildGraph } from '../src/core/graph.mjs';
import { buildTrees } from '../src/core/explorer.mjs';
import { buildModel } from '../src/core/model.mjs';
import { buildWorkspace } from '../src/core/workspace.mjs';

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

// Le modèle portefeuille sert à deux blocs : le câblage des boutons ci-dessous
// et la vue latérale plus bas.
const ws = buildWorkspace({ root: path.join(ROOT, 'examples') });

// ----- Tout bouton déclaré doit AGIR ---------------------------------------
// Un bouton `data-cmd` a deux façons de rester muet, aucune ne produit
// d'erreur : la page ne le câble pas (le script ciblait `.state-btn`, pas
// l'attribut), ou l'extension n'a pas de gestionnaire pour son message.
// « Voir le portefeuille » est tombé dans le premier cas.
console.log('\ncâblage des boutons');
{
  const extSrc = fs.readFileSync(
    path.join(ROOT, 'vscode-extension', 'extension.js'), 'utf8');

  // Tous les rendus possibles, pour ne manquer aucun bouton.
  const screens = [
    sidebar.render(null, model, 'ready'),
    sidebar.render(null, { ...model, nearby: { count: 3, others: ['a'] } }, 'ready'),
    sidebar.render(null, ws, 'ready'),
    ...['empty', 'nofolder', 'loading', 'error'].map((s) => sidebar.render(null, null, s)),
  ];

  check('le script câble l\'ATTRIBUT data-cmd, pas une classe',
    screens.every((s) => /querySelectorAll\('\[data-cmd\]'\)/.test(s)));

  const cmds = new Set();
  for (const s of screens) {
    for (const m of s.matchAll(/data-cmd="([\w.-]+)"/g)) cmds.add(m[1]);
  }
  check('des boutons sont bien déclarés', cmds.size >= 4, [...cmds].join(', '));

  // `openFolder` est traité par VS Code lui-même, les autres par onMessage.
  const unhandled = [...cmds].filter(
    (c) => !new RegExp("msg\\.type === '" + c + "'").test(extSrc));
  check('chaque commande a un gestionnaire dans extension.js',
    unhandled.length === 0, 'sans gestionnaire : ' + unhandled.join(', '));
}

// ----- Projets voisins : la découvrabilité du portefeuille ------------------
// Un dossier peut contenir plusieurs projets IA. En mono-projet, le seul signal
// partait sur stdout — invisible dans VS Code, où la vue laissait croire que le
// dossier n'en contenait qu'un.
console.log('\nprojets voisins');
{
  const solo = sidebar.render(null, model, 'ready');
  check('sans voisin, aucune bannière', !/class="wsnear"/.test(solo));

  const withNear = sidebar.render(null,
    { ...model, nearby: { count: 4, others: ['a', 'b', 'c'] } }, 'ready');
  check('avec voisins, une bannière apparaît', /class="wsnear"/.test(withNear));
  check('elle annonce le nombre de projets', /<strong>4<\/strong> projets IA/.test(withNear));
  check('elle est actionnable', /data-cmd="workspace"/.test(withNear));
  check('elle nomme les voisins', /a · b · c/.test(withNear));
}

// ----- Vue latérale en mode portefeuille -----------------------------------
// Un modèle workspace n'a pas de tableau `entities`, mais ses `totals.entities`
// sont non nuls : le rendu habituel passait le garde-fou puis plantait dessus.
console.log('\nvue latérale (portefeuille)');
const wsHtml = sidebar.render(null, ws, 'ready');

check('le rendu workspace ne plante pas', typeof wsHtml === 'string' && wsHtml.length > 200);
check('une ligne par projet', count(wsHtml, /class="wsrow"/g) === ws.totals.projects,
  count(wsHtml, /class="wsrow"/g) + ' pour ' + ws.totals.projects);
check('la carte du portefeuille est proposée', /data-cmd="report"/.test(wsHtml));
check('aucune fiche d\'entité à ce niveau', !/class="card"/.test(wsHtml));
check('l\'alignement des artefacts est annoncé',
  /class="wsok"/.test(wsHtml) || /class="wsalert"/.test(wsHtml));
check('une sortie du mode portefeuille est offerte', /data-cmd="project"/.test(wsHtml));

// Toute commande qui REGÉNÈRE un rapport doit suivre le mode courant.
// « Ouvrir dans le navigateur » repartait en mono-projet depuis le
// portefeuille : les cinq autres projets disparaissaient sans un mot.
{
  const extSrc = fs.readFileSync(
    path.join(ROOT, 'vscode-extension', 'extension.js'), 'utf8');
  const calls = [...extSrc.matchAll(/\bbuild\(context,[\s\S]*?\);/g)].map((x) => x[0]);
  const blind = calls.filter((c) => !/currentMode\(\)|workspace/.test(c));
  check('chaque génération de rapport suit le mode courant',
    calls.length >= 3 && blind.length === 0,
    calls.length + ' appel(s) · sans mode : ' + (blind.join(' / ') || 'aucun'));
}

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

// Régression : une fence INDENTÉE (à l'intérieur d'une liste) était laissée en
// texte brut, délimiteurs visibles — et la numérotation repartait à 1.
{
  const nested = detail.render({
    ...skill,
    content: [
      'Étapes', '',
      '1. Première étape', '',
      '   ```bash',
      '   openspec status --change "<name>" --json',
      '   ```', '',
      '2. Seconde étape',
    ].join('\n'),
  }, model);
  check('une fence indentée produit un bloc de code', /class="codeblock"/.test(nested));
  check('la langue du bloc est restituée', /cb-lang">bash</.test(nested));
  check('aucun délimiteur ne subsiste en texte', !nested.includes('```'));
  check('la commande est dans le bloc, désindentée',
    /<code>openspec status/.test(nested), nested.slice(nested.indexOf('<code>'), 120));
  check('la liste reprend au bon numéro', /<ol start="2">/.test(nested));
}

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
