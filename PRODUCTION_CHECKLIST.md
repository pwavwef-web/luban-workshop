# Production Checklist (Core Functionality 10/10)

## 1) Configure and deploy Cloud Functions (email notifications)

- [ ] Install function dependencies:
  - `cd /home/runner/work/luban-workshop/luban-workshop/functions && npm install`
- [ ] Set Firebase params/secrets for SMTP:
  - `firebase functions:secrets:set SMTP_USER`
  - `firebase functions:secrets:set SMTP_PASS`
  - `firebase functions:secrets:set SMTP_FROM`
  - `firebase functions:secrets:set NOTIFICATION_RECIPIENT` → set to **sales@lubanrestaurant.com**
  - `firebase functions:params:set SMTP_HOST=smtp.gmail.com`
  - `firebase functions:params:set SMTP_PORT=587`
  - `firebase functions:params:set SMTP_SECURE=false`
- [ ] Deploy functions:
  - `firebase deploy --only functions`
- [ ] Verify two functions exist and are active:
  - `notifyOnNewOrder`
  - `notifyOnNewReservation`
- [ ] Place a test order and a test reservation; confirm emails are received at **sales@lubanrestaurant.com**.

## 2) Finish production admin setup (Custom Claims)

- [ ] Ensure production Firestore rules are active (`firestore.rules.production`).
- [ ] Grant admin claim to the real admin account:
  - Set `GOOGLE_APPLICATION_CREDENTIALS` to your Firebase service account JSON.
  - `cd /home/runner/work/luban-workshop/luban-workshop/functions`
  - `npm run set-admin-claim -- <admin-email-or-uid>`
- [ ] Force refresh admin login session (sign out/in) and confirm admin dashboard access.

## 3) Deploy website updates (Chinese coverage)

- [ ] Deploy Hosting after these page additions:
  - `/chinese/contact-us.html`
  - `/chinese/events-and-catering.html`
  - `/chinese/about-us.html`
- [ ] Confirm all Chinese pages load and forms submit correctly.
- [ ] Re-submit sitemap in Google Search Console after deployment.

## 4) Final production verification

- [ ] Confirm order flow end-to-end: place order → Firestore doc created → staff email received.
- [ ] Confirm reservation flow end-to-end: submit reservation → Firestore doc created → staff email received.
- [ ] Confirm admin role enforcement: non-admin blocked, admin allowed.
- [ ] Confirm no console errors on key pages (`/`, `/menu.html`, `/events-and-catering.html`, `/contact-us.html`, `/chinese/*`).
