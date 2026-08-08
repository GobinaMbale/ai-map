// core/parser.mjs — extraction de sens depuis du texte (frontmatter, Markdown).
// Responsabilité unique : transformer du texte brut en données structurées.
// Aucun accès disque, aucune notion d'écosystème.

// ----- Frontmatter YAML (sous-ensemble : key: value, listes [a, b]) ---------
export function parseFrontmatter(content) {
  if (!content.startsWith('---')) return { data: {}, body: content };
  const end = content.indexOf('\n---', 3);
  if (end === -1) return { data: {}, body: content };
  const raw = content.slice(3, end).replace(/^\r?\n/, '');
  const body = content.slice(content.indexOf('\n', end + 1) + 1);
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) data[m[1]] = parseYamlValue(m[2]);
  }
  return { data, body };
}
function parseYamlValue(v) {
  v = v.trim();
  if (v === '') return '';
  if (v.startsWith('[') && v.endsWith(']')) {
    return v.slice(1, -1).split(',').map((s) => stripQuotes(s.trim())).filter(Boolean);
  }
  return stripQuotes(v);
}
function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  return s;
}

// ----- YAML : sous-ensemble suffisant pour les fichiers de config IA -------
//
// Couvre : maps imbriquées par indentation, listes de scalaires, listes de maps
// (`- clé: valeur`), listes en ligne `[a, b]`, chaînes quotées, blocs `|` / `>`.
// NE couvre PAS : ancres/alias, tags, clés complexes, flow-mapping `{a: 1}`.
// Renvoie `null` si le texte sort de ce périmètre — l'appelant doit alors
// dégrader proprement plutôt que planter.
export function parseYamlLite(text) {
  try {
    const lines = [];
    for (const raw of String(text).replace(/\r\n/g, '\n').split('\n')) {
      const clean = stripYamlComment(raw);
      if (!clean.trim()) continue;
      if (clean.trim() === '---') continue;
      lines.push({ indent: clean.match(/^ */)[0].length, text: clean.trim() });
    }
    if (!lines.length) return null;
    const [value] = yamlBlock(lines, 0, lines[0].indent);
    return value;
  } catch { return null; }
}

// Retire un commentaire `#` sauf s'il est à l'intérieur d'une chaîne quotée.
function stripYamlComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) { if (c === quote && line[i - 1] !== '\\') quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '#' && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
  }
  return line;
}

function yamlBlock(lines, i, indent) {
  if (i >= lines.length) return [null, i];
  return lines[i].text.startsWith('-') ? yamlSeq(lines, i, indent) : yamlMap(lines, i, indent);
}

function yamlMap(lines, i, indent) {
  const out = {};
  while (i < lines.length && lines[i].indent === indent && !lines[i].text.startsWith('- ')) {
    const m = lines[i].text.match(/^("[^"]*"|'[^']*'|[^:]+):\s*(.*)$/);
    if (!m) { i++; continue; }
    const key = stripQuotes(m[1].trim());
    const rest = m[2].trim();
    i++;
    if (rest === '' || rest === '|' || rest === '>') {
      const deeper = i < lines.length && lines[i].indent > indent;
      if (!deeper) { out[key] = rest === '' ? null : ''; continue; }
      if (rest === '|' || rest === '>') {
        // Bloc littéral / replié : on collecte le texte, sans en interpréter la structure.
        const base = lines[i].indent, buf = [];
        while (i < lines.length && lines[i].indent >= base) { buf.push(lines[i].text); i++; }
        out[key] = buf.join(rest === '|' ? '\n' : ' ');
      } else {
        const [val, next] = yamlBlock(lines, i, lines[i].indent);
        out[key] = val; i = next;
      }
    } else {
      out[key] = yamlScalar(rest);
    }
  }
  return [out, i];
}

function yamlSeq(lines, i, indent) {
  const out = [];
  while (i < lines.length && lines[i].indent === indent && lines[i].text.startsWith('-')) {
    const after = lines[i].text.replace(/^-\s*/, '');
    if (after === '') {
      // Élément dont le contenu est sur les lignes suivantes, plus indentées.
      i++;
      if (i < lines.length && lines[i].indent > indent) {
        const [val, next] = yamlBlock(lines, i, lines[i].indent); out.push(val); i = next;
      } else out.push(null);
    } else if (/^("[^"]*"|'[^']*'|[^:]+):(\s|$)/.test(after)) {
      // « - clé: valeur » : une map dont la première clé partage la ligne du tiret.
      const childIndent = indent + 2;
      const block = [{ indent: childIndent, text: after }];
      i++;
      while (i < lines.length && lines[i].indent > indent) {
        block.push({ indent: childIndent + (lines[i].indent - (indent + 2)), text: lines[i].text });
        i++;
      }
      const [val] = yamlBlock(block, 0, childIndent);
      out.push(val);
    } else {
      out.push(yamlScalar(after)); i++;
    }
  }
  return [out, i];
}

function yamlScalar(v) {
  v = v.trim();
  if (v === '') return '';
  if (v === 'null' || v === '~') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+$/.test(v)) return Number(v);
  if (v.startsWith('[') && v.endsWith(']')) {
    return v.slice(1, -1).split(',').map((s) => yamlScalar(s)).filter((s) => s !== '');
  }
  return stripQuotes(v);
}

