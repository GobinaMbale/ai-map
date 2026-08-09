// social-card.mjs — carte LinkedIn 1200×1200 à partir des VRAIES données
// mesurées sur qcm-factory. Rien n'est inventé : ce sont les chiffres que
// produit `ai-map ../qcm-factory`.
//
// Contrainte de conception : lisible à ~300 px de large (vignette mobile du
// fil LinkedIn). Le 7 % doit dominer ; les trois autres composantes servent de
// contrepoint — c'est leur excellence qui rend le 7 % troublant.

import fs from 'node:fs';
import { chromium } from 'playwright-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = process.argv[2] || './linkedin-card.png';

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1200px;height:1200px;background:#0f1117;
    font-family:"Segoe UI",system-ui,-apple-system,sans-serif;color:#e7e9ee;
    display:flex;flex-direction:column;padding:70px 74px;overflow:hidden}

  .top{display:flex;align-items:center;gap:14px;margin-bottom:16px}
  .logo{width:40px;height:40px;border-radius:11px;
    background:linear-gradient(135deg,#6366f1,#0891b2);
    display:grid;place-items:center;font-weight:800;font-size:15px;color:#fff;letter-spacing:-.02em}
  .brand{font-size:20px;font-weight:800;letter-spacing:-.01em}
  .ctx{margin-left:auto;font-size:16px;color:#6b7280;
    font-family:ui-monospace,Consolas,monospace}

  .hero{flex:1;display:flex;flex-direction:column;justify-content:center;margin-top:-20px}
  .lead{font-size:31px;font-weight:700;color:#e7e9ee;margin-bottom:30px;line-height:1.35;max-width:22ch}
  .lead em{font-style:normal;color:#9aa2b1}
  .kicker{font-size:25px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;
    color:#9aa2b1;margin-bottom:6px}
  .num{line-height:.82}
  .big{font-size:252px;font-weight:800;line-height:.82;letter-spacing:-.05em;color:#f43f5e}
  .pct{font-size:.34em;letter-spacing:-.02em}
  .bar{height:16px;border-radius:8px;background:#232833;overflow:hidden;margin:30px 0 26px}
  .bar span{display:block;height:100%;width:7%;background:#f43f5e;border-radius:8px}
  .say{font-size:37px;line-height:1.38;font-weight:600;color:#e7e9ee;max-width:24ch}
  .say b{color:#fff}

  .rest{border-top:1px solid #262b36;padding-top:34px}
  .rest-lab{font-size:23px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;
    color:#9aa2b1;margin-bottom:24px}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
  .cell .n{font-size:52px;font-weight:800;color:#22c55e;line-height:1;letter-spacing:-.03em}
  .cell .l{font-size:18px;color:#9aa2b1;margin-top:9px}
  .cell .t{height:7px;border-radius:4px;background:#232833;margin-top:13px;overflow:hidden}
  .cell .t span{display:block;height:100%;background:#22c55e;border-radius:4px}
</style></head><body>

  <div class="top">
    <div class="logo">AI</div>
    <div class="brand">AI-MAP</div>
    <div class="ctx">94 entités · 2 écosystèmes</div>
  </div>

  <div class="hero">
    <div class="lead">Ce que j'ai trouvé <em>dans mon propre projet</em></div>
    <div class="kicker">Traçabilité</div>
    <div class="num"><span class="big">7<span class="pct">%</span></span></div>
    <div class="bar"><span></span></div>
    <div class="say">
      <b>14 des 15</b> skills, commandes et agents ne pointent vers
      <b>aucun fichier réel</b>.
    </div>
  </div>

  <div class="rest">
    <div class="rest-lab">Et pourtant, le reste va bien</div>
    <div class="grid">
      <div class="cell"><div class="n">99%</div><div class="l">Connexion</div>
        <div class="t"><span style="width:99%"></span></div></div>
      <div class="cell"><div class="n">100%</div><div class="l">Fraîcheur</div>
        <div class="t"><span style="width:100%"></span></div></div>
      <div class="cell"><div class="n">98%</div><div class="l">Hygiène</div>
        <div class="t"><span style="width:98%"></span></div></div>
    </div>
  </div>

</body></html>`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
await page.setContent(html, { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.screenshot({ path: OUT });
await browser.close();

console.log('✔ ' + OUT + ' (' + Math.round(fs.statSync(OUT).size / 1024) + ' Ko)');
