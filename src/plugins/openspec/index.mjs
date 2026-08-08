// plugins/openspec/index.mjs — adaptateur OpenSpec.
//
// Décision d'architecture (vision §Adaptateur OpenSpec) : cet adaptateur ne
// réplique PAS un dashboard/éditeur OpenSpec — des extensions dédiées le font
// déjà. Il se limite à un parser léger vers le modèle universel, pour alimenter
// le graphe transverse et l'analyse d'impact.
//
// Arborescence lue :
//   openspec/project.md            contexte projet
//   openspec/specs/<cap>/spec.md   spécifications + exigences
//   openspec/changes/<id>/         proposal.md, tasks.md, design.md, specs/<cap>/spec.md
//   openspec/changes/archive/<id>/ changes archivés

import path from 'node:path';
import { isDir, isFile, read, listSubdirs, listFiles } from '../../core/fs.mjs';
import {
  parseFrontmatter, firstHeading, firstParagraph, headings, sectionsOf,
  parseChecklist, findMdLinks, findWikiLinks, findCodePaths, buildMeta, clip, slugify,
} from '../../core/parser.mjs';
import { makeEntity } from '../../core/model.mjs';

const OPENSPEC_SOURCE = 'openspec';

function osDir(ctx) { return path.join(ctx.root, 'openspec'); }

function osDetect(ctx) {
  const base = osDir(ctx);
  if (!isDir(base)) return [];
  const found = ['openspec'];
  if (isDir(path.join(base, 'specs'))) found.push('openspec/specs');
  if (isDir(path.join(base, 'changes'))) found.push('openspec/changes');
  return found;
}

function osScan(ctx) {
  return [...osContext(ctx), ...osSpecs(ctx), ...osChanges(ctx)];
}

