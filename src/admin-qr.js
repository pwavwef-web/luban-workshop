import qrcode from 'qrcode-generator';

const DEFAULT_CELL_SIZE = 8;
const DEFAULT_MARGIN = 4;
const DEFAULT_DOWNLOAD_SIZE = 1400;
const PRINT_CELL_SIZE = 12;

function createQrModel(text, errorCorrectionLevel = 'M') {
  const qr = qrcode(0, errorCorrectionLevel);
  qr.addData(String(text));
  qr.make();
  return qr;
}

function createSvgMarkup(text, options = {}) {
  const qr = createQrModel(text, options.errorCorrectionLevel || 'M');
  const cellSize = Number.isFinite(options.cellSize) ? options.cellSize : DEFAULT_CELL_SIZE;
  const margin = Number.isFinite(options.margin) ? options.margin : DEFAULT_MARGIN;
  return qr.createSvgTag({ cellSize, margin, scalable: true });
}

function createSvgDataUrl(text, options = {}) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(createSvgMarkup(text, options))}`;
}

function sanitizeFilename(filename, extension) {
  const safeBase = String(filename || 'special-menu-qr')
    .replace(new RegExp(`\\.${extension}$`, 'i'), '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'special-menu-qr';
  return `${safeBase}.${extension}`;
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not render the QR image.'));
    image.src = src;
  });
}

async function svgMarkupToPngDataUrl(svgMarkup, size, backgroundColor = '#ffffff') {
  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  try {
    const image = await loadImage(blobUrl);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas is not available in this browser.');
    }

    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

async function createPngDataUrl(text, options = {}) {
  const size = Number.isFinite(options.size) ? options.size : DEFAULT_DOWNLOAD_SIZE;
  return svgMarkupToPngDataUrl(createSvgMarkup(text, options), size, options.backgroundColor);
}

async function downloadQrImage({ text, filename, size, cellSize, margin, backgroundColor } = {}) {
  const safeFilename = sanitizeFilename(filename, 'png');
  const dataUrl = await createPngDataUrl(text, { size, cellSize, margin, backgroundColor });
  downloadDataUrl(dataUrl, safeFilename);
  return safeFilename;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function openPrintView({ title, url, subtitle } = {}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Popup blocked. Please allow popups to open the print view.');
  }

  const safeTitle = escapeHtml(title || 'Special Menu QR');
  const safeSubtitle = escapeHtml(subtitle || 'Scan to open the guest menu');
  const safeUrl = escapeHtml(url || '');
  const qrMarkup = createSvgMarkup(url, { cellSize: PRINT_CELL_SIZE, margin: DEFAULT_MARGIN });

  printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle} | QR Print View</title>
  <style>
    :root {
      color-scheme: light;
      --paper: #fffaf4;
      --ink: #1c1917;
      --muted: #57534e;
      --accent: #b91c1c;
      --accent-dark: #7f1d1d;
      --gold: #d4a64f;
      --gold-soft: #fff4cf;
      --line: rgba(146, 64, 14, 0.16);
      --shadow: rgba(28, 25, 23, 0.16);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(212, 166, 79, 0.2), transparent 32%),
        radial-gradient(circle at top right, rgba(185, 28, 28, 0.18), transparent 28%),
        linear-gradient(180deg, #5b0f16 0%, #8f1d1d 26%, #f8eee5 26%, #fff8f1 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      padding: 2rem 1rem 3rem;
    }
    .sheet {
      width: min(100%, 720px);
      background: var(--paper);
      border: 1px solid rgba(212, 166, 79, 0.42);
      border-radius: 32px;
      padding: 2rem;
      box-shadow: 0 30px 90px var(--shadow);
      overflow: hidden;
      position: relative;
    }
    .sheet::before,
    .sheet::after {
      content: "";
      position: absolute;
      border-radius: 999px;
      opacity: 0.6;
      pointer-events: none;
    }
    .sheet::before {
      width: 260px;
      height: 260px;
      right: -120px;
      top: -100px;
      background: radial-gradient(circle, rgba(212, 166, 79, 0.32) 0%, rgba(212, 166, 79, 0) 72%);
    }
    .sheet::after {
      width: 220px;
      height: 220px;
      left: -120px;
      bottom: -100px;
      background: radial-gradient(circle, rgba(185, 28, 28, 0.14) 0%, rgba(185, 28, 28, 0) 72%);
    }
    .hero {
      position: relative;
      z-index: 1;
      margin: -2rem -2rem 1.5rem;
      padding: 2rem 2rem 2.2rem;
      background: linear-gradient(135deg, rgba(28, 25, 23, 0.98) 0%, rgba(127, 29, 29, 0.97) 58%, rgba(185, 28, 28, 0.92) 100%);
      color: #fff7ed;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .hero::after {
      content: "";
      position: absolute;
      inset: auto 0 0;
      height: 10px;
      background:
        linear-gradient(90deg, transparent 0 6%, rgba(212, 166, 79, 0.95) 6% 12%, transparent 12% 18%, rgba(212, 166, 79, 0.95) 18% 24%, transparent 24% 76%, rgba(212, 166, 79, 0.95) 76% 82%, transparent 82% 88%, rgba(212, 166, 79, 0.95) 88% 94%, transparent 94% 100%);
      opacity: 0.7;
    }
    .hero-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .brand-lockup {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .brand-mark {
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 999px;
      background: linear-gradient(180deg, #fff4cf 0%, #f9d77e 100%);
      color: var(--accent-dark);
      display: grid;
      place-items: center;
      font-size: 1.35rem;
      font-weight: 700;
      box-shadow: inset 0 0 0 2px rgba(127, 29, 29, 0.16);
    }
    .brand-copy {
      display: grid;
      gap: 0.15rem;
      font-family: "Segoe UI", Arial, sans-serif;
    }
    .brand-copy strong {
      font-size: 0.95rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--gold-soft);
    }
    .brand-copy span {
      font-size: 0.84rem;
      color: rgba(255, 244, 207, 0.82);
    }
    .event-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.68rem 1rem;
      border-radius: 999px;
      border: 1px solid rgba(255, 244, 207, 0.28);
      background: rgba(255, 244, 207, 0.08);
      color: var(--gold-soft);
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .eyebrow {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--gold-soft);
      margin: 1.4rem 0 0.85rem;
      font-family: "Segoe UI", Arial, sans-serif;
    }
    h1 {
      margin: 0;
      font-size: clamp(2.2rem, 5vw, 3.5rem);
      line-height: 1.02;
      color: #fffaf4;
      max-width: 11ch;
    }
    p {
      margin: 0.9rem 0 0;
      color: var(--muted);
      line-height: 1.6;
    }
    .hero p {
      color: rgba(255, 247, 237, 0.86);
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 1rem;
      max-width: 38rem;
    }
    .ornament-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 1rem;
      margin: 1.6rem 0 0;
    }
    .ornament-line {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, rgba(255, 244, 207, 0.78) 50%, transparent 100%);
    }
    .ornament-knot {
      width: 2.7rem;
      height: 2.7rem;
      border-radius: 999px;
      border: 1px solid rgba(255, 244, 207, 0.38);
      display: grid;
      place-items: center;
      font-size: 0.82rem;
      color: var(--gold-soft);
      background: rgba(255, 244, 207, 0.08);
      font-family: "Segoe UI", Arial, sans-serif;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .body-copy {
      position: relative;
      z-index: 1;
    }
    .summary {
      margin-top: 1rem;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.85rem;
    }
    .summary-card {
      border-radius: 18px;
      border: 1px solid var(--line);
      background: linear-gradient(180deg, #ffffff 0%, #fff8ef 100%);
      padding: 0.95rem 1rem;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
    }
    .summary-card span {
      display: block;
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #a16207;
      margin-bottom: 0.35rem;
    }
    .summary-card strong {
      display: block;
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 0.98rem;
      color: #1c1917;
      line-height: 1.4;
    }
    .qr-card {
      margin-top: 1.8rem;
      border-radius: 28px;
      background: linear-gradient(180deg, rgba(255, 250, 244, 0.96) 0%, #ffffff 100%);
      border: 1px solid rgba(212, 166, 79, 0.36);
      padding: 1.6rem;
      display: grid;
      justify-items: center;
      gap: 1.1rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 16px 34px rgba(28, 25, 23, 0.08);
    }
    .qr-card::before {
      content: "";
      position: absolute;
      inset: 14px;
      border-radius: 22px;
      border: 1px dashed rgba(212, 166, 79, 0.65);
      pointer-events: none;
    }
    .qr-card-header {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      font-family: "Segoe UI", Arial, sans-serif;
    }
    .qr-card-header strong {
      font-size: 0.92rem;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--accent-dark);
    }
    .qr-card-header span {
      font-size: 0.84rem;
      color: #78716c;
    }
    .qr-frame {
      width: 100%;
      display: grid;
      place-items: center;
      padding: 1rem;
      border-radius: 24px;
      background:
        radial-gradient(circle at top, rgba(212, 166, 79, 0.18), transparent 40%),
        linear-gradient(180deg, #fffdf9 0%, #fff7ed 100%);
      border: 1px solid rgba(212, 166, 79, 0.32);
    }
    .qr-frame svg {
      width: min(100%, 360px);
      height: auto;
      background: #fff;
      padding: 1rem;
      border-radius: 22px;
      box-shadow:
        0 0 0 1px rgba(146, 64, 14, 0.08),
        0 20px 35px rgba(28, 25, 23, 0.08);
    }
    .instructions {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.85rem;
    }
    .instruction {
      padding: 0.9rem;
      border-radius: 18px;
      background: #fffaf4;
      border: 1px solid rgba(146, 64, 14, 0.12);
      font-family: "Segoe UI", Arial, sans-serif;
    }
    .instruction strong {
      display: block;
      margin-bottom: 0.3rem;
      color: var(--accent-dark);
      font-size: 0.8rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .instruction span {
      color: #57534e;
      font-size: 0.84rem;
      line-height: 1.5;
    }
    .url-box {
      width: 100%;
      padding: 1rem 1.05rem;
      border-radius: 16px;
      background: linear-gradient(180deg, #fdfbf8 0%, #f5f5f4 100%);
      border: 1px solid var(--line);
      color: var(--ink);
      font-size: 0.95rem;
      word-break: break-all;
      font-family: "Segoe UI", Arial, sans-serif;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .action-btn {
      appearance: none;
      border: 0;
      border-radius: 999px;
      padding: 0.8rem 1.1rem;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      font-family: "Segoe UI", Arial, sans-serif;
    }
    .action-btn.primary {
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
      color: #fff;
      box-shadow: 0 16px 28px rgba(185, 28, 28, 0.22);
    }
    .action-btn.secondary {
      background: #fff;
      color: var(--ink);
      border: 1px solid var(--line);
    }
    .footer-note {
      margin-top: 1rem;
      text-align: center;
      color: #78716c;
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 0.84rem;
      line-height: 1.6;
    }
    @media (max-width: 640px) {
      .summary,
      .instructions {
        grid-template-columns: 1fr;
      }
      .hero {
        padding-bottom: 1.8rem;
      }
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
      }
      .sheet {
        width: 100%;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        padding: 0;
        background: #fff;
      }
      .hero {
        margin: 0 0 1.5rem;
        border-bottom: 0;
      }
      .actions {
        display: none;
      }
      .qr-card,
      .summary-card,
      .instruction {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <main class="sheet">
    <section class="hero">
      <div class="hero-top">
        <div class="brand-lockup">
          <div class="brand-mark">LW</div>
          <div class="brand-copy">
            <strong>Luban Workshop</strong>
            <span>Special Event Menu Access</span>
          </div>
        </div>
        <div class="event-pill">Scan Ready</div>
      </div>
      <span class="eyebrow">Event Menu Handoff</span>
      <h1>${safeTitle}</h1>
      <p>${safeSubtitle}</p>
      <div class="ornament-row">
        <div class="ornament-line"></div>
        <div class="ornament-knot">QR</div>
        <div class="ornament-line"></div>
      </div>
    </section>
    <section class="body-copy">
      <div class="summary">
        <div class="summary-card">
          <span>Use</span>
          <strong>Table cards, hostess stand, and event entry</strong>
        </div>
        <div class="summary-card">
          <span>Link Type</span>
          <strong>Guest menu page with the live event selection</strong>
        </div>
        <div class="summary-card">
          <span>Tip</span>
          <strong>Print in color for the strongest brand feel</strong>
        </div>
      </div>
    <section class="qr-card">
      <div class="qr-card-header">
        <strong>Guest Scan Access</strong>
        <span>Point any phone camera at the code below</span>
      </div>
      <div class="qr-frame">
        ${qrMarkup}
      </div>
      <div class="instructions">
        <div class="instruction">
          <strong>1. Place</strong>
          <span>Set this sheet near check-in, on dining tables, or at the event bar.</span>
        </div>
        <div class="instruction">
          <strong>2. Scan</strong>
          <span>Guests open the event menu instantly with their phone camera.</span>
        </div>
        <div class="instruction">
          <strong>3. Serve</strong>
          <span>Update the menu in admin and the same QR stays ready to use.</span>
        </div>
      </div>
      <div class="url-box">${safeUrl}</div>
    </section>
    <div class="actions">
      <button class="action-btn primary" onclick="window.print()">Print QR Sheet</button>
      <button class="action-btn secondary" onclick="window.location.href='${safeUrl}'">Open Guest Menu</button>
    </div>
    <p class="footer-note">Prepared for Luban Workshop Restaurant event service. Keep this sheet flat, bright, and easy for guests to reach.</p>
    </section>
  </main>
</body>
</html>`);
  printWindow.document.close();
}

window.adminQrTools = {
  createSvgMarkup,
  createSvgDataUrl,
  createPngDataUrl,
  downloadQrImage,
  openPrintView,
  sanitizeFilename
};
