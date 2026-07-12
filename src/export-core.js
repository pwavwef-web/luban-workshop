'use strict';

// Pure, dependency-free helpers for admin data exports.
//
// This module is deliberately isomorphic: it is consumed by src/admin-export.js
// (bundled for the browser by esbuild) and unit-tested directly in Node
// (tests/unit/export-core.test.js). It must NOT touch the DOM, `window`, Firebase,
// or any browser-only global other than the standard ones available in both
// environments (TextEncoder, Uint8Array, DataView, ...).
//
// It produces genuinely valid files:
//   - CSV  (RFC 4180, UTF-8, with spreadsheet formula-injection guarding)
//   - XLSX (SpreadsheetML worksheets packaged into a STORED zip — real Excel files)

// ---------------------------------------------------------------------------
// UTF-8
// ---------------------------------------------------------------------------
const encoder = new TextEncoder();
function toUtf8Bytes(str) {
  return encoder.encode(str == null ? '' : String(str));
}

// ---------------------------------------------------------------------------
// CRC-32 (ISO-HDLC / zlib) — required for each ZIP entry
// ---------------------------------------------------------------------------
const CRC_TABLE = (function buildCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ---------------------------------------------------------------------------
// CSV (RFC 4180)
// ---------------------------------------------------------------------------

// Neutralise cells that a spreadsheet could interpret as a formula (=, +, -, @).
// Only applies to string cells; numeric cells are emitted verbatim.
function csvCell(value) {
  if (value == null) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function buildCsv(headers, matrix) {
  const lines = [];
  lines.push((headers || []).map(csvCell).join(','));
  for (const row of matrix || []) {
    lines.push((row || []).map(csvCell).join(','));
  }
  return lines.join('\r\n');
}

// ---------------------------------------------------------------------------
// XLSX (Office Open XML SpreadsheetML)
// ---------------------------------------------------------------------------

// Strip characters that are illegal in XML 1.0 so Excel never sees a corrupt part.
function stripInvalidXml(str) {
  const s = String(str == null ? '' : str);
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 55295) || (code >= 57344 && code <= 65533)) {
      out += s.charAt(i);
    }
  }
  return out;
}
function xmlEscape(value) {
  return stripInvalidXml(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 0-based column index -> spreadsheet column letters (0->A, 25->Z, 26->AA, ...)
function columnLetter(index) {
  let n = Number(index);
  let out = '';
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

function isNumericCell(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

// styleIndex: 0 = default body, 1 = bold header (see STYLES_XML below)
function cellXml(ref, value, styleIndex) {
  const styleAttr = styleIndex ? ' s="' + styleIndex + '"' : '';
  if (isNumericCell(value)) {
    return '<c r="' + ref + '"' + styleAttr + '><v>' + value + '</v></c>';
  }
  const text = xmlEscape(value == null ? '' : String(value));
  return (
    '<c r="' + ref + '"' + styleAttr + ' t="inlineStr"><is><t xml:space="preserve">' +
    text +
    '</t></is></c>'
  );
}

function sanitizeSheetName(name, index) {
  let s = String(name == null ? '' : name).replace(/[\\/?*[\]:]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) s = 'Sheet' + (index + 1);
  if (s.length > 31) s = s.slice(0, 31).trim();
  return s;
}

function sheetXml(sheet) {
  const headers = sheet.headers || [];
  const matrix = sheet.matrix || [];
  const colCount = headers.length;

  const rows = [];

  const headerCells = headers
    .map((h, c) => cellXml(columnLetter(c) + '1', h == null ? '' : String(h), 1))
    .join('');
  rows.push('<row r="1">' + headerCells + '</row>');

  for (let r = 0; r < matrix.length; r++) {
    const rowNumber = r + 2;
    const rowData = matrix[r] || [];
    const cells = rowData
      .map((v, c) => cellXml(columnLetter(c) + rowNumber, v, 0))
      .join('');
    rows.push('<row r="' + rowNumber + '">' + cells + '</row>');
  }

  // Approximate auto-fit column widths from content length.
  let colsXml = '';
  if (colCount) {
    const widths = [];
    for (let c = 0; c < colCount; c++) {
      let max = String(headers[c] == null ? '' : headers[c]).length;
      for (let r = 0; r < matrix.length; r++) {
        const v = (matrix[r] || [])[c];
        const len = v == null ? 0 : String(v).length;
        if (len > max) max = len;
      }
      widths.push(Math.min(70, Math.max(10, max + 2)));
    }
    colsXml =
      '<cols>' +
      widths
        .map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>')
        .join('') +
      '</cols>';
  }

  const frozenHeader =
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>';

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    frozenHeader +
    colsXml +
    '<sheetData>' +
    rows.join('') +
    '</sheetData></worksheet>'
  );
}

const STYLES_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="2">' +
  '<font><sz val="11"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>' +
  '</fonts>' +
  '<fills count="3">' +
  '<fill><patternFill patternType="none"/></fill>' +
  '<fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FF7F1D1D"/><bgColor indexed="64"/></patternFill></fill>' +
  '</fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="2">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
  '</cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  '</styleSheet>';

// Package the given files into a ZIP archive using the STORED (uncompressed)
// method. No DEFLATE dependency needed; export payloads are small.
function zipStore(files) {
  const chunks = [];
  let offset = 0;
  const records = [];

  function push(bytes) {
    chunks.push(bytes);
    offset += bytes.length;
  }

  for (const file of files) {
    const nameBytes = toUtf8Bytes(file.name);
    const data = file.data;
    const crc = crc32(data);
    const localHeaderOffset = offset;

    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); // local file header signature
    view.setUint16(4, 20, true); // version needed to extract
    view.setUint16(6, 0x0800, true); // general purpose flag: UTF-8 names
    view.setUint16(8, 0, true); // compression method: 0 = store
    view.setUint16(10, 0, true); // mod time
    view.setUint16(12, 0x21, true); // mod date (1980-01-01)
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true); // compressed size
    view.setUint32(22, data.length, true); // uncompressed size
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true); // extra field length
    header.set(nameBytes, 30);

    push(header);
    push(data);
    records.push({ nameBytes, crc, size: data.length, localHeaderOffset });
  }

  const centralStart = offset;
  for (const rec of records) {
    const entry = new Uint8Array(46 + rec.nameBytes.length);
    const view = new DataView(entry.buffer);
    view.setUint32(0, 0x02014b50, true); // central directory header signature
    view.setUint16(4, 20, true); // version made by
    view.setUint16(6, 20, true); // version needed
    view.setUint16(8, 0x0800, true); // flags: UTF-8
    view.setUint16(10, 0, true); // compression: store
    view.setUint16(12, 0, true); // mod time
    view.setUint16(14, 0x21, true); // mod date
    view.setUint32(16, rec.crc, true);
    view.setUint32(20, rec.size, true); // compressed size
    view.setUint32(24, rec.size, true); // uncompressed size
    view.setUint16(28, rec.nameBytes.length, true);
    view.setUint16(30, 0, true); // extra length
    view.setUint16(32, 0, true); // comment length
    view.setUint16(34, 0, true); // disk number start
    view.setUint16(36, 0, true); // internal attributes
    view.setUint32(38, 0, true); // external attributes
    view.setUint32(42, rec.localHeaderOffset, true);
    entry.set(rec.nameBytes, 46);
    push(entry);
  }
  const centralSize = offset - centralStart;

  const eocd = new Uint8Array(22);
  const eview = new DataView(eocd.buffer);
  eview.setUint32(0, 0x06054b50, true); // end of central directory signature
  eview.setUint16(4, 0, true); // disk number
  eview.setUint16(6, 0, true); // central directory start disk
  eview.setUint16(8, records.length, true); // entries on this disk
  eview.setUint16(10, records.length, true); // total entries
  eview.setUint32(12, centralSize, true);
  eview.setUint32(16, centralStart, true);
  eview.setUint16(20, 0, true); // comment length
  push(eocd);

  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of chunks) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

