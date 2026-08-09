// core/workspace.mjs — cartographie d'un ENSEMBLE de projets.
//
// Un rapport workspace n'est pas un rapport plus gros : c'est un produit
// différent. On ne montre pas 500 entités, on montre N projets et ce qui les
// distingue. La valeur est dans l'ÉCART, pas dans le cumul.
//
// Ce que seul ce niveau peut révéler :
//   • la même skill dans trois projets, avec trois contenus qui ont divergé
//   • le même serveur MCP déclaré différemment selon les projets
//   • une convention présente partout sauf à un endroit
//   • des écarts de maturité entre équipes

import path from 'node:path';
import { isDir, listDir, relFrom } from './fs.mjs';
import { PLUGINS, runPlugins } from './registry.mjs';
import { buildGraph } from './graph.mjs';
import { buildTrees } from './explorer.mjs';
import { buildModel } from './model.mjs';

// Dossiers dans lesquels il ne sert à rien de descendre.
const WS_SKIP = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', 'target', 'vendor',
  '__pycache__', '.venv', 'venv', '.next', '.nuxt', 'coverage', '.shots',
]);
const WS_MAX_DEPTH = 3;

// Un dossier est un projet dès qu'un adaptateur y détecte quelque chose.
function wsHasEcosystem(root) {
  for (const plugin of PLUGINS) {
    try { if ((plugin.detect({ root }) || []).length) return true; }
    catch { /* un adaptateur en échec ne doit pas bloquer la découverte */ }
  }
  return false;
}

// Découverte en profondeur, avec UNE règle : on s'arrête au premier écosystème
// rencontré sur un chemin. Les sous-dossiers d'un projet ne sont pas des
// projets — sinon `mon-projet/packages/x` deviendrait une entrée distincte.
export function discoverProjects(root, maxDepth = WS_MAX_DEPTH) {
  const found = [];

  (function walk(dir, depth) {
    if (depth > maxDepth) return;
    for (const name of listDir(dir)) {
      if (WS_SKIP.has(name) || name.startsWith('.')) continue;
      const sub = path.join(dir, name);
      if (!isDir(sub)) continue;
      if (wsHasEcosystem(sub)) { found.push(sub); continue; }  // on ne descend pas
      walk(sub, depth + 1);
    }
  })(root, 1);

  // La racine elle-même peut porter une configuration partagée : c'est un
  // projet à part entière, pas un conteneur neutre.
  const roots = wsHasEcosystem(root) ? [root, ...found] : found;

  return roots.map((r) => ({
    id: relFrom(root, r) || path.basename(r),
    name: path.basename(r),
    rel: relFrom(root, r) || '.',
    root: r,
  }));
}

// À l'échelle du workspace, le contenu INTÉGRAL de chaque entité n'est pas ce
// qu'on regarde — et il pèse 40 % du rapport. On garde un aperçu suffisant
// pour reconnaître une entité en la survolant ; le document complet reste
// accessible via le rapport du projet lui-même.
const WS_PREVIEW_CHARS = 1500;

function wsTrim(model) {
  for (const e of model.entities) {
    // L'empreinte est figée AVANT toute troncature : la note d'aperçu contient
    // le chemin du projet, donc deux copies identiques paraîtraient divergentes
    // si on la comparait après coup.
    e.print = wsFingerprint(e.content);
    if (e.content && e.content.length > WS_PREVIEW_CHARS) {
      e.content = e.content.slice(0, WS_PREVIEW_CHARS)
        + '\n\n*(aperçu — rapport complet du projet : `ai-map ' + (model.rel || '.') + '`)*';
      e.clipped = true;
    }
    // Le plan d'un document est un détail de projet, pas de portefeuille.
    if (e.outline && e.outline.length) e.outline = [];
  }
  // Les arborescences de fichiers non plus : chaque projet a la sienne dans
  // son propre rapport.
  model.trees = [];
  return model;
}

// Analyse complète d'un projet, réutilisant exactement le pipeline mono-projet.
function wsAnalyse(entry) {
  const ctx = { root: entry.root };
  const scan = runPlugins(ctx);
  const graph = buildGraph(ctx, scan.entities);
  const model = buildModel(ctx, scan, graph, buildTrees(ctx, scan.roots));
  model.rel = entry.rel;
  return { ...entry, model: wsTrim(model), errors: scan.errors };
}

// Tous les types ne se comparent PAS d'un projet à l'autre.
//
// Un `CLAUDE.md` par projet doit différer — c'est de la mémoire propre au
// projet, pas une copie qui a dérivé. Deux tâches nommées « 3. Tests » dans
// deux projets sont une collision de titre, pas un artefact partagé.
//
// Seuls se comparent les objets qu'on COPIE délibérément d'un projet à
// l'autre : une skill, une commande, un agent, une règle, un workflow, une
// déclaration MCP. Eux sont censés rester alignés — leur divergence est une
// information.
const WS_COMPARABLE = new Set(['skill', 'command', 'agent', 'rule', 'prompt', 'workflow', 'mcp']);

