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
- `npm run test:e2e` runs the Playwright smoke tests for menu, checkout, and order status pages.

The Chinese pages are still maintained as static HTML mirrors. The next maintainability step is to move shared copy into JSON locale files and load it through a small page-level i18n helper, then migrate pages one section at a time. TypeScript can follow the same incremental path by converting the bundle entry points in `src/` first before touching inline page scripts.

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

The Firebase project is `luban-workshop-restaurant`. `firebase.json` deploys Hosting, Functions, Firestore rules/indexes, and Storage rules from this repository.

GitHub Actions runs builds and launch checks on pull requests and pushes to `main`. Pushes to `main` deploy through Firebase CLI when the repository secret `FIREBASE_SERVICE_ACCOUNT_LUBAN_WORKSHOP_RESTAURANT` is configured with a Firebase service account JSON; until then, the deploy job logs an explicit skip after the build checks pass.

## Troubleshooting Admin Permissions

If the admin dashboard shows `Missing or insufficient permissions`, the signed-in user is not authorized by custom claim or `admins/{lowercaseEmail}` membership. Grant the custom claim, or sign in as an existing admin and add the user in the Admin Users tab.
