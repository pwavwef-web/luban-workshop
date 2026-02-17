# Firestore Security Rules

This file contains the Firestore Security Rules for the Luban Workshop restaurant application.

## Rules Overview

The `firestore.rules` file implements the following security policies:

### menuItems Collection
- **Read Access**: Anyone (authenticated or not) can read menu items
- **Write Access**: Only authenticated users with the admin email (`admin@luban.com`) can create, update, or delete menu items

### reservations Collection
- **Read Access**: Only authenticated users with the admin email (`admin@luban.com`) can read reservations
- **Write Access**: Any authenticated user can create reservations (book a table)

## How to Deploy to Firebase Console

### Method 1: Copy and Paste (Quick Method)
1. Open the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `luban-workshop-restaurant`
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Copy the entire content of the `firestore.rules` file
6. Paste it into the Firebase Console rules editor
7. Click **Publish** to deploy the rules

### Method 2: Using Firebase CLI (Recommended for Production)
1. Install Firebase CLI if you haven't already:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your project: `luban-workshop-restaurant`
   - Accept the default file name: `firestore.rules`

4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Admin Email Configuration

The rules are currently configured to use `admin@luban.com` as the admin email. If you need to use a different admin email:

1. Open `firestore.rules`
2. Find the `isAdmin()` function (line 7-9)
3. Change `'admin@luban.com'` to your desired admin email
4. Re-deploy the rules

## Testing the Rules

### Test menuItems Read (Should Pass for Anyone)
- Open your restaurant website without logging in
- The menu items should be visible to all users

### Test menuItems Write (Should Fail for Non-Admin)
- Try logging in with a non-admin account
- Attempt to add/edit/delete menu items
- Operation should be denied

### Test menuItems Write (Should Pass for Admin)
- Log in with `admin@luban.com`
- Try to add/edit/delete menu items
- Operations should succeed

### Test reservations Write (Should Pass for Authenticated Users)
- Log in with any authenticated user
- Try to create a reservation
- Operation should succeed

### Test reservations Read (Should Pass for Admin Only)
- Log in with `admin@luban.com`
- Navigate to the admin dashboard
- Reservations should be visible
- Try with a non-admin account - should fail

## Security Notes

- These rules use the email address in the authentication token to identify admin users
- Make sure to create the admin user account (`admin@luban.com`) in Firebase Authentication
- For production use, consider using Firebase Custom Claims for more flexible role management
- Always test rules thoroughly before deploying to production
