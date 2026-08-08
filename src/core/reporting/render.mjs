// core/reporting/render.mjs — page HTML autoportante.
// Responsabilité unique : templating. Aucune logique métier ici.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// En dev on lit les assets sur le disque ; le bundle autonome (build.mjs)
// injecte globalThis.__AI_MAP_ASSETS et court-circuite le disque.
const INLINE = globalThis.__AI_MAP_ASSETS || null;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const asset = (name) => (INLINE ? INLINE[name] : fs.readFileSync(path.join(HERE, 'assets', name), 'utf8'));

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function renderHtml(model) {
  // `<` est échappé dans le JSON pour qu'une valeur contenant « </script> »
  // ne referme pas la balise prématurément.
  const dataJson = JSON.stringify(model).replace(/</g, '\\u003c');

  return '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>AI-MAP — ' + escapeHtml(model.project) + '</title>\n' +
    '<style>\n' + asset('styles.css') + '\n</style>\n</head>\n<body>\n' +
    '<div id="app"></div>\n' +
    '<script>const DATA = ' + dataJson + ';</script>\n' +
    '<script>\n' + asset('app.js') + '\n</script>\n</body>\n</html>\n';
}