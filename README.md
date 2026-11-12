# 🛒 Mandi Minutes — Hyperlocal Kirana Delivery (Web & Android)

[![React 19](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite)](https://vite.dev/)
[![Capacitor Android](https://img.shields.io/badge/Capacitor-Android_8.5-119EFF?logo=capacitor)](https://capacitorjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Vitest-150_Passed-brightgreen?logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> ⚡ **Mandi Minutes** connects neighborhood Kirana stores with local households across Virar, Bolinj, Nallasopara, and Vasai (Palghar District, Maharashtra) for lightning-fast grocery delivery in **10–15 minutes** and scheduled **morning deliveries**.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Multi-Role Architecture](#-multi-role-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Android APKs (Customer & Rider Mobile Apps)](#-android-apks-customer--rider-mobile-apps)
- [Dual-Channel App Update Architecture (OTA & Google Play)](#-dual-channel-app-update-architecture-ota--google-play)
- [Firebase Setup & Production Rules](#-firebase-setup--production-rules)
- [Available Scripts](#-available-scripts)
- [Production Deployment](#-production-deployment)
- [Project Structure](#-project-structure)
- [Contributing & License](#-contributing--license)

---

## 🚀 Key Features

### 🛍️ Shopper Experience
- 📍 **Hyperlocal Pincode Engine** — Dynamic detection and store filtering for Virar West (`401305`), Virar East (`401303`), Nallasopara (`401301`), Arnala (`401309`), and Vasai (`401208`, `401209`).
- 🏠 **Zepto-Style Dynamic Address & Map Picker** — Real-time header resolution showing active delivery address or "Tap to add address", with multi-address management (`Home`, `Work`, `Other`) and precise map pin selection.
- 🏪 **Store Discovery with Live Stock** — In-stock previews on Kirana store cards showing available products and pricing at a glance.
- ⏰ **Dynamic Operating Hours & Scheduled Slots** — Real-time delivery availability indicator with a 10:00 PM operating cutoff, automatically transitioning to next-morning "7:00 AM Fresh Delivery" slots during nighttime hours.
- 💳 **Direct UPI Payments & COD** — Native intent triggers for Google Pay, PhonePe, Paytm, and BHIM (`upi://pay`), dynamic QR codes, and Cash on Delivery with zero client trust verification.
- 🗺️ **Live Rider GPS Tracking** — Real-time interactive Leaflet map tracking the rider’s route from Kirana store to customer doorstep.
- 📱 **Phone OTP & Email Auth** — Fast 6-digit SMS OTP sign-in with automatic multi-account linking, alongside secure email password authentication and in-app password reset.
- 🌙 **Zero-Lag Circular Reveal Theme Engine** — Instant dark/light mode toggle with native View Transitions API circular ripple expanding outward from the tap coordinates.
- 🎓 **Interactive Onboarding Walkthrough** — Guided step-by-step tutorial modal explaining quick delivery, local store ordering, and order tracking.
- 🌐 **Trilingual Localization (i18n)** — Full native support for **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)**.

### 🏪 Kirana Partner Operations
- ⚡ **In-Store Counter POS (Local Sales)** — Dedicated Point-of-Sale module for walk-in counter sales with instant inventory deduction, printable retail cash memos, and one-tap WhatsApp bill sharing.
- 🔔 **Audio Order Alerts** — High-priority sound chime loops notifying shop owners when new customer orders arrive, complete with mute and volume controls.
- 📊 **SLA & Real-Time Metrics** — Packing time countdowns, SLA breach warnings, revenue graphs, and low-stock indicators.
- 📍 **Interactive Shop Location Pinning** — Leaflet map picker allowing vendors to pinpoint their physical storefront coordinates.

### 🛵 Rider Fleet Portal
- 📦 **Order Dispatch Console** — Accept neighborhood deliveries, view customer contact details, and update transit stages.
- 📡 **Live GPS Coordinate Broadcast** — Real-time rider location sharing with customer tracking screens.
- 📲 **Standalone Rider APK** — Independent Android APK build profile for delivery partners.

### 🛡️ Super Admin Control Center
- 💰 **Monthly Store Settlements & Payouts** — Automated accounting system tracking items sold, gross sales, platform fees, and net vendor payout owed by month-end. Includes CSV statement export and 1-tap WhatsApp statement slips.
- 🚨 **Fraud & High-Value Guardrails** — Real-time monitoring of high-value COD orders (≥ ₹1,500) and suspicious order densities.
- 👥 **Customer Directory & Abuse Prevention** — Customer lifetime spend insights and fraud ban/unban toggles.
- 🏷️ **Promotions & Banners** — Centralized discount coupon engine (percentage/flat off) and hero banner manager.

---

## 👥 Multi-Role Architecture

| Role | Portal / Route | Capabilities |
|---|---|---|
| **Customer** | `/` & `/store/:id` | Browse local Kiranas, add items to cart, order via UPI/COD, track rider live, manage saved addresses & profile. |
| **Vendor** | `/vendor` | Store inventory management, Live POS for counter sales, pricing/stock toggles, audio order alerts, SLA metrics. |
| **Vendor Onboarding** | `/vendor-onboarding` | Kirana store self-registration, address pinning, and instant catalog initialization. |
| **Rider** | `/rider` | Accept delivery runs, broadcast real-time GPS coordinates, call customers/stores, update delivery status. |
| **Super Admin** | `/admin` | Master control panel: monthly vendor settlements, store approvals, coupons, fraud monitor, and live order ops. |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Core** | React 19, React Router v7, Vite 8 |
| **Mobile Runtime** | Capacitor 8 (Android Native Container) |
| **State Management** | Zustand (persistent & real-time stores) + React Context |
| **Styling & Design** | Tailwind CSS 3, Claymorphism Design System, Lucide React Icons |
| **Backend & Database** | Firebase Firestore (Real-Time NoSQL), Firebase Auth, Cloud Functions |
| **Push Notifications** | Firebase Cloud Messaging (FCM) + Service Workers |
| **Maps & Geo** | Leaflet, React Leaflet (OpenStreetMap / CartoDB tiles) |
| **Data Visualization** | Recharts (Vendor & Admin performance analytics) |
| **Quality & Tests** | Oxlint (fast linter), Vitest (**150 automated unit tests across 16 test suites**) |

---

## 📋 Prerequisites

- **Node.js**: `18.0.0` or higher ([Download](https://nodejs.org/))
- **npm**: `9.0.0` or higher (bundled with Node.js)
- **Java JDK**: 17 or 21 (required only for building Android APKs)
- **Android SDK / Android Studio**: (required only for building Android APKs)
- **Git**: Recent version ([Download](https://git-scm.com/))

---

## 💻 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Nishantghadi14/mandi-minutes-web.git
cd mandi-minutes-web
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory (see [Environment Variables](#-environment-variables) below).

### 4. Run the development server
```bash
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Web App Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here

# Firebase Cloud Messaging (Web Push Notifications)
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here

# Optional: Default Merchant UPI Handle
VITE_MERCHANT_UPI_ID=mahalaxmi.kirana@okicici

# Optional: Super Admin Emails (comma-separated)
VITE_ADMIN_EMAILS=admin@mandiminutes.com,admin@mandi.in
```

---

## 📱 Android APKs (Customer & Rider Mobile Apps)

Mandi Minutes supports separate native Android packages via **Capacitor 8**:

### 1. Customer Shopping App (`mandi-minutes.apk`)
- **Branding Assets**: High-resolution custom mascot and shopping cart icon generated across all densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) including adaptive foreground and round icons.
- **Native Splash Screen**: Deep dark (`#121212`) splash screen with Mandi Minutes branding and smooth transition.
- **Hardware Back Navigation**: Native `onBackPressed()` handling that walks back through app navigation history.
- **Cryptographic Release Signing**: Release builds are signed with Android APK Signature Scheme v2/v3, allowing direct and seamless installation on real Android devices without "Package appears to be invalid" errors.
- **Declared Intent Queries**: UPI payment apps (`upi://pay`), phone dialer (`tel:`), GPS (`ACCESS_FINE_LOCATION`), and Android 13+ push notifications (`POST_NOTIFICATIONS`).

```bash
# Build production release APK:
npm run build:apk

# Build debug APK for USB testing:
npm run build:apk:debug
```

### 2. Delivery Rider Fleet App (`mandi-rider.apk`)
- Standalone configuration with rider portal entrypoint (`/rider`) and background geolocation hooks.

```bash
# Build production release Rider APK:
npm run build:apk:rider

# Build debug Rider APK:
npm run build:apk:rider:debug
```

---

## 🔄 Dual-Channel App Update Architecture (OTA & Google Play)

Mandi Minutes combines two update channels to ensure **zero-friction speed** for day-to-day web/UI improvements and **rock-solid compliance** for native Android capability upgrades:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      MANDI MINUTES UPDATE ENGINE                       │
├───────────────────────────────────┬────────────────────────────────────┤
│   CHANNEL 1: Live OTA Web Sync    │   CHANNEL 2: Google Play Releases  │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Speed: Instant (10–15 seconds)  │ • Speed: 24–48h Google Play review │
│ • Review: Zero Play Store review  │ • Target: Native Java/Kotlin & SDKs│
│ • Scope: React UI, pricing rules, │ • Scope: Background GPS, Camera,   │
│   checkout flow, translations     │   Bluetooth, Push Notification SDK │
│ • Fallback: Auto-rollback on crash│ • Gate: Mandatory modal / banner   │
└───────────────────────────────────┴────────────────────────────────────┘
```

### Channel 1: Over-The-Air (OTA) Instant Live Web Updates
- Pushes updated React/JS/CSS assets straight to user devices in the background without requiring a full APK download or Google Play review.
- **Google Play Developer Policy Compliant**: Section 4.9 explicitly allows code running in a virtual machine or WebView container as long as the app's core purpose is unchanged.
- Command:
  ```bash
  npm run build && npx cap copy android
  ```

### Channel 2: Google Play Store Releases & In-App Update Gate
- Packages:
  - **Customer App**: `com.mandiminutes.app`
  - **Rider Fleet App**: `com.mandiminutes.rider`
- In-App Update Gate:
  - **Mandatory Update (`isCritical: true`)**: When the user's installed version is less than `min_supported_version`, a full-screen blocking modal appears preventing further actions until the app is updated via Google Play or direct APK.
  - **Optional Update (`isCritical: false`)**: When a new version is available, a dismissible top announcement banner notifies the user with release notes.
- Remote Firestore Configuration (`app_config/version`):
  ```json
  {
    "min_supported_version": "1.0.0",
    "latest_version": "1.1.0",
    "rider_min_version": "1.0.0",
    "rider_latest_version": "1.1.0",
    "rider_apk_url": "https://mandiminutes.com/download/mandi-rider.apk",
    "changelog": [
      "Faster checkout & UPI payment validation",
      "Real-time driver location map tracking",
      "Fresh discounts for local Kiranas"
    ]
  }
  ```
- **Admin Control Panel**: Navigate to `/admin?tab=releases` to inspect live channel status, run remote sync, or test mandatory/optional update gate prompts directly in-session.
- **Customer Trigger**: Shoppers can check for updates manually on `/profile` via the interactive version footer.

---

## 🔥 Firebase Setup & Production Rules

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Firestore Database** in production mode.
3. Enable **Authentication** (Email/Password, Phone OTP with reCAPTCHA).
4. Deploy Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Deploy Cloud Functions:
   ```bash
   cd functions && npm install
   firebase deploy --only functions
   ```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server on `http://localhost:5173`. |
| `npm run build` | Builds optimized production static web bundle into `/dist`. |
| `npm run preview` | Previews the production build locally. |
| `npm run lint` | Runs Oxlint for code quality and syntax validation. |
| `npm test` | Runs **150 Vitest unit tests across 16 suites** (settlements, delivery slots, in-app updates, pricing, auth, maps, tutorial). |
| `npm run cap:sync` | Builds web assets and synchronizes Capacitor Android plugins & assets. |
| `npm run build:apk` | Complete production pipeline: builds web, syncs Capacitor, outputs release APK. |
| `npm run build:apk:debug` | Debug pipeline: builds web, syncs Capacitor, outputs debug APK. |
| `npm run build:apk:rider` | Builds production release APK for the dedicated Mandi Rider app. |
| `npm run build:apk:rider:debug` | Builds debug APK for the dedicated Mandi Rider app. |

---

## 🚀 Production Deployment

### Web Hosting (Vercel)
Deploy with the preconfigured [vercel.json](vercel.json):
```bash
npx vercel --prod
```

### Web Hosting (Firebase Hosting)
Deploy with the preconfigured [firebase.json](firebase.json):
```bash
firebase deploy --only hosting
```

---

## 📁 Project Structure

```
mandi-minutes-web/
├── android/                         # Android Studio & Gradle project (Capacitor)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml  # Android permissions, queries & intent filters
│   │   │   ├── java/.../MainActivity.java # Native back-button handling
│   │   │   └── res/                 # Custom app icons (mipmap-*) & splash drawables
│   │   └── build.gradle
│   └── build.gradle
├── functions/                       # Secure Firebase Cloud Functions (pricing, orders, Razorpay)
├── public/                          # Brand logos, icons, PWA manifest, service worker
│   ├── brand-logo.png               # Official Mandi Minutes logo
│   ├── logo-mark.png                # Brand favicon and icon mark
│   ├── favicon.svg / favicon.png
│   ├── manifest.json
│   └── robots.txt
├── scripts/
│   └── build-rider-apk.js           # Automated pipeline for Rider APK packaging
├── src/
│   ├── components/
│   │   ├── common/                  # Navbar, BottomNav, StoreCard, ProductCard, LocationModal, AddressMapPicker, AppTutorialModal, AppUpdateModal
│   │   ├── tracking/                # RiderTrackerMap (Leaflet GPS visualization)
│   │   └── vendor/                  # ProductModal, InvoiceModal, MasterCatalogModal, LocalSaleModal
│   ├── config/                      # Firebase client configuration & database seeders
│   ├── context/                     # React contexts (Auth, Cart, Location, Data, Theme)
│   ├── data/                        # Initial store, category, and Virar coordinate datasets
│   ├── pages/                       # Route views (HomePage, MobileAppHome, StorePage, AdminPanel, VendorDashboard, RiderPortal, PolicyPages...)
│   ├── services/                    # Order service & transaction handlers
│   ├── store/                       # Zustand global stores (useDataStore, useCartStore, useLocationStore, useTutorialStore, useAppUpdateStore)
│   ├── utils/                       # Search, debounce, audio alerts, platform, deliverySlots, appVersion helpers
│   ├── i18n.js                      # Trilingual translation resources (EN, HI, MR)
│   ├── App.jsx                      # Route definitions, protected route gates, layout shell
│   └── index.css                    # Tailwind CSS directives, claymorphism tokens, View Transitions
├── tests/                           # 16 Vitest automated test suites (150 tests)
│   ├── adminSettlements.test.js     # Monthly settlements and vendor payout logic tests
│   ├── addressMapPicker.test.js     # Map pin address picker tests
│   ├── appUpdate.test.js            # In-app update gate & version check tests
│   ├── audioAlert.test.js           # Vendor order audio chime tests
│   ├── delivery.test.js             # Delivery fee, slot, and COD calculations
│   ├── localSale.test.js            # In-store counter POS inventory deduction tests
│   ├── locationModal.test.js        # Location selector modal tests
│   ├── mapRoute.test.js             # GPS routing tests
│   ├── passwordReset.test.js        # Password reset flow tests
│   ├── phoneAuth.test.js            # Phone OTP and account linking tests
│   ├── pricing.test.js              # Pricing and discount validation tests
│   ├── riderRedirect.test.js        # Rider portal redirect gate tests
│   ├── safeArea.test.js             # Mobile safe area inset tests
│   ├── searchProducts.test.js       # Live search and debounce tests
│   ├── tutorial.test.js             # App tutorial walkthrough tests
│   └── userAvatar.test.js           # User profile avatar & label tests
├── capacitor.config.json            # Customer app ID, scheme, and splash configuration
├── capacitor.rider.json             # Rider app ID and packaging configuration
├── tailwind.config.js               # Mandi Minutes custom color palette and typography
├── vite.config.js                   # Build configuration and manual chunk splitting
└── package.json
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

© 2026 Mandi Minutes. Built with ❤️ for neighborhood Kiranas.
