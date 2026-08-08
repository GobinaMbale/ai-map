// core/explorer.mjs — arborescence des dossiers IA détectés.
//
// Contrairement à claude-map (un seul .claude/), AI-MAP peut avoir plusieurs
// racines : une par écosystème présent. On produit donc un arbre par source.

import path from 'node:path';
import { isDir, isFile, listDir } from './fs.mjs';
import { sourceMeta } from './model.mjs';

// Dossiers volumineux et sans intérêt de cartographie.
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '__pycache__', '.venv']);
const MAX_CHILDREN = 200;
const MAX_DEPTH = 6;

function treeOf(p, depth) {
  const name = path.basename(p);
  if (!isDir(p)) return { name, type: 'file' };
  const node = { name, type: 'dir', children: [] };
  if (depth >= MAX_DEPTH) { node.truncated = true; return node; }

  const names = listDir(p);
  for (const child of names.slice(0, MAX_CHILDREN)) {
    if (SKIP.has(child)) continue;
    node.children.push(treeOf(path.join(p, child), depth + 1));
  }
  if (names.length > MAX_CHILDREN) node.truncated = true;
  return node;
}

// scan.roots : Map<sourceId, string[]> (chemins relatifs à la racine projet).
export function buildTrees(ctx, roots) {
  const trees = [];
  for (const [sourceId, rels] of roots) {
    const meta = sourceMeta(sourceId);
    for (const rel of rels) {
      const abs = path.join(ctx.root, rel);
      // Un fichier isolé (CLAUDE.md, .mcp.json) n'a pas d'arbre à déplier.
      if (!isDir(abs)) { if (isFile(abs)) trees.push({ source: sourceId, label: meta.label, root: rel, tree: { name: rel, type: 'file' } }); continue; }
      trees.push({ source: sourceId, label: meta.label, root: rel, tree: treeOf(abs, 0) });
    }
  }
  return trees;
}