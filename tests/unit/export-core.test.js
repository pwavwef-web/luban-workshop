'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const core = require(path.join(ROOT, 'src', 'export-core.js'));
const {
  crc32,
  toUtf8Bytes,
  csvCell,
  buildCsv,
  columnLetter,
  sanitizeSheetName,
  stripInvalidXml,
  xmlEscape,
  buildXlsx,
  isPreOrder,
  formatOrderTiming,
  formatOrderStatus,
  getOrderRequestDecisionAt,
  getOrderRequestDecisionBy
} = core;

// --- CRC-32 -----------------------------------------------------------------
test('crc32 matches the canonical CRC-32 check value', () => {
  // "123456789" -> 0xCBF43926 is the standard CRC-32/ISO-HDLC check vector.
  assert.equal(crc32(toUtf8Bytes('123456789')), 0xcbf43926);
});

test('crc32 of empty input is 0', () => {
  assert.equal(crc32(toUtf8Bytes('')), 0);
});

test('crc32 is deterministic and content-sensitive', () => {
  assert.equal(crc32(toUtf8Bytes('luban')), crc32(toUtf8Bytes('luban')));
  assert.notEqual(crc32(toUtf8Bytes('luban')), crc32(toUtf8Bytes('workshop')));
});

// --- CSV --------------------------------------------------------------------
test('csvCell quotes commas, quotes, and newlines', () => {
  assert.equal(csvCell('plain'), 'plain');
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('line1\nline2'), '"line1\nline2"');
});

test('csvCell neutralises spreadsheet formula injection on strings only', () => {
  assert.equal(csvCell('=SUM(A1:A2)'), "'=SUM(A1:A2)");
  assert.equal(csvCell('+1234'), "'+1234");
  assert.equal(csvCell('@cmd'), "'@cmd");
  // real numbers must never be quoted/prefixed
  assert.equal(csvCell(-5), '-5');
  assert.equal(csvCell(42.5), '42.5');
});

test('buildCsv joins header and rows with CRLF', () => {
  const csv = buildCsv(['Name', 'Total'], [['Ada', 10], ['Bo, Jr', 20]]);
  assert.equal(csv, 'Name,Total\r\nAda,10\r\n"Bo, Jr",20');
});

// --- Order export fields ----------------------------------------------------
test('order export helpers label preorder timing and statuses for reports', () => {
  const requested = {
    status: 'requested',
    orderTiming: 'pre_order_request',
    requestedForLabel: 'Mon, 6 Jul 2026, 11:00'
  };
  const accepted = {
    status: 'accepted',
    placedOutsideHours: true,
    acceptedAt: '2026-07-06T08:15:00.000Z',
    acceptedBy: 'manager@example.com'
  };

  assert.equal(isPreOrder(requested), true);
  assert.equal(formatOrderTiming(requested), 'Pre-order request');
  assert.equal(formatOrderStatus(requested), 'Pre-order requested');
  assert.equal(formatOrderStatus(accepted), 'Pre-order accepted');
  assert.equal(getOrderRequestDecisionAt(accepted), accepted.acceptedAt);
  assert.equal(getOrderRequestDecisionBy(accepted), accepted.acceptedBy);
});

test('order export helpers keep in-hours orders distinct from preorder requests', () => {
  const order = { status: 'pending', orderTiming: 'asap' };

  assert.equal(isPreOrder(order), false);
  assert.equal(formatOrderTiming(order), 'ASAP / in-hours');
  assert.equal(formatOrderStatus(order), 'Pending');
  assert.equal(getOrderRequestDecisionAt(order), '');
  assert.equal(getOrderRequestDecisionBy(order), '');
});

// --- XLSX helpers -----------------------------------------------------------
test('columnLetter produces spreadsheet-style column names', () => {
  assert.equal(columnLetter(0), 'A');
  assert.equal(columnLetter(25), 'Z');
  assert.equal(columnLetter(26), 'AA');
  assert.equal(columnLetter(27), 'AB');
  assert.equal(columnLetter(701), 'ZZ');
  assert.equal(columnLetter(702), 'AAA');
});

test('sanitizeSheetName strips illegal chars, clamps length, and defaults', () => {
  assert.equal(sanitizeSheetName('Orders', 0), 'Orders');
  assert.equal(sanitizeSheetName('a/b:c*d?e[f]', 0), 'a b c d e f');
  assert.equal(sanitizeSheetName('', 2), 'Sheet3');
  assert.equal(sanitizeSheetName('x'.repeat(50), 0).length, 31);
});

test('stripInvalidXml removes control chars but keeps tab/newline and text', () => {
  const dirty = 'a' + String.fromCharCode(7) + 'b' + String.fromCharCode(0) + 'c\t\n';
  assert.equal(stripInvalidXml(dirty), 'abc\t\n');
});

test('xmlEscape encodes the five XML entities', () => {
  assert.equal(xmlEscape('<a> & "b" \'c\''), '&lt;a&gt; &amp; &quot;b&quot; &apos;c&apos;');
});

// --- XLSX package -----------------------------------------------------------
function readUint16LE(buf, offset) {
  return buf[offset] | (buf[offset + 1] << 8);
}

test('buildXlsx returns a valid STORED zip with the expected entry count', () => {
  const bytes = buildXlsx([
    { name: 'Orders', headers: ['Order ID', 'Total'], matrix: [['#A1B2C3', 45.5]] }
  ]);
  assert.ok(bytes instanceof Uint8Array);
  const buf = Buffer.from(bytes);

  // Local file header signature "PK\x03\x04"
  assert.deepEqual([buf[0], buf[1], buf[2], buf[3]], [0x50, 0x4b, 0x03, 0x04]);

  // End-of-central-directory record is the trailing 22 bytes (no archive comment).
  const eocd = buf.length - 22;
  assert.deepEqual([buf[eocd], buf[eocd + 1], buf[eocd + 2], buf[eocd + 3]], [0x50, 0x4b, 0x05, 0x06]);

  // 5 package parts + 1 worksheet = 6 entries.
  assert.equal(readUint16LE(buf, eocd + 10), 6);

  // STORED entries mean the worksheet XML is embedded uncompressed and searchable.
  assert.ok(buf.includes(Buffer.from('xl/worksheets/sheet1.xml')));
  assert.ok(buf.includes(Buffer.from('Order ID')));
  assert.ok(buf.includes(Buffer.from('45.5')));
});

test('buildXlsx supports multiple sheets (workbook backup)', () => {
  const bytes = buildXlsx([
    { name: 'Orders', headers: ['A'], matrix: [] },
    { name: 'Reservations', headers: ['B'], matrix: [] },
    { name: 'Menu', headers: ['C'], matrix: [] }
  ]);
  const buf = Buffer.from(bytes);
  const eocd = buf.length - 22;
  // 5 base parts + 3 worksheets = 8 entries.
  assert.equal(readUint16LE(buf, eocd + 10), 8);
  assert.ok(buf.includes(Buffer.from('Reservations')));
});
