#!/usr/bin/env node
// test/smoke.mjs — vérification de bout en bout, sans dépendance ni navigateur.
//
// 1. Analyse les projets d'exemple et contrôle le modèle produit.
// 2. Exécute RÉELLEMENT le JS du rapport dans un DOM minimal : un rapport qui
//    plante au premier rendu passerait sinon inaperçu (le HTML se génère très
//    bien même si son script est cassé).
//
// Usage : node test/smoke.mjs   (code de sortie ≠ 0 si un test échoue)

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { runPlugins } from '../src/core/registry.mjs';
import { buildGraph } from '../src/core/graph.mjs';
import { buildTrees } from '../src/core/explorer.mjs';
import { buildModel, makeEntity } from '../src/core/model.mjs';
import { renderHtml } from '../src/core/reporting/render.mjs';
import { parseYamlLite } from '../src/core/parser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');

let failures = 0;
function check(label, cond, detail) {
  if (cond) { console.log('  ✔ ' + label); return; }
  failures++;
  console.log('  ✖ ' + label + (detail ? ' — ' + detail : ''));
}

function analyse(projectDir) {
  const ctx = { root: path.join(ROOT, projectDir) };
  const scan = runPlugins(ctx);
  const graph = buildGraph(ctx, scan.entities);
  return { scan, model: buildModel(ctx, scan, graph, buildTrees(ctx, scan.roots)) };
}

// ----- 1) Projet à deux écosystèmes ---------------------------------------
console.log('\nexamples/demo-project (Claude + OpenSpec)');
const demo = analyse('examples/demo-project');
const m = demo.model;
const kinds = Object.fromEntries(m.kinds.map((k) => [k.key, k.count]));

check('aucune erreur d\'adaptateur', demo.scan.errors.length === 0, JSON.stringify(demo.scan.errors));
check('deux écosystèmes détectés', m.totals.sources === 2, 'sources=' + m.totals.sources);
check('skills, commandes, agents extraits', kinds.skill >= 1 && kinds.command >= 1 && kinds.agent >= 1);
check('spécifications et exigences extraites', kinds.spec === 2 && kinds.requirement >= 4,
  'spec=' + kinds.spec + ' requirement=' + kinds.requirement);
check('changes (courant + archivé) extraits', kinds.change === 2, 'change=' + kinds.change);
check('serveurs MCP extraits', kinds.mcp === 2, 'mcp=' + kinds.mcp);
check('hooks remontés en workflow', kinds.workflow >= 1);

// Le statut d'un change archivé ne doit jamais être « à archiver ».
const archived = m.entities.find((e) => e.kind === 'change' && e.name === 'add-invoice-pdf');
check('change archivé marqué comme tel',
  archived && archived.badges.some((b) => b.text === 'archivé'),
  archived ? JSON.stringify(archived.badges) : 'entité introuvable');

// Analyse d'impact : le change en cours doit pointer vers la capacité modifiée.
const deltaEdges = m.graph.edges.filter((e) => e.type === 'delta');
check('lien d\'impact Change → Spécification', deltaEdges.length >= 2, 'delta=' + deltaEdges.length);

// LA chaîne différenciante : Exigence (OpenSpec) → Skill (Claude) → Serveur MCP.
const req = m.entities.find((e) => e.kind === 'requirement' && /sessions inactives/i.test(e.name));
const skill = m.entities.find((e) => e.kind === 'skill' && e.name === 'deploy-api');
const mcp = m.entities.find((e) => e.kind === 'mcp' && e.name === 'issue-tracker');
const has = (s, t) => m.graph.edges.some((e) => e.s === s && e.t === t);
check('chaîne Exigence → Skill', req && skill && has(req.id, skill.id));
check('chaîne Skill → Serveur MCP', skill && mcp && has(skill.id, mcp.id));

const cross = m.graph.edges.filter((e) => e.cross);
check('liens transverses présents', cross.length >= 5, 'cross=' + cross.length);
check('aucun nœud d\'outil compté comme transverse',
  !cross.some((e) => e.s.startsWith('tool:') || e.t.startsWith('tool:')));

// Toute arête doit pointer vers un nœud existant, sinon le graphe se dessine mal.
const nodeIds = new Set(m.graph.nodes.map((n) => n.id));
check('toutes les arêtes pointent vers des nœuds connus',
  m.graph.edges.every((e) => nodeIds.has(e.s) && nodeIds.has(e.t)));
