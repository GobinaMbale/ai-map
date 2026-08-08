// detail.js — fiche détaillée d'une entité, rendue dans un ONGLET de l'éditeur.
//
// Remplace la modale : une popup masque le reste, ne se garde pas ouverte et ne
// se met pas côte à côte. Un onglet se déplace, se scinde et se conserve.
//
// Structure : en-tête (nom, badges, actions) · sous-onglets · contenu Markdown.

const KIND_TONE = {
  skill: '#6366f1', command: '#0ea5e9', agent: '#8b5cf6', rule: '#10b981',
  prompt: '#ec4899', spec: '#14b8a6', requirement: '#22c55e', change: '#f43f5e',
  task: '#84cc16', workflow: '#a855f7', knowledge: '#eab308', memory: '#f59e0b',
  config: '#64748b', mcp: '#06b6d4', tool: '#f97316', document: '#94a3b8', code: '#38bdf8',
};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function nonce() {
  let out = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ----- Markdown minimal, sûr ----------------------------------------------
// Le HTML source est systématiquement échappé AVANT d'appliquer les motifs :
// le contenu vient de fichiers du projet, il ne doit jamais s'exécuter.
function markdown(src) {
  const lines = String(src || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  const inline = (t) => {
    let s = esc(t);
    const codes = [];
    s = s.replace(/`([^`]+)`/g, (m, p) => { codes.push(p); return '\u0000' + (codes.length - 1) + '\u0000'; });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, url) =>
      /^https?:/.test(url) ? `<a href="${url}">${txt}</a>` : txt);
    s = s.replace(/\u0000(\d+)\u0000/g, (m, k) => '<code>' + codes[+k] + '</code>');
    return s;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(esc(lines[i])); i++; }
      i++;
      out.push('<pre><code>' + buf.join('\n') + '</code></pre>');
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lvl = Math.min(h[1].length, 3);
      // Les titres de niveau 2 reçoivent la barre latérale colorée : c'est ce
      // qui donne la lecture par sections.
      out.push(`<h${lvl}${lvl === 2 ? ' class="sec"' : ''}>${inline(h[2])}</h${lvl}>`);
      i++; continue;
    }
    if (/^(---|\*\*\*|___)\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
    if (/^>\s?/.test(line)) {
      const q = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(inline(lines[i].replace(/^>\s?/, ''))); i++; }
      out.push('<blockquote>' + q.join('<br>') + '</blockquote>');
      continue;
    }
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const row = (l) => l.replace(/^\||\|\s*$/g, '').split('|').map((c) => c.trim());
      const head = row(lines[i]); const body = [];
      i += 2;
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) { body.push(row(lines[i])); i++; }
      out.push('<table><thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>' +
        body.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table>');
      continue;
    }
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        let text = lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, '');
        // Cases à cocher : rendues comme telles, pas comme du texte brut.
        const box = text.match(/^\[([ xX])\]\s+(.*)$/);
        if (box) {
          const done = box[1].toLowerCase() === 'x';
          items.push(`<li class="task ${done ? 'done' : ''}"><span>${done ? '☑' : '☐'}</span>${inline(box[2])}</li>`);
        } else {
          items.push('<li>' + inline(text) + '</li>');
        }
        i++;
      }
      out.push((ordered ? '<ol>' : '<ul>') + items.join('') + (ordered ? '</ol>' : '</ul>'));
      continue;
    }
    if (/^\s*$/.test(line)) { i++; continue; }

    const para = [inline(line)];
    i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) &&
      !/^(#{1,6}\s|>\s?|```|\s*([-*+]|\d+\.)\s|\|)/.test(lines[i]) &&
      !/^(---|\*\*\*|___)\s*$/.test(lines[i])) { para.push(inline(lines[i])); i++; }
    out.push('<p>' + para.join('<br>') + '</p>');
  }
  return out.join('\n');
}

