#!/usr/bin/env node
// ai-map — fichier autonome généré par build.mjs. NE PAS ÉDITER À LA MAIN.
// Source : src/ (multi-fichiers). Régénérer : node build.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';

globalThis.__AI_MAP_ASSETS = {"styles.css":":root{\n  --bg:#f6f7fb; --panel:#ffffff; --ink:#1f2430; --muted:#6b7280; --border:#e5e7eb;\n  --chip:#f1f3f9; --shadow:0 1px 3px rgba(16,24,40,.08),0 1px 2px rgba(16,24,40,.04);\n  --accent:#6366f1;\n}\n:root[data-theme=\"dark\"]{\n  --bg:#0f1117; --panel:#171a21; --ink:#e7e9ee; --muted:#9aa2b1; --border:#262b36;\n  --chip:#1e222c; --shadow:0 1px 2px rgba(0,0,0,.4);\n}\n@media (prefers-color-scheme:dark){\n  :root:not([data-theme=\"light\"]){\n    --bg:#0f1117; --panel:#171a21; --ink:#e7e9ee; --muted:#9aa2b1; --border:#262b36;\n    --chip:#1e222c; --shadow:0 1px 2px rgba(0,0,0,.4);\n  }\n}\n*{box-sizing:border-box}\nbody{margin:0;background:var(--bg);color:var(--ink);\n  font-family:\"Plus Jakarta Sans\",system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5}\na{color:var(--accent)}\n.wrap{max-width:1280px;margin:0 auto;padding:28px 28px 40px}\nheader.top{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;margin-bottom:18px}\n.title h1{margin:0;font-size:23px;font-weight:800;letter-spacing:-.02em}\n.title .sub{color:var(--muted);font-size:13px;margin-top:4px}\n.btn{border:1px solid var(--border);background:var(--panel);color:var(--ink);\n  border-radius:10px;padding:8px 13px;font-size:13px;cursor:pointer}\n.btn:hover{border-color:var(--accent)}\n.panel{background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:24px;box-shadow:var(--shadow);margin:0 0 20px}\n.panel h2{margin:0 0 14px;font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px}\n.panel .hint{color:var(--muted);font-size:12.5px;margin:-8px 0 16px;max-width:74ch;line-height:1.55}\n.dot{width:9px;height:9px;border-radius:50%;display:inline-block;flex:0 0 auto}\n\n/* Onglets — le rapport est découpé en vues plutôt qu'empilé en un seul défilement */\n.tabs{display:flex;flex-wrap:wrap;gap:4px;border-bottom:1px solid var(--border);margin-bottom:24px}\n.tab{border:0;background:none;color:var(--muted);cursor:pointer;font-size:13.5px;font-weight:600;\n  font-family:inherit;padding:11px 15px;display:inline-flex;align-items:center;gap:8px;\n  border-bottom:2px solid transparent;margin-bottom:-1px;border-radius:8px 8px 0 0}\n.tab:hover{color:var(--ink);background:var(--chip)}\n.tab.on{color:var(--accent);border-bottom-color:var(--accent)}\n.tab .ticon{font-size:14px;line-height:1}\n.tab .tcount{background:var(--chip);color:var(--muted);border-radius:999px;padding:1px 8px;\n  font-size:11px;font-weight:700;font-variant-numeric:tabular-nums}\n.tab.on .tcount{background:var(--accent);color:#fff}\n\n/* Bandeau d'indicateurs */\n.kpi-band{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));\n  background:var(--panel);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow);\n  overflow:hidden;margin:0 0 20px}\n.kpi-cell{padding:20px 22px;border-left:1px solid var(--border)}\n.kpi-cell:first-child{border-left:0}\n.kc-label{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}\n.kc-value{display:flex;align-items:baseline;gap:8px;margin-top:10px}\n.kc-n{font-size:32px;font-weight:800;line-height:1;letter-spacing:-.03em}\n.kc-note{font-size:12px;color:var(--muted)}\n.srcs{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}\n.src{border:1px solid var(--border);border-left-width:4px;border-radius:12px;padding:13px 15px;background:var(--chip);\n  transition:border-color .15s ease}\n.src:hover:not(.off){border-color:var(--accent)}\n.src.off{opacity:.5}\n.src .sname{font-weight:700;font-size:13.5px;display:flex;align-items:center;gap:7px}\n.src .scount{font-size:12px;color:var(--muted);margin-top:3px}\n.src .sroot{font-size:11px;color:var(--muted);font-family:ui-monospace,Menlo,Consolas,monospace;margin-top:4px;word-break:break-all}\n\n/* Histogramme */\n.bars{display:flex;flex-direction:column;gap:4px}\n.bar-row{display:grid;grid-template-columns:170px 1fr 44px;align-items:center;gap:14px;\n  padding:5px 8px;margin:0 -8px;border-radius:9px;cursor:pointer}\n.bar-row:hover{background:var(--chip)}\n.bar-row .name{font-size:13px;font-weight:600;display:flex;align-items:center;gap:7px}\n.bar-track{background:var(--chip);border-radius:8px;height:20px;overflow:hidden}\n.bar-row:hover .bar-track{background:var(--bg)}\n.bar-fill{height:100%;border-radius:8px}\n.bar-val{font-size:13px;font-weight:700;text-align:right;color:var(--muted);font-variant-numeric:tabular-nums}\n\n/* Score de maturité */\n.score-box{display:block}\n.score-parts{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:22px}\n.sp-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px}\n.sp-label{font-size:13px;font-weight:700}\n.sp-pct{font-size:13px;font-weight:700;color:var(--muted);font-variant-numeric:tabular-nums}\n.sp-track{background:var(--chip);border-radius:6px;height:7px;overflow:hidden;margin:7px 0 6px}\n.sp-fill{height:100%;border-radius:6px}\n.sp-desc{font-size:11.5px;color:var(--muted);line-height:1.45}\n\n/* Tableau de bord : score en grand + alertes, côte à côte */\n.dash-top{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:20px;margin:0 0 20px}\n@media (max-width:1000px){ .dash-top{grid-template-columns:1fr} }\n.score-hero{margin:0}\n.sh-label{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--muted)}\n.sh-big{display:flex;align-items:baseline;gap:6px;margin:10px 0 24px}\n.sh-n{font-size:68px;font-weight:800;line-height:.9;letter-spacing:-.045em;\n  font-variant-numeric:tabular-nums}\n.sh-max{font-size:19px;color:var(--muted);font-weight:600}\n.sh-parts{display:flex;flex-direction:column;gap:17px}\n\n/* Alertes : fiches façon maquette */\n.alerts-panel{margin:0;display:flex;flex-direction:column}\n.ap-head{display:flex;align-items:center;gap:9px;margin:0 0 15px}\n.ap-title{font-size:15px;font-weight:700}\n.ap-count{font-size:11.5px;font-weight:700;padding:1px 9px;border-radius:999px;\n  background:rgba(245,158,11,.2);color:#d97706;font-variant-numeric:tabular-nums}\n.acards{display:flex;flex-direction:column;gap:10px}\n.acard{display:flex;align-items:flex-start;gap:13px;padding:15px 17px;border-radius:12px;cursor:pointer;\n  border:1px solid var(--border);border-left:3px solid var(--border);background:var(--panel)}\n.acard:hover{border-color:var(--accent)}\n.acard.warn{border-left-color:#d97706;background:linear-gradient(0deg,rgba(245,158,11,.06),rgba(245,158,11,.06)),var(--panel)}\n.acard.danger{border-left-color:#e11d48;background:linear-gradient(0deg,rgba(244,63,94,.06),rgba(244,63,94,.06)),var(--panel)}\n.acard.info{border-left-color:#6366f1;background:linear-gradient(0deg,rgba(99,102,241,.05),rgba(99,102,241,.05)),var(--panel)}\n.acard.compact{padding:12px 14px}\n.ac-icon{font-size:14px;line-height:1.5;flex:0 0 auto}\n.ac-body{flex:1;min-width:0}\n.ac-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}\n.ac-name{font-size:14px;font-weight:700;word-break:break-word}\n.ac-badge{font-size:10.5px;font-weight:700;padding:1px 8px;border-radius:6px;border:1px solid transparent;\n  font-family:ui-monospace,Menlo,Consolas,monospace;white-space:nowrap}\n.ac-reason{font-size:13px;font-weight:600;margin-top:7px}\n.acard.warn .ac-reason{color:#d97706}\n.acard.danger .ac-reason{color:#e11d48}\n.acard.info .ac-reason{color:#6366f1}\n.ac-why{font-size:12.5px;color:var(--muted);margin-top:5px;line-height:1.5}\n.ac-path{font-size:11px;color:var(--muted);font-family:ui-monospace,Menlo,Consolas,monospace;\n  margin-top:9px;word-break:break-all}\n.ac-acts{display:flex;flex-direction:column;gap:7px;flex:0 0 auto}\n.ac-btn{padding:6px 13px;font-size:12px;white-space:nowrap}\n.ac-btn.ghost{background:transparent;color:var(--muted)}\n.ac-btn.ghost:hover{color:var(--ink)}\n.ap-more{margin-top:14px;width:100%;font-weight:600;color:var(--accent)}\n\n/* Relations groupées par verbe */\n.relgroup{margin:0 0 26px}\n.rg-head{display:flex;align-items:center;gap:9px;margin:0 0 12px}\n.rg-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}\n.rg-count{font-size:10.5px;font-weight:700;padding:1px 8px;border-radius:999px;\n  background:var(--chip);color:var(--muted);font-variant-numeric:tabular-nums}\n.rg-sec{margin:0 0 13px}\n.rg-verb{display:flex;align-items:center;gap:9px;margin:0 0 7px}\n.rg-vname{font-size:12.5px;font-weight:700}\n.rg-items{display:flex;flex-direction:column;gap:5px}\n.rlink{display:flex;align-items:baseline;gap:10px;padding:8px 12px;border-radius:9px;cursor:pointer;\n  background:var(--chip);border-left:3px solid var(--border);flex-wrap:wrap}\n.rlink:hover{background:var(--panel);box-shadow:var(--shadow)}\n.rlink.inert{cursor:default;opacity:.75}\n.rl-ic{font-size:12px;flex:0 0 auto}\n.rl-name{font-size:13px;font-weight:600}\n.rl-path{font-size:10.5px;color:var(--muted);font-family:ui-monospace,Menlo,Consolas,monospace;\n  margin-left:auto;word-break:break-all}\n.rl-cross{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;\n  padding:1px 7px;border-radius:999px;background:rgba(99,102,241,.16);color:var(--accent);flex:0 0 auto}\n\n/* Blocs de code : la langue redevient visible, le contenu copiable */\n.codeblock{border:1px solid var(--border);border-radius:11px;overflow:hidden;margin:14px 0;\n  background:var(--chip)}\n.cb-head{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;\n  border-bottom:1px solid var(--border);background:var(--panel)}\n.cb-lang{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;\n  color:var(--accent);font-family:ui-monospace,Menlo,Consolas,monospace}\n.cb-copy{border:1px solid var(--border);background:transparent;color:var(--muted);border-radius:7px;\n  padding:3px 10px;font-size:11px;font-family:inherit;cursor:pointer}\n.cb-copy:hover{border-color:var(--accent);color:var(--accent)}\n.codeblock pre{margin:0;border:0;border-radius:0;background:none;padding:13px 15px}\n\n/* Alertes de gouvernance */\n.ok-note{color:#16a34a;font-size:13.5px;font-weight:600}\n.alerts{display:flex;flex-direction:column;gap:2px}\n.alert{display:flex;gap:12px;align-items:flex-start;padding:11px 12px;border-radius:10px;cursor:pointer;\n  border-left:3px solid transparent}\n.alert:hover{background:var(--chip)}\n.alert.danger{border-left-color:#e11d48}\n.alert.warn{border-left-color:#d97706}\n.alert.info{border-left-color:var(--border)}\n.a-tone{font-size:12px;font-weight:800;line-height:1.5;flex:0 0 auto}\n.alert.danger .a-tone{color:#e11d48}\n.alert.warn .a-tone{color:#d97706}\n.alert.info .a-tone{color:var(--muted)}\n.a-body{min-width:0}\n.a-title{font-size:13.5px;font-weight:700;display:flex;align-items:center;gap:8px;flex-wrap:wrap}\n.a-msg{font-size:12.5px;color:var(--muted);margin-top:3px}\n\n/* Tuiles « composants IA détectés » */\n.sec-label{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;\n  color:var(--muted);margin:0 0 12px}\n.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:0 0 24px}\n.tile{border:1px solid var(--border);border-radius:12px;padding:13px 15px;cursor:pointer;\n  transition:transform .12s ease}\n.tile:hover{transform:translateY(-2px)}\n.tile-head{font-size:11.5px;font-weight:700}\n.tile-n{font-size:26px;font-weight:800;line-height:1.1;margin-top:7px;letter-spacing:-.02em}\n.tile-src{font-size:10.5px;color:var(--muted);margin-top:5px}\n\n/* Recommandations chiffrées */\n.recos{display:flex;flex-direction:column;gap:6px}\n.reco{display:flex;align-items:center;gap:13px;padding:13px 15px;border-radius:11px;cursor:pointer;\n  background:var(--chip);border:1px solid transparent}\n.reco:hover{border-color:var(--accent)}\n.reco-arrow{color:var(--muted);font-size:15px;flex:0 0 auto}\n.reco-body{flex:1;min-width:0}\n.reco-label{font-size:13.5px;font-weight:600}\n.reco-why{font-size:12px;color:var(--muted);margin-top:3px;line-height:1.45}\n.reco-gain{flex:0 0 auto;font-size:11.5px;font-weight:700;font-family:ui-monospace,Menlo,Consolas,monospace;\n  padding:4px 11px;border-radius:999px;background:rgba(34,197,94,.16);color:#16a34a;white-space:nowrap}\n\n/* Sélecteur du fil d'impact */\n.isel{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 18px}\n.ichip{border:1px solid var(--border);background:var(--panel);border-radius:8px;padding:6px 9px 6px 12px;\n  font-size:12.5px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;\n  font-family:ui-monospace,Menlo,Consolas,monospace;max-width:340px;overflow:hidden;\n  text-overflow:ellipsis;white-space:nowrap}\n.ichip:hover{border-color:var(--accent)}\n.ichip.on{border-color:var(--accent);color:var(--accent);background:rgba(99,102,241,.1)}\n\n/* Graphe — contrôles en barre latérale */\n.graph-panel{padding:0;overflow:hidden}\n.glayout{display:flex;align-items:stretch;min-height:0}\n.gside{flex:0 0 208px;border-right:1px solid var(--border);padding:18px 16px;\n  background:var(--chip);display:flex;flex-direction:column;gap:7px;overflow:auto}\n.gs-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;\n  color:var(--muted);margin:12px 0 3px}\n.gs-label:first-child{margin-top:0}\n.gs-seg{width:100%}\n.gs-seg button{flex:1;padding:6px 8px;font-size:12px}\n.gs-type{display:flex;align-items:center;gap:8px;width:100%;text-align:left;cursor:pointer;\n  border:1px solid var(--border);border-left:3px solid var(--border);border-radius:7px;\n  padding:6px 9px;font-family:inherit;font-size:12px;background:var(--panel);color:var(--ink)}\n.gs-type.off{opacity:.42}\n.gs-type:hover{border-color:var(--accent)}\n.gs-tname{flex:1;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.gs-tn{font-size:10.5px;color:var(--muted);font-variant-numeric:tabular-nums;flex:0 0 auto}\n.gs-edge{display:flex;align-items:center;gap:7px;font-size:12px;cursor:pointer;padding:3px 0}\n.gs-btn{margin-top:14px;width:100%}\n.gmain{flex:1;min-width:0;display:flex;flex-direction:column;padding:16px 18px}\n.gcanvas{position:relative;flex:1;min-height:0;display:flex}\n.gstat{position:absolute;top:10px;right:12px;font-size:11px;color:var(--muted);\n  background:var(--panel);border:1px solid var(--border);border-radius:999px;padding:3px 11px;\n  font-variant-numeric:tabular-nums;pointer-events:none}\n\n/* Fil d'impact */\n.chains{display:flex;flex-direction:column;gap:8px}\n.chain{padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:var(--chip)}\n.chain.cross{border-color:rgba(99,102,241,.45)}\n.chain-flag{display:inline-block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;\n  color:var(--accent);background:rgba(99,102,241,.14);border-radius:999px;padding:2px 9px;margin-bottom:9px}\n.chain-line{display:flex;flex-wrap:wrap;align-items:stretch;gap:10px}\n.chain-arrow{color:var(--muted);font-size:20px;flex:0 0 auto;align-self:center;line-height:1}\n.chain-more{font-size:11.5px;color:var(--muted);align-self:center;cursor:default}\n/* Maillon du fil : rôle · nom · chemin — la lecture que décrit la vision. */\n.ccard{background:var(--panel);border:1px solid var(--border);border-top:3px solid var(--border);\n  border-radius:10px;padding:11px 14px;min-width:170px;max-width:290px;flex:1 1 auto}\n.ccard.clickable{cursor:pointer}\n.ccard.clickable:hover{border-color:var(--accent)}\n.cc-role{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}\n.cc-name{font-size:13.5px;font-weight:700;margin-top:6px;line-height:1.35;word-break:break-word}\n.cc-path{font-size:10.5px;color:var(--muted);font-family:ui-monospace,Menlo,Consolas,monospace;\n  margin-top:5px;word-break:break-all;line-height:1.4}\n\n/* Changes */\n.changes{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}\n.change-row{border:1px solid var(--border);border-radius:12px;padding:14px 16px;cursor:pointer;background:var(--chip)}\n.change-row:hover{border-color:var(--accent)}\n.ch-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}\n.ch-name{font-size:14px;font-weight:700}\n.ch-desc{font-size:12.5px;color:var(--muted);margin:7px 0 0;line-height:1.5}\n.ch-track{background:var(--panel);border-radius:6px;height:6px;overflow:hidden;margin:11px 0 5px}\n.ch-fill{height:100%;border-radius:6px}\n.ch-adv{font-size:11.5px;color:var(--muted);font-variant-numeric:tabular-nums}\n\n/* Timeline */\n.tl-bars{display:flex;align-items:flex-end;gap:6px;height:120px;margin:4px 0 2px}\n.tl-col{flex:1;display:flex;flex-direction:column;align-items:center;height:100%;min-width:0}\n.tl-n{font-size:10.5px;color:var(--muted);font-weight:700;height:14px;line-height:14px}\n.tl-bar{width:100%;max-width:34px;background:var(--accent);border-radius:6px 6px 0 0;flex:0 0 auto;\n  min-height:2px;transition:height .4s ease}\n.tl-bar.zero{background:var(--border)}\n.tl-col{justify-content:flex-end}\n.tl-cap{font-size:10.5px;color:var(--muted);margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}\n.tl-list{margin-top:14px}\n.tl-head{display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:700;color:var(--muted);\n  text-transform:uppercase;letter-spacing:.04em;margin:14px 0 6px}\n.tl-head:first-child{margin-top:0}\n.tl-count{background:var(--chip);border-radius:999px;padding:1px 8px;font-size:11px;letter-spacing:0}\n.tl-row{display:flex;align-items:center;gap:9px;padding:6px 8px;border-radius:9px;cursor:pointer;font-size:13px}\n.tl-row:hover{background:var(--chip)}\n.tl-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}\n.tl-when{font-size:11.5px;color:var(--muted);font-variant-numeric:tabular-nums;flex:0 0 auto}\n.tl-more{font-size:12px;color:var(--muted);font-style:italic;padding:4px 8px}\n\n/* Barre d'outils */\n.toolbar{display:flex;flex-direction:column;gap:8px;margin:8px 0 16px;position:sticky;top:0;\n  background:var(--bg);padding:10px 0;z-index:5}\n.trow{display:flex;flex-wrap:wrap;gap:8px;align-items:center}\n.trow .tlabel{font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;font-weight:700;min-width:82px}\n.search{flex:1;min-width:220px;display:flex;align-items:center;gap:8px;background:var(--panel);\n  border:1px solid var(--border);border-radius:10px;padding:8px 12px}\n.search input{border:0;outline:0;background:transparent;color:var(--ink);width:100%;font-size:14px}\n.chip{border:1px solid var(--border);background:var(--panel);border-radius:999px;padding:6px 8px 6px 13px;\n  font-size:12.5px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;user-select:none}\n.chip.active{color:#fff;border-color:transparent}\n.chip:hover{border-color:var(--accent)}\n.chipn{background:var(--chip);color:var(--muted);border-radius:999px;padding:1px 7px;font-size:11px;\n  font-weight:700;font-variant-numeric:tabular-nums}\n.chip.active .chipn{background:rgba(255,255,255,.22);color:#fff}\n\n/* Fiches */\n.cat-block{margin:0 0 26px}\n.cat-head{display:flex;align-items:baseline;gap:10px;margin:0 0 14px;flex-wrap:wrap;cursor:pointer;\n  padding:6px 8px;margin-left:-8px;border-radius:9px}\n.cat-head:hover{background:var(--chip)}\n.cat-caret{color:var(--muted);font-size:11px;flex:0 0 auto}\n.cat-head .h{font-size:16px;font-weight:800;display:inline-flex;align-items:center;gap:9px}\n.cat-count{background:var(--chip);color:var(--muted);border-radius:999px;padding:1px 9px;\n  font-size:11.5px;font-weight:700;font-variant-numeric:tabular-nums}\n.cat-head:hover .cat-count{background:var(--bg)}\n.cat-head .d{color:var(--muted);font-size:12.5px}\n.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px}\n.card{background:var(--panel);border:1px solid var(--border);border-left-width:4px;border-radius:14px;\n  padding:14px 16px;box-shadow:var(--shadow);display:flex;flex-direction:column}\n.card .cname{font-weight:700;font-size:14.5px;display:flex;align-items:center;gap:8px;word-break:break-word}\n.card .cdesc{color:var(--muted);font-size:13px;margin:8px 0}\n.cfoot{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;\n  margin-top:auto;padding-top:12px}\n.card .cpath{font-size:11px;color:var(--muted);font-family:ui-monospace,Menlo,Consolas,monospace;\n  word-break:break-all;min-width:0}\n.card .cdate{font-size:11px;color:var(--muted);white-space:nowrap;flex:0 0 auto;font-variant-numeric:tabular-nums}\n.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}\n.tag{background:var(--chip);border-radius:6px;padding:2px 8px;font-size:11px;color:var(--muted)}\n.tag b{color:var(--ink);font-weight:600}\n.badge{font-size:10.5px;font-weight:700;border-radius:999px;padding:2px 8px;text-transform:uppercase;letter-spacing:.03em}\n.badge.ok{background:rgba(34,197,94,.16);color:#16a34a}\n.badge.warn{background:rgba(245,158,11,.18);color:#d97706}\n.badge.danger{background:rgba(244,63,94,.16);color:#e11d48}\n.badge.info{background:rgba(99,102,241,.16);color:#6366f1}\n.badge.muted{background:var(--chip);color:var(--muted)}\n.srcpill{font-size:10.5px;font-weight:700;color:#fff;border-radius:999px;padding:2px 8px}\n.outline{margin:8px 0 0;padding-left:0;list-style:none;font-size:12px;color:var(--muted)}\n.outline li{padding:1px 0}\n.empty{color:var(--muted);font-size:13px;font-style:italic;padding:6px 0}\n.card-actions{margin-top:12px;display:flex;justify-content:flex-end;gap:8px}\n.details-btn{border:1px solid var(--border);background:var(--chip);color:var(--ink);\n  border-radius:8px;padding:6px 12px;font-size:12.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px}\n.details-btn:hover{border-color:var(--accent);color:var(--accent)}\n\n/* Arbres */\n.tree,.tree ul{list-style:none;margin:0;padding-left:16px}\n.tree>li{padding-left:0}\n.tree li{position:relative;font-size:13px;padding:2px 0}\n.tree .d{cursor:pointer;font-weight:600}\n.tree .d::before{content:\"▸ \";color:var(--muted)}\n.tree .d.open::before{content:\"▾ \"}\n.tree .f{color:var(--muted);font-family:ui-monospace,Menlo,Consolas,monospace}\n.tree .f::before{content:\"• \";color:var(--border)}\n.treeroot{font-size:12.5px;font-weight:700;margin:14px 0 4px;display:flex;align-items:center;gap:7px}\n.treeroot:first-child{margin-top:0}\n.hidden{display:none !important}\n\n/* Modale de détail */\n.overlay{position:fixed;inset:0;background:rgba(15,17,23,.55);backdrop-filter:blur(2px);\n  display:flex;align-items:center;justify-content:center;padding:20px;z-index:50}\n.modal{background:var(--panel);border:1px solid var(--border);border-radius:16px;\n  width:min(940px,100%);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.35)}\n.modal-head{display:flex;align-items:flex-start;gap:12px;justify-content:space-between;\n  padding:18px 20px;border-bottom:1px solid var(--border)}\n.modal-head .mtitle{font-size:17px;font-weight:800;display:flex;align-items:center;gap:10px;flex-wrap:wrap}\n.modal-head .mbadge{font-size:11px;font-weight:700;color:#fff;border-radius:999px;padding:3px 10px}\n.modal-head .mpath{font-size:11.5px;color:var(--muted);font-family:ui-monospace,Menlo,Consolas,monospace;margin-top:4px;word-break:break-all}\n.modal-close{border:1px solid var(--border);background:var(--chip);color:var(--ink);\n  border-radius:8px;width:32px;height:32px;font-size:16px;cursor:pointer;flex:0 0 auto}\n.modal-close:hover{border-color:var(--accent);color:var(--accent)}\n.modal-meta{display:flex;flex-wrap:wrap;gap:6px;padding:12px 20px 0}\n.modal-body{padding:8px 20px 20px;overflow:auto}\n.rel{padding:10px 20px 0;font-size:12.5px}\n.rel h4{margin:8px 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}\n.rel .rlink{display:inline-flex;align-items:center;gap:6px;background:var(--chip);border:1px solid var(--border);\n  border-radius:8px;padding:3px 9px;margin:0 6px 6px 0;font-size:12px;cursor:pointer}\n.rel .rlink:hover{border-color:var(--accent)}\n\n/* Rendu Markdown */\n.md{font-size:14px;line-height:1.65;color:var(--ink);word-wrap:break-word}\n.md h1,.md h2,.md h3{line-height:1.3;margin:18px 0 8px;font-weight:800}\n.md h1{font-size:21px;margin-top:0}\n/* Titre de section : barre colorée + fond teinté, à la couleur du type de\n   l'entité (--tone). C'est ce qui donne un fil de lecture à une longue fiche. */\n.md h2{font-size:16px;margin:28px 0 14px;padding:10px 0 10px 15px;\n  border-left:4px solid var(--tone,var(--accent));border-radius:0 8px 8px 0;\n  color:var(--tone,var(--accent));\n  background:linear-gradient(90deg,color-mix(in srgb,var(--tone,var(--accent)) 12%,transparent),transparent 70%)}\n.md h3{font-size:14.5px;color:var(--tone,var(--ink));margin-top:20px}\n.md h3::before{content:\"▸ \";opacity:.6}\n.md p{margin:8px 0}\n.md ul,.md ol{margin:8px 0;padding-left:22px}\n.md li{margin:3px 0}\n.md code{background:var(--chip);border-radius:5px;padding:1px 6px;font-size:12.5px;\n  font-family:ui-monospace,Menlo,Consolas,monospace}\n.md pre{background:var(--chip);border:1px solid var(--border);border-radius:10px;padding:12px 14px;\n  overflow:auto;margin:10px 0}\n.md pre code{background:none;padding:0;font-size:12.5px;line-height:1.5;display:block}\n.md blockquote{border-left:3px solid var(--accent);margin:10px 0;padding:2px 14px;color:var(--muted)}\n.md a{color:var(--accent);word-break:break-all}\n.md hr{border:0;border-top:1px solid var(--border);margin:16px 0}\n.md table{border-collapse:collapse;margin:12px 0;display:block;overflow-x:auto;max-width:100%}\n.md th,.md td{border:1px solid var(--border);padding:6px 10px;font-size:13px;text-align:left}\n.md th{background:var(--chip);font-weight:700}\n.md strong{font-weight:700}\n\n/* Graphe */\n.graph-tip{position:fixed;z-index:70;pointer-events:none;background:var(--ink);color:var(--bg);\n  font-size:12px;line-height:1.35;padding:7px 10px;border-radius:8px;max-width:340px;box-shadow:0 8px 24px rgba(0,0,0,.35)}\n.graph-tip .tname{font-weight:700}\n.graph-tip .tsub{opacity:.75;font-size:11px;font-family:ui-monospace,Menlo,Consolas,monospace;word-break:break-all;margin-top:2px}\n.gctl{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:10px}\n.seg{display:inline-flex;border:1px solid var(--border);border-radius:10px;overflow:hidden}\n.seg button{border:0;padding:7px 12px;font-size:13px;cursor:pointer;background:var(--panel);color:var(--ink)}\n.seg button.on{background:var(--accent);color:#fff}\n.etoggle{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer}\n.eline{width:18px;height:0;display:inline-block}\n.glegend{display:flex;flex-wrap:wrap;gap:12px;margin:0 0 10px}\n.glegend span.it{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}\n.gtools{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;margin:0 0 8px}\n.gtools .btn{padding:6px 10px;font-size:12.5px}\ncanvas.graph{width:100%;display:block;cursor:grab;border-radius:12px;background:var(--chip)}\n\n/* Plein écran — API Fullscreen : le panneau devient une colonne flex et le\n   canvas absorbe toute la hauteur restante. */\n.panel:fullscreen{border-radius:0;border:0;margin:0;padding:0;background:var(--bg);max-width:none;\n  display:flex;flex-direction:column}\n.panel:fullscreen .glayout{flex:1;min-height:0}\n.panel:fullscreen canvas.graph{flex:1 1 auto;min-height:0;height:auto}\n.panel:fullscreen h2,.panel:fullscreen .hint{display:none}\n\n/* Repli si l'API Fullscreen est refusée : recouvrement de la fenêtre. */\n.panel.fullscreen:not(:fullscreen){position:fixed;inset:0;margin:0;z-index:60;border-radius:0;\n  display:flex;flex-direction:column;max-width:none;padding:0}\n.panel.fullscreen:not(:fullscreen) .glayout{flex:1;min-height:0}\n.panel.fullscreen:not(:fullscreen) canvas.graph{flex:1 1 auto;min-height:320px;height:auto}\n.panel.fullscreen:not(:fullscreen) h2,.panel.fullscreen:not(:fullscreen) .hint{display:none}\n\n/* Sous 900px, la barre latérale passe au-dessus du graphe plutôt que de\n   l'écraser à quelques pixels de large. */\n@media (max-width:900px){\n  .glayout{flex-direction:column}\n  .gside{flex:0 0 auto;border-right:0;border-bottom:1px solid var(--border);\n    flex-direction:row;flex-wrap:wrap;align-items:center}\n  .gs-label{width:100%;margin:6px 0 0}\n}\n\n/* Fiche détaillée — une PAGE, pas une popup */\n.detail{max-width:960px}\n.dhead{display:flex;align-items:flex-start;gap:16px;margin:0 0 18px;flex-wrap:wrap}\n.dtitle-box{flex:1;min-width:240px}\n.dtitle{font-size:21px;font-weight:800;display:flex;align-items:center;gap:11px;\n  letter-spacing:-.02em;word-break:break-word}\n.dbar{width:4px;height:22px;border-radius:2px;flex:0 0 auto}\n.dpath{font-size:11.5px;color:var(--muted);font-family:ui-monospace,Menlo,Consolas,monospace;\n  margin-top:7px;word-break:break-all}\n.dbadges{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}\n.dtabs{display:flex;gap:4px;border-bottom:1px solid var(--border);margin:0 0 20px}\n.dtab{border:0;background:none;color:var(--muted);cursor:pointer;font-family:inherit;\n  font-size:13.5px;font-weight:600;padding:10px 14px;display:inline-flex;align-items:center;gap:8px;\n  border-bottom:2px solid transparent;margin-bottom:-1px}\n.dtab:hover{color:var(--ink)}\n.dtab.on{color:var(--accent);border-bottom-color:var(--accent)}\n.dpane{animation:none}\n.dmeta{border-collapse:collapse;width:100%}\n.dmeta th,.dmeta td{border:1px solid var(--border);padding:8px 12px;font-size:13px;text-align:left}\n.dmeta th{background:var(--chip);font-weight:700;width:32%;white-space:nowrap}\nfooter{color:var(--muted);font-size:12px;text-align:center;margin:26px 0 8px}.ghidden{font-size:11.5px;color:var(--muted);font-style:italic}\n/* Entité portant une alerte : fond légèrement teinté pour attirer l'œil. */\n.card.flag{background:linear-gradient(0deg,rgba(245,158,11,.05),rgba(245,158,11,.05)),var(--panel)}\n.gtip{font-size:12px;color:var(--muted);background:var(--chip);border-radius:9px;\n  padding:9px 13px;margin:0 0 12px;line-height:1.5}\n.gtip-act{border:1px solid var(--accent);background:transparent;color:var(--accent);\n  border-radius:7px;padding:3px 10px;font-size:11.5px;font-family:inherit;cursor:pointer;\n  font-weight:600;white-space:nowrap}\n.gtip-act:hover{background:rgba(99,102,241,.12)}\n","app.js":"(function(){\n  var root = document.getElementById('app');\n\n  // Deux dimensions de filtrage — c'est la différence structurante avec une\n  // carte mono-écosystème : on filtre par TYPE d'entité et par ÉCOSYSTÈME.\n  // `tab` découpe le rapport : tout empiler dans un seul défilement rendait la\n  // page illisible dès qu'un projet dépassait quelques dizaines d'entités.\n  var state = { q:'', kind:'all', source:'all', tab:'overview', detail:null, impact:null };\n\n  var TABS = [\n    { key:'overview',   icon:'▦', label:'Vue d\\'ensemble' },\n    { key:'impact',     icon:'🎯', label:'Impact' },\n    { key:'governance', icon:'⚖️', label:'Gouvernance' },\n    { key:'graph',      icon:'🕸', label:'Graphe' },\n    { key:'timeline',   icon:'🕰', label:'Timeline' },\n    { key:'entities',   icon:'📇', label:'Entités' },\n    { key:'tree',       icon:'🌳', label:'Fichiers' },\n  ];\n\n  // ----- Rôles dans le fil d'impact -----------------------------------------\n  // Le fil se lit toujours dans le même sens : ce qui PRESCRIT → ce qui AGIT →\n  // ce que ça ATTEINT. C'est la lecture décrite par la vision\n  // (« Requirement → Skill → MCP Tool → Code »), généralisée à tous les outils.\n  // Les rangs ordonnent le fil : une exigence explique mieux « pourquoi » qu'un\n  // CLAUDE.md, et un serveur MCP ou un fichier de code disent mieux « quoi »\n  // qu'un outil générique (Bash, Read…).\n  var ORIGIN_KINDS = { requirement:0, spec:1, change:2, rule:3, knowledge:4, memory:5 };\n  var ACTOR_KINDS  = { skill:1, command:1, agent:1, workflow:1, prompt:1 };\n  var TARGET_KINDS = { mcp:0, code:1, tool:2 };\n  var GENERIC_TARGET_RANK = 2;\n\n  function el(tag, cls, txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }\n  function esc(s){ return String(s).replace(/[&<>\"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch];}); }\n\n  function kindOf(key){ return DATA.kindDict[key] || { label:key, one:key, icon:'•', color:'#94a3b8' }; }\n  function srcOf(id){\n    for(var i=0;i<DATA.sources.length;i++){ if(DATA.sources[i].id===id) return DATA.sources[i]; }\n    return { id:id, label:id, icon:'•', color:'#94a3b8' };\n  }\n  var byId = {}; DATA.entities.forEach(function(e){ byId[e.id]=e; });\n\n  // ---------------------------------------------------------------- rendu --\n  // Ossature de la page : elle ne change jamais. Seul le contenu de l'onglet\n  // actif est reconstruit, ce qui garde le défilement court et prévisible.\n  function render(){\n    root.innerHTML='';\n    var wrap = el('div','wrap');\n\n    var head = el('header','top');\n    var titleBox = el('div','title');\n    var h1 = el('h1'); h1.textContent='AI-MAP — '+DATA.project;\n    var detected = DATA.sources.filter(function(s){ return s.detected; });\n    var sub = el('div','sub');\n    sub.textContent = detected.length+' écosystème(s) · '+DATA.totals.entities+' entités · '\n      +DATA.totals.edges+' relations · '+new Date(DATA.generatedAt).toLocaleDateString();\n    titleBox.appendChild(h1); titleBox.appendChild(sub);\n    var themeBtn = el('button','btn','◐ Thème'); themeBtn.onclick=toggleTheme;\n    head.appendChild(titleBox); head.appendChild(themeBtn);\n    wrap.appendChild(head);\n\n    wrap.appendChild(buildTabs());\n\n    var main = el('div'); main.id='tab-content';\n    wrap.appendChild(main);\n\n    var foot = el('footer');\n    foot.textContent='Généré par AI-MAP · page autoportante, aucune connexion requise.';\n    wrap.appendChild(foot);\n\n    root.appendChild(wrap);\n    renderTab();\n  }\n\n  function buildTabs(){\n    var bar = el('nav','tabs');\n    TABS.forEach(function(t){\n      var b = el('button','tab'+(state.tab===t.key?' on':''));\n      b.appendChild(el('span','ticon',t.icon));\n      b.appendChild(document.createTextNode(t.label));\n      var n = tabCount(t.key);\n      if(n!=null) b.appendChild(el('span','tcount',String(n)));\n      b.onclick=function(){ if(state.tab!==t.key){ state.tab=t.key; render(); } };\n      bar.appendChild(b);\n    });\n    return bar;\n  }\n\n  function tabCount(key){\n    if(key==='entities') return DATA.totals.entities;\n    if(key==='graph') return DATA.totals.edges;\n    if(key==='overview') return DATA.totals.sources;\n    return null;\n  }\n\n  // Un seul point d'entrée pour peupler l'onglet courant. Le graphe est arrêté\n  // systématiquement : il installe des écouteurs globaux qu'il faut libérer.\n  function renderTab(){\n    if(graphApi){ graphApi.stop(); graphApi=null; }\n    var c = document.getElementById('tab-content');\n    if(!c) return;\n    c.innerHTML='';\n\n    if(state.detail && byId[state.detail]){ c.appendChild(buildDetailPage(byId[state.detail])); return; }\n\n    if(state.tab==='overview'){\n      // Deux colonnes en tête : le score en grand à gauche, ce qui cloche à\n      // droite. C'est la seule chose qu'on doit voir sans faire défiler.\n      var top = el('div','dash-top');\n      top.appendChild(buildScoreHero());\n      top.appendChild(buildAlertsSummary());\n      c.appendChild(top);\n      c.appendChild(buildKpis());\n      c.appendChild(buildKindTiles());\n      c.appendChild(buildSourcesPanel());\n      c.appendChild(buildHistogram());\n    } else if(state.tab==='governance'){\n      // Le détail du score, les alertes et les leviers sont réunis ici : c'est\n      // le poste de travail de la gouvernance, pas un encart du tableau de bord.\n      c.appendChild(buildScorePanel());\n      c.appendChild(buildRecoPanel());\n      var reco = el('div'); reco.id='reco-detail';\n      c.appendChild(reco);\n      c.appendChild(buildAlertsPanel());\n    } else if(state.tab==='impact'){\n      c.appendChild(buildImpactPanel());\n      var ch = buildChangesPanel();\n      if(ch) c.appendChild(ch);\n    } else if(state.tab==='graph'){\n      c.appendChild(buildGraphPanel());\n      initGraph();\n    } else if(state.tab==='timeline'){\n      c.appendChild(buildTimelinePanel());\n    } else if(state.tab==='entities'){\n      c.appendChild(buildToolbar());\n      var zone = el('div'); zone.id='cards-zone';\n      c.appendChild(zone);\n      renderCards();\n    } else if(state.tab==='tree'){\n      c.appendChild(buildTreesPanel());\n    }\n  }\n\n  // Bascule vers les entités avec un filtre pré-appliqué (clic sur un KPI, un\n  // écosystème ou une barre de l'histogramme).\n  function focusEntities(dim, value){\n    state.tab='entities';\n    state.kind='all'; state.source='all';\n    if(dim) state[dim]=value;\n    render();\n  }\n\n  function h2(t){ var h=el('h2'); h.textContent=t; return h; }\n\n  // ------------------------------------------------------- tableau de bord --\n  // Bandeau d'en-tête : libellé en petites capitales, chiffre en grand, et une\n  // précision discrète à côté. Quatre indicateurs maximum — au-delà, plus aucun\n  // ne ressort.\n  function buildKpis(){\n    var band = el('div','kpi-band');\n    function cell(label, value, note, color){\n      var c = el('div','kpi-cell');\n      c.appendChild(el('div','kc-label', label));\n      var v = el('div','kc-value');\n      var n = el('span','kc-n', String(value));\n      if(color) n.style.color=color;\n      v.appendChild(n);\n      if(note) v.appendChild(el('span','kc-note', note));\n      c.appendChild(v);\n      return c;\n    }\n    var mat = maturity();\n    var cross = (DATA.graph.edges||[]).filter(function(e){ return e.cross; }).length;\n    var alerts = governanceAlerts().length;\n\n    band.appendChild(cell('Types recensés', DATA.totals.kinds, 'catégories'));\n    band.appendChild(cell('Entités cartographiées', DATA.totals.entities,\n      DATA.totals.sources + ' écosystèmes'));\n    band.appendChild(cell('Liens transverses tracés', cross,\n      'sur ' + DATA.totals.edges));\n    band.appendChild(cell('Alertes de gouvernance', alerts,\n      alerts ? 'à traiter' : 'aucune', alerts ? '#f59e0b' : '#22c55e'));\n    return band;\n  }\n\n  // Tuiles « composants IA détectés » : une par type présent, teintée de sa\n  // couleur, avec l'écosystème d'où il vient. Se lit d'un coup d'œil, là où\n  // l'histogramme demande de suivre une barre.\n  function buildKindTiles(){\n    var wrap = el('div');\n    wrap.appendChild(el('div','sec-label','Composants IA détectés'));\n    var grid = el('div','tiles');\n    DATA.kinds.forEach(function(k){\n      var sources = {};\n      DATA.entities.forEach(function(e){ if(e.kind===k.key) sources[e.source]=1; });\n      var names = Object.keys(sources).map(function(id){ return srcOf(id).label; });\n\n      var t = el('div','tile');\n      t.style.borderColor = k.color+'55';\n      t.style.background = 'linear-gradient(0deg,'+k.color+'0f,'+k.color+'0f),var(--panel)';\n      var head = el('div','tile-head');\n      head.style.color = k.color;\n      head.textContent = k.icon+' '+k.label;\n      t.appendChild(head);\n      t.appendChild(el('div','tile-n', String(k.count)));\n      t.appendChild(el('div','tile-src', names.join(' · ')));\n      t.title = 'Voir les '+k.count+' '+k.label.toLowerCase();\n      t.onclick=function(){ focusEntities('kind', k.key); };\n      grid.appendChild(t);\n    });\n    wrap.appendChild(grid);\n    return wrap;\n  }\n\n  function buildSourcesPanel(){\n    var p = el('div','panel');\n    p.appendChild(h2('🌐 Écosystèmes IA'));\n    var hint = el('div','hint');\n    hint.textContent='Les écosystèmes grisés ne sont pas encore couverts par un adaptateur : leur absence ici ne signifie pas qu\\'ils sont absents du projet.';\n    p.appendChild(hint);\n    var grid = el('div','srcs');\n    DATA.sources.forEach(function(s){\n      var d = el('div','src'+(s.detected?'':' off'));\n      d.style.borderLeftColor = s.color;\n      var n = el('div','sname');\n      var dot=el('span','dot'); dot.style.background=s.color;\n      n.appendChild(dot); n.appendChild(document.createTextNode(s.icon+' '+s.label));\n      d.appendChild(n);\n      var c = el('div','scount');\n      c.textContent = s.detected ? (s.count+' entité(s)')\n                                 : (s.status==='planned' ? 'adaptateur prévu' : 'non détecté');\n      d.appendChild(c);\n      if(s.detected && s.roots && s.roots.length){\n        d.appendChild(el('div','sroot', s.roots.join(' · ')));\n      }\n      if(s.detected){\n        d.style.cursor='pointer';\n        d.title='Voir les '+s.count+' entités de '+s.label;\n        d.onclick=function(){ focusEntities('source', s.id); };\n      }\n      grid.appendChild(d);\n    });\n    p.appendChild(grid);\n    return p;\n  }\n\n  function buildHistogram(){\n    var p = el('div','panel');\n    p.appendChild(h2('📊 Répartition par type d\\'entité'));\n    var bars = el('div','bars');\n    var max = 1;\n    DATA.kinds.forEach(function(k){ if(k.count>max) max=k.count; });\n    DATA.kinds.forEach(function(k){\n      var row=el('div','bar-row');\n      var name=el('div','name');\n      var dot=el('span','dot'); dot.style.background=k.color;\n      name.appendChild(dot); name.appendChild(document.createTextNode(k.icon+' '+k.label));\n      var track=el('div','bar-track');\n      var fill=el('div','bar-fill');\n      fill.style.width=(k.count/max*100)+'%'; fill.style.background=k.color;\n      track.appendChild(fill);\n      row.appendChild(name); row.appendChild(track); row.appendChild(el('div','bar-val',String(k.count)));\n      row.title='Voir les '+k.count+' '+k.label.toLowerCase();\n      row.onclick=function(){ focusEntities('kind', k.key); };\n      bars.appendChild(row);\n    });\n    p.appendChild(bars);\n    return p;\n  }\n\n  // ----------------------------------------------------------------- timeline --\n  // Chronologie fondée sur la date de modification des fichiers porteurs.\n  // C'est la seule source disponible sans Git (adaptateur prévu en V2) : elle\n  // répond à « qu'est-ce qui a bougé récemment dans notre config IA ? ».\n  function buildTimelinePanel(){\n    var p = el('div','panel');\n    p.appendChild(h2('🕰️ Timeline'));\n\n    var dated = DATA.entities.filter(function(e){ return e.mtime; })\n      .slice().sort(function(a,b){ return a.mtime < b.mtime ? 1 : -1; });\n    if(!dated.length){\n      p.appendChild(el('div','empty','Aucune date de modification disponible.'));\n      return p;\n    }\n\n    var hint = el('div','hint');\n    hint.textContent='Dernière modification des fichiers. Utile pour repérer la config qui dort : une skill non touchée depuis des mois pendant que le code bouge est une dette documentaire.';\n    p.appendChild(hint);\n\n    p.appendChild(buildActivityBars(dated));\n    p.appendChild(buildRecentList(dated));\n    return p;\n  }\n\n  // Histogramme d'activité sur les 12 derniers mois.\n  function buildActivityBars(dated){\n    var now = new Date();\n    var months = [];\n    for(var i=11;i>=0;i--){\n      var d = new Date(now.getFullYear(), now.getMonth()-i, 1);\n      months.push({ key:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),\n                    label:d.toLocaleDateString(undefined,{month:'short'}),\n                    year:d.getFullYear(), n:0 });\n    }\n    var idx={}; months.forEach(function(m){ idx[m.key]=m; });\n    var older=0;\n    dated.forEach(function(e){\n      var k=e.mtime.slice(0,7);\n      if(idx[k]) idx[k].n++; else older++;\n    });\n\n    var max=1; months.forEach(function(m){ if(m.n>max) max=m.n; });\n    var box = el('div','tl-bars');\n    months.forEach(function(m){\n      var col = el('div','tl-col');\n      var bar = el('div','tl-bar');\n      bar.style.height = Math.max(2, m.n/max*100)+'%';\n      if(!m.n) bar.classList.add('zero');\n      bar.title = m.n+' élément(s) modifié(s) en '+m.label+' '+m.year;\n      var cap = el('div','tl-cap', m.label);\n      var val = el('div','tl-n', m.n ? String(m.n) : '');\n      col.appendChild(val); col.appendChild(bar); col.appendChild(cap);\n      box.appendChild(col);\n    });\n\n    var wrapBox = el('div');\n    wrapBox.appendChild(box);\n    if(older){\n      var note = el('div','hint');\n      note.style.margin='6px 0 0';\n      note.textContent = older+' élément(s) non modifié(s) depuis plus de 12 mois.';\n      wrapBox.appendChild(note);\n    }\n    return wrapBox;\n  }\n\n  // Liste groupée par ancienneté, la plus récente d'abord.\n  function buildRecentList(dated){\n    var now = Date.now(), DAY = 86400000;\n    var buckets = [\n      { label:\"Aujourd'hui\",      max:1,        items:[] },\n      { label:'7 derniers jours', max:7,        items:[] },\n      { label:'30 derniers jours',max:30,       items:[] },\n      { label:'Plus ancien',      max:Infinity, items:[] },\n    ];\n    dated.forEach(function(e){\n      var age = (now - Date.parse(e.mtime)) / DAY;\n      for(var i=0;i<buckets.length;i++){\n        if(age < buckets[i].max){ buckets[i].items.push(e); return; }\n      }\n    });\n\n    var box = el('div','tl-list');\n    buckets.forEach(function(b){\n      if(!b.items.length) return;\n      var head = el('div','tl-head');\n      head.appendChild(document.createTextNode(b.label));\n      var cnt = el('span','tl-count', String(b.items.length));\n      head.appendChild(cnt);\n      box.appendChild(head);\n\n      b.items.slice(0,12).forEach(function(e){\n        var k = kindOf(e.kind), s = srcOf(e.source);\n        var row = el('div','tl-row');\n        var dot = el('span','dot'); dot.style.background=k.color;\n        row.appendChild(dot);\n        var nm = el('span','tl-name', e.name);\n        row.appendChild(nm);\n        var sp = el('span','srcpill', s.icon); sp.style.background=s.color; sp.title=s.label;\n        row.appendChild(sp);\n        (e.badges||[]).forEach(function(bd){\n          row.appendChild(el('span','badge '+(bd.tone||'muted'), bd.text));\n        });\n        var when = el('span','tl-when', new Date(e.mtime).toLocaleDateString());\n        row.appendChild(when);\n        row.onclick=function(){ openDetail(e); };\n        box.appendChild(row);\n      });\n      if(b.items.length>12){\n        box.appendChild(el('div','tl-more','+ '+(b.items.length-12)+' autre(s)'));\n      }\n    });\n    return box;\n  }\n\n  // ------------------------------------------------------ score de maturité --\n  // Score volontairement TRANSPARENT : ses quatre composantes sont affichées\n  // avec leur définition. Un score opaque serait invérifiable, donc inutile\n  // pour arbitrer quoi que ce soit.\n  function maturity(){\n    var ents = DATA.entities;\n    var edges = DATA.graph.edges || [];\n    if(!ents.length) return null;\n\n    var degree = {};\n    edges.forEach(function(e){ degree[e.s]=1; degree[e.t]=1; });\n    var linked = ents.filter(function(e){ return degree[e.id]; }).length / ents.length;\n\n    var actors = ents.filter(function(e){ return ACTOR_KINDS[e.kind]; });\n    var withCode = {};\n    edges.forEach(function(e){ if(e.type==='code') withCode[e.s]=1; });\n    var traced = actors.length\n      ? actors.filter(function(e){ return withCode[e.id]; }).length / actors.length : null;\n\n    var dated = ents.filter(function(e){ return e.mtime; });\n    var limit = Date.now() - 90*86400000;\n    var fresh = dated.length\n      ? dated.filter(function(e){ return Date.parse(e.mtime) >= limit; }).length / dated.length : null;\n\n    var alerted = ents.filter(function(e){\n      return (e.badges||[]).some(function(b){ return b.tone==='warn'||b.tone==='danger'; });\n    }).length;\n    var clean = 1 - alerted/ents.length;\n\n    var parts = [\n      { key:'linked', label:'Connexion',    value:linked,\n        desc:'part des entités reliées à au moins une autre — le reste est isolé' },\n      { key:'traced', label:'Traçabilité',  value:traced,\n        desc:'part des skills, commandes et agents qui pointent vers du code réel' },\n      { key:'fresh',  label:'Fraîcheur',    value:fresh,\n        desc:'part des entités modifiées depuis moins de 90 jours' },\n      { key:'clean',  label:'Hygiène',      value:clean,\n        desc:'part des entités sans alerte de gouvernance' },\n    ].filter(function(p){ return p.value !== null; });\n\n    var score = Math.round(parts.reduce(function(s,p){ return s+p.value; },0) / parts.length * 100);\n    // Les compteurs bruts sont conservés : c'est ce qui permet de chiffrer\n    // honnêtement le gain d'une action, au lieu de l'estimer au doigt mouillé.\n    return {\n      score: score, parts: parts,\n      raw: {\n        total: ents.length,\n        isolated: ents.filter(function(e){ return !degree[e.id]; }),\n        actors: actors,\n        untraced: actors.filter(function(e){ return !withCode[e.id]; }),\n        dated: dated.length,\n        stale: dated.filter(function(e){ return Date.parse(e.mtime) < limit; }),\n        alerted: ents.filter(function(e){ return e.tone==='warn'||e.tone==='danger'; }),\n      },\n    };\n  }\n\n  // Combien de points le score gagnerait si `n` entités passaient du mauvais\n  // côté d'une composante au bon. Une composante vaut 1/N du score total.\n  function pointsFor(m, componentKey, n, universe){\n    if(!universe || !n) return 0;\n    var present = m.parts.some(function(p){ return p.key===componentKey; });\n    if(!present) return 0;\n    return Math.round((n/universe) / m.parts.length * 100);\n  }\n\n  // Recommandations : chacune dit CE QU'IL FAUT FAIRE et CE QUE ÇA RAPPORTE.\n  // Un score sans levier n'est qu'un constat.\n  function recommendations(){\n    var m = maturity();\n    if(!m) return [];\n    var r = m.raw;\n    var out = [];\n\n    if(r.untraced.length){\n      out.push({\n        label: 'Relier ' + r.untraced.length + ' skill(s), commande(s) ou agent(s) à des fichiers de code réels',\n        why: 'Ils ne citent aucun chemin existant : impossible de savoir ce qu\\'ils touchent.',\n        component: 'Traçabilité',\n        points: pointsFor(m, 'traced', r.untraced.length, r.actors.length),\n        items: r.untraced,\n      });\n    }\n\n    // Un change terminé mais non archivé est le cas le plus fréquent, et le\n    // plus simple à corriger : il porte déjà son badge « à archiver ».\n    var toArchive = r.alerted.filter(function(e){\n      return (e.badges||[]).some(function(b){ return /archiver/i.test(b.text); });\n    });\n    if(toArchive.length){\n      out.push({\n        label: 'Archiver ' + toArchive.length + ' change(s) terminé(s)',\n        why: 'Toutes leurs tâches sont faites : ils encombrent la liste des changes en cours.',\n        component: 'Hygiène',\n        points: pointsFor(m, 'clean', toArchive.length, r.total),\n        items: toArchive,\n      });\n    }\n\n    var otherAlerts = r.alerted.filter(function(e){ return toArchive.indexOf(e) === -1; });\n    if(otherAlerts.length){\n      out.push({\n        label: 'Traiter ' + otherAlerts.length + ' alerte(s) restante(s)',\n        why: 'Doublons de déclaration, formats hérités ou configurations illisibles.',\n        component: 'Hygiène',\n        points: pointsFor(m, 'clean', otherAlerts.length, r.total),\n        items: otherAlerts,\n      });\n    }\n\n    if(r.isolated.length){\n      out.push({\n        label: 'Référencer ou supprimer ' + r.isolated.length + ' entité(s) isolée(s)',\n        why: 'Rien ne les cite et elles ne touchent aucun code : ce sont des candidates à la suppression.',\n        component: 'Connexion',\n        points: pointsFor(m, 'linked', r.isolated.length, r.total),\n        items: r.isolated,\n      });\n    }\n\n    if(r.stale.length){\n      out.push({\n        label: 'Revoir ' + r.stale.length + ' entité(s) non modifiée(s) depuis 90 jours',\n        why: 'La config dort pendant que le code avance — c\\'est la définition de la dette documentaire.',\n        component: 'Fraîcheur',\n        points: pointsFor(m, 'fresh', r.stale.length, r.dated),\n        items: r.stale,\n      });\n    }\n\n    // Sous 1 point, la recommandation coûte plus d'attention qu'elle n'en vaut.\n    return out.filter(function(x){ return x.points >= 1; })\n              .sort(function(a,b){ return b.points - a.points; });\n  }\n\n  // Score en grand, avec ses composantes sous forme de barres. C'est le chiffre\n  // qu'on retient ; il doit être lisible de loin.\n  function buildScoreHero(){\n    var m = maturity();\n    var p = el('div','panel score-hero');\n    p.appendChild(el('div','sh-label','AI Maturity Score'));\n    if(!m){ p.appendChild(el('div','empty','Pas assez de données.')); return p; }\n\n    var big = el('div','sh-big');\n    var n = el('span','sh-n', String(m.score));\n    n.style.color = scoreColor(m.score);\n    big.appendChild(n);\n    big.appendChild(el('span','sh-max','/100'));\n    p.appendChild(big);\n\n    var parts = el('div','sh-parts');\n    m.parts.forEach(function(part){\n      var row = el('div','sh-part');\n      var top = el('div','sp-top');\n      top.appendChild(el('span','sp-label', part.label));\n      var pct = el('span','sp-pct', Math.round(part.value*100)+'%');\n      pct.style.color = scoreColor(part.value*100);\n      top.appendChild(pct);\n      row.appendChild(top);\n      var track = el('div','sp-track');\n      var fill = el('div','sp-fill');\n      fill.style.width=(part.value*100)+'%';\n      fill.style.background=scoreColor(part.value*100);\n      track.appendChild(fill);\n      row.appendChild(track);\n      row.appendChild(el('div','sp-desc', part.desc));\n      parts.appendChild(row);\n    });\n    p.appendChild(parts);\n    return p;\n  }\n\n  function buildScorePanel(){\n    var m = maturity();\n    var p = el('div','panel');\n    p.appendChild(h2('🎓 Détail du score'));\n    if(!m){ p.appendChild(el('div','empty','Pas assez de données.')); return p; }\n    var hint = el('div','hint');\n    hint.textContent='Moyenne des quatre composantes ci-dessous. Chacune est affichée avec sa définition : un score dont on ne peut pas vérifier le calcul ne permet d\\'arbitrer aucune décision.';\n    p.appendChild(hint);\n\n    var box = el('div','score-box');\n    var list = el('div','score-parts');\n    m.parts.forEach(function(part){\n      var row = el('div','score-part');\n      var top = el('div','sp-top');\n      top.appendChild(el('span','sp-label', part.label));\n      top.appendChild(el('span','sp-pct', Math.round(part.value*100)+'%'));\n      row.appendChild(top);\n      var track = el('div','sp-track');\n      var fill = el('div','sp-fill');\n      fill.style.width=(part.value*100)+'%';\n      fill.style.background=scoreColor(part.value*100);\n      track.appendChild(fill);\n      row.appendChild(track);\n      row.appendChild(el('div','sp-desc', part.desc));\n      list.appendChild(row);\n    });\n    box.appendChild(list);\n    p.appendChild(box);\n    return p;\n  }\n\n  function scoreColor(pct){\n    if(pct >= 75) return '#22c55e';\n    if(pct >= 50) return '#f59e0b';\n    return '#f43f5e';\n  }\n\n  function buildRecoPanel(){\n    var recos = recommendations();\n    var p = el('div','panel');\n    p.appendChild(h2('📈 Ce qui ferait monter le score'));\n    if(!recos.length){\n      p.appendChild(el('div','ok-note','✔ Rien à corriger : aucune action ne rapporterait un point entier.'));\n      return p;\n    }\n    var hint = el('div','hint');\n    hint.textContent='Gains calculés sur les composantes réelles du score : chaque composante pèse 1/'+\n      (maturity().parts.length)+' du total. Cliquez une ligne pour voir les entités concernées.';\n    p.appendChild(hint);\n\n    var list = el('div','recos');\n    recos.forEach(function(r){\n      var row = el('div','reco');\n      row.appendChild(el('span','reco-arrow','→'));\n      var body = el('div','reco-body');\n      body.appendChild(el('div','reco-label', r.label));\n      body.appendChild(el('div','reco-why', r.why));\n      row.appendChild(body);\n      var gain = el('span','reco-gain','+'+r.points+' pt'+(r.points>1?'s':'')+' '+r.component);\n      row.appendChild(gain);\n      row.onclick=function(){ openReco(r); };\n      list.appendChild(row);\n    });\n    p.appendChild(list);\n    return p;\n  }\n\n  // Le détail d'une recommandation liste les entités visées : sans elles,\n  // « relier 12 skills » ne dit pas lesquelles.\n  function openReco(r){\n    var zone = document.getElementById('reco-detail');\n    if(!zone) return;\n    zone.innerHTML='';\n    var p = el('div','panel');\n    p.appendChild(h2('🎯 ' + r.label));\n    var hint = el('div','hint'); hint.textContent = r.why;\n    p.appendChild(hint);\n    var list = el('div','alerts');\n    r.items.slice(0,40).forEach(function(e){\n      var k = kindOf(e.kind), s = srcOf(e.source);\n      var row = el('div','alert info');\n      row.appendChild(el('span','a-tone','○'));\n      var b = el('div','a-body');\n      var t = el('div','a-title');\n      t.appendChild(document.createTextNode(e.name));\n      var sp = el('span','srcpill', s.icon+' '+s.label); sp.style.background=s.color;\n      t.appendChild(sp);\n      b.appendChild(t);\n      b.appendChild(el('div','a-msg', k.one + (e.path ? ' — ' + e.path : '')));\n      row.appendChild(b);\n      row.onclick=function(){ openDetail(e); };\n      list.appendChild(row);\n    });\n    if(r.items.length>40) list.appendChild(el('div','tl-more','+ '+(r.items.length-40)+' autre(s)'));\n    p.appendChild(list);\n    zone.appendChild(p);\n    p.scrollIntoView({behavior:'smooth', block:'nearest'});\n  }\n\n  // ------------------------------------------------- alertes de gouvernance --\n  function governanceAlerts(){\n    var out = [];\n    DATA.entities.forEach(function(e){\n      (e.badges||[]).forEach(function(b){\n        if(b.tone==='warn'||b.tone==='danger') out.push({ entity:e, badge:b });\n      });\n    });\n    // Les entités reliées à rien sont l'autre grand signal de dette : une skill\n    // que personne ne référence et qui ne touche aucun code ne sert plus.\n    var degree = {};\n    (DATA.graph.edges||[]).forEach(function(e){ degree[e.s]=1; degree[e.t]=1; });\n    DATA.entities.forEach(function(e){\n      if(degree[e.id]) return;\n      if(e.kind==='config') return; // un fichier de réglages n'a pas à être cité\n      out.push({ entity:e, badge:{ text:'jamais référencé, ne touche aucun code', tone:'info' } });\n    });\n    return out;\n  }\n\n  var ALERT_ORDER = { danger:0, warn:1, info:2 };\n  function sortedAlerts(){\n    return governanceAlerts().sort(function(a,b){\n      return (ALERT_ORDER[a.badge.tone]||9)-(ALERT_ORDER[b.badge.tone]||9);\n    });\n  }\n\n  // Explication de l'alerte : le badge dit CE QUE c'est, ceci dit POURQUOI.\n  function alertWhy(a){\n    var t = a.badge.text;\n    if(/archiver/i.test(t)) return 'Toutes les tâches sont complètes — ce change devrait être archivé.';\n    if(/jamais référencé/i.test(t)) return 'Rien ne le cite et il ne touche aucun code : candidat à la suppression.';\n    if(/aussi déclaré/i.test(t)) return 'Le même serveur est déclaré ailleurs : les deux copies vont diverger.';\n    if(/hérité/i.test(t)) return 'Ce format est remplacé par le format moderne, présent dans le même projet.';\n    if(/illisible|invalide|non reconnu/i.test(t)) return 'Le fichier existe mais n\\'a pas pu être analysé.';\n    return a.badge.text;\n  }\n\n  // Fiche d'alerte : icône, nom, badges, motif coloré, explication, chemin,\n  // actions à droite. Compacte, elle sert de résumé sur la vue d'ensemble.\n  function alertCard(a, compact){\n    var k = kindOf(a.entity.kind), s = srcOf(a.entity.source);\n    var card = el('div','acard '+a.badge.tone+(compact?' compact':''));\n\n    var icon = el('span','ac-icon', a.badge.tone==='danger'?'⛔':(a.badge.tone==='warn'?'⚠':'ⓘ'));\n    card.appendChild(icon);\n\n    var body = el('div','ac-body');\n    var head = el('div','ac-head');\n    head.appendChild(el('span','ac-name', a.entity.name));\n    var kb = el('span','ac-badge'); kb.textContent=k.one;\n    kb.style.background=k.color+'22'; kb.style.color=k.color; kb.style.borderColor=k.color+'55';\n    head.appendChild(kb);\n    var sb = el('span','ac-badge'); sb.textContent=s.label;\n    sb.style.background=s.color+'22'; sb.style.color=s.color; sb.style.borderColor=s.color+'55';\n    head.appendChild(sb);\n    body.appendChild(head);\n\n    body.appendChild(el('div','ac-reason', a.badge.text));\n    if(!compact){\n      body.appendChild(el('div','ac-why', alertWhy(a)));\n      if(a.entity.path) body.appendChild(el('div','ac-path', a.entity.path));\n    }\n    card.appendChild(body);\n\n    if(!compact){\n      var acts = el('div','ac-acts');\n      var open = el('button','btn ac-btn','Voir la fiche');\n      open.onclick=function(ev){ ev.stopPropagation(); openDetail(a.entity); };\n      acts.appendChild(open);\n      if(a.entity.path){\n        // Le rapport est une page hors ligne : il ne peut pas archiver ni\n        // modifier quoi que ce soit. Copier le chemin est l'action honnête.\n        var cp = el('button','btn ac-btn ghost','Copier le chemin');\n        cp.onclick=function(ev){\n          ev.stopPropagation(); copyText(a.entity.path);\n          cp.textContent='Copié'; setTimeout(function(){ cp.textContent='Copier le chemin'; },1600);\n        };\n        acts.appendChild(cp);\n      }\n      card.appendChild(acts);\n    }\n\n    card.onclick=function(){ openDetail(a.entity); };\n    return card;\n  }\n\n  // Résumé pour la vue d'ensemble : les trois plus graves, puis un renvoi.\n  function buildAlertsSummary(){\n    var alerts = sortedAlerts();\n    var p = el('div','panel alerts-panel');\n    var head = el('div','ap-head');\n    head.appendChild(el('span','ap-title','Alertes de gouvernance'));\n    if(alerts.length) head.appendChild(el('span','ap-count', String(alerts.length)));\n    p.appendChild(head);\n\n    if(!alerts.length){\n      p.appendChild(el('div','ok-note','✔ Aucune alerte : rien d\\'orphelin, de dupliqué ni d\\'illisible.'));\n      return p;\n    }\n    var list = el('div','acards');\n    alerts.slice(0,3).forEach(function(a){ list.appendChild(alertCard(a, true)); });\n    p.appendChild(list);\n\n    var more = el('button','btn ap-more', alerts.length>3\n      ? 'Voir les ' + alerts.length + ' alertes  ›' : 'Ouvrir la gouvernance  ›');\n    more.onclick=function(){ state.tab='governance'; render(); };\n    p.appendChild(more);\n    return p;\n  }\n\n  // Vue complète, dans l'onglet Gouvernance.\n  function buildAlertsPanel(){\n    var alerts = sortedAlerts();\n    var p = el('div','panel');\n    var head = el('div','ap-head');\n    head.appendChild(el('span','ap-title','Alertes actives'));\n    if(alerts.length) head.appendChild(el('span','ap-count', String(alerts.length)));\n    p.appendChild(head);\n\n    if(!alerts.length){\n      p.appendChild(el('div','ok-note','✔ Aucune alerte : rien d\\'orphelin, de dupliqué ni d\\'illisible.'));\n      return p;\n    }\n    var list = el('div','acards');\n    alerts.slice(0,30).forEach(function(a){ list.appendChild(alertCard(a, false)); });\n    if(alerts.length>30) list.appendChild(el('div','tl-more','+ '+(alerts.length-30)+' autre(s)'));\n    p.appendChild(list);\n    return p;\n  }\n\n  // ------------------------------------------------------------ fil d'impact --\n  // Reconstruit les chaînes « ce qui prescrit → ce qui agit → ce que ça atteint »\n  // et les rend lisibles LIGNE PAR LIGNE. Le graphe montre la même information,\n  // mais on ne peut pas la lire : ici on la lit.\n  function impactChains(){\n    var nodeById = {};\n    (DATA.graph.nodes||[]).forEach(function(n){ nodeById[n.id]=n; });\n    var edges = DATA.graph.edges||[];\n\n    var chains = [];\n    DATA.entities.filter(function(e){ return ACTOR_KINDS[e.kind]; }).forEach(function(actor){\n      var origins = [], targets = [];\n      var seenTarget = {};\n      edges.forEach(function(ed){\n        if(ed.t===actor.id){\n          var o = byId[ed.s];\n          if(o && ORIGIN_KINDS[o.kind] !== undefined) origins.push(o);\n        }\n        if(ed.s===actor.id){\n          var n = nodeById[ed.t];\n          if(!n || TARGET_KINDS[n.kind] === undefined) return;\n          // Le même serveur déclaré dans deux écosystèmes ne doit apparaître\n          // qu'une fois dans le fil : le doublon est signalé ailleurs.\n          var key = n.kind + '|' + String(n.label).toLowerCase();\n          if(seenTarget[key]) return;\n          seenTarget[key] = 1;\n          targets.push(n);\n        }\n      });\n      if(!origins.length && !targets.length) return;\n\n      origins.sort(function(a,b){ return ORIGIN_KINDS[a.kind]-ORIGIN_KINDS[b.kind]; });\n      targets.sort(function(a,b){ return TARGET_KINDS[a.kind]-TARGET_KINDS[b.kind]; });\n\n      // Dès qu'il existe une cible parlante (serveur MCP, fichier de code), on\n      // écarte les outils génériques : « Bash, Read, Write » diluent le fil sans\n      // rien apprendre.\n      var meaningful = targets.filter(function(t){ return TARGET_KINDS[t.kind] < GENERIC_TARGET_RANK; });\n      if(meaningful.length) targets = meaningful;\n\n      var cross = origins.some(function(o){ return o.source!==actor.source; });\n      chains.push({ origins:origins, actor:actor, targets:targets, cross:cross });\n    });\n\n    chains.sort(function(a,b){\n      if(a.cross!==b.cross) return a.cross?-1:1;\n      return (b.origins.length+b.targets.length)-(a.origins.length+a.targets.length);\n    });\n    return chains;\n  }\n\n  function pickChip(id, label, count, active){\n    var c = el('div','ichip'+(active?' on':''));\n    c.appendChild(document.createTextNode(label));\n    c.appendChild(el('span','chipn', String(count)));\n    c.onclick=function(){ state.impact = (id==='all') ? null : id; renderTab(); };\n    return c;\n  }\n\n  function buildImpactPanel(){\n    var all = impactChains();\n    var p = el('div','panel');\n    p.appendChild(h2('🎯 Fil d\\'impact'));\n    var hint = el('div','hint');\n    hint.textContent='Chaque ligne se lit « ce qui prescrit → ce qui agit → ce que ça atteint ». Les fils marqués « transverse » franchissent une frontière d\\'outil : ce sont eux que personne ne voit sans AI-MAP.';\n    p.appendChild(hint);\n\n    if(!all.length){\n      p.appendChild(el('div','empty','Aucun fil : aucune skill, commande ou agent n\\'est relié à une prescription ni à une cible.'));\n      return p;\n    }\n\n    // Sélecteur d'origine : afficher TOUS les fils à la fois est un déversoir.\n    // On demande d'abord « lequel ? », puis on répond.\n    var origins = [];\n    var seenOrigin = {};\n    all.forEach(function(c){\n      c.origins.forEach(function(o){\n        if(seenOrigin[o.id]) return;\n        seenOrigin[o.id] = 1;\n        origins.push(o);\n      });\n    });\n    origins.sort(function(a,b){\n      return ORIGIN_KINDS[a.kind]-ORIGIN_KINDS[b.kind] || a.name.localeCompare(b.name);\n    });\n\n    var chains = all;\n    if(origins.length > 1){\n      var sel = el('div','isel');\n      sel.appendChild(pickChip('all', 'Tous les fils', all.length, state.impact===null));\n      origins.forEach(function(o){\n        var n = all.filter(function(c){ return c.origins.indexOf(o) !== -1; }).length;\n        sel.appendChild(pickChip(o.id, o.name, n, state.impact===o.id));\n      });\n      p.appendChild(sel);\n      if(state.impact){\n        chains = all.filter(function(c){\n          return c.origins.some(function(o){ return o.id === state.impact; });\n        });\n      }\n    }\n\n    var box = el('div','chains');\n    chains.forEach(function(c){\n      var row = el('div','chain'+(c.cross?' cross':''));\n      if(c.cross) row.appendChild(el('span','chain-flag','transverse'));\n\n      var line = el('div','chain-line');\n      var first = true;\n      function push(node){\n        if(!first) line.appendChild(el('span','chain-arrow','›'));\n        first = false;\n        line.appendChild(chainCard(node));\n      }\n      if(c.origins.length){\n        push(c.origins[0]);\n        if(c.origins.length>1){\n          var more = el('span','chain-more','+'+(c.origins.length-1)+' autre(s)');\n          more.title = c.origins.slice(1).map(function(o){ return o.name; }).join('\\n');\n          line.appendChild(more);\n        }\n      }\n      push(c.actor);\n      c.targets.slice(0,3).forEach(push);\n      if(c.targets.length>3){\n        var m2 = el('span','chain-more','+'+(c.targets.length-3)+' autre(s)');\n        m2.title = c.targets.slice(3).map(function(t){ return t.label||t.name; }).join('\\n');\n        line.appendChild(m2);\n      }\n      row.appendChild(line);\n      box.appendChild(row);\n    });\n    p.appendChild(box);\n    return p;\n  }\n\n  // Un maillon du fil : rôle en capitales, nom en gras, chemin en monospace.\n  // Les nœuds dérivés (outil, code) n'ont pas de fiche : ils restent affichés\n  // mais non cliquables, plutôt que de simuler un lien mort.\n  function chainCard(n){\n    var k = kindOf(n.kind);\n    var entity = byId[n.id];\n    var card = el('div','ccard');\n    card.style.borderTopColor = k.color;\n\n    // Le rôle précise l'écosystème quand il y en a plusieurs : « SKILL » seul\n    // ne dit pas d'où vient la skill dans un projet multi-outils.\n    var role = k.one.toUpperCase();\n    if(entity && DATA.totals.sources > 1) role += ' · ' + srcOf(entity.source).label;\n    var r = el('div','cc-role', role);\n    r.style.color = k.color;\n    card.appendChild(r);\n\n    card.appendChild(el('div','cc-name', n.name || n.label));\n    var sub = (entity && entity.path) || n.path || '';\n    if(sub) card.appendChild(el('div','cc-path', sub));\n\n    if(entity){\n      card.classList.add('clickable');\n      card.onclick=function(){ openDetail(entity); };\n    }\n    return card;\n  }\n\n  // ------------------------------------------------------------- changes ----\n  function buildChangesPanel(){\n    var changes = DATA.entities.filter(function(e){ return e.kind==='change'; });\n    if(!changes.length) return null;\n    var p = el('div','panel');\n    p.appendChild(h2('🔀 Changes ('+changes.length+')'));\n    var list = el('div','changes');\n    changes.forEach(function(c){\n      var row = el('div','change-row');\n      var head = el('div','ch-head');\n      head.appendChild(el('span','ch-name', c.name));\n      (c.badges||[]).forEach(function(b){\n        head.appendChild(el('span','badge '+(b.tone||'muted'), b.text));\n      });\n      row.appendChild(head);\n      row.appendChild(el('div','ch-desc', c.description));\n\n      // Avancement lu depuis la méta « avancement » (« 2/8 tâches »).\n      var adv = (c.meta||[]).find(function(x){ return x.k==='avancement'; });\n      if(adv){\n        var mm = String(adv.v).match(/(\\d+)\\s*\\/\\s*(\\d+)/);\n        if(mm){\n          var pct = Number(mm[2]) ? Number(mm[1])/Number(mm[2]) : 0;\n          var track = el('div','ch-track');\n          var fill = el('div','ch-fill');\n          fill.style.width=(pct*100)+'%';\n          fill.style.background=scoreColor(pct*100);\n          track.appendChild(fill);\n          row.appendChild(track);\n          row.appendChild(el('div','ch-adv', adv.v));\n        }\n      }\n      row.onclick=function(){ openDetail(c); };\n      list.appendChild(row);\n    });\n    p.appendChild(list);\n    return p;\n  }\n\n  // ------------------------------------------------------------ barre d'outils --\n  function buildToolbar(){\n    var tb = el('div','toolbar');\n\n    var r0 = el('div','trow');\n    var search = el('div','search');\n    search.appendChild(document.createTextNode('🔎'));\n    var input = el('input'); input.type='search';\n    input.placeholder='Rechercher une entité, un chemin, une description…'; input.value=state.q;\n    input.oninput=function(){ state.q=input.value.toLowerCase(); renderCards(); };\n    search.appendChild(input);\n    r0.appendChild(search);\n    tb.appendChild(r0);\n\n    // Un filtre qui ne ramènerait rien est masqué. C'est ce qui encombrait le\n    // plus la barre : filtrer sur Claude affichait « Exigences (0) »,\n    // « Changes (0) », « Tâches (0) »… soit six chips inutilisables.\n    var r1 = el('div','trow');\n    r1.appendChild(el('span','tlabel','Type'));\n    r1.appendChild(chip('kind','all','Tous', '#6366f1', totalFor('source', state.source)));\n    DATA.kinds.forEach(function(k){\n      var n = countBy('kind', k.key);\n      if(!n && state.kind!==k.key) return;\n      r1.appendChild(chip('kind',k.key,k.icon+' '+k.label,k.color,n));\n    });\n    tb.appendChild(r1);\n\n    var detected = DATA.sources.filter(function(s){ return s.detected; });\n    // Un seul écosystème : la ligne de filtre n'offre aucun choix, on la retire.\n    if(detected.length > 1){\n      var r2 = el('div','trow');\n      r2.appendChild(el('span','tlabel','Écosystème'));\n      r2.appendChild(chip('source','all','Tous','#14b8a6', totalFor('kind', state.kind)));\n      detected.forEach(function(s){\n        var n = countBy('source', s.id);\n        if(!n && state.source!==s.id) return;\n        r2.appendChild(chip('source',s.id,s.icon+' '+s.label,s.color,n));\n      });\n      tb.appendChild(r2);\n    }\n\n    if(state.kind!=='all' || state.source!=='all' || state.q){\n      var r3 = el('div','trow');\n      var reset = el('button','btn','✕ Réinitialiser les filtres');\n      reset.onclick=function(){ state.kind='all'; state.source='all'; state.q=''; renderTab(); };\n      r3.appendChild(reset);\n      tb.appendChild(r3);\n    }\n    return tb;\n  }\n\n  // Total affiché sur le chip « Tous » d'une dimension, en tenant compte de\n  // l'autre dimension déjà filtrée.\n  function totalFor(otherDim, otherVal){\n    if(otherVal==='all') return DATA.totals.entities;\n    return DATA.entities.filter(function(e){\n      return otherDim==='source' ? e.source===otherVal : e.kind===otherVal;\n    }).length;\n  }\n\n  // Compte en tenant compte de l'AUTRE dimension : les compteurs reflètent ce\n  // qu'on obtiendrait vraiment en cliquant, pas un total global trompeur.\n  function countBy(dim, val){\n    return DATA.entities.filter(function(e){\n      if(dim==='kind') return e.kind===val && (state.source==='all'||e.source===state.source);\n      return e.source===val && (state.kind==='all'||e.kind===state.kind);\n    }).length;\n  }\n\n  function chip(dim,key,label,color,count){\n    var active = state[dim]===key;\n    var c = el('div','chip'+(active?' active':''));\n    if(active) c.style.background=color;\n    c.appendChild(document.createTextNode(label));\n    c.appendChild(el('span','chipn',String(count)));\n    c.onclick=function(){ state[dim]=key; renderTab(); };\n    return c;\n  }\n\n  // ------------------------------------------------------------------ fiches --\n  function visibleEntities(){\n    return DATA.entities.filter(function(e){\n      if(state.kind!=='all' && e.kind!==state.kind) return false;\n      if(state.source!=='all' && e.source!==state.source) return false;\n      if(!state.q) return true;\n      var hay=(e.name+' '+e.description+' '+(e.path||'')+' '+e.kind+' '+e.source).toLowerCase();\n      return hay.indexOf(state.q)!==-1;\n    });\n  }\n\n  function renderCards(){\n    var zone = document.getElementById('cards-zone');\n    if(!zone) return;\n    zone.innerHTML='';\n    var items = visibleEntities();\n    if(!items.length){\n      zone.appendChild(el('div','empty','Aucune entité ne correspond aux filtres.'));\n      return;\n    }\n    // Regroupement par type, dans l'ordre canonique du modèle universel.\n    // Chaque groupe est repliable : sur un projet réel, une seule catégorie peut\n    // compter cinquante entités et noyer toutes les autres.\n    DATA.kinds.forEach(function(k){\n      var group = items.filter(function(e){ return e.kind===k.key; });\n      if(!group.length) return;\n      var block = el('div','cat-block');\n\n      var ch = el('div','cat-head');\n      var caret = el('span','cat-caret','▾');\n      ch.appendChild(caret);\n      var hd = el('div','h');\n      hd.appendChild(document.createTextNode(k.icon+' '+k.label));\n      hd.appendChild(el('span','cat-count', String(group.length)));\n      ch.appendChild(hd);\n      ch.appendChild(el('div','d', k.desc));\n      block.appendChild(ch);\n\n      var cards = el('div','cards');\n      group.forEach(function(e){ cards.appendChild(renderCard(e,k)); });\n      block.appendChild(cards);\n\n      ch.onclick=function(){\n        var hidden = cards.classList.toggle('hidden');\n        caret.textContent = hidden ? '▸' : '▾';\n      };\n      zone.appendChild(block);\n    });\n  }\n\n  function renderCard(e,k){\n    var card = el('div','card');\n    // Barre de gauche : statut si l'entité en a un, sinon urgence, sinon type.\n    var st = (DATA.statuses||[]).filter(function(x){ return x.key===e.status; })[0];\n    card.style.borderLeftColor = st ? st.color\n      : (e.tone==='danger' ? '#e11d48' : (e.tone==='warn' ? '#d97706' : k.color));\n    if(e.tone==='danger'||e.tone==='warn') card.classList.add('flag');\n\n    var name = el('div','cname');\n    var dot=el('span','dot'); dot.style.background=k.color;\n    name.appendChild(dot); name.appendChild(document.createTextNode(e.name));\n    card.appendChild(name);\n\n    var pills = el('div','tags');\n    var s = srcOf(e.source);\n    var sp = el('span','srcpill', s.icon+' '+s.label); sp.style.background=s.color;\n    pills.appendChild(sp);\n    (e.badges||[]).forEach(function(b){ pills.appendChild(el('span','badge '+(b.tone||'muted'), b.text)); });\n    card.appendChild(pills);\n\n    card.appendChild(el('div','cdesc', e.description));\n\n    // Trois métadonnées au maximum sur la carte : au-delà, elles cessent d'être\n    // lues. Le reste — et le plan du document — vit dans la fiche détaillée.\n    if(e.meta && e.meta.length){\n      var tags = el('div','tags');\n      e.meta.slice(0,3).forEach(function(m){\n        var t=el('span','tag'); t.innerHTML='<b>'+esc(m.k)+'</b> '+esc(m.v); tags.appendChild(t);\n      });\n      if(e.meta.length>3) tags.appendChild(el('span','tag','+'+(e.meta.length-3)));\n      card.appendChild(tags);\n    }\n    // Pied de carte : chemin d'un côté, date de dernière modification de\n    // l'autre — c'est ce qui permet de repérer une config qui a vieilli.\n    var foot = el('div','cfoot');\n    foot.appendChild(el('span','cpath', e.path || '—'));\n    if(e.mtime) foot.appendChild(el('span','cdate', new Date(e.mtime).toLocaleDateString()));\n    card.appendChild(foot);\n\n    var actions = el('div','card-actions');\n    var btn = el('button','details-btn','📖 Détails');\n    btn.onclick=function(){ openDetail(e); };\n    actions.appendChild(btn);\n    card.appendChild(actions);\n    return card;\n  }\n\n  // ------------------------------------------------------- modale de détail --\n  function relationsOf(id){\n    var out = { out:[], in:[] };\n    (DATA.graph.edges||[]).forEach(function(ed){\n      if(ed.s===id) out.out.push({ id:ed.t, type:ed.type, cross:ed.cross });\n      else if(ed.t===id) out.in.push({ id:ed.s, type:ed.type, cross:ed.cross });\n    });\n    return out;\n  }\n  function edgeMeta(type){\n    var list = DATA.graph.edgeTypes||[];\n    for(var i=0;i<list.length;i++){ if(list[i].type===type) return list[i]; }\n    return { type:type, label:type, verb:type, color:'#94a3b8' };\n  }\n  function nodeLabel(id){\n    if(byId[id]) return byId[id].name;\n    var g = DATA.graph.nodes||[];\n    for(var i=0;i<g.length;i++){ if(g[i].id===id) return g[i].label; }\n    return id;\n  }\n\n  // La fiche s'ouvre en PAGE, pas en popup : une modale masque le reste, se\n  // ferme au moindre clic à côté et interdit de comparer deux entités.\n  function openDetail(e){\n    state.detail = e.id;\n    render();\n    window.scrollTo(0, 0);\n  }\n  function closeDetail(){\n    state.detail = null;\n    render();\n  }\n\n  function buildDetailPage(e){\n    var k = kindOf(e.kind), s = srcOf(e.source);\n    var page = el('div','detail');\n\n    var head = el('div','dhead');\n    var back = el('button','btn','← Retour');\n    back.onclick=closeDetail;\n    head.appendChild(back);\n\n    var titleBox = el('div','dtitle-box');\n    var title = el('div','dtitle');\n    var bar = el('span','dbar'); bar.style.background=k.color;\n    title.appendChild(bar);\n    title.appendChild(document.createTextNode(e.name));\n    titleBox.appendChild(title);\n    if(e.path) titleBox.appendChild(el('div','dpath', e.path));\n\n    var badges = el('div','dbadges');\n    var kb = el('span','mbadge', k.icon+' '+k.one); kb.style.background=k.color;\n    var sb = el('span','mbadge', s.icon+' '+s.label); sb.style.background=s.color;\n    badges.appendChild(kb); badges.appendChild(sb);\n    (e.badges||[]).forEach(function(b){ badges.appendChild(el('span','badge '+(b.tone||'muted'), b.text)); });\n    titleBox.appendChild(badges);\n    head.appendChild(titleBox);\n    page.appendChild(head);\n\n    // Sous-onglets : contenu, relations, métadonnées.\n    var rels = relationsOf(e.id);\n    var nRels = rels.out.length + rels.in.length;\n    var panes = {};\n    var nav = el('nav','dtabs');\n    [['content','Contenu',null],['relations','Relations',nRels],['meta','Métadonnées',(e.meta||[]).length]]\n      .forEach(function(t, idx){\n        var b = el('button','dtab'+(idx===0?' on':''));\n        b.appendChild(document.createTextNode(t[1]));\n        if(t[2]) b.appendChild(el('span','tcount', String(t[2])));\n        b.onclick=function(){\n          nav.querySelectorAll('.dtab').forEach(function(x){ x.classList.remove('on'); });\n          for(var key in panes) panes[key].classList.add('hidden');\n          b.classList.add('on');\n          panes[t[0]].classList.remove('hidden');\n        };\n        nav.appendChild(b);\n      });\n    page.appendChild(nav);\n\n    panes.content = el('div','dpane md');\n    // Les titres de section prennent la couleur du type de l'entité : la fiche\n    // se lit alors comme une page à elle, pas comme un bloc de texte neutre.\n    panes.content.style.setProperty('--tone', k.color);\n    panes.content.innerHTML = renderMarkdown(e.content || '_Aucun contenu textuel._');\n    wireCopyButtons(panes.content);\n    page.appendChild(panes.content);\n\n    panes.relations = el('div','dpane hidden');\n    if(nRels){\n      if(rels.out.length) panes.relations.appendChild(relList('Depuis cette entité', rels.out));\n      if(rels.in.length) panes.relations.appendChild(relList('Vers cette entité', rels.in));\n    } else {\n      panes.relations.appendChild(el('div','empty','Aucune relation.'));\n    }\n    page.appendChild(panes.relations);\n\n    panes.meta = el('div','dpane hidden');\n    var tbl = el('table','dmeta');\n    function row(kk, vv){\n      var tr=el('tr'); tr.appendChild(el('th',null,kk)); tr.appendChild(el('td',null,vv)); tbl.appendChild(tr);\n    }\n    row('chemin', e.path || '—');\n    if(e.mtime) row('modifié le', new Date(e.mtime).toLocaleString());\n    (e.meta||[]).forEach(function(m){ row(m.k, m.v); });\n    panes.meta.appendChild(tbl);\n    page.appendChild(panes.meta);\n\n    return page;\n  }\n\n  // Relations groupées PAR VERBE plutôt qu'en liste plate : « touche 3 fichiers,\n  // utilise 2 outils, cité par 1 exigence » se lit ; vingt puces alignées non.\n  function relList(title, list){\n    var box = el('div','relgroup');\n    var head = el('div','rg-head');\n    head.appendChild(el('span','rg-title', title));\n    head.appendChild(el('span','rg-count', String(list.length)));\n    box.appendChild(head);\n\n    var byType = {};\n    list.forEach(function(r){ (byType[r.type] = byType[r.type] || []).push(r); });\n\n    (DATA.graph.edgeTypes||[]).forEach(function(t){\n      var group = byType[t.type];\n      if(!group) return;\n      var sec = el('div','rg-sec');\n      var lab = el('div','rg-verb');\n      var sw = el('span','eline');\n      sw.style.borderTop=(t.dashed?'2px dashed ':'2px solid ')+t.color;\n      lab.appendChild(sw);\n      var vb = el('span','rg-vname', title.indexOf('Vers') === 0 ? t.verb+' par' : t.verb);\n      vb.style.color = t.color;\n      lab.appendChild(vb);\n      lab.appendChild(el('span','rg-count', String(group.length)));\n      sec.appendChild(lab);\n\n      var items = el('div','rg-items');\n      group.forEach(function(r){\n        var target = byId[r.id];\n        var kind = target ? target.kind : nodeKind(r.id);\n        var k = kindOf(kind);\n        var b = el('div','rlink');\n        b.style.borderLeftColor = k.color;\n        var ic = el('span','rl-ic', k.icon); ic.title = k.one;\n        b.appendChild(ic);\n        b.appendChild(el('span','rl-name', nodeLabel(r.id)));\n        var path = target ? target.path : nodePath(r.id);\n        if(path) b.appendChild(el('span','rl-path', path));\n        if(r.cross) b.appendChild(el('span','rl-cross','transverse'));\n        if(target) b.onclick=function(){ openDetail(target); };\n        else b.classList.add('inert');\n        items.appendChild(b);\n      });\n      sec.appendChild(items);\n      box.appendChild(sec);\n    });\n    return box;\n  }\n\n  function nodeKind(id){\n    var g = DATA.graph.nodes||[];\n    for(var i=0;i<g.length;i++){ if(g[i].id===id) return g[i].kind; }\n    return 'document';\n  }\n  function nodePath(id){\n    var g = DATA.graph.nodes||[];\n    for(var i=0;i<g.length;i++){ if(g[i].id===id) return g[i].path||''; }\n    return '';\n  }\n\n  // Échap ferme la fiche, comme le faisait la modale.\n  document.addEventListener('keydown', function(ev){\n    if(ev.key==='Escape' && state.detail && !document.fullscreenElement) closeDetail();\n  });\n\n  // ------------------------------------------------------------- arborescences --\n  function buildTreesPanel(){\n    var p = el('div','panel');\n    p.appendChild(h2('🌳 Arborescence des dossiers IA'));\n    if(!DATA.trees.length){ p.appendChild(el('div','empty','Aucun dossier à afficher.')); return p; }\n    DATA.trees.forEach(function(t){\n      var s = srcOf(t.source);\n      var hd = el('div','treeroot');\n      var dot=el('span','dot'); dot.style.background=s.color;\n      hd.appendChild(dot); hd.appendChild(document.createTextNode(s.label+' — '+t.root));\n      p.appendChild(hd);\n      var ul = el('ul','tree');\n      ul.appendChild(treeNode(t.tree,true));\n      p.appendChild(ul);\n    });\n    return p;\n  }\n  function treeNode(node, openTop){\n    var li = el('li');\n    if(node.type==='dir'){\n      var label = el('span','d'+(openTop?' open':''));\n      label.textContent=node.name+'/'+(node.truncated?' (…)':'');\n      li.appendChild(label);\n      var childUl = el('ul');\n      if(!openTop) childUl.className='hidden';\n      (node.children||[]).forEach(function(ch){ childUl.appendChild(treeNode(ch,false)); });\n      li.appendChild(childUl);\n      label.onclick=function(){ childUl.classList.toggle('hidden'); label.classList.toggle('open'); };\n    } else {\n      li.appendChild(el('span','f', node.name));\n    }\n    return li;\n  }\n\n  function toggleTheme(){\n    var cur = document.documentElement.getAttribute('data-theme');\n    var next = cur==='dark' ? 'light' : (cur==='light' ? 'dark'\n             : (matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark'));\n    document.documentElement.setAttribute('data-theme', next);\n    try{ localStorage.setItem('ai-map-theme', next); }catch(e){}\n    if(state.tab==='graph') initGraph(); // le canvas ne lit pas les variables CSS\n  }\n  try{ var saved=localStorage.getItem('ai-map-theme'); if(saved) document.documentElement.setAttribute('data-theme',saved); }catch(e){}\n\n  // -------------------------------------------------- rendu Markdown (sûr) --\n  // Échappe systématiquement le HTML source, puis applique les motifs Markdown.\n  function renderMarkdown(src){\n    var lines = String(src).replace(/\\r\\n/g,'\\n').split('\\n');\n    var out=[], i=0;\n    function inline(t){\n      t = esc(t);\n      // Le code inline est mis de côté derrière un sentinelle NUL (impossible\n      // dans du Markdown) avant d'appliquer gras/italique/liens, puis restauré :\n      // sinon un ** à l'intérieur d'un `code` serait interprété comme du gras.\n      var codes=[]; t = t.replace(/`([^`]+)`/g, function(m,p){ codes.push(p); return '\\u0000'+(codes.length-1)+'\\u0000'; });\n      t = t.replace(/\\*\\*([^*]+)\\*\\*/g,'<strong>$1</strong>');\n      t = t.replace(/(^|[^*])\\*([^*]+)\\*/g,'$1<em>$2</em>');\n      t = t.replace(/\\[([^\\]]+)\\]\\(([^)\\s]+)\\)/g, function(m,txt,url){\n        var safe=/^(https?:|mailto:|#|\\.|\\/|[\\w.-]+\\/)/.test(url)?url:'#';\n        return '<a href=\"'+safe+'\" target=\"_blank\" rel=\"noopener\">'+txt+'</a>';\n      });\n      t = t.replace(/\\u0000(\\d+)\\u0000/g, function(m,n){ return '<code>'+codes[+n]+'</code>'; });\n      return t;\n    }\n    while(i<lines.length){\n      var line=lines[i];\n      // L'INDENTATION est acceptée : à l'intérieur d'une liste, une fence est\n      // décalée. Ancrée strictement en début de ligne, elle passait en texte\n      // brut — délimiteurs visibles et code non mis en forme.\n      var fence = line.match(/^([ \\t]*)```\\s*([\\w+#.-]*)/);\n      if(fence){\n        var pad = fence[1].length;\n        var lang = fence[2] || '';\n        var buf=[]; i++;\n        while(i<lines.length && !/^[ \\t]*```/.test(lines[i])){\n          // On ne retire que l'indentation de la fence : le décalage interne\n          // au code doit être conservé tel quel.\n          var raw = lines[i];\n          buf.push(esc(raw.slice(0,pad).trim() === '' ? raw.slice(pad) : raw));\n          i++;\n        }\n        i++;\n        out.push('<div class=\"codeblock\">'\n          + '<div class=\"cb-head\"><span class=\"cb-lang\">' + esc(lang || 'texte') + '</span>'\n          + '<button class=\"cb-copy\" type=\"button\">Copier</button></div>'\n          + '<pre><code>' + buf.join('\\n') + '</code></pre></div>');\n        continue;\n      }\n      var h=line.match(/^(#{1,6})\\s+(.*)$/);\n      if(h){ var lvl=Math.min(h[1].length,3); out.push('<h'+lvl+'>'+inline(h[2])+'</h'+lvl+'>'); i++; continue; }\n      if(/^(---|\\*\\*\\*|___)\\s*$/.test(line)){ out.push('<hr>'); i++; continue; }\n      if(/^>\\s?/.test(line)){\n        var q=[]; while(i<lines.length && /^>\\s?/.test(lines[i])){ q.push(inline(lines[i].replace(/^>\\s?/,''))); i++; }\n        out.push('<blockquote>'+q.join('<br>')+'</blockquote>'); continue;\n      }\n      if(/^\\|.*\\|\\s*$/.test(line) && i+1<lines.length && /^\\|?\\s*:?-{2,}/.test(lines[i+1])){\n        var header=splitRow(lines[i]); var rows=[]; i+=2;\n        while(i<lines.length && /^\\|.*\\|\\s*$/.test(lines[i])){ rows.push(splitRow(lines[i])); i++; }\n        var th='<tr>'+header.map(function(c){return '<th>'+inline(c)+'</th>';}).join('')+'</tr>';\n        var tb=rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+inline(c)+'</td>';}).join('')+'</tr>';}).join('');\n        out.push('<table><thead>'+th+'</thead><tbody>'+tb+'</tbody></table>'); continue;\n      }\n      if(/^\\s*([-*+]|\\d+\\.)\\s+/.test(line)){\n        var ord = line.match(/^\\s*(\\d+)\\.\\s+/);\n        var items=[];\n        while(i<lines.length && /^\\s*([-*+]|\\d+\\.)\\s+/.test(lines[i])){\n          var li = '<li>'+inline(lines[i].replace(/^\\s*([-*+]|\\d+\\.)\\s+/,''))+'</li>';\n          // Case à cocher : rendue comme telle, pas comme « [x] » littéral.\n          li = li.replace(/^<li>\\[([ xX])\\]\\s+/, function(m,c){\n            return '<li class=\"task'+(c.toLowerCase()==='x'?' done':'')+'\">'\n              + (c.toLowerCase()==='x'?'☑ ':'☐ ');\n          });\n          items.push(li); i++;\n        }\n        // Une liste numérotée interrompue par un paragraphe repartait à 1 :\n        // on repart du numéro réellement écrit dans la source.\n        var open = ord ? '<ol start=\"'+Number(ord[1])+'\">' : '<ul>';\n        out.push(open+items.join('')+(ord?'</ol>':'</ul>')); continue;\n      }\n      if(/^\\s*$/.test(line)){ i++; continue; }\n      var para=[inline(line)]; i++;\n      while(i<lines.length && !/^\\s*$/.test(lines[i]) &&\n            !/^\\s*(#{1,6}\\s|>\\s?|```|([-*+]|\\d+\\.)\\s|\\|)/.test(lines[i]) &&\n            !/^(---|\\*\\*\\*|___)\\s*$/.test(lines[i])){ para.push(inline(lines[i])); i++; }\n      out.push('<p>'+para.join('<br>')+'</p>');\n    }\n    return out.join('\\n');\n  }\n  function splitRow(line){ return line.replace(/^\\||\\|\\s*$/g,'').split('|').map(function(s){return s.trim();}); }\n\n  // Le Markdown est injecté via innerHTML : les boutons de copie n'ont donc pas\n  // de gestionnaire. On les câble après coup.\n  function wireCopyButtons(root){\n    if(!root.querySelectorAll) return;\n    root.querySelectorAll('.cb-copy').forEach(function(btn){\n      btn.onclick=function(){\n        var pre = btn.parentElement && btn.parentElement.nextElementSibling;\n        var text = pre ? pre.textContent : '';\n        copyText(text);\n        btn.textContent = 'Copié';\n        setTimeout(function(){ btn.textContent = 'Copier'; }, 1600);\n      };\n    });\n  }\n\n  // Le rapport s'ouvre souvent depuis un fichier local : l'API Presse-papiers\n  // peut y être refusée, d'où le repli sur une zone de texte temporaire.\n  function copyText(text){\n    try {\n      if(navigator.clipboard && navigator.clipboard.writeText){\n        navigator.clipboard.writeText(text); return;\n      }\n    } catch(e){ /* on tente le repli */ }\n    try {\n      var ta = document.createElement('textarea');\n      ta.value = text;\n      ta.style.position='fixed'; ta.style.opacity='0';\n      document.body.appendChild(ta);\n      ta.select();\n      document.execCommand('copy');\n      document.body.removeChild(ta);\n    } catch(e){ /* rien de mieux à faire hors ligne */ }\n  }\n\n  // ------------------------------------------------------------------ graphe --\n  // `showGeneric` et `showOrphans` sont FAUX par défaut : sur un projet réel,\n  // les outils génériques (Bash, Read, search…) et les éléments sans aucune\n  // relation représentent l'essentiel de l'encombrement du graphe sans rien\n  // apprendre. On peut les rétablir d'une case à cocher.\n  var gState = { view:'network', colorBy:'kind', show:{}, showGeneric:false, showOrphans:false, kinds:{} };\n  (function(){ (DATA.graph.edgeTypes||[]).forEach(function(t){ gState.show[t.type]=true; }); })();\n  var graphApi = null;\n\n  // Sous-graphe réellement dessiné, après application des filtres.\n  function visibleGraph(){\n    var g = DATA.graph || { nodes:[], edges:[] };\n    var drop = {};\n    if(!gState.showGeneric){\n      g.nodes.forEach(function(n){ if(n.kind==='tool') drop[n.id]=1; });\n    }\n    // Types décochés dans la barre latérale.\n    g.nodes.forEach(function(n){ if(gState.kinds[n.kind] === false) drop[n.id]=1; });\n    var edges = (g.edges||[]).filter(function(e){\n      return gState.show[e.type] && !drop[e.s] && !drop[e.t];\n    });\n    var linked = {};\n    edges.forEach(function(e){ linked[e.s]=1; linked[e.t]=1; });\n    var nodes = (g.nodes||[]).filter(function(n){\n      if(drop[n.id]) return false;\n      if(!gState.showOrphans && !linked[n.id]) return false;\n      return true;\n    });\n    return { nodes:nodes, edges:edges, hidden:(g.nodes||[]).length - nodes.length };\n  }\n\n  // Panneau du graphe : contrôles en BARRE LATÉRALE, canvas à droite.\n  // Empilés au-dessus du canvas, les contrôles lui volaient sa hauteur et\n  // repoussaient le graphe hors de l'écran.\n  function buildGraphPanel(){\n    var panel = el('div','panel graph-panel');\n    panel.id='graph-panel';\n\n    var g = DATA.graph || { nodes:[], edges:[] };\n    if(!g.nodes.length){\n      panel.appendChild(h2('🕸️ Graphe transverse'));\n      panel.appendChild(el('div','empty','Aucune entité à relier.'));\n      return panel;\n    }\n\n    var vis = visibleGraph();\n    var layout = el('div','glayout');\n    layout.appendChild(buildGraphSidebar(g, vis));\n\n    var main = el('div','gmain');\n    main.appendChild(buildGraphTools(panel));\n\n    if(!vis.nodes.length){\n      main.appendChild(el('div','empty',\n        'Les filtres actifs masquent la totalité du graphe. Réactivez un type d\\'entité, un type de relation, ou cochez « Éléments isolés ».'));\n      layout.appendChild(main);\n      panel.appendChild(layout);\n      return panel;\n    }\n\n    // Au-delà d'un certain volume, aucun réglage d'affichage ne sauve la\n    // lecture : il faut retirer une famille. On propose la plus nombreuse.\n    if(vis.nodes.length > 60){\n      var counts = {};\n      vis.nodes.forEach(function(n){ counts[n.kind]=(counts[n.kind]||0)+1; });\n      var big = Object.keys(counts).sort(function(a,b){ return counts[b]-counts[a]; })[0];\n      var bk = kindOf(big);\n      var tip = el('div','gtip');\n      tip.appendChild(document.createTextNode(\n        vis.nodes.length+' nœuds : au repos, seuls les plus reliés sont nommés — survolez pour lire un voisinage. '));\n      var act = el('button','gtip-act','Masquer « '+bk.label+' » ('+counts[big]+')');\n      act.onclick=function(){ gState.kinds[big]=false; renderTab(); };\n      tip.appendChild(act);\n      main.appendChild(tip);\n    }\n\n    var box = el('div','gcanvas');\n    var canvas = document.createElement('canvas');\n    canvas.id='rel-graph'; canvas.className='graph';\n    canvas.style.height=(gState.view==='mcd'?'620px':'560px');\n    box.appendChild(canvas);\n    box.appendChild(el('div','gstat', vis.nodes.length+' nœuds · '+vis.edges.length+' liens'));\n    main.appendChild(box);\n\n    layout.appendChild(main);\n    panel.appendChild(layout);\n    return panel;\n  }\n\n  function buildGraphSidebar(g, vis){\n    var side = el('aside','gside');\n\n    side.appendChild(el('div','gs-label','Mode'));\n    var seg = el('div','seg gs-seg');\n    [['network','Réseau'],['mcd','MCD']].forEach(function(v){\n      var b=el('button',gState.view===v[0]?'on':null,v[1]);\n      b.onclick=function(){ if(gState.view!==v[0]){ gState.view=v[0]; renderTab(); } };\n      seg.appendChild(b);\n    });\n    side.appendChild(seg);\n\n    var seg2 = el('div','seg gs-seg');\n    [['kind','Type'],['source','Écosystème']].forEach(function(v){\n      var b=el('button',gState.colorBy===v[0]?'on':null,v[1]);\n      b.title='Colorer par '+v[1].toLowerCase();\n      b.onclick=function(){ if(gState.colorBy!==v[0]){ gState.colorBy=v[0]; renderTab(); } };\n      seg2.appendChild(b);\n    });\n    side.appendChild(seg2);\n\n    // TYPES — à la fois légende ET filtre, avec le compte réel. Deux fonctions\n    // pour un seul composant, au lieu d'une légende inerte à côté de cases.\n    side.appendChild(el('div','gs-label','Types'));\n    var counts = {};\n    g.nodes.forEach(function(n){ counts[n.kind] = (counts[n.kind]||0)+1; });\n    Object.keys(counts).sort(function(a,b){ return counts[b]-counts[a]; }).forEach(function(kind){\n      var k = kindOf(kind);\n      var on = gState.kinds[kind] !== false;\n      var row = el('button','gs-type'+(on?'':' off'));\n      row.style.borderLeftColor = k.color;\n      if(on) row.style.background = k.color+'14';\n      var dot = el('span','dot'); dot.style.background=k.color;\n      row.appendChild(dot);\n      var nm = el('span','gs-tname', k.one);\n      if(on) nm.style.color = k.color;\n      row.appendChild(nm);\n      row.appendChild(el('span','gs-tn', String(counts[kind])));\n      row.title = (on?'Masquer':'Afficher')+' les '+k.label.toLowerCase();\n      row.onclick=function(){ gState.kinds[kind] = !on; renderTab(); };\n      side.appendChild(row);\n    });\n\n    // LIENS — même principe : le trait montre le style, la case filtre.\n    side.appendChild(el('div','gs-label','Liens'));\n    (DATA.graph.edgeTypes||[]).forEach(function(t){\n      var n = g.edges.filter(function(e){ return e.type===t.type; }).length;\n      if(!n) return;\n      var lab = el('label','gs-edge');\n      var cb = el('input'); cb.type='checkbox'; cb.checked=gState.show[t.type];\n      cb.onchange=function(){ gState.show[t.type]=cb.checked; renderTab(); };\n      var sw = el('span','eline');\n      sw.style.borderTop=(t.dashed?'2px dashed ':'2px solid ')+t.color;\n      lab.appendChild(cb); lab.appendChild(sw);\n      lab.appendChild(document.createTextNode(t.verb));\n      lab.appendChild(el('span','gs-tn', String(n)));\n      side.appendChild(lab);\n    });\n\n    side.appendChild(el('div','gs-label','Lisibilité'));\n    side.appendChild(toggleBox('showGeneric', 'Outils génériques',\n      'Bash, Read, search… — ils encombrent beaucoup et n\\'apprennent rien'));\n    side.appendChild(toggleBox('showOrphans', 'Éléments isolés',\n      'entités sans aucune relation visible'));\n    if(vis.hidden){\n      side.appendChild(el('div','ghidden', vis.hidden+' masqué(s)'));\n    }\n\n    var reorg = el('button','btn gs-btn','↻ Réorganiser');\n    reorg.onclick=function(){ initGraph(true); };\n    side.appendChild(reorg);\n    return side;\n  }\n\n  function buildGraphTools(panel){\n    var gt = el('div','gtools');\n    function gbtn(txt,title,fn){ var b=el('button','btn',txt); b.title=title; b.onclick=fn; return b; }\n    gt.appendChild(gbtn('－','Dézoomer',function(){ if(graphApi) graphApi.zoomBy(1/1.2); }));\n    gt.appendChild(gbtn('＋','Zoomer',function(){ if(graphApi) graphApi.zoomBy(1.2); }));\n    gt.appendChild(gbtn('⤢ Ajuster','Tout afficher',function(){ if(graphApi) graphApi.fit(); }));\n\n    // Vrai plein écran via l'API Fullscreen : le graphe occupe l'ÉCRAN, pas\n    // seulement la fenêtre. Repli sur un recouvrement CSS si l'API est refusée\n    // (webview restreinte, iframe sans autorisation).\n    var fsBtn = gbtn('⛶ Plein écran','Basculer le plein écran',null);\n    function applyFs(full){\n      fsBtn.textContent = full ? '✕ Quitter' : '⛶ Plein écran';\n      panel.classList.toggle('fullscreen', full);\n      var cv = document.getElementById('rel-graph');\n      // En plein écran la hauteur est pilotée par le CSS (flex) : on retire la\n      // hauteur en dur pour que le canvas prenne tout l'espace restant.\n      if(cv) cv.style.height = full ? '' : (gState.view==='mcd' ? '620px' : '560px');\n      // Mesurer APRÈS que le navigateur a appliqué la mise en page, sinon le\n      // canvas conserve ses anciennes dimensions.\n      requestAnimationFrame(function(){\n        if(graphApi){ graphApi.resize(); graphApi.fit(); }\n      });\n    }\n    fsBtn.onclick=function(){\n      if(document.fullscreenElement){ document.exitFullscreen(); return; }\n      if(panel.requestFullscreen){\n        panel.requestFullscreen().catch(function(){ applyFs(true); });\n      } else {\n        applyFs(!panel.classList.contains('fullscreen'));\n      }\n    };\n    panel.addEventListener('fullscreenchange', function(){\n      applyFs(document.fullscreenElement === panel);\n    });\n    gt.appendChild(fsBtn);\n    return gt;\n  }\n\n  function toggleBox(key, label, help){\n    var lab = el('label','etoggle');\n    lab.title = help || '';\n    var cb = el('input'); cb.type='checkbox'; cb.checked=gState[key];\n    cb.onchange=function(){ gState[key]=cb.checked; renderTab(); };\n    lab.appendChild(cb);\n    lab.appendChild(document.createTextNode(label));\n    return lab;\n  }\n\n  function initGraph(reheat){\n    if(graphApi){ graphApi.stop(); graphApi=null; }\n    var canvas = document.getElementById('rel-graph');\n    if(!canvas) return;\n    var g = visibleGraph();\n    if(!g.nodes.length) return;\n    graphApi = runForceGraph(canvas, g, reheat);\n    graphApi.fit();\n  }\n\n  // Disposition calculée UNE fois puis figée : pas d'animation continue, donc\n  // pas de tremblement. On peut déplacer une entité, elle reste où on la lâche.\n  function runForceGraph(canvas, g, reheat){\n    var dpr = Math.max(1, window.devicePixelRatio||1);\n    var ctx = canvas.getContext('2d');\n    var W=0,H=0;\n    function resize(){\n      W=canvas.clientWidth||600; H=canvas.clientHeight||500;\n      canvas.width=Math.round(W*dpr); canvas.height=Math.round(H*dpr);\n      ctx.setTransform(dpr,0,0,dpr,0,0);\n    }\n    resize();\n\n    var MCD = gState.view==='mcd';\n    var colorOf = function(n){ return gState.colorBy==='source' ? n.sourceColor : n.kindColor; };\n\n    var N = g.nodes.length;\n    var seed = reheat ? Math.random()*Math.PI*2 : 0;\n    var nodes = g.nodes.map(function(n,i){\n      var a = seed + i/N*Math.PI*2, r = Math.min(W,H)/3;\n      return { id:n.id, label:n.label, kind:n.kind, source:n.source, path:n.path,\n               color:colorOf(n), x:W/2+Math.cos(a)*r, y:H/2+Math.sin(a)*r, fixed:false };\n    });\n    var idx={}; nodes.forEach(function(n){ idx[n.id]=n; });\n    var edges = g.edges.map(function(e){ return { s:idx[e.s], t:idx[e.t], type:e.type }; })\n                       .filter(function(e){ return e.s && e.t; });\n    var neigh={};\n    edges.forEach(function(e){\n      (neigh[e.s.id]=neigh[e.s.id]||{})[e.t.id]=1;\n      (neigh[e.t.id]=neigh[e.t.id]||{})[e.s.id]=1;\n    });\n\n    // Degré de chaque nœud, puis marquage des « carrefours » : ce sont les\n    // seuls qu'on étiquette au repos sur un graphe dense.\n    nodes.forEach(function(n){ n.deg = Object.keys(neigh[n.id]||{}).length; n.hub=false; });\n    var HUB_MAX = 22;\n    nodes.slice().sort(function(a,b){ return b.deg-a.deg; })\n      .slice(0, HUB_MAX).forEach(function(n){ if(n.deg>0) n.hub=true; });\n\n    var k = 0.55*Math.sqrt((W*H)/(N+1));\n    var GRAV = Math.min(0.14, 0.02 + N*0.0012);\n    var hoverId=null, dragging=null, panning=false, panLast=null;\n    var cam={scale:1,ox:0,oy:0};\n\n    // Infobulle : équivalent accessible d'un aria-label sur un canvas.\n    var tip=document.createElement('div'); tip.className='graph-tip'; tip.style.display='none';\n    document.body.appendChild(tip);\n    function showTip(n,ev){\n      var sub = n.path || (n.kind==='tool' ? 'Outil référencé' : n.id);\n      tip.innerHTML='<div class=\"tname\">'+esc(n.label)+'</div>'\n        +'<div class=\"tsub\">'+esc(kindOf(n.kind).one+' · '+sub)+'</div>';\n      tip.style.display='block';\n      var x=ev.clientX+14,y=ev.clientY+16;\n      if(x+tip.offsetWidth>window.innerWidth-8) x=ev.clientX-tip.offsetWidth-14;\n      if(y+tip.offsetHeight>window.innerHeight-8) y=ev.clientY-tip.offsetHeight-16;\n      tip.style.left=x+'px'; tip.style.top=y+'px';\n    }\n    function hideTip(){ tip.style.display='none'; }\n    function toWorld(sx,sy){ return { x:(sx-cam.ox)/cam.scale, y:(sy-cam.oy)/cam.scale }; }\n\n    // Le canvas ne lit pas les variables CSS : on les résout une fois.\n    var cs=getComputedStyle(document.documentElement);\n    function cvar(n,d){ var v=cs.getPropertyValue(n); return (v&&v.trim())||d; }\n    var COL={ panel:cvar('--panel','#fff'), border:cvar('--border','#e5e7eb'),\n              ink:cvar('--ink','#1f2430'), muted:cvar('--muted','#6b7280') };\n\n    function clipTxt(s,m){ s=String(s); return s.length>m ? s.slice(0,m-1)+'…' : s; }\n    function baseName(p){ return p ? String(p).split('/').pop() : ''; }\n    function em(type){ return edgeMeta(type); }\n\n    // Cardinalités calculées sur les liens réels (style Merise).\n    var cardCache={};\n    function sideCard(type,side){\n      var key=type+side;\n      if(cardCache[key]) return cardCache[key];\n      var deg={}, mx=0;\n      edges.forEach(function(e){ if(e.type!==type) return; var kk=e[side].id; deg[kk]=(deg[kk]||0)+1; });\n      for(var kk in deg) mx=Math.max(mx,deg[kk]);\n      return (cardCache[key]='0,'+(mx>1?'n':'1'));\n    }\n\n    function layoutBoxes(){\n      nodes.forEach(function(n){\n        n.attr = baseName(n.path) || kindOf(n.kind).one.toLowerCase();\n        ctx.font='bold 12px system-ui,sans-serif'; var w1=ctx.measureText(clipTxt(n.label,26)).width;\n        ctx.font='10.5px system-ui,sans-serif'; var w2=ctx.measureText(clipTxt(n.attr,30)).width;\n        ctx.font='10px system-ui,sans-serif'; var w3=ctx.measureText(kindOf(n.kind).one.toUpperCase()).width;\n        n.w=Math.max(126,Math.min(236,Math.ceil(Math.max(w1,w2,w3)+22)));\n        n.h=62;\n      });\n    }\n    function halfX(n){ return MCD ? n.w/2+4 : 24; }\n    function halfY(n){ return MCD ? n.h/2+4 : 24; }\n    function clampAll(){ nodes.forEach(function(n){\n      n.x=Math.max(halfX(n),Math.min(W-halfX(n),n.x));\n      n.y=Math.max(halfY(n),Math.min(H-halfY(n),n.y)); }); }\n\n    function step(temp){\n      var disp={}; nodes.forEach(function(n){ disp[n.id]={x:0,y:0}; });\n      for(var i=0;i<N;i++) for(var j=i+1;j<N;j++){\n        var a=nodes[i],b=nodes[j];\n        var dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy)||0.01;\n        var f=(k*k)/d, ux=dx/d, uy=dy/d;\n        disp[a.id].x+=ux*f; disp[a.id].y+=uy*f;\n        disp[b.id].x-=ux*f; disp[b.id].y-=uy*f;\n      }\n      edges.forEach(function(e){\n        var dx=e.s.x-e.t.x,dy=e.s.y-e.t.y,d=Math.sqrt(dx*dx+dy*dy)||0.01;\n        var f=(d*d)/k, ux=dx/d, uy=dy/d;\n        disp[e.s.id].x-=ux*f; disp[e.s.id].y-=uy*f;\n        disp[e.t.id].x+=ux*f; disp[e.t.id].y+=uy*f;\n      });\n      nodes.forEach(function(n){\n        if(n.fixed) return;\n        disp[n.id].x+=(W/2-n.x)*GRAV; disp[n.id].y+=(H/2-n.y)*GRAV;\n        var dd=disp[n.id], dl=Math.sqrt(dd.x*dd.x+dd.y*dd.y)||0.01;\n        n.x+=(dd.x/dl)*Math.min(dl,temp); n.y+=(dd.y/dl)*Math.min(dl,temp);\n      });\n    }\n    function settle(){ var t=W/8; for(var s=0;s<320;s++){ step(t); t=Math.max(0.5,t*0.97); } }\n    function separate(){\n      for(var it=0;it<70;it++){\n        var moved=false;\n        for(var i=0;i<N;i++) for(var j=i+1;j<N;j++){\n          var a=nodes[i],b=nodes[j];\n          var dx=b.x-a.x,dy=b.y-a.y,pad=26;\n          var ox=(a.w+b.w)/2+pad-Math.abs(dx), oy=(a.h+b.h)/2+pad-Math.abs(dy);\n          if(ox>0&&oy>0){\n            moved=true;\n            if(ox<oy){ var sg=(dx<0?-1:1),s1=ox/2; if(!a.fixed)a.x-=sg*s1; if(!b.fixed)b.x+=sg*s1; }\n            else { var sg2=(dy<0?-1:1),s2=oy/2; if(!a.fixed)a.y-=sg2*s2; if(!b.fixed)b.y+=sg2*s2; }\n          }\n        }\n        if(!moved) break;\n      }\n    }\n\n    function roundRectPath(x,y,w,h,r){\n      ctx.beginPath(); ctx.moveTo(x+r,y);\n      ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);\n      ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();\n    }\n    function roundTopPath(x,y,w,h,r){\n      ctx.beginPath(); ctx.moveTo(x,y+h);\n      ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);\n      ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);\n      ctx.lineTo(x+w,y+h); ctx.closePath();\n    }\n    function clipRect(box,tx,ty){\n      var dx=tx-box.x,dy=ty-box.y,hw=box.w/2,hh=box.h/2;\n      var tX=dx!==0?hw/Math.abs(dx):Infinity, tY=dy!==0?hh/Math.abs(dy):Infinity;\n      var t=Math.min(tX,tY);\n      return { x:box.x+dx*t, y:box.y+dy*t };\n    }\n\n    function drawNetwork(){\n      edges.forEach(function(e){\n        var m=em(e.type);\n        var hot=hoverId&&(e.s.id===hoverId||e.t.id===hoverId);\n        ctx.beginPath(); ctx.moveTo(e.s.x,e.s.y); ctx.lineTo(e.t.x,e.t.y);\n        ctx.lineWidth=hot?2.2:1;\n        ctx.setLineDash(m.dashed?[4,3]:[]);\n        ctx.globalAlpha=hot?0.95:(hoverId?0.18:0.55);\n        ctx.strokeStyle=m.color; ctx.stroke();\n      });\n      ctx.setLineDash([]); ctx.globalAlpha=1;\n      nodes.forEach(function(n){\n        var dim=hoverId&&n.id!==hoverId&&!(neigh[hoverId]&&neigh[hoverId][n.id]);\n        // Le rayon suit le degré : les carrefours se voient sans les lire.\n        var r=(n.kind==='tool'?5:7) + Math.min(6, Math.sqrt(n.deg||0)*1.6);\n        ctx.globalAlpha=dim?0.2:1;\n        ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2);\n        ctx.fillStyle=n.color; ctx.fill();\n        ctx.lineWidth=1.5; ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.stroke();\n\n        // Sans survol, `dim` est faux partout : l'ancienne condition\n        // `N<=60 || !dim` étiquetait donc TOUT, quel que soit le nombre de\n        // nœuds — d'où l'empilement illisible. On n'étiquette au repos que les\n        // nœuds les plus reliés ; le survol révèle le voisinage.\n        var label = hoverId ? !dim : (N <= 45 || n.hub);\n        if(label){\n          ctx.font=(n.hub?'600 11.5px':'11px')+' system-ui,sans-serif';\n          ctx.textAlign='left'; ctx.textBaseline='middle';\n          ctx.fillStyle=COL.ink; ctx.globalAlpha=dim?0.25:0.95;\n          ctx.fillText(clipTxt(n.label,24), n.x+r+5, n.y);\n        }\n        ctx.globalAlpha=1;\n      });\n    }\n\n    function pill(x,y,txt,color,accent){\n      ctx.font='10.5px system-ui,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';\n      var w=ctx.measureText(txt).width+14;\n      roundRectPath(x-w/2,y-9,w,18,9);\n      ctx.fillStyle=accent?'rgba(99,102,241,.14)':COL.panel;\n      ctx.strokeStyle=accent?'rgba(99,102,241,.9)':color; ctx.lineWidth=1; ctx.fill(); ctx.stroke();\n      ctx.fillStyle=accent?'#6366f1':COL.ink; ctx.fillText(txt,x,y);\n    }\n    function cardTag(pFrom,pTo,txt){\n      var dx=pTo.x-pFrom.x,dy=pTo.y-pFrom.y,d=Math.sqrt(dx*dx+dy*dy)||1;\n      var x=pFrom.x+dx/d*17,y=pFrom.y+dy/d*17;\n      ctx.font='9.5px system-ui,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';\n      var w=ctx.measureText(txt).width+8;\n      roundRectPath(x-w/2,y-8,w,15,4);\n      ctx.fillStyle=COL.panel; ctx.strokeStyle=COL.border; ctx.lineWidth=1; ctx.fill(); ctx.stroke();\n      ctx.fillStyle=COL.muted; ctx.fillText(txt,x,y);\n    }\n    function drawBox(n){\n      var dim=hoverId&&n.id!==hoverId&&!(neigh[hoverId]&&neigh[hoverId][n.id]);\n      var focus=hoverId===n.id;\n      ctx.globalAlpha=dim?0.35:1;\n      var x=n.x-n.w/2,y=n.y-n.h/2;\n      roundRectPath(x,y,n.w,n.h,10); ctx.fillStyle=COL.panel; ctx.fill();\n      roundTopPath(x,y,n.w,20,10); ctx.fillStyle=n.color; ctx.fill();\n      roundRectPath(x,y,n.w,n.h,10); ctx.lineWidth=focus?2:1;\n      ctx.strokeStyle=focus?n.color:COL.border; ctx.stroke();\n      ctx.textAlign='left'; ctx.textBaseline='middle';\n      ctx.fillStyle='#fff'; ctx.font='bold 10px system-ui,sans-serif';\n      ctx.fillText(kindOf(n.kind).one.toUpperCase(), x+10, y+10);\n      ctx.fillStyle=COL.ink; ctx.font='bold 12px system-ui,sans-serif';\n      ctx.fillText(clipTxt(n.label,26), x+10, y+33);\n      ctx.fillStyle=COL.muted; ctx.font='10.5px system-ui,sans-serif';\n      ctx.fillText(clipTxt(n.attr,30), x+10, y+49);\n      ctx.globalAlpha=1;\n    }\n    function drawMCD(){\n      edges.forEach(function(e){\n        var m=em(e.type);\n        var hot=hoverId&&(e.s.id===hoverId||e.t.id===hoverId);\n        var p1=clipRect(e.s,e.t.x,e.t.y), p2=clipRect(e.t,e.s.x,e.s.y);\n        ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);\n        ctx.lineWidth=hot?2:1.2; ctx.setLineDash(m.dashed?[5,4]:[]);\n        ctx.globalAlpha=hot?1:(hoverId?0.2:0.7);\n        ctx.strokeStyle=m.color; ctx.stroke();\n        ctx.setLineDash([]); ctx.globalAlpha=1;\n        // Verbe et cardinalités uniquement quand c'est lisible : sur un graphe\n        // dense, ces étiquettes se superposent aux entités — c'est exactement\n        // ce qui rendait la vue MCD illisible.\n        if(!DENSE || hot){\n          cardTag(p1,p2,sideCard(e.type,'s'));\n          cardTag(p2,p1,sideCard(e.type,'t'));\n          pill((p1.x+p2.x)/2,(p1.y+p2.y)/2, m.verb, m.color, hot);\n        }\n      });\n      nodes.forEach(drawBox);\n    }\n\n    function draw(){\n      ctx.setTransform(dpr,0,0,dpr,0,0);\n      ctx.clearRect(0,0,W,H);\n      ctx.setTransform(dpr*cam.scale,0,0,dpr*cam.scale, dpr*cam.ox, dpr*cam.oy);\n      if(MCD) drawMCD(); else drawNetwork();\n    }\n    function fit(){\n      var minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;\n      nodes.forEach(function(n){\n        var hw=MCD?n.w/2:12, hh=MCD?n.h/2:12;\n        minX=Math.min(minX,n.x-hw); maxX=Math.max(maxX,n.x+hw);\n        minY=Math.min(minY,n.y-hh); maxY=Math.max(maxY,n.y+hh);\n      });\n      var bw=Math.max(1,maxX-minX), bh=Math.max(1,maxY-minY), m=28;\n      cam.scale=Math.max(0.35,Math.min(Math.min((W-m*2)/bw,(H-m*2)/bh),1.6));\n      cam.ox=W/2-((minX+maxX)/2)*cam.scale;\n      cam.oy=H/2-((minY+maxY)/2)*cam.scale;\n      draw();\n    }\n    function zoomAt(sx,sy,f){\n      var w=toWorld(sx,sy);\n      cam.scale=Math.max(0.3,Math.min(3.5,cam.scale*f));\n      cam.ox=sx-w.x*cam.scale; cam.oy=sy-w.y*cam.scale; draw();\n    }\n    function zoomBy(f){ zoomAt(W/2,H/2,f); }\n\n    // Au-delà de ce seuil, verbes et cardinalités se chevauchent : on ne les\n    // dessine plus que sur la relation survolée.\n    var DENSE = nodes.length > 14 || edges.length > 18;\n\n    if(MCD) layoutBoxes();\n    settle();\n    if(MCD) separate();\n    draw();\n\n    function posOf(ev){ var r=canvas.getBoundingClientRect(); return { x:ev.clientX-r.left, y:ev.clientY-r.top }; }\n    function pick(p){\n      if(MCD){\n        var hit=null;\n        nodes.forEach(function(n){ if(Math.abs(p.x-n.x)<=n.w/2 && Math.abs(p.y-n.y)<=n.h/2) hit=n; });\n        return hit;\n      }\n      var best=null,bd=1e9;\n      nodes.forEach(function(n){ var dx=n.x-p.x,dy=n.y-p.y,d=dx*dx+dy*dy; if(d<bd){bd=d;best=n;} });\n      return (best&&bd<(18*18))?best:null;\n    }\n    var downAt=null;\n    function onMove(ev){\n      var p=posOf(ev);\n      if(dragging){\n        var w=toWorld(p.x,p.y);\n        dragging.x=w.x; dragging.y=w.y;\n        hoverId=dragging.id; draw(); showTip(dragging,ev); return;\n      }\n      if(panning){ cam.ox+=(ev.clientX-panLast.x); cam.oy+=(ev.clientY-panLast.y);\n        panLast={x:ev.clientX,y:ev.clientY}; hideTip(); draw(); return; }\n      var n=pick(toWorld(p.x,p.y));\n      var nh=n?n.id:null;\n      canvas.style.cursor=n?'pointer':'grab';\n      if(n) showTip(n,ev); else hideTip();\n      if(nh!==hoverId){ hoverId=nh; draw(); }\n    }\n    function onDown(ev){\n      var p=posOf(ev); var n=pick(toWorld(p.x,p.y));\n      downAt={x:ev.clientX,y:ev.clientY,node:n};\n      if(n){ dragging=n; n.fixed=true; canvas.style.cursor='grabbing'; }\n      else { panning=true; panLast={x:ev.clientX,y:ev.clientY}; canvas.style.cursor='grabbing'; }\n    }\n    function onUp(ev){\n      // Un clic net (sans déplacement) sur une entité ouvre sa fiche : le\n      // graphe devient navigable, pas seulement contemplatif.\n      if(downAt && downAt.node && Math.abs(ev.clientX-downAt.x)<4 && Math.abs(ev.clientY-downAt.y)<4){\n        var e=byId[downAt.node.id];\n        if(e) openDetail(e);\n      }\n      downAt=null; dragging=null; panning=false; canvas.style.cursor='grab';\n    }\n    function onLeave(){ hideTip(); }\n    function onWheel(ev){ ev.preventDefault(); var r=canvas.getBoundingClientRect();\n      zoomAt(ev.clientX-r.left, ev.clientY-r.top, ev.deltaY<0?1.12:1/1.12); }\n\n    canvas.addEventListener('mousemove',onMove);\n    canvas.addEventListener('mousedown',onDown);\n    canvas.addEventListener('mouseleave',onLeave);\n    canvas.addEventListener('wheel',onWheel,{passive:false});\n    window.addEventListener('mouseup',onUp);\n    var rt=null;\n    var onResize=function(){ if(rt) clearTimeout(rt); rt=setTimeout(function(){ resize(); clampAll(); draw(); },150); };\n    window.addEventListener('resize',onResize);\n\n    return {\n      stop:function(){\n        canvas.removeEventListener('mousemove',onMove);\n        canvas.removeEventListener('mousedown',onDown);\n        canvas.removeEventListener('mouseleave',onLeave);\n        canvas.removeEventListener('wheel',onWheel);\n        window.removeEventListener('mouseup',onUp);\n        window.removeEventListener('resize',onResize);\n        if(rt) clearTimeout(rt);\n        if(tip&&tip.parentNode) tip.parentNode.removeChild(tip);\n      },\n      resize:function(){ resize(); clampAll(); draw(); },\n      fit:fit, zoomBy:zoomBy\n    };\n  }\n\n  render();\n})();"};

