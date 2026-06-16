# Security Test Report

Date: 2026-06-16

## Scope

Reviewed the static site, Firebase client integration, Cloud Functions API, Firestore/Storage rules, dependency posture, exposed key patterns, and the Bao assistant/cart workflow.

## Tests Run

| Check | Result |
| --- | --- |
| `npm audit --audit-level=low` | Passed after dependency updates; 0 root vulnerabilities remain. |
| `npm --prefix functions audit --audit-level=moderate` | Fails on remaining Firebase Admin transitive `uuid` advisory. See findings. |
| `npm run check` | Passed. ESLint reports 14 warnings, no errors. |
| `npm run test:e2e` | Passed: 3/3 Playwright critical-flow tests. |
| `npm run build` | Passed. Build warns that `caniuse-lite`/Browserslist data is outdated. |
| Secret scan: OpenAI-style keys/private keys | No matches found. |
| Secret/config scan: Firebase keys | Public Firebase client API key appears in expected client config files. |
| Browser mobile verification | Passed on 390x844 viewport for chat open/close, scroll stability, and cart action. |

## Fixes Applied

- Cleared root dependency audit findings by running `npm audit fix` and upgrading `esbuild` to `0.28.1`.
- Reduced Functions dependency risk with `npm audit fix`, `nodemailer@8.0.11`, and `firebase-admin@13.10.0`.
- Made the mobile Bao chat a stable fixed overlay.
- Added outside-tap close for the Bao chat on mobile.
- Locked and restored document scroll while mobile chat is open.
- Added assistant cart tools for direct user instructions:
  - Add menu items to cart.
  - Remove menu items from cart.
  - Show cart.
  - Clear cart.
  - Open checkout without placing the final order.
- Synced assistant cart writes back into the homepage cart UI and badges.

## Findings

### High Priority

1. Functions still has an upstream moderate `uuid` advisory through Firebase Admin dependencies.
   - Current compatible stack: `firebase-functions@7.2.5`, `firebase-admin@13.10.0`.
   - `npm audit` suggests a breaking Firebase Admin move. `firebase-admin@14.0.0` currently conflicts with the published `firebase-functions@7.2.5` peer range, so it was not kept.
   - Recommendation: monitor Firebase Functions/Admin releases and upgrade when a compatible pair clears the advisory.

2. Firebase Hosting security headers are not configured in `firebase.json`.
   - Add headers such as `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and a cautious `Strict-Transport-Security` policy after production validation.
   - Because the site loads Firebase, Google Fonts, Turnstile, and Firebase AI, CSP should be rolled out in report-only mode first.

3. No automated Firestore/Storage rules unit tests were found.
   - Rules are reasonably tight on review, but they should be regression-tested with `@firebase/rules-unit-testing`.
   - Cover public reads, denied public writes, owner-only customer profile access, admin-only collections, order owner reads, and Storage upload constraints.

### Medium Priority

4. Public Firebase API keys are present in client files.
   - This is normal for Firebase web apps and is not a private secret.
   - Tighten in Firebase/Google Cloud console with authorized domains, API restrictions where possible, quota alerts, and Firebase App Check.

5. Bao uses client-side Firebase AI.
   - The assistant is now safer for cart actions because local functions perform cart changes and the model does not decide whether an action succeeded.
   - For stronger abuse control, consider moving AI calls behind the existing `/api` layer with auth/App Check/rate limits.

6. Browserlist data is outdated.
   - Build still passes, but update with `npx update-browserslist-db@latest` during routine dependency maintenance.

### Positive Controls Observed

- Firestore rules deny direct public writes to orders, reservations, contact messages, and security event collections.
- Order creation is server-side and reprices items authoritatively.
- Phone OTP and order creation have rate limiting.
- Turnstile is server-verified for reservation/contact flows.
- Admin access no longer relies on the retired bootstrap admin email.
- Storage writes are denied except admin-managed team profile images with size/type checks.

## Mobile Chat Verification

Manual browser check on `http://127.0.0.1:4173/index.html` at 390x844:

- Opening chat sets the panel as visible and locks document scroll.
- The panel header remains fixed during swipe/scroll gestures.
- Underlying page scroll remains frozen while chat is open.
- Tapping outside the chat closes it and restores the previous page scroll position.
- Asking `add 2 Chicken Noodles to my cart` adds the item and updates cart badges to `2`.

## Recommended Next Tightening Steps

1. Add Firebase Hosting security headers, starting with CSP report-only.
2. Add Firestore/Storage rules unit tests and run them in CI.
3. Enable/enforce Firebase App Check for public client surfaces where practical.
4. Move Bao model calls server-side if usage abuse or prompt/action auditability becomes important.
5. Revisit Firebase Admin dependency advisories when a compatible `firebase-functions` release supports a non-vulnerable Admin stack.
