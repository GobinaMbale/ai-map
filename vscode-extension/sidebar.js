// sidebar.js — HTML de la vue latérale AI-MAP.
//
// Une TreeView ne sait afficher qu'une ligne de texte par nœud. Pour obtenir des
// FICHES (titre, description, étiquettes colorées, avancement, date) il faut une
// WebviewView : ce fichier produit son HTML.
//
// Le rendu utilise exclusivement les variables CSS de VS Code (--vscode-*) pour
// suivre le thème de l'utilisateur sans le deviner.

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

// ----- États sans données --------------------------------------------------
// Un panneau vide est indiscernable d'un plantage : chaque état sans donnée
// nomme la situation et propose l'action qui en sort.
function emptyState(opts) {
  return `<div class="state">
    <div class="state-icon">${opts.icon}</div>
    <div class="state-title">${esc(opts.title)}</div>
    <div class="state-body">${esc(opts.body)}</div>
    ${opts.cmd ? `<button class="state-btn" data-cmd="${esc(opts.cmd)}">${esc(opts.label)}</button>` : ''}
    ${opts.note ? `<div class="state-note">${opts.note}</div>` : ''}
    ${opts.altCmd ? `<button class="state-link" data-cmd="${esc(opts.altCmd)}">${esc(opts.altLabel)}</button>` : ''}
  </div>`;
}

function stateHtml(state) {
  if (state === 'nofolder') {
    return emptyState({
      icon: '📂', title: 'Aucun dossier ouvert',
      body: 'AI-MAP cartographie l\'écosystème IA d\'un projet.',
      label: 'Ouvrir un dossier', cmd: 'openFolder',
    });
  }
  if (state === 'loading') {
    return emptyState({
      icon: '⏳', title: 'Analyse en cours…',
      body: 'Lecture des configurations IA du projet.',
    });
  }
  if (state === 'error') {
    return emptyState({
      icon: '⚠️', title: 'L\'analyse a échoué',
      body: 'Le moteur AI-MAP n\'a pas pu produire de carte pour ce dossier.',
      label: 'Réessayer', cmd: 'refresh',
    });
  }
  return emptyState({
    icon: '📂', title: 'Aucune configuration IA détectée',
    body: 'Ce dossier ne contient encore aucune configuration IA versionnée.',
    label: '🚀 Créer un CLAUDE.md', cmd: 'bootstrap',
    note: 'Emplacements recherchés&nbsp;:<br>' +
      '<code>.claude/</code> · <code>CLAUDE.md</code> · <code>.mcp.json</code> · <code>openspec/</code><br>' +
      '<code>.cursor/</code> · <code>.github/</code> · <code>.roo/</code> · <code>.windsurf/</code> · <code>mcp.json</code>',
    altLabel: 'Analyser à nouveau', altCmd: 'refresh',
  });
}

