// extension.js — AI-MAP pour VS Code.
//
// Trois surfaces :
//   1. vue latérale (WebviewView) — fiches par écosystème, recherche, états vides ;
//   2. fiche détaillée (WebviewPanel) — un ONGLET par entité, pas une popup ;
//   3. rapport complet — webview, navigateur ou fichier enregistré.
//
// Aucune dépendance externe : le fichier autonome embarqué (media/ai-map.mjs)
// est exécuté avec l'exécutable de VS Code en mode Node (ELECTRON_RUN_AS_NODE),
// donc Node n'a pas besoin d'être sur le PATH.

const vscode = require('vscode');
const cp = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sidebar = require('./sidebar.js');
const detail = require('./detail.js');

let view = null;

function activate(context) {
  view = new AiMapViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('aiMapView', view),
    vscode.commands.registerCommand('aiMap.generate', () => generateAndShow(context)),
    vscode.commands.registerCommand('aiMap.openInBrowser', () => openInBrowser(context)),
    vscode.commands.registerCommand('aiMap.saveReport', () => saveReport(context)),
    vscode.commands.registerCommand('aiMap.refresh', () => view.reload()),
    vscode.commands.registerCommand('aiMap.bootstrap', () => bootstrap()),
    vscode.commands.registerCommand('aiMap.openEntity', (file) => openFile(file))
  );

  // Une config IA ajoutée ou supprimée doit se voir sans action manuelle.
  const watcher = vscode.workspace.createFileSystemWatcher(
    '**/{CLAUDE.md,.mcp.json,mcp.json,mcp.yaml,.cursorrules,.roorules,.roomodes,.windsurfrules}');
  const bounce = debounce(() => view.reload(), 800);
  watcher.onDidCreate(bounce); watcher.onDidDelete(bounce); watcher.onDidChange(bounce);
  context.subscriptions.push(watcher);
}

function debounce(fn, ms) {
  let t = null;
  return () => { if (t) clearTimeout(t); t = setTimeout(fn, ms); };
}

function workspaceRoot() {
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.length ? folders[0].uri.fsPath : null;
}

function openFile(file) {
  vscode.window.showTextDocument(vscode.Uri.file(file), { preview: true });
}

// ---------------------------------------------------------------------------
// Exécution du moteur embarqué.
function runAiMap(context, root, wantJson) {
  const script = context.asAbsolutePath(path.join('media', 'ai-map.mjs'));
  const base = path.join(os.tmpdir(), 'ai-map.' + process.pid + '.' + Date.now());
  const htmlPath = base + '.html';
  const args = [script, root, '-o', htmlPath];
  if (wantJson) args.push('--json');

  return new Promise((resolve) => {
    cp.execFile(
      process.execPath, args,
      { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, maxBuffer: 32 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) { resolve({ error: (stderr || err.message || '').trim() }); return; }
        let model = null;
        if (wantJson) {
          try { model = JSON.parse(fs.readFileSync(base + '.json', 'utf8')); } catch { /* optionnel */ }
        }
        resolve({ htmlPath, model, summary: String(stdout || '').trim() });
      }
    );
  });
}

async function build(context, title) {
  const root = workspaceRoot();
  if (!root) {
    vscode.window.showErrorMessage('AI-MAP : ouvrez d\'abord un dossier ou un workspace.');
    return null;
  }
  const res = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title },
    () => runAiMap(context, root, true)
  );
  if (res.error) { vscode.window.showErrorMessage('AI-MAP : ' + res.error); return null; }
  if (res.model) view.setModel(root, res.model);
  const line = String(res.summary || '').split('\n').pop();
  if (line) vscode.window.setStatusBarMessage('AI-MAP · ' + line, 6000);
  return { root, ...res };
}

async function generateAndShow(context) {
  const res = await build(context, 'AI-MAP : analyse de l\'écosystème…');
  if (!res) return;
  let html;
  try { html = fs.readFileSync(res.htmlPath, 'utf8'); }
  catch (e) { vscode.window.showErrorMessage('AI-MAP : rapport illisible (' + e.message + ').'); return; }

  const panel = vscode.window.createWebviewPanel(
    'aiMapReport', 'AI-MAP', vscode.ViewColumn.Active,
    { enableScripts: true, retainContextWhenHidden: true }
  );
  panel.iconPath = vscode.Uri.file(context.asAbsolutePath(path.join('media', 'icon.png')));
  panel.webview.html = html;
}

// La webview convient pour un coup d'œil ; le navigateur donne le plein écran,
// l'impression et le partage du fichier, qui est autoportant.
async function openInBrowser(context) {
  const res = await build(context, 'AI-MAP : génération pour le navigateur…');
  if (!res) return;
  const opened = await vscode.env.openExternal(vscode.Uri.file(res.htmlPath));
  if (!opened) {
    vscode.window.showWarningMessage('AI-MAP : navigateur non lancé. Rapport ici : ' + res.htmlPath);
    return;
  }
  vscode.window.setStatusBarMessage('AI-MAP · carte ouverte dans le navigateur', 5000);
}

