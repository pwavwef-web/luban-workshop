# Luban Workshop Admin App

Standalone Next.js + TypeScript admin app for Luban Workshop Restaurant. It is built beside the existing website and does not replace `admin.html` yet.

## Stack

- Next.js App Router with TypeScript
- Firebase Auth and Firestore client SDK
- Existing secured Cloud Function API at `/api/admin/*`
- Firebase Hosting site: `luban-admin`

## Local Setup

1. Install dependencies:

```bash
cd admin-app
npm install
```

2. Create `.env.local` from `.env.example`.

3. Run locally:

```bash
npm run dev
```

The default API base is `/api`. During local development, either run Firebase emulators/hosting rewrites or set:

```bash
NEXT_PUBLIC_ADMIN_API_BASE_URL=https://lubanrestaurant.com/api
```

## Environment Variables

All client Firebase values must be public `NEXT_PUBLIC_*` variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `NEXT_PUBLIC_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_ADMIN_API_BASE_URL`

## Security Model

Admin access matches the hardened legacy dashboard:

- Firebase Auth custom claim `admin: true`, or
- lowercased auth email exists as a document id in Firestore `admins`.

No bootstrap or placeholder admin access is included. SMS campaigns, fraud review, and chatbot bootstrap actions call existing secured Cloud Functions with the current Firebase ID token.

## Build, Validate, Deploy

```bash
npm run check
firebase deploy --only hosting:luban-admin
```

The root `firebase.json` hosts this app from `admin-app/out`, rewrites `/api/**` to the existing `api` Cloud Function, and supports clean admin routes.

## Collections Used

The app reuses existing collections:

- `admins`
- `orders`
- `reservations`
- `contact_messages`
- `dishAvailability`
- `menuPrices`
- `menuImages`
- `promotions`
- `specialMenus`
- `chatbotKnowledge`
- `smsCampaigns` through API readbacks
- `securityEvents` through API review summaries

No new Firestore collections are introduced.
