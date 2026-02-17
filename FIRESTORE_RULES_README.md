# Firestore Security Rules

This file contains the Firestore Security Rules for the Luban Workshop restaurant application.

## Rules Overview

The `firestore.rules` file implements the following security policies:

### menuItems Collection
- **Read Access**: Anyone (authenticated or not) can read menu items
- **Write Access**: Only authenticated users with the admin email (`admin@luban.com`) can create, update, or delete menu items

### reservations Collection
- **Read Access**: Only authenticated users with the admin email (`admin@luban.com`) or admin custom claim can read reservations
- **Create Access**: Any authenticated user can create reservations (book a table)
- **Update/Delete Access**: Only admins can update or delete reservations

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

The rules support two methods for admin authentication:

### Method 1: Firebase Custom Claims (Recommended for Production)
This is the more secure approach that prevents spoofing:

1. Install Firebase Admin SDK in your backend or use Firebase Functions
2. Set the custom claim for your admin user:
   ```javascript
   const admin = require('firebase-admin');
   
   // Set admin claim for a user
   admin.auth().setCustomUserClaims(uid, { admin: true })
     .then(() => {
       console.log('Admin claim set successfully');
     });
   ```

3. The rules will automatically check for the `admin` custom claim

### Method 2: Email-based (Fallback for Development)
For quick setup or development, the rules also check the email:

1. Open `firestore.rules`
2. The `isAdmin()` function (lines 7-14) checks for both custom claim and email
3. Create a user account with email `admin@luban.com` in Firebase Authentication
4. This method is less secure and should only be used for development

**Important**: For production, always use Custom Claims (Method 1) and remove the email check from the `isAdmin()` function.

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

- The rules support both Custom Claims (recommended) and email-based admin verification
- **For Production**: Use Firebase Custom Claims for admin role management
  - More secure - cannot be spoofed by creating an account with the admin email
  - Centrally managed through Firebase Admin SDK
  - To use only Custom Claims, remove the email check from `isAdmin()` function
- **For Development**: The email-based check (`admin@luban.com`) provides quick setup
- Create the admin user account in Firebase Authentication before deploying
- Reservations can only be created by authenticated users, and only admins can modify or delete them
- Always test rules thoroughly before deploying to production
- Consider implementing rate limiting for reservation creation to prevent abuse