// ===== core/fs.mjs =====
// core/fs.mjs — accès disque. Helpers purs, sans état global.
// Tout ce qui dépend du projet reçoit un chemin en argument.




function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function isFile(p) { try { return fs.statSync(p).isFile(); } catch { return false; } }
function exists(p) { try { fs.statSync(p); return true; } catch { return false; } }
function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }
function readJson(p) { try { return JSON.parse(read(p)); } catch { return null; } }

// Date de dernière modification, en ISO. Alimente la Timeline ; `null` si le
// fichier est illisible — la Timeline ignore alors simplement l'entité.
function mtimeOf(p) {
  try { return fs.statSync(p).mtime.toISOString(); } catch { return null; }
}

function listDir(p) { try { return fs.readdirSync(p).sort(); } catch { return []; } }
function listSubdirs(p) { return listDir(p).filter((n) => isDir(path.join(p, n))); }
function listFiles(p, ext) {
  return listDir(p).filter((n) => isFile(path.join(p, n)) && (!ext || n.endsWith(ext)));
}

// Chemin relatif à la racine du projet, toujours en séparateurs POSIX (stable
// entre Windows et Unix → sortie déterministe).
function relFrom(root, p) { return path.relative(root, p).split(path.sep).join('/'); }

// Clé de comparaison de chemins (insensible à la casse et aux séparateurs).
function normPath(p) { return path.resolve(p).replace(/\\/g, '/').toLowerCase(); }

