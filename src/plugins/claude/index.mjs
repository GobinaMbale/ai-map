// plugins/claude/index.mjs — adaptateur Claude Code.
//
// Sources lues : .claude/ (skills, commands, agents, rules, settings),
// CLAUDE.md (mémoire), .mcp.json (serveurs MCP).
// Produit uniquement des entités du modèle universel — aucun rendu ici.

import path from 'node:path';
import { isDir, isFile, read, readJson, listDir, listSubdirs, listFiles, walk } from '../../core/fs.mjs';
import {
  parseFrontmatter, firstHeading, firstParagraph, headings,
  findMdLinks, findWikiLinks, findCodePaths, buildMeta, clip,
} from '../../core/parser.mjs';
import { makeEntity } from '../../core/model.mjs';
import { mcpEntitiesFrom } from '../../core/mcp.mjs';

const CLAUDE_SOURCE = 'claude';

function clDir(ctx) { return path.join(ctx.root, '.claude'); }

function clDetect(ctx) {
  const found = [];
  if (isDir(clDir(ctx))) found.push('.claude');
  if (isFile(path.join(ctx.root, 'CLAUDE.md'))) found.push('CLAUDE.md');
  for (const f of ['.mcp.json']) {
    if (isFile(path.join(ctx.root, f))) found.push(f);
  }
  return found;
}

function clScan(ctx) {
  return [
    ...clSkills(ctx), ...clCommands(ctx), ...clAgents(ctx),
    ...clRules(ctx), ...clMemory(ctx), ...clSettings(ctx), ...clMcp(ctx),
  ];
}

// Normalise `allowed-tools` / `tools` : "Bash(git:*), Read" → ['Bash', 'Read'].
function clTools(raw) {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : String(raw).split(',');
  const out = [];
  for (const item of list) {
    const name = String(item).split('(')[0].trim();
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}

// ----- Skills : .claude/skills/<nom>/SKILL.md ------------------------------
function clSkills(ctx) {
  const base = path.join(clDir(ctx), 'skills');
  const out = [];
  for (const name of listSubdirs(base)) {
    const file = path.join(base, name, 'SKILL.md');
    if (!isFile(file)) continue;
    const { data, body } = parseFrontmatter(read(file));
    const attached = listDir(path.join(base, name)).filter((f) => f !== 'SKILL.md');
    out.push(makeEntity(ctx, {
      source: CLAUDE_SOURCE, kind: 'skill', slug: name,
      name: data.name || name,
      description: data.description || firstParagraph(body),
      file,
      meta: buildMeta({
        'modèle': data.model,
        'outils': clTools(data['allowed-tools'] || data.tools),
        'fichiers joints': attached.length ? attached.join(', ') : null,
      }),
      links: {
        files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body),
        tools: clTools(data['allowed-tools'] || data.tools),
      },
      content: clip(body),
    }));
  }
  return out;
}

// ----- Commandes : .claude/commands/**/*.md --------------------------------
function clCommands(ctx) {
  const base = path.join(clDir(ctx), 'commands');
  if (!isDir(base)) return [];
  const out = [];
  walk(base, (file) => {
    const { data, body } = parseFrontmatter(read(file));
    const rel = path.relative(base, file).split(path.sep).join('/');
    // Convention Claude Code : les sous-dossiers deviennent un espace de noms.
    const invoke = '/' + rel.replace(/\.md$/, '').replace(/\//g, ':');
    out.push(makeEntity(ctx, {
      source: CLAUDE_SOURCE, kind: 'command', slug: rel.replace(/\.md$/, ''),
      name: data.name || invoke,
      description: data.description || firstParagraph(body),
      file,
      meta: buildMeta({
        'commande': invoke,
        'outils autorisés': clTools(data['allowed-tools']),
        'modèle': data.model,
        'catégorie': data.category,
      }),
      links: {
        files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body),
        tools: clTools(data['allowed-tools']),
      },
      content: clip(body),
    }));
  }, '.md');
  return out;
}

// ----- Agents : .claude/agents/*.md ----------------------------------------
function clAgents(ctx) {
  const base = path.join(clDir(ctx), 'agents');
  const out = [];
  for (const f of listFiles(base, '.md')) {
    const file = path.join(base, f);
    const { data, body } = parseFrontmatter(read(file));
    out.push(makeEntity(ctx, {
      source: CLAUDE_SOURCE, kind: 'agent', slug: f.replace(/\.md$/, ''),
      name: data.name || f.replace(/\.md$/, ''),
      description: data.description || firstParagraph(body),
      file,
      meta: buildMeta({ 'modèle': data.model, 'outils': clTools(data.tools), 'isolation': data.isolation }),
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body), tools: clTools(data.tools) },
      content: clip(body),
    }));
  }
  return out;
}

