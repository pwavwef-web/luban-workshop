(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/export-core.js
  var require_export_core = __commonJS({
    "src/export-core.js"(exports, module) {
      "use strict";
      var encoder = new TextEncoder();
      function toUtf8Bytes(str) {
        return encoder.encode(str == null ? "" : String(str));
      }
      var CRC_TABLE = (function buildCrcTable() {
        const table = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
          let c = n;
          for (let k = 0; k < 8; k++) {
            c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
          }
          table[n] = c >>> 0;
        }
        return table;
      })();
      function crc32(bytes) {
        let crc = 4294967295;
        for (let i = 0; i < bytes.length; i++) {
          crc = crc >>> 8 ^ CRC_TABLE[(crc ^ bytes[i]) & 255];
        }
        return (crc ^ 4294967295) >>> 0;
      }
      function csvCell(value) {
        if (value == null) return "";
        if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
        let s = String(value);
        if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
        if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
        return s;
      }
      function buildCsv2(headers, matrix) {
        const lines = [];
        lines.push((headers || []).map(csvCell).join(","));
        for (const row of matrix || []) {
          lines.push((row || []).map(csvCell).join(","));
        }
        return lines.join("\r\n");
      }
      function stripInvalidXml(str) {
        const s = String(str == null ? "" : str);
        let out = "";
        for (let i = 0; i < s.length; i++) {
          const code = s.charCodeAt(i);
          if (code === 9 || code === 10 || code === 13 || code >= 32 && code <= 55295 || code >= 57344 && code <= 65533) {
            out += s.charAt(i);
          }
        }
        return out;
      }
      function xmlEscape(value) {
        return stripInvalidXml(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
      }
      function columnLetter(index) {
        let n = Number(index);
        let out = "";
        do {
          out = String.fromCharCode(65 + n % 26) + out;
          n = Math.floor(n / 26) - 1;
        } while (n >= 0);
        return out;
      }
      function isNumericCell(value) {
        return typeof value === "number" && Number.isFinite(value);
      }
      function cellXml(ref, value, styleIndex) {
        const styleAttr = styleIndex ? ' s="' + styleIndex + '"' : "";
        if (isNumericCell(value)) {
          return '<c r="' + ref + '"' + styleAttr + "><v>" + value + "</v></c>";
        }
        const text = xmlEscape(value == null ? "" : String(value));
        return '<c r="' + ref + '"' + styleAttr + ' t="inlineStr"><is><t xml:space="preserve">' + text + "</t></is></c>";
      }
      function sanitizeSheetName(name, index) {
        let s = String(name == null ? "" : name).replace(/[\\/?*[\]:]/g, " ").replace(/\s+/g, " ").trim();
        if (!s) s = "Sheet" + (index + 1);
        if (s.length > 31) s = s.slice(0, 31).trim();
        return s;
      }
      function sheetXml(sheet) {
        const headers = sheet.headers || [];
        const matrix = sheet.matrix || [];
        const colCount = headers.length;
        const rows = [];
        const headerCells = headers.map((h, c) => cellXml(columnLetter(c) + "1", h == null ? "" : String(h), 1)).join("");
        rows.push('<row r="1">' + headerCells + "</row>");
        for (let r = 0; r < matrix.length; r++) {
          const rowNumber = r + 2;
          const rowData = matrix[r] || [];
          const cells = rowData.map((v, c) => cellXml(columnLetter(c) + rowNumber, v, 0)).join("");
          rows.push('<row r="' + rowNumber + '">' + cells + "</row>");
        }
        let colsXml = "";
        if (colCount) {
          const widths = [];
          for (let c = 0; c < colCount; c++) {
            let max = String(headers[c] == null ? "" : headers[c]).length;
            for (let r = 0; r < matrix.length; r++) {
              const v = (matrix[r] || [])[c];
              const len = v == null ? 0 : String(v).length;
              if (len > max) max = len;
            }
            widths.push(Math.min(70, Math.max(10, max + 2)));
          }
          colsXml = "<cols>" + widths.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join("") + "</cols>";
        }
        const frozenHeader = '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>';
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + frozenHeader + colsXml + "<sheetData>" + rows.join("") + "</sheetData></worksheet>";
      }
      var STYLES_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF7F1D1D"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
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
          view.setUint32(0, 67324752, true);
          view.setUint16(4, 20, true);
          view.setUint16(6, 2048, true);
          view.setUint16(8, 0, true);
          view.setUint16(10, 0, true);
          view.setUint16(12, 33, true);
          view.setUint32(14, crc, true);
          view.setUint32(18, data.length, true);
          view.setUint32(22, data.length, true);
          view.setUint16(26, nameBytes.length, true);
          view.setUint16(28, 0, true);
          header.set(nameBytes, 30);
          push(header);
          push(data);
          records.push({ nameBytes, crc, size: data.length, localHeaderOffset });
        }
        const centralStart = offset;
        for (const rec of records) {
          const entry = new Uint8Array(46 + rec.nameBytes.length);
          const view = new DataView(entry.buffer);
          view.setUint32(0, 33639248, true);
          view.setUint16(4, 20, true);
          view.setUint16(6, 20, true);
          view.setUint16(8, 2048, true);
          view.setUint16(10, 0, true);
          view.setUint16(12, 0, true);
          view.setUint16(14, 33, true);
          view.setUint32(16, rec.crc, true);
          view.setUint32(20, rec.size, true);
          view.setUint32(24, rec.size, true);
          view.setUint16(28, rec.nameBytes.length, true);
          view.setUint16(30, 0, true);
          view.setUint16(32, 0, true);
          view.setUint16(34, 0, true);
          view.setUint16(36, 0, true);
          view.setUint32(38, 0, true);
          view.setUint32(42, rec.localHeaderOffset, true);
          entry.set(rec.nameBytes, 46);
          push(entry);
        }
        const centralSize = offset - centralStart;
        const eocd = new Uint8Array(22);
        const eview = new DataView(eocd.buffer);
        eview.setUint32(0, 101010256, true);
        eview.setUint16(4, 0, true);
        eview.setUint16(6, 0, true);
        eview.setUint16(8, records.length, true);
        eview.setUint16(10, records.length, true);
        eview.setUint32(12, centralSize, true);
        eview.setUint32(16, centralStart, true);
        eview.setUint16(20, 0, true);
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
      function buildXlsx2(sheets) {
        const safeSheets = (sheets || []).map((s, i) => ({
          name: sanitizeSheetName(s && s.name, i),
          headers: s && s.headers || [],
          matrix: s && s.matrix || []
        }));
        if (!safeSheets.length) {
          safeSheets.push({ name: "Sheet1", headers: [], matrix: [] });
        }
        const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + safeSheets.map(
          (s, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        ).join("") + "</Types>";
        const rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
        const workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + safeSheets.map(
          (s, i) => '<sheet name="' + xmlEscape(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'
        ).join("") + "</sheets></workbook>";
        const workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + safeSheets.map(
          (s, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'
        ).join("") + '<Relationship Id="rId' + (safeSheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
        const files = [
          { name: "[Content_Types].xml", data: toUtf8Bytes(contentTypes) },
          { name: "_rels/.rels", data: toUtf8Bytes(rootRels) },
          { name: "xl/workbook.xml", data: toUtf8Bytes(workbook) },
          { name: "xl/_rels/workbook.xml.rels", data: toUtf8Bytes(workbookRels) },
          { name: "xl/styles.xml", data: toUtf8Bytes(STYLES_XML) }
        ];
        safeSheets.forEach((s, i) => {
          files.push({ name: "xl/worksheets/sheet" + (i + 1) + ".xml", data: toUtf8Bytes(sheetXml(s)) });
        });
        return zipStore(files);
      }
      function cleanToken(value) {
        return String(value == null ? "" : value).trim();
      }
      function titleize(value) {
        return cleanToken(value).split(/[_\s-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ");
      }
      function normalizeOrderStatus(status) {
        return cleanToken(status || "pending").toLowerCase() || "pending";
      }
      function isPreOrder(order) {
        if (!order || typeof order !== "object") return false;
        const timing = cleanToken(order.orderTiming).toLowerCase();
        return timing === "pre_order_request" || timing === "preorder" || timing === "pre-order" || order.placedOutsideHours === true || Boolean(order.requestedFor) || Boolean(cleanToken(order.requestedForLabel));
      }
      function formatOrderTiming2(order) {
        if (!order || typeof order !== "object") return "";
        const timing = cleanToken(order.orderTiming).toLowerCase();
        if (isPreOrder(order)) return "Pre-order request";
        if (timing === "asap" || !timing) return "ASAP / in-hours";
        return titleize(timing);
      }
      function formatOrderStatus2(order) {
        const data = order && typeof order === "object" ? order : { status: order };
        const status = normalizeOrderStatus(data.status);
        if (isPreOrder(data)) {
          if (status === "requested") return "Pre-order requested";
          if (status === "accepted") return "Pre-order accepted";
          if (status === "rejected") return "Pre-order rejected";
          if (status === "cancelled") return "Pre-order cancelled";
        }
        return titleize(status) || "Pending";
      }
      function getOrderRequestDecisionAt2(order) {
        if (!isPreOrder(order)) return "";
        const status = normalizeOrderStatus(order.status);
        if (status === "accepted") return order.acceptedAt || order.updatedAt || "";
        if (status === "rejected") return order.rejectedAt || order.updatedAt || "";
        if (status === "cancelled") return order.cancelledAt || order.updatedAt || "";
        return "";
      }
      function getOrderRequestDecisionBy2(order) {
        if (!isPreOrder(order)) return "";
        const status = normalizeOrderStatus(order.status);
        if (status === "accepted") return order.acceptedBy || order.updatedBy || "";
        if (status === "rejected") return order.rejectedBy || order.updatedBy || "";
        if (status === "cancelled") return order.cancelledBy || order.updatedBy || "";
        return "";
      }
      module.exports = {
        toUtf8Bytes,
        crc32,
        csvCell,
        buildCsv: buildCsv2,
        stripInvalidXml,
        xmlEscape,
        columnLetter,
        sanitizeSheetName,
        sheetXml,
        zipStore,
        buildXlsx: buildXlsx2,
        normalizeOrderStatus,
        isPreOrder,
        formatOrderTiming: formatOrderTiming2,
        formatOrderStatus: formatOrderStatus2,
        getOrderRequestDecisionAt: getOrderRequestDecisionAt2,
        getOrderRequestDecisionBy: getOrderRequestDecisionBy2
      };
    }
  });

  // src/admin-export.js
  var Core = __toESM(require_export_core());
  function getDb() {
    if (!window.db) throw new Error("Dashboard database is not ready yet. Please wait a moment and retry.");
    return window.db;
  }
  function toDate(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") {
      try {
        return value.toDate();
      } catch (e) {
        return null;
      }
    }
    if (value instanceof Date) return value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  function fmtDateTime(value) {
    const d = toDate(value);
    if (!d) return "";
    return d.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }
  function fmtDate(value) {
    const d = toDate(value);
    if (!d) return "";
    return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });
  }
  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  function round2(v) {
    return Math.round(num(v) * 100) / 100;
  }
  function money(v) {
    return "GHS " + num(v).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function esc(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function fileStamp() {
    const d = /* @__PURE__ */ new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  function summarizeOrders(entries) {
    const norm = (s) => String(s || "pending").toLowerCase();
    const isDead = (s) => s === "cancelled" || s === "rejected";
    let total = 0, completed = 0, completedRevenue = 0, cancelled = 0, active = 0, gross = 0;
    const itemQty = {};
    entries.forEach(({ data }) => {
      const s = norm(data.status);
      total++;
      const val = num(data.total);
      if (s === "completed") {
        completed++;
        completedRevenue += val;
      }
      if (isDead(s)) {
        cancelled++;
      } else {
        gross += val;
        if (s !== "completed") active++;
        if (Array.isArray(data.items)) {
          data.items.forEach((it) => {
            const name = it && it.name ? String(it.name) : "Unknown item";
            itemQty[name] = (itemQty[name] || 0) + num(it && it.quantity);
          });
        }
      }
    });
    const avg = completed ? completedRevenue / completed : 0;
    const topItems = Object.keys(itemQty).map((name) => [name, itemQty[name]]).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const cards = [
      { label: "Total orders", value: String(total) },
      { label: "Completed", value: String(completed) },
      { label: "Revenue (completed)", value: money(completedRevenue) },
      { label: "Open / in progress", value: String(active) },
      { label: "Avg completed order", value: money(avg) },
      { label: "Cancelled / rejected", value: String(cancelled) }
    ];
    const matrix = [
      ["Total orders", total],
      ["Completed orders", completed],
      ["Revenue from completed (GHS)", round2(completedRevenue)],
      ["Open / in progress", active],
      ["Average completed order (GHS)", round2(avg)],
      ["Gross pipeline value (GHS)", round2(gross)],
      ["Cancelled / rejected", cancelled]
    ];
    if (topItems.length) {
      matrix.push(["", ""]);
      matrix.push(["Top items (units sold)", ""]);
      topItems.forEach(([name, qty]) => matrix.push([name, qty]));
    }
    return { cards, topItems, sheet: { name: "Summary", headers: ["Metric", "Value"], matrix } };
  }
  function summarizeReservations(entries) {
    const norm = (s) => {
      const v = String(s || "pending").toLowerCase();
      if (v === "completed") return "confirmed";
      return v === "confirmed" || v === "rejected" ? v : "pending";
    };
    let total = 0, pending = 0, confirmed = 0, rejected = 0, confirmedGuests = 0;
    entries.forEach(({ data }) => {
      total++;
      const s = norm(data.status);
      if (s === "pending") pending++;
      else if (s === "confirmed") {
        confirmed++;
        confirmedGuests += num(data.guests);
      } else if (s === "rejected") rejected++;
    });
    const cards = [
      { label: "Total reservations", value: String(total) },
      { label: "Confirmed", value: String(confirmed) },
      { label: "Pending", value: String(pending) },
      { label: "Rejected", value: String(rejected) },
      { label: "Confirmed guests", value: String(confirmedGuests) }
    ];
    const matrix = [
      ["Total reservations", total],
      ["Confirmed", confirmed],
      ["Pending", pending],
      ["Rejected", rejected],
      ["Confirmed guests (party sizes)", confirmedGuests]
    ];
    return { cards, topItems: [], sheet: { name: "Summary", headers: ["Metric", "Value"], matrix } };
  }
  function promoVisible(d) {
    return d.active === true || d.status === "active" || d.visible === true;
  }
  function promoPricing(d) {
    const items = Array.isArray(d.items) ? d.items : [];
    if (d.discountType === "bundle" && d.bundlePrice != null && d.bundlePrice !== "") return "Combo " + money(d.bundlePrice);
    if (d.discountType === "percent" && d.discountPercent) return num(d.discountPercent) + "% off";
    if (items.length) return "Custom per-dish prices";
    return "";
  }
  function chatbotStatus(d) {
    const s = String(d.status || "").toLowerCase();
    if (s === "archived" || d.active === false || d.archived === true) return "Archived";
    return "Active";
  }
  function orderTypeLabel(d) {
    const explicit = String(d.orderTypeLabel || "").trim();
    if (explicit) return explicit;
    const raw = String(d.orderType || "").trim().toLowerCase();
    if (raw === "takeout" || raw === "take_out" || raw === "takeaway" || raw === "take_away" || raw === "pickup") return "Take out";
    if (raw === "delivery") return "Delivery";
    return raw ? raw.replace(/[_-]+/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()) : "";
  }
  var DATASETS = {
    orders: {
      label: "orders",
      title: "Orders Report",
      sheetName: "Orders",
      filename: "luban-orders",
      collection: "orders",
      dateField: "createdAt",
      summarize: summarizeOrders,
      columns: [
        { label: "Order ID", get: (d, id) => "#" + String(id).slice(-6).toUpperCase() },
        { label: "Placed", get: (d) => fmtDateTime(d.createdAt) },
        { label: "Customer", get: (d) => d.customerName || "" },
        { label: "Phone", get: (d) => d.customerPhone || "" },
        { label: "Order type", get: (d) => orderTypeLabel(d) },
        { label: "Timing", get: (d) => Core.formatOrderTiming(d) },
        { label: "Requested for", get: (d) => d.requestedForLabel || fmtDateTime(d.requestedFor) || "" },
        { label: "Items", get: (d) => Array.isArray(d.items) ? d.items.map((i) => `${num(i.quantity)}x ${i.name}`).join("; ") : "" },
        { label: "Item count", number: true, get: (d) => Array.isArray(d.items) ? d.items.reduce((s, i) => s + num(i.quantity), 0) : 0 },
        { label: "Total (GHS)", number: true, money: true, get: (d) => round2(d.total) },
        { label: "Status", get: (d) => Core.formatOrderStatus(d) },
        { label: "Request decision at", get: (d) => fmtDateTime(Core.getOrderRequestDecisionAt(d)) },
        { label: "Request decision by", get: (d) => Core.getOrderRequestDecisionBy(d) }
      ]
    },
    reservations: {
      label: "reservations",
      title: "Reservations Report",
      sheetName: "Reservations",
      filename: "luban-reservations",
      collection: "reservations",
      dateField: "createdAt",
      summarize: summarizeReservations,
      columns: [
        { label: "Guest", get: (d) => d.name || "" },
        { label: "Phone", get: (d) => d.phone || "" },
        { label: "Email", get: (d) => d.email || "" },
        { label: "Date", get: (d) => d.date || "" },
        { label: "Time", get: (d) => d.time || "" },
        { label: "Party size", number: true, get: (d) => num(d.guests) },
        { label: "Status", get: (d) => String(d.status === "completed" ? "confirmed" : d.status || "pending").toUpperCase() },
        { label: "Notes", get: (d) => d.notes || "" },
        { label: "Decision by", get: (d) => d.decisionBy || "" },
        { label: "Decision reason", get: (d) => d.decisionReason || "" },
        { label: "Requested", get: (d) => fmtDateTime(d.createdAt) }
      ]
    },
    menu: {
      label: "menu items",
      title: "Menu Report",
      sheetName: "Menu",
      filename: "luban-menu",
      source: "menu",
      columns: [
        { label: "Dish ID", get: (d) => d.id },
        { label: "Dish", get: (d) => d.name },
        { label: "Category", get: (d) => d.category },
        { label: "Base price (GHS)", number: true, money: true, get: (d) => round2(d.basePrice) },
        { label: "Current price (GHS)", number: true, money: true, get: (d) => round2(d.price) },
        { label: "Price edited", get: (d) => d.edited ? "Yes" : "No" },
        { label: "Status", get: (d) => d.hidden ? "Hidden" : "Visible" }
      ]
    },
    promotions: {
      label: "offers",
      title: "Promotions & Deals",
      sheetName: "Promotions",
      filename: "luban-promotions",
      collection: "promotions",
      columns: [
        { label: "Title", get: (d, id) => d.title || id },
        { label: "Type", get: (d) => d.type === "deal" ? "Deal" : "Promotion" },
        { label: "Status", get: (d) => promoVisible(d) ? "Visible" : "Hidden" },
        { label: "Offer", get: (d) => d.offer || "" },
        { label: "Pricing", get: (d) => promoPricing(d) },
        { label: "Code", get: (d) => d.code || "" },
        { label: "Valid until", get: (d) => d.expiresAt || "" },
        { label: "Dishes", number: true, get: (d) => Array.isArray(d.items) ? d.items.length : 0 },
        { label: "Description", get: (d) => d.description || "" },
        { label: "Updated", get: (d) => fmtDateTime(d.updatedAt || d.createdAt) }
      ]
    },
    messages: {
      label: "messages",
      title: "Messages & AI Reports",
      sheetName: "Messages",
      filename: "luban-messages",
      collection: "contact_messages",
      dateField: "createdAt",
      columns: [
        { label: "Received", get: (d) => fmtDateTime(d.createdAt) },
        { label: "Name", get: (d) => d.name || "" },
        { label: "Email", get: (d) => d.email || "" },
        { label: "Phone", get: (d) => d.phone || d.phoneMasked || "" },
        { label: "Subject", get: (d) => d.subject || "" },
        { label: "Message", get: (d) => d.message || "" },
        { label: "Source", get: (d) => String(d.source || "").toLowerCase() === "assistant" ? "AI report" : "Contact form" },
        { label: "Status", get: (d) => d.read ? "Read" : "Unread" }
      ]
    },
    customers: {
      label: "customers",
      title: "Customers",
      sheetName: "Customers",
      filename: "luban-customers",
      collection: "users",
      dateField: "createdAt",
      columns: [
        { label: "Name", get: (d) => d.name || "" },
        { label: "Email", get: (d) => d.email || "" },
        { label: "Phone", get: (d) => d.phone || "" },
        { label: "Preferred contact", get: (d) => d.preferredContact || "" },
        { label: "Phone verified", get: (d) => d.phoneVerifiedAt || d.verificationStatus === "verified" ? "Yes" : "" },
        { label: "Joined", get: (d) => fmtDateTime(d.createdAt) },
        { label: "Notes", get: (d) => d.notes || "" }
      ]
    },
    specialMenus: {
      label: "special menus",
      title: "Special Menus",
      sheetName: "Special Menus",
      filename: "luban-special-menus",
      collection: "specialMenus",
      columns: [
        { label: "Title", get: (d, id) => d.title || id },
        { label: "Event date", get: (d) => d.eventDate || "" },
        { label: "Status", get: (d) => d.active === true ? "Active" : "Hidden" },
        { label: "Items", number: true, get: (d) => Array.isArray(d.items) ? d.items.length : 0 },
        { label: "Guest note", get: (d) => d.note || "" },
        { label: "Updated", get: (d) => fmtDateTime(d.updatedAt || d.createdAt) }
      ]
    },
    chatbot: {
      label: "chatbot facts",
      title: "Chatbot Facts",
      sheetName: "Chatbot Facts",
      filename: "luban-chatbot-facts",
      collection: "chatbotKnowledge",
      columns: [
        { label: "Title / question", get: (d, id) => d.title || d.name || d.question || id },
        { label: "Answer", get: (d) => d.answer || d.content || d.body || d.description || d.text || "" },
        { label: "Status", get: (d) => chatbotStatus(d) },
        { label: "Updated", get: (d) => fmtDateTime(d.updatedAt || d.createdAt) }
      ]
    },
    admins: {
      label: "admin users",
      title: "Admin Users",
      sheetName: "Admin Users",
      filename: "luban-admins",
      collection: "admins",
      columns: [
        { label: "Admin email", get: (d, id) => id },
        { label: "Added", get: (d) => fmtDate(d.addedAt) },
        { label: "Added by", get: (d) => d.addedBy || "" }
      ]
    }
  };
  function getMenuEntries() {
    const menu = window.HARDCODED_MENU || [];
    const hidden = window.menuHiddenIds;
    const prices = window.menuPriceOverrides || {};
    const isHidden = (id) => hidden && typeof hidden.has === "function" ? hidden.has(id) : false;
    return menu.map((dish) => ({
      id: dish.id,
      data: {
        id: dish.id,
        name: dish.name,
        category: dish.category,
        basePrice: num(dish.price),
        price: prices[dish.id] !== void 0 ? num(prices[dish.id]) : num(dish.price),
        edited: prices[dish.id] !== void 0,
        hidden: isHidden(dish.id)
      }
    }));
  }
  async function fetchEntries(key) {
    const ds = DATASETS[key];
    if (!ds) throw new Error("Unknown export dataset: " + key);
    if (ds.source === "menu") return getMenuEntries();
    const snap = await getDb().collection(ds.collection).get();
    const entries = snap.docs.map((doc) => ({ id: doc.id, data: doc.data() || {} }));
    if (ds.dateField) {
      entries.sort((a, b) => {
        const da = toDate(a.data[ds.dateField]);
        const db = toDate(b.data[ds.dateField]);
        return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
      });
    }
    return entries;
  }
  function withinRange(entry, ds, range) {
    if (!range || !range.from && !range.to || !ds.dateField) return true;
    const d = toDate(entry.data[ds.dateField]);
    if (!d) return false;
    if (range.from && d < range.from) return false;
    if (range.to && d > range.to) return false;
    return true;
  }
  function buildMatrix(ds, entries) {
    const headers = ds.columns.map((c) => c.label);
    const matrix = entries.map((entry) => ds.columns.map((col) => {
      let v;
      try {
        v = col.get(entry.data, entry.id);
      } catch (e) {
        v = "";
      }
      return v == null ? "" : v;
    }));
    return { headers, matrix };
  }
  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  }
  var PRINT_CSS = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1c1917; margin: 0; padding: 28px 26px 60px; }
  .rpt-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; border-bottom: 3px solid #7f1d1d; padding-bottom: 14px; margin-bottom: 18px; }
  .rpt-head h1 { font-size: 22px; margin: 0; color: #7f1d1d; letter-spacing: -0.01em; }
  .rpt-head .sub { margin: 4px 0 0; font-size: 13px; font-weight: 700; color: #44403c; text-transform: uppercase; letter-spacing: 0.08em; }
  .rpt-head .meta { text-align: right; font-size: 11px; color: #57534e; line-height: 1.7; }
  .cards { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
  .card { border: 1px solid #e7e5e4; border-radius: 8px; padding: 10px 14px; min-width: 130px; }
  .card .v { font-size: 18px; font-weight: 800; color: #1c1917; }
  .card .l { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #78716c; margin-top: 2px; }
  h2.sec { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #7f1d1d; margin: 18px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead { display: table-header-group; }
  th { background: #7f1d1d; color: #fff; text-align: left; padding: 7px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; word-break: break-word; }
  tr:nth-child(even) td { background: #faf7f5; }
  td.num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .empty { padding: 30px; text-align: center; color: #78716c; font-style: italic; }
  .rpt-foot { position: fixed; bottom: 16px; left: 26px; right: 26px; border-top: 1px solid #e7e5e4; padding-top: 6px; font-size: 9px; color: #a8a29e; display: flex; justify-content: space-between; }
  @page { margin: 14mm 10mm 16mm; }
  @media print { body { padding-top: 8px; } .rpt-foot { position: fixed; } }
`;
  function reportHtml(ds, headers, matrix, entries, opts) {
    const generated = (/* @__PURE__ */ new Date()).toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    const rangeLabel = opts && opts.range && opts.range.label ? opts.range.label : "All records";
    let summaryHtml = "";
    if (ds.summarize) {
      const summary = ds.summarize(entries);
      const cards = summary.cards.map((c) => `<div class="card"><div class="v">${esc(c.value)}</div><div class="l">${esc(c.label)}</div></div>`).join("");
      summaryHtml += `<div class="cards">${cards}</div>`;
      if (summary.topItems && summary.topItems.length) {
        const rows = summary.topItems.map(([name, qty]) => `<tr><td>${esc(name)}</td><td class="num">${esc(String(qty))}</td></tr>`).join("");
        summaryHtml += `<h2 class="sec">Top items</h2><table><thead><tr><th>Item</th><th class="num">Units</th></tr></thead><tbody>${rows}</tbody></table>`;
      }
    }
    const thead = headers.map((h) => `<th>${esc(h)}</th>`).join("");
    const bodyRows = matrix.map((row) => {
      const cells = row.map((v, i) => {
        const col = ds.columns[i] || {};
        let display;
        if (col.money) display = money(v);
        else if (typeof v === "number") display = v.toLocaleString("en-GB");
        else display = String(v);
        const cls = col.money || col.number || typeof v === "number" ? ' class="num"' : "";
        return `<td${cls}>${esc(display)}</td>`;
      }).join("");
      return `<tr>${cells}</tr>`;
    }).join("");
    const tableHtml = matrix.length ? `<h2 class="sec">Detail (${matrix.length} record${matrix.length === 1 ? "" : "s"})</h2><table><thead><tr>${thead}</tr></thead><tbody>${bodyRows}</tbody></table>` : '<div class="empty">No records for the selected range.</div>';
    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(ds.title)} - Luban Workshop</title><style>${PRINT_CSS}</style></head><body>
    <header class="rpt-head">
      <div><h1>Luban Workshop</h1><p class="sub">${esc(ds.title)}</p></div>
      <div class="meta"><div>Generated ${esc(generated)}</div><div>Range: ${esc(rangeLabel)}</div><div>${matrix.length} record${matrix.length === 1 ? "" : "s"}</div></div>
    </header>
    ${summaryHtml}
    ${tableHtml}
    <footer class="rpt-foot"><span>Luban Workshop - confidential business report</span><span>${esc(generated)}</span></footer>
  </body></html>`;
  }
  function printHtml(html) {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const cleanup = () => {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1500);
    };
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    const run = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
      }
      cleanup();
    };
    if (doc.readyState === "complete") setTimeout(run, 250);
    else iframe.onload = () => setTimeout(run, 250);
  }
  async function runExport(key, format, opts) {
    opts = opts || {};
    const ds = DATASETS[key];
    if (!ds) {
      alert("Unknown export type: " + key);
      return;
    }
    try {
      let entries = await fetchEntries(key);
      if (opts.range) entries = entries.filter((e) => withinRange(e, ds, opts.range));
      const { headers, matrix } = buildMatrix(ds, entries);
      const base = `${ds.filename}-${fileStamp()}`;
      if (format === "csv") {
        const csv = Core.buildCsv(headers, matrix);
        downloadBlob(base + ".csv", new Blob([String.fromCharCode(65279) + csv], { type: "text/csv;charset=utf-8;" }));
      } else if (format === "xlsx" || format === "excel") {
        const sheets = [{ name: ds.sheetName || ds.title, headers, matrix }];
        if (ds.summarize) sheets.unshift(ds.summarize(entries).sheet);
        const bytes = Core.buildXlsx(sheets);
        downloadBlob(base + ".xlsx", new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      } else if (format === "pdf") {
        printHtml(reportHtml(ds, headers, matrix, entries, opts));
      } else {
        alert("Unknown export format: " + format);
        return;
      }
      toast(`Exported ${entries.length} ${ds.label} as ${String(format).toUpperCase().replace("XLSX", "Excel")}.`);
    } catch (err) {
      console.error("Export failed:", err);
      toast("Export failed: " + (err && err.message ? err.message : "unknown error"), true);
    }
  }
  function report(key, format) {
    return runExport(key, format, { range: currentReportRange() });
  }
  async function exportWorkbook() {
    const range = currentReportRange();
    const keys = ["orders", "reservations", "menu", "promotions", "messages", "customers", "specialMenus", "chatbot", "admins"];
    try {
      toast("Building full data backup...");
      const sheets = [];
      for (const key of keys) {
        const ds = DATASETS[key];
        let entries = await fetchEntries(key);
        if (ds.dateField && range) entries = entries.filter((e) => withinRange(e, ds, range));
        const { headers, matrix } = buildMatrix(ds, entries);
        sheets.push({ name: ds.sheetName || ds.title, headers, matrix });
      }
      const bytes = Core.buildXlsx(sheets);
      downloadBlob(`luban-backup-${fileStamp()}.xlsx`, new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      toast("Full data backup exported (Excel workbook, " + sheets.length + " sheets).");
    } catch (err) {
      console.error("Backup failed:", err);
      toast("Backup failed: " + (err && err.message ? err.message : "unknown error"), true);
    }
  }
  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function endOfDay(d) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  }
  function currentReportRange() {
    const sel = document.getElementById("report-range");
    if (!sel) return null;
    const now = /* @__PURE__ */ new Date();
    const DAY = 864e5;
    switch (sel.value) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now), label: "Today" };
      case "7d":
        return { from: startOfDay(new Date(now.getTime() - 6 * DAY)), to: endOfDay(now), label: "Last 7 days" };
      case "30d":
        return { from: startOfDay(new Date(now.getTime() - 29 * DAY)), to: endOfDay(now), label: "Last 30 days" };
      case "month":
        return { from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: endOfDay(now), label: "This month" };
      case "custom": {
        const fromEl = document.getElementById("report-from");
        const toEl = document.getElementById("report-to");
        const from = fromEl && fromEl.value ? startOfDay(new Date(fromEl.value)) : null;
        const to = toEl && toEl.value ? endOfDay(new Date(toEl.value)) : null;
        if (!from && !to) return null;
        const label = `${from ? from.toLocaleDateString("en-GB") : "start"} to ${to ? to.toLocaleDateString("en-GB") : "now"}`;
        return { from, to, label };
      }
      default:
        return null;
    }
  }
  function injectStylesOnce() {
    if (document.getElementById("admin-export-styles")) return;
    const style = document.createElement("style");
    style.id = "admin-export-styles";
    style.textContent = `
    .admin-export { position: relative; display: inline-block; }
    .admin-export > summary { list-style: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem;
      border: 1px solid #d6d3d1; background: #fff; color: #44403c; border-radius: 8px; padding: 0.5rem 0.9rem;
      font-size: 0.8125rem; font-weight: 700; white-space: nowrap; transition: border-color .15s, background .15s, color .15s; }
    .admin-export > summary::-webkit-details-marker { display: none; }
    .admin-export > summary:hover { border-color: #fecaca; background: #fff1f1; color: #b91c1c; }
    .admin-export[open] > summary { border-color: #fecaca; background: #fff1f1; color: #b91c1c; }
    .admin-export__menu { position: absolute; right: 0; top: calc(100% + 6px); z-index: 40; min-width: 190px;
      background: #fff; border: 1px solid #e7e5e4; border-radius: 10px; box-shadow: 0 18px 40px -18px rgba(28,25,23,.4); padding: 6px; }
    .admin-export__title { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #a8a29e; padding: 6px 10px 4px; }
    .admin-export__menu button { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 0.75rem;
      background: none; border: 0; text-align: left; cursor: pointer; border-radius: 6px; padding: 0.5rem 0.65rem;
      font-size: 0.8125rem; font-weight: 600; color: #44403c; }
    .admin-export__menu button:hover { background: #fff1f1; color: #b91c1c; }
    .admin-export__menu button .tag { font-size: 0.65rem; font-weight: 700; color: #a8a29e; }
    .admin-report-actions { display: grid; gap: 0.5rem; grid-template-columns: 1fr; }
    @media (min-width: 640px) { .admin-report-actions { grid-template-columns: repeat(2, minmax(0,1fr)); } }
    @media (min-width: 1024px) { .admin-report-actions { grid-template-columns: repeat(3, minmax(0,1fr)); } }
    .admin-report-tile { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
      border: 1px solid #e7e5e4; border-radius: 10px; padding: 0.75rem 0.9rem; background: #fff; }
    .admin-report-tile__name { font-size: 0.8125rem; font-weight: 800; color: #292524; }
    .admin-report-tile__btns { display: flex; gap: 0.35rem; flex-shrink: 0; }
    .admin-report-tile__btns button { border: 1px solid #d6d3d1; background: #fff; color: #57534e; border-radius: 6px;
      padding: 0.3rem 0.6rem; font-size: 0.72rem; font-weight: 800; cursor: pointer; transition: all .15s; }
    .admin-report-tile__btns button:hover { border-color: #fecaca; background: #fff1f1; color: #b91c1c; }
    #admin-export-toast { position: fixed; left: 50%; bottom: 26px; transform: translateX(-50%) translateY(20px);
      background: #1c1917; color: #fafaf9; padding: 0.7rem 1.1rem; border-radius: 999px; font-size: 0.8125rem; font-weight: 600;
      box-shadow: 0 18px 40px -14px rgba(0,0,0,.5); opacity: 0; pointer-events: none; transition: opacity .25s, transform .25s; z-index: 9999; max-width: 90vw; }
    #admin-export-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    #admin-export-toast.err { background: #991b1b; }
  `;
    document.head.appendChild(style);
  }
  var toastTimer = null;
  function toast(message, isError) {
    injectStylesOnce();
    let el = document.getElementById("admin-export-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "admin-export-toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.toggle("err", !!isError);
    void el.offsetWidth;
    el.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 4e3);
  }
  var FORMATS = [
    { fmt: "xlsx", label: "Excel workbook", tag: ".xlsx" },
    { fmt: "pdf", label: "PDF report", tag: ".pdf" },
    { fmt: "csv", label: "CSV (raw data)", tag: ".csv" }
  ];
  function buildDropdown(key) {
    const details = document.createElement("details");
    details.className = "admin-export";
    const label = DATASETS[key] ? DATASETS[key].label : "data";
    details.innerHTML = `<summary aria-label="Export ${esc(label)}"><i data-lucide="download" class="h-4 w-4"></i><span>Export</span></summary><div class="admin-export__menu" role="menu"><div class="admin-export__title">Export ${esc(label)}</div>` + FORMATS.map((f) => `<button type="button" role="menuitem" data-fmt="${f.fmt}"><span>${esc(f.label)}</span><span class="tag">${esc(f.tag)}</span></button>`).join("") + `</div>`;
    details.querySelectorAll("button[data-fmt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        details.removeAttribute("open");
        runExport(key, btn.getAttribute("data-fmt"));
      });
    });
    return details;
  }
  function injectExportControls() {
    injectStylesOnce();
    const slots = document.querySelectorAll(".admin-export-slot[data-export-key]");
    slots.forEach((slot) => {
      if (slot.dataset.ready === "1") return;
      const key = slot.getAttribute("data-export-key");
      if (!DATASETS[key]) return;
      slot.dataset.ready = "1";
      slot.appendChild(buildDropdown(key));
    });
    if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest(".admin-export")) return;
    document.querySelectorAll("details.admin-export[open]").forEach((d) => d.removeAttribute("open"));
  });
  document.addEventListener("click", (e) => {
    const reportBtn = e.target.closest("[data-report-key]");
    if (reportBtn) {
      e.preventDefault();
      report(reportBtn.getAttribute("data-report-key"), reportBtn.getAttribute("data-report-fmt"));
      return;
    }
    if (e.target.closest("[data-report-workbook]")) {
      e.preventDefault();
      exportWorkbook();
    }
  });
  document.addEventListener("change", (e) => {
    if (e.target && e.target.id === "report-range") {
      const custom = document.getElementById("report-custom");
      if (custom) custom.classList.toggle("hidden", e.target.value !== "custom");
    }
  });
  function init() {
    injectExportControls();
    setTimeout(injectExportControls, 1200);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  window.AdminExport = {
    run: runExport,
    report,
    workbook: exportWorkbook,
    inject: injectExportControls,
    range: currentReportRange,
    datasets: DATASETS,
    // exposed for test harnesses / debugging only
    _debug: { buildMatrix, fetchEntries, reportHtml, summarizeOrders, summarizeReservations, Core }
  };
})();
