#!/usr/bin/env node
// scripts/release-prepare.mjs — PHASE 1 d'une release : préparer, sans rien
// publier.
//
// RÈGLE FONDAMENTALE : ce script ne commite pas, ne pousse pas, ne taggue pas.
// Il analyse et PROPOSE. La décision reste humaine.
//
//   node scripts/release-prepare.mjs            → affiche la proposition
//   node scripts/release-prepare.mjs --apply    → écrit CHANGELOG + versions
//                                                 (toujours sans commit ni push)
//
// Options :
//   --from <ref>   point de départ (défaut : dernier tag, sinon 1er commit)
//   --as <version> force la version au lieu de celle calculée
//
// Ce qu'il produit :
//   • la version proposée (SemVer, déduite des Conventional Commits)
//   • l'entrée CHANGELOG au format Keep a Changelog
//   • les notes de release
//   • si l'extension VS Code doit être republiée
//   • si la description Marketplace mérite une relecture

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();

// ----- Conventional Commits → Keep a Changelog -----------------------------
// Les catégories sont celles de keepachangelog.com ; `chore` et `test` ne sont
// pas publiés : ils n'apprennent rien à qui lit une release.
const SECTIONS = [
  { key: 'breaking', title: 'Removed',    types: [] },  // rempli à part
  { key: 'feat',     title: 'Added',      types: ['feat'] },
  { key: 'change',   title: 'Changed',    types: ['refactor', 'perf', 'style'] },
  { key: 'fix',      title: 'Fixed',      types: ['fix'] },
  { key: 'security', title: 'Security',   types: ['security'] },
  { key: 'docs',     title: 'Documentation', types: ['docs'] },
];
const SILENT_TYPES = new Set(['chore', 'test', 'ci', 'build']);

function parseArgs(argv) {
  const o = { apply: false, from: null, as: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--apply') o.apply = true;
    else if (argv[i] === '--from') o.from = argv[++i];
    else if (argv[i] === '--as') o.as = argv[++i];
  }
  return o;
}

function lastTag() {
  // stderr est étouffé : sans tag, git écrit « No names found » alors que
  // l'absence de tag est le cas NORMAL d'une première release.
  try {
    return execFileSync('git', ['describe', '--tags', '--abbrev=0'],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return null; }
}

function commitsSince(ref) {
  // %x1f sépare les champs, %x1e les enregistrements : aucun des deux ne peut
  // apparaître dans un message de commit.
  const range = ref ? ref + '..HEAD' : 'HEAD';
  const raw = git('log', range, '--format=%H%x1f%s%x1f%b%x1e', '--no-merges');
  if (!raw) return [];
  return raw.split('\x1e').map((r) => r.trim()).filter(Boolean).map((r) => {
    const [hash, subject, body] = r.split('\x1f');
    return { hash, subject: subject || '', body: body || '' };
  });
}

function classify(c) {
  const m = c.subject.match(/^(\w+)(\([^)]*\))?(!)?:\s*(.+)$/);
  if (!m) return { type: 'other', scope: null, breaking: false, text: c.subject, hash: c.hash };
  const breaking = !!m[3] || /^BREAKING[ -]CHANGE:/m.test(c.body);
  return {
    type: m[1].toLowerCase(),
    scope: m[2] ? m[2].slice(1, -1) : null,
    breaking,
    text: m[4],
    hash: c.hash,
  };
}

function bumpFrom(commits) {
  if (commits.some((c) => c.breaking)) return 'major';
  if (commits.some((c) => c.type === 'feat')) return 'minor';
  if (commits.some((c) => c.type === 'fix' || c.type === 'perf')) return 'patch';
  return commits.length ? 'patch' : null;
}

function nextVersion(current, bump) {
  const [maj, min, pat] = String(current).split('.').map(Number);
  if (bump === 'major') return (maj + 1) + '.0.0';
  if (bump === 'minor') return maj + '.' + (min + 1) + '.0';
  return maj + '.' + min + '.' + (pat + 1);
}

// Fichiers dont la modification impose de republier l'extension.
const EXT_PATHS = ['vscode-extension/'];
// Fichiers dont la modification rend la description Marketplace suspecte :
// ce sont ceux qui changent ce que l'utilisateur VOIT.
const PITCH_PATHS = [
  'vscode-extension/package.json',
  'vscode-extension/README.md',
  'src/core/reporting/assets/app.js',
  'src/core/model.mjs',
  'src/plugins/',
];

function changedFiles(ref) {
  const range = ref ? ref + '..HEAD' : null;
  const out = range ? git('diff', '--name-only', range) : git('ls-files');
  return out ? out.split('\n').filter(Boolean) : [];
}