// Parcours récursif. `ext` filtre l'extension ; `skip` exclut des noms de dossier.
function walk(dir, cb, ext, skip) {
  const skipSet = new Set(skip || []);
  (function rec(d) {
    for (const name of listDir(d)) {
      const p = path.join(d, name);
      if (isDir(p)) { if (!skipSet.has(name)) rec(p); }
      else if (!ext || name.endsWith(ext)) cb(p);
    }
  })(dir);
}

// ===== core/parser.mjs =====
// core/parser.mjs — extraction de sens depuis du texte (frontmatter, Markdown).
// Responsabilité unique : transformer du texte brut en données structurées.
// Aucun accès disque, aucune notion d'écosystème.

// ----- Frontmatter YAML (sous-ensemble : key: value, listes [a, b]) ---------
function parseFrontmatter(content) {
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
function parseYamlLite(text) {
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
function firstHeading(body) {
  const m = body.match(/^#{1,3}\s+(.+)$/m);
  return m ? m[1].trim().replace(/[*`_]/g, '') : null;
}

function firstParagraph(body) {
  for (const l of body.split(/\r?\n/)) {
    const t = l.trim();
    if (!t) continue;
    if (t.startsWith('#') || t.startsWith('>') || t.startsWith('---') ||
        t.startsWith('|') || t.startsWith('```')) continue;
    return t.replace(/[*`_]/g, '').replace(/^[-*+]\s+/, '').slice(0, 300);
  }
  return '';
}

function headings(body, max = 12) {
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
function sectionsOf(body, level) {
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
function findMdLinks(body) {
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
function findWikiLinks(body) {
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
function findCodePaths(body) {
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
function parseChecklist(body) {
  const items = [];
  const re = /^\s*[-*+]\s*\[([ xX])\]\s+(.+)$/gm;
  let m;
  while ((m = re.exec(body))) {
    items.push({ done: m[1].toLowerCase() === 'x', text: m[2].trim().replace(/[*`_]/g, '') });
  }
  return { items, done: items.filter((i) => i.done).length, total: items.length };
}

// ----- Utilitaires ---------------------------------------------------------
function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'sans-nom';
}

// Paires clé/valeur affichées en badges ; ignore les valeurs vides.
function buildMeta(obj) {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) continue;
    out.push({ k, v: Array.isArray(v) ? v.join(', ') : String(v) });
  }
  return out;
}

