// plugins/roo/index.mjs — adaptateur Roo Code.
//
// Sources lues :
//   .roo/rules/**/*.md        règles générales
//   .roo/rules-<mode>/**/*.md règles propres à un mode
//   .roorules                 règle héritée, à la racine
//   .roomodes                 modes personnalisés (YAML ou JSON)
//   .roo/mcp.json             serveurs MCP

import path from 'node:path';
import { isDir, isFile, read, listDir, walk } from '../../core/fs.mjs';
import {
  parseYamlLite, firstHeading, firstParagraph, headings,
  findMdLinks, findWikiLinks, findCodePaths, buildMeta, clip,
} from '../../core/parser.mjs';
import { makeEntity } from '../../core/model.mjs';
import { mcpEntitiesFrom } from '../../core/mcp.mjs';

const ROO_SOURCE = 'roo';

function roDir(ctx) { return path.join(ctx.root, '.roo'); }

function roDetect(ctx) {
  const found = [];
  if (isDir(roDir(ctx))) found.push('.roo');
  if (isFile(path.join(ctx.root, '.roorules'))) found.push('.roorules');
  if (isFile(path.join(ctx.root, '.roomodes'))) found.push('.roomodes');
  return found;
}

function roScan(ctx) {
  return [...roRules(ctx), ...roLegacyRules(ctx), ...roModes(ctx), ...roMcp(ctx)];
}

// Roo range les règles dans `rules/` (générales) et `rules-<mode>/` (par mode) :
// on conserve le mode dans les métadonnées, c'est ce qui explique leur portée.
function roRules(ctx) {
  const base = roDir(ctx);
  if (!isDir(base)) return [];
  const out = [];
  for (const dir of listDir(base)) {
    if (dir !== 'rules' && !dir.startsWith('rules-')) continue;
    const full = path.join(base, dir);
    if (!isDir(full)) continue;
    const mode = dir === 'rules' ? null : dir.slice('rules-'.length);
    walk(full, (file) => {
      const body = read(file);
      out.push(makeEntity(ctx, {
        source: ROO_SOURCE, kind: 'rule',
        slug: dir + '-' + path.relative(full, file).replace(/\.md$/, ''),
        name: firstHeading(body) || path.basename(file, '.md'),
        description: firstParagraph(body) || 'Règle Roo Code.',
        file,
        meta: buildMeta({ 'mode': mode || 'tous', 'portée': mode ? 'mode ' + mode : 'globale' }),
        outline: headings(body).slice(1),
        links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
        content: clip(body),
      }));
    }, '.md');
  }
  return out;
}

function roLegacyRules(ctx) {
  const file = path.join(ctx.root, '.roorules');
  if (!isFile(file)) return [];
  const body = read(file);
  const modern = isDir(path.join(roDir(ctx), 'rules'));
  return [makeEntity(ctx, {
    source: ROO_SOURCE, kind: 'rule', slug: 'roorules-legacy',
    name: '.roorules',
    description: firstParagraph(body) || 'Règles Roo au format historique.',
    file,
    meta: buildMeta({ 'format': 'hérité (remplacé par .roo/rules/)' }),
    badges: modern
      ? [{ text: 'format hérité — doublon', tone: 'warn' }]
      : [{ text: 'format hérité', tone: 'muted' }],
    outline: headings(body),
    links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
    content: clip(body),
  })];
}

// `.roomodes` est du YAML (ou du JSON) décrivant des modes personnalisés :
// chacun est un exécutant spécialisé → entité Agent du modèle universel.
function roModes(ctx) {
  const file = path.join(ctx.root, '.roomodes');
  if (!isFile(file)) return [];
  const raw = read(file);
  let config = null;
  try { config = JSON.parse(raw); } catch { config = parseYamlLite(raw); }

  const modes = config && Array.isArray(config.customModes) ? config.customModes : null;
  if (!modes) {
    return [makeEntity(ctx, {
      source: ROO_SOURCE, kind: 'config', slug: 'roomodes',
      name: '.roomodes',
      description: 'Modes personnalisés déclarés, mais le format n\'a pas pu être analysé.',
      file,
      badges: [{ text: 'format non reconnu', tone: 'warn' }],
      content: clip('```\n' + raw.slice(0, 4000) + '\n```'),
    })];
  }

  return modes.filter(Boolean).map((mode) => {
    // `groups` liste les familles d'outils autorisées ; un groupe peut être une
    // simple chaîne ou une paire [nom, options] — on ne garde que le nom.
    const groups = (Array.isArray(mode.groups) ? mode.groups : [])
      .map((g) => (Array.isArray(g) ? g[0] : g))
      .filter((g) => typeof g === 'string');
    const role = String(mode.roleDefinition || mode.customInstructions || '');
    return makeEntity(ctx, {
      source: ROO_SOURCE, kind: 'agent', slug: String(mode.slug || mode.name || 'mode'),
      name: mode.name || mode.slug || 'mode',
      description: firstParagraph(role) || 'Mode personnalisé Roo Code.',
      file,
      meta: buildMeta({ 'slug': mode.slug, 'groupes d\'outils': groups, 'modèle': mode.model }),
      links: { tools: groups, code: findCodePaths(role) },
      content: clip(role || '```json\n' + JSON.stringify(mode, null, 2) + '\n```'),
    });
  });
}

function roMcp(ctx) {
  return mcpEntitiesFrom(ctx, path.join(roDir(ctx), 'mcp.json'), ROO_SOURCE, new Set());
}

export const rooPlugin = { id: ROO_SOURCE, detect: roDetect, scan: roScan };