function readJson(p) { return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8')); }

// ----- Analyse -------------------------------------------------------------
const opts = parseArgs(process.argv.slice(2));
const from = opts.from || lastTag();
const commits = commitsSince(from).map(classify);

if (!commits.length) {
  console.log('Aucun commit depuis ' + (from || 'le début') + ' — rien à publier.');
  process.exit(0);
}

const cli = readJson('package.json');
const ext = readJson('vscode-extension/package.json');
const bump = bumpFrom(commits);
const version = opts.as || nextVersion(cli.version, bump);

const files = changedFiles(from);
const extTouched = files.some((f) => EXT_PATHS.some((p) => f.startsWith(p)));
const pitchTouched = files.filter((f) => PITCH_PATHS.some((p) => f.startsWith(p)));

// Regroupement par section, en écartant ce qui n'intéresse pas un lecteur.
const grouped = new Map();
const breaking = commits.filter((c) => c.breaking);
for (const c of commits) {
  if (c.breaking) continue;                      // listé à part, en tête
  if (SILENT_TYPES.has(c.type)) continue;
  const sec = SECTIONS.find((s) => s.types.includes(c.type));
  const title = sec ? sec.title : 'Changed';
  if (!grouped.has(title)) grouped.set(title, []);
  grouped.get(title).push(c);
}

const today = new Date().toISOString().slice(0, 10);
const line = (c) => '- ' + c.text + (c.scope ? ' *(' + c.scope + ')*' : '');

let entry = '## [' + version + '] - ' + today + '\n';
if (breaking.length) {
  entry += '\n### ⚠ BREAKING CHANGES\n\n'
    + breaking.map((c) => line(c)).join('\n') + '\n';
}
for (const title of ['Added', 'Changed', 'Fixed', 'Security', 'Documentation']) {
  const list = grouped.get(title);
  if (!list || !list.length) continue;
  entry += '\n### ' + title + '\n\n' + list.map(line).join('\n') + '\n';
}

// ----- Proposition ---------------------------------------------------------
const bar = '─'.repeat(70);
console.log('\n' + bar);
console.log('  PROPOSITION DE RELEASE — aucune modification effectuée');
console.log(bar);
console.log('  Depuis            : ' + (from || 'le premier commit'));
console.log('  Commits analysés  : ' + commits.length
  + '  (' + commits.filter((c) => !SILENT_TYPES.has(c.type)).length + ' publiables)');
console.log('  Incrément SemVer  : ' + bump + (breaking.length ? '  ⚠ BREAKING' : ''));
console.log('  Version CLI       : ' + cli.version + '  →  ' + version);

if (extTouched) {
  const extNext = opts.as || nextVersion(ext.version, bump);
  console.log('  Version extension : ' + ext.version + '  →  ' + extNext
    + '   (fichiers vscode-extension/ modifiés)');
} else {
  console.log('  Version extension : ' + ext.version + '  (inchangée — extension non modifiée)');
}

console.log('\n' + bar);
console.log('  DESCRIPTION MARKETPLACE');
console.log(bar);
if (pitchTouched.length) {
  console.log('  ⚠ À RELIRE — des fichiers touchant ce que l\'utilisateur voit ont changé :');
  for (const f of pitchTouched.slice(0, 8)) console.log('      ' + f);
  if (pitchTouched.length > 8) console.log('      … et ' + (pitchTouched.length - 8) + ' autre(s)');
  console.log('\n  Description actuelle :');
  console.log('      ' + ext.description);
  console.log('\n  Vérifier qu\'elle mentionne toujours : les écosystèmes réellement');
  console.log('  supportés, et les fonctionnalités mises en avant.');
} else {
  console.log('  ✔ Rien de visible n\'a changé — description probablement encore juste.');
}

console.log('\n' + bar);
console.log('  ENTRÉE CHANGELOG');
console.log(bar + '\n');
console.log(entry);

console.log(bar);
console.log('  DÉCISION HUMAINE REQUISE');
console.log(bar);
console.log('  Cette phase n\'a RIEN commité, poussé ni taggué.');
console.log('');
console.log('  Pour appliquer (écrit CHANGELOG.md + versions, toujours sans commit) :');
console.log('      node scripts/release-prepare.mjs --apply');
console.log('  Pour forcer une autre version :');
console.log('      node scripts/release-prepare.mjs --as X.Y.Z --apply');
console.log('');

// ----- Application (toujours sans commit ni push) ---------------------------
if (!opts.apply) process.exit(0);

const changelogPath = path.join(ROOT, 'CHANGELOG.md');
const header = '# Changelog\n\n'
  + 'Toutes les évolutions notables de ce projet.\n\n'
  + 'Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · '
  + 'versions : [Semantic Versioning](https://semver.org/lang/fr/).\n\n';

let body = '';
if (fs.existsSync(changelogPath)) {
  const current = fs.readFileSync(changelogPath, 'utf8');
  const at = current.indexOf('\n## ');
  body = at === -1 ? '' : current.slice(at + 1);
}
fs.writeFileSync(changelogPath, header + entry + (body ? '\n' + body : ''), 'utf8');
console.log('✔ CHANGELOG.md mis à jour');

cli.version = version;
fs.writeFileSync(path.join(ROOT, 'package.json'), JSON.stringify(cli, null, 2) + '\n', 'utf8');
console.log('✔ package.json → ' + version);

if (extTouched) {
  ext.version = opts.as || nextVersion(ext.version, bump);
  fs.writeFileSync(path.join(ROOT, 'vscode-extension', 'package.json'),
    JSON.stringify(ext, null, 2) + '\n', 'utf8');
  console.log('✔ vscode-extension/package.json → ' + ext.version);
}

console.log('\nRien n\'a été commité ni poussé. Relisez `git diff`, puis publiez');
console.log('vous-même (voir la skill `release`, phase 2).');