// ----- Règles : .claude/rules/*.md -----------------------------------------
function clRules(ctx) {
  const base = path.join(clDir(ctx), 'rules');
  const out = [];
  for (const f of listFiles(base, '.md')) {
    const file = path.join(base, f);
    const body = read(file);
    const hs = headings(body);
    out.push(makeEntity(ctx, {
      source: CLAUDE_SOURCE, kind: 'rule', slug: f.replace(/\.md$/, ''),
      name: firstHeading(body) || f.replace(/\.md$/, ''),
      description: firstParagraph(body) || 'Convention de projet.',
      file,
      meta: buildMeta({ 'sections': hs.length }),
      outline: hs.slice(1),
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));
  }
  return out;
}

// ----- Mémoire : CLAUDE.md (racine et .claude/) ----------------------------
function clMemory(ctx) {
  const out = [];
  for (const rel of ['CLAUDE.md', path.join('.claude', 'CLAUDE.md')]) {
    const file = path.join(ctx.root, rel);
    if (!isFile(file)) continue;
    const body = read(file);
    const hs = headings(body, 30);
    out.push(makeEntity(ctx, {
      source: CLAUDE_SOURCE, kind: 'memory', slug: rel,
      name: rel.split(path.sep).join('/'),
      description: firstParagraph(body) || 'Instructions chargées à chaque session.',
      file,
      meta: buildMeta({ 'sections': hs.length }),
      outline: hs,
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));
  }
  return out;
}

// ----- Réglages : .claude/settings*.json -----------------------------------
// Les hooks sont remontés en Workflow : ce sont des automatismes déclenchés,
// pas de la simple configuration — et c'est ce qui intéresse la gouvernance.
function clSettings(ctx) {
  const out = [];
  for (const f of ['settings.json', 'settings.local.json']) {
    const file = path.join(clDir(ctx), f);
    if (!isFile(file)) continue;
    const json = readJson(file);
    const hookEvents = json && json.hooks ? Object.keys(json.hooks) : [];
    const allow = (json && json.permissions && json.permissions.allow) || [];
    const deny = (json && json.permissions && json.permissions.deny) || [];

    out.push(makeEntity(ctx, {
      source: CLAUDE_SOURCE, kind: 'config', slug: f,
      name: f,
      description: json
        ? [
            hookEvents.length ? hookEvents.length + ' événement(s) de hook' : 'aucun hook',
            allow.length ? allow.length + ' permission(s) autorisée(s)' : null,
            deny.length ? deny.length + ' refusée(s)' : null,
          ].filter(Boolean).join(' · ')
        : 'Fichier de réglages illisible (JSON invalide).',
      file,
      meta: buildMeta({
        'hooks': hookEvents.join(', ') || null,
        'permissions allow': allow.length || null,
        'permissions deny': deny.length || null,
      }),
      badges: json ? [] : [{ text: 'JSON invalide', tone: 'danger' }],
      // Les permissions `mcp__serveur__outil` relient les réglages aux serveurs MCP.
      links: { tools: clPermTools(allow) },
      content: clip('```json\n' + (json ? JSON.stringify(json, null, 2) : read(file)) + '\n```'),
    }));

    for (const ev of hookEvents) {
      const matchers = json.hooks[ev];
      const cmds = [];
      for (const m of (Array.isArray(matchers) ? matchers : [])) {
        for (const h of (m && Array.isArray(m.hooks) ? m.hooks : [])) {
          if (h && h.command) cmds.push(String(h.command));
        }
      }
      out.push(makeEntity(ctx, {
        source: CLAUDE_SOURCE, kind: 'workflow', slug: f + '-' + ev,
        name: ev,
        description: cmds.length
          ? cmds.length + ' commande(s) déclenchée(s) sur l\'événement ' + ev + '.'
          : 'Hook déclaré sur l\'événement ' + ev + ', sans commande lisible.',
        file,
        meta: buildMeta({ 'événement': ev, 'déclaré dans': f, 'commandes': cmds.length }),
        content: clip('```json\n' + JSON.stringify(matchers, null, 2) + '\n```'),
      }));
    }
  }
  return out;
}

// `mcp__github__create_issue` → nom d'outil MCP exploitable dans le graphe.
function clPermTools(allow) {
  const out = [];
  for (const p of allow) {
    const m = String(p).match(/^mcp__([a-z0-9_-]+)__([a-z0-9_-]+)/i);
    if (m && !out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

// ----- Serveurs MCP : .mcp.json / .claude/mcp.json -------------------------
// Seuls les emplacements PROPRES à Claude Code sont lus ici. Un `mcp.json`
// générique à la racine relève de l'adaptateur MCP universel — sinon le même
// serveur serait compté deux fois.
function clMcp(ctx) {
  const seen = new Set();
  return [
    ...mcpEntitiesFrom(ctx, path.join(ctx.root, '.mcp.json'), CLAUDE_SOURCE, seen),
    ...mcpEntitiesFrom(ctx, path.join(clDir(ctx), 'mcp.json'), CLAUDE_SOURCE, seen),
  ];
}

export const claudePlugin = { id: CLAUDE_SOURCE, detect: clDetect, scan: clScan };