const MAX_CONTENT_CHARS = 120000;
function clip(text) {
  const t = (text || '').trim();
  if (t.length <= MAX_CONTENT_CHARS) return t;
  return t.slice(0, MAX_CONTENT_CHARS) + '\n\n… (contenu tronqué pour l\'affichage)';
}

// ===== core/model.mjs =====
// core/model.mjs — LE MODÈLE UNIVERSEL.
//
// C'est la pièce centrale d'AI-MAP : peu importe l'écosystème d'origine
// (Claude Code, OpenSpec, Cursor, Copilot…), tout est converti en `Entity`.
// Un adaptateur (plugins/*) ne produit QUE des Entity ; il n'a aucune idée de
// la façon dont elles seront affichées, reliées ou auditées.





// ----- Entités universelles (vision §Entités Universelles) -----------------
// `key` est l'identifiant technique ; le reste pilote l'affichage.
const KINDS = [
  { key: 'skill',     label: 'Skills',          one: 'Skill',         icon: '🧩', color: '#6366f1', desc: 'Procédures packagées qu\'un agent peut suivre.' },
  { key: 'command',   label: 'Commandes',       one: 'Commande',      icon: '⌘',  color: '#0ea5e9', desc: 'Actions déclenchables explicitement (slash-commandes, prompts).' },
  { key: 'agent',     label: 'Agents',          one: 'Agent',         icon: '🤖', color: '#8b5cf6', desc: 'Exécutants spécialisés, avec leurs propres outils.' },
  { key: 'rule',      label: 'Règles',          one: 'Règle',         icon: '📏', color: '#10b981', desc: 'Conventions et contraintes imposées à l\'IA.' },
  { key: 'prompt',    label: 'Prompts',         one: 'Prompt',        icon: '💬', color: '#ec4899', desc: 'Gabarits de prompt réutilisables.' },
  { key: 'spec',      label: 'Spécifications',  one: 'Spécification', icon: '📐', color: '#14b8a6', desc: 'Capacités spécifiées qui pilotent le projet.' },
  { key: 'requirement', label: 'Exigences',     one: 'Exigence',      icon: '✅', color: '#22c55e', desc: 'Exigences unitaires extraites des spécifications.' },
  { key: 'change',    label: 'Changes',         one: 'Change',        icon: '🔀', color: '#f43f5e', desc: 'Propositions d\'évolution en cours ou archivées.' },
  { key: 'task',      label: 'Tâches',          one: 'Tâche',         icon: '☑️', color: '#84cc16', desc: 'Lots de travail rattachés à un change.' },
  { key: 'workflow',  label: 'Workflows',       one: 'Workflow',      icon: '🔁', color: '#a855f7', desc: 'Enchaînements automatisés (hooks, CI, pipelines).' },
  { key: 'knowledge', label: 'Connaissance',    one: 'Connaissance',  icon: '📚', color: '#eab308', desc: 'Contexte projet partagé avec l\'IA.' },
  { key: 'memory',    label: 'Mémoire',         one: 'Mémoire',       icon: '🧠', color: '#f59e0b', desc: 'Instructions chargées à chaque session.' },
  { key: 'config',    label: 'Configurations',  one: 'Configuration', icon: '⚙️', color: '#64748b', desc: 'Réglages, permissions, hooks.' },
  { key: 'mcp',       label: 'Serveurs MCP',    one: 'Serveur MCP',   icon: '🔌', color: '#06b6d4', desc: 'Serveurs MCP déclarés et leurs outils.' },
  { key: 'tool',      label: 'Outils',          one: 'Outil',         icon: '🔧', color: '#f97316', desc: 'Outils référencés par les agents et commandes.' },
  { key: 'document',  label: 'Documents',       one: 'Document',      icon: '📄', color: '#94a3b8', desc: 'Documents rattachés (design, notes, décisions).' },
  { key: 'code',      label: 'Code source',     one: 'Code',          icon: '📁', color: '#38bdf8', desc: 'Fichiers de code réellement cités par les entités IA.' },
];

