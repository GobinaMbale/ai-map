// plugins/windsurf/index.mjs — adaptateur Windsurf.
//
// Sources lues :
//   .windsurf/rules/**/*.md      règles (frontmatter trigger/globs)
//   .windsurfrules               règle héritée, à la racine
//   .windsurf/workflows/*.md     workflows invocables par /nom
//   .windsurf/mcp_config.json    serveurs MCP

import path from 'node:path';
import { isDir, isFile, read, walk } from '../../core/fs.mjs';
import {
  parseFrontmatter, firstHeading, firstParagraph, headings,
  findMdLinks, findWikiLinks, findCodePaths, buildMeta, clip,
} from '../../core/parser.mjs';
import { makeEntity } from '../../core/model.mjs';
import { mcpEntitiesFrom } from '../../core/mcp.mjs';

const WINDSURF_SOURCE = 'windsurf';

function wiDir(ctx) { return path.join(ctx.root, '.windsurf'); }

function wiDetect(ctx) {
  const found = [];
  if (isDir(wiDir(ctx))) found.push('.windsurf');
  if (isFile(path.join(ctx.root, '.windsurfrules'))) found.push('.windsurfrules');
  return found;
}

function wiScan(ctx) {
  return [...wiRules(ctx), ...wiLegacyRules(ctx), ...wiWorkflows(ctx), ...wiMcp(ctx)];
}

// `trigger` vaut always_on / glob / model_decision / manual : c'est ce qui
// détermine si la règle pèse sur chaque requête.
function wiRules(ctx) {
  const base = path.join(wiDir(ctx), 'rules');
  if (!isDir(base)) return [];
  const out = [];
  walk(base, (file) => {
    const { data, body } = parseFrontmatter(read(file));
    const trigger = data.trigger || (data.globs ? 'glob' : 'manual');
    const globs = Array.isArray(data.globs) ? data.globs.join(', ') : data.globs;
    out.push(makeEntity(ctx, {
      source: WINDSURF_SOURCE, kind: 'rule',
      slug: path.relative(base, file).replace(/\.md$/, ''),
      name: data.description || firstHeading(body) || path.basename(file, '.md'),
      description: firstParagraph(body) || data.description || 'Règle Windsurf.',
      file,
      meta: buildMeta({ 'déclencheur': trigger, 'globs': globs }),
      badges: trigger === 'always_on' ? [{ text: 'toujours active', tone: 'info' }] : [],
      outline: headings(body).slice(1),
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));
  }, '.md');
  return out;
}

function wiLegacyRules(ctx) {
  const file = path.join(ctx.root, '.windsurfrules');
  if (!isFile(file)) return [];
  const body = read(file);
  const modern = isDir(path.join(wiDir(ctx), 'rules'));
  return [makeEntity(ctx, {
    source: WINDSURF_SOURCE, kind: 'rule', slug: 'windsurfrules-legacy',
    name: '.windsurfrules',
    description: firstParagraph(body) || 'Règles Windsurf au format historique.',
    file,
    meta: buildMeta({ 'format': 'hérité (remplacé par .windsurf/rules/)' }),
    badges: modern
      ? [{ text: 'format hérité — doublon', tone: 'warn' }]
      : [{ text: 'format hérité', tone: 'muted' }],
    outline: headings(body),
    links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
    content: clip(body),
  })];
}

// Les workflows Windsurf sont des séquences d'étapes invocables par `/nom` :
// enchaînement automatisé → entité Workflow.
function wiWorkflows(ctx) {
  const base = path.join(wiDir(ctx), 'workflows');
  if (!isDir(base)) return [];
  const out = [];
  walk(base, (file) => {
    const { data, body } = parseFrontmatter(read(file));
    const name = path.basename(file, '.md');
    const steps = (body.match(/^\s*\d+\.\s+/gm) || []).length;
    out.push(makeEntity(ctx, {
      source: WINDSURF_SOURCE, kind: 'workflow', slug: name,
      name: '/' + name,
      description: data.description || firstParagraph(body) || 'Workflow Windsurf.',
      file,
      meta: buildMeta({ 'commande': '/' + name, 'étapes': steps || null }),
      outline: headings(body).slice(1),
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));
  }, '.md');
  return out;
}

function wiMcp(ctx) {
  const seen = new Set();
  return [
    ...mcpEntitiesFrom(ctx, path.join(wiDir(ctx), 'mcp_config.json'), WINDSURF_SOURCE, seen),
    ...mcpEntitiesFrom(ctx, path.join(wiDir(ctx), 'mcp.json'), WINDSURF_SOURCE, seen),
  ];
}

export const windsurfPlugin = { id: WINDSURF_SOURCE, detect: wiDetect, scan: wiScan };
