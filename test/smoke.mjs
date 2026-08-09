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
import { buildWorkspace } from '../src/core/workspace.mjs';
import { runReportInFakeDom, findAll, textOf } from './harness.mjs';

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

// ----- 3 ter) Une alerte doit être VRAIE et actionnable ---------------------
// Un hook n'est jamais « référencé » : Claude Code l'invoque sur un événement.
// Lui reprocher que rien ne le cite était factuellement faux, et le proposer à
// la suppression aurait détruit une configuration active.
{
  const hookOnly = {
    ...m,
    entities: [
      { id: 'w1', kind: 'workflow', source: 'claude', name: 'Stop',
        description: 'Hook de fin de session.', path: '.claude/settings.json',
        meta: [], badges: [], mtime: new Date().toISOString() },
      { id: 's1', kind: 'skill', source: 'claude', name: 'sans-description',
        description: '', path: '.claude/skills/x/SKILL.md',
        meta: [], badges: [], mtime: new Date().toISOString() },
      { id: 'r1', kind: 'spec', source: 'openspec', name: 'jamais-citee',
        description: 'Une spec.', path: 'openspec/specs/x/spec.md',
        meta: [], badges: [], mtime: new Date().toISOString() },
    ],
    graph: { nodes: [], edges: [], edgeTypes: [] },
    totals: { ...m.totals, entities: 3 },
  };

  const r = runReportInFakeDom(hookOnly);
  const gov = findAll(r.root, (n) => /^tab( on)?$/.test(String(n.className)))
    .find((n) => /Gouvernance/.test(textOf(n)));
  if (gov) gov.onclick();
  const reasons = findAll(r.root, (n) => n.className === 'ac-reason').map(textOf);

  check('un hook n\'est jamais accusé de n\'être pas référencé',
    !reasons.some((t) => /référence/i.test(t) && /Stop/.test(t)) &&
    !findAll(r.root, (n) => n.className === 'acard info')
      .some((c) => /Stop/.test(textOf(c)) && /référence/i.test(textOf(c))),
    reasons.join(' | '));

  check('une skill sans description est signalée',
    reasons.some((t) => /description/i.test(t)), reasons.join(' | '));

  check('une spec que rien ne cite est signalée',
    reasons.some((t) => /référence/i.test(t)), reasons.join(' | '));

  // Le reproche doit être vérifiable et suivi d'une action.
  check('chaque alerte expose ses constats',
    findAll(r.root, (n) => n.className === 'ac-fact').length > 0);
  check('chaque alerte dit quoi faire',
    findAll(r.root, (n) => n.className === 'ac-todo').length > 0);

  // Aucune recommandation ne doit proposer de supprimer un objet auto-activé.
  const recos = findAll(r.root, (n) => n.className === 'reco').map(textOf);
  check('aucune recommandation ne propose de supprimer un hook',
    !recos.some((t) => /supprimer/i.test(t)), recos.join(' | '));

  // Un change CONTIENT ses tâches : il a des arêtes sortantes et personne ne le
  // cite, par construction. Exiger une arête entrante le signalait à tort.
  const withTree = {
    ...m,
    entities: [
      { id: 'c1', kind: 'change', source: 'openspec', name: 'add-truc',
        description: 'Un change.', path: 'openspec/changes/add-truc/proposal.md',
        meta: [], badges: [], mtime: new Date().toISOString() },
      { id: 't1', kind: 'task', source: 'openspec', name: '1. Faire',
        description: '', path: 'openspec/changes/add-truc/tasks.md',
        meta: [], badges: [], mtime: new Date().toISOString() },
    ],
    graph: { nodes: [], edges: [{ s: 'c1', t: 't1', type: 'contains' }], edgeTypes: [] },
    totals: { ...m.totals, entities: 2 },
  };
  const r2 = runReportInFakeDom(withTree);
  const gov2 = findAll(r2.root, (n) => /^tab( on)?$/.test(String(n.className)))
    .find((n) => /Gouvernance/.test(textOf(n)));
  if (gov2) gov2.onclick();
  const reasons2 = findAll(r2.root, (n) => n.className === 'ac-reason').map(textOf);
  check('un change qui contient ses tâches n\'est pas dit orphelin',
    !reasons2.some((t) => /référence/i.test(t)), reasons2.join(' | '));
}

