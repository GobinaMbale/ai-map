#!/usr/bin/env node
// scripts/make-icon.mjs — génère l'icône PNG de l'extension VS Code.
//
// Zéro dépendance : on encode le PNG à la main (node:zlib suffit). Le rendu se
// fait en 4× puis est réduit par moyenne — c'est ce qui donne l'anticrénelage
// sans bibliothèque graphique.
//
// Motif : un petit graphe (nœuds reliés) sur fond dégradé — AI-MAP en une image.
//
// Usage : node scripts/make-icon.mjs [taille]   (défaut 256)

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'vscode-extension', 'media', 'icon.png');

const SIZE = Number(process.argv[2]) || 256;
const SS = 4;                 // facteur de suréchantillonnage
const W = SIZE * SS;

// ----- toile RGBA ----------------------------------------------------------
const px = new Uint8ClampedArray(W * W * 4);

function setPx(x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= W || y >= W) return;
  const i = (y * W + x) * 4;
  const src = a / 255;
  const dst = px[i + 3] / 255;
  const out = src + dst * (1 - src);
  if (out <= 0) return;
  px[i]     = (r * src + px[i]     * dst * (1 - src)) / out;
  px[i + 1] = (g * src + px[i + 1] * dst * (1 - src)) / out;
  px[i + 2] = (b * src + px[i + 2] * dst * (1 - src)) / out;
  px[i + 3] = out * 255;
}

const lerp = (a, b, t) => a + (b - a) * t;

// Fond : carré à coins arrondis, dégradé indigo → cyan (couleurs du rapport).
function background() {
  const radius = W * 0.22;
  const from = [99, 102, 241];   // --accent
  const to   = [8, 145, 178];    // arête « code »
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      if (!insideRounded(x, y, radius)) continue;
      const t = (x + y) / (2 * W);
      setPx(x, y, lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t), 255);
    }
  }
}

function insideRounded(x, y, r) {
  const nx = Math.min(x, W - 1 - x);
  const ny = Math.min(y, W - 1 - y);
  if (nx >= r || ny >= r) return true;          // hors des coins
  const dx = r - nx, dy = r - ny;
  return dx * dx + dy * dy <= r * r;
}

function disc(cx, cy, rad, [r, g, b], a = 255) {
  for (let y = Math.floor(cy - rad); y <= cy + rad; y++) {
    for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= rad * rad) setPx(x, y, r, g, b, a);
    }
  }
}

function segment(x1, y1, x2, y2, width, [r, g, b], a = 255) {
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    disc(lerp(x1, x2, t), lerp(y1, y2, t), width / 2, [r, g, b], a);
  }
}

// ----- motif : un graphe de 4 nœuds ---------------------------------------
const WHITE = [255, 255, 255];
const u = (v) => v * W;   // coordonnées en fraction de l'image

background();

const nodes = [
  { x: u(0.30), y: u(0.28), r: u(0.075) },  // haut gauche
  { x: u(0.72), y: u(0.36), r: u(0.055) },  // haut droite
  { x: u(0.50), y: u(0.62), r: u(0.090) },  // centre (le plus gros : le hub)
  { x: u(0.26), y: u(0.75), r: u(0.050) },  // bas gauche
];

// Arêtes d'abord, pour qu'elles passent sous les nœuds.
segment(nodes[0].x, nodes[0].y, nodes[2].x, nodes[2].y, u(0.030), WHITE, 210);
segment(nodes[1].x, nodes[1].y, nodes[2].x, nodes[2].y, u(0.030), WHITE, 210);
segment(nodes[3].x, nodes[3].y, nodes[2].x, nodes[2].y, u(0.030), WHITE, 210);
segment(nodes[0].x, nodes[0].y, nodes[1].x, nodes[1].y, u(0.020), WHITE, 130);

for (const n of nodes) {
  disc(n.x, n.y, n.r, WHITE, 255);
  // Anneau intérieur teinté : les nœuds se lisent comme des entités distinctes.
  disc(n.x, n.y, n.r * 0.42, [79, 70, 229], 255);
}

// ----- réduction (anticrénelage) ------------------------------------------
const out = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let dy = 0; dy < SS; dy++) {
      for (let dx = 0; dx < SS; dx++) {
        const i = ((y * SS + dy) * W + (x * SS + dx)) * 4;
        r += px[i]; g += px[i + 1]; b += px[i + 2]; a += px[i + 3];
      }
    }
    const n = SS * SS, o = (y * SIZE + x) * 4;
    out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = a / n;
  }
}

// ----- encodage PNG --------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;    // 8 bits par canal
ihdr[9] = 6;    // RGBA
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

// Chaque scanline est précédée de son octet de filtre (0 = aucun).
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0;
  out.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, png);
console.log('✔ Icône écrite : ' + path.relative(path.join(HERE, '..'), OUT) +
  ' (' + SIZE + '×' + SIZE + ', ' + png.length + ' octets)');