const KIND_BY_KEY = new Map(KINDS.map((k) => [k.key, k]));
function kindMeta(key) {
  return KIND_BY_KEY.get(key) || { key, label: key, icon: '•', color: '#94a3b8', desc: '' };
}

// ----- Écosystèmes sources (vision §Sources Supportées) --------------------
// `status: 'v1'` = adaptateur livré ; 'planned' = prévu (affiché en grisé dans
// le tableau de bord, pour que l'utilisateur sache ce que l'outil ne voit pas
// encore plutôt que de croire que le projet n'a rien).
const SOURCES = [
  { id: 'claude',   label: 'Claude Code',    icon: '🟣', color: '#d97757', status: 'v1' },
  { id: 'openspec', label: 'OpenSpec',       icon: '📘', color: '#14b8a6', status: 'v1' },
  { id: 'cursor',   label: 'Cursor',         icon: '🖱️', color: '#3b82f6', status: 'v2' },
  { id: 'copilot',  label: 'GitHub Copilot', icon: '🐙', color: '#6e7681', status: 'v2' },
  { id: 'roo',      label: 'Roo Code',       icon: '🦘', color: '#f59e0b', status: 'v2' },
  { id: 'windsurf', label: 'Windsurf',       icon: '🌊', color: '#0ea5e9', status: 'v2' },
  { id: 'mcp',      label: 'MCP universel',  icon: '🔌', color: '#06b6d4', status: 'v2' },
  { id: 'git',      label: 'Git',            icon: '🌿', color: '#84cc16', status: 'planned' },
];

