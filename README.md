# luban-workshop
A web application for the Luban Workshop restaurant, featuring a digital menu, table reservation system, and information about our culinary services.

---

## Fixing the "Missing or insufficient permissions" Error

### Symptom
The admin portal shows the following error in the browser console, and the dashboard may not display dishes, orders, or reservations:

```
[Firebase/Firestore] Uncaught Error in snapshot listener:
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

### Root Cause
This error occurs when a **non-admin user** logs into `admin.html`. The dashboard immediately starts Firestore real-time listeners on the `reservations` and `orders` collections, which Firestore Security Rules restrict to admin users only. Because the logged-in user does not have admin privileges, every read attempt is rejected.

### How to Fix

#### Step 1 – Deploy the updated Firestore Security Rules

The `firestore.rules` file now supports three ways to identify an admin:
1. **Firebase Custom Claims** – `request.auth.token.admin == true` (recommended for production)
2. **Bootstrap email** – `request.auth.token.email == 'admin@luban.com'` (development fallback)
3. **Firestore `admins` collection** – the user's email exists as a document in the `admins` collection (manageable via the Admin Users tab)

Copy the contents of `firestore.rules` into the Firebase Console:
1. Go to [Firebase Console](https://console.firebase.google.com/) → your project
2. Navigate to **Firestore Database → Rules**
3. Replace the existing rules with the content of `firestore.rules`
4. Click **Publish**

#### Step 2 – Create the first admin account

Use **one** of these methods:

**Option A – Bootstrap email (quickest for development)**
1. In Firebase Console → **Authentication**, create a user with email `admin@luban.com`
2. Log in to `admin.html` with those credentials

**Option B – Firebase Custom Claims (recommended for production)**
```javascript
// Run once in your Firebase Admin SDK environment (Cloud Functions, backend server, etc.)
const admin = require('firebase-admin');
admin.auth().setCustomUserClaims('<USER_UID>', { admin: true })
  .then(() => console.log('Admin claim set'));
```

#### Step 3 – Promote additional admins via the dashboard

Once you are logged in as an admin:
1. Click the **Admin Users** tab in the left sidebar
2. Enter the email address of the user you want to promote
3. Click **Grant Admin Access**

The user's email is written to the `admins` Firestore collection. The next time that user logs in to `admin.html`, the dashboard will verify their entry in the collection and grant access.

To revoke access, click the **Revoke** button next to their email on the same tab.

---

## Security Notes

- The admin portal (`admin.html`) now verifies admin status **before** showing the dashboard. Non-admin users are signed out automatically and shown an "Access denied" message.
- For production, prefer **Firebase Custom Claims** over the email-based fallback—Custom Claims cannot be spoofed by creating an account with a specific email address.
- See `FIRESTORE_RULES_README.md` for full details on deploying rules and configuring Custom Claims.
