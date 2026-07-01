# luban-workshop

A static Firebase-hosted web application for Luban Workshop Restaurant, featuring a digital menu, verified pickup ordering, table reservations, contact forms, staff profiles, and an admin dashboard.

## Development

```bash
npm ci
npm run build
npm run check
npm run test:e2e
```

Functions use their own dependency tree:

```bash
npm --prefix functions ci
node --check functions/index.js
node --check functions/secure-api.js
```

Useful local scripts:

- `npm run lint` checks JavaScript with the ESLint baseline.
- `npm run format` applies Prettier to the current tooling and test baseline.
- `npm run format:check` verifies that scoped Prettier baseline.
- `npm run check:menu` verifies the menu catalog is consistent across every consumer.
- `npm run test:unit` runs the Node test-runner unit tests (menu catalog + order pricing).
- `npm run test:e2e` runs the Playwright smoke tests for menu, checkout, and order status pages.
- `npm test` runs the unit tests and then the Playwright suite.

## Menu catalog

`data/menu-catalog.json` is the single source of truth for dish ids, names (English
and Chinese), categories, and prices. Edit that file to change the menu — never edit
the prices in the pages or bundles directly. From it:

- `npm run build:menu` regenerates `functions/menu-catalog.js` (the backend uses these
  prices to compute authoritative order totals). It also runs as the first step of
  `npm run build`.
- `src/admin-menu.js` imports the JSON directly; esbuild inlines it into
  `assets/js/admin-menu.bundle.js` when you run `npm run build:admin`.
- The static pages (`menu.html`, `index.html`, `downloadable-menu.html`,
  `chinese/menu.html`, `chinese/index.html`) and the chatbot knowledge array remain
  hand-authored, but `npm run check:menu` (part of `npm run check`) fails CI if any of
  them drifts from the canonical prices, so the copies can no longer silently diverge.

The Chinese pages are still maintained as static HTML mirrors. The `nameZh` field in
the catalog is the first step toward the planned i18n move: shared copy graduates into
JSON locale files under `data/i18n/` loaded through a small page-level helper, then
pages migrate one section at a time. TypeScript can follow the same incremental path by
converting the bundle entry points in `src/` first before touching inline page scripts.

## Project Ownership

- Lead developer: Francis Pwavwe
  - Company: AZ Learner
  - Website: azlearner.me
  - Website: francis.azlearner.me
  - Email: francis@azlearner.me
- Co-developer: Chinedum Okwonkwo Udeaja
  - Email: udeajachinedum19@gmail.com

## Admin Access

Admin access is production hardened. A user is considered an admin only when one of these is true:

1. Their Firebase Auth token has the custom claim `admin: true`.
2. Their lowercased email exists as a document in the Firestore `admins` collection.

To grant the first admin claim, use the bundled script from the Functions workspace:

```bash
npm --prefix functions run set-admin-claim -- <UID-or-email>
```

After at least one admin can sign in, additional admins can be managed from the Admin Users tab in `admin.html`.

## Deployment

**Firebase is the primary production platform.** The Firebase project is
`luban-workshop-restaurant`. `firebase.json` deploys Hosting, Functions, Firestore
rules/indexes, and Storage rules from this repository, and Hosting rewrites `/api/**`
to the Cloud Functions `api` handler, so the front end and backend ship together.

- `npm run deploy` / `npm run deploy:firebase` — deploy everything to Firebase.
- `npm run deploy:cloudflare` — optional static CDN mirror only (`wrangler deploy`,
  serving the `dist/` output from `npm run build:dist`). Cloudflare cannot serve the
  `/api/**` Cloud Functions, so it is a mirror of the static site, not a replacement
  for Firebase.

GitHub Actions runs builds and launch checks on pull requests and pushes to `main`. Pushes to `main` deploy through Firebase CLI when the repository secret `FIREBASE_SERVICE_ACCOUNT_LUBAN_WORKSHOP_RESTAURANT` is configured with a Firebase service account JSON; until then, the deploy job logs an explicit skip after the build checks pass.

## Troubleshooting Admin Permissions

If the admin dashboard shows `Missing or insufficient permissions`, the signed-in user is not authorized by custom claim or `admins/{lowercaseEmail}` membership. Grant the custom claim, or sign in as an existing admin and add the user in the Admin Users tab.
