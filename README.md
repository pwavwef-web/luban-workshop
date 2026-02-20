# luban-workshop
A web application for the Luban Workshop restaurant, featuring a digital menu, table reservation system, and information about our culinary services.

---

## Fixing "Missing or Insufficient Permissions" in the Admin Portal

### Symptom
The admin portal logs an error similar to:

```
[2026-02-20T18:24:45.353Z]  @firebase/firestore: Firestore (10.7.1): Uncaught Error in snapshot listener:
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

Dishes, reservations, or orders may not appear in the admin dashboard.

### Root Cause
The admin dashboard immediately starts real-time snapshot listeners for the `reservations` and `orders` collections as soon as any user logs in. Firestore rules only allow **admin** users to read these collections. When a non-admin (or a user whose admin status hasn't been configured yet) logs in, every snapshot listener fails with a `permission-denied` error.

### Fix — Three Steps

#### Step 1 – Deploy the updated Firestore rules

The updated rules (`firestore.rules`) now:
- Check an `admins` Firestore collection so you can promote users to admin without needing Firebase CLI / custom claims.
- Block non-admin snapshot listeners from starting at all (enforced client-side — see Step 2).

Copy the contents of `firestore.rules` (development) or `firestore.rules.production` (production) and publish them in the [Firebase Console](https://console.firebase.google.com/) → **Firestore Database → Rules**.

#### Step 2 – Ensure the admin dashboard only loads for admins

The updated `admin.html` checks whether the signed-in user is an admin **before** starting any Firestore listeners. Non-admins are immediately signed out and shown an "Access denied" message, so no `permission-denied` errors can occur.

An admin user is one who satisfies **any** of the following:
| Method | How it works |
|--------|-------------|
| **Firebase Custom Claim** | `admin.auth().setCustomUserClaims(uid, { admin: true })` set via Firebase Admin SDK |
| **Bootstrap email** | The account email is `admin@luban.com` (development/quick-start only) |
| **Admins collection** | The account email exists as a document in the `admins` Firestore collection |

#### Step 3 – Create your first admin account

**Option A – Quick start (development only)**
1. Go to [Firebase Console → Authentication](https://console.firebase.google.com/) and create a user with email `admin@luban.com`.
2. Log in to the admin portal with that account — it is granted admin access by the bootstrap email rule.

**Option B – Promote a user via the Admin tab**
1. Log in with your `admin@luban.com` bootstrap account.
2. Click the **Admin** tab in the sidebar.
3. Enter any registered user's email address and click **Grant Admin Access**.
4. That user can now log in to the admin portal.

**Option C – Firebase Custom Claims (production recommended)**
```javascript
const admin = require('firebase-admin');
admin.auth().setCustomUserClaims(uid, { admin: true });
```
After setting the claim, the user must sign out and back in (or wait for the token to refresh) before the claim takes effect.

---

For more detail on the Firestore security rules, see [`FIRESTORE_RULES_README.md`](./FIRESTORE_RULES_README.md).
