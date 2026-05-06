# Luban Workshop Restaurant – Website Readiness Report

**Date:** May 2026 (updated)  
**Site:** [lubanrestaurant.com](https://lubanrestaurant.com)  
**Stack:** Static HTML · Firebase (Auth + Firestore) · Tailwind CSS (local build) · Google Analytics 4 · PWA

---

## Executive Summary

The Luban Workshop Restaurant website is **substantially ready for public use**. Core customer-facing flows (browse menu, place order, book a table, contact the restaurant) are all implemented and live. The admin dashboard covers day-to-day operational needs. Since the initial audit, several previously-flagged items have been resolved: opening hours are now consistent across all pages, a custom 404 page has been added, Tailwind CSS is now generated via a local build step (eliminating the 3 MB CDN bundle), Google Fonts preconnect hints have been added sitewide, the About Us canonical URL has been corrected, `about-us/profile.html` has been added to the sitemap, social media profile URLs (Facebook, Instagram) have been added to the JSON-LD `sameAs` array, and both the favicon and PWA manifest icons now use PNG. The remaining high-priority gap is deploying production Firestore rules; a handful of medium- and low-priority polish items also remain.

---

## 1. Pages Inventory

| Page | URL | SEO Indexed | Status |
|------|-----|-------------|--------|
| Homepage | `/` | ✅ Yes | ✅ Live |
| Menu | `/menu.html` | ✅ Yes | ✅ Live |
| Events & Catering | `/events-and-catering.html` | ✅ Yes | ✅ Live |
| About Us / Team | `/about-us/` | ✅ Yes | ✅ Live |
| Team Profile | `/about-us/profile.html` | ✅ Yes | ✅ Live |
| Profile Submission Form | `/about-us/profile-form.html` | — | ✅ Live |
| Profile Review (Admin) | `/about-us/review.html` | ❌ noindex | ✅ Live |
| Contact Us | `/contact-us.html` | ✅ Yes | ✅ Live |
| FAQ | `/faq.html` | ✅ Yes | ✅ Live |
| Flyers & Promotions | `/flyers.html` | ✅ Yes | ✅ Live |
| Privacy Policy | `/privacy-policy.html` | ✅ Yes | ✅ Live |
| Terms of Use | `/terms-of-use.html` | ✅ Yes | ✅ Live |
| 404 Not Found | `/404.html` | ❌ noindex | ✅ Live |
| Admin Dashboard | `/admin.html` | ❌ noindex | ✅ Live |
| Presentation | `/presentation.html` | ❌ noindex | ✅ Live |
| **Chinese versions** | `/chinese/` (4 pages) | ✅ Yes | ✅ Live |

---

## 2. What Is Working Well ✅

### SEO & Discoverability
- All public pages have unique `<title>` and `<meta name="description">` tags.
- Open Graph and Twitter Card meta tags present on every page.
- `<link rel="canonical">` set correctly on all public pages.
- `robots.txt` correctly disallows `/admin.html` and points to `sitemap.xml`.
- `sitemap.xml` covers all key public pages with correct `lastmod`, `changefreq`, and `priority` values.
- Multilingual (`hreflang`) annotations implemented in the sitemap for English/Chinese page pairs.
- JSON-LD structured data (Restaurant schema) present on the homepage with address, coordinates, hours, telephone, and menu URL.
- Google Analytics 4 (`G-8LVTFZH7VD`) loaded on every page.
- Geo meta tags (`geo.region`, `geo.placename`) target Cape Coast, Ghana.

### Progressive Web App (PWA)
- `manifest.json` defined with name, short name, theme colour, start URL, and display mode.
- Service worker (`sw.js`) pre-caches static assets and serves offline.
- Admin-specific service worker (`admin-sw.js`) isolated from the customer-facing cache.
- Firebase Cloud Messaging service worker (`firebase-messaging-sw.js`) registered for push notifications.

### Build & Performance
- Tailwind CSS is now generated via a local build step (`npm run build:css`, run automatically as a Firebase Hosting `predeploy` hook), eliminating the unoptimised ~3 MB CDN bundle.
- Google Fonts `preconnect` hints (`fonts.googleapis.com` and `fonts.gstatic.com`) are present on every page, reducing render-blocking latency.
- Custom `404.html` error page exists and is wired into Firebase Hosting (`firebase.json` → `"404": "404.html"`), providing a branded not-found experience.

### Security & Access Control
- Firebase Firestore Security Rules enforce role-based access: public read on menu/prices/images, authenticated-only order creation, admin-only reservation management and contact message reading.
- Two rules files provided: a development file (email-based fallback) and a hardened production file (Custom Claims only).
- Admin dashboard verifies admin status client-side before rendering and signs out unauthorised users automatically.
- Admin portal hidden from search engines and excluded from the PWA manifest scope.

### User Features
- Online ordering with cart, Firebase-backed order persistence, and real-time status updates.
- Table reservation form backed by Firestore.
- Contact form submitting to Firestore `contact_messages`.
- User authentication (email + password) with sign-up, sign-in, and password reset.
- Chinese-language versions of the homepage, menu, FAQ, and privacy policy.
- QR code assets and shareable flyer page for offline/print promotion.
- Team / About Us section with staff profile cards pulled from Firestore.

### Admin Features
- Menu management: add, edit, delete dishes; toggle visibility; override prices and images.
- Order management with real-time dashboard.
- Reservation management.
- Contact messages inbox.
- Admin user management (grant / revoke admin access via Firestore `admins` collection).

---

## 3. Issues & Gaps ⚠️

### High Priority

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| H1 | ~~**Inconsistent opening hours** in metadata~~ | ~~`contact-us.html` OG description~~ | ✅ **Resolved** — all pages now show Mon–Fri 11:00–17:30 |
| H2 | **Production Firestore rules not yet deployed** | `firestore.rules.production` exists but must be manually copied into Firebase Console | Security gap if dev rules are still active in production |
| H3 | **Bootstrap admin email** (`admin@luban.com`) still enabled in dev rules | `firestore.rules` | Any user who creates that account gains admin access |

### Medium Priority

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| M1 | ~~`staff-guide.html` is indexed by search engines~~ | — | ✅ **No longer applicable** — page has been removed |
| M2 | ~~`sameAs` array in JSON-LD is empty~~ | — | ✅ **Resolved** — Facebook and Instagram profile URLs added to the `sameAs` array |
| M3 | ~~`sitemap.xml` is missing `about-us/profile.html`~~ | — | ✅ **Resolved** — `about-us/profile.html` entry added to `sitemap.xml` |
| M4 | ~~Tailwind CSS loaded from CDN (`cdn.tailwindcss.com`)~~ | — | ✅ **Resolved** — local build step generates a purged CSS bundle |
| M5 | Firebase SDK loaded as compat (v10.7.1) via CDN | All pages | Older SDK version; no tree-shaking; larger bundle |
| M6 | ~~No custom `404.html` error page~~ | — | ✅ **Resolved** — `404.html` exists and configured in `firebase.json` |
| M7 | ~~favicon is a JPEG (`favicon.jpeg`)~~ | — | ✅ **Resolved** — `<link rel="icon">` now points to `logo.png` (PNG) |

### Low Priority

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| L1 | ~~PWA manifest uses JPEG for the 192×192 icon~~ | — | ✅ **Resolved** — `manifest.json` icons now reference `logo.png` with `type: image/png` |
| L2 | ~~`career-quiz.html` indexed by search engines~~ | — | ✅ **No longer applicable** — page has been removed |
| L3 | `presentation.html` uses external CDN (pptxgenjs) with a pinned version | `presentation.html` | Minor supply-chain risk; acceptable for an internal page |
| L4 | ~~`about-us/index.html` canonical points to `/team/`~~ | — | ✅ **Resolved** — canonical now correctly set to `https://lubanrestaurant.com/about-us/` |
| L5 | ~~Google Fonts loaded synchronously without preconnect~~ | — | ✅ **Resolved** — `preconnect` hints added on all pages |

---

## 4. Next Steps

### Immediate (before next marketing push)

- [x] **Fix hours inconsistency** — `contact-us.html` Open Graph description now matches Mon–Fri 11:00–17:30. ✅
- [ ] **Deploy production Firestore rules** — copy `firestore.rules.production` into Firebase Console → Firestore → Rules and publish. Remove the bootstrap email fallback.
- [ ] **Set up Firebase Custom Claims** for the primary admin account (follow the steps in `FIRESTORE_RULES_README.md`).
- [x] **Add a `404.html` page** — branded not-found page created and configured in `firebase.json`. ✅

### Short-term (within 2 weeks)

- [x] ~~**Set `staff-guide.html` to noindex**~~ — page has been removed. ✅
- [x] **Update `sitemap.xml`** — added `about-us/profile.html`. ✅
- [x] **Fix JSON-LD `sameAs`** — Facebook and Instagram profile URLs added to the `sameAs` array on the homepage. ✅
- [x] **Fix `about-us/index.html` canonical** — canonical now correctly points to `https://lubanrestaurant.com/about-us/`. ✅
- [x] **Replace JPEG favicon** — `<link rel="icon">` now points to `logo.png` (PNG); `manifest.json` icons also updated to PNG. ✅
- [x] **Add Google Fonts preconnect hints** — `preconnect` hints added sitewide. ✅

### Medium-term (within 1 month)

- [x] **Introduce a build step** — Tailwind CLI build (`npm run build:css`) is wired as a Firebase Hosting `predeploy` hook; CSS is now locally generated and purged. ✅
- [x] **Upgrade to modular Firebase SDK** — removed `firebase-*-compat.js`, added bundled modular Firebase bridge files, and wired JS bundling into the build/predeploy pipeline. ✅
- [ ] **Performance audit** — Lighthouse mobile run completed (`/index.html`: 60, `/menu.html`: 74). Lazy-loading and WebP hero image were applied, but additional optimization is still required to reach ≥ 90.
- [x] **Accessibility audit** — Lighthouse Accessibility was run across all pages and missing `aria-label` attributes were added to icon-only controls/links. ✅

### Long-term (ongoing)

- [ ] **Set up Firebase Hosting via CI/CD** — add a GitHub Actions workflow to deploy on every push to `main`, so deployments are automated and auditable.
- [ ] **Implement Firebase App Check** — protect Firestore and Authentication from abuse by unauthorised clients.
- [ ] **Monitor Core Web Vitals** — use Google Search Console and GA4 to track real-user performance over time.
- [ ] **Expand multilingual coverage** — the Chinese section currently covers only 4 pages; consider adding `contact-us`, `events-and-catering`, and `about-us` in Chinese.
- [ ] **Social media integration** — add verified social profile links, an Instagram feed widget, or a WhatsApp chat button to increase engagement.
- [ ] **Email notifications for new orders/reservations** — wire Firebase Functions to send email alerts to staff when a new order or reservation is submitted.

---

## 5. Readiness Score

| Category | Score | Notes |
|----------|-------|-------|
| Core functionality | 9 / 10 | All key customer flows working; branded 404 page added |
| SEO | 9 / 10 | Hours fixed, canonical corrected, sitemap and `sameAs` updated |
| Security | 7 / 10 | Good rules architecture; production rules must be deployed |
| Performance | 7 / 10 | Local Tailwind build and Fonts preconnect added; image optimisation still pending |
| PWA | 8 / 10 | Service worker and manifest present; icons and favicon now PNG |
| Accessibility | 6 / 10 | Not fully audited; icon buttons likely missing labels |
| **Overall** | **7.8 / 10** | Ready for launch; deploy production Firestore rules before promoting |

---

*Report generated from static code analysis of the `luban-workshop` repository as of May 2026.*
