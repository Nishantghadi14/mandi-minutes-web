# 🛒 Mandi Minutes — Hyperlocal Kirana Delivery (Web & Android)

[![React 19](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite)](https://vite.dev/)
[![Capacitor Android](https://img.shields.io/badge/Capacitor-Android_8.5-119EFF?logo=capacitor)](https://capacitorjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> ⚡ **Mandi Minutes** connects neighborhood Kirana stores with local households across Virar, Bolinj, Nallasopara, and Vasai (Palghar District, Maharashtra) for lightning-fast grocery delivery in **10–15 minutes**.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Multi-Role Architecture](#-multi-role-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Android APK (Native Mobile App)](#-android-apk-native-mobile-app)
- [Firebase Setup](#-firebase-setup)
- [Available Scripts](#-available-scripts)
- [Project Structure](#-project-structure)
- [Contributing & License](#-contributing--license)

---

## 🚀 Key Features

- 📍 **Hyperlocal Pincode Engine** — Dynamic detection and store filtering for Virar West (`401305`), Virar East (`401303`), Nallasopara (`401301`), Arnala (`401309`), and Vasai (`401208`, `401209`).
- 🏪 **Store Discovery with Live Stock** — In-stock previews on Kirana store cards showing available products and pricing at a glance.
- 🎲 **Randomized Local Vendor Showcase** — Dynamic *"Products in (Location)"* section featuring randomized staple items sold by verified local vendors, complete with store tags, category filters, and an interactive **Shuffle** button.
- 💳 **Direct UPI Payments & COD** — Native intent triggers for Google Pay, PhonePe, Paytm, and BHIM (`upi://pay`), interactive dynamic QR codes, and Cash on Delivery.
- 🗺️ **Live Rider GPS Tracking** — Real-time interactive Leaflet map tracking the rider’s route from Kirana store to customer doorstep.
- 🌐 **Trilingual Localization (i18n)** — Full native support for **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)**.
- 📱 **Cross-Platform Native Experience** — High-performance Web App (PWA) + fully packaged **Android APK** with native splash screen, custom adaptive launcher icon, and hardware back-button navigation.

---

## 👥 Multi-Role Architecture

| Role | Portal / Route | Capabilities |
|---|---|---|
| **Customer** | `/` & `/store/:id` | Browse local Kiranas, add items to cart, order via UPI/COD, track rider live, manage profile & address book. |
| **Vendor** | `/vendor-dashboard` | Store inventory management, product pricing/stock toggle, incoming order acceptance, real-time analytics. |
| **Vendor Onboarding** | `/vendor-onboarding` | Free Kirana store self-registration, license/address verification, instant catalogue initialization. |
| **Rider** | `/rider-portal` | Accept delivery runs, broadcast real-time GPS coordinates, call customers/stores, update delivery status. |
| **Admin** | `/admin-panel` | Master control panel: manage approved/pending stores, review tickets, view system-wide revenue & orders. |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Core** | React 19, React Router v7, Vite 8 |
| **Mobile Runtime** | Capacitor 8 (Android Native Container) |
| **State Management** | Zustand (persistent & real-time stores) + React Context |
| **Styling & Design** | Tailwind CSS 3, Vanilla CSS, Lucide React Icons |
| **Backend & Database** | Firebase Firestore (Real-Time NoSQL), Firebase Auth, Cloud Functions |
| **Push Notifications** | Firebase Cloud Messaging (FCM) + Service Workers |
| **Maps & Geo** | Leaflet, React Leaflet (OpenStreetMap / CartoDB tiles) |
| **Data Visualization** | Recharts (Vendor & Admin performance analytics) |
| **Quality & Tests** | Oxlint (ultra-fast linting), Vitest |

---

## 📋 Prerequisites

- **Node.js**: `18.0.0` or higher ([Download](https://nodejs.org/))
- **npm**: `9.0.0` or higher (bundled with Node.js)
- **Java JDK**: 17 or 21 (required only for building the Android APK)
- **Android SDK / Android Studio**: (required only for building the Android APK)
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
Create a `.env` or `.env.local` file in the root directory (see [Environment Variables](#-environment-variables) below).

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
```

> **Note:** If Firebase credentials are not provided, the application automatically runs in demo mode using cached and locally seeded catalogue data.

---

## 📱 Android APK (Native Mobile App)

Mandi Minutes is packaged as a standalone Android application using **Capacitor**.

### Android Configurations Included:
- **Branding Assets**: High-resolution 3D emerald green grocery bag launcher icon generated across all densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) including adaptive foreground and round icons.
- **Native Splash Screen**: Deep emerald black (`#0D1410`) splash screen with glowing Mandi Minutes branding and smooth 1.5s auto-hide transition.
- **Native Hardware Back Navigation**: [`MainActivity.java`](android/app/src/main/java/com/mandiminutes/app/MainActivity.java) overrides `onBackPressed()` so pressing the Android back button walks back through app navigation history rather than closing the app.
- **Android 11+ `<queries>` & Permissions**: Declared in [`AndroidManifest.xml`](android/app/src/main/AndroidManifest.xml) for UPI payment intents (`upi://pay`), phone dialer (`tel:`), GPS (`ACCESS_FINE_LOCATION`), and Android 13+ push notifications (`POST_NOTIFICATIONS`).

### Building the APK:

```bash
# Option A: One-command build (compiles web assets, syncs Capacitor, builds APK)
npm run build:apk

# Option B: Manual step-by-step build
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug && cd ..
```

The compiled APK will be output directly to the project root:
```
mandi-minutes.apk
```
You can transfer and install `mandi-minutes.apk` on any Android smartphone.

---

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Firestore Database** in production mode.
3. Enable **Authentication** (Email/Password, Phone).
4. Deploy Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. *(Optional)* Deploy Cloud Functions:
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
| `npm test` | Runs the Vitest test suite. |
| `npm run cap:sync` | Builds web assets and synchronizes Capacitor Android plugins & assets. |
| `npm run build:apk` | Complete build pipeline: compiles web, syncs Capacitor, and outputs `mandi-minutes.apk`. |

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
├── public/                          # Static assets, PWA manifest, service worker
│   ├── products/                    # Product imagery
│   ├── favicon.svg
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── common/                  # Navbar, StoreCard, ProductCard, BottomNav, CartDrawer
│   │   ├── tracking/                # RiderTrackerMap (Leaflet GPS visualization)
│   │   └── vendor/                  # Vendor dashboard management components
│   ├── config/                      # Firebase client configuration & database seeders
│   ├── context/                     # React contexts (Auth, Cart, Location, Data, Theme)
│   ├── data/                        # Initial store, category, and Virar coordinate datasets
│   ├── pages/                       # Route views (HomePage, StorePage, SearchPage, Checkouts...)
│   ├── store/                       # Zustand global stores (useDataStore, useCartStore, useLocationStore)
│   ├── utils/                       # Search, filter, debounce, and coordinate helpers
│   ├── i18n.js                      # Trilingual translation resources (EN, HI, MR)
│   ├── App.jsx                      # Route definitions and layout shell
│   └── index.css                    # Tailwind CSS directives and custom design tokens
├── capacitor.config.json            # Capacitor app ID, scheme, and splash configuration
├── tailwind.config.js               # Mandi Minutes custom color palette and typography
├── vite.config.js                   # Build configuration and manual chunk splitting
├── mandi-minutes.apk                # Ready-to-install Android Debug APK
└── package.json
```

---

## 🌐 Remote Testing via Cloudflare Tunnel

To test the web app or mobile payments on physical mobile devices without local network limitations:

```bash
cloudflared tunnel --url http://localhost:5173
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

© 2026 Mandi Minutes. Built with ❤️ for neighborhood Kiranas.
