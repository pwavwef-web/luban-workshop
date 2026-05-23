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
      --paper: #fffaf5;
      --ink: #1c1917;
      --muted: #57534e;
      --accent: #b91c1c;
      --line: #e7e5e4;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      color: var(--ink);
      background: linear-gradient(180deg, #fef7ed 0%, #ffffff 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      padding: 2rem 1rem;
    }
    .sheet {
      width: min(100%, 720px);
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 2rem;
      box-shadow: 0 24px 60px rgba(28, 25, 23, 0.12);
    }
    .eyebrow {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 0.9rem;
    }
    h1 {
      margin: 0;
      font-size: clamp(2rem, 5vw, 3rem);
      line-height: 1.05;
    }
    p {
      margin: 0.9rem 0 0;
      color: var(--muted);
      line-height: 1.6;
    }
    .qr-card {
      margin-top: 1.8rem;
      border-radius: 24px;
      background: #ffffff;
      border: 1px solid var(--line);
      padding: 1.4rem;
      display: grid;
      justify-items: center;
      gap: 1rem;
    }
    .qr-card svg {
      width: min(100%, 360px);
      height: auto;
    }
    .url-box {
      width: 100%;
      padding: 0.9rem 1rem;
      border-radius: 14px;
      background: #f5f5f4;
      border: 1px solid var(--line);
      color: var(--ink);
      font-size: 0.95rem;
      word-break: break-all;
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
    }
    .action-btn.primary {
      background: var(--accent);
      color: #fff;
    }
    .action-btn.secondary {
      background: #fff;
      color: var(--ink);
      border: 1px solid var(--line);
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
      .actions {
        display: none;
      }
    }
  </style>
</head>
<body>
  <main class="sheet">
    <span class="eyebrow">Luban Workshop</span>
    <h1>${safeTitle}</h1>
    <p>${safeSubtitle}</p>
    <section class="qr-card">
      ${qrMarkup}
      <div class="url-box">${safeUrl}</div>
    </section>
    <div class="actions">
      <button class="action-btn primary" onclick="window.print()">Print QR Sheet</button>
      <button class="action-btn secondary" onclick="window.location.href='${safeUrl}'">Open Guest Menu</button>
    </div>
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
