# Luban Workshop Restaurant — Website Readiness Report

**Date:** May 2026  
**Site URL:** https://lubanrestaurant.com  
**Hosting:** GitHub Pages (custom domain via CNAME)  
**Backend:** Firebase (Auth + Firestore)  
**Report Status:** Pre-launch / ongoing improvement review

---

## Executive Summary

The Luban Workshop Restaurant website is **substantially complete** and publicly accessible at [lubanrestaurant.com](https://lubanrestaurant.com). Core customer-facing features — online menu browsing, ordering, table reservations, events enquiry, and contact — are all functional. The admin dashboard is secured behind Firebase authentication with role-based access control. SEO foundations are solid: structured data, Open Graph, Twitter Cards, sitemap, and canonical URLs are all in place. A number of lower-priority gaps and polish items remain before the site can be considered fully production-hardened.

---

## Pages Inventory

| Page | Path | Public | Indexed | Status |
|---|---|---|---|---|
| Homepage | `/` | ✅ | ✅ | Complete |
| Full Menu | `/menu.html` | ✅ | ✅ | Complete |
| Events & Catering | `/events-and-catering.html` | ✅ | ✅ | Complete |
| About Us / Team | `/about-us/` | ✅ | ✅ | Complete |
| Contact Us | `/contact-us.html` | ✅ | ✅ | Complete |
| FAQ | `/faq.html` | ✅ | ✅ | Complete |
| Flyers & Promotions | `/flyers.html` | ✅ | ✅ | Complete |
| Privacy Policy | `/privacy-policy.html` | ✅ | ⚠️ `noindex` set | See gaps |
| Terms of Use | `/terms-of-use.html` | ✅ | ✅ | Complete |
| Career Quiz | `/career-quiz.html` | ✅ | ✅ | Not linked from nav — orphan page |
| Staff Guide | `/staff-guide.html` | ✅ | ⚠️ `index, follow` | Should be `noindex` |
| Team Presentation | `/presentation.html` | ✅ | ✅ `noindex` | Internal use only |
| Admin Dashboard | `/admin.html` | 🔒 Auth-gated | ✅ `noindex` | Complete |
| Chinese Homepage | `/chinese/` | ✅ | ✅ | Complete |
| Chinese Menu | `/chinese/menu.html` | ✅ | ✅ | Complete |
| Chinese FAQ | `/chinese/faq.html` | ✅ | ✅ | Complete |
| Chinese Privacy Policy | `/chinese/privacy-policy.html` | ✅ | ✅ | Complete |
| Team Profile View | `/about-us/profile.html` | ✅ | — | Complete |
| Team Profile Form | `/about-us/profile-form.html` | 🔒 Admin | — | Complete |
| Team Review | `/about-us/review.html` | 🔒 Admin | — | Complete |

---

## Feature Audit

### ✅ Complete and Working

| Feature | Notes |
|---|---|
| Online menu with category filters | 12 categories: Soups, Starters, Beef & Lamb, Pork, Chicken, Seafood, Rice, Noodles, Dumplings, Vegetable, Mains, All |
| Shopping cart & online ordering | Auth-gated; order history visible to logged-in users |
| Firebase Auth (sign up / login) | Email/password via Firebase Auth |
| Table reservation system | Firestore-backed; reservations visible to admins |
| Private events & catering enquiry | Dedicated page with enquiry form |
| Contact Us form | Submits to Firestore `contact_messages` collection |
| Admin dashboard | Orders, reservations, menu management, contacts, team profiles, admin users |
| Admin role-based access control | Firebase Custom Claims + Firestore `admins` collection + bootstrap email |
| Bilingual support (English / Chinese) | `/chinese/` directory mirrors key public pages |
| Progressive Web App (PWA) | Service worker, `manifest.json`, offline caching, installable |
| Push notification infrastructure | `firebase-messaging-sw.js` registered |
| Google Analytics | GA4 property `G-8LVTFZH7VD` on all pages |
| SEO — structured data | JSON-LD `Restaurant` schema on homepage |
| SEO — Open Graph / Twitter Cards | All public pages |
| SEO — sitemap | `/sitemap.xml` with `hreflang` alternates for EN/ZH |
| SEO — robots.txt | Admin page disallowed; sitemap declared |
| Canonical URLs | All public pages |
| Geo meta tags | `geo.region: GH-CP`, `geo.placename: Cape Coast, Ghana` |
| QR code assets | `/assets/qr-codes/` directory present |
| Flyers & downloadable promotions | `/flyers.html` |
| Staff team profiles (public) | `/about-us/` — approved profiles shown publicly |
| Presentation deck | `/presentation.html` with PowerPoint export |
| Staff guide / onboarding doc | `/staff-guide.html` |
| Firestore security rules | Development (`firestore.rules`) and production (`firestore.rules.production`) variants |

---

## Gaps & Issues

### 🔴 High Priority

| # | Issue | Detail |
|---|---|---|
| 1 | **Bootstrap admin email in dev rules** | `firestore.rules` allows `admin@luban.com` as an admin by email — anyone can create this Firebase Auth account and gain admin access. This file must never be deployed to production. Use `firestore.rules.production` (Custom Claims only) for the live environment. |
| 2 | **Opening hours inconsistency** | Homepage and structured data say **Mon–Fri 11:00–17:30**. The Contact Us page Open Graph description says **Mon–Sun 11:00–22:00**. These must be reconciled; customers may arrive during wrong hours. |

### 🟡 Medium Priority

| # | Issue | Detail |
|---|---|---|
| 3 | **Privacy Policy has `noindex`** | `privacy-policy.html` sets `<meta name="robots" content="noindex, follow">`. Legal pages typically should be indexed (and Google may require a visible, linked policy). Consider switching to `index, follow`. |
| 4 | **Staff Guide is publicly indexed** | `staff-guide.html` is set to `index, follow` and contains internal training material. It should have `noindex, nofollow` and optionally be moved behind auth. |
| 5 | **Career Quiz is an orphan page** | The nav button was removed but the page is still live, indexed, and linked from the sitemap. Either re-link it from the nav, or add it to the sitemap and give it a home, or remove it and redirect. |
| 6 | **`sameAs` is empty in structured data** | The JSON-LD `Restaurant` schema on the homepage has `"sameAs": []`. Populate with social media and directory URLs (e.g. Google Maps, Facebook, Instagram, TripAdvisor) to boost local SEO. |
| 7 | **About Us canonical URL mismatch** | The About Us page (`/about-us/index.html`) sets its canonical to `/team/` which does not exist. This confuses Google. Update the canonical to `https://lubanrestaurant.com/about-us/`. |
| 8 | **Tailwind CSS loaded from CDN** | All pages load Tailwind from `cdn.tailwindcss.com`. This adds ~350 KB on every page load and relies on a third-party CDN. For production, build a purged, self-hosted CSS bundle to improve performance and reliability. |
| 9 | **Lucide icons loaded from unpkg CDN** | Same concern as Tailwind — unpkg CDN dependency in production is a reliability and performance risk. Self-host the icon sprite or use a build step. |

### 🟢 Low Priority / Polish

| # | Issue | Detail |
|---|---|---|
| 10 | **`favicon.jpeg` instead of `.ico` / `.png`** | JPEG favicons are not supported by all browsers. Replace with a 32×32 `.ico` and a 180×180 Apple Touch `.png`. |
| 11 | **PWA manifest icon types** | `manifest.json` uses `favicon.jpeg` (192×192) and `logo.png` (512×512) for icons. The JPEG icon should be converted to PNG for full cross-platform PWA compatibility. |
| 12 | **`og:type` on homepage is `restaurant`** | `restaurant` is not a valid Open Graph type. Use `website` or `place` to avoid Facebook/parser errors. |
| 13 | **Push notifications not yet wired to UI** | `firebase-messaging-sw.js` is registered but there is no UI for users to opt in to push notifications. Either add the opt-in flow or remove the SW to avoid unnecessary overhead. |
| 14 | **Sitemap `lastmod` dates are static** | All sitemap entries show `2026-03-26`. These should be updated when content changes, or generated dynamically, to help Google prioritise recrawling. |
| 15 | **No 404 page** | There is no custom `404.html`. GitHub Pages will show its own default. A branded 404 page improves user experience and prevents dead-ends. |
| 16 | **No `lang` attribute on Chinese pages** | The Chinese pages (`/chinese/`) should declare `<html lang="zh">` instead of `lang="en"` to help screen readers and search engines correctly identify the language. |

---

## Security Summary

| Area | Status | Notes |
|---|---|---|
| Firestore rules — public read protection | ✅ | Only `menuItems`, `dishAvailability`, `menuPrices`, `menuImages` are public-read |
| Firestore rules — write protection | ✅ | All writes require auth; admin writes require admin role |
| Firestore rules — order privacy | ✅ | Customers can only read their own orders |
| Admin dashboard access | ✅ | Non-admins are signed out and shown "Access denied" |
| Bootstrap email in dev rules | 🔴 | Must not be deployed to production (see Gap #1) |
| Admin page excluded from crawlers | ✅ | `robots.txt` disallows `/admin.html`; page has `noindex` |
| HTTPS | ✅ | Enforced by GitHub Pages |
| No secrets in source code | ✅ | Firebase config is loaded at runtime; no service account keys committed |

---

## SEO Summary

| Signal | Status |
|---|---|
| Structured data (JSON-LD `Restaurant`) | ✅ Complete (minor `sameAs` gap — see Gap #6) |
| Open Graph on all public pages | ✅ |
| Twitter Cards on all public pages | ✅ |
| XML sitemap with `hreflang` | ✅ |
| `robots.txt` | ✅ |
| Canonical URLs | ✅ (one mismatch — see Gap #7) |
| Mobile-responsive design | ✅ |
| HTTPS | ✅ |
| Page speed (CDN dependencies) | ⚠️ Tailwind + Lucide from CDN |
| Google Analytics | ✅ GA4 on all pages |
| Local SEO (geo tags, address schema) | ✅ |
| Bilingual (EN/ZH) with `hreflang` | ✅ |

---

## Next Steps (Prioritised)

### Immediate (before marketing/launch push)

- [ ] **#1 — Deploy production Firestore rules.** Copy `firestore.rules.production` into the Firebase Console and publish it. Confirm the bootstrap email fallback is removed from the live environment.
- [ ] **#2 — Fix opening hours.** Align all references (homepage structured data, Contact Us OG meta, any page copy) to the same authoritative hours.
- [ ] **#7 — Fix canonical URL on About Us page.** Change `<link rel="canonical" href="https://lubanrestaurant.com/team/">` to `https://lubanrestaurant.com/about-us/`.

### Short-term (within 2–4 weeks)

- [ ] **#3 — Re-index Privacy Policy.** Change `noindex` to `index, follow` on `privacy-policy.html` and ensure it is linked from the footer on every page.
- [ ] **#4 — Protect Staff Guide.** Add `noindex, nofollow` to `staff-guide.html`; optionally gate it behind auth.
- [ ] **#5 — Resolve Career Quiz orphan.** Decide: re-add to nav, keep as unlisted page, or delete and add a redirect.
- [ ] **#6 — Populate `sameAs` in structured data.** Add Google Maps, Facebook, Instagram, and any other relevant directory links.
- [ ] **#15 — Create a custom 404 page.** Add `404.html` with navigation back to the homepage.
- [ ] **#16 — Add `lang="zh"` to Chinese pages.** Update all HTML files in `/chinese/` directory.

### Medium-term (within 1–2 months)

- [ ] **#8 & #9 — Self-host CSS/icons.** Set up a lightweight build step (e.g. Vite or just the Tailwind CLI) to produce a purged, self-hosted CSS bundle. Bundle Lucide icons locally instead of loading from unpkg.
- [ ] **#10 & #11 — Fix favicon.** Generate `favicon.ico` (32×32) and `apple-touch-icon.png` (180×180) from the logo. Update all HTML `<link rel="icon">` and manifest icon entries.
- [ ] **#12 — Fix `og:type` on homepage.** Change from `restaurant` to `website`.
- [ ] **#13 — Push notifications decision.** Either implement the opt-in flow (permission prompt + subscription management) or remove `firebase-messaging-sw.js` to reduce bundle overhead.
- [ ] **#14 — Automate sitemap `lastmod`.** Update dates on each content change, or add a simple CI step to regenerate the sitemap on deploy.

---

## Summary Scorecard

| Category | Score | Notes |
|---|---|---|
| Core functionality | 🟢 9/10 | All key features working |
| Security | 🟡 7/10 | Production rules not yet deployed; one critical gap |
| SEO | 🟢 8/10 | Strong foundations; a few metadata gaps |
| Performance | 🟡 6/10 | CDN dependencies for Tailwind and Lucide |
| Accessibility | 🟡 6/10 | Not formally audited; `lang` attribute missing on Chinese pages |
| Content completeness | 🟢 8/10 | Opening hours discrepancy; orphan page |
| Legal compliance | 🟡 7/10 | Privacy Policy hidden from search; Terms present |
| **Overall** | **🟡 7.3/10** | Ready for soft launch; action required before full marketing push |
