// plugins/cursor/index.mjs — adaptateur Cursor.
//
// Sources lues :
//   .cursor/rules/**/*.mdc   règles modernes (frontmatter description/globs/alwaysApply)
//   .cursorrules             règle héritée, à la racine (format legacy)
//   .cursor/commands/*.md    commandes personnalisées
//   .cursor/mcp.json         serveurs MCP

import path from 'node:path';
import { isDir, isFile, read, walk } from '../../core/fs.mjs';
import {
  parseFrontmatter, firstHeading, firstParagraph, headings,
  findMdLinks, findWikiLinks, findCodePaths, buildMeta, clip,
} from '../../core/parser.mjs';
import { makeEntity } from '../../core/model.mjs';
import { mcpEntitiesFrom } from '../../core/mcp.mjs';

const CURSOR_SOURCE = 'cursor';

function cuDir(ctx) { return path.join(ctx.root, '.cursor'); }

function cuDetect(ctx) {
  const found = [];
  if (isDir(cuDir(ctx))) found.push('.cursor');
  if (isFile(path.join(ctx.root, '.cursorrules'))) found.push('.cursorrules');
  return found;
}

function cuScan(ctx) {
  return [...cuRules(ctx), ...cuLegacyRules(ctx), ...cuCommands(ctx), ...cuMcp(ctx)];
}

// `.mdc` : Markdown + frontmatter. `alwaysApply: true` = règle chargée à chaque
// requête ; sinon elle est attachée par `globs` ou invoquée par description.
function cuRules(ctx) {
  const base = path.join(cuDir(ctx), 'rules');
  if (!isDir(base)) return [];
  const out = [];
  const collect = (file) => {
    const { data, body } = parseFrontmatter(read(file));
    const globs = Array.isArray(data.globs) ? data.globs.join(', ') : data.globs;
    const always = data.alwaysApply === true || data.alwaysApply === 'true';
    out.push(makeEntity(ctx, {
      source: CURSOR_SOURCE, kind: 'rule',
      slug: path.relative(base, file).replace(/\.[^.]+$/, ''),
      name: data.description || firstHeading(body) || path.basename(file).replace(/\.[^.]+$/, ''),
      description: firstParagraph(body) || data.description || 'Règle Cursor.',
      file,
      meta: buildMeta({
        'portée': always ? 'toujours appliquée' : (globs ? 'fichiers ciblés' : 'sur demande'),
        'globs': globs,
      }),
      badges: always ? [{ text: 'toujours active', tone: 'info' }] : [],
      outline: headings(body).slice(1),
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));
  };
  walk(base, collect, '.mdc');
  walk(base, collect, '.md');
  return out;
}

// `.cursorrules` : format historique, remplacé par `.cursor/rules/`. Sa présence
// aux côtés du nouveau format est un signal de dette de configuration.
function cuLegacyRules(ctx) {
  const file = path.join(ctx.root, '.cursorrules');
  if (!isFile(file)) return [];
  const body = read(file);
  const modern = isDir(path.join(cuDir(ctx), 'rules'));
  return [makeEntity(ctx, {
    source: CURSOR_SOURCE, kind: 'rule', slug: 'cursorrules-legacy',
    name: '.cursorrules',
    description: firstParagraph(body) || 'Règles Cursor au format historique.',
    file,
    meta: buildMeta({ 'format': 'hérité (remplacé par .cursor/rules/)' }),
    badges: modern
      ? [{ text: 'format hérité — doublon', tone: 'warn' }]
      : [{ text: 'format hérité', tone: 'muted' }],
    outline: headings(body),
    links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
    content: clip(body),
  })];
}

function cuCommands(ctx) {
  const base = path.join(cuDir(ctx), 'commands');
  if (!isDir(base)) return [];
  const out = [];
  walk(base, (file) => {
    const { data, body } = parseFrontmatter(read(file));
    const name = path.relative(base, file).replace(/\.md$/, '').split(path.sep).join('/');
    out.push(makeEntity(ctx, {
      source: CURSOR_SOURCE, kind: 'command', slug: name,
      name: '/' + name,
      description: data.description || firstParagraph(body) || 'Commande Cursor.',
      file,
      meta: buildMeta({ 'commande': '/' + name }),
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));
  }, '.md');
  return out;
}

function cuMcp(ctx) {
  return mcpEntitiesFrom(ctx, path.join(cuDir(ctx), 'mcp.json'), CURSOR_SOURCE, new Set());
}

export const cursorPlugin = { id: CURSOR_SOURCE, detect: cuDetect, scan: cuScan };
