const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const target = 'es2019';

const groups = {
  site: [
    ['firebase-modular-bridge.js', 'firebase-modular.bundle.js'],
    ['firebase-firestore-bridge.js', 'firebase-firestore.bundle.js'],
    ['firebase-messaging-sw-entry.js', 'firebase-messaging-sw.bundle.js'],
    ['admin-qr.js', 'admin-qr.bundle.js'],
    ['lucide-local.js', 'lucide.bundle.js'],
    ['html2canvas-local.js', 'html2canvas.bundle.js']
  ],
  admin: [
    ['admin-core.js', 'admin-core.bundle.js'],
    ['admin-menu.js', 'admin-menu.bundle.js'],
    ['admin-reservations.js', 'admin-reservations.bundle.js'],
    ['admin-orders.js', 'admin-orders.bundle.js'],
    ['admin-promotions.js', 'admin-promotions.bundle.js'],
    ['admin-special-menus.js', 'admin-special-menus.bundle.js'],
    ['admin-users.js', 'admin-users.bundle.js'],
    ['admin-messages.js', 'admin-messages.bundle.js'],
    ['admin-fraud.js', 'admin-fraud.bundle.js'],
    ['admin-chatbot.js', 'admin-chatbot.bundle.js'],
    ['admin-tour.js', 'admin-tour.bundle.js']
  ]
};

function resolveSelectedGroups() {
  const selected = process.argv.slice(2);
  if (!selected.length) return Object.keys(groups);

  for (const group of selected) {
    if (!groups[group]) {
      throw new Error(
        `Unknown bundle group "${group}". Expected one of: ${Object.keys(groups).join(', ')}`
      );
    }
  }

  return selected;
}

async function buildBundle(entryFile, outputFile) {
  await esbuild.build({
    bundle: true,
    entryPoints: [path.join(root, 'src', entryFile)],
    format: 'iife',
    logLevel: 'info',
    outfile: path.join(root, 'assets', 'js', outputFile),
    target
  });
}

async function main() {
  for (const group of resolveSelectedGroups()) {
    for (const [entryFile, outputFile] of groups[group]) {
      await buildBundle(entryFile, outputFile);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