// ----- Fiches --------------------------------------------------------------
function cardHtml(entity, model) {
  const kindMeta = (model.kindDict || {})[entity.kind] || { one: entity.kind };
  const source = (model.sources || []).find((s) => s.id === entity.source) || { label: entity.source };
  const tone = KIND_TONE[entity.kind] || '#94a3b8';

  const badges = (entity.badges || []).map((b) =>
    `<span class="tag tone-${esc(b.tone || 'muted')}">${esc(b.text)}</span>`).join('');

  // Avancement : présent sur les tâches et les changes (« 3/8 »).
  const adv = (entity.meta || []).find((m) => m.k === 'avancement');
  let progress = '';
  if (adv) {
    const m = String(adv.v).match(/(\d+)\s*\/\s*(\d+)/);
    if (m) {
      const pct = Number(m[2]) ? (Number(m[1]) / Number(m[2])) * 100 : 0;
      progress = `<div class="bar"><span style="width:${pct}%;background:${tone}"></span></div>`;
    }
  }

  const date = entity.mtime ? new Date(entity.mtime).toLocaleDateString() : '';
  const foot = adv ? esc(adv.v) : esc(entity.path || '');

  // La barre de gauche porte le STATUT quand il existe (change OpenSpec), sinon
  // l'urgence (alerte), sinon le type. C'est ce qui rend la liste lisible d'un
  // coup d'œil au lieu d'être uniformément plate.
  const status = (model.statuses || []).find((s) => s.key === entity.status);
  const edge = status ? status.color
    : (entity.tone === 'danger' ? '#f05070'
      : entity.tone === 'warn' ? '#e0a030' : tone);
  const flag = entity.tone === 'danger' || entity.tone === 'warn' ? ' flag' : '';

  return `<article class="card${flag}" style="border-left-color:${edge}"
      data-id="${esc(entity.id)}" data-path="${esc(entity.path || '')}"
      data-search="${esc((entity.name + ' ' + entity.description + ' ' + (entity.path || '')).toLowerCase())}">
    <h3 style="color:${tone}">${esc(entity.name)}</h3>
    <p>${esc(entity.description)}</p>
    <div class="tags">
      <span class="tag" style="background:${tone}22;color:${tone};border-color:${tone}55">${esc(kindMeta.one)}</span>
      <span class="tag">${esc(source.label)}</span>
      ${badges}
    </div>
    ${progress}
    <div class="foot"><span class="path">${foot}</span><span class="date">${esc(date)}</span></div>
  </article>`;
}

function groupHtml(label, entities, model, accent) {
  if (!entities.length) return '';
  const cards = entities.map((e) => cardHtml(e, model)).join('');
  return `<section class="group">
    <header class="ghead">
      <span class="caret">▼</span>
      <span class="gname"${accent ? ` style="color:${accent}"` : ''}>${esc(label)}</span>
      <span class="gcount">${entities.length}</span>
    </header>
    <div class="gbody">${cards}</div>
  </section>`;
}

// Onglets de la vue. « Alertes » et « Changes » n'apparaissent que s'ils ont
// quelque chose à montrer : un onglet vide est un onglet trompeur.
function tabsHtml(model) {
  const alerts = model.entities.filter((e) => e.tone === 'warn' || e.tone === 'danger');
  const changes = model.entities.filter((e) => e.kind === 'change');
  const tabs = [
    { key: 'all', label: 'Entités', count: model.totals.entities },
    alerts.length ? { key: 'alerts', label: 'Alertes', count: alerts.length, tone: 'warn' } : null,
    changes.length ? { key: 'changes', label: 'Changes', count: changes.length } : null,
  ].filter(Boolean);

  if (tabs.length === 1) return { nav: '', alerts, changes };

  const nav = `<nav class="vtabs">${tabs.map((t, i) =>
    `<button class="vtab${i === 0 ? ' on' : ''}${t.tone ? ' ' + t.tone : ''}" data-tab="${t.key}">
      ${esc(t.label)}<span class="vcount">${t.count}</span>
    </button>`).join('')}</nav>`;
  return { nav, alerts, changes };
}

// Regroupement des changes par STATUT — la lecture « Draft 9 / En cours 3 »,
// bien plus parlante qu'une liste à plat.
function changesHtml(changes, model) {
  const statuses = model.statuses || [];
  const known = statuses.map((s) =>
    groupHtml(s.label, changes.filter((c) => c.status === s.key), model, s.color)).join('');
  const orphan = changes.filter((c) => !statuses.some((s) => s.key === c.status));
  return known + groupHtml('Sans statut', orphan, model);
}

