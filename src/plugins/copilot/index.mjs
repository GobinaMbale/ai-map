// plugins/copilot/index.mjs — adaptateur GitHub Copilot.
//
// Sources lues :
//   .github/copilot-instructions.md        instructions dépôt (chargées toujours)
//   .github/instructions/*.instructions.md instructions ciblées (frontmatter applyTo)
//   .github/prompts/*.prompt.md            prompts réutilisables
//   .github/chatmodes/*.chatmode.md        modes de chat (persona + outils)
//
// Note : ces chemins sont une convention DE COPILOT. Ils fonctionnent quel que
// soit l'hébergeur du dépôt (GitHub, GitLab, Forgejo…).

import path from 'node:path';
import { isDir, isFile, read, listFiles } from '../../core/fs.mjs';
import {
  parseFrontmatter, firstHeading, firstParagraph, headings,
  findMdLinks, findWikiLinks, findCodePaths, buildMeta, clip,
} from '../../core/parser.mjs';
import { makeEntity } from '../../core/model.mjs';

const COPILOT_SOURCE = 'copilot';

function coDir(ctx) { return path.join(ctx.root, '.github'); }

// `.github/` existe dans énormément de dépôts sans le moindre fichier Copilot :
// on n'active l'adaptateur que si un artefact Copilot est réellement présent.
function coDetect(ctx) {
  const base = coDir(ctx);
  if (!isDir(base)) return [];
  const found = [];
  if (isFile(path.join(base, 'copilot-instructions.md'))) found.push('.github/copilot-instructions.md');
  for (const d of ['instructions', 'prompts', 'chatmodes']) {
    if (isDir(path.join(base, d))) found.push('.github/' + d);
  }
  return found;
}

function coScan(ctx) {
  return [
    ...coInstructions(ctx), ...coScopedInstructions(ctx),
    ...coPrompts(ctx), ...coChatModes(ctx),
  ];
}

function coInstructions(ctx) {
  const file = path.join(coDir(ctx), 'copilot-instructions.md');
  if (!isFile(file)) return [];
  const body = read(file);
  const hs = headings(body, 30);
  return [makeEntity(ctx, {
    source: COPILOT_SOURCE, kind: 'memory', slug: 'copilot-instructions',
    name: '.github/copilot-instructions.md',
    description: firstParagraph(body) || 'Instructions dépôt fournies à Copilot à chaque requête.',
    file,
    meta: buildMeta({ 'sections': hs.length, 'portée': 'tout le dépôt' }),
    outline: hs,
    links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
    content: clip(body),
  })];
}

// `applyTo` restreint l'instruction à un motif de fichiers ; sans lui, elle
// s'applique partout — information de gouvernance utile.
function coScopedInstructions(ctx) {
  const base = path.join(coDir(ctx), 'instructions');
  const out = [];
  for (const f of listFiles(base, '.md')) {
    const file = path.join(base, f);
    const { data, body } = parseFrontmatter(read(file));
    const applyTo = Array.isArray(data.applyTo) ? data.applyTo.join(', ') : data.applyTo;
    out.push(makeEntity(ctx, {
      source: COPILOT_SOURCE, kind: 'rule', slug: f.replace(/\.md$/, ''),
      name: data.description || firstHeading(body) || f.replace(/\.instructions\.md$|\.md$/, ''),
      description: firstParagraph(body) || data.description || 'Instruction Copilot ciblée.',
      file,
      meta: buildMeta({ 'applyTo': applyTo || '**' }),
      badges: applyTo ? [] : [{ text: 'portée globale', tone: 'info' }],
      outline: headings(body).slice(1),
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));
  }
  return out;
}

function coPrompts(ctx) {
  const base = path.join(coDir(ctx), 'prompts');
  const out = [];
  for (const f of listFiles(base, '.md')) {
    const file = path.join(base, f);
    const { data, body } = parseFrontmatter(read(file));
    const name = f.replace(/\.prompt\.md$|\.md$/, '');
    out.push(makeEntity(ctx, {
      source: COPILOT_SOURCE, kind: 'prompt', slug: name,
      name: '/' + name,
      description: data.description || firstParagraph(body) || 'Prompt Copilot réutilisable.',
      file,
      meta: buildMeta({
        'commande': '/' + name,
        'mode': data.mode,
        'modèle': data.model,
        'outils': Array.isArray(data.tools) ? data.tools.join(', ') : data.tools,
      }),
      links: {
        files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body),
        tools: Array.isArray(data.tools) ? data.tools : (data.tools ? [data.tools] : []),
      },
      content: clip(body),
    }));
  }
  return out;
}

// Un chat mode définit une persona et un jeu d'outils : c'est l'équivalent
// Copilot d'un agent, on le modélise comme tel.
function coChatModes(ctx) {
  const base = path.join(coDir(ctx), 'chatmodes');
  const out = [];
  for (const f of listFiles(base, '.md')) {
    const file = path.join(base, f);
    const { data, body } = parseFrontmatter(read(file));
    const name = f.replace(/\.chatmode\.md$|\.md$/, '');
    const tools = Array.isArray(data.tools) ? data.tools : (data.tools ? [data.tools] : []);
    out.push(makeEntity(ctx, {
      source: COPILOT_SOURCE, kind: 'agent', slug: name,
      name,
      description: data.description || firstParagraph(body) || 'Mode de chat Copilot.',
      file,
      meta: buildMeta({ 'modèle': data.model, 'outils': tools }),
      links: {
        files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body), tools,
      },
      content: clip(body),
    }));
  }
  return out;
}

export const copilotPlugin = { id: COPILOT_SOURCE, detect: coDetect, scan: coScan };
