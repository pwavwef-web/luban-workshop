'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const catalog = require(path.join(ROOT, 'data', 'menu-catalog.json'));
const backendCatalog = require(path.join(ROOT, 'functions', 'menu-catalog.js'));

const CATEGORIES = new Set([
  'soups',
  'starters',
  'beef-lamb',
  'pork',
  'chicken',
  'seafood',
  'rice',
  'noodles',
  'dumplings',
  'veg',
  'drinks'
]);

test('catalog is a non-empty array', () => {
  assert.ok(Array.isArray(catalog));
  assert.ok(catalog.length > 0);
});

test('every item has the required fields', () => {
  for (const item of catalog) {
    assert.equal(typeof item.id, 'string', `id missing on ${JSON.stringify(item)}`);
    assert.equal(typeof item.name, 'string', `name missing on ${item.id}`);
    assert.equal(typeof item.nameZh, 'string', `nameZh missing on ${item.id}`);
    assert.equal(typeof item.category, 'string', `category missing on ${item.id}`);
    assert.equal(typeof item.price, 'number', `price missing on ${item.id}`);
  }
});

test('dish ids are unique', () => {
  const ids = catalog.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('dish ids follow the LETTERS+DIGITS code format', () => {
  for (const item of catalog) {
    assert.match(item.id, /^[A-Z]{1,3}\d{1,2}$/, `bad id: ${item.id}`);
  }
});

test('prices are positive integers (Ghana cedi, whole units)', () => {
  for (const item of catalog) {
    assert.ok(Number.isInteger(item.price), `${item.id} price not an integer`);
    assert.ok(item.price > 0, `${item.id} price not positive`);
  }
});

test('categories are from the known set', () => {
  for (const item of catalog) {
    assert.ok(CATEGORIES.has(item.category), `${item.id} has unknown category "${item.category}"`);
  }
});

test('generated backend catalog (functions/menu-catalog.js) matches the canonical source', () => {
  // The backend computes order totals from these prices; drift here means money drift.
  assert.equal(backendCatalog.length, catalog.length);
  const expected = catalog.map(({ id, name, price }) => ({ id, name, price }));
  assert.deepEqual(backendCatalog, expected);
});
