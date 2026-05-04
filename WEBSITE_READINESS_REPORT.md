# Luban Workshop Restaurant – Website Readiness Report

**Date:** May 2026  
**Site:** [lubanrestaurant.com](https://lubanrestaurant.com)  
**Stack:** Static HTML · Firebase (Auth + Firestore) · Tailwind CSS (CDN) · Google Analytics 4 · PWA

---

## Executive Summary

The Luban Workshop Restaurant website is **substantially ready for public use**. Core customer-facing flows (browse menu, place order, book a table, contact the restaurant) are all implemented and live. The admin dashboard covers day-to-day operational needs. Several lower-priority items remain — most notably content inconsistencies, PWA asset quality, and a missing production build step — that should be resolved before the site is considered fully production-hardened.

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
| Contact Us | `/contact-us.html` | ✅ Yes | ✅ Live |
| FAQ | `/faq.html` | ✅ Yes | ✅ Live |
| Flyers & Promotions | `/flyers.html` | ✅ Yes | ✅ Live |
| Staff Guide | `/staff-guide.html` | ✅ Yes | ⚠️ Should be noindex |
| Career Quiz | `/career-quiz.html` | ✅ Yes | ⚠️ Consider noindex |
| Privacy Policy | `/privacy-policy.html` | ✅ Yes | ✅ Live |
| Terms of Use | `/terms-of-use.html` | ✅ Yes | ✅ Live |
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
- AI-powered career quiz page (Gemini AI integration).
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
| H1 | **Inconsistent opening hours** in metadata | `contact-us.html` OG description says "Mon–Sun 11:00–22:00"; homepage says "Mon–Fri 11:00–17:30" | Misleads customers; hurts trust |
| H2 | **Production Firestore rules not yet deployed** | `firestore.rules.production` exists but must be manually copied into Firebase Console | Security gap if dev rules are still active in production |
| H3 | **Bootstrap admin email** (`admin@luban.com`) still enabled in dev rules | `firestore.rules` | Any user who creates that account gains admin access |

### Medium Priority

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| M1 | `staff-guide.html` is indexed by search engines | `<meta name="robots">` | Internal document appears in Google results |
| M2 | `sameAs` array in JSON-LD is empty | `index.html` structured data | Missed opportunity to link social media profiles |
| M3 | `sitemap.xml` is missing several pages | `sitemap.xml` | Pages not indexed: `career-quiz.html`, `staff-guide.html`, `about-us/profile.html` |
| M4 | Tailwind CSS loaded from CDN (`cdn.tailwindcss.com`) | All pages | CDN version is un-purged (~3 MB); slows page load |
| M5 | Firebase SDK loaded as compat (v10.7.1) via CDN | All pages | Older SDK version; no tree-shaking; larger bundle |
| M6 | No custom `404.html` error page | Root | Broken links show a generic hosting error page |
| M7 | favicon is a JPEG (`favicon.jpeg`) | `<link rel="icon">` | JPEG favicons display poorly on some browsers/OS; `.ico` or `.png` preferred |

### Low Priority

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| L1 | PWA manifest uses JPEG for the 192×192 icon | `manifest.json` | Some Android launchers reject JPEG icons; PNG recommended |
| L2 | `career-quiz.html` indexed by search engines | `<meta name="robots">` | May generate confusing search results unrelated to the restaurant |
| L3 | `presentation.html` uses external CDN (pptxgenjs) with a pinned version | `presentation.html` | Minor supply-chain risk; acceptable for an internal page |
| L4 | `about-us/index.html` canonical points to `/team/` but URL is `/about-us/` | `<link rel="canonical">` | Canonical mismatch can cause duplicate-content signals in Google |
| L5 | Google Fonts loaded synchronously | All pages | Render-blocking; use `font-display: swap` and preconnect hints |

---

## 4. Next Steps

### Immediate (before next marketing push)

- [ ] **Fix hours inconsistency** — update `contact-us.html` Open Graph description to match the actual operating hours (Mon–Fri 11:00–17:30).
- [ ] **Deploy production Firestore rules** — copy `firestore.rules.production` into Firebase Console → Firestore → Rules and publish. Remove the bootstrap email fallback.
- [ ] **Set up Firebase Custom Claims** for the primary admin account (follow the steps in `FIRESTORE_RULES_README.md`).
- [ ] **Add a `404.html` page** — create a branded not-found page and configure it as the custom error page in Firebase Hosting (`firebase.json` → `"hosting": { "cleanUrls": true, "trailingSlash": false, "404": "404.html" }`).

### Short-term (within 2 weeks)

- [ ] **Set `staff-guide.html` to noindex** — change `<meta name="robots" content="index, follow">` to `noindex, nofollow`.
- [ ] **Update `sitemap.xml`** — add `career-quiz.html` and fix or remove `staff-guide.html` entry; verify `about-us/` canonical URL.
- [ ] **Fix JSON-LD `sameAs`** — add social media profile URLs (Facebook, WhatsApp Business, Instagram, etc.) to the `sameAs` array on the homepage.
- [ ] **Fix `about-us/index.html` canonical** — change `https://lubanrestaurant.com/team/` to `https://lubanrestaurant.com/about-us/`.
- [ ] **Replace JPEG favicon** — export a proper 32×32 `.ico` (or 32×32 + 180×180 PNGs) and update both `<link rel="icon">` and `manifest.json`.
- [ ] **Add Google Fonts preconnect hints** — add `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` before the font stylesheet on all pages.

### Medium-term (within 1 month)

- [ ] **Introduce a build step** — use Vite or a simple PostCSS + Tailwind CLI build to generate a purged CSS bundle (reduces CSS from ~3 MB to ~10 KB). This alone will significantly improve Lighthouse performance scores.
- [ ] **Upgrade to modular Firebase SDK** — migrate from `firebase-*-compat.js` to the modular SDK (`import { initializeApp } from 'firebase/app'`) and bundle with the above build step.
- [ ] **Performance audit** — run Lighthouse on the homepage and menu page; target a Performance score ≥ 90 on mobile. Key wins: lazy-load images, defer non-critical JS, and serve WebP images.
- [ ] **Accessibility audit** — run `axe` or Lighthouse Accessibility on all pages; add missing `aria-label` attributes on icon-only buttons.
- [ ] **Add `career-quiz.html` to sitemap or set it to noindex** — decide whether this page is customer-facing or internal and update accordingly.

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
| Core functionality | 9 / 10 | All key customer flows working |
| SEO | 8 / 10 | Solid foundation; minor fixes needed |
| Security | 7 / 10 | Good rules architecture; production rules must be deployed |
| Performance | 6 / 10 | CDN Tailwind + unoptimised images drag scores down |
| PWA | 7 / 10 | Service worker and manifest present; icon format could be better |
| Accessibility | 6 / 10 | Not fully audited; icon buttons likely missing labels |
| **Overall** | **7 / 10** | Ready for launch; complete H-priority items before promoting |

---

*Report generated from static code analysis of the `luban-workshop` repository as of May 2026.*
