# Luban Workshop Restaurant - Website Readiness Report

**Date:** May 2026
**Site:** https://lubanrestaurant.com
**Stack:** Static HTML, Firebase Hosting, Firebase Auth, Firestore, Cloud Functions, Tailwind CSS, GA4, PWA

## Executive Summary

The English customer-facing site is launch-ready for a controlled public opening. Core flows are implemented: menu browsing, verified pickup ordering, order status, reservations, reservation status access, contact messages, customer profiles, staff profiles, flyers, and the admin dashboard.

This pass hardens admin access, removes placeholder navigation/content, localizes common third-party browser libraries, keeps English legal pages indexable, and adds GitHub Actions for build checks and Firebase deployment.

## Current Status

| Area | Status | Notes |
|------|--------|-------|
| Core customer flows | Ready | Online ordering remains pickup-only with payment at the counter. |
| Admin access | Hardened | Admins require `admin: true` custom claim or `admins/{lowercaseEmail}` membership. |
| SEO | Ready | English public pages are canonicalized; Privacy Policy and Terms are indexable and remain in the sitemap. |
| Performance | Improved | Tailwind/Firebase/Lucide/html2canvas are locally built. Desktop Lighthouse on the local build measured `/index.html` at 48 and `/menu.html` at 65; Firestore listen requests kept both pages open during the run, so real deployed monitoring remains important. |
| CI/CD | Added | GitHub Actions builds/checks PRs and pushes to `main`; Firebase deploys run only when the Firebase secret is configured, otherwise the deploy job logs a clean skip. |
| Chinese pages | Out of scope | Existing Chinese pages are still noindex and were not content-polished in this pass. |

## Resolved In This Pass

- Removed retired bootstrap admin access from rules, Functions, and client-side gates.
- Aligned `firestore.rules` and `firestore.rules.production` to the hardened server-mediated policy.
- Replaced the homepage placeholder directions URL with a real Google Maps directions link.
- Made English Privacy Policy and Terms indexable.
- Cleaned checkout/order messaging so customer orders consistently say pickup and pay at counter.
- Replaced stock flyer images with local restaurant/menu assets.
- Replaced CDN Lucide/html2canvas usage with locally built bundles.
- Added launch readiness checks for admin fallback references, sitemap/noindex consistency, local links, placeholder directions, and flyer stock/CDN dependencies.
- Added GitHub Actions build/check/deploy workflow.

## Remaining Operations

- Add the repository secret `FIREBASE_SERVICE_ACCOUNT_LUBAN_WORKSHOP_RESTAURANT` before relying on automated deploys.
- Confirm at least one production admin has the `admin: true` Firebase custom claim.
- Run Lighthouse against the deployed site and compare it with the local desktop baseline (`/index.html`: 48, `/menu.html`: 65).
- Monitor Core Web Vitals in Search Console and GA4 after launch.

## Verification Commands

```bash
npm ci
npm run build
npm run check
npm --prefix functions ci
node --check functions/index.js
node --check functions/secure-api.js
```