const SOURCE_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));
function sourceMeta(id) {
  return SOURCE_BY_ID.get(id) || { id, label: id, icon: '•', color: '#94a3b8', status: 'unknown' };
}

// ----- Fabrique d'entités --------------------------------------------------
// Contrat unique produit par TOUS les adaptateurs.
//
//   source      identifiant de l'écosystème d'origine ('claude', 'openspec'…)
//   kind        clé d'entité universelle (voir KINDS)
//   name        nom lisible
//   description résumé d'une ligne
//   file        chemin ABSOLU du fichier porteur (optionnel : entité dérivée)
//   parent      id de l'entité conteneur (Spec → Requirement, Change → Task)
//   meta        badges [{k, v}]
//   outline     plan [{level, text}]
//   links       indices de liaison bruts, résolus plus tard par core/graph :
//                 files   chemins relatifs cités en Markdown
//                 wiki    références [[nom]]
//                 tools   noms d'outils (allowed-tools…)
//                 code    chemins de fichiers cités en code inline
//                 targets ids d'entités visés explicitement
//   content     contenu complet affiché dans la fiche détail
//   badges      étiquettes d'état ({text, tone}) : archivé, en cours…
//   status      état de cycle de vie, quand la notion existe pour ce type
//               (change OpenSpec) : proposed | active | done | archived
function makeEntity(ctx, e) {
  const rel = e.file ? relFrom(ctx.root, e.file) : null;
  const id = e.id || (e.source + ':' + e.kind + ':' + slugify(e.slug || e.name));
  return {
    id,
    source: e.source,
    kind: e.kind,
    name: e.name,
    description: e.description || 'Aucune description.',
    path: rel,
    file: e.file || null,
    // Date de dernière modification du fichier porteur : seule source de
    // chronologie disponible sans dépendre de Git (adaptateur prévu en V2).
    mtime: e.file ? mtimeOf(e.file) : null,
    parent: e.parent || null,
    meta: e.meta || [],
    outline: e.outline || [],
    badges: e.badges || [],
    status: e.status || null,
    // `tone` résume l'urgence de l'entité pour l'affichage : la pire de ses
    // étiquettes. Calculé ici pour que toutes les vues colorent pareil.
    tone: worstTone(e.badges),
    links: {
      files: (e.links && e.links.files) || [],
      wiki: (e.links && e.links.wiki) || [],
      tools: (e.links && e.links.tools) || [],
      code: (e.links && e.links.code) || [],
      targets: (e.links && e.links.targets) || [],
    },
    content: e.content || '',
  };
}

// Un même serveur MCP déclaré dans plusieurs écosystèmes (ex. `.cursor/mcp.json`
// ET `mcp.yaml`) est une source classique de dérive : les deux copies finissent
// par diverger. On garde les deux entités — c'est le fait qu'il y en ait deux
// qui est l'information — mais on les signale.
function markCrossSourceDuplicates(entities) {
  const bySlug = new Map();
  for (const e of entities) {
    if (e.kind !== 'mcp') continue;
    const key = String(e.name).toLowerCase();
    if (!bySlug.has(key)) bySlug.set(key, []);
    bySlug.get(key).push(e);
  }
  for (const group of bySlug.values()) {
    const sources = new Set(group.map((e) => e.source));
    if (sources.size < 2) continue;
    for (const e of group) {
      const others = [...sources].filter((s) => s !== e.source).map((s) => sourceMeta(s).label);
      e.badges = [...(e.badges || []),
        { text: 'aussi déclaré : ' + others.join(', '), tone: 'warn' }];
    }
  }
}

// Ordre de gravité : ce qui doit attirer l'œil en premier.
const TONE_RANK = { danger: 0, warn: 1, ok: 2, info: 3, muted: 4 };
function worstTone(badges) {
  let best = null;
  for (const b of badges || []) {
    const t = b && b.tone;
    if (!t || TONE_RANK[t] === undefined) continue;
    if (best === null || TONE_RANK[t] < TONE_RANK[best]) best = t;
  }
  return best;
}