// sheets: [{ name, headers: string[], matrix: (string|number)[][] }]
function buildXlsx(sheets) {
  const safeSheets = (sheets || []).map((s, i) => ({
    name: sanitizeSheetName(s && s.name, i),
    headers: (s && s.headers) || [],
    matrix: (s && s.matrix) || []
  }));
  if (!safeSheets.length) {
    safeSheets.push({ name: 'Sheet1', headers: [], matrix: [] });
  }

  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    safeSheets
      .map(
        (s, i) =>
          '<Override PartName="/xl/worksheets/sheet' +
          (i + 1) +
          '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
      )
      .join('') +
    '</Types>';

  const rootRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';

  const workbook =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheets>' +
    safeSheets
      .map(
        (s, i) =>
          '<sheet name="' + xmlEscape(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'
      )
      .join('') +
    '</sheets></workbook>';

  const workbookRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    safeSheets
      .map(
        (s, i) =>
          '<Relationship Id="rId' +
          (i + 1) +
          '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' +
          (i + 1) +
          '.xml"/>'
      )
      .join('') +
    '<Relationship Id="rId' +
    (safeSheets.length + 1) +
    '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>';

  const files = [
    { name: '[Content_Types].xml', data: toUtf8Bytes(contentTypes) },
    { name: '_rels/.rels', data: toUtf8Bytes(rootRels) },
    { name: 'xl/workbook.xml', data: toUtf8Bytes(workbook) },
    { name: 'xl/_rels/workbook.xml.rels', data: toUtf8Bytes(workbookRels) },
    { name: 'xl/styles.xml', data: toUtf8Bytes(STYLES_XML) }
  ];
  safeSheets.forEach((s, i) => {
    files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: toUtf8Bytes(sheetXml(s)) });
  });

  return zipStore(files);
}