// ----- Contexte : openspec/project.md, AGENTS.md ---------------------------
function osContext(ctx) {
  const out = [];
  for (const f of ['project.md', 'AGENTS.md']) {
    const file = path.join(osDir(ctx), f);
    if (!isFile(file)) continue;
    const body = read(file);
    const hs = headings(body, 20);
    out.push(makeEntity(ctx, {
      source: OPENSPEC_SOURCE, kind: 'knowledge', slug: f,
      name: 'openspec/' + f,
      description: firstParagraph(body) || 'Contexte projet partagé avec les agents.',
      file,
      meta: buildMeta({ 'sections': hs.length }),
      outline: hs,
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));
  }
  return out;
}

// ----- Spécifications : openspec/specs/<capability>/spec.md ----------------
function osSpecs(ctx) {
  const base = path.join(osDir(ctx), 'specs');
  const out = [];
  for (const cap of listSubdirs(base)) {
    const file = path.join(base, cap, 'spec.md');
    if (!isFile(file)) continue;
    const { body } = parseFrontmatter(read(file));
    const specId = OPENSPEC_SOURCE + ':spec:' + slugify(cap);
    const reqs = osRequirements(body);

    out.push(makeEntity(ctx, {
      source: OPENSPEC_SOURCE, kind: 'spec', id: specId,
      name: firstHeading(body) || cap,
      description: osPurpose(body) || firstParagraph(body) || 'Capacité spécifiée.',
      file,
      meta: buildMeta({
        'capacité': cap,
        'exigences': reqs.length || null,
        'scénarios': reqs.reduce((n, r) => n + r.scenarios, 0) || null,
      }),
      outline: reqs.slice(0, 12).map((r) => ({ level: 2, text: r.title })),
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));

    // Chaque exigence devient une entité à part entière : c'est le point
    // d'accroche du fil « Requirement → Skill → MCP Tool → Code ».
    for (const r of reqs) {
      out.push(makeEntity(ctx, {
        source: OPENSPEC_SOURCE, kind: 'requirement',
        id: OPENSPEC_SOURCE + ':requirement:' + slugify(cap) + '--' + slugify(r.title),
        name: r.title,
        description: firstParagraph(r.body) || 'Exigence de la capacité « ' + cap + ' ».',
        file,
        parent: specId,
        meta: buildMeta({ 'capacité': cap, 'scénarios': r.scenarios || null }),
        links: { files: findMdLinks(r.body), wiki: findWikiLinks(r.body), code: findCodePaths(r.body) },
        content: clip('### ' + r.title + '\n\n' + r.body),
      }));
    }
  }
  return out;
}

// `## Purpose` est la section de résumé conventionnelle d'un spec OpenSpec.
function osPurpose(body) {
  for (const s of sectionsOf(body, 2)) {
    if (/^(purpose|objectif|but)\b/i.test(s.title)) return firstParagraph(s.body);
  }
  return '';
}

// `### Requirement: <texte>` + comptage des `#### Scenario:`.
function osRequirements(body) {
  return sectionsOf(body, 3)
    .filter((s) => /^requirement\s*:/i.test(s.title))
    .map((s) => ({
      title: s.title.replace(/^requirement\s*:\s*/i, '').trim(),
      body: s.body,
      scenarios: (s.body.match(/^####\s+Scenario\s*:/gim) || []).length,
    }));
}

// ----- Changes : openspec/changes/<id>/ ------------------------------------
function osChanges(ctx) {
  const base = path.join(osDir(ctx), 'changes');
  if (!isDir(base)) return [];
  const out = [];
  for (const id of listSubdirs(base)) {
    if (id === 'archive') continue;
    out.push(...osOneChange(ctx, path.join(base, id), id, false));
  }
  const archive = path.join(base, 'archive');
  for (const id of listSubdirs(archive)) {
    out.push(...osOneChange(ctx, path.join(archive, id), id, true));
  }
  return out;
}

function osOneChange(ctx, dir, id, archived) {
  const out = [];
  const changeId = OPENSPEC_SOURCE + ':change:' + slugify(id);
  const proposal = path.join(dir, 'proposal.md');
  const body = isFile(proposal) ? read(proposal) : '';

  const tasksFile = path.join(dir, 'tasks.md');
  const tasksBody = isFile(tasksFile) ? read(tasksFile) : '';
  const progress = parseChecklist(tasksBody);
  const deltas = osDeltas(dir);

  out.push(makeEntity(ctx, {
    source: OPENSPEC_SOURCE, kind: 'change', id: changeId,
    name: id,
    description: osWhy(body) || firstParagraph(body) || 'Proposition de changement.',
    file: isFile(proposal) ? proposal : (isFile(tasksFile) ? tasksFile : null),
    meta: buildMeta({
      'statut': osStatus(archived, progress),
      'avancement': progress.total ? progress.done + '/' + progress.total + ' tâches' : null,
      'capacités touchées': deltas.map((d) => d.capability).join(', ') || null,
      'opérations': osDeltaOps(deltas) || null,
    }),
    status: osStatusKey(archived, progress),
    badges: osBadges(archived, progress),
    // Le lien Change → Spec est LE lien d'impact : il dit quelles capacités
    // existantes ce change modifie.
    links: {
      files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body),
      targets: deltas.map((d) => OPENSPEC_SOURCE + ':spec:' + slugify(d.capability)),
    },
    content: clip(body || tasksBody || 'Change sans proposal.md.'),
  }));

  // Tâches regroupées par section (`## 1. Implémentation`) : granularité utile
  // sans noyer la carte sous des dizaines de cases à cocher isolées.
  if (tasksBody) {
    const groups = sectionsOf(tasksBody, 2);
    const chunks = groups.length ? groups : [{ title: 'Tâches', body: tasksBody }];
    for (const g of chunks) {
      const p = parseChecklist(g.body);
      if (!p.total) continue;
      out.push(makeEntity(ctx, {
        source: OPENSPEC_SOURCE, kind: 'task',
        id: OPENSPEC_SOURCE + ':task:' + slugify(id) + '--' + slugify(g.title),
        name: g.title,
        description: p.done + ' tâche(s) sur ' + p.total + ' terminée(s) pour « ' + id + ' ».',
        file: tasksFile,
        parent: changeId,
        meta: buildMeta({
          'change': id,
          'avancement': p.done + '/' + p.total,
          'reste': p.total - p.done || null,
        }),
        badges: p.done === p.total ? [{ text: 'terminé', tone: 'ok' }] : [],
        outline: p.items.slice(0, 12).map((i) => ({ level: 1, text: (i.done ? '✔ ' : '○ ') + i.text })),
        content: clip(g.body),
      }));
    }
  }

  // design.md : décisions d'architecture rattachées au change.
  const design = path.join(dir, 'design.md');
  if (isFile(design)) {
    const dbody = read(design);
    out.push(makeEntity(ctx, {
      source: OPENSPEC_SOURCE, kind: 'document',
      id: OPENSPEC_SOURCE + ':document:' + slugify(id) + '--design',
      name: id + ' / design.md',
      description: firstParagraph(dbody) || 'Décisions techniques du change.',
      file: design,
      parent: changeId,
      meta: buildMeta({ 'change': id, 'sections': headings(dbody, 20).length }),
      outline: headings(dbody, 12),
      links: { files: findMdLinks(dbody), wiki: findWikiLinks(dbody), code: findCodePaths(dbody) },
      content: clip(dbody),
    }));
  }

  return out;
}

// `## Why` est la section conventionnelle de justification d'un proposal.
function osWhy(body) {
  for (const s of sectionsOf(body, 2)) {
    if (/^(why|pourquoi|context)\b/i.test(s.title)) return firstParagraph(s.body);
  }
  return '';
}

// Deltas : openspec/changes/<id>/specs/<capability>/spec.md
// En-têtes conventionnels : `## ADDED|MODIFIED|REMOVED|RENAMED Requirements`.
function osDeltas(dir) {
  const base = path.join(dir, 'specs');
  const out = [];
  for (const cap of listSubdirs(base)) {
    const file = path.join(base, cap, 'spec.md');
    if (!isFile(file)) continue;
    const body = read(file);
    const ops = [];
    const re = /^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\b/gim;
    let m;
    while ((m = re.exec(body))) {
      const op = m[1].toUpperCase();
      if (!ops.includes(op)) ops.push(op);
    }
    out.push({ capability: cap, ops, file });
  }
  return out;
}

function osDeltaOps(deltas) {
  const all = [];
  for (const d of deltas) for (const op of d.ops) if (!all.includes(op)) all.push(op);
  return all.join(', ');
}

// Clé machine du statut : sert au regroupement et à la couleur, là où
// osStatus() ne produit qu'un libellé destiné à l'affichage.
function osStatusKey(archived, progress) {
  if (archived) return 'archived';
  if (!progress.total) return 'proposed';
  if (progress.done === progress.total) return 'done';
  if (progress.done > 0) return 'active';
  return 'planned';
}

function osStatus(archived, progress) {
  if (archived) return 'archivé';
  if (!progress.total) return 'proposé';
  if (progress.done === progress.total) return 'terminé (à archiver)';
  if (progress.done > 0) return 'en cours';
  return 'planifié';
}

function osBadges(archived, progress) {
  if (archived) return [{ text: 'archivé', tone: 'muted' }];
  if (progress.total && progress.done === progress.total) {
    // Signal de gouvernance : un change fini mais non archivé encombre le
    // dossier changes/ et fausse la lecture de « ce qui est en cours ».
    return [{ text: 'à archiver', tone: 'warn' }];
  }
  if (progress.done > 0) return [{ text: 'en cours', tone: 'info' }];
  return [{ text: 'proposé', tone: 'info' }];
}

export const openspecPlugin = { id: OPENSPEC_SOURCE, detect: osDetect, scan: osScan };