check('identifiants d\'entité uniques',
  new Set(m.entities.map((e) => e.id)).size === m.entities.length);

// Dernière patte de la chaîne : Skill → Code source, résolue sur disque.
const codeEdges = m.graph.edges.filter((e) => e.type === 'code');
check('liens vers le code source', codeEdges.length >= 3, 'code=' + codeEdges.length);
check('chaîne complète Exigence → Skill → Code',
  req && skill && has(req.id, skill.id) &&
  m.graph.edges.some((e) => e.s === skill.id && e.type === 'code'));
check('le code n\'est pas compté comme entité',
  m.entities.every((e) => e.kind !== 'code'));
check('les nœuds de code portent leur chemin projet',
  m.graph.nodes.filter((n) => n.kind === 'code').every((n) => n.path && !n.path.startsWith('.')));

// ----- 1 bis) Garde-fous de la résolution de code --------------------------
console.log('\ngarde-fous du lien vers le code');
{
  const ctx = { root: path.join(ROOT, 'examples', 'demo-project') };
  const probe = (label, refs) => makeEntity(ctx, {
    source: 'claude', kind: 'skill', name: label, slug: label,
    file: path.join(ctx.root, 'CLAUDE.md'),
    links: { code: refs },
  });
  const g = buildGraph(ctx, [
    probe('reel', ['src/auth/session.ts']),
    probe('inexistant', ['src/auth/nexiste-pas.ts']),
    probe('hors-projet', ['../../package.json']),   // existe, mais hors racine
    probe('non-code', ['CLAUDE.md']),               // existe, mais pas du code
    probe('glob', ['src/**']),
  ]);
  const codePaths = g.nodes.filter((n) => n.kind === 'code').map((n) => n.path);
  check('un fichier réel du projet est lié', codePaths.includes('src/auth/session.ts'));
  check('un fichier inexistant ne crée rien', !codePaths.some((p) => p.includes('nexiste-pas')));
  check('un fichier HORS de la racine est refusé', !codePaths.some((p) => p.includes('package.json')),
    codePaths.join(', '));
  check('un non-code (.md) n\'est pas étiqueté code', !codePaths.some((p) => p.endsWith('.md')));
  check('un glob ne crée rien', !codePaths.some((p) => p.includes('*')));
  check('exactement un nœud de code attendu', codePaths.length === 1, codePaths.join(', '));
}

// ----- 2) Projet mono-écosystème ------------------------------------------
console.log('\nexamples/claude-only (un seul écosystème)');
const solo = analyse('examples/claude-only');
const sm = solo.model;
check('un seul écosystème détecté', sm.totals.sources === 1, 'sources=' + sm.totals.sources);
check('OpenSpec correctement absent',
  sm.sources.find((s) => s.id === 'openspec').detected === false);
check('la carte reste exploitable', sm.totals.entities >= 5 && sm.totals.edges >= 5,
  sm.totals.entities + ' entités / ' + sm.totals.edges + ' relations');
check('aucun lien transverse (attendu)', sm.graph.edges.every((e) => !e.cross));

// ----- 2 bis) Sept écosystèmes côte à côte ---------------------------------
console.log('\nexamples/multi-tool (Cursor, Copilot, Roo, Windsurf, MCP)');
const multi = analyse('examples/multi-tool');
const mm = multi.model;
const mkinds = Object.fromEntries(mm.kinds.map((k) => [k.key, k.count]));
const named = (source, kind) => mm.entities.filter((e) => e.source === source && e.kind === kind);

check('aucune erreur d\'adaptateur', multi.scan.errors.length === 0, JSON.stringify(multi.scan.errors));
check('six écosystèmes détectés', mm.totals.sources === 6, 'sources=' + mm.totals.sources);
check('Cursor : règle .mdc + MCP', named('cursor', 'rule').length >= 2 && named('cursor', 'mcp').length === 1);
check('Copilot : instructions, prompt, chat mode',
  named('copilot', 'memory').length === 1 && named('copilot', 'prompt').length === 1 &&
  named('copilot', 'agent').length === 1);
check('Roo : modes YAML lus en agents', named('roo', 'agent').length === 2,
  'agents roo=' + named('roo', 'agent').length);
