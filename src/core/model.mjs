// core/model.mjs — LE MODÈLE UNIVERSEL.
//
// C'est la pièce centrale d'AI-MAP : peu importe l'écosystème d'origine
// (Claude Code, OpenSpec, Cursor, Copilot…), tout est converti en `Entity`.
// Un adaptateur (plugins/*) ne produit QUE des Entity ; il n'a aucune idée de
// la façon dont elles seront affichées, reliées ou auditées.

import path from 'node:path';
import { relFrom, mtimeOf } from './fs.mjs';
import { slugify } from './parser.mjs';

// ----- Entités universelles (vision §Entités Universelles) -----------------
// `key` est l'identifiant technique ; le reste pilote l'affichage.
export const KINDS = [
  { key: 'skill',     label: 'Skills',          one: 'Skill',         icon: '🧩', color: '#6366f1', desc: 'Procédures packagées qu\'un agent peut suivre.' },
  { key: 'command',   label: 'Commandes',       one: 'Commande',      icon: '⌘',  color: '#0ea5e9', desc: 'Actions déclenchables explicitement (slash-commandes, prompts).' },
  { key: 'agent',     label: 'Agents',          one: 'Agent',         icon: '🤖', color: '#8b5cf6', desc: 'Exécutants spécialisés, avec leurs propres outils.' },
  { key: 'rule',      label: 'Règles',          one: 'Règle',         icon: '📏', color: '#10b981', desc: 'Conventions et contraintes imposées à l\'IA.' },
  { key: 'prompt',    label: 'Prompts',         one: 'Prompt',        icon: '💬', color: '#ec4899', desc: 'Gabarits de prompt réutilisables.' },
  { key: 'spec',      label: 'Spécifications',  one: 'Spécification', icon: '📐', color: '#14b8a6', desc: 'Capacités spécifiées qui pilotent le projet.' },
  { key: 'requirement', label: 'Exigences',     one: 'Exigence',      icon: '✅', color: '#22c55e', desc: 'Exigences unitaires extraites des spécifications.' },
  { key: 'change',    label: 'Changes',         one: 'Change',        icon: '🔀', color: '#f43f5e', desc: 'Propositions d\'évolution en cours ou archivées.' },
  { key: 'task',      label: 'Tâches',          one: 'Tâche',         icon: '☑️', color: '#84cc16', desc: 'Lots de travail rattachés à un change.' },
  { key: 'workflow',  label: 'Workflows',       one: 'Workflow',      icon: '🔁', color: '#a855f7', desc: 'Enchaînements automatisés (hooks, CI, pipelines).' },
  { key: 'knowledge', label: 'Connaissance',    one: 'Connaissance',  icon: '📚', color: '#eab308', desc: 'Contexte projet partagé avec l\'IA.' },
  { key: 'memory',    label: 'Mémoire',         one: 'Mémoire',       icon: '🧠', color: '#f59e0b', desc: 'Instructions chargées à chaque session.' },
  { key: 'config',    label: 'Configurations',  one: 'Configuration', icon: '⚙️', color: '#64748b', desc: 'Réglages, permissions, hooks.' },
  { key: 'mcp',       label: 'Serveurs MCP',    one: 'Serveur MCP',   icon: '🔌', color: '#06b6d4', desc: 'Serveurs MCP déclarés et leurs outils.' },
  { key: 'tool',      label: 'Outils',          one: 'Outil',         icon: '🔧', color: '#f97316', desc: 'Outils référencés par les agents et commandes.' },
  { key: 'document',  label: 'Documents',       one: 'Document',      icon: '📄', color: '#94a3b8', desc: 'Documents rattachés (design, notes, décisions).' },
  { key: 'code',      label: 'Code source',     one: 'Code',          icon: '📁', color: '#38bdf8', desc: 'Fichiers de code réellement cités par les entités IA.' },
];

const KIND_BY_KEY = new Map(KINDS.map((k) => [k.key, k]));
export function kindMeta(key) {
  return KIND_BY_KEY.get(key) || { key, label: key, icon: '•', color: '#94a3b8', desc: '' };
}

