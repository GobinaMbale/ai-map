(function(){
  var root = document.getElementById('app');

  // Deux dimensions de filtrage — c'est la différence structurante avec une
  // carte mono-écosystème : on filtre par TYPE d'entité et par ÉCOSYSTÈME.
  // `tab` découpe le rapport : tout empiler dans un seul défilement rendait la
  // page illisible dès qu'un projet dépassait quelques dizaines d'entités.
  var state = { q:'', kind:'all', source:'all', tab:'overview', detail:null, impact:null };

  var TABS = [
    { key:'overview',   icon:'▦', label:'Vue d\'ensemble' },
    { key:'impact',     icon:'🎯', label:'Impact' },
    { key:'governance', icon:'⚖️', label:'Gouvernance' },
    { key:'graph',      icon:'🕸', label:'Graphe' },
    { key:'timeline',   icon:'🕰', label:'Timeline' },
    { key:'entities',   icon:'📇', label:'Entités' },
    { key:'tree',       icon:'🌳', label:'Fichiers' },
  ];

  // ----- Rôles dans le fil d'impact -----------------------------------------
  // Le fil se lit toujours dans le même sens : ce qui PRESCRIT → ce qui AGIT →
  // ce que ça ATTEINT. C'est la lecture décrite par la vision
  // (« Requirement → Skill → MCP Tool → Code »), généralisée à tous les outils.
  // Les rangs ordonnent le fil : une exigence explique mieux « pourquoi » qu'un
  // CLAUDE.md, et un serveur MCP ou un fichier de code disent mieux « quoi »
  // qu'un outil générique (Bash, Read…).
  var ORIGIN_KINDS = { requirement:0, spec:1, change:2, rule:3, knowledge:4, memory:5 };
  var ACTOR_KINDS  = { skill:1, command:1, agent:1, workflow:1, prompt:1 };
  var TARGET_KINDS = { mcp:0, code:1, tool:2 };
  var GENERIC_TARGET_RANK = 2;

  function el(tag, cls, txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch];}); }

  function kindOf(key){ return DATA.kindDict[key] || { label:key, one:key, icon:'•', color:'#94a3b8' }; }
  function srcOf(id){
    for(var i=0;i<DATA.sources.length;i++){ if(DATA.sources[i].id===id) return DATA.sources[i]; }
    return { id:id, label:id, icon:'•', color:'#94a3b8' };
  }
  var byId = {}; DATA.entities.forEach(function(e){ byId[e.id]=e; });

  // ---------------------------------------------------------------- rendu --
  // Ossature de la page : elle ne change jamais. Seul le contenu de l'onglet
  // actif est reconstruit, ce qui garde le défilement court et prévisible.
  function render(){
    root.innerHTML='';
    var wrap = el('div','wrap');

    var head = el('header','top');
    var titleBox = el('div','title');
    var h1 = el('h1'); h1.textContent='AI-MAP — '+DATA.project;
    var detected = DATA.sources.filter(function(s){ return s.detected; });
    var sub = el('div','sub');
    sub.textContent = detected.length+' écosystème(s) · '+DATA.totals.entities+' entités · '
      +DATA.totals.edges+' relations · '+new Date(DATA.generatedAt).toLocaleDateString();
    titleBox.appendChild(h1); titleBox.appendChild(sub);
    var themeBtn = el('button','btn','◐ Thème'); themeBtn.onclick=toggleTheme;
    head.appendChild(titleBox); head.appendChild(themeBtn);
    wrap.appendChild(head);

    wrap.appendChild(buildTabs());

    var main = el('div'); main.id='tab-content';
    wrap.appendChild(main);

    var foot = el('footer');
    foot.textContent='Généré par AI-MAP · page autoportante, aucune connexion requise.';
    wrap.appendChild(foot);

    root.appendChild(wrap);
    renderTab();
  }

  function buildTabs(){
    var bar = el('nav','tabs');
    TABS.forEach(function(t){
      var b = el('button','tab'+(state.tab===t.key?' on':''));
      b.appendChild(el('span','ticon',t.icon));
      b.appendChild(document.createTextNode(t.label));
      var n = tabCount(t.key);
      if(n!=null) b.appendChild(el('span','tcount',String(n)));
      b.onclick=function(){ if(state.tab!==t.key){ state.tab=t.key; render(); } };
      bar.appendChild(b);
    });
    return bar;
  }

  function tabCount(key){
    if(key==='entities') return DATA.totals.entities;
    if(key==='graph') return DATA.totals.edges;
    if(key==='overview') return DATA.totals.sources;
    return null;
  }

  // Un seul point d'entrée pour peupler l'onglet courant. Le graphe est arrêté
  // systématiquement : il installe des écouteurs globaux qu'il faut libérer.
  function renderTab(){
    if(graphApi){ graphApi.stop(); graphApi=null; }
    var c = document.getElementById('tab-content');
    if(!c) return;
    c.innerHTML='';

    if(state.detail && byId[state.detail]){ c.appendChild(buildDetailPage(byId[state.detail])); return; }

    if(state.tab==='overview'){
      c.appendChild(buildKpis());
      c.appendChild(buildKindTiles());
      c.appendChild(buildSourcesPanel());
      c.appendChild(buildHistogram());
    } else if(state.tab==='governance'){
      // Le détail du score, les alertes et les leviers sont réunis ici : c'est
      // le poste de travail de la gouvernance, pas un encart du tableau de bord.
      c.appendChild(buildScorePanel());
      c.appendChild(buildRecoPanel());
      var reco = el('div'); reco.id='reco-detail';
      c.appendChild(reco);
      c.appendChild(buildAlertsPanel());
    } else if(state.tab==='impact'){
      c.appendChild(buildImpactPanel());
      var ch = buildChangesPanel();
      if(ch) c.appendChild(ch);
    } else if(state.tab==='graph'){
      c.appendChild(buildGraphPanel());
      initGraph();
    } else if(state.tab==='timeline'){
      c.appendChild(buildTimelinePanel());
    } else if(state.tab==='entities'){
      c.appendChild(buildToolbar());
      var zone = el('div'); zone.id='cards-zone';
      c.appendChild(zone);
      renderCards();
    } else if(state.tab==='tree'){
      c.appendChild(buildTreesPanel());
    }
  }

  // Bascule vers les entités avec un filtre pré-appliqué (clic sur un KPI, un
  // écosystème ou une barre de l'histogramme).
  function focusEntities(dim, value){
    state.tab='entities';
    state.kind='all'; state.source='all';
    if(dim) state[dim]=value;
    render();
  }

  function h2(t){ var h=el('h2'); h.textContent=t; return h; }

  // ------------------------------------------------------- tableau de bord --
  // Bandeau d'en-tête : libellé en petites capitales, chiffre en grand, et une
  // précision discrète à côté. Quatre indicateurs maximum — au-delà, plus aucun
  // ne ressort.
  function buildKpis(){
    var band = el('div','kpi-band');
    function cell(label, value, note, color){
      var c = el('div','kpi-cell');
      c.appendChild(el('div','kc-label', label));
      var v = el('div','kc-value');
      var n = el('span','kc-n', String(value));
      if(color) n.style.color=color;
      v.appendChild(n);
      if(note) v.appendChild(el('span','kc-note', note));
      c.appendChild(v);
      return c;
    }
    var mat = maturity();
    var cross = (DATA.graph.edges||[]).filter(function(e){ return e.cross; }).length;
    var alerts = governanceAlerts().length;

    band.appendChild(cell('Score de maturité IA', mat ? mat.score : '—',
      mat ? '/100' : '', mat ? scoreColor(mat.score) : null));
    band.appendChild(cell('Entités cartographiées', DATA.totals.entities,
      DATA.totals.sources + ' écosystèmes'));
    band.appendChild(cell('Liens transverses tracés', cross,
      'sur ' + DATA.totals.edges));
    band.appendChild(cell('Alertes de gouvernance', alerts,
      alerts ? 'à traiter' : 'aucune', alerts ? '#f59e0b' : '#22c55e'));
    return band;
  }

  // Tuiles « composants IA détectés » : une par type présent, teintée de sa
  // couleur, avec l'écosystème d'où il vient. Se lit d'un coup d'œil, là où
  // l'histogramme demande de suivre une barre.
  function buildKindTiles(){
    var wrap = el('div');
    wrap.appendChild(el('div','sec-label','Composants IA détectés'));
    var grid = el('div','tiles');
    DATA.kinds.forEach(function(k){
      var sources = {};
      DATA.entities.forEach(function(e){ if(e.kind===k.key) sources[e.source]=1; });
      var names = Object.keys(sources).map(function(id){ return srcOf(id).label; });

      var t = el('div','tile');
      t.style.borderColor = k.color+'55';
      t.style.background = 'linear-gradient(0deg,'+k.color+'0f,'+k.color+'0f),var(--panel)';
      var head = el('div','tile-head');
      head.style.color = k.color;
      head.textContent = k.icon+' '+k.label;
      t.appendChild(head);
      t.appendChild(el('div','tile-n', String(k.count)));
      t.appendChild(el('div','tile-src', names.join(' · ')));
      t.title = 'Voir les '+k.count+' '+k.label.toLowerCase();
      t.onclick=function(){ focusEntities('kind', k.key); };
      grid.appendChild(t);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function buildSourcesPanel(){
    var p = el('div','panel');
    p.appendChild(h2('🌐 Écosystèmes IA'));
    var hint = el('div','hint');
    hint.textContent='Les écosystèmes grisés ne sont pas encore couverts par un adaptateur : leur absence ici ne signifie pas qu\'ils sont absents du projet.';
    p.appendChild(hint);
    var grid = el('div','srcs');
    DATA.sources.forEach(function(s){
      var d = el('div','src'+(s.detected?'':' off'));
      d.style.borderLeftColor = s.color;
      var n = el('div','sname');
      var dot=el('span','dot'); dot.style.background=s.color;
      n.appendChild(dot); n.appendChild(document.createTextNode(s.icon+' '+s.label));
      d.appendChild(n);
      var c = el('div','scount');
      c.textContent = s.detected ? (s.count+' entité(s)')
                                 : (s.status==='planned' ? 'adaptateur prévu' : 'non détecté');
      d.appendChild(c);
      if(s.detected && s.roots && s.roots.length){
        d.appendChild(el('div','sroot', s.roots.join(' · ')));
      }
      if(s.detected){
        d.style.cursor='pointer';
        d.title='Voir les '+s.count+' entités de '+s.label;
        d.onclick=function(){ focusEntities('source', s.id); };
      }
      grid.appendChild(d);
    });
    p.appendChild(grid);
    return p;
  }

  function buildHistogram(){
    var p = el('div','panel');
    p.appendChild(h2('📊 Répartition par type d\'entité'));
    var bars = el('div','bars');
    var max = 1;
    DATA.kinds.forEach(function(k){ if(k.count>max) max=k.count; });
    DATA.kinds.forEach(function(k){
      var row=el('div','bar-row');
      var name=el('div','name');
      var dot=el('span','dot'); dot.style.background=k.color;
      name.appendChild(dot); name.appendChild(document.createTextNode(k.icon+' '+k.label));
      var track=el('div','bar-track');
      var fill=el('div','bar-fill');
      fill.style.width=(k.count/max*100)+'%'; fill.style.background=k.color;
      track.appendChild(fill);
      row.appendChild(name); row.appendChild(track); row.appendChild(el('div','bar-val',String(k.count)));
      row.title='Voir les '+k.count+' '+k.label.toLowerCase();
      row.onclick=function(){ focusEntities('kind', k.key); };
      bars.appendChild(row);
    });
    p.appendChild(bars);
    return p;
  }

  // ----------------------------------------------------------------- timeline --
  // Chronologie fondée sur la date de modification des fichiers porteurs.
  // C'est la seule source disponible sans Git (adaptateur prévu en V2) : elle
  // répond à « qu'est-ce qui a bougé récemment dans notre config IA ? ».
  function buildTimelinePanel(){
    var p = el('div','panel');
    p.appendChild(h2('🕰️ Timeline'));

    var dated = DATA.entities.filter(function(e){ return e.mtime; })
      .slice().sort(function(a,b){ return a.mtime < b.mtime ? 1 : -1; });
    if(!dated.length){
      p.appendChild(el('div','empty','Aucune date de modification disponible.'));
      return p;
    }

    var hint = el('div','hint');
    hint.textContent='Dernière modification des fichiers. Utile pour repérer la config qui dort : une skill non touchée depuis des mois pendant que le code bouge est une dette documentaire.';
    p.appendChild(hint);

    p.appendChild(buildActivityBars(dated));
    p.appendChild(buildRecentList(dated));
    return p;
  }

  // Histogramme d'activité sur les 12 derniers mois.
  function buildActivityBars(dated){
    var now = new Date();
    var months = [];
    for(var i=11;i>=0;i--){
      var d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      months.push({ key:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),
                    label:d.toLocaleDateString(undefined,{month:'short'}),
                    year:d.getFullYear(), n:0 });
    }
    var idx={}; months.forEach(function(m){ idx[m.key]=m; });
    var older=0;
    dated.forEach(function(e){
      var k=e.mtime.slice(0,7);
      if(idx[k]) idx[k].n++; else older++;
    });

    var max=1; months.forEach(function(m){ if(m.n>max) max=m.n; });
    var box = el('div','tl-bars');
    months.forEach(function(m){
      var col = el('div','tl-col');
      var bar = el('div','tl-bar');
      bar.style.height = Math.max(2, m.n/max*100)+'%';
      if(!m.n) bar.classList.add('zero');
      bar.title = m.n+' élément(s) modifié(s) en '+m.label+' '+m.year;
      var cap = el('div','tl-cap', m.label);
      var val = el('div','tl-n', m.n ? String(m.n) : '');
      col.appendChild(val); col.appendChild(bar); col.appendChild(cap);
      box.appendChild(col);
    });

    var wrapBox = el('div');
    wrapBox.appendChild(box);
    if(older){
      var note = el('div','hint');
      note.style.margin='6px 0 0';
      note.textContent = older+' élément(s) non modifié(s) depuis plus de 12 mois.';
      wrapBox.appendChild(note);
    }
    return wrapBox;
  }

  // Liste groupée par ancienneté, la plus récente d'abord.
  function buildRecentList(dated){
    var now = Date.now(), DAY = 86400000;
    var buckets = [
      { label:"Aujourd'hui",      max:1,        items:[] },
      { label:'7 derniers jours', max:7,        items:[] },
      { label:'30 derniers jours',max:30,       items:[] },
      { label:'Plus ancien',      max:Infinity, items:[] },
    ];
    dated.forEach(function(e){
      var age = (now - Date.parse(e.mtime)) / DAY;
      for(var i=0;i<buckets.length;i++){
        if(age < buckets[i].max){ buckets[i].items.push(e); return; }
      }
    });

    var box = el('div','tl-list');
    buckets.forEach(function(b){
      if(!b.items.length) return;
      var head = el('div','tl-head');
      head.appendChild(document.createTextNode(b.label));
      var cnt = el('span','tl-count', String(b.items.length));
      head.appendChild(cnt);
      box.appendChild(head);

      b.items.slice(0,12).forEach(function(e){
        var k = kindOf(e.kind), s = srcOf(e.source);
        var row = el('div','tl-row');
        var dot = el('span','dot'); dot.style.background=k.color;
        row.appendChild(dot);
        var nm = el('span','tl-name', e.name);
        row.appendChild(nm);
        var sp = el('span','srcpill', s.icon); sp.style.background=s.color; sp.title=s.label;
        row.appendChild(sp);
        (e.badges||[]).forEach(function(bd){
          row.appendChild(el('span','badge '+(bd.tone||'muted'), bd.text));
        });
        var when = el('span','tl-when', new Date(e.mtime).toLocaleDateString());
        row.appendChild(when);
        row.onclick=function(){ openDetail(e); };
        box.appendChild(row);
      });
      if(b.items.length>12){
        box.appendChild(el('div','tl-more','+ '+(b.items.length-12)+' autre(s)'));
      }
    });
    return box;
  }

  // ------------------------------------------------------ score de maturité --
  // Score volontairement TRANSPARENT : ses quatre composantes sont affichées
  // avec leur définition. Un score opaque serait invérifiable, donc inutile
  // pour arbitrer quoi que ce soit.
  function maturity(){
    var ents = DATA.entities;
    var edges = DATA.graph.edges || [];
    if(!ents.length) return null;

    var degree = {};
    edges.forEach(function(e){ degree[e.s]=1; degree[e.t]=1; });
    var linked = ents.filter(function(e){ return degree[e.id]; }).length / ents.length;

    var actors = ents.filter(function(e){ return ACTOR_KINDS[e.kind]; });
    var withCode = {};
    edges.forEach(function(e){ if(e.type==='code') withCode[e.s]=1; });
    var traced = actors.length
      ? actors.filter(function(e){ return withCode[e.id]; }).length / actors.length : null;

    var dated = ents.filter(function(e){ return e.mtime; });
    var limit = Date.now() - 90*86400000;
    var fresh = dated.length
      ? dated.filter(function(e){ return Date.parse(e.mtime) >= limit; }).length / dated.length : null;

    var alerted = ents.filter(function(e){
      return (e.badges||[]).some(function(b){ return b.tone==='warn'||b.tone==='danger'; });
    }).length;
    var clean = 1 - alerted/ents.length;

    var parts = [
      { key:'linked', label:'Connexion',    value:linked,
        desc:'part des entités reliées à au moins une autre — le reste est isolé' },
      { key:'traced', label:'Traçabilité',  value:traced,
        desc:'part des skills, commandes et agents qui pointent vers du code réel' },
      { key:'fresh',  label:'Fraîcheur',    value:fresh,
        desc:'part des entités modifiées depuis moins de 90 jours' },
      { key:'clean',  label:'Hygiène',      value:clean,
        desc:'part des entités sans alerte de gouvernance' },
    ].filter(function(p){ return p.value !== null; });

    var score = Math.round(parts.reduce(function(s,p){ return s+p.value; },0) / parts.length * 100);
    // Les compteurs bruts sont conservés : c'est ce qui permet de chiffrer
    // honnêtement le gain d'une action, au lieu de l'estimer au doigt mouillé.
    return {
      score: score, parts: parts,
      raw: {
        total: ents.length,
        isolated: ents.filter(function(e){ return !degree[e.id]; }),
        actors: actors,
        untraced: actors.filter(function(e){ return !withCode[e.id]; }),
        dated: dated.length,
        stale: dated.filter(function(e){ return Date.parse(e.mtime) < limit; }),
        alerted: ents.filter(function(e){ return e.tone==='warn'||e.tone==='danger'; }),
      },
    };
  }

  // Combien de points le score gagnerait si `n` entités passaient du mauvais
  // côté d'une composante au bon. Une composante vaut 1/N du score total.
  function pointsFor(m, componentKey, n, universe){
    if(!universe || !n) return 0;
    var present = m.parts.some(function(p){ return p.key===componentKey; });
    if(!present) return 0;
    return Math.round((n/universe) / m.parts.length * 100);
  }

  // Recommandations : chacune dit CE QU'IL FAUT FAIRE et CE QUE ÇA RAPPORTE.
  // Un score sans levier n'est qu'un constat.
  function recommendations(){
    var m = maturity();
    if(!m) return [];
    var r = m.raw;
    var out = [];

    if(r.untraced.length){
      out.push({
        label: 'Relier ' + r.untraced.length + ' skill(s), commande(s) ou agent(s) à des fichiers de code réels',
        why: 'Ils ne citent aucun chemin existant : impossible de savoir ce qu\'ils touchent.',
        component: 'Traçabilité',
        points: pointsFor(m, 'traced', r.untraced.length, r.actors.length),
        items: r.untraced,
      });
    }

    // Un change terminé mais non archivé est le cas le plus fréquent, et le
    // plus simple à corriger : il porte déjà son badge « à archiver ».
    var toArchive = r.alerted.filter(function(e){
      return (e.badges||[]).some(function(b){ return /archiver/i.test(b.text); });
    });
    if(toArchive.length){
      out.push({
        label: 'Archiver ' + toArchive.length + ' change(s) terminé(s)',
        why: 'Toutes leurs tâches sont faites : ils encombrent la liste des changes en cours.',
        component: 'Hygiène',
        points: pointsFor(m, 'clean', toArchive.length, r.total),
        items: toArchive,
      });
    }

    var otherAlerts = r.alerted.filter(function(e){ return toArchive.indexOf(e) === -1; });
    if(otherAlerts.length){
      out.push({
        label: 'Traiter ' + otherAlerts.length + ' alerte(s) restante(s)',
        why: 'Doublons de déclaration, formats hérités ou configurations illisibles.',
        component: 'Hygiène',
        points: pointsFor(m, 'clean', otherAlerts.length, r.total),
        items: otherAlerts,
      });
    }

    if(r.isolated.length){
      out.push({
        label: 'Référencer ou supprimer ' + r.isolated.length + ' entité(s) isolée(s)',
        why: 'Rien ne les cite et elles ne touchent aucun code : ce sont des candidates à la suppression.',
        component: 'Connexion',
        points: pointsFor(m, 'linked', r.isolated.length, r.total),
        items: r.isolated,
      });
    }

    if(r.stale.length){
      out.push({
        label: 'Revoir ' + r.stale.length + ' entité(s) non modifiée(s) depuis 90 jours',
        why: 'La config dort pendant que le code avance — c\'est la définition de la dette documentaire.',
        component: 'Fraîcheur',
        points: pointsFor(m, 'fresh', r.stale.length, r.dated),
        items: r.stale,
      });
    }

    // Sous 1 point, la recommandation coûte plus d'attention qu'elle n'en vaut.
    return out.filter(function(x){ return x.points >= 1; })
              .sort(function(a,b){ return b.points - a.points; });
  }

  function buildScorePanel(){
    var m = maturity();
    var p = el('div','panel');
    p.appendChild(h2('🎓 Détail du score'));
    if(!m){ p.appendChild(el('div','empty','Pas assez de données.')); return p; }
    var hint = el('div','hint');
    hint.textContent='Moyenne des quatre composantes ci-dessous. Chacune est affichée avec sa définition : un score dont on ne peut pas vérifier le calcul ne permet d\'arbitrer aucune décision.';
    p.appendChild(hint);

    var box = el('div','score-box');
    var list = el('div','score-parts');
    m.parts.forEach(function(part){
      var row = el('div','score-part');
      var top = el('div','sp-top');
      top.appendChild(el('span','sp-label', part.label));
      top.appendChild(el('span','sp-pct', Math.round(part.value*100)+'%'));
      row.appendChild(top);
      var track = el('div','sp-track');
      var fill = el('div','sp-fill');
      fill.style.width=(part.value*100)+'%';
      fill.style.background=scoreColor(part.value*100);
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('div','sp-desc', part.desc));
      list.appendChild(row);
    });
    box.appendChild(list);
    p.appendChild(box);
    return p;
  }

  function scoreColor(pct){
    if(pct >= 75) return '#22c55e';
    if(pct >= 50) return '#f59e0b';
    return '#f43f5e';
  }

  function buildRecoPanel(){
    var recos = recommendations();
    var p = el('div','panel');
    p.appendChild(h2('📈 Ce qui ferait monter le score'));
    if(!recos.length){
      p.appendChild(el('div','ok-note','✔ Rien à corriger : aucune action ne rapporterait un point entier.'));
      return p;
    }
    var hint = el('div','hint');
    hint.textContent='Gains calculés sur les composantes réelles du score : chaque composante pèse 1/'+
      (maturity().parts.length)+' du total. Cliquez une ligne pour voir les entités concernées.';
    p.appendChild(hint);

    var list = el('div','recos');
    recos.forEach(function(r){
      var row = el('div','reco');
      row.appendChild(el('span','reco-arrow','→'));
      var body = el('div','reco-body');
      body.appendChild(el('div','reco-label', r.label));
      body.appendChild(el('div','reco-why', r.why));
      row.appendChild(body);
      var gain = el('span','reco-gain','+'+r.points+' pt'+(r.points>1?'s':'')+' '+r.component);
      row.appendChild(gain);
      row.onclick=function(){ openReco(r); };
      list.appendChild(row);
    });
    p.appendChild(list);
    return p;
  }

  // Le détail d'une recommandation liste les entités visées : sans elles,
  // « relier 12 skills » ne dit pas lesquelles.
  function openReco(r){
    var zone = document.getElementById('reco-detail');
    if(!zone) return;
    zone.innerHTML='';
    var p = el('div','panel');
    p.appendChild(h2('🎯 ' + r.label));
    var hint = el('div','hint'); hint.textContent = r.why;
    p.appendChild(hint);
    var list = el('div','alerts');
    r.items.slice(0,40).forEach(function(e){
      var k = kindOf(e.kind), s = srcOf(e.source);
      var row = el('div','alert info');
      row.appendChild(el('span','a-tone','○'));
      var b = el('div','a-body');
      var t = el('div','a-title');
      t.appendChild(document.createTextNode(e.name));
      var sp = el('span','srcpill', s.icon+' '+s.label); sp.style.background=s.color;
      t.appendChild(sp);
      b.appendChild(t);
      b.appendChild(el('div','a-msg', k.one + (e.path ? ' — ' + e.path : '')));
      row.appendChild(b);
      row.onclick=function(){ openDetail(e); };
      list.appendChild(row);
    });
    if(r.items.length>40) list.appendChild(el('div','tl-more','+ '+(r.items.length-40)+' autre(s)'));
    p.appendChild(list);
    zone.appendChild(p);
    p.scrollIntoView({behavior:'smooth', block:'nearest'});
  }

  // ------------------------------------------------- alertes de gouvernance --
  function governanceAlerts(){
    var out = [];
    DATA.entities.forEach(function(e){
      (e.badges||[]).forEach(function(b){
        if(b.tone==='warn'||b.tone==='danger') out.push({ entity:e, badge:b });
      });
    });
    // Les entités reliées à rien sont l'autre grand signal de dette : une skill
    // que personne ne référence et qui ne touche aucun code ne sert plus.
    var degree = {};
    (DATA.graph.edges||[]).forEach(function(e){ degree[e.s]=1; degree[e.t]=1; });
    DATA.entities.forEach(function(e){
      if(degree[e.id]) return;
      if(e.kind==='config') return; // un fichier de réglages n'a pas à être cité
      out.push({ entity:e, badge:{ text:'jamais référencé, ne touche aucun code', tone:'info' } });
    });
    return out;
  }

  function buildAlertsPanel(){
    var alerts = governanceAlerts();
    var p = el('div','panel');
    p.appendChild(h2('⚠️ Alertes de gouvernance'+(alerts.length?' ('+alerts.length+')':'')));
    if(!alerts.length){
      p.appendChild(el('div','ok-note','✔ Aucune alerte : rien d\'orphelin, de dupliqué ni d\'illisible.'));
      return p;
    }
    var order = { danger:0, warn:1, info:2 };
    alerts.sort(function(a,b){ return (order[a.badge.tone]||9)-(order[b.badge.tone]||9); });

    var list = el('div','alerts');
    alerts.slice(0,20).forEach(function(a){
      var k = kindOf(a.entity.kind), s = srcOf(a.entity.source);
      var row = el('div','alert '+a.badge.tone);
      row.appendChild(el('span','a-tone', a.badge.tone==='danger'?'✖':(a.badge.tone==='warn'?'▲':'○')));
      var body = el('div','a-body');
      var t = el('div','a-title');
      t.appendChild(document.createTextNode(a.entity.name));
      var sp = el('span','srcpill', s.icon+' '+s.label); sp.style.background=s.color;
      t.appendChild(sp);
      body.appendChild(t);
      body.appendChild(el('div','a-msg', k.one+' — '+a.badge.text));
      row.appendChild(body);
      row.onclick=function(){ openDetail(a.entity); };
      list.appendChild(row);
    });
    if(alerts.length>20) list.appendChild(el('div','tl-more','+ '+(alerts.length-20)+' autre(s)'));
    p.appendChild(list);
    return p;
  }

  // ------------------------------------------------------------ fil d'impact --
  // Reconstruit les chaînes « ce qui prescrit → ce qui agit → ce que ça atteint »
  // et les rend lisibles LIGNE PAR LIGNE. Le graphe montre la même information,
  // mais on ne peut pas la lire : ici on la lit.
  function impactChains(){
    var nodeById = {};
    (DATA.graph.nodes||[]).forEach(function(n){ nodeById[n.id]=n; });
    var edges = DATA.graph.edges||[];

    var chains = [];
    DATA.entities.filter(function(e){ return ACTOR_KINDS[e.kind]; }).forEach(function(actor){
      var origins = [], targets = [];
      var seenTarget = {};
      edges.forEach(function(ed){
        if(ed.t===actor.id){
          var o = byId[ed.s];
          if(o && ORIGIN_KINDS[o.kind] !== undefined) origins.push(o);
        }
        if(ed.s===actor.id){
          var n = nodeById[ed.t];
          if(!n || TARGET_KINDS[n.kind] === undefined) return;
          // Le même serveur déclaré dans deux écosystèmes ne doit apparaître
          // qu'une fois dans le fil : le doublon est signalé ailleurs.
          var key = n.kind + '|' + String(n.label).toLowerCase();
          if(seenTarget[key]) return;
          seenTarget[key] = 1;
          targets.push(n);
        }
      });
      if(!origins.length && !targets.length) return;

      origins.sort(function(a,b){ return ORIGIN_KINDS[a.kind]-ORIGIN_KINDS[b.kind]; });
      targets.sort(function(a,b){ return TARGET_KINDS[a.kind]-TARGET_KINDS[b.kind]; });

      // Dès qu'il existe une cible parlante (serveur MCP, fichier de code), on
      // écarte les outils génériques : « Bash, Read, Write » diluent le fil sans
      // rien apprendre.
      var meaningful = targets.filter(function(t){ return TARGET_KINDS[t.kind] < GENERIC_TARGET_RANK; });
      if(meaningful.length) targets = meaningful;

      var cross = origins.some(function(o){ return o.source!==actor.source; });
      chains.push({ origins:origins, actor:actor, targets:targets, cross:cross });
    });

    chains.sort(function(a,b){
      if(a.cross!==b.cross) return a.cross?-1:1;
      return (b.origins.length+b.targets.length)-(a.origins.length+a.targets.length);
    });
    return chains;
  }

  function pickChip(id, label, count, active){
    var c = el('div','ichip'+(active?' on':''));
    c.appendChild(document.createTextNode(label));
    c.appendChild(el('span','chipn', String(count)));
    c.onclick=function(){ state.impact = (id==='all') ? null : id; renderTab(); };
    return c;
  }

  function buildImpactPanel(){
    var all = impactChains();
    var p = el('div','panel');
    p.appendChild(h2('🎯 Fil d\'impact'));
    var hint = el('div','hint');
    hint.textContent='Chaque ligne se lit « ce qui prescrit → ce qui agit → ce que ça atteint ». Les fils marqués « transverse » franchissent une frontière d\'outil : ce sont eux que personne ne voit sans AI-MAP.';
    p.appendChild(hint);

    if(!all.length){
      p.appendChild(el('div','empty','Aucun fil : aucune skill, commande ou agent n\'est relié à une prescription ni à une cible.'));
      return p;
    }

    // Sélecteur d'origine : afficher TOUS les fils à la fois est un déversoir.
    // On demande d'abord « lequel ? », puis on répond.
    var origins = [];
    var seenOrigin = {};
    all.forEach(function(c){
      c.origins.forEach(function(o){
        if(seenOrigin[o.id]) return;
        seenOrigin[o.id] = 1;
        origins.push(o);
      });
    });
    origins.sort(function(a,b){
      return ORIGIN_KINDS[a.kind]-ORIGIN_KINDS[b.kind] || a.name.localeCompare(b.name);
    });

    var chains = all;
    if(origins.length > 1){
      var sel = el('div','isel');
      sel.appendChild(pickChip('all', 'Tous les fils', all.length, state.impact===null));
      origins.forEach(function(o){
        var n = all.filter(function(c){ return c.origins.indexOf(o) !== -1; }).length;
        sel.appendChild(pickChip(o.id, o.name, n, state.impact===o.id));
      });
      p.appendChild(sel);
      if(state.impact){
        chains = all.filter(function(c){
          return c.origins.some(function(o){ return o.id === state.impact; });
        });
      }
    }

    var box = el('div','chains');
    chains.forEach(function(c){
      var row = el('div','chain'+(c.cross?' cross':''));
      if(c.cross) row.appendChild(el('span','chain-flag','transverse'));

      var line = el('div','chain-line');
      var first = true;
      function push(node){
        if(!first) line.appendChild(el('span','chain-arrow','›'));
        first = false;
        line.appendChild(chainCard(node));
      }
      if(c.origins.length){
        push(c.origins[0]);
        if(c.origins.length>1){
          var more = el('span','chain-more','+'+(c.origins.length-1)+' autre(s)');
          more.title = c.origins.slice(1).map(function(o){ return o.name; }).join('\n');
          line.appendChild(more);
        }
      }
      push(c.actor);
      c.targets.slice(0,3).forEach(push);
      if(c.targets.length>3){
        var m2 = el('span','chain-more','+'+(c.targets.length-3)+' autre(s)');
        m2.title = c.targets.slice(3).map(function(t){ return t.label||t.name; }).join('\n');
        line.appendChild(m2);
      }
      row.appendChild(line);
      box.appendChild(row);
    });
    p.appendChild(box);
    return p;
  }

  // Un maillon du fil : rôle en capitales, nom en gras, chemin en monospace.
  // Les nœuds dérivés (outil, code) n'ont pas de fiche : ils restent affichés
  // mais non cliquables, plutôt que de simuler un lien mort.
  function chainCard(n){
    var k = kindOf(n.kind);
    var entity = byId[n.id];
    var card = el('div','ccard');
    card.style.borderTopColor = k.color;

    // Le rôle précise l'écosystème quand il y en a plusieurs : « SKILL » seul
    // ne dit pas d'où vient la skill dans un projet multi-outils.
    var role = k.one.toUpperCase();
    if(entity && DATA.totals.sources > 1) role += ' · ' + srcOf(entity.source).label;
    var r = el('div','cc-role', role);
    r.style.color = k.color;
    card.appendChild(r);

    card.appendChild(el('div','cc-name', n.name || n.label));
    var sub = (entity && entity.path) || n.path || '';
    if(sub) card.appendChild(el('div','cc-path', sub));

    if(entity){
      card.classList.add('clickable');
      card.onclick=function(){ openDetail(entity); };
    }
    return card;
  }

  // ------------------------------------------------------------- changes ----
  function buildChangesPanel(){
    var changes = DATA.entities.filter(function(e){ return e.kind==='change'; });
    if(!changes.length) return null;
    var p = el('div','panel');
    p.appendChild(h2('🔀 Changes ('+changes.length+')'));
    var list = el('div','changes');
    changes.forEach(function(c){
      var row = el('div','change-row');
      var head = el('div','ch-head');
      head.appendChild(el('span','ch-name', c.name));
      (c.badges||[]).forEach(function(b){
        head.appendChild(el('span','badge '+(b.tone||'muted'), b.text));
      });
      row.appendChild(head);
      row.appendChild(el('div','ch-desc', c.description));

      // Avancement lu depuis la méta « avancement » (« 2/8 tâches »).
      var adv = (c.meta||[]).find(function(x){ return x.k==='avancement'; });
      if(adv){
        var mm = String(adv.v).match(/(\d+)\s*\/\s*(\d+)/);
        if(mm){
          var pct = Number(mm[2]) ? Number(mm[1])/Number(mm[2]) : 0;
          var track = el('div','ch-track');
          var fill = el('div','ch-fill');
          fill.style.width=(pct*100)+'%';
          fill.style.background=scoreColor(pct*100);
          track.appendChild(fill);
          row.appendChild(track);
          row.appendChild(el('div','ch-adv', adv.v));
        }
      }
      row.onclick=function(){ openDetail(c); };
      list.appendChild(row);
    });
    p.appendChild(list);
    return p;
  }

  // ------------------------------------------------------------ barre d'outils --
  function buildToolbar(){
    var tb = el('div','toolbar');

    var r0 = el('div','trow');
    var search = el('div','search');
    search.appendChild(document.createTextNode('🔎'));
    var input = el('input'); input.type='search';
    input.placeholder='Rechercher une entité, un chemin, une description…'; input.value=state.q;
    input.oninput=function(){ state.q=input.value.toLowerCase(); renderCards(); };
    search.appendChild(input);
    r0.appendChild(search);
    tb.appendChild(r0);

    // Un filtre qui ne ramènerait rien est masqué. C'est ce qui encombrait le
    // plus la barre : filtrer sur Claude affichait « Exigences (0) »,
    // « Changes (0) », « Tâches (0) »… soit six chips inutilisables.
    var r1 = el('div','trow');
    r1.appendChild(el('span','tlabel','Type'));
    r1.appendChild(chip('kind','all','Tous', '#6366f1', totalFor('source', state.source)));
    DATA.kinds.forEach(function(k){
      var n = countBy('kind', k.key);
      if(!n && state.kind!==k.key) return;
      r1.appendChild(chip('kind',k.key,k.icon+' '+k.label,k.color,n));
    });
    tb.appendChild(r1);

    var detected = DATA.sources.filter(function(s){ return s.detected; });
    // Un seul écosystème : la ligne de filtre n'offre aucun choix, on la retire.
    if(detected.length > 1){
      var r2 = el('div','trow');
      r2.appendChild(el('span','tlabel','Écosystème'));
      r2.appendChild(chip('source','all','Tous','#14b8a6', totalFor('kind', state.kind)));
      detected.forEach(function(s){
        var n = countBy('source', s.id);
        if(!n && state.source!==s.id) return;
        r2.appendChild(chip('source',s.id,s.icon+' '+s.label,s.color,n));
      });
      tb.appendChild(r2);
    }

    if(state.kind!=='all' || state.source!=='all' || state.q){
      var r3 = el('div','trow');
      var reset = el('button','btn','✕ Réinitialiser les filtres');
      reset.onclick=function(){ state.kind='all'; state.source='all'; state.q=''; renderTab(); };
      r3.appendChild(reset);
      tb.appendChild(r3);
    }
    return tb;
  }

  // Total affiché sur le chip « Tous » d'une dimension, en tenant compte de
  // l'autre dimension déjà filtrée.
  function totalFor(otherDim, otherVal){
    if(otherVal==='all') return DATA.totals.entities;
    return DATA.entities.filter(function(e){
      return otherDim==='source' ? e.source===otherVal : e.kind===otherVal;
    }).length;
  }

  // Compte en tenant compte de l'AUTRE dimension : les compteurs reflètent ce
  // qu'on obtiendrait vraiment en cliquant, pas un total global trompeur.
  function countBy(dim, val){
    return DATA.entities.filter(function(e){
      if(dim==='kind') return e.kind===val && (state.source==='all'||e.source===state.source);
      return e.source===val && (state.kind==='all'||e.kind===state.kind);
    }).length;
  }

  function chip(dim,key,label,color,count){
    var active = state[dim]===key;
    var c = el('div','chip'+(active?' active':''));
    if(active) c.style.background=color;
    c.appendChild(document.createTextNode(label));
    c.appendChild(el('span','chipn',String(count)));
    c.onclick=function(){ state[dim]=key; renderTab(); };
    return c;
  }

  // ------------------------------------------------------------------ fiches --
  function visibleEntities(){
    return DATA.entities.filter(function(e){
      if(state.kind!=='all' && e.kind!==state.kind) return false;
      if(state.source!=='all' && e.source!==state.source) return false;
      if(!state.q) return true;
      var hay=(e.name+' '+e.description+' '+(e.path||'')+' '+e.kind+' '+e.source).toLowerCase();
      return hay.indexOf(state.q)!==-1;
    });
  }

  function renderCards(){
    var zone = document.getElementById('cards-zone');
    if(!zone) return;
    zone.innerHTML='';
    var items = visibleEntities();
    if(!items.length){
      zone.appendChild(el('div','empty','Aucune entité ne correspond aux filtres.'));
      return;
    }
    // Regroupement par type, dans l'ordre canonique du modèle universel.
    // Chaque groupe est repliable : sur un projet réel, une seule catégorie peut
    // compter cinquante entités et noyer toutes les autres.
    DATA.kinds.forEach(function(k){
      var group = items.filter(function(e){ return e.kind===k.key; });
      if(!group.length) return;
      var block = el('div','cat-block');

      var ch = el('div','cat-head');
      var caret = el('span','cat-caret','▾');
      ch.appendChild(caret);
      var hd = el('div','h');
      hd.appendChild(document.createTextNode(k.icon+' '+k.label));
      hd.appendChild(el('span','cat-count', String(group.length)));
      ch.appendChild(hd);
      ch.appendChild(el('div','d', k.desc));
      block.appendChild(ch);

      var cards = el('div','cards');
      group.forEach(function(e){ cards.appendChild(renderCard(e,k)); });
      block.appendChild(cards);

      ch.onclick=function(){
        var hidden = cards.classList.toggle('hidden');
        caret.textContent = hidden ? '▸' : '▾';
      };
      zone.appendChild(block);
    });
  }

  function renderCard(e,k){
    var card = el('div','card');
    // Barre de gauche : statut si l'entité en a un, sinon urgence, sinon type.
    var st = (DATA.statuses||[]).filter(function(x){ return x.key===e.status; })[0];
    card.style.borderLeftColor = st ? st.color
      : (e.tone==='danger' ? '#e11d48' : (e.tone==='warn' ? '#d97706' : k.color));
    if(e.tone==='danger'||e.tone==='warn') card.classList.add('flag');

    var name = el('div','cname');
    var dot=el('span','dot'); dot.style.background=k.color;
    name.appendChild(dot); name.appendChild(document.createTextNode(e.name));
    card.appendChild(name);

    var pills = el('div','tags');
    var s = srcOf(e.source);
    var sp = el('span','srcpill', s.icon+' '+s.label); sp.style.background=s.color;
    pills.appendChild(sp);
    (e.badges||[]).forEach(function(b){ pills.appendChild(el('span','badge '+(b.tone||'muted'), b.text)); });
    card.appendChild(pills);

    card.appendChild(el('div','cdesc', e.description));

    // Trois métadonnées au maximum sur la carte : au-delà, elles cessent d'être
    // lues. Le reste — et le plan du document — vit dans la fiche détaillée.
    if(e.meta && e.meta.length){
      var tags = el('div','tags');
      e.meta.slice(0,3).forEach(function(m){
        var t=el('span','tag'); t.innerHTML='<b>'+esc(m.k)+'</b> '+esc(m.v); tags.appendChild(t);
      });
      if(e.meta.length>3) tags.appendChild(el('span','tag','+'+(e.meta.length-3)));
      card.appendChild(tags);
    }
    // Pied de carte : chemin d'un côté, date de dernière modification de
    // l'autre — c'est ce qui permet de repérer une config qui a vieilli.
    var foot = el('div','cfoot');
    foot.appendChild(el('span','cpath', e.path || '—'));
    if(e.mtime) foot.appendChild(el('span','cdate', new Date(e.mtime).toLocaleDateString()));
    card.appendChild(foot);

    var actions = el('div','card-actions');
    var btn = el('button','details-btn','📖 Détails');
    btn.onclick=function(){ openDetail(e); };
    actions.appendChild(btn);
    card.appendChild(actions);
    return card;
  }

  // ------------------------------------------------------- modale de détail --
  function relationsOf(id){
    var out = { out:[], in:[] };
    (DATA.graph.edges||[]).forEach(function(ed){
      if(ed.s===id) out.out.push({ id:ed.t, type:ed.type });
      else if(ed.t===id) out.in.push({ id:ed.s, type:ed.type });
    });
    return out;
  }
  function edgeMeta(type){
    var list = DATA.graph.edgeTypes||[];
    for(var i=0;i<list.length;i++){ if(list[i].type===type) return list[i]; }
    return { type:type, label:type, verb:type, color:'#94a3b8' };
  }
  function nodeLabel(id){
    if(byId[id]) return byId[id].name;
    var g = DATA.graph.nodes||[];
    for(var i=0;i<g.length;i++){ if(g[i].id===id) return g[i].label; }
    return id;
  }

  // La fiche s'ouvre en PAGE, pas en popup : une modale masque le reste, se
  // ferme au moindre clic à côté et interdit de comparer deux entités.
  function openDetail(e){
    state.detail = e.id;
    render();
    window.scrollTo(0, 0);
  }
  function closeDetail(){
    state.detail = null;
    render();
  }

  function buildDetailPage(e){
    var k = kindOf(e.kind), s = srcOf(e.source);
    var page = el('div','detail');

    var head = el('div','dhead');
    var back = el('button','btn','← Retour');
    back.onclick=closeDetail;
    head.appendChild(back);

    var titleBox = el('div','dtitle-box');
    var title = el('div','dtitle');
    var bar = el('span','dbar'); bar.style.background=k.color;
    title.appendChild(bar);
    title.appendChild(document.createTextNode(e.name));
    titleBox.appendChild(title);
    if(e.path) titleBox.appendChild(el('div','dpath', e.path));

    var badges = el('div','dbadges');
    var kb = el('span','mbadge', k.icon+' '+k.one); kb.style.background=k.color;
    var sb = el('span','mbadge', s.icon+' '+s.label); sb.style.background=s.color;
    badges.appendChild(kb); badges.appendChild(sb);
    (e.badges||[]).forEach(function(b){ badges.appendChild(el('span','badge '+(b.tone||'muted'), b.text)); });
    titleBox.appendChild(badges);
    head.appendChild(titleBox);
    page.appendChild(head);

    // Sous-onglets : contenu, relations, métadonnées.
    var rels = relationsOf(e.id);
    var nRels = rels.out.length + rels.in.length;
    var panes = {};
    var nav = el('nav','dtabs');
    [['content','Contenu',null],['relations','Relations',nRels],['meta','Métadonnées',(e.meta||[]).length]]
      .forEach(function(t, idx){
        var b = el('button','dtab'+(idx===0?' on':''));
        b.appendChild(document.createTextNode(t[1]));
        if(t[2]) b.appendChild(el('span','tcount', String(t[2])));
        b.onclick=function(){
          nav.querySelectorAll('.dtab').forEach(function(x){ x.classList.remove('on'); });
          for(var key in panes) panes[key].classList.add('hidden');
          b.classList.add('on');
          panes[t[0]].classList.remove('hidden');
        };
        nav.appendChild(b);
      });
    page.appendChild(nav);

    panes.content = el('div','dpane md');
    panes.content.innerHTML = renderMarkdown(e.content || '_Aucun contenu textuel._');
    page.appendChild(panes.content);

    panes.relations = el('div','dpane hidden');
    if(nRels){
      if(rels.out.length) panes.relations.appendChild(relList('Depuis cette entité', rels.out));
      if(rels.in.length) panes.relations.appendChild(relList('Vers cette entité', rels.in));
    } else {
      panes.relations.appendChild(el('div','empty','Aucune relation.'));
    }
    page.appendChild(panes.relations);

    panes.meta = el('div','dpane hidden');
    var tbl = el('table','dmeta');
    function row(kk, vv){
      var tr=el('tr'); tr.appendChild(el('th',null,kk)); tr.appendChild(el('td',null,vv)); tbl.appendChild(tr);
    }
    row('chemin', e.path || '—');
    if(e.mtime) row('modifié le', new Date(e.mtime).toLocaleString());
    (e.meta||[]).forEach(function(m){ row(m.k, m.v); });
    panes.meta.appendChild(tbl);
    page.appendChild(panes.meta);

    return page;
  }

  function relList(title, list){
    var box = el('div');
    box.appendChild(el('h4',null,title));
    list.forEach(function(r){
      var m = edgeMeta(r.type);
      var b = el('span','rlink');
      var dot = el('span','dot'); dot.style.background=m.color;
      b.appendChild(dot);
      b.appendChild(document.createTextNode(m.verb+' · '+nodeLabel(r.id)));
      if(byId[r.id]) b.onclick=function(){ openDetail(byId[r.id]); };
      else b.style.cursor='default';
      box.appendChild(b);
    });
    return box;
  }

  // Échap ferme la fiche, comme le faisait la modale.
  document.addEventListener('keydown', function(ev){
    if(ev.key==='Escape' && state.detail && !document.fullscreenElement) closeDetail();
  });

  // ------------------------------------------------------------- arborescences --
  function buildTreesPanel(){
    var p = el('div','panel');
    p.appendChild(h2('🌳 Arborescence des dossiers IA'));
    if(!DATA.trees.length){ p.appendChild(el('div','empty','Aucun dossier à afficher.')); return p; }
    DATA.trees.forEach(function(t){
      var s = srcOf(t.source);
      var hd = el('div','treeroot');
      var dot=el('span','dot'); dot.style.background=s.color;
      hd.appendChild(dot); hd.appendChild(document.createTextNode(s.label+' — '+t.root));
      p.appendChild(hd);
      var ul = el('ul','tree');
      ul.appendChild(treeNode(t.tree,true));
      p.appendChild(ul);
    });
    return p;
  }
  function treeNode(node, openTop){
    var li = el('li');
    if(node.type==='dir'){
      var label = el('span','d'+(openTop?' open':''));
      label.textContent=node.name+'/'+(node.truncated?' (…)':'');
      li.appendChild(label);
      var childUl = el('ul');
      if(!openTop) childUl.className='hidden';
      (node.children||[]).forEach(function(ch){ childUl.appendChild(treeNode(ch,false)); });
      li.appendChild(childUl);
      label.onclick=function(){ childUl.classList.toggle('hidden'); label.classList.toggle('open'); };
    } else {
      li.appendChild(el('span','f', node.name));
    }
    return li;
  }

  function toggleTheme(){
    var cur = document.documentElement.getAttribute('data-theme');
    var next = cur==='dark' ? 'light' : (cur==='light' ? 'dark'
             : (matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark'));
    document.documentElement.setAttribute('data-theme', next);
    try{ localStorage.setItem('ai-map-theme', next); }catch(e){}
    if(state.tab==='graph') initGraph(); // le canvas ne lit pas les variables CSS
  }
  try{ var saved=localStorage.getItem('ai-map-theme'); if(saved) document.documentElement.setAttribute('data-theme',saved); }catch(e){}

  // -------------------------------------------------- rendu Markdown (sûr) --
  // Échappe systématiquement le HTML source, puis applique les motifs Markdown.
  function renderMarkdown(src){
    var lines = String(src).replace(/\r\n/g,'\n').split('\n');
    var out=[], i=0;
    function inline(t){
      t = esc(t);
      // Le code inline est mis de côté derrière un sentinelle NUL (impossible
      // dans du Markdown) avant d'appliquer gras/italique/liens, puis restauré :
      // sinon un ** à l'intérieur d'un `code` serait interprété comme du gras.
      var codes=[]; t = t.replace(/`([^`]+)`/g, function(m,p){ codes.push(p); return '\u0000'+(codes.length-1)+'\u0000'; });
      t = t.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
      t = t.replace(/(^|[^*])\*([^*]+)\*/g,'$1<em>$2</em>');
      t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function(m,txt,url){
        var safe=/^(https?:|mailto:|#|\.|\/|[\w.-]+\/)/.test(url)?url:'#';
        return '<a href="'+safe+'" target="_blank" rel="noopener">'+txt+'</a>';
      });
      t = t.replace(/\u0000(\d+)\u0000/g, function(m,n){ return '<code>'+codes[+n]+'</code>'; });
      return t;
    }
    while(i<lines.length){
      var line=lines[i];
      if(/^```/.test(line)){
        var buf=[]; i++;
        while(i<lines.length && !/^```/.test(lines[i])){ buf.push(esc(lines[i])); i++; }
        i++;
        out.push('<pre><code>'+buf.join('\n')+'</code></pre>'); continue;
      }
      var h=line.match(/^(#{1,6})\s+(.*)$/);
      if(h){ var lvl=Math.min(h[1].length,3); out.push('<h'+lvl+'>'+inline(h[2])+'</h'+lvl+'>'); i++; continue; }
      if(/^(---|\*\*\*|___)\s*$/.test(line)){ out.push('<hr>'); i++; continue; }
      if(/^>\s?/.test(line)){
        var q=[]; while(i<lines.length && /^>\s?/.test(lines[i])){ q.push(inline(lines[i].replace(/^>\s?/,''))); i++; }
        out.push('<blockquote>'+q.join('<br>')+'</blockquote>'); continue;
      }
      if(/^\|.*\|\s*$/.test(line) && i+1<lines.length && /^\|?\s*:?-{2,}/.test(lines[i+1])){
        var header=splitRow(lines[i]); var rows=[]; i+=2;
        while(i<lines.length && /^\|.*\|\s*$/.test(lines[i])){ rows.push(splitRow(lines[i])); i++; }
        var th='<tr>'+header.map(function(c){return '<th>'+inline(c)+'</th>';}).join('')+'</tr>';
        var tb=rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+inline(c)+'</td>';}).join('')+'</tr>';}).join('');
        out.push('<table><thead>'+th+'</thead><tbody>'+tb+'</tbody></table>'); continue;
      }
      if(/^\s*([-*+]|\d+\.)\s+/.test(line)){
        var ordered=/^\s*\d+\.\s+/.test(line); var items=[];
        while(i<lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])){
          items.push('<li>'+inline(lines[i].replace(/^\s*([-*+]|\d+\.)\s+/,''))+'</li>'); i++;
        }
        out.push((ordered?'<ol>':'<ul>')+items.join('')+(ordered?'</ol>':'</ul>')); continue;
      }
      if(/^\s*$/.test(line)){ i++; continue; }
      var para=[inline(line)]; i++;
      while(i<lines.length && !/^\s*$/.test(lines[i]) &&
            !/^(#{1,6}\s|>\s?|```|\s*([-*+]|\d+\.)\s|\|)/.test(lines[i]) &&
            !/^(---|\*\*\*|___)\s*$/.test(lines[i])){ para.push(inline(lines[i])); i++; }
      out.push('<p>'+para.join('<br>')+'</p>');
    }
    return out.join('\n');
  }
  function splitRow(line){ return line.replace(/^\||\|\s*$/g,'').split('|').map(function(s){return s.trim();}); }

  // ------------------------------------------------------------------ graphe --
  // `showGeneric` et `showOrphans` sont FAUX par défaut : sur un projet réel,
  // les outils génériques (Bash, Read, search…) et les éléments sans aucune
  // relation représentent l'essentiel de l'encombrement du graphe sans rien
  // apprendre. On peut les rétablir d'une case à cocher.
  var gState = { view:'network', colorBy:'kind', show:{}, showGeneric:false, showOrphans:false, kinds:{} };
  (function(){ (DATA.graph.edgeTypes||[]).forEach(function(t){ gState.show[t.type]=true; }); })();
  var graphApi = null;

  // Sous-graphe réellement dessiné, après application des filtres.
  function visibleGraph(){
    var g = DATA.graph || { nodes:[], edges:[] };
    var drop = {};
    if(!gState.showGeneric){
      g.nodes.forEach(function(n){ if(n.kind==='tool') drop[n.id]=1; });
    }
    // Types décochés dans la barre latérale.
    g.nodes.forEach(function(n){ if(gState.kinds[n.kind] === false) drop[n.id]=1; });
    var edges = (g.edges||[]).filter(function(e){
      return gState.show[e.type] && !drop[e.s] && !drop[e.t];
    });
    var linked = {};
    edges.forEach(function(e){ linked[e.s]=1; linked[e.t]=1; });
    var nodes = (g.nodes||[]).filter(function(n){
      if(drop[n.id]) return false;
      if(!gState.showOrphans && !linked[n.id]) return false;
      return true;
    });
    return { nodes:nodes, edges:edges, hidden:(g.nodes||[]).length - nodes.length };
  }

  // Panneau du graphe : contrôles en BARRE LATÉRALE, canvas à droite.
  // Empilés au-dessus du canvas, les contrôles lui volaient sa hauteur et
  // repoussaient le graphe hors de l'écran.
  function buildGraphPanel(){
    var panel = el('div','panel graph-panel');
    panel.id='graph-panel';

    var g = DATA.graph || { nodes:[], edges:[] };
    if(!g.nodes.length){
      panel.appendChild(h2('🕸️ Graphe transverse'));
      panel.appendChild(el('div','empty','Aucune entité à relier.'));
      return panel;
    }

    var vis = visibleGraph();
    var layout = el('div','glayout');
    layout.appendChild(buildGraphSidebar(g, vis));

    var main = el('div','gmain');
    main.appendChild(buildGraphTools(panel));

    if(!vis.nodes.length){
      main.appendChild(el('div','empty',
        'Les filtres actifs masquent la totalité du graphe. Réactivez un type d\'entité, un type de relation, ou cochez « Éléments isolés ».'));
      layout.appendChild(main);
      panel.appendChild(layout);
      return panel;
    }

    var box = el('div','gcanvas');
    var canvas = document.createElement('canvas');
    canvas.id='rel-graph'; canvas.className='graph';
    canvas.style.height=(gState.view==='mcd'?'620px':'560px');
    box.appendChild(canvas);
    box.appendChild(el('div','gstat', vis.nodes.length+' nœuds · '+vis.edges.length+' liens'));
    main.appendChild(box);

    layout.appendChild(main);
    panel.appendChild(layout);
    return panel;
  }

  function buildGraphSidebar(g, vis){
    var side = el('aside','gside');

    side.appendChild(el('div','gs-label','Mode'));
    var seg = el('div','seg gs-seg');
    [['network','Réseau'],['mcd','MCD']].forEach(function(v){
      var b=el('button',gState.view===v[0]?'on':null,v[1]);
      b.onclick=function(){ if(gState.view!==v[0]){ gState.view=v[0]; renderTab(); } };
      seg.appendChild(b);
    });
    side.appendChild(seg);

    var seg2 = el('div','seg gs-seg');
    [['kind','Type'],['source','Écosystème']].forEach(function(v){
      var b=el('button',gState.colorBy===v[0]?'on':null,v[1]);
      b.title='Colorer par '+v[1].toLowerCase();
      b.onclick=function(){ if(gState.colorBy!==v[0]){ gState.colorBy=v[0]; renderTab(); } };
      seg2.appendChild(b);
    });
    side.appendChild(seg2);

    // TYPES — à la fois légende ET filtre, avec le compte réel. Deux fonctions
    // pour un seul composant, au lieu d'une légende inerte à côté de cases.
    side.appendChild(el('div','gs-label','Types'));
    var counts = {};
    g.nodes.forEach(function(n){ counts[n.kind] = (counts[n.kind]||0)+1; });
    Object.keys(counts).sort(function(a,b){ return counts[b]-counts[a]; }).forEach(function(kind){
      var k = kindOf(kind);
      var on = gState.kinds[kind] !== false;
      var row = el('button','gs-type'+(on?'':' off'));
      row.style.borderLeftColor = k.color;
      if(on) row.style.background = k.color+'14';
      var dot = el('span','dot'); dot.style.background=k.color;
      row.appendChild(dot);
      var nm = el('span','gs-tname', k.one);
      if(on) nm.style.color = k.color;
      row.appendChild(nm);
      row.appendChild(el('span','gs-tn', String(counts[kind])));
      row.title = (on?'Masquer':'Afficher')+' les '+k.label.toLowerCase();
      row.onclick=function(){ gState.kinds[kind] = !on; renderTab(); };
      side.appendChild(row);
    });

    // LIENS — même principe : le trait montre le style, la case filtre.
    side.appendChild(el('div','gs-label','Liens'));
    (DATA.graph.edgeTypes||[]).forEach(function(t){
      var n = g.edges.filter(function(e){ return e.type===t.type; }).length;
      if(!n) return;
      var lab = el('label','gs-edge');
      var cb = el('input'); cb.type='checkbox'; cb.checked=gState.show[t.type];
      cb.onchange=function(){ gState.show[t.type]=cb.checked; renderTab(); };
      var sw = el('span','eline');
      sw.style.borderTop=(t.dashed?'2px dashed ':'2px solid ')+t.color;
      lab.appendChild(cb); lab.appendChild(sw);
      lab.appendChild(document.createTextNode(t.verb));
      lab.appendChild(el('span','gs-tn', String(n)));
      side.appendChild(lab);
    });

    side.appendChild(el('div','gs-label','Lisibilité'));
    side.appendChild(toggleBox('showGeneric', 'Outils génériques',
      'Bash, Read, search… — ils encombrent beaucoup et n\'apprennent rien'));
    side.appendChild(toggleBox('showOrphans', 'Éléments isolés',
      'entités sans aucune relation visible'));
    if(vis.hidden){
      side.appendChild(el('div','ghidden', vis.hidden+' masqué(s)'));
    }

    var reorg = el('button','btn gs-btn','↻ Réorganiser');
    reorg.onclick=function(){ initGraph(true); };
    side.appendChild(reorg);
    return side;
  }

  function buildGraphTools(panel){
    var gt = el('div','gtools');
    function gbtn(txt,title,fn){ var b=el('button','btn',txt); b.title=title; b.onclick=fn; return b; }
    gt.appendChild(gbtn('－','Dézoomer',function(){ if(graphApi) graphApi.zoomBy(1/1.2); }));
    gt.appendChild(gbtn('＋','Zoomer',function(){ if(graphApi) graphApi.zoomBy(1.2); }));
    gt.appendChild(gbtn('⤢ Ajuster','Tout afficher',function(){ if(graphApi) graphApi.fit(); }));

    // Vrai plein écran via l'API Fullscreen : le graphe occupe l'ÉCRAN, pas
    // seulement la fenêtre. Repli sur un recouvrement CSS si l'API est refusée
    // (webview restreinte, iframe sans autorisation).
    var fsBtn = gbtn('⛶ Plein écran','Basculer le plein écran',null);
    function applyFs(full){
      fsBtn.textContent = full ? '✕ Quitter' : '⛶ Plein écran';
      panel.classList.toggle('fullscreen', full);
      var cv = document.getElementById('rel-graph');
      // En plein écran la hauteur est pilotée par le CSS (flex) : on retire la
      // hauteur en dur pour que le canvas prenne tout l'espace restant.
      if(cv) cv.style.height = full ? '' : (gState.view==='mcd' ? '620px' : '560px');
      // Mesurer APRÈS que le navigateur a appliqué la mise en page, sinon le
      // canvas conserve ses anciennes dimensions.
      requestAnimationFrame(function(){
        if(graphApi){ graphApi.resize(); graphApi.fit(); }
      });
    }
    fsBtn.onclick=function(){
      if(document.fullscreenElement){ document.exitFullscreen(); return; }
      if(panel.requestFullscreen){
        panel.requestFullscreen().catch(function(){ applyFs(true); });
      } else {
        applyFs(!panel.classList.contains('fullscreen'));
      }
    };
    panel.addEventListener('fullscreenchange', function(){
      applyFs(document.fullscreenElement === panel);
    });
    gt.appendChild(fsBtn);
    return gt;
  }

  function toggleBox(key, label, help){
    var lab = el('label','etoggle');
    lab.title = help || '';
    var cb = el('input'); cb.type='checkbox'; cb.checked=gState[key];
    cb.onchange=function(){ gState[key]=cb.checked; renderTab(); };
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(label));
    return lab;
  }

  function initGraph(reheat){
    if(graphApi){ graphApi.stop(); graphApi=null; }
    var canvas = document.getElementById('rel-graph');
    if(!canvas) return;
    var g = visibleGraph();
    if(!g.nodes.length) return;
    graphApi = runForceGraph(canvas, g, reheat);
    graphApi.fit();
  }

  // Disposition calculée UNE fois puis figée : pas d'animation continue, donc
  // pas de tremblement. On peut déplacer une entité, elle reste où on la lâche.
  function runForceGraph(canvas, g, reheat){
    var dpr = Math.max(1, window.devicePixelRatio||1);
    var ctx = canvas.getContext('2d');
    var W=0,H=0;
    function resize(){
      W=canvas.clientWidth||600; H=canvas.clientHeight||500;
      canvas.width=Math.round(W*dpr); canvas.height=Math.round(H*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();

    var MCD = gState.view==='mcd';
    var colorOf = function(n){ return gState.colorBy==='source' ? n.sourceColor : n.kindColor; };

    var N = g.nodes.length;
    var seed = reheat ? Math.random()*Math.PI*2 : 0;
    var nodes = g.nodes.map(function(n,i){
      var a = seed + i/N*Math.PI*2, r = Math.min(W,H)/3;
      return { id:n.id, label:n.label, kind:n.kind, source:n.source, path:n.path,
               color:colorOf(n), x:W/2+Math.cos(a)*r, y:H/2+Math.sin(a)*r, fixed:false };
    });
    var idx={}; nodes.forEach(function(n){ idx[n.id]=n; });
    var edges = g.edges.map(function(e){ return { s:idx[e.s], t:idx[e.t], type:e.type }; })
                       .filter(function(e){ return e.s && e.t; });
    var neigh={};
    edges.forEach(function(e){
      (neigh[e.s.id]=neigh[e.s.id]||{})[e.t.id]=1;
      (neigh[e.t.id]=neigh[e.t.id]||{})[e.s.id]=1;
    });

    var k = 0.55*Math.sqrt((W*H)/(N+1));
    var hoverId=null, dragging=null, panning=false, panLast=null;
    var cam={scale:1,ox:0,oy:0};

    // Infobulle : équivalent accessible d'un aria-label sur un canvas.
    var tip=document.createElement('div'); tip.className='graph-tip'; tip.style.display='none';
    document.body.appendChild(tip);
    function showTip(n,ev){
      var sub = n.path || (n.kind==='tool' ? 'Outil référencé' : n.id);
      tip.innerHTML='<div class="tname">'+esc(n.label)+'</div>'
        +'<div class="tsub">'+esc(kindOf(n.kind).one+' · '+sub)+'</div>';
      tip.style.display='block';
      var x=ev.clientX+14,y=ev.clientY+16;
      if(x+tip.offsetWidth>window.innerWidth-8) x=ev.clientX-tip.offsetWidth-14;
      if(y+tip.offsetHeight>window.innerHeight-8) y=ev.clientY-tip.offsetHeight-16;
      tip.style.left=x+'px'; tip.style.top=y+'px';
    }
    function hideTip(){ tip.style.display='none'; }
    function toWorld(sx,sy){ return { x:(sx-cam.ox)/cam.scale, y:(sy-cam.oy)/cam.scale }; }

    // Le canvas ne lit pas les variables CSS : on les résout une fois.
    var cs=getComputedStyle(document.documentElement);
    function cvar(n,d){ var v=cs.getPropertyValue(n); return (v&&v.trim())||d; }
    var COL={ panel:cvar('--panel','#fff'), border:cvar('--border','#e5e7eb'),
              ink:cvar('--ink','#1f2430'), muted:cvar('--muted','#6b7280') };

    function clipTxt(s,m){ s=String(s); return s.length>m ? s.slice(0,m-1)+'…' : s; }
    function baseName(p){ return p ? String(p).split('/').pop() : ''; }
    function em(type){ return edgeMeta(type); }

    // Cardinalités calculées sur les liens réels (style Merise).
    var cardCache={};
    function sideCard(type,side){
      var key=type+side;
      if(cardCache[key]) return cardCache[key];
      var deg={}, mx=0;
      edges.forEach(function(e){ if(e.type!==type) return; var kk=e[side].id; deg[kk]=(deg[kk]||0)+1; });
      for(var kk in deg) mx=Math.max(mx,deg[kk]);
      return (cardCache[key]='0,'+(mx>1?'n':'1'));
    }

    function layoutBoxes(){
      nodes.forEach(function(n){
        n.attr = baseName(n.path) || kindOf(n.kind).one.toLowerCase();
        ctx.font='bold 12px system-ui,sans-serif'; var w1=ctx.measureText(clipTxt(n.label,26)).width;
        ctx.font='10.5px system-ui,sans-serif'; var w2=ctx.measureText(clipTxt(n.attr,30)).width;
        ctx.font='10px system-ui,sans-serif'; var w3=ctx.measureText(kindOf(n.kind).one.toUpperCase()).width;
        n.w=Math.max(126,Math.min(236,Math.ceil(Math.max(w1,w2,w3)+22)));
        n.h=62;
      });
    }
    function halfX(n){ return MCD ? n.w/2+4 : 24; }
    function halfY(n){ return MCD ? n.h/2+4 : 24; }
    function clampAll(){ nodes.forEach(function(n){
      n.x=Math.max(halfX(n),Math.min(W-halfX(n),n.x));
      n.y=Math.max(halfY(n),Math.min(H-halfY(n),n.y)); }); }

    function step(temp){
      var disp={}; nodes.forEach(function(n){ disp[n.id]={x:0,y:0}; });
      for(var i=0;i<N;i++) for(var j=i+1;j<N;j++){
        var a=nodes[i],b=nodes[j];
        var dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy)||0.01;
        var f=(k*k)/d, ux=dx/d, uy=dy/d;
        disp[a.id].x+=ux*f; disp[a.id].y+=uy*f;
        disp[b.id].x-=ux*f; disp[b.id].y-=uy*f;
      }
      edges.forEach(function(e){
        var dx=e.s.x-e.t.x,dy=e.s.y-e.t.y,d=Math.sqrt(dx*dx+dy*dy)||0.01;
        var f=(d*d)/k, ux=dx/d, uy=dy/d;
        disp[e.s.id].x-=ux*f; disp[e.s.id].y-=uy*f;
        disp[e.t.id].x+=ux*f; disp[e.t.id].y+=uy*f;
      });
      nodes.forEach(function(n){
        if(n.fixed) return;
        disp[n.id].x+=(W/2-n.x)*0.02; disp[n.id].y+=(H/2-n.y)*0.02;
        var dd=disp[n.id], dl=Math.sqrt(dd.x*dd.x+dd.y*dd.y)||0.01;
        n.x+=(dd.x/dl)*Math.min(dl,temp); n.y+=(dd.y/dl)*Math.min(dl,temp);
      });
      clampAll();
    }
    function settle(){ var t=W/8; for(var s=0;s<320;s++){ step(t); t=Math.max(0.5,t*0.97); } }
    function separate(){
      for(var it=0;it<70;it++){
        var moved=false;
        for(var i=0;i<N;i++) for(var j=i+1;j<N;j++){
          var a=nodes[i],b=nodes[j];
          var dx=b.x-a.x,dy=b.y-a.y,pad=26;
          var ox=(a.w+b.w)/2+pad-Math.abs(dx), oy=(a.h+b.h)/2+pad-Math.abs(dy);
          if(ox>0&&oy>0){
            moved=true;
            if(ox<oy){ var sg=(dx<0?-1:1),s1=ox/2; if(!a.fixed)a.x-=sg*s1; if(!b.fixed)b.x+=sg*s1; }
            else { var sg2=(dy<0?-1:1),s2=oy/2; if(!a.fixed)a.y-=sg2*s2; if(!b.fixed)b.y+=sg2*s2; }
          }
        }
        clampAll();
        if(!moved) break;
      }
    }

    function roundRectPath(x,y,w,h,r){
      ctx.beginPath(); ctx.moveTo(x+r,y);
      ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
      ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
    }
    function roundTopPath(x,y,w,h,r){
      ctx.beginPath(); ctx.moveTo(x,y+h);
      ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
      ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
      ctx.lineTo(x+w,y+h); ctx.closePath();
    }
    function clipRect(box,tx,ty){
      var dx=tx-box.x,dy=ty-box.y,hw=box.w/2,hh=box.h/2;
      var tX=dx!==0?hw/Math.abs(dx):Infinity, tY=dy!==0?hh/Math.abs(dy):Infinity;
      var t=Math.min(tX,tY);
      return { x:box.x+dx*t, y:box.y+dy*t };
    }

    function drawNetwork(){
      edges.forEach(function(e){
        var m=em(e.type);
        var hot=hoverId&&(e.s.id===hoverId||e.t.id===hoverId);
        ctx.beginPath(); ctx.moveTo(e.s.x,e.s.y); ctx.lineTo(e.t.x,e.t.y);
        ctx.lineWidth=hot?2.2:1;
        ctx.setLineDash(m.dashed?[4,3]:[]);
        ctx.globalAlpha=hot?0.95:(hoverId?0.18:0.55);
        ctx.strokeStyle=m.color; ctx.stroke();
      });
      ctx.setLineDash([]); ctx.globalAlpha=1;
      nodes.forEach(function(n){
        var dim=hoverId&&n.id!==hoverId&&!(neigh[hoverId]&&neigh[hoverId][n.id]);
        var r=n.kind==='tool'?6:8;
        ctx.globalAlpha=dim?0.2:1;
        ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2);
        ctx.fillStyle=n.color; ctx.fill();
        ctx.lineWidth=1.5; ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.stroke();
        if(N<=60||!dim){
          ctx.font='11px system-ui,sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
          ctx.fillStyle=COL.ink; ctx.globalAlpha=dim?0.25:0.95;
          ctx.fillText(clipTxt(n.label,24), n.x+r+4, n.y);
        }
        ctx.globalAlpha=1;
      });
    }

    function pill(x,y,txt,color,accent){
      ctx.font='10.5px system-ui,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      var w=ctx.measureText(txt).width+14;
      roundRectPath(x-w/2,y-9,w,18,9);
      ctx.fillStyle=accent?'rgba(99,102,241,.14)':COL.panel;
      ctx.strokeStyle=accent?'rgba(99,102,241,.9)':color; ctx.lineWidth=1; ctx.fill(); ctx.stroke();
      ctx.fillStyle=accent?'#6366f1':COL.ink; ctx.fillText(txt,x,y);
    }
    function cardTag(pFrom,pTo,txt){
      var dx=pTo.x-pFrom.x,dy=pTo.y-pFrom.y,d=Math.sqrt(dx*dx+dy*dy)||1;
      var x=pFrom.x+dx/d*17,y=pFrom.y+dy/d*17;
      ctx.font='9.5px system-ui,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      var w=ctx.measureText(txt).width+8;
      roundRectPath(x-w/2,y-8,w,15,4);
      ctx.fillStyle=COL.panel; ctx.strokeStyle=COL.border; ctx.lineWidth=1; ctx.fill(); ctx.stroke();
      ctx.fillStyle=COL.muted; ctx.fillText(txt,x,y);
    }
    function drawBox(n){
      var dim=hoverId&&n.id!==hoverId&&!(neigh[hoverId]&&neigh[hoverId][n.id]);
      var focus=hoverId===n.id;
      ctx.globalAlpha=dim?0.35:1;
      var x=n.x-n.w/2,y=n.y-n.h/2;
      roundRectPath(x,y,n.w,n.h,10); ctx.fillStyle=COL.panel; ctx.fill();
      roundTopPath(x,y,n.w,20,10); ctx.fillStyle=n.color; ctx.fill();
      roundRectPath(x,y,n.w,n.h,10); ctx.lineWidth=focus?2:1;
      ctx.strokeStyle=focus?n.color:COL.border; ctx.stroke();
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillStyle='#fff'; ctx.font='bold 10px system-ui,sans-serif';
      ctx.fillText(kindOf(n.kind).one.toUpperCase(), x+10, y+10);
      ctx.fillStyle=COL.ink; ctx.font='bold 12px system-ui,sans-serif';
      ctx.fillText(clipTxt(n.label,26), x+10, y+33);
      ctx.fillStyle=COL.muted; ctx.font='10.5px system-ui,sans-serif';
      ctx.fillText(clipTxt(n.attr,30), x+10, y+49);
      ctx.globalAlpha=1;
    }
    function drawMCD(){
      edges.forEach(function(e){
        var m=em(e.type);
        var hot=hoverId&&(e.s.id===hoverId||e.t.id===hoverId);
        var p1=clipRect(e.s,e.t.x,e.t.y), p2=clipRect(e.t,e.s.x,e.s.y);
        ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
        ctx.lineWidth=hot?2:1.2; ctx.setLineDash(m.dashed?[5,4]:[]);
        ctx.globalAlpha=hot?1:(hoverId?0.2:0.7);
        ctx.strokeStyle=m.color; ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha=1;
        // Verbe et cardinalités uniquement quand c'est lisible : sur un graphe
        // dense, ces étiquettes se superposent aux entités — c'est exactement
        // ce qui rendait la vue MCD illisible.
        if(!DENSE || hot){
          cardTag(p1,p2,sideCard(e.type,'s'));
          cardTag(p2,p1,sideCard(e.type,'t'));
          pill((p1.x+p2.x)/2,(p1.y+p2.y)/2, m.verb, m.color, hot);
        }
      });
      nodes.forEach(drawBox);
    }

    function draw(){
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.clearRect(0,0,W,H);
      ctx.setTransform(dpr*cam.scale,0,0,dpr*cam.scale, dpr*cam.ox, dpr*cam.oy);
      if(MCD) drawMCD(); else drawNetwork();
    }
    function fit(){
      var minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
      nodes.forEach(function(n){
        var hw=MCD?n.w/2:12, hh=MCD?n.h/2:12;
        minX=Math.min(minX,n.x-hw); maxX=Math.max(maxX,n.x+hw);
        minY=Math.min(minY,n.y-hh); maxY=Math.max(maxY,n.y+hh);
      });
      var bw=Math.max(1,maxX-minX), bh=Math.max(1,maxY-minY), m=28;
      cam.scale=Math.max(0.35,Math.min(Math.min((W-m*2)/bw,(H-m*2)/bh),1.6));
      cam.ox=W/2-((minX+maxX)/2)*cam.scale;
      cam.oy=H/2-((minY+maxY)/2)*cam.scale;
      draw();
    }
    function zoomAt(sx,sy,f){
      var w=toWorld(sx,sy);
      cam.scale=Math.max(0.3,Math.min(3.5,cam.scale*f));
      cam.ox=sx-w.x*cam.scale; cam.oy=sy-w.y*cam.scale; draw();
    }
    function zoomBy(f){ zoomAt(W/2,H/2,f); }

    // Au-delà de ce seuil, verbes et cardinalités se chevauchent : on ne les
    // dessine plus que sur la relation survolée.
    var DENSE = nodes.length > 14 || edges.length > 18;

    if(MCD) layoutBoxes();
    settle();
    if(MCD) separate();
    draw();

    function posOf(ev){ var r=canvas.getBoundingClientRect(); return { x:ev.clientX-r.left, y:ev.clientY-r.top }; }
    function pick(p){
      if(MCD){
        var hit=null;
        nodes.forEach(function(n){ if(Math.abs(p.x-n.x)<=n.w/2 && Math.abs(p.y-n.y)<=n.h/2) hit=n; });
        return hit;
      }
      var best=null,bd=1e9;
      nodes.forEach(function(n){ var dx=n.x-p.x,dy=n.y-p.y,d=dx*dx+dy*dy; if(d<bd){bd=d;best=n;} });
      return (best&&bd<(18*18))?best:null;
    }
    var downAt=null;
    function onMove(ev){
      var p=posOf(ev);
      if(dragging){
        var w=toWorld(p.x,p.y);
        dragging.x=Math.max(halfX(dragging),Math.min(W-halfX(dragging),w.x));
        dragging.y=Math.max(halfY(dragging),Math.min(H-halfY(dragging),w.y));
        hoverId=dragging.id; draw(); showTip(dragging,ev); return;
      }
      if(panning){ cam.ox+=(ev.clientX-panLast.x); cam.oy+=(ev.clientY-panLast.y);
        panLast={x:ev.clientX,y:ev.clientY}; hideTip(); draw(); return; }
      var n=pick(toWorld(p.x,p.y));
      var nh=n?n.id:null;
      canvas.style.cursor=n?'pointer':'grab';
      if(n) showTip(n,ev); else hideTip();
      if(nh!==hoverId){ hoverId=nh; draw(); }
    }
    function onDown(ev){
      var p=posOf(ev); var n=pick(toWorld(p.x,p.y));
      downAt={x:ev.clientX,y:ev.clientY,node:n};
      if(n){ dragging=n; n.fixed=true; canvas.style.cursor='grabbing'; }
      else { panning=true; panLast={x:ev.clientX,y:ev.clientY}; canvas.style.cursor='grabbing'; }
    }
    function onUp(ev){
      // Un clic net (sans déplacement) sur une entité ouvre sa fiche : le
      // graphe devient navigable, pas seulement contemplatif.
      if(downAt && downAt.node && Math.abs(ev.clientX-downAt.x)<4 && Math.abs(ev.clientY-downAt.y)<4){
        var e=byId[downAt.node.id];
        if(e) openDetail(e);
      }
      downAt=null; dragging=null; panning=false; canvas.style.cursor='grab';
    }
    function onLeave(){ hideTip(); }
    function onWheel(ev){ ev.preventDefault(); var r=canvas.getBoundingClientRect();
      zoomAt(ev.clientX-r.left, ev.clientY-r.top, ev.deltaY<0?1.12:1/1.12); }

    canvas.addEventListener('mousemove',onMove);
    canvas.addEventListener('mousedown',onDown);
    canvas.addEventListener('mouseleave',onLeave);
    canvas.addEventListener('wheel',onWheel,{passive:false});
    window.addEventListener('mouseup',onUp);
    var rt=null;
    var onResize=function(){ if(rt) clearTimeout(rt); rt=setTimeout(function(){ resize(); clampAll(); draw(); },150); };
    window.addEventListener('resize',onResize);

    return {
      stop:function(){
        canvas.removeEventListener('mousemove',onMove);
        canvas.removeEventListener('mousedown',onDown);
        canvas.removeEventListener('mouseleave',onLeave);
        canvas.removeEventListener('wheel',onWheel);
        window.removeEventListener('mouseup',onUp);
        window.removeEventListener('resize',onResize);
        if(rt) clearTimeout(rt);
        if(tip&&tip.parentNode) tip.parentNode.removeChild(tip);
      },
      resize:function(){ resize(); clampAll(); draw(); },
      fit:fit, zoomBy:zoomBy
    };
  }

  render();
})();