# Mandi Minutes — Hyperlocal Kirana Delivery Web App

> ⚡ Connect customers with nearby Kirana stores for grocery delivery in **10–15 minutes** across Virar (Palghar District), India.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [Running Locally](#running-locally)
- [Building for Production](#building-for-production)
- [Deploying](#deploying)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)

---

## Overview

Mandi Minutes is a **hyperlocal grocery delivery PWA** that connects customers with neighborhood Kirana stores. The app supports:

- 🛒 **Customers** — Browse stores & products by pincode, add to cart, checkout with UPI/COD
- 🏪 **Vendors** — Manage inventory, accept/reject orders via the Vendor Dashboard
- 🚴 **Riders** — Track and fulfil delivery assignments via the Rider Portal
- 🛡️ **Admins** — Full control panel for store, order, and user management
- 🌐 **Multilingual** — English, Hindi, Marathi (i18n via i18next)
- 📱 **PWA** — Installable, offline-capable, push notifications via Firebase Cloud Messaging

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8 |
| Styling | Tailwind CSS 3, custom CSS |
| Routing | React Router v7 |
| State | React Context + Zustand |
| Backend / DB | Firebase Firestore, Firebase Auth, Firebase Functions |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Maps | Leaflet + React Leaflet |
| Charts | Recharts |
| Icons | Lucide React |
| i18n | i18next + react-i18next |
| Linting | Oxlint |
| Testing | Vitest |
| Deployment | Vercel (frontend) + Firebase (Firestore/Functions) |

---

## Prerequisites

Make sure the following tools are installed before running the project:

| Tool | Minimum Version | Install |
|---|---|---|
| **Node.js** | 18.x or higher | https://nodejs.org |
| **npm** | 9.x or higher | Bundled with Node.js |
| **Git** | Any recent version | https://git-scm.com |
| **Firebase CLI** *(optional — for Firestore rules & Functions deploy)* | 13.x+ | `npm install -g firebase-tools` |

> See [`requirements.txt`](./requirements.txt) for a quick reference of all prerequisites.

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/Nishantghadi14/mandi-minutes-web.git
cd mandi-minutes-web

# 2. Install dependencies
npm install

# 3. Set up environment variables (see section below)
cp .env.example .env.local
# Edit .env.local and fill in your Firebase credentials

# 4. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**

---

## Environment Variables

Create a `.env.local` file in the project root with the following keys. You can get these values from your **Firebase Console → Project Settings → Your Apps**.

```env
# Firebase Web App Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase Cloud Messaging (for push notifications)
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

> **Note:** All environment variables must be prefixed with `VITE_` to be accessible in the browser via `import.meta.env`.

> **Works without Firebase:** The app gracefully falls back to locally seeded demo data if Firebase credentials are not provided. You can browse the UI without any Firebase setup.

---

## Firebase Setup

If you want live Firestore data:

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database** (Native mode)
3. Enable **Authentication** → Phone + Email/Password providers
4. Enable **Cloud Messaging** (for push notifications)
5. Copy your Web App config into `.env.local`
6. Deploy Firestore security rules:
   ```bash
   firebase login
   firebase deploy --only firestore:rules
   ```
7. *(Optional)* Deploy Cloud Functions:
   ```bash
   cd functions && npm install
   firebase deploy --only functions
   ```

---

## Running Locally

```bash
# Development server with hot-module reload
npm run dev

# Run unit tests
npm test

# Lint the codebase
npm run lint
```

---

## Building for Production

```bash
# Build optimised static assets into /dist
npm run build

# Preview the production build locally
npm run preview
```

The build is split into optimised chunks automatically:
- `vendor-react` — React + scheduler
- `vendor-icons` — Lucide icons
- `vendor-analytics` — Recharts / D3
- `vendor-utils` — all other dependencies

---

## Deploying

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```
The `vercel.json` in the root configures SPA routing rewrites automatically.

### Firebase Hosting (Alternative)
```bash
firebase deploy --only hosting
```

---

## Project Structure

```
mandi-minutes-web/
├── public/                  # Static assets, PWA manifest, service worker
├── src/
│   ├── assets/              # Images, SVGs
│   ├── components/
│   │   ├── common/          # Navbar, Footer, BottomNav, CartDrawer, Modals, Cards...
│   │   ├── tracking/        # Live order tracking map components
│   │   └── vendor/          # Vendor-specific UI components
│   ├── config/
│   │   ├── firebase.js      # Firebase initialisation (reads from .env.local)
│   │   └── seedDatabase.js  # Local demo data seed
│   ├── context/             # React Contexts (Auth, Cart, Location, Data)
│   ├── data/                # Static fallback / demo data
│   ├── pages/               # Route-level page components
│   │   ├── HomePage.jsx
│   │   ├── StorePage.jsx
│   │   ├── SearchPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── OrderStatusPage.jsx
│   │   ├── VendorDashboard.jsx
│   │   ├── AdminPanel.jsx
│   │   ├── RiderPortal.jsx
│   │   └── ...
│   ├── services/            # Firebase service layer (Firestore reads/writes)
│   ├── store/               # Zustand global stores
│   ├── utils/               # Helper functions
│   ├── i18n.js              # Internationalisation setup (EN/HI/MR)
│   ├── App.jsx              # Root app with routing
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles + Tailwind directives
├── functions/               # Firebase Cloud Functions (Node.js)
├── firestore.rules          # Firestore security rules
├── firestore.indexes.json   # Firestore composite indexes
├── tailwind.config.js       # Tailwind theme (mandi-* color palette)
├── vite.config.js           # Vite build config + chunk splitting
├── vercel.json              # Vercel SPA rewrite rules
├── requirements.txt         # Prerequisites quick-reference
└── package.json
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 5173 |
| `npm run build` | Build production bundle into `/dist` |
| `npm run preview` | Serve production build locally |
| `npm test` | Run Vitest unit tests |
| `npm run lint` | Run Oxlint on the codebase |

---

## Contributing

1. Fork the repo and create a branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -m "feat: add your feature"`
3. Push and open a Pull Request

---

## License

MIT © 2026 Mandi Minutes

cloudflared tunnel --url http://localhost:5173
