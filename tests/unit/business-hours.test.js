'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const {
  getBusinessHoursState,
  getNextServiceOpening
} = require(path.join(ROOT, 'functions', 'business-hours.js'));

test('weekday before 11:00 routes to the same-day opening', () => {
  const nextOpening = getNextServiceOpening(new Date('2026-07-06T09:30:00Z'));
  assert.equal(nextOpening.toISOString(), '2026-07-06T11:00:00.000Z');
});

test('weekday during service is open', () => {
  const state = getBusinessHoursState(new Date('2026-07-02T12:00:00Z'));
  assert.equal(state.isOpen, true);
  assert.equal(state.nextOpening, null);
});

test('weekday after 17:30 routes to the next open day', () => {
  const nextOpening = getNextServiceOpening(new Date('2026-07-02T18:00:00Z'));
  assert.equal(nextOpening.toISOString(), '2026-07-03T11:00:00.000Z');
});

test('weekend routes to Monday 11:00', () => {
  const nextOpening = getNextServiceOpening(new Date('2026-07-04T12:00:00Z'));
  assert.equal(nextOpening.toISOString(), '2026-07-06T11:00:00.000Z');
});
