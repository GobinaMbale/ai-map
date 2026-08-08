// plugins/mcp/index.mjs — adaptateur MCP universel.
//
// Couvre les déclarations MCP qui n'appartiennent à aucun éditeur en
// particulier :
//   mcp.json · mcp.yaml · mcp.config.json   (racine du projet)
//   .vscode/mcp.json                        (clé racine `servers`)
//
// Les fichiers MCP propres à un éditeur restent gérés par SON adaptateur
// (.mcp.json → Claude, .cursor/mcp.json → Cursor, etc.) : c'est ce qui permet
// de voir qu'un même serveur est déclaré à deux endroits, au lieu de le fondre
// silencieusement en une seule entité.

import path from 'node:path';
import { isFile } from '../../core/fs.mjs';
import { mcpEntitiesFrom } from '../../core/mcp.mjs';

const MCP_SOURCE = 'mcp';

const MCP_FILES = [
  'mcp.json',
  'mcp.yaml',
  'mcp.yml',
  'mcp.config.json',
  path.join('.vscode', 'mcp.json'),
];

function mcFiles(ctx) {
  return MCP_FILES
    .map((rel) => ({ rel: rel.split(path.sep).join('/'), abs: path.join(ctx.root, rel) }))
    .filter((f) => isFile(f.abs));
}

function mcDetect(ctx) {
  return mcFiles(ctx).map((f) => f.rel);
}

function mcScan(ctx) {
  const out = [];
  const seen = new Set();
  for (const f of mcFiles(ctx)) {
    out.push(...mcpEntitiesFrom(ctx, f.abs, MCP_SOURCE, seen));
  }
  return out;
}

export const mcpPlugin = { id: MCP_SOURCE, detect: mcDetect, scan: mcScan };
