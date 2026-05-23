# Firestore Security Rules

The active Firestore rules are production hardened. `firestore.rules` and `firestore.rules.production` are kept aligned so local, manual, and CI deploys use the same policy.

## Admin Model

`isAdmin()` returns true only for authenticated users with either:

- Firebase Auth custom claim `admin: true`
- A Firestore document at `admins/{lowercaseEmail}`

There is no email-only bootstrap fallback. Use `functions/scripts/set-admin-claim.js` to grant the first admin:

```bash
npm --prefix functions run set-admin-claim -- <UID-or-email>
```

## Main Policies

- Menu, dish availability, current prices, images, active promotions, active special menus, and approved team profiles are publicly readable.
- Admins manage menu data, promotions, special menus, contact inbox items, reservations, security events, and staff profile approval.
- Customers can read their own order and profile data.
- Order creation/cancellation, reservation submission/access, phone verification, contact submission, and rate limiting are routed through Cloud Functions where server validation is required.
- User profile writes require a valid Ghana phone number and cannot directly write trusted verification metadata.

## Deploying Rules

Manual deploy:

```bash
firebase deploy --project luban-workshop-restaurant --only firestore:rules,firestore:indexes,storage
```

Full deploy:

```bash
firebase deploy --project luban-workshop-restaurant --only hosting,functions,firestore,storage
```

GitHub Actions deploys the same rules on pushes to `main` when the Firebase service account secret is configured.

## Testing

- Public visitors can read the menu and public content.
- Non-admin users cannot read reservations, contact messages, security events, or admin-only menu management data.
- Admin users with a custom claim or `admins/{lowercaseEmail}` document can read and write admin-managed data.
- Customers can read only their own orders and profiles.
- Direct client writes to server-owned order/reservation/contact/security collections are denied unless the caller is an admin.
