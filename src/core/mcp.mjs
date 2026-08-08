// core/mcp.mjs — extraction des serveurs MCP depuis un fichier de configuration.
//
// Factorisé ici parce que cinq écosystèmes déclarent leurs serveurs MCP dans le
// même format, à l'emplacement et à la clé racine près :
//   Claude Code  .mcp.json                  → mcpServers
//   Cursor       .cursor/mcp.json           → mcpServers
//   Roo Code     .roo/mcp.json              → mcpServers
//   Windsurf     .windsurf/mcp_config.json  → mcpServers
//   VS Code      .vscode/mcp.json           → servers
//   Zed          settings                   → context_servers

import { isFile, read } from './fs.mjs';
import { parseYamlLite, buildMeta, clip } from './parser.mjs';
import { makeEntity } from './model.mjs';

// `seen` évite qu'un même serveur déclaré dans deux fichiers d'un même
// écosystème produise deux entités avec le même identifiant.
export function mcpEntitiesFrom(ctx, file, sourceId, seen) {
  if (!isFile(file)) return [];
  const raw = read(file);

  let config = null;
  if (/\.ya?ml$/i.test(file)) config = parseYamlLite(raw);
  else { try { config = JSON.parse(raw); } catch { config = null; } }

  if (!config || typeof config !== 'object') {
    // Un fichier illisible est signalé plutôt que passé sous silence : une
    // config MCP cassée est exactement le genre de chose qu'on veut voir.
    return [makeEntity(ctx, {
      source: sourceId, kind: 'config', slug: 'mcp-illisible-' + file.length,
      name: 'Configuration MCP illisible',
      description: 'Le fichier existe mais n\'a pas pu être analysé (format non reconnu).',
      file,
      badges: [{ text: 'illisible', tone: 'danger' }],
      content: clip('```\n' + raw.slice(0, 4000) + '\n```'),
    })];
  }

  const servers = config.mcpServers || config.servers || config.context_servers || {};
  const out = [];
  for (const [name, cfgRaw] of Object.entries(servers)) {
    if (seen && seen.has(name)) continue;
    if (seen) seen.add(name);
    const cfg = cfgRaw || {};
    const transport = cfg.url ? (cfg.type || 'http') : 'stdio';
    const cmd = [cfg.command, ...(Array.isArray(cfg.args) ? cfg.args : [])].filter(Boolean).join(' ');

    out.push(makeEntity(ctx, {
      source: sourceId, kind: 'mcp', slug: name,
      name,
      description: cfg.url
        ? 'Serveur MCP distant (' + transport + ') : ' + cfg.url
        : (cmd ? 'Serveur MCP local : ' + cmd : 'Serveur MCP déclaré sans commande.'),
      file,
      meta: buildMeta({
        'transport': transport,
        'commande': cfg.command,
        'url': cfg.url,
        'variables d\'env': cfg.env ? Object.keys(cfg.env).join(', ') : null,
        'désactivé': cfg.disabled ? 'oui' : null,
      }),
      badges: cfg.disabled ? [{ text: 'désactivé', tone: 'muted' }] : [],
      content: clip('```json\n' + JSON.stringify(cfg, null, 2) + '\n```'),
    }));
  }
  return out;
}
