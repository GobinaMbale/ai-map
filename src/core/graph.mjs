// core/graph.mjs — graphe transverse.
//
// C'est ici que se joue la valeur différenciante d'AI-MAP : relier des entités
// venues d'écosystèmes qui, sur le disque, s'ignorent complètement.
//
//   Requirement OpenSpec → Skill Claude → Outil MCP → Code source
//
// Types d'arêtes :
//   contains  conteneur → contenu      (Spec → Exigence, Change → Tâche)
//   delta     change → spécification   (quelle capacité ce change modifie)
//   ref       lien Markdown ou [[wiki]] résolu vers une entité connue
//   tool      entité → outil / serveur MCP déclaré
//   mention   citation nominative reconstruite depuis le contenu
//
// Chaque arête porte `cross: true` quand ses deux extrémités appartiennent à
// des écosystèmes différents — ce sont ces arêtes-là qui portent l'analyse
// d'impact transverse, tous types confondus.

import path from 'node:path';
import { normPath, isFile, relFrom } from './fs.mjs';
import { kindMeta, sourceMeta } from './model.mjs';

// Types d'arêtes exposés à l'interface (ordre = ordre d'affichage des filtres).
export const EDGE_TYPES = [
  { type: 'contains', label: 'Contient',    verb: 'contient',   color: '#94a3b8', dashed: false },
  { type: 'delta',    label: 'Impacte',     verb: 'impacte',    color: '#f43f5e', dashed: false },
  { type: 'ref',      label: 'Référence',   verb: 'référence',  color: '#64748b', dashed: false },
  { type: 'tool',     label: 'Utilise',     verb: 'utilise',    color: '#f97316', dashed: true },
  { type: 'mention',  label: 'Cite',        verb: 'cite',       color: '#6366f1', dashed: true },
  { type: 'code',     label: 'Code source', verb: 'touche',     color: '#0891b2', dashed: true },
];

// Extensions considérées comme du code. Sans cette liste, un `README.md` cité
// deviendrait un nœud « code », ce qui serait faux.
const CODE_EXT = new Set([
  'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'vue', 'svelte',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'kts', 'scala', 'swift', 'dart',
  'php', 'cs', 'c', 'h', 'cpp', 'hpp', 'lua', 'pl', 'r', 'ex', 'exs',
  'sh', 'bash', 'zsh', 'ps1', 'bat', 'sql',
  'json', 'yml', 'yaml', 'toml', 'ini', 'env', 'cfg', 'conf',
  'html', 'css', 'scss', 'less', 'gradle', 'tf', 'proto',
]);
const MAX_CODE_REFS_PER_ENTITY = 30;

// Une entité citée doit être « nommable » : trop court ou trop générique et on
// génère du bruit (« build », « test » apparaissent partout).
const MENTION_KINDS = new Set(['skill', 'command', 'agent', 'mcp', 'spec', 'change']);
const MAX_MENTIONS_PER_ENTITY = 12;