// ----- Markdown : titres, paragraphes, liens -------------------------------
export function firstHeading(body) {
  const m = body.match(/^#{1,3}\s+(.+)$/m);
  return m ? m[1].trim().replace(/[*`_]/g, '') : null;
}

export function firstParagraph(body) {
  for (const l of body.split(/\r?\n/)) {
    const t = l.trim();
    if (!t) continue;
    if (t.startsWith('#') || t.startsWith('>') || t.startsWith('---') ||
        t.startsWith('|') || t.startsWith('```')) continue;
    return t.replace(/[*`_]/g, '').replace(/^[-*+]\s+/, '').slice(0, 300);
  }
  return '';
}

export function headings(body, max = 12) {
  const out = [];
  const re = /^(#{1,3})\s+(.+)$/gm;
  let m;
  while ((m = re.exec(body)) && out.length < max) {
    out.push({ level: m[1].length, text: m[2].trim().replace(/[*`_]/g, '') });
  }
  return out;
}

// Sections de niveau `level` : [{ title, body }]. Sert à découper un spec.md
// en exigences ou un tasks.md en lots de tâches.
export function sectionsOf(body, level) {
  const marker = '#'.repeat(level);
  const re = new RegExp('^' + marker + '\\s+(.+)$', 'gm');
  const heads = [];
  let m;
  while ((m = re.exec(body))) heads.push({ title: m[1].trim().replace(/[*`_]/g, ''), start: m.index, after: re.lastIndex });
  return heads.map((h, i) => ({
    title: h.title,
    body: body.slice(h.after, i + 1 < heads.length ? heads[i + 1].start : body.length).trim(),
  }));
}

// Liens Markdown relatifs : `[texte](chemin)`. Ignore http/mailto/ancres.
export function findMdLinks(body) {
  const out = new Set();
  const re = /\]\(([^)\s]+)\)/g;
  let m;
  while ((m = re.exec(body))) {
    const tgt = m[1].split('#')[0].trim();
    if (tgt && !/^(https?:|mailto:|tel:|#|data:)/i.test(tgt)) out.add(tgt);
  }
  return [...out];
}

// Références `[[wiki]]`.
export function findWikiLinks(body) {
  const out = new Set();
  const re = /\[\[([a-z0-9 _\/-]+)\]\]/gi;
  let m;
  while ((m = re.exec(body))) out.add(m[1].trim());
  return [...out];
}

// Chemins de fichiers cités en code inline : `src/auth/session.ts`.
// C'est la façon dont on écrit réellement une référence au code dans un
// CLAUDE.md ou une skill — bien plus souvent qu'avec un lien Markdown.
// On ne fait que PROPOSER des candidats : core/graph ne retient que ceux qui
// existent vraiment sur le disque.
export function findCodePaths(body) {
  const out = new Set();
  const re = /`([^`\n]+)`/g;
  let m;
  while ((m = re.exec(body))) {
    const cand = m[1].trim();
    if (looksLikePath(cand)) out.add(cand);
  }
  return [...out];
}

function looksLikePath(s) {
  if (s.length < 3 || s.length > 200) return false;
  if (/\s/.test(s)) return false;                    // « npm run build » n'est pas un chemin
  if (/^(https?|mailto|tel):/i.test(s)) return false;
  if (/[*?{}()<>|"']/.test(s)) return false;         // globs et fragments de commande
  if (s.startsWith('-')) return false;               // options de CLI
  // Soit une arborescence (`src/auth/x.ts`), soit un fichier nommé (`package.json`).
  return s.includes('/') || /\.[A-Za-z0-9]{1,8}$/.test(s);
}

// Cases à cocher `- [x] libellé`. Renvoie { items, done, total }.
export function parseChecklist(body) {
  const items = [];
  const re = /^\s*[-*+]\s*\[([ xX])\]\s+(.+)$/gm;
  let m;
  while ((m = re.exec(body))) {
    items.push({ done: m[1].toLowerCase() === 'x', text: m[2].trim().replace(/[*`_]/g, '') });
  }
  return { items, done: items.filter((i) => i.done).length, total: items.length };
}

// ----- Utilitaires ---------------------------------------------------------
export function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'sans-nom';
}

// Paires clé/valeur affichées en badges ; ignore les valeurs vides.
export function buildMeta(obj) {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) continue;
    out.push({ k, v: Array.isArray(v) ? v.join(', ') : String(v) });
  }
  return out;
}

export const MAX_CONTENT_CHARS = 120000;
export function clip(text) {
  const t = (text || '').trim();
  if (t.length <= MAX_CONTENT_CHARS) return t;
  return t.slice(0, MAX_CONTENT_CHARS) + '\n\n… (contenu tronqué pour l\'affichage)';
}