// Le fichier temporaire est éphémère : ce n'est pas ce qu'on partage à une équipe.
async function saveReport(context) {
  const res = await build(context, 'AI-MAP : génération du rapport…');
  if (!res) return;
  const target = await vscode.window.showSaveDialog({
    saveLabel: 'Enregistrer la carte',
    defaultUri: vscode.Uri.file(path.join(res.root, 'ai-map.report.html')),
    filters: { 'Page HTML': ['html'] },
  });
  if (!target) return;
  try { fs.copyFileSync(res.htmlPath, target.fsPath); }
  catch (e) { vscode.window.showErrorMessage('AI-MAP : enregistrement impossible (' + e.message + ').'); return; }
  const choice = await vscode.window.showInformationMessage(
    'AI-MAP : rapport enregistré.', 'Ouvrir dans le navigateur');
  if (choice) vscode.env.openExternal(target);
}

// Seule action d'ÉCRITURE de l'extension, et uniquement sur demande explicite
// depuis l'état vide. Elle crée un fichier, jamais n'en modifie un existant.
async function bootstrap() {
  const root = workspaceRoot();
  if (!root) { vscode.window.showErrorMessage('AI-MAP : aucun dossier ouvert.'); return; }
  const target = path.join(root, 'CLAUDE.md');
  if (fs.existsSync(target)) {
    vscode.window.showWarningMessage('AI-MAP : CLAUDE.md existe déjà.');
    openFile(target);
    return;
  }
  const ok = await vscode.window.showInformationMessage(
    'Créer un CLAUDE.md à la racine du projet ?', { modal: true }, 'Créer');
  if (ok !== 'Créer') return;

  const name = path.basename(root);
  const content = [
    '# ' + name,
    '',
    'Instructions chargées à chaque session par les assistants IA du projet.',
    '',
    '## Conventions',
    '',
    '- (à compléter)',
    '',
    '## Architecture',
    '',
    '- (à compléter)',
    '',
  ].join('\n');
  try { fs.writeFileSync(target, content, 'utf8'); }
  catch (e) { vscode.window.showErrorMessage('AI-MAP : création impossible (' + e.message + ').'); return; }
  openFile(target);
  view.reload();
}

// ---------------------------------------------------------------------------
// Fiche détaillée : un onglet réutilisé, pour ne pas empiler les panneaux.
let detailPanel = null;

function showDetail(context, entity, model) {
  if (!detailPanel) {
    detailPanel = vscode.window.createWebviewPanel(
      'aiMapDetail', entity.name, vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    detailPanel.iconPath = vscode.Uri.file(context.asAbsolutePath(path.join('media', 'icon.png')));
    detailPanel.onDidDispose(() => { detailPanel = null; });
  }
  detailPanel.title = entity.name;
  detailPanel.webview.html = detail.render(entity, model);
  detailPanel.reveal(detailPanel.viewColumn, false);

  // Un seul abonnement à la fois : on remplace celui de l'entité précédente.
  if (detailPanel._sub) detailPanel._sub.dispose();
  detailPanel._sub = detailPanel.webview.onDidReceiveMessage((msg) => {
    if (msg.type === 'open' && entity.path) openFile(path.join(view.root, entity.path));
    else if (msg.type === 'openPath' && msg.path) openFile(path.join(view.root, msg.path));
    else if (msg.type === 'report') vscode.commands.executeCommand('aiMap.generate');
  });
}

// ---------------------------------------------------------------------------
// Vue latérale. Une WebviewView (et non une TreeView) parce qu'une TreeView ne
// sait afficher qu'une ligne de texte par nœud : impossible d'y mettre des
// fiches avec description, étiquettes, avancement et date.
class AiMapViewProvider {
  constructor(context) {
    this.context = context;
    this.root = null;
    this.model = null;
    this.state = 'loading';
    this.webview = null;
  }

  resolveWebviewView(webviewView) {
    this.webview = webviewView.webview;
    this.webview.options = { enableScripts: true };
    this.webview.onDidReceiveMessage((msg) => this.onMessage(msg));
    this.paint();
    this.reload();
  }

  onMessage(msg) {
    if (msg.type === 'refresh') { this.reload(); return; }
    if (msg.type === 'bootstrap') { vscode.commands.executeCommand('aiMap.bootstrap'); return; }
    if (msg.type === 'openFolder') { vscode.commands.executeCommand('vscode.openFolder'); return; }
    if (msg.type === 'openDetail') {
      const entity = (this.model && this.model.entities || []).find((e) => e.id === msg.id);
      if (entity) showDetail(this.context, entity, this.model);
      return;
    }
    if (msg.type === 'openPath' && msg.path && this.root) openFile(path.join(this.root, msg.path));
  }

  setModel(root, model) {
    this.root = root;
    this.model = model;
    this.state = model && model.totals && model.totals.entities ? 'ready' : 'empty';
    this.paint();
  }

  paint() {
    if (!this.webview) return;
    this.webview.html = sidebar.render(this.webview, this.model, this.state);
  }

  async reload() {
    const root = workspaceRoot();
    if (!root) { this.root = null; this.model = null; this.state = 'nofolder'; this.paint(); return; }
    this.state = 'loading'; this.paint();
    const res = await runAiMap(this.context, root, true);
    if (res.error) {
      // « Aucun écosystème détecté » n'est pas une erreur : le moteur sort en
      // code non nul, mais c'est un état normal qui mérite son propre message.
      this.root = root; this.model = null;
      this.state = /aucun écosystème/i.test(res.error) ? 'empty' : 'error';
      this.paint();
      return;
    }
    this.setModel(root, res.model || null);
  }
}

function deactivate() {}

module.exports = { activate, deactivate, AiMapViewProvider };