// ----- Écosystèmes sources (vision §Sources Supportées) --------------------
// `status: 'v1'` = adaptateur livré ; 'planned' = prévu (affiché en grisé dans
// le tableau de bord, pour que l'utilisateur sache ce que l'outil ne voit pas
// encore plutôt que de croire que le projet n'a rien).
export const SOURCES = [
  { id: 'claude',   label: 'Claude Code',    icon: '🟣', color: '#d97757', status: 'v1' },
  { id: 'openspec', label: 'OpenSpec',       icon: '📘', color: '#14b8a6', status: 'v1' },
  { id: 'cursor',   label: 'Cursor',         icon: '🖱️', color: '#3b82f6', status: 'v2' },
  { id: 'copilot',  label: 'GitHub Copilot', icon: '🐙', color: '#6e7681', status: 'v2' },
  { id: 'roo',      label: 'Roo Code',       icon: '🦘', color: '#f59e0b', status: 'v2' },
  { id: 'windsurf', label: 'Windsurf',       icon: '🌊', color: '#0ea5e9', status: 'v2' },
  { id: 'mcp',      label: 'MCP universel',  icon: '🔌', color: '#06b6d4', status: 'v2' },
  { id: 'git',      label: 'Git',            icon: '🌿', color: '#84cc16', status: 'planned' },
];

const SOURCE_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));
export function sourceMeta(id) {
  return SOURCE_BY_ID.get(id) || { id, label: id, icon: '•', color: '#94a3b8', status: 'unknown' };
}

// ----- Fabrique d'entités --------------------------------------------------
// Contrat unique produit par TOUS les adaptateurs.
//
//   source      identifiant de l'écosystème d'origine ('claude', 'openspec'…)
//   kind        clé d'entité universelle (voir KINDS)
//   name        nom lisible
//   description résumé d'une ligne
//   file        chemin ABSOLU du fichier porteur (optionnel : entité dérivée)
//   parent      id de l'entité conteneur (Spec → Requirement, Change → Task)
//   meta        badges [{k, v}]
//   outline     plan [{level, text}]
//   links       indices de liaison bruts, résolus plus tard par core/graph :
//                 files   chemins relatifs cités en Markdown
//                 wiki    références [[nom]]
//                 tools   noms d'outils (allowed-tools…)
//                 code    chemins de fichiers cités en code inline
//                 targets ids d'entités visés explicitement
//   content     contenu complet affiché dans la fiche détail
//   badges      étiquettes d'état ({text, tone}) : archivé, en cours…
//   status      état de cycle de vie, quand la notion existe pour ce type
//               (change OpenSpec) : proposed | active | done | archived
export function makeEntity(ctx, e) {
  const rel = e.file ? relFrom(ctx.root, e.file) : null;
  const id = e.id || (e.source + ':' + e.kind + ':' + slugify(e.slug || e.name));
  return {
    id,
    source: e.source,
    kind: e.kind,
    name: e.name,
    description: e.description || 'Aucune description.',
    path: rel,
    file: e.file || null,
    // Date de dernière modification du fichier porteur : seule source de
    // chronologie disponible sans dépendre de Git (adaptateur prévu en V2).
    mtime: e.file ? mtimeOf(e.file) : null,
    parent: e.parent || null,
    meta: e.meta || [],
    outline: e.outline || [],
    badges: e.badges || [],
    status: e.status || null,
    // `tone` résume l'urgence de l'entité pour l'affichage : la pire de ses
    // étiquettes. Calculé ici pour que toutes les vues colorent pareil.
    tone: worstTone(e.badges),
    links: {
      files: (e.links && e.links.files) || [],
      wiki: (e.links && e.links.wiki) || [],
      tools: (e.links && e.links.tools) || [],
      code: (e.links && e.links.code) || [],
      targets: (e.links && e.links.targets) || [],
    },
    content: e.content || '',
  };
}

