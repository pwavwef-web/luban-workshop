# Firestore Security Rules

This directory contains Firestore Security Rules for the Luban Workshop restaurant application.

## Files

- **`firestore.rules`**: Development version with both Custom Claims and email-based admin verification
- **`firestore.rules.production`**: Production version with Custom Claims only (RECOMMENDED for production)

## Rules Overview

Both files implement the following security policies:

### menuItems Collection
- **Read Access**: Anyone (authenticated or not) can read menu items
- **Write Access**: Only authenticated admin users can create, update, or delete menu items
  - Production version: Requires admin custom claim
  - Development version: Accepts either admin custom claim OR admin@luban.com email

### dishAvailability Collection
- **Read Access**: Anyone (authenticated or not) can read dish availability (used to filter hidden dishes on the main site and in the admin portal)
- **Write Access**: Only authenticated admin users can toggle dish visibility

### reservations Collection
- **Read Access**: Only admin users can read reservations
  - Production version: Requires admin custom claim
  - Development version: Accepts either admin custom claim OR admin@luban.com email
- **Create Access**: Any authenticated user can create reservations (book a table)
- **Update/Delete Access**: Only admin users can update or delete reservations

### orders Collection
- **Read Access**: Admins can read all orders; authenticated users can read their own orders
- **Create Access**: Any authenticated user can create an order
- **Update Access**: Admins can update any order; authenticated users can update (cancel) their own orders
- **Delete Access**: Only admins can delete orders

## How to Deploy to Firebase Console

### Choosing the Right Rules File

**For Production**: Use `firestore.rules.production`
- More secure - uses only Firebase Custom Claims
- Cannot be bypassed by creating an account with a specific email
- Requires setting up Custom Claims (see Admin Configuration section below)

**For Development/Testing**: Use `firestore.rules`
- Supports both Custom Claims and email-based admin check
- Easier to set up - just create a user with `admin@luban.com`
- Less secure - should not be used in production

### Method 1: Copy and Paste (Quick Method)
1. Open the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `luban-workshop-restaurant`
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Copy the entire content of either:
   - `firestore.rules.production` (recommended for production)
   - `firestore.rules` (for development/testing)
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
   - For production, use: `firestore.rules.production` as the rules file
   - For development, use: `firestore.rules` as the rules file

4. Deploy the rules:
   ```bash
   # For production
   firebase deploy --only firestore:rules
   
   # Or specify the file explicitly
   firebase deploy --only firestore:rules --config firebase.json
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

### Method 2: Email-based (For Development/Quick Setup Only)
⚠️ **WARNING**: This method is NOT secure for production use!

1. Create a user account with email `admin@luban.com` in Firebase Authentication
2. Use the `firestore.rules` file (not the `.production` version)
3. The `isAdmin()` function (lines 10-15) checks for both custom claim and email
4. This provides quick setup but can be bypassed by anyone creating an account with that email

**Important**: For production, always use Method 1 (Custom Claims) with the `firestore.rules.production` file.

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

### Test dishAvailability Read (Should Pass for Anyone)
- Open the admin portal or main website without logging in
- Dish visibility data should be readable by all users

### Test dishAvailability Write (Should Pass for Admin Only)
- Log in with `admin@luban.com`
- Navigate to the admin dashboard → Menu Manager
- Toggle dish visibility - operations should succeed
- Try with a non-admin account - should fail

### Test reservations Write (Should Pass for Authenticated Users)
- Log in with any authenticated user
- Try to create a reservation
- Operation should succeed

### Test reservations Read (Should Pass for Admin Only)
- Log in with `admin@luban.com`
- Navigate to the admin dashboard
- Reservations should be visible
- Try with a non-admin account - should fail

### Test orders Create (Should Pass for Authenticated Users)
- Log in with any authenticated user
- Place an order through the website
- Operation should succeed

### Test orders Read (Should Pass for Admin and Order Owner)
- Log in with `admin@luban.com` - all orders should be visible in admin portal
- Log in as a customer - only that customer's own orders should be visible

### Test orders Update (Should Pass for Admin and Order Owner)
- Admin should be able to update order status (complete/cancel)
- Customer should be able to cancel their own pending orders

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
