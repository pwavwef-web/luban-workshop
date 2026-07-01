'use strict';

// Generates functions/menu-catalog.js from the canonical data/menu-catalog.json.
//
// The Cloud Functions codebase is deployed from the functions/ directory alone,
// so it cannot require() the repo-root data/ file at runtime. Instead we generate
// a self-contained module here at build time. The backend only needs id/name/price
// (it computes order totals from price); category/nameZh stay in the JSON for the
// site and admin consumers. `npm run check:menu` fails if this file drifts.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(root, 'data', 'menu-catalog.json');
const OUTPUT_PATH = path.join(root, 'functions', 'menu-catalog.js');

function singleQuote(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function loadCatalog() {
  return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
}

function renderFunctionsCatalog(catalog) {
  const rows = catalog.map(
    (item) => `  { id: ${singleQuote(item.id)}, name: ${singleQuote(item.name)}, price: ${Number(item.price)} }`
  );
  return [
    '// AUTO-GENERATED from data/menu-catalog.json by tools/build-menu-catalog.js.',
    '// Do not edit by hand; run `npm run build:menu` after changing the catalog.',
    'module.exports = [',
    rows.join(',\n'),
    '];',
    ''
  ].join('\n');
}

function build() {
  const catalog = loadCatalog();
  const output = renderFunctionsCatalog(catalog);
  fs.writeFileSync(OUTPUT_PATH, output);
  return { count: catalog.length, output };
}

module.exports = { loadCatalog, renderFunctionsCatalog, build, CATALOG_PATH, OUTPUT_PATH };

if (require.main === module) {
  const { count } = build();
  console.log(`Generated functions/menu-catalog.js from data/menu-catalog.json (${count} items).`);
}
