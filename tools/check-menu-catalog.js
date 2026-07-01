'use strict';

// Drift guard for the canonical menu catalog (data/menu-catalog.json).
//
// The catalog is the single source of truth for dish ids, names and prices.
// A few consumers cannot import it directly (static HTML pages, the inline
// homepage array, the chatbot knowledge array), so this check fails CI when any
// of them drifts from the canonical prices/names — the "one page says one thing,
// admin says another" problem. Run via `npm run check:menu`.
//
// What it verifies:
//   1. functions/menu-catalog.js is regenerated from the JSON (not hand-edited).
//   2. JS-array consumers (index.html, firebase-ai-chatbot.js) match id->name+price.
//   3. Static HTML menus show the catalog price for every dish code they list.
// Pages legitimately show a subset (the homepage is a preview; the Chinese menu
// omits drinks), so we never require every id on every page — we only assert that
// what IS shown agrees with the catalog, and we print per-file coverage counts so
// silent under-checking is visible.

const fs = require('fs');
const path = require('path');
const { loadCatalog, renderFunctionsCatalog, OUTPUT_PATH } = require('./build-menu-catalog');

const root = path.resolve(__dirname, '..');
const catalog = loadCatalog();
const byId = new Map(catalog.map((item) => [item.id, item]));
const DISH_ID = /^[A-Z]{1,3}\d{1,2}$/;

const problems = [];
const summary = [];

function fail(file, message) {
  problems.push(`${file}: ${message}`);
}

function normalizeEol(text) {
  return text.replace(/\r\n/g, '\n');
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

// 1. Generated backend catalog must be in sync with the JSON.
function checkGeneratedFunctionsCatalog() {
  const rel = path.relative(root, OUTPUT_PATH).replace(/\\/g, '/');
  const expected = normalizeEol(renderFunctionsCatalog(catalog));
  const actual = normalizeEol(read(rel));
  if (actual !== expected) {
    fail(rel, 'out of sync with data/menu-catalog.json — run `npm run build:menu`.');
  } else {
    summary.push(`${rel}: in sync (${catalog.length} items)`);
  }
}

// 2. Inline JS object-literal arrays (homepage + chatbot knowledge).
function checkJsArray(rel) {
  const text = read(rel);
  const objectRe = /\{[^{}]*?\bid:\s*['"]([A-Za-z0-9]+)['"][^{}]*?\}/g;
  let checked = 0;
  let match;
  while ((match = objectRe.exec(text)) !== null) {
    const id = match[1];
    if (!DISH_ID.test(id)) continue;
    const block = match[0];
    const priceMatch = block.match(/\bprice:\s*(\d+)/);
    const nameMatch = block.match(/\bname:\s*'((?:[^'\\]|\\.)*)'|\bname:\s*"((?:[^"\\]|\\.)*)"/);
    const item = byId.get(id);
    if (!item) {
      fail(rel, `dish "${id}" is not in the canonical catalog.`);
      continue;
    }
    checked += 1;
    if (priceMatch && Number(priceMatch[1]) !== item.price) {
      fail(rel, `${id} price is ₵${priceMatch[1]} but catalog says ₵${item.price}.`);
    }
    const name = nameMatch ? (nameMatch[1] ?? nameMatch[2]) : null;
    if (name !== null && name !== item.name) {
      fail(rel, `${id} name is "${name}" but catalog says "${item.name}".`);
    }
  }
  if (checked === 0) fail(rel, 'no catalog items detected — parser may be stale.');
  else summary.push(`${rel}: ${checked} items checked (price + name)`);
}

// 3. Static HTML menus: pair each ">DISHCODE<" with the following ">C40<" / ">₵40<".
function checkStaticHtml(rel) {
  const text = read(rel);
  const tokenRe = />(?:(?:C|₵)\s?(\d+)|([A-Z]{1,3}\d{1,2}))</g;
  const MAX_GAP = 800; // chars between a dish code and its price within one row/card
  let lastId = null;
  let lastIdEnd = -1;
  let checked = 0;
  let match;
  while ((match = tokenRe.exec(text)) !== null) {
    const price = match[1];
    const id = match[2];
    if (id !== undefined) {
      lastId = id;
      lastIdEnd = tokenRe.lastIndex;
      continue;
    }
    if (price === undefined || lastId === null) continue;
    if (match.index - lastIdEnd > MAX_GAP) {
      lastId = null;
      continue;
    }
    const code = lastId;
    lastId = null; // consume so one code maps to one price
    const item = byId.get(code);
    if (!item) {
      fail(rel, `shows dish code "${code}" which is not in the canonical catalog.`);
      continue;
    }
    checked += 1;
    if (Number(price) !== item.price) {
      fail(rel, `${code} shows ₵${price} but catalog says ₵${item.price}.`);
    }
  }
  if (checked === 0) fail(rel, 'no dish-code/price pairs detected — parser may be stale.');
  else summary.push(`${rel}: ${checked} prices checked`);
}

checkGeneratedFunctionsCatalog();
['index.html', 'assets/js/firebase-ai-chatbot.js'].forEach(checkJsArray);
['menu.html', 'downloadable-menu.html', 'chinese/menu.html', 'chinese/index.html'].forEach(checkStaticHtml);

console.log(`Menu catalog: ${catalog.length} canonical items (data/menu-catalog.json).`);
summary.forEach((line) => console.log(`  ✓ ${line}`));

if (problems.length) {
  console.error(`\nMenu catalog drift detected (${problems.length}):`);
  problems.forEach((line) => console.error(`  ✗ ${line}`));
  process.exit(1);
}
console.log('Menu catalog is consistent across all consumers.');