check('Windsurf : règle + workflow',
  named('windsurf', 'rule').length === 1 && named('windsurf', 'workflow').length === 1);
check('MCP universel : mcp.yaml analysé', named('mcp', 'mcp').length === 2,
  'mcp=' + named('mcp', 'mcp').length);
check('prompts Copilot modélisés', mkinds.prompt === 1);

// Signaux de gouvernance produits par les adaptateurs.
const legacy = mm.entities.find((e) => e.name === '.cursorrules');
check('fichier de règles hérité signalé comme doublon',
  legacy && legacy.badges.some((b) => /doublon/.test(b.text)),
  legacy ? JSON.stringify(legacy.badges) : 'absent');

const dupes = mm.entities.filter((e) => e.kind === 'mcp' && e.name === 'issue-tracker');
check('serveur MCP déclaré deux fois : les deux sont signalés',
  dupes.length === 2 && dupes.every((e) => e.badges.some((b) => /aussi déclaré/.test(b.text))),
  dupes.map((e) => e.source + ':' + JSON.stringify(e.badges)).join(' | '));

check('aucune auto-citation entre entités homonymes',
  !mm.graph.edges.some((e) => {
    if (e.type !== 'mention') return false;
    const a = mm.entities.find((x) => x.id === e.s);
    const b = mm.entities.find((x) => x.id === e.t);
    return a && b && a.name.toLowerCase() === b.name.toLowerCase();
  }));

check('le code est atteint depuis plusieurs écosystèmes',
  new Set(mm.graph.edges.filter((e) => e.type === 'code')
    .map((e) => (mm.entities.find((x) => x.id === e.s) || {}).source)).size >= 4);

// ----- 2 ter) Parseur YAML minimal -----------------------------------------
console.log('\nparseur YAML minimal');
{
  const y = parseYamlLite([
    'customModes:',
    '  - slug: auditor',
    '    name: Auditeur',
    '    roleDefinition: |',
    '      Première ligne.',
    '      Seconde ligne.',
    '    groups:',
    '      - read',
    '      - edit',
    '  - slug: writer',
    '    groups: [read, browser]   # commentaire ignoré',
    'servers:',
    '  api:',
    '    url: "http://x/mcp"',
    '    port: 8080',
    '    on: true',
  ].join('\n'));
  check('liste de maps imbriquées', Array.isArray(y && y.customModes) && y.customModes.length === 2);
  check('bloc littéral | conservé sur plusieurs lignes',
    y && y.customModes[0].roleDefinition === 'Première ligne.\nSeconde ligne.');
  check('liste de scalaires', y && JSON.stringify(y.customModes[0].groups) === '["read","edit"]');
  check('liste en ligne + commentaire retiré',
    y && JSON.stringify(y.customModes[1].groups) === '["read","browser"]');
  check('map imbriquée et types scalaires',
    y && y.servers.api.url === 'http://x/mcp' && y.servers.api.port === 8080 && y.servers.api.on === true);
  check('texte hors périmètre → null plutôt qu\'exception',
    parseYamlLite('') === null);
}

