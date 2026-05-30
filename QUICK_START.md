# Quick Start Guide

## Local Verification

```bash
npm ci
npm run build
npm run check
npm --prefix functions ci
node --check functions/index.js
node --check functions/secure-api.js
```

## Firebase Rules

Both `firestore.rules` and `firestore.rules.production` use the same hardened admin model:

- Firebase Auth custom claim `admin: true`
- Firestore document `admins/{lowercaseEmail}`

Order, reservation, contact, verification, and rate-limit writes are handled by trusted Cloud Functions where required.

## First Admin

Set the first admin claim with the Functions helper:

```bash
npm --prefix functions run set-admin-claim -- <UID-or-email>
```

Then sign in to `admin.html` and manage additional admins from the Admin Users tab.

## Deployment

Manual deploy:

```bash
firebase deploy --project luban-workshop-restaurant --only hosting,functions,firestore,storage
```

Automated deploys run from GitHub Actions on pushes to `main` after `FIREBASE_SERVICE_ACCOUNT_LUBAN_WORKSHOP_RESTAURANT` is added as a repository secret. Before that secret exists, pushes to `main` still run the build checks and the deploy job logs a clean skip.
