const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const failures = [];
const retiredAdminEmail = ['admin', 'luban.com'].join('@');

const ignoredDirs = new Set(['.git', '.firebase', 'node_modules']);
const runtimeExtensions = new Set(['.html', '.js', '.rules']);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function fail(message) {
  failures.push(message);
}

function isNoindex(html) {
  return /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
}

function assertNoBootstrapAdminFallback(files) {
  for (const file of files) {
    if (!runtimeExtensions.has(path.extname(file))) continue;
    if (read(file).includes(retiredAdminEmail)) {
      fail(`${rel(file)} still references the retired bootstrap admin email.`);
    }
  }
}

function assertLegalPagesIndexable() {
  for (const page of ['privacy-policy.html', 'terms-of-use.html']) {
    const file = path.join(root, page);
    const html = read(file);
    if (isNoindex(html)) fail(`${page} is still marked noindex.`);
  }
}

function assertSitemapNoindexConsistency() {
  const sitemap = read(path.join(root, 'sitemap.xml'));
  const locs = Array.from(sitemap.matchAll(/<loc>https:\/\/lubanrestaurant\.com\/([^<]*)<\/loc>/g))
    .map((match) => match[1] || 'index.html');

  for (const loc of locs) {
    const page = loc.endsWith('/') ? `${loc}index.html` : loc;
    const file = path.join(root, page);
    if (!fs.existsSync(file)) {
      fail(`sitemap.xml references missing page ${loc}.`);
      continue;
    }

    if (isNoindex(read(file))) {
      fail(`sitemap.xml includes noindex page ${loc}.`);
    }
  }
}

function assertValidJsonLd(files) {
  for (const file of files) {
    if (path.extname(file) !== '.html') continue;
    const html = read(file);
    const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

    for (const block of blocks) {
      try {
        JSON.parse(block[1].trim());
      } catch (error) {
        fail(`${rel(file)} contains invalid JSON-LD: ${error.message}`);
      }
    }
  }
}

function assertSearchResultSignals() {
  const home = read(path.join(root, 'index.html'));
  if (!home.includes('"@type": "WebSite"')) {
    fail('index.html is missing WebSite structured data for Google site name signals.');
  }
  if (!home.includes('#site-navigation')) {
    fail('index.html is missing primary navigation structured data for sitelink signals.');
  }

  const breadcrumbPages = [
    'menu.html',
    'faq.html',
    'contact-us.html',
    'events-and-catering.html',
    'about-us/index.html',
    'privacy-policy.html',
    'terms-of-use.html',
    'flyers.html',
    'chinese/index.html',
    'chinese/menu.html',
    'chinese/faq.html',
    'chinese/contact-us.html',
    'chinese/events-and-catering.html',
    'chinese/about-us.html',
    'chinese/privacy-policy.html'
  ];

  for (const page of breadcrumbPages) {
    const html = read(path.join(root, page));
    if (!html.includes('"@type": "BreadcrumbList"')) {
      fail(`${page} is missing BreadcrumbList structured data.`);
    }
    if (!/<link\s+rel=["']canonical["']/i.test(html)) {
      fail(`${page} is missing a canonical link.`);
    }
  }

  const translatedPages = [
    'index.html',
    'menu.html',
    'faq.html',
    'contact-us.html',
    'events-and-catering.html',
    'about-us/index.html',
    'privacy-policy.html',
    'chinese/index.html',
    'chinese/menu.html',
    'chinese/faq.html',
    'chinese/contact-us.html',
    'chinese/events-and-catering.html',
    'chinese/about-us.html',
    'chinese/privacy-policy.html'
  ];

  for (const page of translatedPages) {
    const html = read(path.join(root, page));
    if (!html.includes('hreflang="x-default"')) {
      fail(`${page} is missing an x-default hreflang link.`);
    }
  }
}

function assertHomepageDirections() {
  const html = read(path.join(root, 'index.html'));
  if (html.includes('goo.gl/maps/placeholder')) {
    fail('index.html still contains the placeholder directions link.');
  }
}

function assertNoStockFlyerAssets() {
  const html = read(path.join(root, 'flyers.html'));
  if (/images\.unsplash|cdnjs\.cloudflare\.com\/ajax\/libs\/html2canvas/i.test(html)) {
    fail('flyers.html still depends on stock Unsplash images or CDN html2canvas.');
  }
}

function assertEnglishLocalLinks(files) {
  const htmlFiles = files.filter((file) => {
    const name = rel(file);
    return path.extname(file) === '.html' && !name.startsWith('chinese/');
  });

  for (const file of htmlFiles) {
    const html = read(file);
    const baseDir = path.dirname(file);
    const attrPattern = /\b(?:href|src)=["']([^"']+)["']/gi;
    let match;

    while ((match = attrPattern.exec(html))) {
      const raw = match[1].trim();
      if (!raw || raw.startsWith('#')) continue;
      if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(raw)) continue;
      if (raw.includes('${') || raw.includes("' +") || raw.includes('" +')) continue;

      const targetPath = raw.split('#')[0].split('?')[0];
      if (!targetPath) continue;

      const target = path.resolve(baseDir, targetPath);
      if (!fs.existsSync(target)) {
        fail(`${rel(file)} references missing local asset/page: ${raw}`);
      }
    }
  }
}

const files = walk(root);
assertNoBootstrapAdminFallback(files);
assertLegalPagesIndexable();
assertSitemapNoindexConsistency();
assertValidJsonLd(files);
assertSearchResultSignals();
assertHomepageDirections();
assertNoStockFlyerAssets();
assertEnglishLocalLinks(files);

if (failures.length) {
  console.error('Launch readiness checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Launch readiness checks passed.');
