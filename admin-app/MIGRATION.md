# Admin Migration Notes

This app is intentionally separate from the legacy `admin.html` dashboard.

## Later Cutover

1. Deploy this app to the Firebase Hosting site `luban-admin`.
2. Attach the custom domain `admin.lubanrestaurant.com` to that Hosting site.
3. Verify sign-in with both supported admin mechanisms:
   - custom claim `admin: true`
   - document in `admins/{lowercaseEmail}`
4. Update the customer-facing website admin links to point to `https://admin.lubanrestaurant.com/`.
5. Keep `admin.html` and `src/admin-*.js` available for one release window as rollback.
6. After the new app is verified in production, remove old admin HTML, old admin bundles, old admin service worker, and old admin manifest in a separate cleanup PR.

## Compatibility Notes

- Order and reservation status transitions preserve the legacy metadata fields that trigger existing email/SMS Cloud Functions.
- Menu changes still use Firestore overlays so the customer-facing website continues to read the same data.
- Campaign and fraud tools keep using the existing secured Cloud Function endpoints.
- Firestore rules were not changed for this app.