// ----- Relations -----------------------------------------------------------
function relationsHtml(entity, model) {
  const g = model.graph || { nodes: [], edges: [] };
  const nodeById = new Map((g.nodes || []).map((n) => [n.id, n]));
  const verb = new Map((g.edgeTypes || []).map((t) => [t.type, t.verb]));

  const out = [];
  for (const e of g.edges || []) {
    const incoming = e.t === entity.id;
    if (e.s !== entity.id && !incoming) continue;
    const other = nodeById.get(incoming ? e.s : e.t);
    if (!other) continue;
    const tone = KIND_TONE[other.kind] || '#94a3b8';
    out.push(`<div class="rel" data-path="${esc(other.path || '')}">
      <span class="rel-verb">${esc((verb.get(e.type) || e.type) + (incoming ? ' par' : ''))}</span>
      <span class="rel-name" style="color:${tone}">${esc(other.label)}</span>
      <span class="rel-path">${esc(other.path || '')}</span>
      ${e.cross ? '<span class="rel-cross">transverse</span>' : ''}
    </div>`);
  }
  return out.length ? out.join('') : '<p class="muted">Aucune relation.</p>';
}

function metaHtml(entity) {
  const rows = (entity.meta || []).map((m) =>
    `<tr><th>${esc(m.k)}</th><td>${esc(m.v)}</td></tr>`).join('');
  const base = `<tr><th>chemin</th><td><code>${esc(entity.path || '—')}</code></td></tr>` +
    (entity.mtime ? `<tr><th>modifié le</th><td>${esc(new Date(entity.mtime).toLocaleString())}</td></tr>` : '');
  return `<table class="meta">${base}${rows}</table>`;
}

