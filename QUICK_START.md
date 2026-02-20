# Quick Start Guide

## For the Firebase Console (Copy & Paste)

### Production Deployment (RECOMMENDED)
**File to use**: `firestore.rules.production`

1. Copy the entire content of `firestore.rules.production`
2. Paste into Firebase Console → Firestore Database → Rules
3. Click "Publish"
4. Set up admin user with Custom Claims (see FIRESTORE_RULES_README.md)

**Advantages**:
- ✅ Secure - cannot be spoofed
- ✅ Production-ready
- ✅ Best practice

**Requirements**:
- Must set up Firebase Custom Claims for admin user
- See FIRESTORE_RULES_README.md for setup instructions

---

### Quick Testing/Development
**File to use**: `firestore.rules`

1. Copy the entire content of `firestore.rules`
2. Paste into Firebase Console → Firestore Database → Rules
3. Click "Publish"
4. Create a user with email `admin@luban.com` in Firebase Authentication

**Advantages**:
- ✅ Quick setup
- ✅ No Custom Claims needed
- ✅ Good for testing

**Disadvantages**:
- ⚠️ Less secure - anyone can create admin@luban.com account
- ⚠️ Not recommended for production

---

## What the Rules Do

Both files implement these exact requirements:

1. ✅ **Anyone can read the menuItems collection**
   - No login required to view the restaurant menu

2. ✅ **Only admins can write to menuItems**
   - Only the admin user can add, edit, or delete menu items

3. ✅ **Anyone can read the dishAvailability collection**
   - No login required; the main site filters hidden dishes from this collection

4. ✅ **Only admins can write to dishAvailability**
   - Only the admin user can toggle dish visibility

5. ✅ **Authenticated users can create reservations**
   - Any logged-in user can book a table

6. ✅ **Only admins can read reservations**
   - Only the admin user can view all reservations

7. ✅ **Only admins can update/delete reservations**
   - Only the admin user can modify or cancel reservations

8. ✅ **Authenticated users can create orders**
   - Any logged-in user can place an order

9. ✅ **Users can read and update their own orders**
   - Customers can view their order history and cancel pending orders (within 5 minutes)

10. ✅ **Only admins can read all orders and delete orders**
    - The admin dashboard shows all incoming orders

---

## Need Help?

See `FIRESTORE_RULES_README.md` for detailed instructions on:
- Setting up Firebase Custom Claims
- Deploying via Firebase CLI
- Testing the rules
- Security best practices