export function buildGraph(ctx, entities) {
  const nodes = [];
  const edges = [];
  const seen = new Set();

  const byId = new Map();
  const byFile = new Map();   // fichier absolu normalisé → id d'entité conteneur
  const bySlug = new Map();   // nom / nom de fichier → id
  const byMcpName = new Map();
  const toolNodes = new Map();

  // `pairs` retient les couples déjà reliés, quel que soit le type : une
  // citation nominative n'apporte rien si un lien explicite existe déjà.
  const pairs = new Set();
  const pairKey = (a, b) => (a < b ? a + '\u0001' + b : b + '\u0001' + a);

  const sourceOfNode = new Map();

  const addEdge = (s, t, type) => {
    if (!s || !t || s === t) return;
    const key = s + '|' + t + '|' + type;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.add(pairKey(s, t));
    // `cross` = la relation franchit une frontière d'ÉCOSYSTÈME. Les nœuds
    // dérivés (outils, code source) sont exclus : ce ne sont pas des
    // écosystèmes, et les compter gonflerait l'indicateur sans rien dire.
    const ss = sourceOfNode.get(s);
    const ts = sourceOfNode.get(t);
    const derived = (x) => x === 'tool' || x === 'code';
    const cross = ss !== ts && !derived(ss) && !derived(ts);
    edges.push({ s, t, type, cross });
  };

  // ----- 1) Un nœud par entité --------------------------------------------
  for (const e of entities) {
    byId.set(e.id, e);
    sourceOfNode.set(e.id, e.source);
    nodes.push({
      id: e.id, label: e.name, kind: e.kind, source: e.source,
      kindColor: kindMeta(e.kind).color,
      sourceColor: sourceMeta(e.source).color,
      path: e.path || '',
    });

    // Le conteneur gagne l'index de fichier : plusieurs entités partagent un
    // même fichier (spec + ses exigences), on veut résoudre vers le parent.
    if (e.file) {
      const key = normPath(e.file);
      if (!e.parent || !byFile.has(key)) byFile.set(key, e.id);
    }
    for (const alias of aliasesOf(e)) {
      if (!bySlug.has(alias)) bySlug.set(alias, e.id);
    }
    if (e.kind === 'mcp') byMcpName.set(e.name.toLowerCase(), e.id);
  }

  // ----- 2) Arêtes structurelles déclarées par les adaptateurs -------------
  for (const e of entities) {
    if (e.parent && byId.has(e.parent)) addEdge(e.parent, e.id, 'contains');
    for (const target of e.links.targets) {
      if (byId.has(target)) addEdge(e.id, target, 'delta');
    }
  }

  // ----- 3) Liens Markdown et [[wiki]] -------------------------------------
  for (const e of entities) {
    if (!e.file) continue;
    const dir = path.dirname(e.file);
    for (const rel of e.links.files) {
      const hit = byFile.get(normPath(path.resolve(dir, rel)));
      if (hit) addEdge(e.id, hit, 'ref');
    }
    for (const w of e.links.wiki) {
      const hit = bySlug.get(w.toLowerCase());
      if (hit) addEdge(e.id, hit, 'ref');
    }
  }

  // ----- 4) Outils et serveurs MCP ----------------------------------------
  for (const e of entities) {
    for (const raw of e.links.tools) {
      const name = String(raw).trim();
      if (!name) continue;
      // Un outil qui correspond à un serveur MCP déclaré pointe vers ce
      // serveur plutôt que vers un nœud d'outil anonyme.
      const mcpHit = byMcpName.get(name.toLowerCase());
      if (mcpHit) { addEdge(e.id, mcpHit, 'tool'); continue; }

      const tid = 'tool:' + name;
      if (!toolNodes.has(tid)) {
        toolNodes.set(tid, true);
        sourceOfNode.set(tid, 'tool');
        nodes.push({
          id: tid, label: name, kind: 'tool', source: 'tool',
          kindColor: kindMeta('tool').color, sourceColor: kindMeta('tool').color, path: '',
        });
      }
      addEdge(e.id, tid, 'tool');
    }
  }

  // ----- 5) Code source ----------------------------------------------------
  // Dernière patte de la chaîne « Exigence → Skill → Outil MCP → Code ». Un
  // nœud n'est créé que si le fichier EXISTE vraiment : AI-MAP n'invente aucun
  // lien. Ces nœuds sont dérivés (comme les outils) et ne comptent donc pas
  // comme des entités — la carte ne se noie pas sous le code.
  const codeNodes = new Map();
  const rootKey = normPath(ctx.root);

  for (const e of entities) {
    if (!e.file) continue;
    const dir = path.dirname(e.file);
    let count = 0;
    for (const rel of [...e.links.code, ...e.links.files]) {
      if (count >= MAX_CODE_REFS_PER_ENTITY) break;

      // Relatif au fichier citant, sinon relatif à la racine du projet.
      let abs = path.resolve(dir, rel);
      if (!isFile(abs)) {
        abs = path.resolve(ctx.root, rel);
        if (!isFile(abs)) continue;
      }

      // Confinement : une référence `../../secret` ne doit jamais créer de nœud.
      const key = normPath(abs);
      if (key !== rootKey && !key.startsWith(rootKey + '/')) continue;

      // Déjà une entité IA (ex. .claude/settings.json) : pas de doublon.
      if (byFile.has(key)) continue;

      const relPath = relFrom(ctx.root, abs);
      const ext = path.extname(relPath).slice(1).toLowerCase();
      if (!CODE_EXT.has(ext)) continue;

      const cid = 'code:' + relPath;
      if (!codeNodes.has(cid)) {
        codeNodes.set(cid, true);
        sourceOfNode.set(cid, 'code');
        nodes.push({
          id: cid, label: path.basename(relPath), kind: 'code', source: 'code',
          kindColor: kindMeta('code').color, sourceColor: kindMeta('code').color,
          path: relPath,
        });
      }
      addEdge(e.id, cid, 'code');
      count++;
    }
  }

  // ----- 6) Citations nominatives ------------------------------------------
  // Beaucoup de liens réels ne sont jamais écrits comme des liens : un CLAUDE.md
  // qui cite `/build-desktop`, une exigence OpenSpec qui nomme une skill. On les
  // reconstruit en cherchant les noms d'entités distinctifs dans les contenus.
  // Celles qui franchissent une frontière d'écosystème portent `cross: true` et
  // constituent le fil « Exigence → Skill → Outil MCP → Code ».
  const mentionable = entities
    .filter((e) => MENTION_KINDS.has(e.kind))
    .map((e) => ({ id: e.id, name: String(e.name).toLowerCase(), patterns: mentionPatterns(e) }))
    .filter((m) => m.patterns.length);

  for (const e of entities) {
    if (!e.content) continue;
    const hay = e.content.toLowerCase();
    const selfName = String(e.name).toLowerCase();
    let count = 0;
    for (const m of mentionable) {
      if (count >= MAX_MENTIONS_PER_ENTITY) break;
      if (m.id === e.id) continue;
      // Deux entités de même nom sont deux DÉCLARATIONS de la même chose (un
      // serveur MCP déclaré dans deux fichiers), pas une citation de l'une par
      // l'autre. Le doublon est signalé par un badge, pas par une arête.
      if (m.name === selfName) continue;
      // Un lien explicite (ref, contains, delta, tool) prime toujours : on ne
      // double pas une relation déjà établie par une citation.
      if (pairs.has(pairKey(e.id, m.id))) continue;
      if (m.patterns.some((re) => re.test(hay))) { addEdge(e.id, m.id, 'mention'); count++; }
    }
  }

  return { nodes, edges, edgeTypes: EDGE_TYPES };
}

