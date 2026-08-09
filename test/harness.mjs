// test/harness.mjs — DOM minimal partagé par les tests d'interface.
//
// Extrait de smoke.mjs pour que le test workspace puisse rendre le même app.js
// sans le dupliquer.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// ---------------------------------------------------------------------------
// DOM minimal : juste assez pour exécuter le premier rendu complet du rapport,
// y compris la mise en page du graphe (canvas 2D bouchonné).
export function runReportInFakeDom(model) {
  const noop = () => {};
  const ctx2d = new Proxy({
    measureText: (t) => ({ width: String(t).length * 6 }),
    canvas: { width: 900, height: 500 },
  }, {
    get: (t, k) => (k in t ? t[k] : noop),
    set: () => true,
  });

  const byId = {};

  function makeEl(tag) {
    const el = {
      tagName: String(tag).toUpperCase(),
      children: [], dataset: {},
      // Les variables CSS passent par setProperty : un objet nu ne suffit pas.
      style: {
        setProperty(k, v) { this[k] = v; },
        getPropertyValue(k) { return this[k] || ''; },
        removeProperty(k) { delete this[k]; },
      },
      className: '', textContent: '', title: '', type: '', value: '',
      // `innerHTML = ''` est la façon dont le rapport vide un conteneur : sans
      // ce setter, les enfants s'accumuleraient et le parcours de test
      // retrouverait des nœuds périmés.
      set innerHTML(v) { if (v === '') this.children = []; this._html = v; },
      get innerHTML() { return this._html || ''; },
      clientWidth: 900, clientHeight: 500, width: 900, height: 500,
      offsetWidth: 120, offsetHeight: 40,
      // classList RÉEL, adossé à className : bouchonné, il rendait
      // intestable tout code qui lit l'état d'une classe — comme le bouton
      // plein écran, qui décide en fonction de `contains('fullscreen')`.
      appendChild(c) { this.children.push(c); return c; },
      removeChild(c) { this.children = this.children.filter((x) => x !== c); return c; },
      remove() {}, insertBefore(c) { this.children.push(c); return c; },
      setAttribute: noop, getAttribute: () => null, removeAttribute: noop,
      addEventListener: noop, removeEventListener: noop,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 900, height: 500 }),
      scrollIntoView: noop, focus: noop, click: noop,
      getContext: () => ctx2d,
      querySelector: () => null, querySelectorAll: () => [],
      get parentNode() { return null; },
      // Condition exacte d'une webview VS Code : la méthode EXISTE mais son
      // appel est refusé (iframe sans autorisation). Ne pas la définir du tout
      // testerait un cas qui n'arrive dans aucun navigateur moderne.
      requestFullscreen: () => Promise.reject(new Error('fullscreen refusé')),
    };
    el.classList = {
      _list() { return String(el.className || '').split(/\s+/).filter(Boolean); },
      contains(c) { return this._list().includes(c); },
      add(c) {
        const l = this._list();
        if (!l.includes(c)) { l.push(c); el.className = l.join(' '); }
      },
      remove(c) { el.className = this._list().filter((x) => x !== c).join(' '); },
      toggle(c, force) {
        const want = force === undefined ? !this.contains(c) : !!force;
        if (want) this.add(c); else this.remove(c);
        return want;
      },
    };

    // `id` doit être un accesseur pour alimenter getElementById : sans ça,
    // document.getElementById renvoyait null et le rapport sortait de son rendu
    // sans rien construire — les tests passaient à vide.
    let idVal = '';
    Object.defineProperty(el, 'id', {
      get: () => idVal,
      set: (v) => { idVal = v; if (v) byId[v] = el; },
      enumerable: true,
    });
    return el;
  }

  const appEl = makeEl('div');
  appEl.id = 'app';

  const document = {
    getElementById: (id) => byId[id] || null,
    createElement: (t) => makeEl(t),
    createTextNode: (t) => ({ nodeType: 3, textContent: String(t) }),
    addEventListener: noop, removeEventListener: noop,
    body: makeEl('body'),
    documentElement: Object.assign(makeEl('html'), {
      getAttribute: () => null, setAttribute: noop,
    }),
    querySelector: () => null,
  };

  const sandbox = {
    document,
    DATA: JSON.parse(JSON.stringify(model)),
    window: {
      devicePixelRatio: 1, innerWidth: 1400, innerHeight: 900,
      addEventListener: noop, removeEventListener: noop,
      matchMedia: () => ({ matches: false }),
      scrollTo: noop,
    },
    requestAnimationFrame: noop,
    localStorage: { getItem: () => null, setItem: noop },
    matchMedia: () => ({ matches: false }),
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    setTimeout: noop, clearTimeout: noop,
    console,
  };
  sandbox.globalThis = sandbox;

  const js = fs.readFileSync(
    path.join(ROOT, 'src', 'core', 'reporting', 'assets', 'app.js'), 'utf8');
  try {
    vm.runInNewContext(js, sandbox, { timeout: 20000 });
  } catch (e) {
    return { error: e, tabs: [] };
  }

  // Le rendu initial ne construit QUE l'onglet par défaut. On clique donc
  // chaque onglet : un panneau cassé passerait sinon totalement inaperçu.
  const tabs = [];
  for (const btn of findAll(appEl, (n) => n.className === 'tab' || n.className === 'tab on')) {
    const label = textOf(btn);
    try {
      btn.onclick();
      tabs.push({ label, error: null, nodes: countNodes(appEl) });
    } catch (e) {
      tabs.push({ label, error: e, nodes: 0 });
    }
  }
  return { error: null, tabs, root: appEl };
}

export function findAll(node, pred, acc = []) {
  for (const child of node.children || []) {
    if (child && typeof child === 'object') {
      if (pred(child)) acc.push(child);
      findAll(child, pred, acc);
    }
  }
  return acc;
}

export function textOf(node) {
  let out = node.textContent || '';
  for (const c of node.children || []) out += textOf(c) || c.textContent || '';
  return out.trim();
}

export function countNodes(node) {
  let n = 0;
  for (const c of node.children || []) { n += 1 + countNodes(c); }
  return n;
}