const wsKey = (e) => e.kind + '|' + String(e.name).trim().toLowerCase();

// Empreinte de contenu, pour distinguer une copie conforme d'une copie qui a
// dérivé. Somme simple : on ne cherche pas la résistance cryptographique, juste
// à savoir si deux textes sont le même texte.
function wsFingerprint(text) {
  let h = 0;
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + ':' + s.length;
}

// ----- Ce qui n'existe qu'au niveau workspace ------------------------------
function wsDivergences(projects) {
  const byKey = new Map();
  for (const p of projects) {
    for (const e of p.model.entities) {
      if (!WS_COMPARABLE.has(e.kind)) continue;
      const k = wsKey(e);
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push({ project: p.id, entity: e, print: e.print });
    }
  }

  const shared = [];
  for (const [key, list] of byKey) {
    // Un même projet peut porter deux entités homonymes : on compte les
    // PROJETS distincts, pas les occurrences.
    const projectsHit = [...new Set(list.map((x) => x.project))];
    if (projectsHit.length < 2) continue;

    const prints = new Set(list.map((x) => x.print));
    shared.push({
      key,
      kind: list[0].entity.kind,
      name: list[0].entity.name,
      projects: projectsHit,
      diverged: prints.size > 1,
      occurrences: list.map((x) => ({
        project: x.project, path: x.entity.path, print: x.print,
      })),
    });
  }

  // Le plus grave d'abord : ce qui a divergé, puis ce qui est le plus répandu.
  shared.sort((a, b) =>
    (b.diverged - a.diverged) || (b.projects.length - a.projects.length) ||
    a.name.localeCompare(b.name));

  // Une convention adoptée par la MAJORITÉ des projets, mais pas par tous :
  // les manquants sont les exceptions à interroger. Exiger « tous sauf un »
  // était si strict que la règle ne se déclenchait jamais.
  const gaps = [];
  if (projects.length >= 3) {
    const all = projects.map((p) => p.id);
    const quorum = Math.ceil(projects.length / 2);
    for (const s of shared) {
      if (s.projects.length < quorum) continue;
      const missing = all.filter((id) => !s.projects.includes(id));
      if (missing.length) gaps.push({ ...s, missing });
    }
  }

  return {
    duplicated: shared.filter((s) => !s.diverged),
    diverged: shared.filter((s) => s.diverged),
    gaps,
  };
}

// ----- Modèle workspace ----------------------------------------------------
export function buildWorkspace(ctx, maxDepth) {
  const entries = discoverProjects(ctx.root, maxDepth);
  if (!entries.length) return null;

  const projects = entries.map(wsAnalyse);
  const divergences = wsDivergences(projects);

  const summaries = projects.map((p) => {
    const cross = (p.model.graph.edges || []).filter((e) => e.cross).length;
    const alerts = p.model.entities.filter((e) =>
      (e.badges || []).some((b) => b.tone === 'warn' || b.tone === 'danger')).length;
    return {
      id: p.id, name: p.name, rel: p.rel,
      entities: p.model.totals.entities,
      edges: p.model.totals.edges,
      cross,
      alerts,
      sources: p.model.sources.filter((s) => s.detected).map((s) => s.id),
      kinds: p.model.kinds.map((k) => ({ key: k.key, count: k.count })),
    };
  });

  return {
    workspace: true,
    project: path.basename(ctx.root) || 'workspace',
    root: ctx.root,
    generatedAt: new Date().toISOString(),
    projects: summaries,
    // Le vocabulaire des types est global, pas propre à un projet : la vue
    // portefeuille en a besoin pour nommer et colorer une divergence sans
    // avoir à ouvrir le modèle d'un projet au hasard.
    kindDict: projects[0].model.kindDict,
    // Le modèle complet de chaque projet reste disponible : c'est lui qui
    // alimente la vue détaillée quand on ouvre un projet.
    models: Object.fromEntries(projects.map((p) => [p.id, p.model])),
    divergences,
    errors: projects.flatMap((p) => p.errors.map((e) => ({ ...e, project: p.id }))),
    totals: {
      projects: summaries.length,
      entities: summaries.reduce((n, s) => n + s.entities, 0),
      edges: summaries.reduce((n, s) => n + s.edges, 0),
      alerts: summaries.reduce((n, s) => n + s.alerts, 0),
      duplicated: divergences.duplicated.length,
      diverged: divergences.diverged.length,
      gaps: divergences.gaps.length,
      // Ce qui demande une action, toutes familles confondues. C'est ce chiffre
      // que l'interface affiche : compter les seules divergences strictes
      // laissait les écarts de convention invisibles en en-tête.
      misaligned: divergences.diverged.length + divergences.gaps.length,
    },
  };
}