// ---------------------------------------------------------------------------
// Order export formatting
// ---------------------------------------------------------------------------
function cleanToken(value) {
  return String(value == null ? '' : value).trim();
}

function titleize(value) {
  return cleanToken(value)
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function normalizeOrderStatus(status) {
  return cleanToken(status || 'pending').toLowerCase() || 'pending';
}

function isPreOrder(order) {
  if (!order || typeof order !== 'object') return false;
  const timing = cleanToken(order.orderTiming).toLowerCase();
  return (
    timing === 'pre_order_request' ||
    timing === 'preorder' ||
    timing === 'pre-order' ||
    order.placedOutsideHours === true ||
    Boolean(order.requestedFor) ||
    Boolean(cleanToken(order.requestedForLabel))
  );
}

function formatOrderTiming(order) {
  if (!order || typeof order !== 'object') return '';
  const timing = cleanToken(order.orderTiming).toLowerCase();
  if (isPreOrder(order)) return 'Pre-order request';
  if (timing === 'asap' || !timing) return 'ASAP / in-hours';
  return titleize(timing);
}

function formatOrderStatus(order) {
  const data = order && typeof order === 'object' ? order : { status: order };
  const status = normalizeOrderStatus(data.status);
  if (isPreOrder(data)) {
    if (status === 'requested') return 'Pre-order requested';
    if (status === 'accepted') return 'Pre-order accepted';
    if (status === 'rejected') return 'Pre-order rejected';
    if (status === 'cancelled') return 'Pre-order cancelled';
  }
  return titleize(status) || 'Pending';
}

function getOrderRequestDecisionAt(order) {
  if (!isPreOrder(order)) return '';
  const status = normalizeOrderStatus(order.status);
  if (status === 'accepted') return order.acceptedAt || order.updatedAt || '';
  if (status === 'rejected') return order.rejectedAt || order.updatedAt || '';
  if (status === 'cancelled') return order.cancelledAt || order.updatedAt || '';
  return '';
}

function getOrderRequestDecisionBy(order) {
  if (!isPreOrder(order)) return '';
  const status = normalizeOrderStatus(order.status);
  if (status === 'accepted') return order.acceptedBy || order.updatedBy || '';
  if (status === 'rejected') return order.rejectedBy || order.updatedBy || '';
  if (status === 'cancelled') return order.cancelledBy || order.updatedBy || '';
  return '';
}

module.exports = {
  toUtf8Bytes,
  crc32,
  csvCell,
  buildCsv,
  stripInvalidXml,
  xmlEscape,
  columnLetter,
  sanitizeSheetName,
  sheetXml,
  zipStore,
  buildXlsx,
  normalizeOrderStatus,
  isPreOrder,
  formatOrderTiming,
  formatOrderStatus,
  getOrderRequestDecisionAt,
  getOrderRequestDecisionBy
};