// ----- 3 quater) La traçabilité ne punit pas les usages légitimes -----------
// Toutes les skills ne touchent pas du code, et ce n'est pas un défaut :
//   · une skill qui pilote Jira via MCP a une cible distante VÉRIFIABLE ;
//   · une skill de procédure (traiter des images, relire une PR) n'annonce
//     aucune cible — lui reprocher un lien absent serait un reproche inventé ;
//   · seule une cible ANNONCÉE mais invérifiable est un vrai défaut.
{
  const ent = (o) => ({ source: 'claude', meta: [], badges: [], mtime: new Date().toISOString(),
    description: 'x', links: { code: [], files: [], tools: [], wiki: [], targets: [] }, ...o });

  const mixed = {
    ...m,
    entities: [
      ent({ id: 'mcp1', kind: 'mcp', name: 'jira', path: '.mcp.json' }),
      // Pilote un service distant déclaré → traçable.
      ent({ id: 'sk1', kind: 'skill', name: 'jira-ticket', path: '.claude/skills/a/SKILL.md',
        links: { code: [], files: [], tools: ['jira'], wiki: [], targets: [] } }),
      // Procédure pure : n'annonce rien → hors périmètre.
      ent({ id: 'sk2', kind: 'skill', name: 'traiter-images', path: '.claude/skills/b/SKILL.md' }),
      // Annonce un chemin qui n'existe pas → défaut réel.
      ent({ id: 'sk3', kind: 'skill', name: 'casse', path: '.claude/skills/c/SKILL.md',
        links: { code: ['src/nexistepas.ts'], files: [], tools: [], wiki: [], targets: [] } }),
    ],
    graph: { nodes: [], edges: [{ s: 'sk1', t: 'mcp1', type: 'tool' }], edgeTypes: [] },
    totals: { ...m.totals, entities: 4 },
  };

  const r3 = runReportInFakeDom(mixed);
  const gov3 = findAll(r3.root, (n) => /^tab( on)?$/.test(String(n.className)))
    .find((n) => /Gouvernance/.test(textOf(n)));
  if (gov3) gov3.onclick();
  const recos3 = findAll(r3.root, (n) => n.className === 'reco').map(textOf);

  // 2 acteurs annoncent une cible (sk1, sk3) ; 1 seule se vérifie → 50 %.
  const pct = findAll(r3.root, (n) => n.className === 'sp-pct').map(textOf);
  check('une skill pilotant un MCP déclaré compte comme traçable',
    pct.includes('50%'), pct.join(' | '));

  check('une skill de procédure n\'apparaît dans aucune recommandation',
    !recos3.some((t) => /traiter-images/.test(t)), recos3.join(' | '));

  check('un chemin cité introuvable est signalé comme tel',
    recos3.some((t) => /chemins? cités?/i.test(t)), recos3.join(' | '));
}

// ----- 3 bis) Le rapport signale les projets voisins ------------------------
// Le rapport HTML se lit hors de VS Code : sans cette note, son score se lit
// comme celui de tout le dossier alors qu'il ne couvre qu'un projet.
{
  // Le harnais clique TOUS les onglets et s'arrête sur le dernier : il faut
  // revenir sur la vue d'ensemble, sinon l'assertion — et sa négation —
  // portent sur un onglet où la note n'a jamais eu à apparaître.
  const overview = (r) => {
    const t = findAll(r.root, (n) => /^tab( on)?$/.test(String(n.className)))
      .find((n) => /Vue d'ensemble/.test(textOf(n)));
    if (t) t.onclick();
    return r;
  };

  const near = overview(runReportInFakeDom({ ...m, nearby: { count: 5, others: ['x', 'y'] } }));
  check('le rapport signale les projets voisins',
    !near.error && findAll(near.root, (n) => n.className === 'near-note').length === 1,
    near.error ? near.error.stack : 'aucune note');
  check('la note donne la commande exacte',
    findAll(near.root, (n) => n.className === 'near-cmd')
      .some((n) => /--workspace/.test(textOf(n))));
  check('sans voisin, aucune note',
    findAll(overview(run).root, (n) => n.className === 'near-note').length === 0);
}

// ----- 4) Vue portefeuille (workspace) -------------------------------------
// Le rapport workspace est un AUTRE produit : d'autres onglets, d'autres chiffres.
// Rendu par le même app.js, il doit donc être exercé séparément.
runWorkspaceChecks();

console.log('');
if (failures) { console.error(failures + ' test(s) en échec.'); process.exit(1); }
console.log('Tous les tests passent.');

function runWorkspaceChecks() {
  const ws = buildWorkspace({ root: path.join(ROOT, 'examples') });
  if (!ws) { check('un workspace est constructible depuis examples/', false); return; }
  console.log('\nrapport workspace (examples/)');
  check('le modèle est marqué workspace', ws.workspace === true);

  const w = runReportInFakeDom(ws);
  check('le rapport workspace s\'exécute', !w.error, w.error && w.error.stack);
  if (w.error) return;

  const labels = w.tabs.map((t) => t.label);
  check('les onglets sont ceux du portefeuille, pas ceux d\'un projet',
    labels.some((l) => /Portefeuille/.test(l)) && !labels.some((l) => /Timeline/.test(l)),
    labels.join(' | '));
  for (const t of w.tabs) {
    check('onglet « ' + t.label + ' » se construit', !t.error && t.nodes > 5,
      t.error ? t.error.stack : t.nodes + ' nœuds');
  }

  // Une fiche projet doit MENER quelque part : sans navigation, le rapport
  // workspace ne serait qu'un tableau de bord en cul-de-sac.
  const port = findAll(w.root, (n) => n.tagName === 'BUTTON' && /Portefeuille/.test(textOf(n)))[0];
  if (port) port.onclick();
  const cards = findAll(w.root, (n) => n.className === 'proj-card');
  check('une fiche par projet', cards.length === ws.totals.projects,
    cards.length + ' fiche(s) pour ' + ws.totals.projects + ' projet(s)');

  if (cards.length) {
    cards[0].onclick();
    // On regarde les ONGLETS, pas tous les boutons : le retour du fil d'Ariane
    // s'appelle lui aussi « ← Portefeuille » et fausserait le test.
    const inside = findAll(w.root, (n) => /^tab( on)?$/.test(String(n.className))).map(textOf);
    check('ouvrir un projet donne les onglets du projet',
      inside.some((l) => /Timeline/.test(l)) && !inside.some((l) => /Portefeuille/.test(l)),
      inside.join(' | '));

    const back = findAll(w.root, (n) => n.className === 'crumb-back')[0];
    check('un fil d\'Ariane ramène au portefeuille', !!back);
    if (back) {
      back.onclick();
      check('le retour restaure la vue portefeuille',
        findAll(w.root, (n) => n.className === 'proj-card').length === cards.length);
    }
  }
}