// Noms sous lesquels une entité peut être citée par un lien [[wiki]].
function aliasesOf(e) {
  const out = [String(e.name).toLowerCase()];
  if (e.path) {
    const base = path.basename(e.path).replace(/\.[^.]+$/, '').toLowerCase();
    out.push(base);
    // Une skill vit dans <nom>/SKILL.md : c'est le dossier qui la nomme.
    if (base === 'skill' || base === 'spec') {
      out.push(path.basename(path.dirname(e.path)).toLowerCase());
    }
  }
  return out.filter(Boolean);
}

// Motifs de citation, testés en minuscules sur le contenu.
function mentionPatterns(e) {
  const out = [];
  const name = String(e.name).trim();

  // `/ma-commande` : invocation explicite, signal le plus fort.
  const invoke = (e.meta.find((m) => m.k === 'commande') || {}).v;
  if (invoke) out.push(new RegExp('(^|[\\s"\'`(])' + escapeRe(invoke.toLowerCase()) + '(?![\\w-])', 'm'));

  // Nom nu : on exige un identifiant distinctif (kebab/snake case, ou ≥ 6
  // caractères) pour éviter d'attraper des mots courants du langage naturel.
  const isDistinctive = /[-_]/.test(name) || name.length >= 6;
  if (isDistinctive && name.length >= 4) {
    out.push(new RegExp('(^|[^\\w-])' + escapeRe(name.toLowerCase()) + '(?![\\w-])', 'm'));
  }
  return out;
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }