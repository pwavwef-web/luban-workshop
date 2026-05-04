# 404 Custom Error Page – Setup Guide

## What was done

A branded **404.html** page has been created and `firebase.json` has been configured to serve it automatically whenever a visitor hits a URL that doesn't exist on the site.

**`firebase.json` (in project root):**

```json
{
  "hosting": {
    "cleanUrls": true,
    "trailingSlash": false,
    "404": "404.html"
  }
}
```

- **`cleanUrls: true`** — Strips `.html` extensions from URLs (e.g. `/contact-us` instead of `/contact-us.html`).
- **`trailingSlash: false`** — Removes trailing slashes from URLs for consistent canonicalisation.
- **`"404": "404.html"`** — Tells Firebase Hosting to serve `404.html` for any unmatched route.

---

## Action required from you

### 1. Deploy to Firebase Hosting

Firebase reads `firebase.json` only when you **deploy**. The custom 404 page will not be active until you redeploy the site.

Run the following from the project root:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Log in (one-time)
firebase login

# Deploy
firebase deploy --only hosting
```

> If you use a CI/CD pipeline (e.g. GitHub Actions), simply merge this change and let the pipeline run — no extra steps are needed beyond the merge.

### 2. Verify the 404 page is live

After deploying, open a URL that doesn't exist on the site, for example:

```
https://lubanrestaurant.com/this-page-does-not-exist
```

You should see the branded **"Page Not Found"** screen instead of the browser's default error page.

---

## No other action required

The `404.html` file is already committed alongside `firebase.json`. Firebase Hosting will pick it up automatically on the next deploy.