// Un même serveur MCP déclaré dans plusieurs écosystèmes (ex. `.cursor/mcp.json`
// ET `mcp.yaml`) est une source classique de dérive : les deux copies finissent
// par diverger. On garde les deux entités — c'est le fait qu'il y en ait deux
// qui est l'information — mais on les signale.
function markCrossSourceDuplicates(entities) {
  const bySlug = new Map();
  for (const e of entities) {
    if (e.kind !== 'mcp') continue;
    const key = String(e.name).toLowerCase();
    if (!bySlug.has(key)) bySlug.set(key, []);
    bySlug.get(key).push(e);
  }
  for (const group of bySlug.values()) {
    const sources = new Set(group.map((e) => e.source));
    if (sources.size < 2) continue;
    for (const e of group) {
      const others = [...sources].filter((s) => s !== e.source).map((s) => sourceMeta(s).label);
      e.badges = [...(e.badges || []),
        { text: 'aussi déclaré : ' + others.join(', '), tone: 'warn' }];
    }
  }
}

// Ordre de gravité : ce qui doit attirer l'œil en premier.
const TONE_RANK = { danger: 0, warn: 1, ok: 2, info: 3, muted: 4 };
function worstTone(badges) {
  let best = null;
  for (const b of badges || []) {
    const t = b && b.tone;
    if (!t || TONE_RANK[t] === undefined) continue;
    if (best === null || TONE_RANK[t] < TONE_RANK[best]) best = t;
  }
  return best;
}

// Statuts de cycle de vie et leur couleur, partagés par toutes les vues.
export const STATUSES = [
  { key: 'proposed', label: 'Proposé',  color: '#64748b' },
  { key: 'planned',  label: 'Planifié', color: '#0ea5e9' },
  { key: 'active',   label: 'En cours', color: '#f59e0b' },
  { key: 'done',     label: 'Terminé',  color: '#22c55e' },
  { key: 'archived', label: 'Archivé',  color: '#6b7280' },
];

// ----- Assemblage du modèle final ------------------------------------------
// `scan` vient de core/registry, `graph` de core/graph, `trees` de core/explorer.
export function buildModel(ctx, scan, graph, trees) {
  markCrossSourceDuplicates(scan.entities);
  // Des badges ont pu être ajoutés après la fabrication des entités : le ton
  // doit être recalculé, sinon un doublon MCP ne serait pas mis en évidence.
  for (const e of scan.entities) e.tone = worstTone(e.badges);

  const byKind = new Map();
  const bySource = new Map();
  for (const e of scan.entities) {
    byKind.set(e.kind, (byKind.get(e.kind) || 0) + 1);
    bySource.set(e.source, (bySource.get(e.source) || 0) + 1);
  }

  // On n'expose que les types réellement présents : un tableau de bord rempli
  // de zéros n'apprend rien.
  const kinds = KINDS.filter((k) => byKind.has(k.key))
    .map((k) => ({ ...k, count: byKind.get(k.key) }));

  const sources = SOURCES.map((s) => ({
    ...s,
    detected: scan.detected.has(s.id),
    roots: scan.roots.get(s.id) || [],
    count: bySource.get(s.id) || 0,
  }));

  // Dictionnaire de TOUS les types (pas seulement ceux présents) : le graphe
  // crée des nœuds dérivés (outils) dont le type peut n'avoir aucune entité.
  const kindDict = {};
  for (const k of KINDS) kindDict[k.key] = { label: k.label, one: k.one, icon: k.icon, color: k.color };

  return {
    project: path.basename(ctx.root) || 'projet',
    root: ctx.root,
    generatedAt: new Date().toISOString(),
    sources,
    kinds,
    kindDict,
    statuses: STATUSES,
    entities: scan.entities,
    graph,
    trees,
    totals: {
      entities: scan.entities.length,
      sources: sources.filter((s) => s.detected).length,
      edges: graph.edges.length,
      kinds: kinds.length,
    },
  };
}