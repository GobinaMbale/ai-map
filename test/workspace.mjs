#!/usr/bin/env node
// test/workspace.mjs — cartographie multi-projets.
//
// Deux pièges y ont déjà été rencontrés, tous deux du même genre : appliquer
// une règle générique là où la sémantique diffère. Les tests les verrouillent.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverProjects, buildWorkspace } from '../src/core/workspace.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');

let failures = 0;
function check(label, cond, detail) {
  if (cond) { console.log('  ✔ ' + label); return; }
  failures++;
  console.log('  ✖ ' + label + (detail ? ' — ' + detail : ''));
}

// Un workspace jetable : deux projets partageant une skill identique, un
// troisième où la même skill a dérivé, plus du bruit qui NE doit pas être
// signalé.
function makeWorkspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-map-ws-'));
  const skill = (dir, name, body) => {
    const d = path.join(root, dir, '.claude', 'skills', name);
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'SKILL.md'),
      '---\nname: ' + name + '\ndescription: Déploie.\n---\n\n' + body, 'utf8');
  };
  const memory = (dir, body) => {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
    fs.writeFileSync(path.join(root, dir, 'CLAUDE.md'), body, 'utf8');
  };

  // deploy-api : identique dans a et b, différente dans c
  skill('a', 'deploy-api', 'Procédure commune.');
  skill('b', 'deploy-api', 'Procédure commune.');
  skill('c', 'deploy-api', 'Procédure MODIFIÉE localement.');

  // Chaque projet a son CLAUDE.md, tous différents — c'est NORMAL.
  memory('a', '# A\n\nContexte du projet A.');
  memory('b', '# B\n\nContexte du projet B, tout autre.');
  memory('c', '# C\n\nEncore autre chose.');

  // Un projet imbriqué, pour vérifier la découverte en profondeur.
  skill(path.join('groupe', 'd'), 'deploy-api', 'Procédure commune.');

  // Un dossier sans écosystème : ne doit pas devenir un projet.
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'notes.md'), '# Notes', 'utf8');

  return root;
}

const root = makeWorkspace();

// ----- Découverte ----------------------------------------------------------
console.log('\ndécouverte des projets');
const found = discoverProjects(root);
const ids = found.map((p) => p.id).sort();
check('quatre projets trouvés', found.length === 4, ids.join(', '));
check('un projet imbriqué est découvert', ids.includes('groupe/d'), ids.join(', '));
check('un dossier sans écosystème est ignoré', !ids.includes('docs'), ids.join(', '));

// On ne descend pas DANS un projet : `a/.claude` n'est pas un projet distinct.
check('on ne descend pas dans un projet déjà détecté',
  !ids.some((id) => id.includes('.claude')), ids.join(', '));

// ----- Divergences ---------------------------------------------------------
console.log('\ndivergences entre projets');
const ws = buildWorkspace({ root });
const d = ws.divergences;

const deploy = [...d.duplicated, ...d.diverged].find((x) => x.name === 'deploy-api');
check('la skill partagée est repérée', !!deploy);
check('elle est vue dans les quatre projets', deploy && deploy.projects.length === 4,
  deploy && deploy.projects.join(', '));
check('sa divergence est détectée', deploy && deploy.diverged === true);

// LE piège n°1 : un CLAUDE.md par projet DOIT différer. Le signaler serait un
// faux positif — c'est de la mémoire propre au projet, pas une copie dérivée.
const all = [...d.duplicated, ...d.diverged, ...d.gaps];
check('aucun CLAUDE.md signalé comme divergent',
  !all.some((x) => x.kind === 'memory'),
  all.filter((x) => x.kind === 'memory').map((x) => x.name).join(', '));

// LE piège n°2 : l'empreinte doit être calculée AVANT la troncature d'aperçu,
// sinon la note ajoutée — qui contient le chemin du projet — rend deux copies
// identiques artificiellement différentes.
console.log('\nempreinte et troncature');
const bigBody = 'Ligne de procédure commune. '.repeat(200);   // > seuil d'aperçu
const root2 = makeWorkspace();
for (const p of ['a', 'b']) {
  fs.writeFileSync(path.join(root2, p, '.claude', 'skills', 'deploy-api', 'SKILL.md'),
    '---\nname: deploy-api\ndescription: Déploie.\n---\n\n' + bigBody, 'utf8');
}
const ws2 = buildWorkspace({ root: root2 });
const dep2 = [...ws2.divergences.duplicated, ...ws2.divergences.diverged]
  .find((x) => x.name === 'deploy-api');
const inAB = dep2.occurrences.filter((o) => o.project === 'a' || o.project === 'b');
check('deux longues copies identiques gardent la même empreinte',
  inAB.length === 2 && inAB[0].print === inAB[1].print,
  inAB.map((o) => o.project + '=' + o.print).join(' | '));

const trimmed = ws2.models.a.entities.find((e) => e.name === 'deploy-api');
check('le contenu est bien tronqué en aperçu', trimmed && trimmed.clipped === true);
check('l\'aperçu renvoie au rapport du projet',
  trimmed && /ai-map /.test(trimmed.content));

// ----- Modèle --------------------------------------------------------------
console.log('\nmodèle workspace');
check('le modèle est marqué comme workspace', ws.workspace === true);
check('un résumé par projet', ws.projects.length === 4);
check('les totaux agrègent les projets',
  ws.totals.entities === ws.projects.reduce((n, p) => n + p.entities, 0));
check('les arborescences sont vidées', Object.values(ws.models).every((m) => !m.trees.length));
check('chaque projet garde son propre modèle',
  Object.keys(ws.models).length === 4, Object.keys(ws.models).join(', '));

// Nettoyage
for (const r of [root, root2]) fs.rmSync(r, { recursive: true, force: true });

console.log('');
if (failures) { console.error(failures + ' test(s) en échec.'); process.exit(1); }
console.log('Workspace : tous les tests passent.');
