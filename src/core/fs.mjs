// core/fs.mjs — accès disque. Helpers purs, sans état global.
// Tout ce qui dépend du projet reçoit un chemin en argument.

import fs from 'node:fs';
import path from 'node:path';

export function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
export function isFile(p) { try { return fs.statSync(p).isFile(); } catch { return false; } }
export function exists(p) { try { fs.statSync(p); return true; } catch { return false; } }
export function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }
export function readJson(p) { try { return JSON.parse(read(p)); } catch { return null; } }

// Date de dernière modification, en ISO. Alimente la Timeline ; `null` si le
// fichier est illisible — la Timeline ignore alors simplement l'entité.
export function mtimeOf(p) {
  try { return fs.statSync(p).mtime.toISOString(); } catch { return null; }
}

export function listDir(p) { try { return fs.readdirSync(p).sort(); } catch { return []; } }
export function listSubdirs(p) { return listDir(p).filter((n) => isDir(path.join(p, n))); }
export function listFiles(p, ext) {
  return listDir(p).filter((n) => isFile(path.join(p, n)) && (!ext || n.endsWith(ext)));
}

// Chemin relatif à la racine du projet, toujours en séparateurs POSIX (stable
// entre Windows et Unix → sortie déterministe).
export function relFrom(root, p) { return path.relative(root, p).split(path.sep).join('/'); }

// Clé de comparaison de chemins (insensible à la casse et aux séparateurs).
export function normPath(p) { return path.resolve(p).replace(/\\/g, '/').toLowerCase(); }

// Parcours récursif. `ext` filtre l'extension ; `skip` exclut des noms de dossier.
export function walk(dir, cb, ext, skip) {
  const skipSet = new Set(skip || []);
  (function rec(d) {
    for (const name of listDir(d)) {
      const p = path.join(d, name);
      if (isDir(p)) { if (!skipSet.has(name)) rec(p); }
      else if (!ext || name.endsWith(ext)) cb(p);
    }
  })(dir);
}