// ----- Page ----------------------------------------------------------------
function render(entity, model) {
  const n = nonce();
  const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${n}';`;
  const kind = (model.kindDict || {})[entity.kind] || { one: entity.kind };
  const source = (model.sources || []).find((s) => s.id === entity.source) || { label: entity.source };
  const tone = KIND_TONE[entity.kind] || '#94a3b8';

  const badges = (entity.badges || []).map((b) =>
    `<span class="badge ${esc(b.tone || 'muted')}">${esc(b.text)}</span>`).join('');

  const relCount = (model.graph.edges || [])
    .filter((e) => e.s === entity.id || e.t === entity.id).length;

  return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:var(--vscode-font-family);font-size:13px;
    color:var(--vscode-foreground);background:var(--vscode-editor-background)}
  .head{display:flex;align-items:flex-start;gap:14px;justify-content:space-between;
    padding:16px 22px 0;flex-wrap:wrap}
  .htitle{font-size:17px;font-weight:700;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .hbar{width:4px;height:20px;border-radius:2px;background:${tone};flex:0 0 auto}
  .hpath{font-size:11.5px;color:var(--vscode-descriptionForeground);margin-top:6px;
    font-family:var(--vscode-editor-font-family);word-break:break-all}
  .hact{display:flex;gap:8px;flex-wrap:wrap}
  .abtn{border:1px solid var(--vscode-panel-border,rgba(128,128,128,.35));border-radius:4px;
    background:transparent;color:var(--vscode-textLink-foreground);cursor:pointer;
    font-family:inherit;font-size:12px;padding:5px 11px}
  .abtn:hover{background:var(--vscode-toolbar-hoverBackground)}
  .badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
  .badge{font-size:10.5px;padding:2px 9px;border-radius:10px;
    background:var(--vscode-badge-background);color:var(--vscode-badge-foreground)}
  .badge.warn{background:rgba(245,158,11,.2);color:#e0a030}
  .badge.danger{background:rgba(244,63,94,.2);color:#f05070}
  .badge.ok{background:rgba(34,197,94,.2);color:#3fbf6a}
  .badge.info{background:rgba(99,102,241,.2);color:#7f82f5}
  .badge.kind{background:${tone}22;color:${tone}}
  nav{display:flex;gap:4px;padding:14px 22px 0;border-bottom:1px solid var(--vscode-panel-border,rgba(128,128,128,.25))}
  nav button{border:0;background:none;cursor:pointer;font-family:inherit;font-size:13px;
    color:var(--vscode-descriptionForeground);padding:9px 14px;border-bottom:2px solid transparent}
  nav button:hover{color:var(--vscode-foreground)}
  nav button.on{color:var(--vscode-textLink-foreground);border-bottom-color:var(--vscode-textLink-foreground)}
  .pane{display:none;padding:20px 22px 40px;max-width:900px}
  .pane.on{display:block}
  .muted{color:var(--vscode-descriptionForeground);font-style:italic}
  /* Sections Markdown : barre latérale colorée, comme un fil de lecture. */
  h1{font-size:19px;margin:22px 0 10px}
  h2.sec{font-size:15px;font-weight:700;margin:26px 0 12px;padding:9px 0 9px 14px;
    border-left:4px solid ${tone};background:${tone}12;border-radius:0 6px 6px 0;color:${tone}}
  h3{font-size:13.5px;margin:18px 0 8px}
  p{margin:9px 0;line-height:1.65}
  ul,ol{margin:9px 0;padding-left:22px;line-height:1.65}
  li{margin:4px 0}
  li.task{list-style:none;margin-left:-18px}
  li.task span{margin-right:7px}
  li.task.done{color:var(--vscode-descriptionForeground);text-decoration:line-through}
  code{font-family:var(--vscode-editor-font-family);font-size:12px;padding:1px 5px;border-radius:3px;
    background:var(--vscode-textCodeBlock-background,rgba(128,128,128,.18))}
  pre{background:var(--vscode-textCodeBlock-background,rgba(128,128,128,.12));border-radius:6px;
    padding:12px 14px;overflow:auto}
  pre code{background:none;padding:0;line-height:1.5;display:block}
  blockquote{border-left:3px solid ${tone};margin:12px 0;padding:2px 14px;
    color:var(--vscode-descriptionForeground)}
  table{border-collapse:collapse;margin:12px 0;display:block;overflow-x:auto}
  th,td{border:1px solid var(--vscode-panel-border,rgba(128,128,128,.3));padding:6px 11px;text-align:left;font-size:12.5px}
  th{background:var(--vscode-textCodeBlock-background,rgba(128,128,128,.12));font-weight:700}
  table.meta{display:table;width:100%}
  table.meta th{width:34%;white-space:nowrap}
  .rel{display:flex;align-items:baseline;gap:10px;padding:9px 11px;border-radius:6px;cursor:pointer;
    border:1px solid transparent;flex-wrap:wrap}
  .rel:hover{background:var(--vscode-list-hoverBackground);border-color:var(--vscode-panel-border,rgba(128,128,128,.3))}
  .rel-verb{font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;
    color:var(--vscode-descriptionForeground);min-width:88px}
  .rel-name{font-weight:600;font-size:12.5px}
  .rel-path{font-size:10.5px;color:var(--vscode-descriptionForeground);
    font-family:var(--vscode-editor-font-family);margin-left:auto}
  .rel-cross{font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;padding:1px 7px;
    border-radius:9px;background:rgba(99,102,241,.2);color:#7f82f5}
  hr{border:0;border-top:1px solid var(--vscode-panel-border,rgba(128,128,128,.3));margin:18px 0}
</style></head><body>
<div class="head">
  <div>
    <div class="htitle"><span class="hbar"></span>${esc(entity.name)}</div>
    <div class="hpath">${esc(entity.path || 'entité dérivée — aucun fichier')}</div>
    <div class="badges">
      <span class="badge kind">${esc(kind.one)}</span>
      <span class="badge">${esc(source.label)}</span>
      ${badges}
    </div>
  </div>
  <div class="hact">
    ${entity.path ? '<button class="abtn" data-cmd="open">Ouvrir le fichier ↗</button>' : ''}
    <button class="abtn" data-cmd="report">Voir la carte complète</button>
  </div>
</div>

<nav>
  <button class="on" data-pane="content">Contenu</button>
  <button data-pane="relations">Relations <small>${relCount}</small></button>
  <button data-pane="meta">Métadonnées</button>
</nav>

<div class="pane on" id="content">${entity.content ? markdown(entity.content) : '<p class="muted">Aucun contenu textuel.</p>'}</div>
<div class="pane" id="relations">${relationsHtml(entity, model)}</div>
<div class="pane" id="meta">${metaHtml(entity)}</div>

<script nonce="${n}">
  const vscode = acquireVsCodeApi();
  document.querySelectorAll('nav button').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('nav button').forEach(function(x){ x.classList.remove('on'); });
      document.querySelectorAll('.pane').forEach(function(p){ p.classList.remove('on'); });
      b.classList.add('on');
      document.getElementById(b.dataset.pane).classList.add('on');
    });
  });
  document.querySelectorAll('.abtn').forEach(function(b){
    b.addEventListener('click', function(){ vscode.postMessage({ type:b.dataset.cmd }); });
  });
  document.querySelectorAll('.rel').forEach(function(r){
    r.addEventListener('click', function(){
      if(r.dataset.path) vscode.postMessage({ type:'openPath', path:r.dataset.path });
    });
  });
</script></body></html>`;
}

module.exports = { render };