// Statuts de cycle de vie et leur couleur, partagés par toutes les vues.
const STATUSES = [
  { key: 'proposed', label: 'Proposé',  color: '#64748b' },
  { key: 'planned',  label: 'Planifié', color: '#0ea5e9' },
  { key: 'active',   label: 'En cours', color: '#f59e0b' },
  { key: 'done',     label: 'Terminé',  color: '#22c55e' },
  { key: 'archived', label: 'Archivé',  color: '#6b7280' },
];

// ----- Assemblage du modèle final ------------------------------------------
// `scan` vient de core/registry, `graph` de core/graph, `trees` de core/explorer.
function buildModel(ctx, scan, graph, trees) {
  markCrossSourceDuplicates(scan.entities);
  // Des badges ont pu être ajoutés après la fabrication des entités : le ton
  // doit être recalculé, sinon un doublon MCP ne serait pas mis en évidence.
  for (const e of scan.entities) e.tone = worstTone(e.badges);

  const byKind = new Map();
  const bySource = new Map();
  for (const e of scan.entities) {
    byKind.set(e.kind, (byKind.get(e.kind) || 0) + 1);
    bySource.set(e.source, (bySource.get(e.source) || 0) + 1);
  }

  // On n'expose que les types réellement présents : un tableau de bord rempli
  // de zéros n'apprend rien.
  const kinds = KINDS.filter((k) => byKind.has(k.key))
    .map((k) => ({ ...k, count: byKind.get(k.key) }));

  const sources = SOURCES.map((s) => ({
    ...s,
    detected: scan.detected.has(s.id),
    roots: scan.roots.get(s.id) || [],
    count: bySource.get(s.id) || 0,
  }));

  // Dictionnaire de TOUS les types (pas seulement ceux présents) : le graphe
  // crée des nœuds dérivés (outils) dont le type peut n'avoir aucune entité.
  const kindDict = {};
  for (const k of KINDS) kindDict[k.key] = { label: k.label, one: k.one, icon: k.icon, color: k.color };

  return {
    project: path.basename(ctx.root) || 'projet',
    root: ctx.root,
    generatedAt: new Date().toISOString(),
    sources,
    kinds,
    kindDict,
    statuses: STATUSES,
    entities: scan.entities,
    graph,
    trees,
    totals: {
      entities: scan.entities.length,
      sources: sources.filter((s) => s.detected).length,
      edges: graph.edges.length,
      kinds: kinds.length,
    },
  };
}

// ===== core/mcp.mjs =====
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





// `seen` évite qu'un même serveur déclaré dans deux fichiers d'un même
// écosystème produise deux entités avec le même identifiant.
function mcpEntitiesFrom(ctx, file, sourceId, seen) {
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

// ===== plugins/claude/index.mjs =====
// plugins/claude/index.mjs — adaptateur Claude Code.
//
// Sources lues : .claude/ (skills, commands, agents, rules, settings),
// CLAUDE.md (mémoire), .mcp.json (serveurs MCP).
// Produit uniquement des entités du modèle universel — aucun rendu ici.







const CLAUDE_SOURCE = 'claude';

function clDir(ctx) { return path.join(ctx.root, '.claude'); }

function clDetect(ctx) {
  const found = [];
  if (isDir(clDir(ctx))) found.push('.claude');
  if (isFile(path.join(ctx.root, 'CLAUDE.md'))) found.push('CLAUDE.md');
  for (const f of ['.mcp.json']) {
    if (isFile(path.join(ctx.root, f))) found.push(f);
  }
  return found;
}

function clScan(ctx) {
  return [
    ...clSkills(ctx), ...clCommands(ctx), ...clAgents(ctx),
    ...clRules(ctx), ...clMemory(ctx), ...clSettings(ctx), ...clMcp(ctx),
  ];
}

// Normalise `allowed-tools` / `tools` : "Bash(git:*), Read" → ['Bash', 'Read'].
function clTools(raw) {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : String(raw).split(',');
  const out = [];
  for (const item of list) {
    const name = String(item).split('(')[0].trim();
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}

// ----- Skills : .claude/skills/<nom>/SKILL.md ------------------------------
function clSkills(ctx) {
  const base = path.join(clDir(ctx), 'skills');
  const out = [];
  for (const name of listSubdirs(base)) {
    const file = path.join(base, name, 'SKILL.md');
    if (!isFile(file)) continue;
    const { data, body } = parseFrontmatter(read(file));
    const attached = listDir(path.join(base, name)).filter((f) => f !== 'SKILL.md');
    out.push(makeEntity(ctx, {
      source: CLAUDE_SOURCE, kind: 'skill', slug: name,
      name: data.name || name,
      description: data.description || firstParagraph(body),
      file,
      meta: buildMeta({
        'modèle': data.model,
        'outils': clTools(data['allowed-tools'] || data.tools),
        'fichiers joints': attached.length ? attached.join(', ') : null,
      }),
      links: {
        files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body),
        tools: clTools(data['allowed-tools'] || data.tools),
      },
      content: clip(body),
    }));
  }
  return out;
}

// ----- Commandes : .claude/commands/**/*.md --------------------------------
function clCommands(ctx) {
  const base = path.join(clDir(ctx), 'commands');
  if (!isDir(base)) return [];
  const out = [];
  walk(base, (file) => {
    const { data, body } = parseFrontmatter(read(file));
    const rel = path.relative(base, file).split(path.sep).join('/');
    // Convention Claude Code : les sous-dossiers deviennent un espace de noms.
    const invoke = '/' + rel.replace(/\.md$/, '').replace(/\//g, ':');
    out.push(makeEntity(ctx, {
      source: CLAUDE_SOURCE, kind: 'command', slug: rel.replace(/\.md$/, ''),
      name: data.name || invoke,
      description: data.description || firstParagraph(body),
      file,
      meta: buildMeta({
        'commande': invoke,
        'outils autorisés': clTools(data['allowed-tools']),
        'modèle': data.model,
        'catégorie': data.category,
      }),
      links: {
        files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body),
        tools: clTools(data['allowed-tools']),
      },
      content: clip(body),
    }));
  }, '.md');
  return out;
}

// ----- Agents : .claude/agents/*.md ----------------------------------------
function clAgents(ctx) {
  const base = path.join(clDir(ctx), 'agents');
  const out = [];
  for (const f of listFiles(base, '.md')) {
    const file = path.join(base, f);
    const { data, body } = parseFrontmatter(read(file));
    out.push(makeEntity(ctx, {
      source: CLAUDE_SOURCE, kind: 'agent', slug: f.replace(/\.md$/, ''),
      name: data.name || f.replace(/\.md$/, ''),
      description: data.description || firstParagraph(body),
      file,
      meta: buildMeta({ 'modèle': data.model, 'outils': clTools(data.tools), 'isolation': data.isolation }),
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body), tools: clTools(data.tools) },
      content: clip(body),
    }));
  }
  return out;
}