// ----- Page complète -------------------------------------------------------
function render(webview, model, state) {
  const n = nonce();
  const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${n}';`;

  let body;
  if (!model || !model.totals || !model.totals.entities) {
    body = stateHtml(state);
  } else {
    const { nav, alerts, changes } = tabsHtml(model);
    const byEcosystem = (model.sources || [])
      .filter((s) => s.detected)
      .map((s) => groupHtml(s.label, model.entities.filter((e) => e.source === s.id), model, s.color))
      .join('');
    const cross = (model.graph && model.graph.edges || []).filter((e) => e.cross).length;

    body = `<div class="summary">
        <strong>${model.totals.entities}</strong> entités ·
        <strong>${model.totals.edges}</strong> relations ·
        <strong>${cross}</strong> transverses
      </div>
      ${nav}
      <input id="q" type="search" placeholder="Rechercher une entité…" autocomplete="off">
      <div id="noresult" class="noresult" hidden>Aucune entité ne correspond.</div>
      <div class="vpane on" data-pane="all">${byEcosystem}</div>
      ${alerts.length ? `<div class="vpane" data-pane="alerts">${groupHtml('À traiter', alerts, model, '#e0a030')}</div>` : ''}
      ${changes.length ? `<div class="vpane" data-pane="changes">${changesHtml(changes, model)}</div>` : ''}`;
  }

  return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:10px 12px 20px;font-family:var(--vscode-font-family);
    font-size:var(--vscode-font-size);color:var(--vscode-foreground);background:transparent}
  .summary{font-size:11.5px;color:var(--vscode-descriptionForeground);margin:0 0 10px;line-height:1.5}
  .summary strong{color:var(--vscode-foreground)}
  #q{width:100%;padding:6px 9px;margin:0 0 14px;border-radius:4px;
    background:var(--vscode-input-background);color:var(--vscode-input-foreground);
    border:1px solid var(--vscode-input-border,transparent);font-family:inherit;font-size:12.5px;outline:none}
  #q:focus{border-color:var(--vscode-focusBorder)}
  .group{margin:0 0 16px}
  .ghead{display:flex;align-items:center;gap:7px;cursor:pointer;user-select:none;padding:3px 0;margin:0 0 8px}
  .caret{font-size:9px;color:var(--vscode-descriptionForeground);width:10px}
  .gname{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
  .gcount{margin-left:auto;font-size:10.5px;padding:1px 7px;border-radius:9px;
    background:var(--vscode-badge-background);color:var(--vscode-badge-foreground)}
  .group.collapsed .gbody{display:none}
  .group.collapsed .caret{transform:rotate(-90deg)}
  .vtabs{display:flex;gap:2px;margin:0 0 12px;border-bottom:1px solid var(--vscode-panel-border,rgba(128,128,128,.25))}
  .vtab{border:0;background:none;cursor:pointer;font-family:inherit;font-size:11.5px;font-weight:600;
    color:var(--vscode-descriptionForeground);padding:7px 10px;display:inline-flex;align-items:center;gap:6px;
    border-bottom:2px solid transparent;margin-bottom:-1px}
  .vtab:hover{color:var(--vscode-foreground)}
  .vtab.on{color:var(--vscode-textLink-foreground);border-bottom-color:var(--vscode-textLink-foreground)}
  .vtab.warn.on{color:#e0a030;border-bottom-color:#e0a030}
  .vcount{font-size:10px;padding:0 6px;border-radius:8px;
    background:var(--vscode-badge-background);color:var(--vscode-badge-foreground)}
  .vpane{display:none}
  .vpane.on{display:block}
  /* Barre de gauche = statut ou urgence : la liste se lit d'un coup d'œil. */
  .card{border:1px solid var(--vscode-panel-border,rgba(128,128,128,.3));border-left:3px solid transparent;
    border-radius:6px;padding:10px 11px;margin:0 0 8px;cursor:pointer;
    background:var(--vscode-editor-background)}
  .card:hover{border-color:var(--vscode-focusBorder)}
  .card.flag{background:var(--vscode-inputValidation-warningBackground,rgba(245,158,11,.07))}
  .card h3{margin:0;font-size:12.5px;font-weight:600;line-height:1.35;word-break:break-word}
  .card p{margin:5px 0 0;font-size:11.5px;line-height:1.45;color:var(--vscode-descriptionForeground);
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
  .tag{font-size:10px;padding:1px 7px;border-radius:4px;border:1px solid transparent;
    background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);white-space:nowrap}
  .tone-warn{background:rgba(245,158,11,.18);color:#e0a030;border-color:rgba(245,158,11,.4)}
  .tone-danger{background:rgba(244,63,94,.18);color:#f05070;border-color:rgba(244,63,94,.4)}
  .tone-ok{background:rgba(34,197,94,.18);color:#3fbf6a;border-color:rgba(34,197,94,.4)}
  .tone-info{background:rgba(99,102,241,.18);color:#7f82f5;border-color:rgba(99,102,241,.4)}
  .bar{height:4px;border-radius:3px;margin-top:9px;overflow:hidden;
    background:var(--vscode-panel-border,rgba(128,128,128,.25))}
  .bar span{display:block;height:100%;border-radius:3px}
  .foot{display:flex;justify-content:space-between;gap:8px;margin-top:8px;
    font-size:10.5px;color:var(--vscode-descriptionForeground)}
  .path{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--vscode-editor-font-family)}
  .date{flex:0 0 auto}
  .noresult{font-size:12px;color:var(--vscode-descriptionForeground);font-style:italic;padding:8px 0}
  .state{text-align:center;padding:40px 14px}
  .state-icon{font-size:34px;margin-bottom:14px;line-height:1}
  .state-title{font-size:14px;font-weight:700;margin-bottom:8px}
  .state-body{font-size:12px;line-height:1.55;color:var(--vscode-descriptionForeground)}
  .state-btn{margin-top:20px;padding:8px 18px;border:0;border-radius:4px;cursor:pointer;
    font-family:inherit;font-size:12.5px;font-weight:600;
    background:var(--vscode-button-background);color:var(--vscode-button-foreground)}
  .state-btn:hover{background:var(--vscode-button-hoverBackground)}
  .state-note{margin-top:22px;font-size:10.5px;line-height:1.7;
    color:var(--vscode-descriptionForeground);opacity:.75}
  .state-note code{font-family:var(--vscode-editor-font-family);font-size:10px}
  .state-link{margin-top:14px;background:none;border:0;cursor:pointer;font-family:inherit;
    font-size:11.5px;text-decoration:underline;color:var(--vscode-textLink-foreground)}
</style></head><body>
${body}
<script nonce="${n}">
  const vscode = acquireVsCodeApi();

  document.querySelectorAll('.state-btn').forEach(function(b){
    b.addEventListener('click', function(){ vscode.postMessage({ type: b.dataset.cmd }); });
  });

  // Un clic ouvre la fiche détaillée dans un onglet plutôt qu'une popup.
  document.querySelectorAll('.card').forEach(function(c){
    c.addEventListener('click', function(){
      vscode.postMessage({ type:'openDetail', id:c.dataset.id, path:c.dataset.path });
    });
  });

  document.querySelectorAll('.ghead').forEach(function(h){
    h.addEventListener('click', function(){ h.parentElement.classList.toggle('collapsed'); });
  });

  document.querySelectorAll('.vtab').forEach(function(t){
    t.addEventListener('click', function(){
      document.querySelectorAll('.vtab').forEach(function(x){ x.classList.remove('on'); });
      document.querySelectorAll('.vpane').forEach(function(p){ p.classList.remove('on'); });
      t.classList.add('on');
      var pane = document.querySelector('.vpane[data-pane="' + t.dataset.tab + '"]');
      if(pane) pane.classList.add('on');
      filter();
    });
  });

  var q = document.getElementById('q');
  function filter(){
    var needle = q ? q.value.toLowerCase().trim() : '';
    var pane = document.querySelector('.vpane.on');
    var shown = 0;
    document.querySelectorAll('.card').forEach(function(c){
      var hit = !needle || c.dataset.search.indexOf(needle) !== -1;
      c.hidden = !hit;
      // On ne compte que le volet visible, sinon « aucun résultat » resterait
      // masqué à cause d'une correspondance dans un onglet non affiché.
      if(hit && pane && pane.contains(c)) shown++;
    });
    document.querySelectorAll('.group').forEach(function(g){
      g.hidden = !g.querySelector('.card:not([hidden])');
    });
    var nr = document.getElementById('noresult');
    if(nr) nr.hidden = shown > 0;
  }
  if(q) q.addEventListener('input', filter);
</script></body></html>`;
}

module.exports = { render };
