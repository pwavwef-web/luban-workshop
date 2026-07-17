const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const maxCloudflareAssetBytes = 25 * 1024 * 1024;

const productionDirectories = ['assets', 'about-us', 'campaigns', 'chinese'];
const rootFileExtensions = new Set(['.html', '.css', '.png', '.jpg', '.jpeg', '.xml', '.txt']);
const rootFileNames = new Set([
  'CNAME',
  'admin-manifest.json',
  'admin-sw.js',
  'firebase-messaging-sw.js',
  'manifest.json',
  'script.js',
  'sw.js'
]);
const skippedFileExtensions = new Set(['.bak', '.local', '.log', '.map', '.md', '.tmp']);
const skippedNames = new Set([
  '.cache',
  '.env',
  '.firebase',
  '.git',
  '.github',
  '.idea',
  '.netlify',
  '.vercel',
  '.vscode',
  'build',
  'coverage',
  'dist',
  'docs',
  'eslint.config.js',
  'firebase.json',
  'firestore.indexes.json',
  'firestore.rules',
  'firestore.rules.production',
  'functions',
  'luabn',
  'node_modules',
  'package-lock.json',
  'package.json',
  'playwright.config.js',
  'src',
  'storage.rules',
  'tailwind.config.js',
  'test-results',
  'tests',
  'tmp',
  'tools',
  'wrangler.jsonc'
]);

function toRelative(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function ensureInsideRoot(target) {
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside project root: ${target}`);
  }
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function shouldSkipEntry(entryName) {
  if (skippedNames.has(entryName)) return true;
  if (entryName.startsWith('.')) return true;

  const extension = path.extname(entryName).toLowerCase();
  return skippedFileExtensions.has(extension);
}

function copyFile(source, destination) {
  ensureInsideRoot(destination);
  ensureDirectory(path.dirname(destination));
  fs.copyFileSync(source, destination);
}

function copyDirectory(sourceDirectory, destinationDirectory) {
  const entries = fs.readdirSync(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldSkipEntry(entry.name)) continue;

    const source = path.join(sourceDirectory, entry.name);
    const destination = path.join(destinationDirectory, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(source, destination);
    } else if (entry.isFile()) {
      copyFile(source, destination);
    }
  }
}

function selectRootFiles() {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isFile()) return false;
      if (shouldSkipEntry(entry.name)) return false;
      return rootFileNames.has(entry.name) || rootFileExtensions.has(path.extname(entry.name).toLowerCase());
    })
    .map((entry) => entry.name);
}

function walkFiles(directory) {
  const files = [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(filePath));
    } else if (entry.isFile()) {
      files.push(filePath);
    }
  }

  return files;
}

function validateDist() {
  const deniedPatterns = [
    /(^|\/)\.git(\/|$)/,
    /(^|\/)\.github(\/|$)/,
    /(^|\/)node_modules(\/|$)/,
    /(^|\/)(docs|functions|luabn|src|test-results|tests|tmp|tools)(\/|$)/,
    /^(?:firebase\.json|firestore\.(?:indexes\.json|rules|rules\.production)|storage\.rules|wrangler\.jsonc)$/,
    /(^|\/)package(?:-lock)?\.json$/,
    /(^|\/).+\.md$/,
    /(^|\/).+\.log$/,
    /(^|\/).+\.map$/
  ];
  const files = walkFiles(dist);
  const failures = [];

  for (const file of files) {
    const relative = path.relative(dist, file).replace(/\\/g, '/');
    const stat = fs.statSync(file);

    if (stat.size > maxCloudflareAssetBytes) {
      failures.push(`${relative} is ${(stat.size / 1024 / 1024).toFixed(2)} MiB`);
    }

    if (deniedPatterns.some((pattern) => pattern.test(relative))) {
      failures.push(`${relative} should not be included in Cloudflare assets`);
    }
  }

  if (failures.length) {
    throw new Error(`Invalid Cloudflare asset output:\n- ${failures.join('\n- ')}`);
  }

  return files.length;
}

function main() {
  ensureInsideRoot(dist);
  fs.rmSync(dist, { force: true, recursive: true });
  ensureDirectory(dist);

  for (const fileName of selectRootFiles()) {
    copyFile(path.join(root, fileName), path.join(dist, fileName));
  }

  for (const directoryName of productionDirectories) {
    copyDirectory(path.join(root, directoryName), path.join(dist, directoryName));
  }

  const fileCount = validateDist();
  console.log(`Prepared ${fileCount} Cloudflare asset files in ${toRelative(dist)}.`);
}

main();