// ----- Règles : .claude/rules/*.md -----------------------------------------
function clRules(ctx) {
  const base = path.join(clDir(ctx), 'rules');
  const out = [];
  for (const f of listFiles(base, '.md')) {
    const file = path.join(base, f);
    const body = read(file);
    const hs = headings(body);
    out.push(makeEntity(ctx, {
      source: CLAUDE_SOURCE, kind: 'rule', slug: f.replace(/\.md$/, ''),
      name: firstHeading(body) || f.replace(/\.md$/, ''),
      description: firstParagraph(body) || 'Convention de projet.',
      file,
      meta: buildMeta({ 'sections': hs.length }),
      outline: hs.slice(1),
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));
  }
  return out;
}

// ----- Mémoire : CLAUDE.md (racine et .claude/) ----------------------------
function clMemory(ctx) {
  const out = [];
  for (const rel of ['CLAUDE.md', path.join('.claude', 'CLAUDE.md')]) {
    const file = path.join(ctx.root, rel);
    if (!isFile(file)) continue;
    const body = read(file);
    const hs = headings(body, 30);
    out.push(makeEntity(ctx, {
      source: CLAUDE_SOURCE, kind: 'memory', slug: rel,
      name: rel.split(path.sep).join('/'),
      description: firstParagraph(body) || 'Instructions chargées à chaque session.',
      file,
      meta: buildMeta({ 'sections': hs.length }),
      outline: hs,
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));
  }
  return out;
}

// ----- Réglages : .claude/settings*.json -----------------------------------
// Les hooks sont remontés en Workflow : ce sont des automatismes déclenchés,
// pas de la simple configuration — et c'est ce qui intéresse la gouvernance.
function clSettings(ctx) {
  const out = [];
  for (const f of ['settings.json', 'settings.local.json']) {
    const file = path.join(clDir(ctx), f);
    if (!isFile(file)) continue;
    const json = readJson(file);
    const hookEvents = json && json.hooks ? Object.keys(json.hooks) : [];
    const allow = (json && json.permissions && json.permissions.allow) || [];
    const deny = (json && json.permissions && json.permissions.deny) || [];

    out.push(makeEntity(ctx, {
      source: CLAUDE_SOURCE, kind: 'config', slug: f,
      name: f,
      description: json
        ? [
            hookEvents.length ? hookEvents.length + ' événement(s) de hook' : 'aucun hook',
            allow.length ? allow.length + ' permission(s) autorisée(s)' : null,
            deny.length ? deny.length + ' refusée(s)' : null,
          ].filter(Boolean).join(' · ')
        : 'Fichier de réglages illisible (JSON invalide).',
      file,
      meta: buildMeta({
        'hooks': hookEvents.join(', ') || null,
        'permissions allow': allow.length || null,
        'permissions deny': deny.length || null,
      }),
      badges: json ? [] : [{ text: 'JSON invalide', tone: 'danger' }],
      // Les permissions `mcp__serveur__outil` relient les réglages aux serveurs MCP.
      links: { tools: clPermTools(allow) },
      content: clip('```json\n' + (json ? JSON.stringify(json, null, 2) : read(file)) + '\n```'),
    }));

    for (const ev of hookEvents) {
      const matchers = json.hooks[ev];
      const cmds = [];
      for (const m of (Array.isArray(matchers) ? matchers : [])) {
        for (const h of (m && Array.isArray(m.hooks) ? m.hooks : [])) {
          if (h && h.command) cmds.push(String(h.command));
        }
      }
      out.push(makeEntity(ctx, {
        source: CLAUDE_SOURCE, kind: 'workflow', slug: f + '-' + ev,
        name: ev,
        description: cmds.length
          ? cmds.length + ' commande(s) déclenchée(s) sur l\'événement ' + ev + '.'
          : 'Hook déclaré sur l\'événement ' + ev + ', sans commande lisible.',
        file,
        meta: buildMeta({ 'événement': ev, 'déclaré dans': f, 'commandes': cmds.length }),
        content: clip('```json\n' + JSON.stringify(matchers, null, 2) + '\n```'),
      }));
    }
  }
  return out;
}

// `mcp__github__create_issue` → nom d'outil MCP exploitable dans le graphe.
function clPermTools(allow) {
  const out = [];
  for (const p of allow) {
    const m = String(p).match(/^mcp__([a-z0-9_-]+)__([a-z0-9_-]+)/i);
    if (m && !out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

// ----- Serveurs MCP : .mcp.json / .claude/mcp.json -------------------------
// Seuls les emplacements PROPRES à Claude Code sont lus ici. Un `mcp.json`
// générique à la racine relève de l'adaptateur MCP universel — sinon le même
// serveur serait compté deux fois.
function clMcp(ctx) {
  const seen = new Set();
  return [
    ...mcpEntitiesFrom(ctx, path.join(ctx.root, '.mcp.json'), CLAUDE_SOURCE, seen),
    ...mcpEntitiesFrom(ctx, path.join(clDir(ctx), 'mcp.json'), CLAUDE_SOURCE, seen),
  ];
}

const claudePlugin = { id: CLAUDE_SOURCE, detect: clDetect, scan: clScan };

// ===== plugins/openspec/index.mjs =====
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

const openspecPlugin = { id: OPENSPEC_SOURCE, detect: osDetect, scan: osScan };

// ===== plugins/cursor/index.mjs =====
// plugins/cursor/index.mjs — adaptateur Cursor.
//
// Sources lues :
//   .cursor/rules/**/*.mdc   règles modernes (frontmatter description/globs/alwaysApply)
//   .cursorrules             règle héritée, à la racine (format legacy)
//   .cursor/commands/*.md    commandes personnalisées
//   .cursor/mcp.json         serveurs MCP







const CURSOR_SOURCE = 'cursor';

function cuDir(ctx) { return path.join(ctx.root, '.cursor'); }

function cuDetect(ctx) {
  const found = [];
  if (isDir(cuDir(ctx))) found.push('.cursor');
  if (isFile(path.join(ctx.root, '.cursorrules'))) found.push('.cursorrules');
  return found;
}

function cuScan(ctx) {
  return [...cuRules(ctx), ...cuLegacyRules(ctx), ...cuCommands(ctx), ...cuMcp(ctx)];
}

// `.mdc` : Markdown + frontmatter. `alwaysApply: true` = règle chargée à chaque
// requête ; sinon elle est attachée par `globs` ou invoquée par description.
function cuRules(ctx) {
  const base = path.join(cuDir(ctx), 'rules');
  if (!isDir(base)) return [];
  const out = [];
  const collect = (file) => {
    const { data, body } = parseFrontmatter(read(file));
    const globs = Array.isArray(data.globs) ? data.globs.join(', ') : data.globs;
    const always = data.alwaysApply === true || data.alwaysApply === 'true';
    out.push(makeEntity(ctx, {
      source: CURSOR_SOURCE, kind: 'rule',
      slug: path.relative(base, file).replace(/\.[^.]+$/, ''),
      name: data.description || firstHeading(body) || path.basename(file).replace(/\.[^.]+$/, ''),
      description: firstParagraph(body) || data.description || 'Règle Cursor.',
      file,
      meta: buildMeta({
        'portée': always ? 'toujours appliquée' : (globs ? 'fichiers ciblés' : 'sur demande'),
        'globs': globs,
      }),
      badges: always ? [{ text: 'toujours active', tone: 'info' }] : [],
      outline: headings(body).slice(1),
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));
  };
  walk(base, collect, '.mdc');
  walk(base, collect, '.md');
  return out;
}

// `.cursorrules` : format historique, remplacé par `.cursor/rules/`. Sa présence
// aux côtés du nouveau format est un signal de dette de configuration.
function cuLegacyRules(ctx) {
  const file = path.join(ctx.root, '.cursorrules');
  if (!isFile(file)) return [];
  const body = read(file);
  const modern = isDir(path.join(cuDir(ctx), 'rules'));
  return [makeEntity(ctx, {
    source: CURSOR_SOURCE, kind: 'rule', slug: 'cursorrules-legacy',
    name: '.cursorrules',
    description: firstParagraph(body) || 'Règles Cursor au format historique.',
    file,
    meta: buildMeta({ 'format': 'hérité (remplacé par .cursor/rules/)' }),
    badges: modern
      ? [{ text: 'format hérité — doublon', tone: 'warn' }]
      : [{ text: 'format hérité', tone: 'muted' }],
    outline: headings(body),
    links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
    content: clip(body),
  })];
}

function cuCommands(ctx) {
  const base = path.join(cuDir(ctx), 'commands');
  if (!isDir(base)) return [];
  const out = [];
  walk(base, (file) => {
    const { data, body } = parseFrontmatter(read(file));
    const name = path.relative(base, file).replace(/\.md$/, '').split(path.sep).join('/');
    out.push(makeEntity(ctx, {
      source: CURSOR_SOURCE, kind: 'command', slug: name,
      name: '/' + name,
      description: data.description || firstParagraph(body) || 'Commande Cursor.',
      file,
      meta: buildMeta({ 'commande': '/' + name }),
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));
  }, '.md');
  return out;
}

function cuMcp(ctx) {
  return mcpEntitiesFrom(ctx, path.join(cuDir(ctx), 'mcp.json'), CURSOR_SOURCE, new Set());
}

const cursorPlugin = { id: CURSOR_SOURCE, detect: cuDetect, scan: cuScan };

// ===== plugins/copilot/index.mjs =====
// plugins/copilot/index.mjs — adaptateur GitHub Copilot.
//
// Sources lues :
//   .github/copilot-instructions.md        instructions dépôt (chargées toujours)
//   .github/instructions/*.instructions.md instructions ciblées (frontmatter applyTo)
//   .github/prompts/*.prompt.md            prompts réutilisables
//   .github/chatmodes/*.chatmode.md        modes de chat (persona + outils)
//
// Note : ces chemins sont une convention DE COPILOT. Ils fonctionnent quel que
// soit l'hébergeur du dépôt (GitHub, GitLab, Forgejo…).






const COPILOT_SOURCE = 'copilot';

function coDir(ctx) { return path.join(ctx.root, '.github'); }

// `.github/` existe dans énormément de dépôts sans le moindre fichier Copilot :
// on n'active l'adaptateur que si un artefact Copilot est réellement présent.
function coDetect(ctx) {
  const base = coDir(ctx);
  if (!isDir(base)) return [];
  const found = [];
  if (isFile(path.join(base, 'copilot-instructions.md'))) found.push('.github/copilot-instructions.md');
  for (const d of ['instructions', 'prompts', 'chatmodes']) {
    if (isDir(path.join(base, d))) found.push('.github/' + d);
  }
  return found;
}

function coScan(ctx) {
  return [
    ...coInstructions(ctx), ...coScopedInstructions(ctx),
    ...coPrompts(ctx), ...coChatModes(ctx),
  ];
}

function coInstructions(ctx) {
  const file = path.join(coDir(ctx), 'copilot-instructions.md');
  if (!isFile(file)) return [];
  const body = read(file);
  const hs = headings(body, 30);
  return [makeEntity(ctx, {
    source: COPILOT_SOURCE, kind: 'memory', slug: 'copilot-instructions',
    name: '.github/copilot-instructions.md',
    description: firstParagraph(body) || 'Instructions dépôt fournies à Copilot à chaque requête.',
    file,
    meta: buildMeta({ 'sections': hs.length, 'portée': 'tout le dépôt' }),
    outline: hs,
    links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
    content: clip(body),
  })];
}

// `applyTo` restreint l'instruction à un motif de fichiers ; sans lui, elle
// s'applique partout — information de gouvernance utile.
function coScopedInstructions(ctx) {
  const base = path.join(coDir(ctx), 'instructions');
  const out = [];
  for (const f of listFiles(base, '.md')) {
    const file = path.join(base, f);
    const { data, body } = parseFrontmatter(read(file));
    const applyTo = Array.isArray(data.applyTo) ? data.applyTo.join(', ') : data.applyTo;
    out.push(makeEntity(ctx, {
      source: COPILOT_SOURCE, kind: 'rule', slug: f.replace(/\.md$/, ''),
      name: data.description || firstHeading(body) || f.replace(/\.instructions\.md$|\.md$/, ''),
      description: firstParagraph(body) || data.description || 'Instruction Copilot ciblée.',
      file,
      meta: buildMeta({ 'applyTo': applyTo || '**' }),
      badges: applyTo ? [] : [{ text: 'portée globale', tone: 'info' }],
      outline: headings(body).slice(1),
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));
  }
  return out;
}

function coPrompts(ctx) {
  const base = path.join(coDir(ctx), 'prompts');
  const out = [];
  for (const f of listFiles(base, '.md')) {
    const file = path.join(base, f);
    const { data, body } = parseFrontmatter(read(file));
    const name = f.replace(/\.prompt\.md$|\.md$/, '');
    out.push(makeEntity(ctx, {
      source: COPILOT_SOURCE, kind: 'prompt', slug: name,
      name: '/' + name,
      description: data.description || firstParagraph(body) || 'Prompt Copilot réutilisable.',
      file,
      meta: buildMeta({
        'commande': '/' + name,
        'mode': data.mode,
        'modèle': data.model,
        'outils': Array.isArray(data.tools) ? data.tools.join(', ') : data.tools,
      }),
      links: {
        files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body),
        tools: Array.isArray(data.tools) ? data.tools : (data.tools ? [data.tools] : []),
      },
      content: clip(body),
    }));
  }
  return out;
}

// Un chat mode définit une persona et un jeu d'outils : c'est l'équivalent
// Copilot d'un agent, on le modélise comme tel.
function coChatModes(ctx) {
  const base = path.join(coDir(ctx), 'chatmodes');
  const out = [];
  for (const f of listFiles(base, '.md')) {
    const file = path.join(base, f);
    const { data, body } = parseFrontmatter(read(file));
    const name = f.replace(/\.chatmode\.md$|\.md$/, '');
    const tools = Array.isArray(data.tools) ? data.tools : (data.tools ? [data.tools] : []);
    out.push(makeEntity(ctx, {
      source: COPILOT_SOURCE, kind: 'agent', slug: name,
      name,
      description: data.description || firstParagraph(body) || 'Mode de chat Copilot.',
      file,
      meta: buildMeta({ 'modèle': data.model, 'outils': tools }),
      links: {
        files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body), tools,
      },
      content: clip(body),
    }));
  }
  return out;
}

const copilotPlugin = { id: COPILOT_SOURCE, detect: coDetect, scan: coScan };

// ===== plugins/roo/index.mjs =====
// plugins/roo/index.mjs — adaptateur Roo Code.
//
// Sources lues :
//   .roo/rules/**/*.md        règles générales
//   .roo/rules-<mode>/**/*.md règles propres à un mode
//   .roorules                 règle héritée, à la racine
//   .roomodes                 modes personnalisés (YAML ou JSON)
//   .roo/mcp.json             serveurs MCP







const ROO_SOURCE = 'roo';

function roDir(ctx) { return path.join(ctx.root, '.roo'); }

function roDetect(ctx) {
  const found = [];
  if (isDir(roDir(ctx))) found.push('.roo');
  if (isFile(path.join(ctx.root, '.roorules'))) found.push('.roorules');
  if (isFile(path.join(ctx.root, '.roomodes'))) found.push('.roomodes');
  return found;
}

function roScan(ctx) {
  return [...roRules(ctx), ...roLegacyRules(ctx), ...roModes(ctx), ...roMcp(ctx)];
}

// Roo range les règles dans `rules/` (générales) et `rules-<mode>/` (par mode) :
// on conserve le mode dans les métadonnées, c'est ce qui explique leur portée.
function roRules(ctx) {
  const base = roDir(ctx);
  if (!isDir(base)) return [];
  const out = [];
  for (const dir of listDir(base)) {
    if (dir !== 'rules' && !dir.startsWith('rules-')) continue;
    const full = path.join(base, dir);
    if (!isDir(full)) continue;
    const mode = dir === 'rules' ? null : dir.slice('rules-'.length);
    walk(full, (file) => {
      const body = read(file);
      out.push(makeEntity(ctx, {
        source: ROO_SOURCE, kind: 'rule',
        slug: dir + '-' + path.relative(full, file).replace(/\.md$/, ''),
        name: firstHeading(body) || path.basename(file, '.md'),
        description: firstParagraph(body) || 'Règle Roo Code.',
        file,
        meta: buildMeta({ 'mode': mode || 'tous', 'portée': mode ? 'mode ' + mode : 'globale' }),
        outline: headings(body).slice(1),
        links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
        content: clip(body),
      }));
    }, '.md');
  }
  return out;
}

function roLegacyRules(ctx) {
  const file = path.join(ctx.root, '.roorules');
  if (!isFile(file)) return [];
  const body = read(file);
  const modern = isDir(path.join(roDir(ctx), 'rules'));
  return [makeEntity(ctx, {
    source: ROO_SOURCE, kind: 'rule', slug: 'roorules-legacy',
    name: '.roorules',
    description: firstParagraph(body) || 'Règles Roo au format historique.',
    file,
    meta: buildMeta({ 'format': 'hérité (remplacé par .roo/rules/)' }),
    badges: modern
      ? [{ text: 'format hérité — doublon', tone: 'warn' }]
      : [{ text: 'format hérité', tone: 'muted' }],
    outline: headings(body),
    links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
    content: clip(body),
  })];
}

// `.roomodes` est du YAML (ou du JSON) décrivant des modes personnalisés :
// chacun est un exécutant spécialisé → entité Agent du modèle universel.
function roModes(ctx) {
  const file = path.join(ctx.root, '.roomodes');
  if (!isFile(file)) return [];
  const raw = read(file);
  let config = null;
  try { config = JSON.parse(raw); } catch { config = parseYamlLite(raw); }

  const modes = config && Array.isArray(config.customModes) ? config.customModes : null;
  if (!modes) {
    return [makeEntity(ctx, {
      source: ROO_SOURCE, kind: 'config', slug: 'roomodes',
      name: '.roomodes',
      description: 'Modes personnalisés déclarés, mais le format n\'a pas pu être analysé.',
      file,
      badges: [{ text: 'format non reconnu', tone: 'warn' }],
      content: clip('```\n' + raw.slice(0, 4000) + '\n```'),
    })];
  }

  return modes.filter(Boolean).map((mode) => {
    // `groups` liste les familles d'outils autorisées ; un groupe peut être une
    // simple chaîne ou une paire [nom, options] — on ne garde que le nom.
    const groups = (Array.isArray(mode.groups) ? mode.groups : [])
      .map((g) => (Array.isArray(g) ? g[0] : g))
      .filter((g) => typeof g === 'string');
    const role = String(mode.roleDefinition || mode.customInstructions || '');
    return makeEntity(ctx, {
      source: ROO_SOURCE, kind: 'agent', slug: String(mode.slug || mode.name || 'mode'),
      name: mode.name || mode.slug || 'mode',
      description: firstParagraph(role) || 'Mode personnalisé Roo Code.',
      file,
      meta: buildMeta({ 'slug': mode.slug, 'groupes d\'outils': groups, 'modèle': mode.model }),
      links: { tools: groups, code: findCodePaths(role) },
      content: clip(role || '```json\n' + JSON.stringify(mode, null, 2) + '\n```'),
    });
  });
}

function roMcp(ctx) {
  return mcpEntitiesFrom(ctx, path.join(roDir(ctx), 'mcp.json'), ROO_SOURCE, new Set());
}

const rooPlugin = { id: ROO_SOURCE, detect: roDetect, scan: roScan };

// ===== plugins/windsurf/index.mjs =====
// plugins/windsurf/index.mjs — adaptateur Windsurf.
//
// Sources lues :
//   .windsurf/rules/**/*.md      règles (frontmatter trigger/globs)
//   .windsurfrules               règle héritée, à la racine
//   .windsurf/workflows/*.md     workflows invocables par /nom
//   .windsurf/mcp_config.json    serveurs MCP







const WINDSURF_SOURCE = 'windsurf';

function wiDir(ctx) { return path.join(ctx.root, '.windsurf'); }

function wiDetect(ctx) {
  const found = [];
  if (isDir(wiDir(ctx))) found.push('.windsurf');
  if (isFile(path.join(ctx.root, '.windsurfrules'))) found.push('.windsurfrules');
  return found;
}

function wiScan(ctx) {
  return [...wiRules(ctx), ...wiLegacyRules(ctx), ...wiWorkflows(ctx), ...wiMcp(ctx)];
}

// `trigger` vaut always_on / glob / model_decision / manual : c'est ce qui
// détermine si la règle pèse sur chaque requête.
function wiRules(ctx) {
  const base = path.join(wiDir(ctx), 'rules');
  if (!isDir(base)) return [];
  const out = [];
  walk(base, (file) => {
    const { data, body } = parseFrontmatter(read(file));
    const trigger = data.trigger || (data.globs ? 'glob' : 'manual');
    const globs = Array.isArray(data.globs) ? data.globs.join(', ') : data.globs;
    out.push(makeEntity(ctx, {
      source: WINDSURF_SOURCE, kind: 'rule',
      slug: path.relative(base, file).replace(/\.md$/, ''),
      name: data.description || firstHeading(body) || path.basename(file, '.md'),
      description: firstParagraph(body) || data.description || 'Règle Windsurf.',
      file,
      meta: buildMeta({ 'déclencheur': trigger, 'globs': globs }),
      badges: trigger === 'always_on' ? [{ text: 'toujours active', tone: 'info' }] : [],
      outline: headings(body).slice(1),
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));
  }, '.md');
  return out;
}

function wiLegacyRules(ctx) {
  const file = path.join(ctx.root, '.windsurfrules');
  if (!isFile(file)) return [];
  const body = read(file);
  const modern = isDir(path.join(wiDir(ctx), 'rules'));
  return [makeEntity(ctx, {
    source: WINDSURF_SOURCE, kind: 'rule', slug: 'windsurfrules-legacy',
    name: '.windsurfrules',
    description: firstParagraph(body) || 'Règles Windsurf au format historique.',
    file,
    meta: buildMeta({ 'format': 'hérité (remplacé par .windsurf/rules/)' }),
    badges: modern
      ? [{ text: 'format hérité — doublon', tone: 'warn' }]
      : [{ text: 'format hérité', tone: 'muted' }],
    outline: headings(body),
    links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
    content: clip(body),
  })];
}

// Les workflows Windsurf sont des séquences d'étapes invocables par `/nom` :
// enchaînement automatisé → entité Workflow.
function wiWorkflows(ctx) {
  const base = path.join(wiDir(ctx), 'workflows');
  if (!isDir(base)) return [];
  const out = [];
  walk(base, (file) => {
    const { data, body } = parseFrontmatter(read(file));
    const name = path.basename(file, '.md');
    const steps = (body.match(/^\s*\d+\.\s+/gm) || []).length;
    out.push(makeEntity(ctx, {
      source: WINDSURF_SOURCE, kind: 'workflow', slug: name,
      name: '/' + name,
      description: data.description || firstParagraph(body) || 'Workflow Windsurf.',
      file,
      meta: buildMeta({ 'commande': '/' + name, 'étapes': steps || null }),
      outline: headings(body).slice(1),
      links: { files: findMdLinks(body), wiki: findWikiLinks(body), code: findCodePaths(body) },
      content: clip(body),
    }));
  }, '.md');
  return out;
}

function wiMcp(ctx) {
  const seen = new Set();
  return [
    ...mcpEntitiesFrom(ctx, path.join(wiDir(ctx), 'mcp_config.json'), WINDSURF_SOURCE, seen),
    ...mcpEntitiesFrom(ctx, path.join(wiDir(ctx), 'mcp.json'), WINDSURF_SOURCE, seen),
  ];
}

const windsurfPlugin = { id: WINDSURF_SOURCE, detect: wiDetect, scan: wiScan };

// ===== plugins/mcp/index.mjs =====
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

const mcpPlugin = { id: MCP_SOURCE, detect: mcDetect, scan: mcScan };

// ===== core/registry.mjs =====
// core/registry.mjs — registre des adaptateurs (architecture plug-in).
//
// Contrat d'un plugin :
//   {
//     id      : identifiant d'écosystème, doit exister dans model.SOURCES
//     detect  : (ctx) => string[]   dossiers/fichiers racine trouvés (vide = absent)
//     scan    : (ctx) => Entity[]   entités au format universel
//   }
//
// Le cœur n'appelle jamais un plugin nommément : ajouter un écosystème = ajouter
// une entrée dans PLUGINS, rien d'autre à modifier.









const PLUGINS = [
  claudePlugin, openspecPlugin, cursorPlugin,
  copilotPlugin, rooPlugin, windsurfPlugin, mcpPlugin,
];

function runPlugins(ctx) {
  const entities = [];
  const detected = new Set();
  const roots = new Map();
  const errors = [];

  for (const plugin of PLUGINS) {
    let found = [];
    try {
      found = plugin.detect(ctx) || [];
    } catch (err) {
      errors.push({ plugin: plugin.id, phase: 'detect', message: String(err && err.message || err) });
      continue;
    }
    if (!found.length) continue;

    detected.add(plugin.id);
    roots.set(plugin.id, found);

    // Un adaptateur qui échoue ne doit jamais faire tomber la carte entière :
    // on isole l'erreur et on continue avec les autres écosystèmes.
    try {
      for (const e of plugin.scan(ctx) || []) entities.push(e);
    } catch (err) {
      errors.push({ plugin: plugin.id, phase: 'scan', message: String(err && err.message || err) });
    }
  }

  // Ordre stable (source, type, nom) → sortie reproductible d'un run à l'autre.
  entities.sort((a, b) =>
    a.source.localeCompare(b.source) || a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));

  return { entities, detected, roots, errors };
}

// ===== core/graph.mjs =====
// core/graph.mjs — graphe transverse.
//
// C'est ici que se joue la valeur différenciante d'AI-MAP : relier des entités
// venues d'écosystèmes qui, sur le disque, s'ignorent complètement.
//
//   Requirement OpenSpec → Skill Claude → Outil MCP → Code source
//
// Types d'arêtes :
//   contains  conteneur → contenu      (Spec → Exigence, Change → Tâche)
//   delta     change → spécification   (quelle capacité ce change modifie)
//   ref       lien Markdown ou [[wiki]] résolu vers une entité connue
//   tool      entité → outil / serveur MCP déclaré
//   mention   citation nominative reconstruite depuis le contenu
//
// Chaque arête porte `cross: true` quand ses deux extrémités appartiennent à
// des écosystèmes différents — ce sont ces arêtes-là qui portent l'analyse
// d'impact transverse, tous types confondus.





// Types d'arêtes exposés à l'interface (ordre = ordre d'affichage des filtres).
const EDGE_TYPES = [
  { type: 'contains', label: 'Contient',    verb: 'contient',   color: '#94a3b8', dashed: false },
  { type: 'delta',    label: 'Impacte',     verb: 'impacte',    color: '#f43f5e', dashed: false },
  { type: 'ref',      label: 'Référence',   verb: 'référence',  color: '#64748b', dashed: false },
  { type: 'tool',     label: 'Utilise',     verb: 'utilise',    color: '#f97316', dashed: true },
  { type: 'mention',  label: 'Cite',        verb: 'cite',       color: '#6366f1', dashed: true },
  { type: 'code',     label: 'Code source', verb: 'touche',     color: '#0891b2', dashed: true },
];

// Extensions considérées comme du code. Sans cette liste, un `README.md` cité
// deviendrait un nœud « code », ce qui serait faux.
const CODE_EXT = new Set([
  'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'vue', 'svelte',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'kts', 'scala', 'swift', 'dart',
  'php', 'cs', 'c', 'h', 'cpp', 'hpp', 'lua', 'pl', 'r', 'ex', 'exs',
  'sh', 'bash', 'zsh', 'ps1', 'bat', 'sql',
  'json', 'yml', 'yaml', 'toml', 'ini', 'env', 'cfg', 'conf',
  'html', 'css', 'scss', 'less', 'gradle', 'tf', 'proto',
]);
const MAX_CODE_REFS_PER_ENTITY = 30;

// Une entité citée doit être « nommable » : trop court ou trop générique et on
// génère du bruit (« build », « test » apparaissent partout).
const MENTION_KINDS = new Set(['skill', 'command', 'agent', 'mcp', 'spec', 'change']);
const MAX_MENTIONS_PER_ENTITY = 12;

function buildGraph(ctx, entities) {
  const nodes = [];
  const edges = [];
  const seen = new Set();

  const byId = new Map();
  const byFile = new Map();   // fichier absolu normalisé → id d'entité conteneur
  const bySlug = new Map();   // nom / nom de fichier → id
  const byMcpName = new Map();
  const toolNodes = new Map();

  // `pairs` retient les couples déjà reliés, quel que soit le type : une
  // citation nominative n'apporte rien si un lien explicite existe déjà.
  const pairs = new Set();
  const pairKey = (a, b) => (a < b ? a + '\u0001' + b : b + '\u0001' + a);

  const sourceOfNode = new Map();

  const addEdge = (s, t, type) => {
    if (!s || !t || s === t) return;
    const key = s + '|' + t + '|' + type;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.add(pairKey(s, t));
    // `cross` = la relation franchit une frontière d'ÉCOSYSTÈME. Les nœuds
    // dérivés (outils, code source) sont exclus : ce ne sont pas des
    // écosystèmes, et les compter gonflerait l'indicateur sans rien dire.
    const ss = sourceOfNode.get(s);
    const ts = sourceOfNode.get(t);
    const derived = (x) => x === 'tool' || x === 'code';
    const cross = ss !== ts && !derived(ss) && !derived(ts);
    edges.push({ s, t, type, cross });
  };

  // ----- 1) Un nœud par entité --------------------------------------------
  for (const e of entities) {
    byId.set(e.id, e);
    sourceOfNode.set(e.id, e.source);
    nodes.push({
      id: e.id, label: e.name, kind: e.kind, source: e.source,
      kindColor: kindMeta(e.kind).color,
      sourceColor: sourceMeta(e.source).color,
      path: e.path || '',
    });

    // Le conteneur gagne l'index de fichier : plusieurs entités partagent un
    // même fichier (spec + ses exigences), on veut résoudre vers le parent.
    if (e.file) {
      const key = normPath(e.file);
      if (!e.parent || !byFile.has(key)) byFile.set(key, e.id);
    }
    for (const alias of aliasesOf(e)) {
      if (!bySlug.has(alias)) bySlug.set(alias, e.id);
    }
    if (e.kind === 'mcp') byMcpName.set(e.name.toLowerCase(), e.id);
  }

  // ----- 2) Arêtes structurelles déclarées par les adaptateurs -------------
  for (const e of entities) {
    if (e.parent && byId.has(e.parent)) addEdge(e.parent, e.id, 'contains');
    for (const target of e.links.targets) {
      if (byId.has(target)) addEdge(e.id, target, 'delta');
    }
  }

  // ----- 3) Liens Markdown et [[wiki]] -------------------------------------
  for (const e of entities) {
    if (!e.file) continue;
    const dir = path.dirname(e.file);
    for (const rel of e.links.files) {
      const hit = byFile.get(normPath(path.resolve(dir, rel)));
      if (hit) addEdge(e.id, hit, 'ref');
    }
    for (const w of e.links.wiki) {
      const hit = bySlug.get(w.toLowerCase());
      if (hit) addEdge(e.id, hit, 'ref');
    }
  }

  // ----- 4) Outils et serveurs MCP ----------------------------------------
  for (const e of entities) {
    for (const raw of e.links.tools) {
      const name = String(raw).trim();
      if (!name) continue;
      // Un outil qui correspond à un serveur MCP déclaré pointe vers ce
      // serveur plutôt que vers un nœud d'outil anonyme.
      const mcpHit = byMcpName.get(name.toLowerCase());
      if (mcpHit) { addEdge(e.id, mcpHit, 'tool'); continue; }

      const tid = 'tool:' + name;
      if (!toolNodes.has(tid)) {
        toolNodes.set(tid, true);
        sourceOfNode.set(tid, 'tool');
        nodes.push({
          id: tid, label: name, kind: 'tool', source: 'tool',
          kindColor: kindMeta('tool').color, sourceColor: kindMeta('tool').color, path: '',
        });
      }
      addEdge(e.id, tid, 'tool');
    }
  }

  // ----- 5) Code source ----------------------------------------------------
  // Dernière patte de la chaîne « Exigence → Skill → Outil MCP → Code ». Un
  // nœud n'est créé que si le fichier EXISTE vraiment : AI-MAP n'invente aucun
  // lien. Ces nœuds sont dérivés (comme les outils) et ne comptent donc pas
  // comme des entités — la carte ne se noie pas sous le code.
  const codeNodes = new Map();
  const rootKey = normPath(ctx.root);

  for (const e of entities) {
    if (!e.file) continue;
    const dir = path.dirname(e.file);
    let count = 0;
    for (const rel of [...e.links.code, ...e.links.files]) {
      if (count >= MAX_CODE_REFS_PER_ENTITY) break;

      // Relatif au fichier citant, sinon relatif à la racine du projet.
      let abs = path.resolve(dir, rel);
      if (!isFile(abs)) {
        abs = path.resolve(ctx.root, rel);
        if (!isFile(abs)) continue;
      }

      // Confinement : une référence `../../secret` ne doit jamais créer de nœud.
      const key = normPath(abs);
      if (key !== rootKey && !key.startsWith(rootKey + '/')) continue;

      // Déjà une entité IA (ex. .claude/settings.json) : pas de doublon.
      if (byFile.has(key)) continue;

      const relPath = relFrom(ctx.root, abs);
      const ext = path.extname(relPath).slice(1).toLowerCase();
      if (!CODE_EXT.has(ext)) continue;

      const cid = 'code:' + relPath;
      if (!codeNodes.has(cid)) {
        codeNodes.set(cid, true);
        sourceOfNode.set(cid, 'code');
        nodes.push({
          id: cid, label: path.basename(relPath), kind: 'code', source: 'code',
          kindColor: kindMeta('code').color, sourceColor: kindMeta('code').color,
          path: relPath,
        });
      }
      addEdge(e.id, cid, 'code');
      count++;
    }
  }

  // ----- 6) Citations nominatives ------------------------------------------
  // Beaucoup de liens réels ne sont jamais écrits comme des liens : un CLAUDE.md
  // qui cite `/build-desktop`, une exigence OpenSpec qui nomme une skill. On les
  // reconstruit en cherchant les noms d'entités distinctifs dans les contenus.
  // Celles qui franchissent une frontière d'écosystème portent `cross: true` et
  // constituent le fil « Exigence → Skill → Outil MCP → Code ».
  const mentionable = entities
    .filter((e) => MENTION_KINDS.has(e.kind))
    .map((e) => ({ id: e.id, name: String(e.name).toLowerCase(), patterns: mentionPatterns(e) }))
    .filter((m) => m.patterns.length);

  for (const e of entities) {
    if (!e.content) continue;
    const hay = e.content.toLowerCase();
    const selfName = String(e.name).toLowerCase();
    let count = 0;
    for (const m of mentionable) {
      if (count >= MAX_MENTIONS_PER_ENTITY) break;
      if (m.id === e.id) continue;
      // Deux entités de même nom sont deux DÉCLARATIONS de la même chose (un
      // serveur MCP déclaré dans deux fichiers), pas une citation de l'une par
      // l'autre. Le doublon est signalé par un badge, pas par une arête.
      if (m.name === selfName) continue;
      // Un lien explicite (ref, contains, delta, tool) prime toujours : on ne
      // double pas une relation déjà établie par une citation.
      if (pairs.has(pairKey(e.id, m.id))) continue;
      if (m.patterns.some((re) => re.test(hay))) { addEdge(e.id, m.id, 'mention'); count++; }
    }
  }

  return { nodes, edges, edgeTypes: EDGE_TYPES };
}

// Noms sous lesquels une entité peut être citée par un lien [[wiki]].
function aliasesOf(e) {
  const out = [String(e.name).toLowerCase()];
  if (e.path) {
    const base = path.basename(e.path).replace(/\.[^.]+$/, '').toLowerCase();
    out.push(base);
    // Une skill vit dans <nom>/SKILL.md : c'est le dossier qui la nomme.
    if (base === 'skill' || base === 'spec') {
      out.push(path.basename(path.dirname(e.path)).toLowerCase());
    }
  }
  return out.filter(Boolean);
}

// Motifs de citation, testés en minuscules sur le contenu.
function mentionPatterns(e) {
  const out = [];
  const name = String(e.name).trim();

  // `/ma-commande` : invocation explicite, signal le plus fort.
  const invoke = (e.meta.find((m) => m.k === 'commande') || {}).v;
  if (invoke) out.push(new RegExp('(^|[\\s"\'`(])' + escapeRe(invoke.toLowerCase()) + '(?![\\w-])', 'm'));

  // Nom nu : on exige un identifiant distinctif (kebab/snake case, ou ≥ 6
  // caractères) pour éviter d'attraper des mots courants du langage naturel.
  const isDistinctive = /[-_]/.test(name) || name.length >= 6;
  if (isDistinctive && name.length >= 4) {
    out.push(new RegExp('(^|[^\\w-])' + escapeRe(name.toLowerCase()) + '(?![\\w-])', 'm'));
  }
  return out;
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ===== core/explorer.mjs =====
// core/explorer.mjs — arborescence des dossiers IA détectés.
//
// Contrairement à claude-map (un seul .claude/), AI-MAP peut avoir plusieurs
// racines : une par écosystème présent. On produit donc un arbre par source.





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
function buildTrees(ctx, roots) {
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

// ===== core/reporting/render.mjs =====
// core/reporting/render.mjs — page HTML autoportante.
// Responsabilité unique : templating. Aucune logique métier ici.





// En dev on lit les assets sur le disque ; le bundle autonome (build.mjs)
// injecte globalThis.__AI_MAP_ASSETS et court-circuite le disque.
const INLINE = globalThis.__AI_MAP_ASSETS || null;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const asset = (name) => (INLINE ? INLINE[name] : fs.readFileSync(path.join(HERE, 'assets', name), 'utf8'));

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function renderHtml(model) {
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

// ===== ai-map.mjs =====
// ai-map — cartographie l'écosystème IA complet d'un projet en une page HTML
// autoportante : Claude Code, OpenSpec, et (à venir) Cursor, Copilot, Roo,
// Windsurf, MCP.
//
// Portable : Node >= 16, zéro dépendance, zéro appel réseau.
//
// Usage :
//   ai-map [chemin] [-o sortie.html] [--open] [--json]
//     chemin  racine du projet à analyser (défaut : .)
//     -o      fichier HTML de sortie (défaut : <chemin>/ai-map.report.html)
//     --open  ouvrir le rapport dans le navigateur
//     --json  écrire aussi le modèle brut en JSON (pour la CI / d'autres outils)
//
// Ce fichier n'est qu'un orchestrateur ; toute la logique vit dans core/ et plugins/.











function parseArgs(argv) {
  const opts = { inputPath: '.', outPath: null, openAfter: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-o' || a === '--out') opts.outPath = argv[++i];
    else if (a === '--open') opts.openAfter = true;
    else if (a === '--json') opts.json = true;
    else if (a === '-h' || a === '--help') { printHelp(); process.exit(0); }
    else if (!a.startsWith('-')) opts.inputPath = a;
  }
  return opts;
}

function printHelp() {
  console.log('ai-map — carte HTML de l\'écosystème IA d\'un projet');
  console.log('  ai-map [chemin] [-o sortie.html] [--open] [--json]');
  console.log('');
  console.log('  chemin   racine du projet à analyser (défaut : .)');
  console.log('  -o       fichier HTML de sortie');
  console.log('  --open   ouvrir le rapport dans le navigateur');
  console.log('  --json   écrire aussi le modèle brut (.json) à côté du rapport');
}

// On accepte aussi un dossier d'écosystème (.claude/, openspec/) : on remonte
// alors d'un cran pour analyser le projet entier, qui est la bonne granularité
// pour une carte transverse.
const ECOSYSTEM_DIRS = new Set(['.claude', 'openspec', '.cursor', '.github', '.roo', '.windsurf']);

function resolveRoot(inputPath) {
  const resolved = path.resolve(inputPath);
  if (!isDir(resolved)) {
    console.error('Erreur : dossier introuvable — ' + resolved);
    process.exit(1);
  }
  if (ECOSYSTEM_DIRS.has(path.basename(resolved))) return path.dirname(resolved);
  return resolved;
}

function openInBrowser(file) {
  const platform = process.platform;
  const cmd = platform === 'win32' ? 'cmd' : (platform === 'darwin' ? 'open' : 'xdg-open');
  const args = platform === 'win32' ? ['/c', 'start', '', file] : [file];
  execFile(cmd, args, () => {});
}

function main() {
  const { inputPath, outPath, openAfter, json } = parseArgs(process.argv.slice(2));
  const ctx = { root: resolveRoot(inputPath) };
  const out = outPath ? path.resolve(outPath) : path.join(ctx.root, 'ai-map.report.html');

  const scan = runPlugins(ctx);
  if (!scan.detected.size) {
    console.error('Aucun écosystème IA détecté dans ' + ctx.root + '.');
    console.error('Attendu : .claude/, CLAUDE.md, .mcp.json ou openspec/.');
    process.exit(1);
  }

  const graph = buildGraph(ctx, scan.entities);
  const trees = buildTrees(ctx, scan.roots);
  const model = buildModel(ctx, scan, graph, trees);

  fs.writeFileSync(out, renderHtml(model), 'utf8');
  if (json) {
    const jsonPath = out.replace(/\.html?$/i, '') + '.json';
    fs.writeFileSync(jsonPath, JSON.stringify(model, null, 2), 'utf8');
    console.log('✔ Modèle JSON : ' + jsonPath);
  }

  console.log('✔ Carte générée : ' + out);
  console.log('  ' + model.totals.entities + ' entités · ' +
    model.totals.edges + ' relations · ' +
    model.sources.filter((s) => s.detected).map((s) => s.label + ' (' + s.count + ')').join(' · '));

  // Les erreurs d'adaptateur n'interrompent pas la génération, mais elles ne
  // doivent pas passer inaperçues : la carte serait silencieusement incomplète.
  for (const e of scan.errors) {
    console.warn('⚠ Adaptateur ' + e.plugin + ' (' + e.phase + ') : ' + e.message);
  }

  if (openAfter) openInBrowser(out);
}

main();