// ----- 3) Le rapport HTML s'exécute vraiment -------------------------------
console.log('\nrapport HTML');
const html = renderHtml(m);
check('page autoportante (aucune ressource externe)',
  !/(src|href)\s*=\s*["'](https?:|\/\/)/i.test(html));
// Le modèle est injecté dans un <script> : une valeur contenant « </script> »
// refermerait la balise et casserait la page. On extrait le bloc et on le relit.
const dataBlock = html.match(/<script>const DATA = ([\s\S]*?);<\/script>/);
check('bloc DATA présent et isolable', !!dataBlock);
check('aucun </script> brut dans DATA', !!dataBlock && dataBlock[1].indexOf('</script') === -1);
check('DATA est un JSON relisable', !!dataBlock && (() => {
  try { return JSON.parse(dataBlock[1].replace(/\\u003c/g, '<')).totals.entities === m.totals.entities; }
  catch { return false; }
})());

const run = runReportInFakeDom(m);
check('le script du rapport s\'exécute sans erreur', run.error === null, run.error && run.error.stack);
check('les sept onglets sont présents', run.tabs.length === 7,
  run.tabs.map((t) => t.label).join(' | '));
for (const t of run.tabs) {
  check('onglet « ' + t.label + ' » se construit',
    !t.error && t.nodes > 5, t.error ? t.error.stack : t.nodes + ' nœuds');
}

// ----- Gouvernance : le score doit être un levier, pas un constat ----------
{
  const byLabel = (re) => findAll(run.root, (n) => n.tagName === 'BUTTON' && re.test(textOf(n)))[0];

  const gov = byLabel(/Gouvernance/);
  check('l\'onglet Gouvernance est atteignable', !!gov);
  if (gov) {
    gov.onclick();
    const gains = findAll(run.root, (n) => n.className === 'reco-gain').map((n) => textOf(n));
    check('des recommandations chiffrées sont proposées', gains.length > 0, gains.join(' | '));
    check('chaque recommandation annonce un gain en points',
      gains.every((g) => /^\+\d+ pts? /.test(g)), gains.join(' | '));

    // Invariant : appliquer TOUTES les recommandations ne peut pas dépasser
    // 100. Si la somme des gains excède la marge restante, le calcul ment.
    const sum = gains.reduce((s, g) => s + Number((g.match(/\+(\d+)/) || [0, 0])[1]), 0);
    const over = byLabel(/Vue d'ensemble/);
    if (over) over.onclick();
    const kpi = findAll(run.root, (n) => n.className === 'kc-n')[0];
    const score = kpi ? Number(textOf(kpi)) : NaN;
    check('la somme des gains ne dépasse pas la marge restante',
      Number.isFinite(score) && sum <= (100 - score) + 4,
      'score=' + score + ' somme des gains=' + sum);

    // Le détail d'une recommandation doit nommer les entités concernées.
    gov.onclick();
    const reco = findAll(run.root, (n) => n.className === 'reco')[0];
    if (reco) {
      reco.onclick();
      check('une recommandation ouvre la liste des entités visées',
        findAll(run.root, (n) => String(n.className).indexOf('alert') === 0).length > 0);
    }
  }
}

// ----- Impact : un sélecteur, pas un déversoir -----------------------------
{
  const imp = findAll(run.root, (n) => n.tagName === 'BUTTON' && /Impact/.test(textOf(n)))[0];
  if (imp) {
    imp.onclick();
    const chips = findAll(run.root, (n) => String(n.className).indexOf('ichip') === 0);
    check('le fil d\'impact propose un sélecteur d\'origine', chips.length > 1,
      chips.length + ' pastille(s)');
    const before = findAll(run.root, (n) => n.className === 'chain' || n.className === 'chain cross').length;
    const pick = chips.find((c) => !/Tous les fils/.test(textOf(c)));
    if (pick) {
      pick.onclick();
      const after = findAll(run.root, (n) => n.className === 'chain' || n.className === 'chain cross').length;
      check('sélectionner une origine restreint les fils affichés', after > 0 && after <= before,
        before + ' → ' + after);
    }
  }
}

// ----- Plein écran du graphe quand l'API est REFUSÉE -----------------------
// Cas d'une webview VS Code : requestFullscreen() rejette, on bascule sur un
// repli CSS. Le bouton doit alors savoir SORTIR de ce repli — il retentait
// requestFullscreen(), qui rejetait, et « Quitter » remettait le plein écran.
{
  const gr = findAll(run.root, (n) => n.tagName === 'BUTTON' && /Graphe/.test(textOf(n)))[0];
  if (gr) {
    gr.onclick();
    const fsBtn = findAll(run.root,
      (n) => n.tagName === 'BUTTON' && /Plein écran/.test(textOf(n)))[0];
    check('le bouton plein écran existe', !!fsBtn);
    if (fsBtn) {
      // Le repli passe par le `catch` d'une promesse : il faut laisser tourner
      // la microtâche avant de juger l'état du bouton.
      const tick = () => new Promise((r) => setTimeout(r, 0));
      fsBtn.onclick(); await tick();
      check('un premier clic passe en plein écran (repli)',
        /Quitter/.test(textOf(fsBtn)), textOf(fsBtn));
      fsBtn.onclick(); await tick();
      check('un second clic en SORT',
        /Plein écran/.test(textOf(fsBtn)) && !/Quitter/.test(textOf(fsBtn)), textOf(fsBtn));
    }
  }
}

// ----- Graphe : contrôles en barre latérale --------------------------------
{
  const gr = findAll(run.root, (n) => n.tagName === 'BUTTON' && /Graphe/.test(textOf(n)))[0];
  if (gr) {
    gr.onclick();
    check('les contrôles du graphe sont en barre latérale',
      findAll(run.root, (n) => n.className === 'gside').length === 1);
    const types = findAll(run.root, (n) => String(n.className).indexOf('gs-type') === 0);
    check('les types servent de légende ET de filtre', types.length > 0, types.length + ' type(s)');
    check('le canvas annonce ses effectifs',
      findAll(run.root, (n) => n.className === 'gstat').length === 1);
    if (types.length) {
      types[0].onclick();
      check('décocher un type le retire du graphe',
        findAll(run.root, (n) => String(n.className).indexOf('gs-type') === 0)
          .some((t) => / off$/.test(String(t.className))));
    }
  }
}

// La fiche détaillée doit s'ouvrir EN PAGE (dans le flux) et non en popup
// superposée : on vérifie qu'aucun `.overlay` n'est créé et qu'un retour existe.
{
  // Le libellé d'un onglet vit dans un nœud texte enfant, pas dans textContent.
  // On restreint aux boutons : le conteneur `.tabs` matcherait aussi.
  const entitiesTab = findAll(run.root,
    (n) => n.tagName === 'BUTTON' && /Entités/.test(textOf(n)))[0];
  check('l\'onglet Entités est atteignable', !!entitiesTab);
  if (entitiesTab) entitiesTab.onclick();

  const detailsBtn = findAll(run.root, (n) => n.className === 'details-btn')[0];
  check('les fiches offrent un bouton Détails', !!detailsBtn);
  if (detailsBtn) {
    detailsBtn.onclick();
    const page = findAll(run.root, (n) => n.className === 'detail');
    check('la fiche s\'ouvre en page', page.length === 1, page.length + ' page(s)');
    check('aucune popup superposée n\'est créée',
      findAll(run.root, (n) => n.className === 'overlay').length === 0);
    // `.dtabs` (le conteneur) matcherait aussi un simple préfixe : on cible les boutons.
    check('la page de détail a trois sous-onglets',
      findAll(run.root, (n) => n.tagName === 'BUTTON'
        && String(n.className).split(' ')[0] === 'dtab').length === 3);

    const back = findAll(run.root, (n) => /Retour/.test(textOf(n)) && n.tagName === 'BUTTON')[0];
    check('un retour est proposé', !!back);
    if (back) {
      back.onclick();
      check('le retour quitte la fiche',
        findAll(run.root, (n) => n.className === 'detail').length === 0);
    }
  }
}

console.log('');
if (failures) { console.error(failures + ' test(s) en échec.'); process.exit(1); }
console.log('Tous les tests passent.');

// ---------------------------------------------------------------------------
// DOM minimal : juste assez pour exécuter le premier rendu complet du rapport,
// y compris la mise en page du graphe (canvas 2D bouchonné).
function runReportInFakeDom(model) {
  const noop = () => {};
  const ctx2d = new Proxy({
    measureText: (t) => ({ width: String(t).length * 6 }),
    canvas: { width: 900, height: 500 },
  }, {
    get: (t, k) => (k in t ? t[k] : noop),
    set: () => true,
  });

  const byId = {};

  function makeEl(tag) {
    const el = {
      tagName: String(tag).toUpperCase(),
      children: [], dataset: {},
      // Les variables CSS passent par setProperty : un objet nu ne suffit pas.
      style: {
        setProperty(k, v) { this[k] = v; },
        getPropertyValue(k) { return this[k] || ''; },
        removeProperty(k) { delete this[k]; },
      },
      className: '', textContent: '', title: '', type: '', value: '',
      // `innerHTML = ''` est la façon dont le rapport vide un conteneur : sans
      // ce setter, les enfants s'accumuleraient et le parcours de test
      // retrouverait des nœuds périmés.
      set innerHTML(v) { if (v === '') this.children = []; this._html = v; },
      get innerHTML() { return this._html || ''; },
      clientWidth: 900, clientHeight: 500, width: 900, height: 500,
      offsetWidth: 120, offsetHeight: 40,
      // classList RÉEL, adossé à className : bouchonné, il rendait
      // intestable tout code qui lit l'état d'une classe — comme le bouton
      // plein écran, qui décide en fonction de `contains('fullscreen')`.
      appendChild(c) { this.children.push(c); return c; },
      removeChild(c) { this.children = this.children.filter((x) => x !== c); return c; },
      remove() {}, insertBefore(c) { this.children.push(c); return c; },
      setAttribute: noop, getAttribute: () => null, removeAttribute: noop,
      addEventListener: noop, removeEventListener: noop,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 900, height: 500 }),
      scrollIntoView: noop, focus: noop, click: noop,
      getContext: () => ctx2d,
      querySelector: () => null, querySelectorAll: () => [],
      get parentNode() { return null; },
      // Condition exacte d'une webview VS Code : la méthode EXISTE mais son
      // appel est refusé (iframe sans autorisation). Ne pas la définir du tout
      // testerait un cas qui n'arrive dans aucun navigateur moderne.
      requestFullscreen: () => Promise.reject(new Error('fullscreen refusé')),
    };
    el.classList = {
      _list() { return String(el.className || '').split(/\s+/).filter(Boolean); },
      contains(c) { return this._list().includes(c); },
      add(c) {
        const l = this._list();
        if (!l.includes(c)) { l.push(c); el.className = l.join(' '); }
      },
      remove(c) { el.className = this._list().filter((x) => x !== c).join(' '); },
      toggle(c, force) {
        const want = force === undefined ? !this.contains(c) : !!force;
        if (want) this.add(c); else this.remove(c);
        return want;
      },
    };

    // `id` doit être un accesseur pour alimenter getElementById : sans ça,
    // document.getElementById renvoyait null et le rapport sortait de son rendu
    // sans rien construire — les tests passaient à vide.
    let idVal = '';
    Object.defineProperty(el, 'id', {
      get: () => idVal,
      set: (v) => { idVal = v; if (v) byId[v] = el; },
      enumerable: true,
    });
    return el;
  }

  const appEl = makeEl('div');
  appEl.id = 'app';

  const document = {
    getElementById: (id) => byId[id] || null,
    createElement: (t) => makeEl(t),
    createTextNode: (t) => ({ nodeType: 3, textContent: String(t) }),
    addEventListener: noop, removeEventListener: noop,
    body: makeEl('body'),
    documentElement: Object.assign(makeEl('html'), {
      getAttribute: () => null, setAttribute: noop,
    }),
    querySelector: () => null,
  };

  const sandbox = {
    document,
    DATA: JSON.parse(JSON.stringify(model)),
    window: {
      devicePixelRatio: 1, innerWidth: 1400, innerHeight: 900,
      addEventListener: noop, removeEventListener: noop,
      matchMedia: () => ({ matches: false }),
      scrollTo: noop,
    },
    requestAnimationFrame: noop,
    localStorage: { getItem: () => null, setItem: noop },
    matchMedia: () => ({ matches: false }),
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    setTimeout: noop, clearTimeout: noop,
    console,
  };
  sandbox.globalThis = sandbox;

  const js = fs.readFileSync(
    path.join(ROOT, 'src', 'core', 'reporting', 'assets', 'app.js'), 'utf8');
  try {
    vm.runInNewContext(js, sandbox, { timeout: 20000 });
  } catch (e) {
    return { error: e, tabs: [] };
  }

  // Le rendu initial ne construit QUE l'onglet par défaut. On clique donc
  // chaque onglet : un panneau cassé passerait sinon totalement inaperçu.
  const tabs = [];
  for (const btn of findAll(appEl, (n) => n.className === 'tab' || n.className === 'tab on')) {
    const label = textOf(btn);
    try {
      btn.onclick();
      tabs.push({ label, error: null, nodes: countNodes(appEl) });
    } catch (e) {
      tabs.push({ label, error: e, nodes: 0 });
    }
  }
  return { error: null, tabs, root: appEl };
}

function findAll(node, pred, acc = []) {
  for (const child of node.children || []) {
    if (child && typeof child === 'object') {
      if (pred(child)) acc.push(child);
      findAll(child, pred, acc);
    }
  }
  return acc;
}

function textOf(node) {
  let out = node.textContent || '';
  for (const c of node.children || []) out += textOf(c) || c.textContent || '';
  return out.trim();
}

function countNodes(node) {
  let n = 0;
  for (const c of node.children || []) { n += 1 + countNodes(c); }
  return n;
}
