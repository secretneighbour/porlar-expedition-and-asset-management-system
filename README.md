# 🏔️ Polar Expedition & Asset Management System

[![npm version](https://img.shields.io/npm/v/polar-expedition-asset-management.svg?style=flat-square)](https://www.npmjs.com/package/polar-expedition-asset-management)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

A mission-critical tactical operations console and real-time telemetry workstation engineered for Antarctic and Arctic expeditions, high-latitude research outposts, heavy traverse crawlers, extreme-cold aviation, and field Mayday distress coordination.

The system runs seamlessly across all expedition targets using **Tauri 2**:
* 🌐 **Web Application**: High-availability multi-operator station hub served via Express and Vite.
* 🐧 **Linux Desktop**: Native 60 FPS workstation binary, portable AppImage, and distribution packaging for **Arch Linux** (`makepkg -si`) and **Debian / Ubuntu** (`.deb`).
* 🪟 **Windows Desktop**: Native x86_64 installer (`.msi` / NSIS) for field Toughbooks and command centers.
* 🍎 **macOS Desktop**: Native DMG / `.app` bundle for research lab workstations (Apple Silicon & Intel).
* 📱 **Android Handhelds & Tablets**: Independent native APK / AAB deployment for field researchers and crawler operators.
* 🍏 **iOS Handhelds**: Native deployment when compiled in an Apple development environment.

> [!IMPORTANT]
> **React Frontend as Single Source of Truth**: The existing tactical React/Vite/Tailwind frontend remains the single source of truth across all platforms. Tauri 2 provides a lightweight native application shell with Rust OS bridges (offline state caching, secure storage, native notifications, and pre-boot POST diagnostics) without modifying or fragmenting the operational UI.

---

## 📋 Table of Contents

- [🚀 Quick Start](#-quick-start)
  - [🛠️ Troubleshooting NPM `EALLOWSCRIPTS` / `--allow-scripts` Error](#️-troubleshooting-npm-eallowscripts---allow-scripts-error)
- [📱 Cross-Platform Architecture (Tauri 2 Native Shell)](#-cross-platform-architecture-tauri-2-native-shell)
  - [🖥️ Linux Desktop Packaging (Arch Linux & Debian / Ubuntu)](#️-linux-desktop-packaging-arch-linux--debian--ubuntu)
  - [📱 Android & iOS Mobile Deployment](#-android--ios-mobile-deployment)
  - [🪟 Windows & 🍎 macOS Desktop Builds](#-windows---macos-desktop-builds)
- [🌐 Multi-Device Expedition Network Topology](#-multi-device-expedition-network-topology)
- [💾 Offline-First Operation & Telemetry Distinction](#-offline-first-operation--telemetry-distinction)
- [🛰️ Operations Gateway & Backend URL Configuration](#️-operations-gateway--backend-url-configuration)
- [🎨 Unified Polar Operations Design System & Frontend Architecture](#-unified-polar-operations-design-system--frontend-architecture)
  - [Motion & Responsive Console Polish](#motion--responsive-console-polish)
- [🔐 Polar Ops Console Authentication & Role-Based Access Control](#-polar-ops-console-authentication--role-based-access-control)
- [✨ Key Operational Views & Features](#-key-operational-views--features)
- [🗺️ Polar GIS Command Workstation (SCAR ADD v7.4 & 100% Google-Free Cartography)](#️-polar-gis-command-workstation-scar-add-v74--100-google-free-cartography)
  - [🌍 Scientific Antarctic Digital Database (ADD v7.4) Integration](#1--scientific-antarctic-digital-database-add-v74-integration)
  - [🛰️ Polar GNSS Satellite Geometry & Dilution of Precision Compensation](#2-️-polar-gnss-satellite-geometry--dilution-of-precision-compensation)
  - [📍 Waypoint Progressive Disclosure & Dynamic 60 FPS Asset Tracking](#3--waypoint-progressive-disclosure--dynamic-60-fps-asset-tracking)
  - [💾 Client-Side Caching & Offline Vector Resilience](#4--client-side-caching--offline-vector-resilience)
- [🔥 Sub-Zero Danger Zone Heatmap & Polar GIS](#-sub-zero-danger-zone-heatmap--polar-gis)
- [🛠️ AI Predictive Maintenance System (-50°C Cold-Soak Modeling)](#️-ai-predictive-maintenance-system--50c-cold-soak-modeling)
- [⚡ Automated S.A.R. (Search and Rescue) Dispatch (Zero-Click AI Response)](#-automated-sar-search-and-rescue-dispatch-zero-click-ai-response)
  - [🚨 1-Tap Instant Mayday SOS Broadcast & Emergency Triage](#-1-tap-instant-mayday-sos-broadcast--emergency-triage)
- [❄️ Dynamic Weather-Based Inventory Consumption (Blizzard Heating Model)](#️-dynamic-weather-based-inventory-consumption-blizzard-heating-model)
- [🛰️ Smart Route Optimization (Satellite Computer Vision Pathfinding)](#️-smart-route-optimization-satellite-computer-vision-pathfinding)
- [⚡ API Key Optimization & Resource Conservation Engine](#-api-key-optimization--resource-conservation-engine)
- [🤖 AI Action Logs (Live Streaming Autonomous Action Feed)](#-ai-action-logs-live-streaming-autonomous-action-feed)
- [⚡ Auto-Resolved by AI Alert System (Self-Healing Autonomous Operations)](#-auto-resolved-by-ai-alert-system-self-healing-autonomous-operations)
- [🧹 AI Automated Work Clearing & Forensic Action Logging](#-ai-automated-work-clearing--forensic-action-logging)
- [🖥️ Pre-Boot System Check (Terminal-Style Hardware & Telemetry POST)](#️-pre-boot-system-check-terminal-style-hardware--telemetry-post)
  - [🚨 Zero-Scroll Active Sensor Fault & Cryo-Remediation Banner](#-zero-scroll-active-sensor-fault--cryo-remediation-banner)
- [🚛 Fleet Telemetry & Detailed Operational Analytics](#-fleet-telemetry--detailed-operational-analytics)
- [🎮 Mission Simulation & Operator Training Mode](#-mission-simulation--operator-training-mode)
- [📍 Waypoint Tracing & Live Route Telemetry on Map](#-waypoint-tracing--live-route-telemetry-on-map)
  - [🛡️ Defensive Waypoint Normalization & Robustness Architecture](#️-8-defensive-waypoint-normalization--robustness-architecture)
- [🤖 Gemini-Powered Waypoint Route Optimization](#-gemini-powered-waypoint-route-optimization)
  - [🧭 Polar A* Tactical Route Engine (Weighted Cost Function + Gemini 3.8 Flash)](#-polar-a-tactical-route-engine-weighted-cost-function--gemini-38-flash)
- [🧩 Comprehensive Modules & Dependencies Reference](#-comprehensive-modules--dependencies-reference)
- [📱 Connecting Mobile Phones & Field Devices](#-connecting-mobile-phones--field-devices)
- [🌐 Exposing Field Consoles over Public Internet (ngrok Usage)](#-exposing-field-consoles-over-public-internet-ngrok-usage)
- [📡 Connecting External Hardware GPS Modules](#-connecting-external-hardware-gps-modules)
- [🛠️ NPM Scripts & CLI Usage](#️-npm-scripts--cli-usage)
- [🔑 Environment Configuration](#-environment-configuration)
- [🚨 Troubleshooting & Diagnostics Guide](#-troubleshooting--diagnostics-guide)
- [📄 License](#-license)

---

## 🚀 Quick Start

Launch the complete polar operations console instantly with zero local installation using `npx`:

```bash
npx polar-expedition-asset-management
```

Or clone and start locally:

```bash
npm install
npm run dev
```

Access the console in your browser at `http://localhost:3000`.

---

### 🛠️ Troubleshooting NPM `EALLOWSCRIPTS` / `--allow-scripts` Error

If you encounter an error when executing `npm install --allow-scripts`:

```text
npm error code EALLOWSCRIPTS
npm error --allow-scripts is not allowed in project-scoped installs.
npm error Add the entries to the "allowScripts" field in package.json, or to .npmrc, instead.
```

#### **Why this occurs:**
In modern versions of NPM (NPM v10+ / Node.js v22+), `--allow-scripts` is no longer supported as a command-line flag during project-level `npm install`. Passing `--allow-scripts` triggers `code EALLOWSCRIPTS` or `code EUNKNOWNCONFIG`.

#### **How to resolve:**
1. **Simply run `npm install` without flags**:
   ```bash
   npm install
   ```
2. **Pre-configured `.npmrc` file**:
   This repository includes a root `.npmrc` file with:
   ```ini
   ignore-scripts=false
   ```
   This configuration ensures NPM automatically permits standard lifecycle scripts (such as `esbuild` or `vite` binary setups) during installation without requiring non-standard CLI flags.

---

## 📱 Cross-Platform Architecture (Tauri 2 Native Shell)

The Polar Expedition & Asset Management System has been architected to run seamlessly as a native application across all tactical platforms without compromising the existing web deployment:

```text
┌────────────────────────────────────────────────────────────────────────┐
│             Tactical React 18 + TypeScript + Tailwind Frontend         │
│          (Single Source of Truth: GIS Map, Telemetry, SAR, AI)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                               Vite 6                                   │
│           (Dual Target: Static Web Asset Bundle & Server Build)        │
└──────────────┬────────────────────────────────────────────┬────────────┘
               │ Web Deployment                             │ Native Shell
               ▼                                            ▼
┌───────────────────────────────┐           ┌────────────────────────────┐
│      Express Web Server       │           │          Tauri 2           │
│   (Host: 0.0.0.0, Port 3000)  │           │   (IPC & Window Manager)   │
└───────────────────────────────┘           └──────────────┬─────────────┘
                                                           │
                                                           ▼
                                            ┌────────────────────────────┐
                                            │      Rust Native Layer     │
                                            │ (Storage, OS, Diags, POST) │
                                            └──────────────┬─────────────┘
                                                           │
               ┌─────────────────────┬─────────────────────┼─────────────────────┐
               ▼                     ▼                     ▼                     ▼
        🐧 Linux Desktop      🪟 Windows Desktop    🍎 macOS Desktop      📱 Android / iOS
        • Arch Linux          • x86_64 Installer    • Apple Silicon/Intel • Android APK/AAB
        • Debian / Ubuntu     • NSIS / MSI          • DMG / .app          • iOS App (Xcode)
        • Portable AppImage
```

### 🧩 Separation of Responsibilities

| Subsystem | Responsibility | Runtime Environment |
| :--- | :--- | :--- |
| **React Frontend** | UI rendering, Leaflet Polar GIS cartography, dynamic state management, Waypoint Studio, SAR dispatch controls, and audio telemetry synthesizer. | Web Browser / WebView |
| **Tauri & Rust Native Layer** | Native local storage snapshots (`save_offline_snapshot`), secure local offline cache dir (`get_offline_cache_dir`), system POST diagnostics (`run_native_diagnostics`), native OS metadata (`get_native_platform_info`), and desktop window management. | Client Native OS (C/Rust) |
| **Express Backend** | Authoritative multi-user authentication (`/api/auth/login`), shared expedition & asset records (`polar-database.json`), real-time WebSocket telemetry distribution, and server-side Gemini 3.8 Flash execution (`/api/ai/analyze-recon`). | Expedition Base Station / Server |
| **Shared Database Layer** | ACID persistence of mission logs, fleet telemetry, station headcounts, inventory reserves, and emergency distress beacons. Remote clients NEVER run isolated local database instances. | Backend Server Host |

---

## 🖥️ Linux Desktop Packaging (Arch Linux & Debian / Ubuntu)

The Linux desktop application is fully configured and packaged for both **Arch-based** and **Debian/Ubuntu-based** Linux ecosystems, as well as a universal distribution-independent **AppImage**.

### 1. 🏹 Arch Linux Support (Native Binary & PKGBUILD)

Arch-based distributions (Arch Linux, EndeavourOS, Manjaro) are first-class targets:

#### **Build Prerequisites for Arch Linux:**
```bash
sudo pacman -S --needed base-devel rust cargo webkit2gtk-4.1 gtk3 libayatana-appindicator openssl
```

#### **Building & Running on Arch Linux:**
```bash
# Clone the repository
git clone https://github.com/secretneighbour/porlar-expedition-and-asset-management-system.git
cd porlar-expedition-and-asset-management-system

# Install NPM dependencies
npm install

# Run native desktop app in development with live hot-reload
npm run tauri:dev

# Build optimized production native binary
npm run tauri:build
```
The compiled 60 FPS native ELF executable is generated at:
`src-tauri/target/release/polaris-ops`

#### **Arch Linux Native Package Installation via `PKGBUILD`:**
A fully compliant Arch Linux [`PKGBUILD`](./PKGBUILD) and XDG desktop entry [`polaris-ops.desktop`](./polaris-ops.desktop) are provided in the repository root:

```bash
# Build and install the system-wide Arch package
makepkg -si
```
This installs:
- Executable to `/usr/bin/polaris-ops`
- Desktop launcher to `/usr/share/applications/polaris-ops.desktop`
- Tactical app icons to `/usr/share/icons/hicolor/...`
- Clean uninstallation via: `sudo pacman -R polaris-ops`

---

### 2. 🍥 Debian & Ubuntu Linux Support (`.deb` Package)

Debian-based distributions (Debian 12+, Ubuntu 22.04+, Linux Mint, Pop!_OS) can install the official Debian package.

#### **Build Prerequisites for Debian / Ubuntu:**
```bash
sudo apt update
sudo apt install -y build-essential curl wget file libssl-dev libgtk-3-dev \
  libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev
```

#### **Building the Debian Package:**
```bash
npm run tauri:build:deb
```
The Debian package is output to:
`src-tauri/target/release/bundle/deb/polaris-ops_1.0.0_amd64.deb`

#### **Installing on Debian / Ubuntu:**
```bash
sudo apt install ./src-tauri/target/release/bundle/deb/polaris-ops_1.0.0_amd64.deb
```
This registers the application in the system desktop application menu, provides high-resolution icons, and enables clean removal via:
```bash
sudo apt remove polaris-ops
```

---

### 3. 📦 Universal Linux AppImage

For portable, distribution-independent execution on any modern Linux distribution without installation:

#### **Building the AppImage:**
```bash
npm run tauri:build:appimage
```
The portable AppImage is generated at:
`src-tauri/target/release/bundle/appimage/polaris-ops_1.0.0_amd64.AppImage`

#### **Running the AppImage:**
```bash
chmod +x src-tauri/target/release/bundle/appimage/polaris-ops_1.0.0_amd64.AppImage
./src-tauri/target/release/bundle/appimage/polaris-ops_1.0.0_amd64.AppImage
```

---

### 4. ⚙️ Linux CPU Architecture

- **x86_64 / amd64**: Fully tested and supported natively on modern 64-bit Intel/AMD processors.
- **aarch64 / ARM64** (e.g., Raspberry Pi 5, ARM Linux Toughbooks): Supported by compiling natively on an ARM64 Linux host or using cross-compilation with `cargo build --target aarch64-unknown-linux-gnu`.

---

## 📱 Android & iOS Mobile Deployment

The system incorporates native mobile viewports and touch interactions without sacrificing tactical capabilities or splitting the React UI codebase.

```text
       Tactical Mobile Architecture
┌───────────────────────────────────────┐
│     Responsive Touch Viewport         │
│   (Collapsible Menus, Pinned HUD)     │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│          Tauri 2 Mobile Shell         │
│    (Android Activity / iOS AppView)   │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│  Mobile Native Capabilities Bridge    │
│  • High-Precision A-GPS / GNSS        │
│  • Haptic Distress & Klaxon Feedback  │
│  • App Lifecycle & Deep Offline Cache │
│  • Secure Session Credential Vault    │
└───────────────────────────────────────┘
```

### 1. 🤖 Android Deployment (APK & AAB)

#### **Android Build Prerequisites:**
1. **Java Development Kit (JDK 17+)**: Ensure `JAVA_HOME` is set.
2. **Android Studio & SDK**:
   - Android SDK Platform 34 (Android 14) or newer
   - Android SDK Build-Tools 34.0.0+
   - Android NDK 26.1.10909125 or newer
   - Set environment variables:
     ```bash
     export ANDROID_HOME="$HOME/Android/Sdk"
     export NDK_HOME="$ANDROID_HOME/ndk/<version>"
     ```
3. **Rust Android Targets**:
   ```bash
   rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
   ```

#### **Android Development & Build Commands:**
```bash
# Initialize Android project structure in src-tauri/gen/android
npm run tauri:android:init

# Launch in Android Emulator or attached USB Debugging device
npm run tauri:android:dev

# Pre-requisite for physical Android devices:
# Ensure VITE_API_BASE_URL=https://<your-subdomain>.ngrok-free.app is set in .env!
npm run build

# Build standalone signed/unsigned Release APK for ARM64 (modern phones)
npx tauri android build --apk --target aarch64

# Or build universal APK containing all architectures:
npm run tauri:android:build

# Build Google Play App Bundle (AAB) for distribution
npm run tauri:android:build -- --split-per-abi
```

#### **Output Artifacts:**
- **Debug APK**: `src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk`
- **Release APK**: `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`
- **App Bundle (AAB)**: `src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab`

#### **Release Signing Best Practices:**
Release keystores are **NEVER committed to git**. Configure your release keystore via environment variables or a local `keystore.properties` referenced in your local Gradle build:
```properties
storePassword=ENV_RELEASE_KEYSTORE_PASSWORD
keyPassword=ENV_RELEASE_KEY_PASSWORD
keyAlias=ENV_RELEASE_KEY_ALIAS
storeFile=/path/to/secure/field-release.keystore
```

---

### 2. 🍏 iOS Deployment (iPhone & iPad)

#### **iOS Build Prerequisites:**
- **macOS Host Machine**: Required by Apple Xcode toolchain.
- **Xcode 15+** with iOS 17+ SDK and Command Line Tools (`xcode-select --install`).
- **Rust iOS Targets**:
  ```bash
  rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
  ```

#### **iOS Development & Build Commands:**
```bash
# Initialize iOS Xcode workspace in src-tauri/gen/ios
npm run tauri:ios:init

# Run in iOS Simulator or attached iPhone/iPad
npm run tauri:ios:dev

# Build production iOS IPA bundle
npm run tauri:ios:build
```

---

## 🪟 Windows & 🍎 macOS Desktop Builds

### 1. 🪟 Windows Desktop Build
- **Prerequisites**: Windows 10/11, Visual Studio 2022 with C++ Build Tools ("Desktop development with C++"), and the WebView2 Evergreen Bootstrapper / Runtime.
- **Build Command**:
  ```powershell
  npm run tauri:build
  ```
- **Generated Artifacts**:
  - `src-tauri/target/release/bundle/msi/polaris-ops_1.0.0_x64_en-US.msi`
  - `src-tauri/target/release/bundle/nsis/polaris-ops_1.0.0_x64-setup.exe`

### 2. 🍎 macOS Desktop Build
- **Prerequisites**: macOS 13+ (Ventura, Sonoma, Sequoia), Xcode Command Line Tools, Rust with `x86_64-apple-darwin` and `aarch64-apple-darwin` targets.
- **Build Command**:
  ```bash
  npm run tauri:build
  ```
- **Generated Artifacts**:
  - `src-tauri/target/release/bundle/dmg/polaris-ops_1.0.0_x64.dmg` (Intel)
  - `src-tauri/target/release/bundle/dmg/polaris-ops_1.0.0_aarch64.dmg` (Apple Silicon M1/M2/M3/M4)

---

## 🌐 Multi-Device Expedition Network Topology

In an active polar expedition, workstations and handheld field terminals connect concurrently to the authoritative operations backend:

```text
              ┌── 🪟 Windows Field Toughbook (Commander Console)
              │
              ├── 🐧 Linux Workstation (Logistics & AWOS GIS Station)
              │
📱 Android ───┤
Tablet/Phone  │
              ├── 📱 Android / iOS Mobile (Field Traverse Operator)
              │
              └── 🌐 Chrome / Firefox Web Browser (Outpost Terminals)
                       │
                       ▼  HTTPS / WSS (Configurable API Base Gateway)
                ┌──────────────┐
                │ Polar Server │  (Host: 0.0.0.0:3000)
                │ Express + WS │  (Server-side Gemini AI & RBAC)
                └──────┬───────┘
                       │
                       ▼  ACID Storage Transactions
                ┌──────────────┐
                │ Shared DB    │  (data/polar-database.json)
                └──────────────┘
```

> [!WARNING]
> **No Distributed Database Fragmentation**: Installed mobile and desktop applications do **not** run their own local SQL/JSON database instances. All operational records (active waypoints, Mayday signals, inventory burn, rover telemetry) are synchronized centrally via the backend. Local client storage is used strictly for **offline-first snapshot caching**.

---

## 💾 Offline-First Operation & Telemetry Distinction

When conducting traverses deep across the Antarctic polar plateau, SATCOM links may experience extreme katabatic attenuation, solar flares, or total loss of signal.

The Polaris Ops Console maintains mission continuity with an **Offline-First Resilience Architecture**:

### 🛡️ State Classification & Distinct HUD Badges

The top navigation HUD features an active telemetry pill that explicitly reports operational state:

| Status Badge | Indicator Color | Meaning |
| :--- | :--- | :--- |
| **`LIVE TELEMETRY`** | 🟢 Emerald Glow | Active two-way WebSocket connection with authoritative backend; sub-second real-time telemetry streaming. |
| **`CACHED / OFFLINE`** | 🟠 Amber Warning | Network connection dropped; displaying cached operational snapshot. Local waypoint and mission edits are queued safely. |
| **`SIMULATED (ISOLATED)`** | 🟡 Pulsing Amber | Operator Training Mode enabled. Synthetic telemetry and manual crisis injects are strictly isolated from real database records. |
| **`RECONNECTING`** | 🟡 Fast Pulse Yellow | Network link re-establishing; exponential backoff handshake underway with operations gateway. |

### 📦 Offline Capabilities
- **Local Snapshot Cache**: Automatically snapshots the latest mission progress, waypoint coordinates, fleet positions, AWOS weather readings, and danger zones to local persistent storage (`save_offline_snapshot` in Tauri / `localStorage` in browser).
- **Offline Waypoint Studio**: Plan, edit, and step through sequential waypoints while offline.
- **Offline GIS Map**: Basemap vector tiles and Antarctic coastline features remain fully navigable from client cache.
- **Deterministic Route Fallback**: If Gemini AI is unreachable due to network loss, the system automatically falls back to the deterministic A* Polar routing algorithm without crashing or fabricating hallucinations.

---

## 🛰️ Operations Gateway & Backend URL Configuration

To eliminate hardcoded `localhost:3000` assumptions across deployed Tauri mobile APKs, desktop executables, and web clients, the application utilizes a centralized **Operations Gateway Configuration Engine** (`src/config/api.ts`):

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        src/config/api.ts                               │
│              (Single Source of Truth for API & WS Base)                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
📱 Android / iOS            🐧 Linux / 🪟 Windows        🌐 Web Browser
VITE_API_BASE_URL           VITE_API_BASE_URL            Relative /api or proxy
(HTTPS ngrok / Gateway)     (LAN / Remote / Localhost)   (.env.development)
```

### 1. Centralized Configuration (`src/config/api.ts`)
The application defines a single, validated API base URL:
```typescript
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
```
- **Automatic ngrok Interstitial Bypass**: API requests through ngrok tunnels automatically inject the `ngrok-skip-browser-warning: 69420` (and `true`) header and persistent cookie across all fetch requests (`apiFetch` and global `window.fetch` interceptor) to bypass ngrok's free-tier HTML warning page (`ERR_NGROK_6024`).
- **Resolving 502 Bad Gateway**: If ngrok outputs `502 Bad Gateway`, the backend server (`npm run dev`) is not running on port 3000. Ensure `npm run dev` is active alongside ngrok.

### 2. Android Phone Connectivity via ngrok HTTPS Tunnel (Step-by-Step)

When running the backend on your development computer and testing the native Android APK on a physical phone:

#### **Step 1: Start your backend server**
```bash
npm run dev
# Server listens on http://localhost:3000 (and 0.0.0.0:3000)
```

#### **Step 2: Start an ngrok HTTPS tunnel**
```bash
ngrok http 3000
```
ngrok will display an active HTTPS forwarding address, for example:
```text
Forwarding   https://a1b2-34-56-78-90.ngrok-free.app -> http://localhost:3000
```

#### **Step 3: Copy the HTTPS ngrok URL into `.env`**
In the root `.env` file, set `VITE_API_BASE_URL`:
```env
VITE_API_BASE_URL=https://a1b2-34-56-78-90.ngrok-free.app
```
*(Or set it inline during the build command without modifying files)*.

#### **Step 4: Build the Frontend & Compile the Android APK**
Because Vite environment variables are injected at build time, compile the frontend assets before bundling the native APK:
```bash
# 1. Compile React assets with the ngrok base URL injected
npm run build

# 2. Build the Android release APK (for target architecture, e.g. aarch64)
npx tauri android build --apk --target aarch64
# Or build universal APK:
npm run tauri:android:build
```

#### **Step 5: Install APK on Android Device**
```bash
adb install -r src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
```
The application will launch on your phone and communicate directly over HTTPS and WSS with your computer's backend!

---

### 3. Preserving Local Browser Development
For normal machine-local browser development, `.env.development` provides:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_BACKEND_URL=http://localhost:3000
```
Vite automatically loads `.env.development` when running `npm run dev`, allowing you to develop locally without changing your production `.env` ngrok setting.

---

### 4. Runtime UI Configuration (Operations Gateway HUD Modal)
If your ngrok URL changes while the app is already installed on a phone or desktop, you do **not** need to recompile immediately!
1. Tap the **HardDrive / Gateway icon** in the top navigation bar.
2. Enter the new ngrok HTTPS URL in the **Gateway Base URL** field.
3. Tap **"Test Link"** to verify connection latency and database health.
4. Tap **"Apply"** to persist the new URL to `localStorage` (`polar_api_base_url`). All REST and WebSocket connections will immediately rebind.

---

## ✨ Key Operational Views & Features

| View | Capabilities |
| :--- | :--- |
| **🔐 Polar Ops Console Auth** | Glassmorphic tactical authentication portal with multi-radial lighting (`#7C3AED`, `#60A5FA`), role-based access for Researcher, Asset Management, and Transportation, server-side authorization enforcement, and forensic session auditing. |
| **📊 Polar Operations Command Center** | Information-dense polar operations dashboard featuring live mission progress, environmental telemetry, crawler fleet readiness, active AI recommendations, and embedded real-time AI action logs. |
| **🌡️ Live Operations & Environmental Telemetry** | Dedicated AWOS meteorological workstation: ambient temperature, katabatic wind velocity, barometric pressure, wind chill indexes, and real-time frostbite hazard calculations. |
| **🧭 Polar Map & Geospatial GIS** | Dual-projection cartography with Leaflet GIS and stereographic radar. Features progressive disclosure telemetry overlays, native spatial waypoint clustering (`⬡ N WPs`), real-time coordinate interpolation with cubic ease-out, dynamic rotating heading vector arrows, pulsing LETHAL auras, and dark glassmorphic HUD popups. |
| **🤖 AI Predictive Maintenance** | Pre-failure machine learning forecaster modeling severe polar cold-soak (-50°C) stress, elastomer vitrification curves, vibration harmonics (FFT), and parts pre-allocation to avert field breakdowns. |
| **🔥 Danger Zone Heatmap** | Dynamic multi-ring gradient heatmap overlay visualizing sub-zero cold pools, katabatic shear funnels, human survival windows (<12m lethal threshold), and Arctic diesel fuel waxing perimeters. |
| **📍 Waypoint Planner Studio** | Clean split-pane interface to pin, edit, and step sequential waypoints (+50km auto-advance). Features 1-click map pinning, instant card removals, and GPX navigation file exports. |
| **🛰️ Smart Route Optimization (Satellite CV)** | High-resolution satellite computer vision engine detecting shifting ice shelves and active crevasse hazards; recalculates daily safe bypass corridors for 28-ton heavy supply trucks and pushes waypoints directly to crawler GPS terminals. |
| **⚡ Automated S.A.R. Mission Console** | Autonomous Search & Rescue command workstation: upon distress beacon reception (e.g., Crevasse Fall), the engine automatically computes the nearest base, assesses weather flyability, and dispatches Drone Falcon-X and tracked extraction teams with zero human latency. |
| **❄️ Dynamic Weather Inventory Engine** | AI weather forecasting reader: predicts 3-day severe blizzard impact (-48°C, 95 km/h winds), models exponential heater burn surge (500L/day → 1,450L/day), dynamically elevates minimum stock safety buffer (4,000L → 8,500L), and dispatches early supply ship orders to MV Vasiliy Golovnin. |
| **🚨 Mayday Distress & Emergency Broadcast** | Streamlined emergency protocol featuring **1-Tap Instant SOS Broadcast** with zero-touch context packing (auto-injecting operator identity, node ID, station sector, live coordinates, active expedition, and ambient weather), live transmission status confirmation, resolve controls, and expandable SitRep filing. |
| **📻 Tactical Dispatch Logbook & AI Recon** | Tactical field communications logbook with automated Gemini 3.8 Flash reconnaissance evaluation, severity-based filtering, callsign tracking, and sector monitoring. |
| **⛺ Research Stations & Outposts Studio** | Comprehensive operational status, personnel headcounts, runway conditions, and emergency shelter capacities across McMurdo, Amundsen-Scott, Vostok, Concordia, Halley VI, Maitri, Bharati, Himadri, and custom outposts. |
| **🚛 Fleet & Asset Telemetry Workstation** | Re-homed operational analytics workstation featuring live fleet condition distribution (BarChart), monthly logistics expenditure (AreaChart), mission readiness KPIs, cold-soak bay telemetry, and SATCOM sync status. |
| **📦 Consumables & Depot Allocation** | Burn-rate tracking for Arctic diesel (F-34/JP-8), Jet-A1, rations, and medical kits, with re-homed Depot Consumption vs Safety Reserve Threshold analytics and automated resupply orders. |
| **📜 AI Action Logs Stream** | Real-time continuously scrolling telemetry and autonomous event feed (`[10:45 AM] AI: Rerouting supply convoy...`, `[10:47 AM] AI: Optimizing generator fuel...`) across polar stations with category filters and pause/resume controls. |
| **⚡ Auto-Resolved by AI Alerts** | Autonomous self-healing infrastructure giving historical and real-time alerts green `[⚡ Auto-Resolved by AI]` tags with complete forensic action logs and averted-impact explanations. |
| **🧹 AI Cleared Work Logs Archive** | Automated forensic task clearing engine with dual `ACTIVE TASK QUEUE` and `⚡ AI CLEARED WORK LOGS` views, one-click `AI AUTO-CLEAR ALL DONE`, and immutable verification logs. |
| **🖥️ Pre-Boot System Check (POST)** | Retro-tactical BIOS power-on self-test featuring a zero-scroll **Pinned Active Sensor Fault & Remediation Diagnostic Banner** that highlights affected sensors, subsystems, cold-soak vitrification risk, and AI auto-remediation state on fault injection. |
| **🎮 Mission Simulation & Training Sandbox** | Integrated tactical training mode allowing operators to simulate extreme crises (blizzards, crawler tensioner failures, SATCOM blackouts, crevasse fall Maydays). Features 5 pre-built scenarios, 11 manual inject triggers, 1x-25x playback controls, moving convoy map interpolation, 3-tier AI safety classification (OBSERVE, ASSIST, AUTONOMOUS), AAR evaluation reports, and strict isolation from production data. |
| **⚙️ Tactical Settings & Mission Configuration** | Dedicated operational preferences console: 4 calibrated sub-zero themes, hardware CRT cathodic scanlines emulation, tactical acoustic audio telemetry, SATCOM mesh node parameters, and direct POST / pairing launchers. |
| **📱 Multi-Device Pairing & GPS Sync** | QR-code automated mobile pairing, mesh heartbeat synchronization, and Web Serial / Web Geolocation external hardware GPS integration. |

---

## 🎨 Unified Polar Operations Design System & Frontend Architecture

The entire frontend of the Polar Expedition & Asset Management System has been unified under the design language established in `polar-login.html`. From the authentication portal through to the dashboards, operational maps, predictive maintenance studio, logistics pipelines, and administrative settings, every screen feels like a cohesive, futuristic operations console.

### 🔮 Core Color Palette
* **Primary Operations Purple**: `#7C3AED` (`--purple-700`)
* **Light Accent Purple**: `#A78BFA` (`--purple-400`)
* **Soft Polar Violet**: `#C4B5FD` (`--purple-300`)
* **Telemetry Cyan / Blue**: `#60A5FA` (`--blue-400`)
* **Ice Glaze Blue**: `#B9D9DC` (`--blue-200`)
* **Primary Console Text**: `#F5F3FF` (`--ink`)
* **Secondary Telemetry Text**: `#C9C1E8` (`--ink-soft`)
* **Deep Polar Night Gradients**: `#2E1065` &rarr; `#1E1240` &rarr; `#150B2E`
* **Semantic Status Accents**: Compatible emerald green (`#10B981` / `#5EEAB0`), amber warning (`#F59E0B`), and emergency rose red (`#EF4444` / `#F43F5E`).

### 🌌 Multi-Radial Ambient Lighting Background
The background system utilizes a fixed-canvas multi-radial lighting architecture:
```css
body {
  background:
    radial-gradient(circle at 10% 15%, rgba(167,139,250,0.30), transparent 45%),
    radial-gradient(circle at 90% 10%, rgba(96,165,250,0.20), transparent 40%),
    radial-gradient(circle at 50% 90%, rgba(196,181,253,0.18), transparent 45%),
    linear-gradient(160deg, #2E1065 0%, #1E1240 55%, #150B2E 100%);
  background-attachment: fixed;
}
```
All child cards, panels, and sidebars utilize translucent glass (`rgba(255, 255, 255, 0.05)` and `rgba(21, 11, 46, 0.84)`), allowing the ambient glowing gradients to shine through consistently.

### 💎 Glassmorphism Primitives
* **`GlassCard` / `StatCard`**: 20px-26px rounded corners, `backdrop-filter: blur(20px)`, subtle frosted border `rgba(196, 181, 253, 0.18)`, and soft deep drop shadow.
* **`GlassTable`**: Frosted table containers with subtle separators, sticky glass headers, and purple hover states.
* **`GlassModal`**: Centered floating glass dialogs with deep dark frosted backdrop, Space Grotesk headers, and gradient action buttons.
* **`Button System`**: Primary operations button with `linear-gradient(135deg, #7C3AED, #60A5FA)` and box-shadow `0 10px 25px rgba(124, 58, 237, 0.38)`, secondary glass buttons, and danger/success semantic buttons.
* **`Input System`**: Glass inputs with `rgba(255, 255, 255, 0.05)`, subtle border, and purple focus ring `0 0 0 3px rgba(124, 58, 237, 0.22)`.

### 🔤 Typography
* **Headings & Metric Displays**: `Space Grotesk` (weights 500, 600, 700) for logos, top headers, KPI values, and section titles.
* **Body, Forms & Controls**: `Inter` (weights 400, 500, 600, 700) for tables, forms, labels, status pills, and toolbars.

### Motion & Responsive Console Polish

The console shell uses the selected tactical theme consistently for its ambient grid, panels, borders, focus states, and primary actions. Workspace changes receive a short staged entrance and dashboard cards rise in sequence, making dense operational data easier to scan without delaying interaction. Motion automatically reduces to near-instant transitions when the operator enables an OS-level reduced-motion preference.

#### 📱 Full Mobile & Tablet Responsive Design (v2.0)

The entire application is now fully responsive across all device sizes, designed to feel like a native mobile app when used on Android handhelds via APK:

| Breakpoint | Range | Layout Behaviour |
|---|---|---|
| Small Phone | 320–374px | 1-col grids, full-width modals, touch-optimized 44px targets |
| Normal Phone | 375–430px | 2-col stat cards, collapsible sidebar drawer, compact topbar |
| Large Phone | 431–600px | 2–3 col grids, touch scroll tables |
| Tablet | 601–1024px | 2-col grids, slide-in sidebar (320px), tablet padding |
| Desktop | 1024px+ | Full layout: sticky sidebar, 4+ col grids, all panels visible |

**Key Responsive Features:**
- **Mobile Sidebar Drawer**: Hamburger menu button on tablets/phones opens a slide-in navigation drawer with a full-height backdrop overlay and 44px touch targets for all nav items.
- **Responsive Map**: Leaflet map height uses `clamp(300px, 55vh, 560px)` instead of fixed 560px — scales with viewport height on small screens.
- **Responsive Popover Menus**: Map toolbar overlays use `min(320px, calc(100vw-2rem))` to stay within viewport.
- **Route Panel**: AI route approval panel anchors `left: 0.5rem; right: 0.5rem` on phones instead of a fixed right-offset.
- **Table Components**: SharedUI Table has a dual-mode rendering — full desktop table or stacked card view on mobile (triggered at `md:hidden`).
- **Dashboard Stat Cards**: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7` instead of `auto-fit/minmax` to prevent sub-pixel columns on 320px screens.
- **Form Inputs**: `font-size: 16px` on mobile prevents iOS/Android auto-zoom; `min-height: 44px` for all interactive elements.
- **Safe Areas**: `env(safe-area-inset-*)` variables applied for notches, home bars, and rounded corners on modern Android devices.
- **Login Page**: `clamp()` padding and border-radius adapt the login card to all screen sizes without losing the premium glassmorphic aesthetic.
- **Landscape Support**: Compact topbar and reduced page-stage padding in landscape orientation on small screens.

#### 🔧 ngrok Browser Warning Fix

The Vite dev server now injects `ngrok-skip-browser-warning: 69420` as a response header on **all** assets (HTML, JS, CSS, WebSocket), bypassing the ngrok free-tier browser warning page on initial page load. The `apiFetch()` utility also injects this header on all API calls. The Express backend sets a persistent cookie (`ngrok-skip-browser-warning=69420; Max-Age=31536000`) for browser sessions.

### 🎛️ Tactical Themes, CRT Scanlines & Audio Feedback
* **Cyan Polar (Default)**: Deep space navy background (`#060B18`), cyan highlights (`#00F2FE`), and sky-blue telemetry accents (`#38BDF8`).
* **Phosphor Green**: Vintage P300 cathode-ray terminal green monochrome (`#22C55E`, `#040D08`), high-contrast tactical night vision mode.
* **Amber CRT**: 1980s polar radar cathode workstation amber monochrome (`#F59E0B`, `#0D0804`), optimized for high-glare blizzard whiteout viewing.
* **Polar Daylight**: Ultra-crisp high-contrast daylight mode (`#F8FAFC`, `#0F172A`), for outdoor snow glare operations.
* **CRT Scanlines Beam Overlay**: Toggleable cathode beam horizontal raster scanlines (`.crt-scanlines`) simulating authentic military CRT display tubes.
* **Web Audio API Acoustic Synthesizer**: Zero-asset procedural sound generation: tactical chirp on nav transitions, dual-tone emergency klaxon (880Hz-587Hz) on Mayday, and confirmation chimes on SAR dispatch.

### 🧭 7-Section Categorized Command Navigation
1. **COMMAND**: Dashboard, Live Operations (AWOS Met), Polar Map (Leaflet & Radar GIS).
2. **EXPEDITION**: Expeditions, Waypoint Planner Studio, Smart Routes, Transportation.
3. **ASSETS**: Fleet Telemetry, Maintenance, Consumables & Inventory, Shipments & Cargo, Research Stations & Outposts, Personnel Roster.
4. **AI OPERATIONS**: Predictive Maintenance (-50°C Simulator), Smart Route AI, Weather Inventory AI, AI Action Logs Stream, AI Alerts, AI Cleared Work Logs Archive.
5. **INCIDENTS**: Search & Rescue (S.A.R.) Mission Console, Alerts & Advisories, Emergency Dispatch Logbook.
6. **ANALYTICS**: Operational Reports, Financial Expenses, Forensic Audit Trail.
7. **SYSTEM**: Multi-Terminal Pairing, API Key / AI Resource Optimization, Pre-Boot POST Diagnostics, User Management, Console Settings.

### 🛡️ Attribution Preservation
Preserves credit to [wondermayank.in](https://wondermayank.in) on both the login screen and the operations console footer, complete with active runtime integrity validation.

---

## 🔐 Polar Ops Console Authentication & Role-Based Access Control

The login workstation has been engineered as a high-fidelity tactical entry console following the **Polar Ops Console** specification (`polar-login.html`):

### 🛡️ Role-Based Access & Server-Side Authorization
* **Researcher**: Maps to *Scientist / Team Member*, providing immediate access to field tasks, mission status, and live scientific observations.
* **Asset Management**: Maps to *Asset Manager*, routing station engineers directly to crawler health telemetry, -50°C cold-soak vitrification models, and maintenance schedules.
* **Transportation**: Maps to *Logistics Officer*, directing transport leads to fuel reserves, supply chain pipelines, and tracked convoys.
* **Zero-Trust Role Enforcement**: Authorization is strictly controlled on the backend (`POST /api/auth/login`). Attempting to log into a portal using an account without matching privileges returns `403 Forbidden` (`Role authorization mismatch`), preventing client-side role forgery.

### 🧪 Standard Demo Accounts
| Role | User ID | Password | Destination Route |
| :--- | :--- | :--- | :--- |
| **Researcher** | `RSC-0142` | `polar2026` | `dashboard` (Command Center) |
| **Asset Management** | `AST-0101` | `polar2026` | `assets` (Fleet Telemetry) |
| **Transportation** | `TRN-0301` | `polar2026` | `transportation` (Supply Convoys) |
| **Super Admin** | `ADM-0001` | `polar2026` | `dashboard` (Full System Access) |

### 🌐 Shared Multi-PC & Network Deployment Architecture
In polar base operations, multiple laptops, command displays, and ruggedized field mobile devices connect simultaneously to the **same authoritative operations backend**:

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ PC 1 (Commander)│       │ PC 2 (Logistics)│       │ Mobile Field Fix│
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │ HTTP/WebSocket (REST + JSON)
                                   ▼
                   ┌───────────────────────────────┐
                   │    Polar Express Backend      │
                   │    (Host: 0.0.0.0:3000)       │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │  Shared Polar Database Manager│
                   │ (./data/polar-database.json)  │
                   └───────────────────────────────┘
```

* **No Per-PC Database Fragmentation**: All client workstations authenticate against the shared database (`./data/polar-database.json` by default, or configured via `DATABASE_PATH`). Remote clients never require local database files.
* **Auto-Initialization & Demo Account Seeding**: On backend startup, the `PolarDatabaseManager` automatically validates the schema, initializes tables, and seeds all demo accounts with nominal permissions.
* **Cross-Origin Resource Sharing (CORS)**: Robust CORS middleware enables access from local network IPs (`192.168.*`, `10.*`), localhost, and satellite tunnels (ngrok, Cloudflare) with credential support.
* **Diagnostics & Health Endpoints**:
  - `GET /api/health`: Provides comprehensive health telemetry including database status (`connected`), active user count, and connected WebSocket terminals.
  - `GET /api/auth/diagnostics`: Developer & station admin endpoint verifying `backendStatus: "ONLINE"`, `database: "CONNECTED"`, and `authService: "READY"`.
* **Configurable Frontend Base URL**: Set `VITE_API_BASE_URL` in `.env` if hosting the frontend statically or on a separate port/host, or use the built-in Vite dev proxy configured for `/api` and `/ws`.

---

## 🗺️ Polar GIS Command Workstation (SCAR ADD v7.4 & Watermark-Free Tactical Cartography)

The Polaris Ops Command Console features a refactored, military-grade **Polar GIS Tactical Cartography Engine** (`PolarGISMap.tsx` / `RealMapView.tsx`). Commercial watermarked tiles have been completely eliminated with **watermark-free Esri World Dark Gray Canvas** and **Esri Polar World Imagery**, combined with vector cartography from the **Antarctic Digital Database (ADD v7.4)** hosted by the British Antarctic Survey (BAS) / Scientific Committee on Antarctic Research (SCAR).

The dashboard has been comprehensively transformed from a congested wall of toggles into a clean, scannable **Tactical Command HUD**:
* **Logical Control Popovers**: Map styles, hazard overlays, and sector jump presets are grouped into compact dropdowns.
* **Cohesive Tactical Dark Palette**: Neutral slate base (`#0B1120`, `#060B18`) with high-chroma red/amber reserved strictly for critical alerts and lethal sub-zero hazards.
* **Primary Map Focal Area**: Secondary controls tucked into popover menus or an expandable tools drawer, maximizing map viewport.
* **Rich Telemetry Empty State**: Replaced spinning placeholder with a stylized polar reticle, quick-inspect station cards, and active fleet summary.
* **Segmented Navigation Tabs**: Clean tactical segmented controls for Interactive Map, Vector Radar, and Smart Route CV.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🗺️ POLARIS OPS COMMAND CONSOLE // TACTICAL COMMAND HUD                                │
│ BASEMAP: ESRI DARK CANVAS [WATERMARK-FREE] // ADD VECTOR: [ONLINE - 12,631 FTS LOADED] │
│                                                                                        │
│ [🗺️ Map Style ▼] [📑 Overlays (4) ▼] [🧭 Jump ▼]  [🎯 Follow Asset] [✨ AI Route] [⚙️]  │
│                                                                                        │
│  ═══════ Cyan (#00ffff) Neon Polyline: SCAR ADD Medium-Res Coastline                   │
│  - - - - Amber (#ffaa00) Dashed Line: Ice-Shelf Grounding Lines                        │
│  ◆       Diamond Tactical Markers: Verified Scientific Outposts (McMurdo, Maitri...)   │
│                                                                                        │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ⚠ Polar GNSS: Vertical accuracy reduced; horizontal geometry dispersed             │ │
│ │ HDOP: 1.4 | VDOP: 4.8 (Elevated) | Satellites: 8 Locked | Kalman 2D Filter: ACTIVE  │ │
│ │ Contains data from the SCAR Antarctic Digital Database, accessed 2026 (CC BY 4.0)  │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. 🌍 Scientific Antarctic Digital Database (ADD v7.4) Integration
* **ArcGIS REST FeatureServer Endpoint**: Direct integration with the medium-resolution coastline service:
  `https://services.arcgis.com/b3fMqPOmotX6SV4k/arcgis/rest/services/add_coastline_medium_res_line_v7_4/FeatureServer/0/query`
* **Query & Pagination Strategy**:
  - Parametrized REST queries: `where=1=1`, `outFields=surface,FID`, `f=geojson`, `outSR=4326`, `resultRecordCount=2000`.
  - Offset-based streaming pagination (`resultOffset`) seamlessly retrieves large multi-segment polyline feature collections without browser memory exhaustion.
* **Vector Layer Visual Hierarchy**:
  - **Coastline (`surface IN ('rock coastline', 'ice coastline', 'ice shelf and front')`)**: Thin neon cyan boundary (`color: '#00ffff'`, `weight: 1.5`, `opacity: 0.8`).
  - **Ice-Shelf Grounding Lines (`surface = 'grounding line'`)**: High-contrast dashed amber lines (`color: '#ffaa00'`, `dashArray: '5, 5'`, `weight: 1.5`).
  - **Research Stations**: Tactical diamond markers with glassmorphic metadata popups displaying national sovereignty, scientific callsign, elevation MSL, and winter/summer personnel quotas.
* **Performance Gate**: ADD vector layers activate dynamically at zoom levels $> 2$, ensuring instantaneous initial canvas rendering.
* **Persistent Licensing**: CC BY 4.0 attribution displayed persistently in the console corner:
  > *"Contains data from the SCAR Antarctic Digital Database, accessed 2026 (CC BY 4.0)."*
  > Disclaimer: *"ADD data accuracy varies; suitable for overview, not for navigation."*

### 2. 🛰️ Polar GNSS Satellite Geometry & Dilution of Precision Compensation
* **The High-Latitude Orbital Problem**:
  GPS constellation orbits have an orbital inclination of approximately **55°**. In high polar latitudes (>65° to 90° S/N), satellites never traverse the zenith; they remain low on the horizon (**0° to 45° elevation**). This geometric clustering produces severe **Vertical Dilution of Precision (VDOP: 3.5 to 7.5+)** relative to Horizontal Dilution of Precision (HDOP: 1.2 to 2.4) and causes substantial point positioning horizontal jitter (40m–100m error in raw fixes).
* **UI Geometry Disclaimer Badge**:
  A dismissible, non-obtrusive amber warning badge alerts field commanders:
  `⚠ Polar GNSS: Vertical accuracy reduced; horizontal geometry dispersed.`
* **2D Kalman Filter Coordinate Smoothing**:
  Polaris implements a continuous 2D Kalman filter (`PolarKalmanFilter` in `useDynamicTracking.ts`) that attenuates measurement variance scaled against live HDOP. Raw GPS coordinate jitter is smoothed into steady, continuous trajectories.
* **Live Satellite Geometry Telemetry**:
  Clicking the warning badge opens a detailed polar orbit telemetry drawer displaying:
  - `GPS_QUALITY`: Good / Moderate / Poor based on satellite elevation and horizontal precision.
  - `HDOP` vs. `VDOP` disparity meters.
  - Locked satellite counts and average orbital elevation angles.

### 3. 📍 Waypoint Progressive Disclosure & Dynamic 60 FPS Asset Tracking
* **Progressive Disclosure Architecture**:
  Replaces oversized, map-obscuring legacy data boxes with sleek, minimal 14px tactical pips. Critical telemetry (ambient temperature, katabatic wind, feels-like cryo-factor, surface elevation) reveals smoothly on hover or click inside glassmorphic HUD popups (`backdrop-filter: blur(14px)`, `background: rgba(8, 14, 28, 0.88)`).
* **Spatial Waypoint Clustering**:
  Waypoint clusters (`clusterTacticalWaypoints`) aggregate nearby points into a glowing cluster bubble with count badges and pulse effects (`tactical-cluster-glow`) at lower zoom levels, expanding dynamically as the operator zooms in.
* **Pulsing Lethal Hazard Rings**:
  Waypoints entering a `LETHAL` or cryogenic emergency state pulse with a high-intensity red danger beacon (`tactical-pulse-lethal`), eliminating text clutter while immediately drawing command attention.
* **60 FPS Smooth Dynamic Marker Interpolation**:
  Asset and vehicle coordinates are animated via `requestAnimationFrame` using cubic ease-out interpolation over a 500ms smoothing window. Markers rotate dynamically to display their geodesic forward azimuth bearing arrow, shifting color from tactical cyan (`#06b6d4`, stationary) to active emerald (`#10b981`, moving).

### 4. 💾 Client-Side Caching & Offline Vector Resilience
* **Multi-Tier Fallback Hierarchy**:
  1. **In-Memory Cache**: Zero-latency runtime memory buffer.
  2. **LocalStorage / IndexedDB Persistence**: Vector layers are cached under `polaris_add_geojson_v7_4` with a 7-day TTL.
  3. **ArcGIS REST Live Query**: Fetches updated features when online.
  4. **Bundled Offline Vector Snapshot**: If field expeditions lose satellite internet, Polaris falls back instantly to the built-in tactical offline dataset.
* **Tactical "OFFLINE CACHE" Status**:
  An indicator badge in the attribution drawer displays whether vector data is streaming live from ArcGIS REST (`ADD REST LIVE`), persisted locally (`OFFLINE CACHE`), or operating on the bundled offline dataset.

---

## 🛠️ AI Predictive Maintenance System (-50°C Cold-Soak Modeling)

The Polaris Command Center features an integrated **Machine Learning Predictive Maintenance Engine** tailored for the brutal operational extremes of Arctic and Antarctic environments.

### 🔄 The Paradigm Shift: Reactive vs. Predictive Automation

* **The Problem with Legacy Dashboards (Reactive)**:
  Standard asset management systems wait for a machine to break down or log a trouble code in the field before updating the status to ⚠️ *"Needs Repair"*. In sub-zero polar conditions, this leads to catastrophic in-field stranding, requiring high-risk search-and-rescue or field retrieval teams.

* **What Polaris AI Predictive Automation Delivers (Proactive)**:
  By continuously analyzing real-time operating hours (e.g. 420h), ambient weather telemetry (-50°C cold-soak), and mechanical vibration harmonics, the ML model alerts station commanders **before** mechanical failure occurs:
  
  > 🤖 *"The Snowcat Tractor's engine belt might break by tomorrow, so maintain it today itself."*

### 🔬 Physical Cold-Soak Modeling & Elastomer Vitrification
* **The Physics of -50°C**: Standard chloroprene and EPDM synthetic rubber compounds undergo a glass transition ($T_g$) below **-42°C**, causing extreme brittleness and micro-cracking during cold starts.
* **FFT Vibration Frequency**: High-frequency harmonic vibration sensors detect micro-slippage and rib tearing at the tensioner pulley 24–48 hours before belt snapping.
* **Interactive Environmental Stress Simulator**: Slide the temperature slider between -10°C and -65°C in the **Maintenance Studio** to simulate how blizzard wind-chills exponentially increase failure probability from 14% up to 98%.

### 💰 Quantified Field Mission Savings
| Metric | Without AI (Field Breakdown) | With Polaris AI (Predictive Swap) | Mission Impact |
| :--- | :--- | :--- | :--- |
| **Field Downtime** | 48–72 Hours stranded on polar plateau | **0 Hours** (35-min scheduled shop swap) | **+48h Traverse Averted** |
| **Financial Cost** | $19,250 (Piston rescue crawler + fuel + emergency flight) | **$450** (Spare part from Maitri depot) | **+$18,500 Direct Savings** |
| **Personnel Safety** | High risk of hypothermia & frostbite in -50°C blizzard | **Zero Risk** (Replaced in heated base hangar) | **Maximum Survival Safeguard** |

### 🚀 Direct Execution & REST API Endpoints
* **One-Click Instant Execution**: The **"Maintain Today Itself"** action on the main dashboard instantly marks the service order as Completed, updates asset condition to *Excellent*, deducts 1 replacement belt from station inventory, and logs the mission savings in the immutable audit ledger.
* **Endpoints**:
  - `POST /api/ai/predictive-maintenance`: Evaluates fleet telemetry under specified temperature and operating conditions using Gemini 3.8 Flash.
  - `POST /api/ai/predictive-maintenance/execute`: Performs instant server-side preventive service execution, inventory deduction, and audit log generation.

---

## ⚡ Automated S.A.R. (Search and Rescue) Dispatch (Zero-Click AI Response)

Polaris features an autonomous **Zero-Click Search and Rescue (S.A.R.) Decision & Dispatch System** engineered specifically to eliminate human triage latency during life-threatening polar emergency scenarios (such as crevasse breaches or vehicle roll-overs in sub-zero whiteout storms).

### ⏱️ The Paradigm Shift: Manual Pop-up vs. Zero-Click Autonomous Dispatch

* **What it was (Legacy Manual Response)**:
  When an emergency distress beacon arrived (e.g., *"Crevasse Fall: Snowcat lead track broke through concealed snow bridge into 25m slot void"*), the system displayed a pop-up alert box waiting for a human station operator to notice the alarm, look up the nearest base on a map, check weather forecasts manually, select a rescue vehicle from a dropdown, and click the **"Acknowledge / Dispatch"** button. In -50°C temperatures where hypothermia sets in within minutes, this manual 15–30 minute human bottleneck is a critical hazard.

* **What AI Automation Delivers (Zero-Click Autonomous Response)**:
  The moment an emergency distress packet arrives (via satellite uplink or field mobile WebSocket), the AI engine acts in under **400 milliseconds** with **zero human clicks required**:
  1. 📍 **Calculates the Nearest Base**: Instantly executes geodesic Haversine range calculations across all operational polar research stations (e.g., McMurdo, Amundsen-Scott, Vostok, Maitri) to determine the exact nearest base.
  2. ❄️ **Assesses Real-Time Weather**: Analyzes Automated Weather Observing System (AWOS) telemetry at that base (temperature, katabatic wind speeds, visibility ceiling) to verify flight viability corridors.
  3. 🚁 **Dispatches Autonomous Aerial Drone**: Automatically scrambles **Drone Falcon-X** equipped with forward FLIR thermal optics and emergency bivouac winch-drop gear, uploading optimal GPS flight corridors.
  4. 🚜 **Scrambles Tracked Ground Extraction Team**: Mobilizes heavy tracked crawlers (**P300 Crevasse Rescue Team**) armed with 30-meter crevasse winches and heated casualty pods.
  5. 📡 **Synchronizes Field Mobiles & HQ Laptops**: Pushes the complete dispatch plan, estimated arrival times (~18m drone / ~45m tracked team), and telemetry radar locks to all connected devices in real time.

### 📊 Tactical Comparison Matrix

| Phase | Legacy Manual Dispatch | Polaris AI Autonomous S.A.R. | Operational Benefit |
| :--- | :--- | :--- | :--- |
| **Response Latency** | 15–30 minutes (Awaiting human clicks) | **< 400 milliseconds** | **Instant Scramble** |
| **Base Calculation** | Manual chart / map lookup | **Autonomous Geodesic Haversine** | Eliminates navigational error |
| **Weather Check** | Manual phone/radio to meteorology | **Instant AWOS Telemetry Assessment** | Real-time flight corridor check |
| **Asset Allocation** | Operator manual dropdown selection | **Multi-tier Aerial + Ground Scramble** | Simultaneous scout + extraction |
| **Human Clicks Needed** | 3–5 clicks + form sign-offs | **0 Human Clicks** (Pure autonomous execution) | **Zero-latency life preservation** |

### 🎮 Testing & Interactive Controls

1. **Quick-Test Button**: Click **"Sim Crevasse Fall (Auto S.A.R.)"** or **"Re-Test Crevasse Fall"** in the top navigation toolbar to trigger the full scenario.
2. **Mode Toggle**: Easily toggle between `⚡ Autonomous Mode (Zero-Click)` and `Manual Operator Mode` using the toolbar badge or the banner control.
3. **Stand Down Protocol**: When field personnel are reported safe, click **"FIELD PARTY SAFE (STAND DOWN)"** to demobilize rescue assets and log the event into the system audit ledger.

### 🌐 S.A.R. Automation REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ai/sar/dispatch-crevasse-fall` | Simulates the Crevasse Fall mayday beacon and triggers instant autonomous S.A.R. execution. |
| `GET` | `/api/ai/sar/status` | Returns the current S.A.R. automation toggle state and recent emergency sorties. |
| `POST` | `/api/ai/sar/toggle` | Toggles between AI Zero-Click Autonomous Dispatch and Legacy Manual Operator mode. |
| `POST` | `/api/distress` | Standard distress beacon intake; executes zero-click S.A.R. automatically when enabled. |

---

### 🚨 1-Tap Instant Mayday SOS Broadcast & Emergency Triage

In extreme polar conditions (-50°C temperatures, whiteout blizzards, wind chills dropping below -65°C), field operators wearing thick thermal gloves facing rapid hypothermia cannot manually fill out multi-field forms, select dropdowns, or type text.

Polaris implements an **Instant 1-Tap Mayday SOS Broadcast Protocol**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🚨 MAYDAY DISTRESS BROADCAST PROTOCOL                                  │
│                                                                        │
│ [ ⚡ BROADCAST MAYDAY (1-TAP FAST SOS) ]                                │
│ AUTO-PACKAGING: OPERATOR IDENTITY, NODE ORIGIN, GPS, AMBIENT AWOS...   │
│                                                                        │
│ ▼ [SitRep Form (Non-Immediate Detailed Incident Report)]               │
└────────────────────────────────────────────────────────────────────────┘
```

#### 🛡️ Autonomous Context Auto-Packaging
A single click on **"BROADCAST MAYDAY (1-TAP FAST SOS)"** immediately packages:
* **Operator Identity**: Authenticated user session (`user.name`, e.g. Dr. Solid).
* **Origin Device Node**: Active hardware node ID (e.g. `NODE-01`).
* **Assigned Polar Station**: Sector and station context (e.g. `Maitri Station (Sector ANT-GRID-7)`).
* **Live GPS Coordinates**: Real-time GNSS latitude, longitude, elevation, and accuracy from hardware or browser telemetry.
* **Active Traverse Context**: Current operational expedition name and active vehicle callsign.
* **Ambient Cryo Telemetry**: Surface temperature (-48.2°C), katabatic wind (45kt SW), and pressure (978 hPa).

#### 📡 Real-Time Transmission & Acknowledgement Feedback
Once transmitted, the modal switches to a dedicated **Active Distress Status Console**:
* **Transmission State**: Live visual confirmation (`COSPAS-SARSAT / Iridium Constellation Synchronized`).
* **Source & Origin**: Shows transmitting operator and field hardware identifier.
* **Pinpointed Coordinates**: Live decimal degree coordinates displayed with direct GIS lock.
* **Time Elapsed**: Live counter since initial emergency burst transmission.
* **De-escalation**: Prominent **"Stand Down / Resolve Distress"** button when field parties are confirmed safe.

#### 📝 Expandable Situation Report (SitRep)
For non-instant or staged emergency reports, an expandable accordion provides access to:
* Severity triage selection (`Emergency Mayday`, `Urgent Pan-Pan`, `Advisory Security Alert`).
* Casualty headcounts and hypothermia status.
* Structural / vehicular damage summaries.
* Custom narrative dispatch log generation.

---

## ❄️ Dynamic Weather-Based Inventory Consumption (Blizzard Heating Model)

Polar research outposts and Antarctic stations (such as Maitri, Bharati, and McMurdo) rely entirely on bulk polar diesel fuel (F-34 / Jet-A1) to operate life-critical thermal hydronic boilers, diesel generator power plants, and vehicle warm-up systems.

### 🔄 The Problem with Static Inventory Dashboards
* **What it was**:
  Legacy dashboards display a flat metric: **15,000L Fuel Remaining**, assuming a constant average burn rate (e.g., 500L/day = 30 days remaining) with a static minimum stock alert set at 4,000L.
* **The Catastrophic Failure Mode**:
  When a severe 3-day polar blizzard strikes with temperatures dropping to -48°C and katabatic winds of 95 km/h, thermal dissipation spikes dramatically. Habitation pods and mechanical shops must run heaters at 100% capacity continuously, causing fuel burn to surge by **290% (to 1,450L/day)**. Under static tracking, station managers only realize they have breached minimum safety stock when it is already too late—and icebreaker supply ships require 5 to 7 days transit through pack ice.

### 🤖 What AI Automation Does (Dynamic Weather-Based Forecasting)
1. 📡 **Continuous Meteorological Intake**: Reads 3-day weather forecasts and radar barometric models.
2. 📈 **Dynamic Heating Load Modeling**: Calculates convective heat loss across station buildings and projects realistic storm fuel consumption:
   - **Baseline Normal Burn**: 500 L/day
   - **Blizzard Storm Burn (Surge)**: 1,450 L/day (+290% thermal load)
   - **Projected Storm Burn (3 Days)**: 4,350 L consumed over 72 hours
   - **Effective Days Remaining**: Drops abruptly from **30.0 days** down to **10.3 days**
3. ⚠️ **Dynamic Minimum Stock Alert Elevation**:
   Instead of leaving the threshold at 4,000L, the AI automatically raises the alert threshold to **8,500L** to guarantee an emergency heating safety buffer.
4. 🚢 **Autonomous Early Supply Ship Request**:
   The AI automatically issues an expedited replenishment request for **45,000 Liters of Arctic Diesel** via supply vessel **MV Vasiliy Golovnin** (ETA 5 days), ensuring fuel arrives well before critical reserves are depleted.

### 🌐 Weather Inventory REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ai/weather-inventory/evaluate` | Evaluates current 15,000L fuel reserves against live 3-day blizzard forecasts using Gemini 3.8 Flash, calculating burn surge, adjusted min stock (8,500L), and depletion projections. |
| `POST` | `/api/ai/weather-inventory/request-ship` | Issues early expedited supply vessel replenishment (`SHP-0006`) and raises station minimum stock alert dynamically in database. |

---

## 🛰️ Smart Route Optimization (Satellite Computer Vision Pathfinding & Dynamic Location)

Polar ice shelves, high-latitude glaciers, and sub-zero field sectors are dynamic, hostile environments. Tidal flexure, katabatic blizzards, and geothermal shifts cause continuous ice movement (+3.2m/month creep), opening concealed slot chasms and violent weather squall corridors across primary supply routes.

### 🚜 The Risk to Heavy Transport & Field Operators
* Heavy 28-ton PistenBully 300 Polar crawlers and tracked supply trucks transport cargo between ice-edge ship berths, inland field camps, and high-plateau stations.
* A single undetected snow-bridge collapse can swallow a 28-ton truck into a 30-meter crevasse void, while sudden katabatic squalls (-50°C wind chill, <400m whiteout visibility) cause total loss of visual reference and rapid tissue freezing.

### 🛰️ What AI Automation & Dynamic Telemetry Deliver
1. 📍 **Dynamic Real-Time Device Location Integration**:
   The engine locks onto the field operator or vehicle's dynamic device GPS coordinates (or IP geolocation), displaying real-time latitude, longitude, elevation, and speed. Routes dynamically origin-shift from the device's live position to any inland destination or polar base.
2. 🌡️ **Automated Weather & Hazard Detection Engine**:
   Evaluates real-time Automated Weather Observing System (AWOS) telemetry from Open-Meteo against physical polar threat thresholds:
   - **Lethal Cold-Soak & Wind Chill** ($\le -50^\circ\text{C}$): Computes exact human survival time (<12m threshold), frostbite onset windows, and fuel cloud-point wax warnings ($\le -45^\circ\text{C}$).
   - **Katabatic Gales & High Winds** ($\ge 30\text{ kts}$, gusts $\ge 45\text{ kts}$): Predicts vehicle roll risks and blowing sastrugi drift.
   - **Ground Whiteout & Dense Rime Fog** (Visibility $\le 0.4\text{ km}$ / WMO Codes): Identifies total horizon loss risks and recommends RTK GNSS guidance.
   - **Freezing Rain & Airframe Glaze Icing**: Flags supercooled droplet icing and triggers aircraft grounding advisories.
3. 📷 **Daily Synthetic Aperture Radar (SAR) & Satellite CV Pathfinding**:
   Ingests daily Sentinel-1 SAR interferometry and WorldView-3 30cm multispectral optical passes, detecting subsurface void anomalies and newly sheared crevasse fissures:
   - **Crevasse Chasm C-104**: 18.5m wide, 42m deep open shear void across direct legacy line (92% punch-through collapse risk).
   - **Stress Fracture F-88**: 12m wide subsurface cavity on glacial hinge line.
4. 📐 **Dynamic Safe Blue-Ice Corridor Routing**:
   The pathfinding neural engine recalculates a verified safe route along solid blue-ice compression ridges with a 300m safety buffer, elevating mission safety from 8% up to **99.4%**.
5. 📡 **Zero-Click Waypoint Push to Supply Fleet**:
   With 1-click, verified safe route coordinates, speed recommendations (e.g. 18 km/h in storm zones), and tactical advisories are transmitted via SATCOM uplink directly to crawler GPS terminals and the system dispatch log.

### 🌐 Smart Route REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ai/smart-route/optimize` | Ingests dynamic device coordinates (`userLat`, `userLng`), destination, weather telemetry, and local hazards, calculating a safe, collision-free waypoint corridor avoiding fissures and squalls. |
| `POST` | `/api/ai/smart-route/push-to-trucks` | Transmits the verified safe route plan to all active polar supply crawler terminals via SATCOM uplink and records an entry in the immutable audit log. |

---

## ⚡ API Key Optimization & Resource Conservation Engine

To maximize operational speed while minimizing third-party token consumption and API billing overhead, Polaris incorporates a dedicated **`AiOptimizationEngine`** on the server side (`server.ts`). This multi-tiered resource optimizer ensures maximum AI model intelligence with minimum key usage.

### 🛡️ Core Optimization Pillars

```
                     ┌──────────────────────────────────────────────┐
                     │           Incoming AI Request                │
                     │ (Predictive Maint, Recon, Smart Route, etc.) │
                     └──────────────────────┬───────────────────────┘
                                            │
                                  ┌─────────▼─────────┐
                                  │ Deterministic Key │
                                  │    Computation    │
                                  └─────────┬─────────┘
                                            │
                             ┌──────────────┴──────────────┐
                             │                             │
                     [Cache Hit: Valid TTL]        [Cache Miss]
                             │                             │
                   ┌─────────▼─────────┐         ┌─────────▼─────────┐
                   │ Return in <15ms   │         │ Check In-Flight   │
                   │ (Zero Key Quota)  │         │ Promises (Coalesce│
                   └───────────────────┘         └─────────┬─────────┘
                                                           │
                                            ┌──────────────┴──────────────┐
                                            │                             │
                                    [Duplicate In-Flight]        [Unique Live Call]
                                            │                             │
                                  ┌─────────▼─────────┐         ┌─────────▼─────────┐
                                  │ Multiplex Output  │         │ Streamline Prompt │
                                  │ (Zero Extra Call) │         │ MaxOutputTokens   │
                                  │                   │         │ Execute Gemini    │
                                  └───────────────────┘         └─────────┬─────────┘
                                                                          │
                                                                ┌─────────▼─────────┐
                                                                │ Store in Cache    │
                                                                │ Track Metric Logs │
                                                                └───────────────────┘
```

1. **In-Memory LRU & TTL Caching**:
   - Every AI request calculates a deterministic cryptographic fingerprint based on inputs (e.g. coordinates, asset ID, operating hours, and ambient weather).
   - High-confidence evaluations are stored with domain-tuned TTLs (5–15 minutes). Repeated queries return in **<15ms** without consuming API quota.
   - Cache size is bounded to 250 entries to safeguard RAM in resource-constrained field servers.

2. **Concurrent Request Coalescing (Multiplexing)**:
   - When multiple connected mobile units or operator dashboards trigger the same evaluation simultaneously, `AiOptimizationEngine` shares a single in-flight Promise across all clients, eliminating duplicate parallel API calls.

3. **Prompt & Payload Streamlining**:
   - Strict `responseMimeType: "application/json"` and compressed operational JSON schemas reduce prompt token size by ~40%.
   - Hard `maxOutputTokens` constraints prevent runaway verbose responses while guaranteeing strict glaciological accuracy.

4. **Zero-Key Offline ML Fallbacks**:
   - If no API key is supplied or when disconnected from satellite uplinks, the system automatically falls back to local high-fidelity polar glaciological physics algorithms (vitrification curves, thermal hydronic equations, Haversine routing), requiring **zero external API calls**.

5. **Real-Time Visibility & Metrics Console**:
   - Real-time savings and cache hit ratios are exposed via `GET /api/ai/metrics` and rendered directly inside the **API Keys & Resource Optimization** console (`ApiKeyModal.tsx`) and dashboard widgets.
   - Operators can manually clear in-memory cache at any time via `POST /api/ai/cache/clear`.

### 🌐 Optimization API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/ai/metrics` | Returns real-time optimization statistics: total requests, cache hits, coalesced calls, unbilled tokens saved, and quota reduction percentage. |
| `POST` | `/api/ai/cache/clear` | Purges all active in-memory cache entries and returns updated memory metrics. |
| `POST` | `/api/ai/test-key` | Performs a lightweight cached auth handshake with `gemini-3.8-flash` to verify API key validity with sub-second response time. |

---

## 🤖 AI Action Logs (Live Streaming Autonomous Action Feed)

The **AI Action Logs** engine provides a compact, high-visibility, continuously scrolling telemetry panel embedded on both the Primary Command Dashboard (`DashboardView.tsx`) and the Alerts & Notifications Center (`ViewsPart2.tsx`).

```
[10:45 AM] AI: Rerouting supply convoy due to expected blizzard.
[10:47 AM] AI: Optimizing generator fuel consumption at Himadri Base.
[10:50 AM] AI: Auto-elevating emergency fuel buffer at Maitri Station from 4,000L to 8,500L.
[10:52 AM] AI: Pre-heating hydraulic seals on Ice Corer Rig 3000 ahead of -48°C temperature drop.
[10:55 AM] AI: Autonomous SAR micro-drone dispatched on reconnaissance path over Wohlthat Ridge.
[10:58 AM] AI: Calculated optimal ice-leads navigation trajectory for resupply ship MV Vasiliy Golovnin.
[11:01 AM] AI: Auto-resolved fuel line pressure warning after activating heated trace wire.
```

### ⚙️ Core Architecture & Streaming Engine
1. ⏱️ **Real-Time Operational Timestamps**:
   Every autonomous action is stamped with exact operational time syntax (e.g. `[10:45 AM]`) and prefixed with the recognizable `AI:` tactical agent indicator.
2. 🔄 **Continuous Live Streaming**:
   An autonomous background event generator injects new realistic polar actions periodically (weather defense, generator optimization, drone reconnaissance, convoy reroutes, track tensioning, and radio frequency hops).
3. 🎯 **Domain-Specific Classification**:
   Entries are dynamically categorized into color-coded sub-domains:
   - 🚛 **Logistics**: Convoy rerouting, blue-ice navigation corridors, sastrugi avoidance.
   - ⚡ **Power / Grid**: Generator fuel optimization, solar inverter battery switching, glow-plug cold-soak cycles.
   - 🛠️ **Maintenance**: Hydraulic seal pre-heating, trace wire heating, predictive belt pre-allocations.
   - 🚨 **SAR / Rescue**: Autonomous drone dispatch, VHF repeater triangulations, zero-click extractions.
   - ❄️ **Weather Defense**: Katabatic wind detection, hangar bay locking, blizzard fuel buffers.
4. 🕹️ **Interactive Stream Controls**:
   Operators can pause or resume the live feed, filter entries by domain category, and inspect associated impacted assets.

---

## ⚡ Auto-Resolved by AI Alert System (Self-Healing Autonomous Operations)

Polar operations cannot afford human delay for routine or time-critical sub-zero anomalies. The **Auto-Resolved by AI** system demonstrates self-healing autonomous infrastructure by resolving operational alerts independently and tagging them with a distinctive glowing green **`[⚡ Auto-Resolved by AI]`** badge.

### 🛡️ Why Self-Healing Matters in Sub-Zero Polar Logistics
In extreme cold environments (-50°C), manual resolution of equipment warnings (such as diesel fuel gelling, generator rail pressure drops, or radio packet loss) often arrives too late. The autonomous agent detects abnormal sensor trends early, executes immediate corrective telemetry commands (such as turning on heating trace wires or rerouting satellite ship tracks), and automatically marks the alert resolved.

### 🌟 Key Features of the Auto-Resolved Alert Center
* 🏷️ **Prominent Green Auto-Resolved Badges**:
  Alerts that were resolved autonomously display a high-contrast green tag:
  $$\text{\textbf{[⚡ Auto-Resolved by AI \checkmark]}}$$
* 🔍 **Forensic Resolution Breakdown**:
  Each auto-resolved alert includes an expanded tactical report detailing:
  - **Action Taken**: Exact technical mitigation executed by the AI (e.g., *“AI triggered autonomous heating trace wire activation & closed paraffin anti-gel dosing loop. Rail pressure restored to 3.8 bar.”*).
  - **Impact Averted**: Operational crisis prevented (e.g., *“Averted catastrophic base generator power blackout during sub-zero night.”*).
  - **Timestamp**: Exact UTC resolution time.
* 📊 **Autonomous Resolution Metrics**:
  Real-time stat cards display the total number of auto-resolved issues and the **Autonomous AI Resolution Rate** (~45% of historical operational anomalies handled with zero downtime).
* ⚡ **Interactive "AI Auto-Resolve" Trigger**:
  Operators viewing active alerts can click **`[⚡ AI Auto-Resolve]`** to witness the AI agent analyze the alert, execute corrective actions, record an immutable entry in the system audit log, and instantly promote the alert to the Auto-Resolved status.

---

## 🧹 AI Automated Work Clearing & Forensic Action Logging

To keep active polar command consoles lean and focused on pending missions, the system features an **AI Automated Work Clearing & Archival Engine** that automatically clears completed work across tasks, predictive maintenance, alerts, and route clearances, writing full forensic dossiers into permanent logs.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AI AUTONOMOUS JANITOR                           │
│                                                                        │
│   Active Queue                     AI Cleared Work Logs                │
│   ┌───────────────┐   Auto-Sweep   ┌───────────────────────────────┐   │
│   │ • Task Done   │ ─────────────► │ • ID: CWL-8492                │   │
│   │ • Maintenance │   (Immutable)  │ • Action: Belt Tensioned      │   │
│   │ • Auto-Alert  │                │ • Forensic Resolution Dossier │   │
│   └───────────────┘                │ • Risk Averted: -50°C Seizure │   │
│                                    └───────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### 🎯 Key Capabilities
1. **Automated Queue Sweep & Archival**:
   - Completed checklist tasks and executed maintenance orders are automatically cleared from the active queue and transferred to the permanent **"AI Cleared Work Logs"** archive.
   - Operators can trigger an instantaneous batch sweep with the **`[⚡ AI Auto-Clear All Done]`** button.

2. **Forensic Work Done Dossiers (`CompletedWorkLogEntry`)**:
   Every archived work record preserves:
   - **Unique Forensic ID**: Stamped with `CWL-XXXX` identifier.
   - **Exact Execution Timestamp**: ISO 8601 and operational localized time syntax.
   - **Action Taken**: Detailed breakdown of the mechanical, logistics, or telemetry mitigation.
   - **Forensic Resolution & Impact Averted**: Quantitative risk avoided (e.g., fuel gelation averted, vibration harmonics normalized).
   - **Operator & Station Association**: Clear chain-of-custody tracking.

3. **Dual-Tab Command Workstation**:
   - **Tasks Module (`Modules.tsx`)**: Easily toggle between **"Active Task Queue"** and **"⚡ AI Cleared Work Logs (Archived)"**.
   - **Alerts Center (`ViewsPart2.tsx`)**: Bulk sweep resolved notifications into permanent archives with one click.
   - **Audit Trail & Dossier Inspector (`ViewsPart2.tsx`)**: Browse immutable system audit records alongside the forensic AI work archive with deep modal inspection.

4. **Live Telemetry Broadcast Synchronization**:
   - Whenever work is completed or cleared by AI, an instantaneous window broadcast event (`polar-ai-action-event`) streams directly into the continuous **AI Action Logs** ticker.

---

## 🖥️ Pre-Boot System Check (Terminal-Style Hardware & Telemetry POST)

Prior to initializing the main operational dashboard upon login (or when triggered manually via **`[POST Diagnostics]`** in the topbar), the system executes a rigorous, retro-tactical **Power-On Self-Test (POST)** verifying critical sub-zero hardware, sensor arrays, satellite uplinks, and power microgrids.

```
┌────────────────────────────────────────────────────────────────────────┐
│ POLARIS MK-IV BIOS // PRE-BOOT SYSTEM CHECK (POST)                     │
│ STATUS: EXECUTING PRE-BOOT POST... [████████████░░░] 78%               │
│                                                                        │
│ [0x01A4] [VERIFIED] [CRYO-THERM] Dome-C: -51.6°C | 100% Stream          │
│ [0x02F0] [ONLINE]   [IRIDIUM-NEXT] Signal: -74 dBm | 99.8% Lock        │
│ [0x03A0] [VERIFIED] [BASE-BAT] LiFePO4: 53.4V DC | SOC: 94.2%          │
│ [0x04E0] [ONLINE]   [AI-JANITOR] Cache LRU: 100% | Backlog: 0          │
└────────────────────────────────────────────────────────────────────────┘
```

### 🎯 Key Capabilities & Verification Pillars
1. **Sensor Connectivity Probes**:
   - Sub-zero Cryogenic Ambient Temperature sensors (-51.6°C to -24.8°C at Dome-C & Bharati stations).
   - Ground Penetrating Radar (GPR-800) transceiver interface for sub-ice crevasse detection.
   - Snowcat crawler HNBR belt harmonic vibration transducers (RMS: 0.42 mm/s).
   - Arctic Diesel F-34 fuel viscosity and thermal trace heating blanket circuits.
   - Heated ultrasonic anemometer and barometric pressure sensor array (982.4 hPa, 42.6 kt ENE).

2. **Satellite Uplink & Telemetry Mesh**:
   - Iridium NEXT L-Band Polar constellation uplink handshake (-74 dBm, 66/66 cross-links).
   - Starlink Polar Gateway phased-array ground station tracking (Latency: 42ms).
   - Inmarsat-C / COSPAS-SARSAT 406 MHz emergency distress beacon transponder (Hex-ID ready).
   - VHF Troposcatter mesh network link (142.800 MHz Bharati repeater sync).

3. **Battery & Microgrid Power Subsystems**:
   - Base Microgrid LiFePO4 thermal reservoir battery bank (53.4V DC, SOC: 94.2%, +18.5°C heated).
   - Snowcat crawler auxiliary cold-cranking reserve (12.8V DC, 98% capacity).
   - Bifacial solar photovoltaic albedo harvest array.
   - Cummins diesel emergency generator ATS auto-transfer switch and block heater.

4. **Terminal Interactivity & Customization**:
   - **Tactical Themes**: Switch instantly between **Cyan Polar**, **Phosphor Green**, and **Amber CRT** color palettes.
   - **Acoustic Sound Synthesis**: Web Audio API generated mechanical terminal bleeps with mute toggle.
   - **CRT Scanlines**: Toggleable retro scanline display overlay.
   - **Playback Controls**: Pause, accelerate (5X Fast-Forward), re-run diagnostic, or export raw cryptographic `.log` reports.
   - **Fault Simulation**: Test artificial sub-zero sensor anomalies and watch the AI Autonomous Janitor immediately execute auto-remediation.

### 🚨 Zero-Scroll Active Sensor Fault & Cryo-Remediation Banner

When testing sensor faults in sub-zero environments, operators previously had to manually scroll through hundreds of lines of terminal logs to identify which sensor failed.

Polaris pins an **Active Sensor Fault & Remediation Diagnostic Banner** directly above the terminal output the instant a fault is triggered:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ CRITICAL SENSOR FAULT DETECTED: [FUEL-TRACE-SENS]                                     │
│ SUBSYSTEM: ARCTIC DIESEL F-34 HEATING BLANKETS // SEVERITY: CRITICAL (-38.4°C COLD-SOAK)  │
│ STATUS: CIRCUIT RESISTANCE DROP // AI STATUS: HEATER CIRCUIT ROUTING APPLIED             │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 🔍 Immediate Diagnostic Triage
The banner instantly exposes:
* **Target Sensor ID**: Exact failed hardware component (e.g. `FUEL-TRACE-SENS`).
* **Critical Subsystem**: Sub-zero system at risk (e.g. `Arctic Diesel F-34 Heating Blanket Array`).
* **Environmental Stress**: Real-time cold-soak severity (`-38.4°C Cold-Soak / Waxing Risk`).
* **Autonomous Remediation**: Live status indicator of self-healing action (`AI JANITOR RESOLVED`).
* **Dismiss / Acknowledge**: One-tap dismiss control once the operator has verified recovery.

---

## 🚛 Fleet Telemetry & Detailed Operational Analytics

To maintain a clean and uncluttered operational command center, in-depth analytical charts have been re-homed into the dedicated **Fleet Telemetry & Assets Workstation** (`src/components/polaris/Modules.tsx`):

### 📊 Strategic Analytical Visualizations
1. **Asset Physical Condition Distribution (`BarChart`)**:
   - Visualizes asset health across status categories: `Nominal`, `Needs Inspection`, `Needs Repair`, `Decommissioned`.
   - Real-time aggregation over heavy PistenBully 300 Polar crawlers, Twin Otter utility aircraft, drilling rigs, and autonomous drones.
2. **Monthly Logistics Expenditure Trends (`AreaChart`)**:
   - Tracks monthly spend across fuel, transport, maintenance, and supplies ($1.08M - $1.42M seasonal variations).
   - Demonstrates budget allocation and cost trajectory throughout high-latitude summer resupply vs winter survival phases.
3. **Operational Fleet Readiness KPIs**:
   - Total Tracked Vehicles: Real-time inventory of all operational assets.
   - Active on Traverse: Field party crawlers currently undertaking deep inland traverses.
   - Cold-Soak Service Bay: Assets undergoing heated hangar maintenance.
   - SATCOM Telemetry Sync: Live mesh beacon connection percentage.

### 📦 Depot Consumption vs Safety Reserve Thresholds (`BarChart`)
Re-homed directly into the **Consumables & Inventory** workstation, this chart compares active depot burn rates against critical winter safety buffers, providing instant visibility into fuel and ration reserves without cluttering the main mission overview.

---

## 🎮 Mission Simulation & Operator Training Mode

The **Mission Simulation / Training Mode** is an integrated tactical sandbox designed to train polar base operators, expedition commanders, and logistics dispatchers in extreme Arctic and Antarctic operational crisis response without endangering lives or perturbing live operational data.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [SIMULATION MODE ACTIVE] // T+14:32 // SPEED: 5X // SCENARIO: TRANS-ANTARCTIC RESUPPLY           │
│ PHASE: CREVASSE BYPASS & RE-ROUTE // TARGET ASSET: CONVOY PBD-ALPHA (-71.36°S, 12.15°E)          │
│ [PAUSE] [1X] [2X] [5X] [10X] [25X] [INJECT EVENT ▼] [TIMELINE DRAWER] [END SIM / AAR]            │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 🛡️ Strict Simulation vs. Live Operational Data Isolation
A fundamental architectural mandate is that simulation state must **never overwrite or pollute live operational databases**.
* **Deep In-Memory Sandbox**: When Simulation Mode is initiated, the system executes an isolated deep-clone of the current operational state (`liveDb` & `liveAssets`).
* **Dynamic Active State Routing**: All 24+ downstream views (`DashboardView`, `MapView`, `PredictiveMaintenance`, `DynamicWeatherInventory`, `SmartRouteOptimizer`, `SarConsoleView`, `Alerts`, `Tasks`, `AiActionLogsPanel`) bind reactively to `activeDb` and `activeAssets`.
* **Zero Disk Leakage**: Production files (`polar_state.json`) remain untouched. Field interventions executed during simulation (e.g. approving an AI maintenance task or dispatching SAR) mutate only the in-memory simulation container.
* **Safe Exit & State Restoration**: Exiting simulation mode immediately restores live satellite telemetry and database pointers in 0 ms without requiring a page reload.

---

### 🎛️ Simulation Control Center & Tactical Amber HUD
Operators can launch and monitor simulations either from the full-page **`Training Sim`** workstation in the left navigation sidebar or via the persistent quick-action **`[TRAIN SIM]`** badge in the console header.

1. **Persistent Tactical Amber HUD Bar**:
   - Displays real-time scenario status, elapsed mission clock (`T+MM:SS`), active phase, and target convoy.
   - **Playback Controls**: Play, Pause, Resume, Reset to T+00:00, and Stop.
   - **Time Multipliers**: `1×` (real-time), `2×`, `5×` (recommended), `10×`, and `25×` (high-speed stress testing).
   - **Flyout Chronological Timeline Drawer**: Allows operators to review past and upcoming scheduled events with severity-colored status tags.
   - **Quick Manual Event Injection Popover**: Instant access to all 11 tactical crisis triggers.

2. **Full-Page Simulation Workstation (`SimulationControlCenter.tsx`)**:
   - Scenario briefing dossier, risk indicators, asset rosters, and meteorological condition telemetry.
   - Live simulated AWOS gauges: Ambient Temp (-50°C to -24°C), Wind Velocity (kt), Wind Chill (°C), and Barometric Pressure (hPa).
   - Real-time event log with manual injection deck and instant map jump-link.

---

### 📜 5 Realistic Pre-Built Training Scenarios

| Scenario ID | Title | Duration | Crisis Sequence & System Response |
| :--- | :--- | :--- | :--- |
| **`SIM-SCEN-01`** | **Trans-Antarctic Resupply Traverse** | 40 mins (equiv.) | **T+00:00** Convoy departs Maitri Depot &rarr; **T+08:00** Ambient temp drops to -44°C &rarr; **T+10:00** PBD-Alpha track vibration rises &rarr; **T+12:00** AI detects abnormal harmonics &rarr; **T+13:00** AI proposes hydraulic trace warming &rarr; **T+16:00** Katabatic blizzard warning issued &rarr; **T+17:00** Satellite CV reroutes convoy &rarr; **T+22:00** Heating fuel burn surges &rarr; **T+30:00** Iridium SATCOM fades &rarr; **T+35:00** Crevasse fall Mayday beacon received &rarr; **SAR automated protocol scrambles rescue drone**. |
| **`SIM-SCEN-02`** | **Critical Vehicle Mechanical Failure** | 25 mins (equiv.) | **T+00:00** Snowcat Heavy Tractor in transit &rarr; **T+04:00** Harmonic vibration rises to 4.8 mm/s &rarr; **T+07:00** AI Predictive Maintenance generates pre-failure advisory &rarr; **T+11:00** Tensioner bracket fractures at -48°C; asset halted &rarr; **T+14:00** AI route optimizer reroutes trailing vehicles &rarr; **T+17:00** Logistics reserves HNBR spare track belt from Depot B &rarr; **T+21:00** Field emergency repair completed &rarr; **Telemetry normalized**. |
| **`SIM-SCEN-03`** | **Severe Katabatic Whiteout Blizzard** | 30 mins (equiv.) | **T+00:00** Nominal conditions at Maitri &rarr; **T+04:00** Katabatic winds escalate to 48 kt &rarr; **T+08:00** Wind chill hits -58°C, Visibility <500m &rarr; **T+12:00** COND-1 Blizzard Warning issued; sub-zero danger zone expands 45km &rarr; **T+16:00** Heating fuel burn rate escalates to 1,450L/day &rarr; **T+20:00** AI elevates emergency fuel buffer from 4,000L to 8,500L &rarr; **T+24:00** Automated resupply order issued to MV Vasiliy Golovnin &rarr; **Defensive station lockdown active**. |
| **`SIM-SCEN-04`** | **SATCOM Blackout & Offline Mesh Sync** | 28 mins (equiv.) | **T+00:00** Full Iridium NEXT constellation lock &rarr; **T+04:00** Solar flare ionospheric disturbance degrades signal &rarr; **T+08:00** Complete SATCOM blackout; system automatically transitions to **Offline Cache** mode &rarr; **T+14:00** Field operators queue waypoints and dispatch notes into local cryptographic store &rarr; **T+26:00** Satellite constellation link restored &rarr; **Bi-directional event queue synchronizes with 100% forensic integrity**. |
| **`SIM-SCEN-05`** | **Crevasse Fall & Zero-Click Mayday SAR** | 24 mins (equiv.) | **T+00:00** Research team conducting blue-ice coring &rarr; **T+04:00** Autonomous crevasse detection beacon triggers 406 MHz Mayday; audible emergency klaxon sounds across consoles &rarr; **T+05:00** AI SAR engine identifies Amundsen-Scott as nearest staging outpost &rarr; **T+06:00** SAR Drone Falcon-X launched on autonomous vector &rarr; **T+08:00** Tracked Sno-Cat extraction team deployed &rarr; **T+20:00** Survivors secured and hoisted &rarr; **Incident resolved with zero casualties**. |

---

### 💉 11-Trigger Manual Event Injection Deck
During any simulation, trainers can test operator reflexes by injecting real-time tactical anomalies directly into the active event bus:
1. 🌨️ **Katabatic Blizzard Warning**: Ambient temp drops -15°C, wind increases to 55 kt, whiteout danger zone expands.
2. 🚛 **Track Tensioner Shear**: PBD-Alpha engine health drops to 44%, vibration spikes to 7.8 mm/s, asset halted.
3. 📡 **SATCOM Blackout**: Simulates satellite blackout, dropping network into offline event caching.
4. 🛰️ **GPS Vector Drift**: Degrades positional accuracy (+/- 2.4 km offset advisory).
5. 🚨 **Crevasse Mayday**: Broadcasts critical 406.025 MHz distress beacon, triggering audio klaxons and SAR scramble.
6. ⛽ **Fuel Line Freeze**: Traces diesel wax coagulation, dropping fuel level to 12% critical advisory.
7. 🔧 **Engine Overheat**: Simulates fan belt failure under heavy towing load (98°C coolant temp).
8. 🌡️ **Extreme Cold-Soak (-65°C)**: Triggers severe sub-zero thermal stress curve across all outdoor assets.
9. 🧊 **New Crevasse Zone**: Generates dynamic hazardous crevasse cluster on map intersecting active traverse.
10. 🔋 **Battery Thermal Depletion**: Simulates cabin heating load dropping LiFePO4 battery bank to 14%.
11. 📍 **Convoy Vector Jump**: Steps convoy 25 km forward along the traverse corridor.

---

### 🗺️ Map Integration & Waypoint Coordinate Interpolation
The simulation directly drives the **existing Leaflet GIS and Polar Stereographic radar maps**:
* **Real-time Waypoint Interpolation**: Convoy PBD-Alpha moves continuously between predefined polar staging coordinates (`Maitri Depot Gate` &rarr; `Intermediate Staging Gate` &rarr; `Blue-Ice Ridge Bypass` &rarr; `Firn Dome Staging` &rarr; `East Sastrugi Approach` &rarr; `South Pole Inland Depot`).
* **Hazard & Distress Overlays**: Crevasse fall coordinates (`-71.42°S, 12.22°E`) and dynamic danger zones render directly on top of the active Leaflet layers with pulsating tactical markers.

---

### 🤖 AI Autonomous Action Safety Classification
Simulation mode categorizes all autonomous and assistive decisions according to 3 operational safety tiers:

```
[OBSERVE]    AI detects telemetry anomalies, models degradation curves, and issues informational advisories.
[ASSIST]     AI calculates route bypasses or parts pre-orders; presents structured recommendations requiring operator confirmation.
[AUTONOMOUS] AI executes pre-approved, zero-latency emergency mitigations automatically (e.g., SAR drone scramble, emergency heating trace activation).
```

Every AI decision streams in real-time into the existing **AI Action Logs** feed with color-coded safety level badges (`[OBSERVE]`, `[ASSIST]`, `[AUTONOMOUS]`).

---

### 📋 After-Action Report (AAR) & Deterministic Replay
Upon scenario completion or manual termination, the system generates an operational **After-Action Report (AAR)**:
* **Performance Grading**: Evaluates operator interventions, response times, and unresolved critical events (Grade: `A+` to `C-`).
* **Forensic KPI Summary**: Total events executed, alerts triggered, AI decisions taken, SAR missions resolved, and communication outages weathered.
* **JSON Export**: Export the complete cryptographic scenario log for institutional training audits.
* **1-Click Replay**: Re-runs the exact scenario deterministically from `T+00:00`.

---

## 📍 Waypoint Tracing & Live Route Telemetry on Map

The **Polar Expedition & Asset Management System** features an advanced, high-latitude **Waypoint Tracing & Geospatial Navigation Engine** integrated directly into the core `RealMapView.tsx`, `PolarMap.tsx`, and `SmartRouteOptimizer.tsx` components.

Designed specifically for Antarctic and Arctic traverses where whiteouts and shifting blue-ice crevasse chasms make visual navigation impossible, the waypoint tracing system accurately connects, traces, colors, and tracks every planned and actual movement of polar convoys and scientific survey teams.

```text
               WP-04 [PENDING]
                     ●
                    ╱
                   ╱  (Remaining Path: Dashed Sky Cyan)
                  ╱
          WP-03 ●  [ACTIVE TARGET] (Arrival Radius Geofence Ring)
                ╱
               ╱
      CURRENT ●  TRK-Alpha Heavy Snowcat (-71.20°, 12.08°)
             ╱
            ╱  (Traveled Route: Solid Emerald with Glow)
    WP-02  ●  [COMPLETED ✓]
          ╱
         ╱
 WP-01  ●  [COMPLETED ✓] Base Camp Depot
```

---

### 🌐 1. Geodesic Mathematics & High-Latitude Mercator Stability

Operating near the geographic poles introduces mathematical challenges due to longitude convergence and Mercator projection singularities. The tracing engine implements rigorous geodesic utilities (`src/utils/waypointTracing.ts`):

* **Haversine Great-Circle Distance**:
  $$\Delta\sigma = 2 \arcsin \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)}$$
  $$d = R \cdot \Delta\sigma \quad (R = 6371.0 \text{ km})$$
  Accurately calculates real-world ground distances between traverse waypoints even across extreme polar latitudes.
* **Forward Azimuth / Bearing Calculation**:
  $$\theta = \text{atan2}\left(\sin\Delta\lambda \cos\phi_2, \; \cos\phi_1 \sin\phi_2 - \sin\phi_1 \cos\phi_2 \cos\Delta\lambda\right)$$
  Computes true geodesic bearings ($0^\circ$ to $360^\circ$) from convoy positions to the active waypoint target.
* **EPSG:3857 Mathematical Boundary Clamping**:
  High-latitude coordinates are safeguarded via `safeMercatorLatLng(lat, lng)`, strictly clamping latitude to $[-85.0^\circ, +85.0^\circ]$ and normalizing longitude within $[-180.0^\circ, +180.0^\circ]$. This guarantees Leaflet vector layers and projection formulas never encounter `NaN` or `Infinity`.

---

### 🎨 2. Dual-Layer Traveled vs. Remaining Route Polyline Tracing

The route is dynamically partitioned in real time based on the active position of the tracked expedition crawler:

1. **Traveled / Completed Route (`traveledPathCoords`)**:
   - Spans from the departure station through all completed waypoints up to the convoy's current GPS position.
   - Styled with a high-visibility solid **Emerald Green** (`#10B981`, weight 4.0, opacity 0.95) underlaid with a luminous neon glow (`#059669`, weight 7.0, opacity 0.35) for instant whiteout readability.
2. **Remaining Planned Route (`remainingPathCoords`)**:
   - Extends forward from the convoy's current position through the active target waypoint and subsequent pending waypoints to the final expedition destination.
   - Styled with a high-contrast dashed **Sky Cyan** polyline (`#38BDF8`, weight 3.5, dashArray `8, 8`, opacity 0.85).
3. **Continuous Polyline Coherence**:
   - The route lines are not decorative; they connect true geographic coordinates and automatically re-render whenever waypoints are added, removed, edited, or reordered.

---

### 🛰️ 3. Actual GPS Track Breadcrumbs vs. Planned Route

In extreme polar terrain, heavy crawlers frequently detour around active sastrugi drift ridges, crevasse fields, and pressure ridges. The map visually distinguishes between:

* **Planned Route Corridor**: Theoretical path connecting planned navigation waypoints.
* **Actual GPS Track History (`actualTrack`)**:
  - Rendered as an **Amber Gold** dashed polyline (`#F59E0B`, weight 2.5, dashArray `3, 4`, opacity 0.85).
  - Logs actual coordinates received from real GPS hardware, mobile phone Web Geolocation fixes, or the Mission Simulation engine.
  - Toggleable via the top toolbar button: **`GPS TRACK: ON / OFF`**.

---

### 🎯 4. Automatic Waypoint Progress & Arrival Geofence

The system continuously evaluates convoy progress relative to the waypoint sequence:

* **Waypoint Status Lifecycle**:
  ```text
  Pending (Slate Outline) ──► Active / Current (Glowing Cyan Halo) ──► Completed (Emerald Check ✓)
  ```
* **Configurable Arrival Radius**:
  - Configured via the toolbar selector: **`RADIUS: 1km | 3km | 5km | 10km`** (Default: `3.0 km`).
  - When the convoy enters the arrival radius:
    1. The active waypoint is marked `passed: true` and `status: 'completed'`.
    2. The next waypoint in the sequence is automatically promoted to `status: 'current'`.
    3. The state change is saved back to `db.expeditions`.
* **Visual Arrival Geofence**:
  - The current active waypoint displays a translucent cyan geofence circle with a dashed border representing the active detection boundary.

---

### 🎥 5. Auto-Center / Camera Follow Mode

Operators managing live convoys across expansive polar maps can engage automated camera tracking:

* **`FOLLOW ASSET: ON`**:
  - Map camera smoothly animates (`mapInstance.panTo([lat, lng], { animate: true, duration: 0.8 })`) to center on the active expedition crawler whenever coordinates update.
  - Active toggle button pulses with a glowing emerald green indicator.
* **Operator Decoupling (`dragstart`)**:
  - If the operator manually clicks and drags to inspect another base or sector, Follow Mode instantly switches to `OFF` automatically, ensuring the camera never fights the user's manual navigation.

---

### 🧭 6. Interactive Tactical Waypoint Inspector & Action Controls

Clicking any waypoint node on the map reveals a rich tactical glassmorphism popup:

* **Header**: Waypoint sequence badge (e.g. `WP-03: Supply Depot`) and status badge (`PENDING`, `CURRENT`, or `COMPLETED`).
* **Telemetry Data Grid**:
  - Exact coordinates: Lat / Lng (4 decimal precision)
  - Elevation: AMSL (Above Mean Sea Level)
  - Distance from convoy: Formatted in meters or kilometers (e.g. `12.4 km`)
  - Sequential ETA: Estimated arrival time based on convoy ground speed (e.g. `2h 15m`)
  - Sequence order: `3 / 6`
  - Active arrival radius: `3 km`
* **Hazard Advisories**: Crevasse warning banners, blue-ice alerts, and slope warnings.
* **Direct Operator Actions**:
  - **`🎯 Target This`**: Manually overrides the active waypoint target.
  - **`✓ Mark Done / Pending`**: Toggles waypoint completion status.
  - **`▲ Move Up` / `▼ Move Down`**: Reorders waypoint sequence with instantaneous route recalculation.
  - **`🗑 Delete`**: Removes the waypoint from the expedition traverse.

---

### 🔄 7. Route Optimizer & Mission Simulation Integration

The waypoint tracing engine is fully integrated with existing subsystems:

1. **Smart Route Optimizer (`SmartRouteOptimizer.tsx`)**:
   - When the AI discovers safer blue-ice corridors avoiding crevasses, clicking **`Push Route to Trucks`** dispatches the optimized safe waypoints directly to the active expedition in `db.expeditions`.
   - The map immediately updates the waypoint pins, sequence, and traveled/remaining corridors.
2. **Mission Simulation / Training Sandbox (`useSimulation.ts`)**:
   - During simulation scenarios, Convoy PBD-Alpha moves along realistic Antarctic traverse waypoints.
   - The simulation ticker pushes real-time breadcrumbs to `actualTrack`, updates current coordinates, auto-advances waypoints as the arrival radius is breached, and follows the simulated convoy when Follow Mode is enabled.

---

### 🛡️ 8. Defensive Waypoint Normalization & Robustness Architecture

To prevent runtime errors across diverse, legacy, or incomplete expedition manifests (e.g. `exp.waypoints is undefined` or null), the system enforces a strict canonical schema and multi-tier normalization boundary:

* **Canonical Waypoint Schema**: Every expedition object is guaranteed to possess `waypoints: Waypoint[]` (canonical empty array `[]` when no waypoints exist).
* **Multi-Tier Boundary Normalization**:
  1. **Persistence & Database Tier (`src/server/database.ts`)**: Authoritative database initialization and disk load passes all raw expedition manifests through `normalizeExpeditions`, converting missing/null/undefined properties to `[]`.
  2. **API & WebSocket Tier (`server.ts`)**: The `/api/state` endpoint and real-time state broadcasts sanitize both root expeditions and `polarisDb.expeditions` prior to dispatching state payloads. Handlers for `ADD_EXPEDITION`, `UPDATE_EXPEDITION`, and `UPDATE_POLARIS_DB` sanitize incoming payloads.
  3. **Client State Tier (`src/hooks/usePolarSync.ts`)**: `applyServerState`, `syncPolDb`, `addWaypoint`, `deleteWaypoint`, and `advanceWaypoint` guard array mutations with `(Array.isArray(e.waypoints) ? e.waypoints : [])`.
  4. **UI Studio Tier (`src/components/WaypointPlannerPage.tsx`)**: Inbound props are normalized with `normalizeExpeditions(expeditions || [])`. All local computations (total distance, cleared counters, hazard flags, GPX export, and sequence comparisons) operate safely on `activeWaypoints`, allowing expeditions with zero waypoints to render their natural empty-state UI without crashing into the system recovery ErrorBoundary.
  5. **GIS Map Tier (`src/components/PolarMap.tsx`)**: Validates `Array.isArray(exp.waypoints)` and gracefully bypasses polyline rendering if `waypoints.length === 0`.

---

## 🤖 Gemini-Powered Waypoint Route Optimization

The system integrates a **hybrid AI + deterministic polar pathfinding engine** that uses Gemini to analyze candidate waypoints and recommend an optimized safe routing sequence for expedition convoys.

### Architecture Overview

```
Operator Request
     │
     ▼
POST /api/ai/waypoints/optimize
     │
     ├─ 1. CACHE CHECK (aiOptimizer LRU, 10-min TTL, deterministic key)
     │      └─ If cache HIT → return instantly (saves ~1,400 tokens)
     │
     ├─ 2. GEMINI AI ANALYSIS (gemini-3.8-flash)
     │      ├─ Prompt: waypoint candidates, asset telemetry, weather, danger zones
     │      └─ Structured JSON schema: recommendedOrder, reasoning, estimatedDistance, riskLevel
     │
     ├─ 3. ANTI-HALLUCINATION VALIDATION
     │      ├─ Reject unknown waypoint IDs not in candidate set
     │      ├─ Reject duplicates
     │      ├─ Preserve mandatory waypoints (origin + destination)
     │      ├─ Bind coordinates from system data (never invent coordinates)
     │      └─ On failure → FALLBACK to deterministic optimizer
     │
     ├─ 4. DETERMINISTIC FALLBACK (polar heuristic)
     │      ├─ Greedy nearest-neighbor + 2-opt improvement
     │      ├─ Haversine geodesic distance computation
     │      └─ Hazard penalty scoring for danger zones & crevasses
     │
     └─ 5. OPERATOR APPROVAL WORKFLOW
            ├─ Route status: PROPOSED (not yet active)
            ├─ Operator: Accept & Apply → writes to db.expeditions
            ├─ Operator: Reject → preserves legacy path
            └─ Operator: Recalculate → triggers new Gemini pass
```

### Key Features

| Feature | Description |
|:---|:---|
| **Gemini Analysis** | `gemini-3.8-flash` analyzes waypoint candidates with weather hazards, crevasse fields, and polar danger zones |
| **Anti-Hallucination** | Backend validates all returned IDs against input candidates; rejects invented coordinates |
| **Mandatory Waypoints** | Start and end waypoints are always preserved — never reordered or removed |
| **Deterministic Fallback** | Greedy nearest-neighbor + 2-opt tour with geodesic Haversine distance if AI fails |
| **Operator Approval** | Route remains PROPOSED until operator explicitly accepts via Accept & Apply |
| **Simulation Mode** | Full isolation: simulation routes write only to `simDb`, live data is never mutated |
| **AI Action Logs** | All optimization requests, results, and approvals broadcast via `polar-ai-action-event` |
| **Caching** | 10-minute LRU cache with request coalescing saves repeated analysis tokens |
| **Map Overlay** | Proposed AI route renders as glowing violet dashed polyline (`#a855f7`) alongside current emerald route |

### API Endpoint

**`POST /api/ai/waypoints/optimize`**

```json
{
  "waypoints": [
    { "id": "WP-01", "name": "Base Depot", "lat": -70.76, "lng": 11.73, "isMandatory": true },
    { "id": "WP-03", "name": "Ridge Bypass", "lat": -71.42, "lng": 12.22 },
    { "id": "WP-06", "name": "Maitri Coastal Base", "lat": -72.05, "lng": 12.98, "isMandatory": true }
  ],
  "asset": { "id": "AST-0001", "name": "TRK-Alpha Heavy Snowcat", "lat": -70.76, "lng": 11.73 },
  "environment": { "tempC": -42, "windSpeedKts": 38, "visibilityKm": 1.2 },
  "constraints": { "mandatoryWaypointIds": ["WP-01", "WP-06"], "maxTravelDistanceKm": 600 }
}
```

**Response:**
```json
{
  "success": true,
  "cached": false,
  "result": {
    "recommendedOrder": ["WP-01", "WP-03", "WP-06"],
    "orderedWaypoints": [ ... ],
    "reasoning": ["Avoids Crevasse C-104 ...", "Minimizes katabatic exposure ..."],
    "estimatedDistance": 162.8,
    "estimatedDuration": 407,
    "riskLevel": "LOW",
    "warnings": [],
    "confidence": 0.94,
    "engineUsed": "gemini-3.8-flash",
    "validationDetails": { "allCandidateIdsValid": true, "mandatoryPreserved": true }
  }
}
```

### Components Involved

| Component | Role |
|:---|:---|
| [`src/components/polaris/SmartRouteOptimizer.tsx`](src/components/polaris/SmartRouteOptimizer.tsx) | Primary Gemini optimize button, proposal scorecard, and operator approval controls |
| [`src/components/PolarGISMap.tsx`](src/components/PolarGISMap.tsx) | Tactical polar GIS map with A* glowing polyline, node pins, and glassmorphic AI recommendation HUD |
| [`src/components/RealMapView.tsx`](src/components/RealMapView.tsx) | Renders proposed glowing cyan/emerald polyline and AI sequence badges on the Leaflet map |
| [`src/components/WaypointPlannerPage.tsx`](src/components/WaypointPlannerPage.tsx) | Waypoint planner with priority/mandatory flags and AI optimize modal |
| [`src/utils/polarRouteAStar.ts`](src/utils/polarRouteAStar.ts) | A* pathfinding algorithm, 5-factor weighted edge cost function, DEM slope, and adaptive search mesh |
| [`src/utils/deterministicRouteOptimizer.ts`](src/utils/deterministicRouteOptimizer.ts) | Deterministic fallback: nearest-neighbor + 2-opt, Haversine geodesic math, hazard penalty |
| [`src/types.ts`](src/types.ts) | `AStarNode`, `AStarEnvironment`, `AStarAsset`, `AStarOptimizationResult` TypeScript interfaces |
| [`server.ts`](server.ts) | `POST /api/ai/route-optimizer/astar` — backend A* pathfinding and Gemini 3.8 Flash decision layer |

---

### 🧭 Polar A* Tactical Route Engine (Weighted Cost Function + Gemini 3.8 Flash)

The **Polar A\* Tactical Route Engine** is an advanced polar pathfinding and AI tactical decision system engineered specifically for extreme sub-zero traverses across Antarctica and the Arctic. It replaces simplistic straight-line routing with a mathematically rigorous A* graph search that optimizes energy conservation, mechanical wear, and crew survival.

```
                          ┌────────────────────────┐
                          │  Operator Triggers     │
                          │  "AI ROUTE OPTIMIZER"  │
                          └───────────┬────────────┘
                                      │
                                      ▼
                      ┌────────────────────────────────┐
                      │  POST /api/ai/route-optimizer  │
                      │             /astar             │
                      └───────────────┬────────────────┘
                                      │
       ┌──────────────────────────────┴──────────────────────────────┐
       │                                                             │
       ▼                                                             ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│  A* Cost Function Matrix     │              │  Adaptive Search Lattice     │
│  calculateEdgeCost(a, b, e)  │              │  Lateral offsets (±20km,     │
│  - Distance: 1 pt/km         │              │  ±40km, ±70km) to discover   │
│  - DEM Slope >5°: +50% cost  │              │  safe detours around hazards │
│  - Temp < Min Rating: ∞      │              └──────────────┬───────────────┘
│  - Wind: Headwind +25%       │                             │
│          Tailwind -10%       │                             │
│  - LETHAL Hazard: +500% cost │                             │
└──────────────┬───────────────┘                             │
               │                                             │
               └──────────────────────┬──────────────────────┘
                                      │
                                      ▼
                      ┌────────────────────────────────┐
                      │   A* Lowest-Cost Traversal     │
                      │   - Total Distance & Detour    │
                      │   - Transit Time Estimate      │
                      │   - Hazards Circumnavigated    │
                      │   - Cost Savings vs Straight   │
                      └───────────────┬────────────────┘
                                      │
                                      ▼
                      ┌────────────────────────────────┐
                      │   Gemini 3.8 Flash AI Layer    │
                      │   2-Sentence Tactical Fleet    │
                      │   Command Recommendation       │
                      └───────────────┬────────────────┘
                                      │
                                      ▼
                      ┌────────────────────────────────┐
                      │   Tactical Glassmorphic HUD    │
                      │   - Glowing Cyan/Emerald Line  │
                      │   - Interactive Review Card    │
                      │   - "Accept & Apply" Action    │
                      └────────────────────────────────┘
```

#### 1. The Cost Function (Pathfinding Layer)

The core traversal cost between any two spatial coordinates is evaluated via `calculateEdgeCost(nodeA, nodeB, environment, asset)`:

$$\text{Cost}(A, B) = \text{Distance}(A, B) \times \prod (1 + \text{Penalties})$$

* **Base Distance**: 1 point per kilometer computed via spherical Haversine geodesic math ($R = 6,371.0\text{ km}$).
* **Digital Elevation Model (DEM) Slope**: Mock polar topographic elevation profile rising from coastal ice shelves ($0-150\text{ m}$) to the high continental plateau ($2,800-3,500\text{ m}$). If the elevation gradient between nodes exceeds **$5^\circ$ ($\approx 8.7\%$ grade)**, a **$+50\%$ cost penalty** is applied to penalize severe fuel burn and track slippage.
* **Cold-Soak Operating Threshold**: If the local ambient temperature is below the asset's certified minimum operating temperature (e.g. $-50^\circ\text{C}$ for heavy Snowcats, $-40^\circ\text{C}$ for light transports), the edge cost evaluates to **$\infty$ (unroutable)** to reflect immediate hydraulic vitrification, seal shattering, and track seizure.
* **Wind Vector Heading**: The algorithm computes the travel azimuth bearing relative to incoming meteorological wind:
  * **Headwind** ($\Delta\theta < 60^\circ$): **$+25\%$ cost penalty** (aerodynamic drag and accelerated engine block thermal loss).
  * **Tailwind** ($\Delta\theta > 120^\circ$): **$-10\%$ cost bonus** (kinetic tailwind boost and reduced sastrugi drift resistance).
  * **Crosswind**: Neutral ($0\%$ cost delta).
* **LETHAL Hazard Zones**: If the great-circle segment passes within the radial perimeter of any active SCAR/polar **LETHAL** red zone (unbridged crevasse swarms or active thermal fissures), a **$+500\%$ cost penalty** (6.0× multiplier) is enforced to ensure the pathfinder prioritizes lateral diversions over direct transit.

#### 2. The Pathfinding Algorithm (A* Graph Search)

* **Admissible Heuristic**: $h(n) = \text{HaversineDistance}(n, \text{Goal}) \times 0.90$. The $0.90$ multiplier guarantees admissibility across all tailwind-boosted segments, ensuring optimality and minimal search expansions.
* **Adaptive Polar Search Lattice**: Rather than restricting paths to predefined waypoints, `buildAdaptiveSearchGraph` slices the great-circle corridor into 5 longitudinal layers with multi-tier lateral deviations ($\pm 20\text{ km}, \pm 40\text{ km}, \pm 70\text{ km}$). This empowers A* to discover smooth circumnavigation arcs around lethal hazard zones.
* **Telemetry Metadata**: The resulting route outputs comprehensive mission metrics: total distance, straight-line distance, detour delta ($\text{km}$), estimated travel time ($\text{minutes}$), maximum slope encountered, wind cost factor, list of specific danger zones avoided, total cost score, and cost reduction percentage over straight-line.

#### 3. Gemini Decision Layer (`gemini-3.8-flash`)

Once A* calculates the optimal route, the backend transmits the route telemetry to Google's Gemini API:

```text
You are a polar operations AI. Given this route data:
{
  "startLocation": "McMurdo Logistics Hub",
  "destination": "Amundsen-Scott South Pole Station",
  "totalDistanceKm": 1420.5,
  "straightLineDistanceKm": 1351.2,
  "distanceDetourKm": 69.3,
  "estimatedTravelTimeMinutes": 3550,
  "maxTempEncounteredC": -35,
  "windConditions": "20 kts HEADWIND (+25% cost)",
  "maxSlopeDegrees": 3.8,
  "hazardsAvoided": ["Beardmore Deep Crevasse Chasm"],
  "costSavingsPercent": 38
}

Write a 2-sentence tactical recommendation for the fleet commander. Highlight the biggest risk and why this route was chosen over the straight-line path.
```

* **Deterministic Fallback**: If `GEMINI_API_KEY` is not configured or in offline field scenarios, a deterministic tactical engine synthesizes mission recommendations highlighting cold-soak vitrification, slope conservatism, and hazard evasion.

#### 4. High-Tech Tactical UI & Glowing Polyline

* **Glowing Dual Polyline**: The resulting route renders directly on the 100% Google-free Leaflet map with a neon cyan ambient glow (`#00f2fe`, weight 9, opacity 0.5, CSS `.tactical-route-glow`) and an inner emerald dashed trajectory (`#10b981`, weight 3.5, dashArray `'8, 6'`, CSS `.tactical-route-core`).
* **Glassmorphic Recommendation Card (`.tactical-astar-glass`)**: Displays the 2-sentence Gemini tactical recommendation, mission distance breakdown, duration estimate, wind impact pill, avoided hazard tags, and one-click **"Accept Route"** and **"Recalculate"** buttons.
* **Waypoint Node Pins**: Animated tactical pips mark the origin, destination, and lateral diversion waypoints along the route.

---

## 🧩 Comprehensive Modules & Dependencies Reference

This system is built using a resilient, high-performance TypeScript stack tailored for real-time mission telemetry, low-latency device synchronization, GIS geospatial rendering, and sub-zero machine learning modeling.

---

### Production NPM Dependencies

Below is the complete inventory of all production packages declared in `package.json` under `"dependencies"`, along with their specific function and justification for selection:

| Module / Package | Version | Category | Primary Purpose & Selection Rationale |
| :--- | :--- | :--- | :--- |
| **`@google/genai`** | `^2.4.0` | AI / LLM Engine | **Official Google Gen AI TypeScript SDK**. Selected to execute server-side AI intelligence using `gemini-3.8-flash`. Powers tactical field reconnaissance, predictive failure analysis under -50°C cold-soak stress, dynamic blizzard heating forecast models, and autonomous zero-click S.A.R. dispatch. |
| **`express`** | `^4.21.2` | REST & HTTP Server | **Lightweight Node.js Backend Framework**. Chosen for its minimal memory footprint and high throughput. Handles REST endpoints (`/api/ai/*`, `/api/distress`), hosts the real-time WebSocket synchronization engine, and serves compiled static SPA assets in production. |
| **`ws`** | `^8.21.3` | Real-Time WebSockets | **High-Performance WebSocket Client/Server**. Chosen for low-latency bi-directional state synchronization between field smartphones and base station HQ consoles. Powers real-time Mayday distress broadcasts, terminal heartbeats, and live action log streaming. |
| **`leaflet`** | `^1.9.4` | GIS & Cartography | **Industry-Standard Open-Source Mapping Library**. Selected for rendering Antarctic & Arctic polar maps, custom expedition path polylines, interactive station shelter markers, and multi-tier sub-zero cold-soak heatmaps without external paid tile dependencies. |
| **`SCAR ADD v7.4`** | `ArcGIS REST` | Polar Vector Layers | **Antarctic Digital Database Integration**. Replaced Google Maps dependencies with high-precision vector overlays (coastlines, grounding lines, and research stations) from the Scientific Committee on Antarctic Research (SCAR) ArcGIS REST FeatureServer with client-side caching. |
| **`react`** | `^19.0.1` | Core UI Library | **Declarative Frontend Framework**. Chosen for its component-driven architecture and optimized virtual DOM diffing, enabling rapid telemetry re-renders across multi-pane polar command dashboards. |
| **`react-dom`** | `^19.0.1` | DOM Renderer | **React Rendering Engine**. Renders React component trees into browser DOM nodes. |
| **`recharts`** | `^3.10.1` | Telemetry Charts | **SVG Data Visualization Library**. Chosen for responsive telemetry charts displaying FFT vibration harmonics, sub-zero elastomer temperature stress curves, fuel burn trajectories, and battery discharge rates. |
| **`motion`** | `^12.23.24` | UI Motion & Animation | **Hardware-Accelerated Animation Engine** (formerly Framer Motion). Selected for smooth view transitions, radar sweep animations, entering effects, and modal dialog physics without blocking the main JavaScript thread. |
| **`lucide-react`** | `^0.546.0` | Tactical Iconography | **Vector Icon System**. Selected for clean, consistent UI iconography representing heavy crawlers (Snowcats, Twin Otters), sensors (SAR, AWOS, GPR), weather (chill, wind, blizzards), and emergency klaxons. |
| **`qrcode`** | `^1.5.4` | Device Pairing | **QR Code Generation Library**. Selected to generate high-density QR code data URLs on both server and client, enabling instant 1-scan smartphone pairing over LAN/WAN without manual IP entry. |
| **`dotenv`** | `^17.2.3` | Environment Config | **Environment Variable Loader**. Used in `server.ts` to securely load secrets (`GEMINI_API_KEY`, `PORT`) from `.env` files on the server-side without leaking API keys into client browser JavaScript bundles. |
| **`vite`** | `^6.2.3` | Build Tool & Dev Server | **Next-Generation Frontend Tooling**. Selected for ultra-fast HMR, ES module tree-shaking, and serving as integrated Express dev middleware with host-binding (`0.0.0.0:3000`). |
| **`@vitejs/plugin-react`** | `^5.0.4` | Vite React Plugin | **Vite React Integration**. Enables React Fast Refresh and JSX/TSX compilation inside Vite. |
| **`@tailwindcss/vite`** | `^4.1.14` | Styling Engine | **Tailwind CSS v4 Vite Plugin**. Enables zero-config, high-performance CSS compilation directly inside the Vite build pipeline. |

---

### Development Dependencies

Below is the inventory of development packages declared in `package.json` under `"devDependencies"`:

| Module / Package | Version | Primary Purpose & Selection Rationale |
| :--- | :--- | :--- |
| **`typescript`** | `~5.8.2` | **Static Type System**. Ensures strict compile-time type safety across complex glaciological records, multi-device WebSocket sync packets, and telemetry data models (`tsc --noEmit`). |
| **`tsx`** | `^4.21.0` | **Direct TypeScript Execution Engine**. Used in development (`npm run dev`) to execute `server.ts` directly with zero build delay or transpile overhead. |
| **`esbuild`** | `^0.25.0` | **High-Speed Bundler**. Used in production builds (`npm run build`) to bundle `server.ts` and its dependencies into a standalone CommonJS file (`dist/server.cjs`) for production runtime. |
| **`tailwindcss`** | `^4.1.14` | **Utility-First CSS Framework**. Provides rapid styling utilities for dark tactical HUD interfaces, responsive bento grids, and sub-zero color palettes with zero runtime CSS overhead. |
| **`autoprefixer`** | `^10.4.21` | **PostCSS CSS Parser**. Automatically adds vendor prefixes to CSS rules for cross-browser compatibility across legacy field laptops and mobile devices. |
| **`@types/express`** | `^4.17.21` | **TypeScript Definitions for Express**. Type definitions for Express request/response objects and router handlers. |
| **`@types/node`** | `^22.14.0` | **TypeScript Definitions for Node.js**. Type definitions for core Node.js modules (`fs`, `path`, `http`, `process`, `crypto`). |
| **`@types/ws`** | `^8.18.1` | **TypeScript Definitions for WebSocket**. Type definitions for WebSocket server and client instances. |
| **`@types/qrcode`** | `^1.5.6` | **TypeScript Definitions for QRCode**. Type definitions for canvas and data URL QR code generation. |
| **`@types/recharts`** | `^2.0.1` | **TypeScript Definitions for Recharts**. Type definitions for chart containers, tooltips, axes, and series components. |

---

### Frontend Component Modules

Located under `/src/components/`, these modular components encapsulate specific domain logic:

* **`Shell.tsx`**: Main application layout shell with topbar telemetry indicators, station status chips, quick action buttons, and side navigation menu.
* **`DashboardView.tsx`**: Primary operational HUD consolidating active expedition progress, research station headcounts, live AWOS weather tickers, predictive maintenance alerts, and the embedded Smart Route Optimizer.
* **`PolarGISMap.tsx` / `PolarGISMap.jsx`**: Core tactical GIS engine integrating SCAR Antarctic Digital Database (ADD v7.4) coastline and grounding line vector overlays, 100% Google-free polar basemaps (CartoDB Dark Matter, ESRI Polar, Tactical Deep `#060B18`), dynamic asset tracking, and progressive disclosure waypoints.
* **`PolarAttributionFooter.tsx`**: Persistent CC BY 4.0 SCAR ADD attribution component, accuracy disclaimer tooltip, live offline cache indicator, and dismissible Polar GNSS geometry warning badge with expandable HDOP/VDOP orbital telemetry drawer.
* **`RealMapView.tsx` / `PolarMap.tsx`**: Interactive Leaflet GIS cartography workstation with progressive disclosure telemetry, native spatial waypoint clustering, cubic coordinate interpolation, dynamic rotating heading vector vectors, station shelter markers, and multi-ring sub-zero cold pool heatmaps.
* **`addFeatureService.ts`**: ArcGIS REST FeatureServer fetcher for ADD v7.4 (`add_coastline_medium_res_line_v7_4`), offset-based paged streaming (`resultOffset`), IndexedDB/localStorage offline persistence, and offline fallback datasets.
* **`tacticalMapTracking.ts`**: Geodesic forward azimuth calculation (`calculateBearing`), screen-space spatial clustering (`clusterTacticalWaypoints`), and smooth `requestAnimationFrame` position interpolation controller (`SmoothMarkerTracker`).
* **`useDynamicTracking.ts`**: Custom real-time tracking hook featuring a 2D Kalman filter for polar GPS jitter compensation, 60 FPS cubic ease-out marker interpolation, heading indicators, and polar GNSS geometry telemetry modeling (HDOP, VDOP, satellite elevation angles).
* **`SmartRouteOptimizer.tsx`**: Satellite computer vision pathfinder avoiding crevasse chasms and katabatic squall corridors. Dynamically computes safe blue-ice bypasses and pushes waypoints to crawler navigation units.
* **`PredictiveMaintenance.tsx`**: Mechanical cold-soak stress simulator (-50°C) modeling elastomer rubber vitrification, belt failure risk, oil viscosity degradation, and 1-click preventive service execution.
* **`DynamicWeatherInventory.tsx`**: Blizzard fuel consumption forecaster calculating exponential thermal heating surges, automatic safety buffer adjustments, and automated supply ship dispatches.
* **`AiActionLogsPanel.tsx`**: Live scrolling telemetry feed displaying real-time autonomous AI actions with domain category filters (Logistics, Power, Maintenance, SAR, Weather).
* **`PreBootSystemCheck.tsx`**: Retro-tactical terminal POST diagnostic suite verifying hardware sensors, power microgrids, and satellite uplinks before console boot.
* **`EmergencyModal.tsx` & `ActiveDistressBanner.tsx`**: Full-screen Mayday distress alert system with audible two-tone klaxons, tactical override controls, and zero-click automated S.A.R. scramble triggers.
* **`DevicePairingModal.tsx`**: QR code pairing modal enabling instant multi-node mobile smartphone connection over local networks or public tunnels.
* **`ApiKeyModal.tsx`**: Resource optimization console and Gemini API key management workstation with real-time token savings metrics and cache purge controls.
* **`Modules.tsx`**: Comprehensive enterprise data management views:
  - **Personnel**: Expedition rosters, medical clearances, and polar survival badges.
  - **Fleet Assets**: PistenBully crawlers, Twin Otter ski-planes, coring rigs, and mobile shelter pods.
  - **Inventory & Consumables**: Arctic diesel (F-34/JP-8), Jet-A1, rations, and hypothermia kits.
  - **Shipments & Logistics**: Icebreaker supply ship voyages, cargo manifests, and ETA tracking.
  - **Transportation**: Traverse convoy schedules and vehicle deployment.
  - **Tasks**: Station maintenance checklists and field work items.
* **`ExpeditionsView.tsx`**: In-depth traverse planning studio with sequential waypoint cards, elevation profiles, distance progression trackers, and crew assignments.
* **`ViewsPart2.tsx`**: Secondary command modules:
  - **Alerts & Notifications**: Real-time and historical alert center featuring `[⚡ Auto-Resolved by AI]` self-healing tags.
  - **AI Cleared Work Logs**: Immutable forensic audit log archive storing completed maintenance and cleared work items.
  - **Reports**: Mission summaries and field environmental logs.
  - **Financial Expenses**: Polar expedition operational budget tracking.
  - **System Audit Inspector**: Detailed cryptographic audit ledger modal.

---

### Custom React Hooks & Telemetry Services

Located under `/src/hooks/` and `/src/utils/`:

* **`useGeolocation.ts`**: High-accuracy device GPS tracking hook with reverse geocoding, speed estimation, altitude calculation, and IP location fallback.
* **`useRealtimeWeather.ts`**: Open-Meteo AWOS weather integration hook fetching real-time temperatures, apparent wind chill, katabatic wind velocity, barometric pressure, and WMO precipitation codes for all polar stations.
* **`usePolarSync.ts`**: Multi-client state synchronization hook managing WebSocket connection states, terminal heartbeats, mutual Mayday broadcasts, and optimistic state updates.
* **`weatherHazards.ts`**: Glaciological hazard evaluation engine calculating lethal cold-soak thresholds (<12m human survival limit), katabatic vehicle roll risks, whiteout visibility loss, and aviation flyability ratings.
* **`dangerZones.ts`**: Heatmap radius and gradient calculation engine mapping sub-zero cold pools and katabatic shear funnels onto GIS basemaps.
* **`audioAlert.ts`**: Web Audio API synthesizer generating tactical terminal bleeps, dispatch confirmation chimes, and emergency klaxon sirens without external sound files.

---

### Server-Side Backend & API Modules

Located in `server.ts`:

* **`AiOptimizationEngine`**: In-memory LRU cache, concurrent request coalescer, and prompt compression engine that reduces Gemini API token usage by 40-60%.
* **Predictive Maintenance API (`POST /api/ai/predictive-maintenance`)**: Evaluates machine operating hours against -50°C cold-soak physical stress models using Gemini 3.8 Flash.
* **Zero-Click S.A.R. API (`POST /api/ai/sar/dispatch-crevasse-fall`)**: Computes geodesic Haversine distance to nearest research stations and scrambles thermal FLIR drones and tracked extraction teams automatically.
* **Weather Inventory API (`POST /api/ai/weather-inventory/evaluate`)**: Ingests 3-day blizzard forecasts, projects thermal fuel burn surges (+290%), and raises minimum stock buffers dynamically.
* **Smart Route API (`POST /api/ai/smart-route/optimize`)**: Ingests live device coordinates and satellite radar void detections to output safe blue-ice bypass corridors.
* **WebSocket Server (`ws://`)**: Handles zero-latency terminal synchronization, cross-device Mayday alarms, and heartbeat monitoring across HQ consoles and mobile phones.

---

---

## 📱 Connecting Mobile Phones & Field Devices

The system includes a zero-configuration, free, built-in WebSocket & REST synchronization server that connects mobile field smartphones directly to base station HQ consoles:

### 1-Click QR Code Pairing Flow

1. **Open HQ Console**: Launch the workstation on your laptop or desk terminal.
2. **Click "PAIR PHONE"**: Click **PAIR PHONE** or the live connection status badge in the top bar.
3. **Scan QR Code**: A modal displays a live, high-resolution QR code generated directly for your server's local or network IP address.
4. **Instant Multi-Device Sync**: Scan the QR code using any smartphone camera (iOS / Android) or tablet connected to the same Wi-Fi network, cellular data, or satellite Wi-Fi hotspot.
5. **Real-Time Terminal Roster**: The top bar updates to `LIVE SYNC: 2 NODES ONLINE`. The **Active Terminals Roster** displays both `Base Station HQ Console` and `Mobile Phone Field Unit` with live heartbeat indicators.
6. **Field Distress Escalation**: Transmit Mayday alerts from the field phone. The base station laptop will instantly sound a two-tone klaxon alarm, highlight the distress sector on the map, and allow dispatchers to scramble SAR assets with instant status updates sent back to the field phone.

---

## 🌐 Exposing Field Consoles over Public Internet (ngrok Usage)

When operating field units outside your local Wi-Fi subnet (e.g. over cellular 4G/5G, Starlink satellite hotspots, or remote field camps), mobile smartphones cannot directly reach local LAN IP addresses (like `192.168.1.X`). 

Using **ngrok**, you can securely tunnel your local Polar Operations server (port `3000`) to a public HTTPS domain in seconds, enabling global real-time WebSocket state synchronization and Mayday SOS alerting.

### Step-by-Step ngrok Guide

#### 1. Install ngrok
Install ngrok on your HQ base station laptop or workstation:

- **macOS (Homebrew)**:
  ```bash
  brew install ngrok/ngrok/ngrok
  ```
- **Windows (winget / Chocolatey)**:
  ```bash
  winget install ngrok.ngrok
  ```
- **Linux (Debian / Ubuntu)**:
  ```bash
  curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list && sudo apt update && sudo apt install ngrok
  ```
- **NPM Global (Alternative)**:
  ```bash
  npm install -g ngrok
  ```

#### 2. Authenticate ngrok (One-Time Setup)
Create a free account at [ngrok.com](https://ngrok.com) and set your authtoken:
```bash
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
```

#### 3. Start the Polar Operations Server
In your terminal, launch the application:
```bash
npm run dev
```
*(Confirms server running at `http://localhost:3000`)*

#### 4. Launch the ngrok Secure Tunnel
In a second terminal window, expose port `3000`:
```bash
ngrok http 3000
```

ngrok will output a session status screen containing a public HTTPS URL:
```text
Session Status        online
Account               Polar Field Ops (Plan: Free)
Forwarding            https://a1b2-34-56-78-90.ngrok-free.app -> http://localhost:3000
```

#### 5. Connect Remote Smartphones & Satellite Devices
1. Copy the public URL (e.g., `https://a1b2-34-56-78-90.ngrok-free.app`).
2. Paste this URL into browser address bars on remote smartphones, satellite tablets, or off-site command centers.
3. The app automatically detects secure HTTPS/WSS origin and negotiates WebSocket connections (`wss://a1b2-34-56-78-90.ngrok-free.app/ws`), maintaining sub-second telemetry synchronization across cellular or satellite links worldwide.

---

### 🛠️ Troubleshooting ngrok Permission Issues

If you encounter permission denied or authorization errors when installing or executing ngrok, follow these quick fixes:

#### Fix 1: `EACCES: permission denied` during `npm install -g ngrok`
If npm global installation fails due to folder permissions on macOS or Linux:

- **Option A (Zero-install via npx)**: Run ngrok directly without global installation:
  ```bash
  npx ngrok http 3000
  ```
- **Option B (Fix npm permissions)**: Use `--unsafe-perm` flag or change npm default directory:
  ```bash
  sudo npm install -g ngrok --unsafe-perm=true
  ```
- **Option C (Recommended Package Manager)**: Avoid npm for binary tools and install directly via Homebrew / apt:
  ```bash
  # macOS
  brew install ngrok/ngrok/ngrok

  # Linux (Debian/Ubuntu)
  sudo apt update && sudo apt install ngrok
  ```

#### Fix 2: `permission denied` or `EACCES` when running `ngrok` executable
If the ngrok binary lacks execution permissions:

```bash
# Grant execution permissions to the ngrok binary
chmod +x ./ngrok
# Or if installed in /usr/local/bin:
sudo chmod +x /usr/local/bin/ngrok
```

#### Fix 3: Config file ownership issues (`ngrok config add-authtoken`)
If `ngrok config` fails with `Failed to save configuration file: permission denied` (often caused by running ngrok with `sudo` previously):

```bash
# Fix ownership of the ~/.config/ngrok configuration directory
sudo chown -R $(whoami) ~/.config/ngrok
# Or on older Linux setups:
sudo chown -R $(whoami) ~/.ngrok2
```

#### Fix 4: Port 3000 Access & Firewall Warnings (`ERR_NGROK_108`)
If ngrok connects but displays `ERR_NGROK_108` or `connection refused`:
1. Ensure `npm run dev` is running **before** launching ngrok.
2. Ensure you specify the target explicitly if localhost loopback is restricted:
   ```bash
   ngrok http http://127.0.0.1:3000
   ```
3. Allow `ngrok` through your OS Firewall (macOS Security & Privacy or Windows Defender Firewall) when prompted.

#### Fix 5: Vite "Blocked request. This host is not allowed" (`allowedHosts`)
If Vite blocks incoming ngrok HTTP requests with `Blocked request. This host ("*.ngrok-free.app") is not allowed`:
- This project has pre-configured `server.allowedHosts: true` in `vite.config.ts` to permit ngrok, localtunnel, and cloudflared domains automatically.
- If editing a custom `vite.config.ts`, ensure `allowedHosts: true` (or `allowedHosts: ['.ngrok-free.app', '.ngrok.io']`) is set under `server`:
  ```typescript
  // vite.config.ts
  export default defineConfig({
    server: {
      allowedHosts: true, // Permits ngrok, localtunnel, and satellite tunnel hosts
    },
  });
  ```

#### Fix 6: Alternative Zero-Permission Tunnels
If your environment strictly restricts installing binaries or running ngrok:

- **Localtunnel (Node.js)**:
  ```bash
  npx localtunnel --port 3000
  ```
- **Cloudflare Tunnel (`cloudflared`)**:
  ```bash
  npx cloudflared tunnel --url http://localhost:3000
  ```

---

## 📡 Connecting External Hardware GPS Modules

The Polar Expedition System supports multiple methods for connecting mobile phones and field laptops to external, high-precision GPS/GNSS hardware modules (such as **Garmin GLO 2**, **Bad Elf Flex / GPS Pro**, **Dual XGPS160**, **u-blox NEO-M8N/M9N**, or **GlobalSat BU-353-S4**).

---

### 1. Mobile Device On-Board GPS

The application automatically utilizes the mobile phone or tablet's built-in GNSS receiver (A-GPS, GLONASS, Galileo, BeiDou) via the standard HTML5 Geolocation API (`navigator.geolocation.watchPosition`):

1. Open the application on your phone's browser (Safari, Chrome, Firefox).
2. Tap **"Enable GPS"** or tap the **"Locate Me"** crosshair icon on the map.
3. Allow browser location permissions.
4. Your field position, speed, and heading will update continuously on the tactical map.

---

### 2. External Bluetooth GPS Receivers (Android & iOS)

For high-accuracy RTK / sub-meter positioning in extreme polar environments, pair a high-sensitivity Bluetooth GPS receiver to your mobile phone:

#### **On Android Devices:**
1. **Pair Receiver**: Pair your Bluetooth GPS module (e.g., Garmin GLO 2 or Dual XGPS) in Android Bluetooth Settings.
2. **Install Mock Location App**: Install a free Bluetooth GPS bridge app like **Bluetooth GPS**, **GPS Connector**, or **Lefebure NTRIP Client** from Google Play.
3. **Enable Mock Locations**:
   - Go to Android Settings ➔ Developer Options ➔ **Select mock location app**.
   - Select your installed Bluetooth GPS app.
4. **Connect**: Open the Bluetooth GPS app and connect to your Bluetooth GPS receiver.
5. **Launch Polar App**: Open the Polar Expedition console in Chrome on your phone. The browser's native location feed will now seamlessly receive high-accuracy, high-frequency position data from your external Bluetooth GPS module!

#### **On iOS / iPadOS Devices:**
1. **MFi-Certified Receivers**: Connect Apple MFi-certified GPS receivers (such as **Bad Elf GPS Pro/Flex** or **Dual XGPS150A/160**) via iOS Bluetooth settings.
2. iOS automatically replaces the internal location provider system-wide with the external high-accuracy GNSS fix.
3. Open the Polar Expedition web app in Safari—high-precision coordinates will stream directly into the map and Mayday distress beacon!

---

### 3. USB/Serial Hardware GPS Modules (Web Serial API)

If you have a USB GPS dongle or RS-232 serial GPS receiver (e.g., u-blox, GlobalSat BU-353, FTDI serial adapter) plugged directly into a laptop, Toughbook, or Android tablet via USB-OTG, you can stream raw **NMEA 0183** sentences directly into the app using the **Web Serial API** (`navigator.serial`):

#### Supported NMEA Sentences:
- `$GPGGA` / `$GNGGA`: Latitude, Longitude, Fix Quality, Altitude, Satellites Tracked
- `$GPRMC` / `$GNRMC`: Latitude, Longitude, Ground Speed, True Course Bearing
- `$GPGLL`: Latitude and Longitude coordinates

#### JavaScript Web Serial Reader Example:
```typescript
// Sample Web Serial NMEA 0183 Receiver Integration
async function connectUsbGpsModule() {
  if (!('serial' in navigator)) {
    alert('Web Serial API not supported in this browser. Please use Chrome or Edge.');
    return;
  }

  // Request user to select the connected USB GPS serial port
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 4800 }); // Standard NMEA 0183 baud rate (4800 or 9600)

  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  const reader = textDecoder.readable.getReader();

  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('$GPGGA') || line.startsWith('$GNRMC')) {
        parseNmeaSentence(line.trim());
      }
    }
  }
}

function parseNmeaSentence(nmea: string) {
  const parts = nmea.split(',');
  if (parts[0].endsWith('GGA') && parts[6] !== '0') {
    const rawLat = parseFloat(parts[2]);
    const latDir = parts[3];
    const rawLng = parseFloat(parts[4]);
    const lngDir = parts[5];

    // Convert NMEA DDMM.MMMM format to Decimal Degrees
    let lat = Math.floor(rawLat / 100) + (rawLat % 100) / 60;
    if (latDir === 'S') lat = -lat;

    let lng = Math.floor(rawLng / 100) + (rawLng % 100) / 60;
    if (lngDir === 'W') lng = -lng;

    const altitudeM = parseFloat(parts[9]);

    console.log(`[NMEA GPS FIX] Lat: ${lat.toFixed(4)}°, Lng: ${lng.toFixed(4)}°, Elev: ${altitudeM}m`);
    // Pass coordinates to Polar Operations state / map marker
  }
}
```

---

### 4. NMEA-over-IP & Satellite / Cellular Telemetry Streams

For long-range field vehicles, crawlers, and vessel tracking systems (e.g., **Iridium Edge**, **AIS receivers**, or **ESP32/Raspberry Pi** satellite modems), send telemetry directly to the Polar Operations Server HTTP REST endpoint:

#### HTTP Telemetry Payload (`POST /api/action`):

```bash
curl -X POST http://YOUR_SERVER_IP:3000/api/action \
  -H "Content-Type: application/json" \
  -d '{
    "action": "ADD_WAYPOINT",
    "payload": {
      "expeditionId": "exp-trans-antarctic",
      "waypoint": {
        "id": "wp-telemetry-01",
        "name": "Live Vehicle Position (NMEA-IP)",
        "lat": -82.4152,
        "lng": 138.2104,
        "elevationM": 2450,
        "distanceFromPrevKm": 42,
        "passed": false,
        "hazardNote": "SATCOM Fix via Iridium Short Burst Data"
      }
    }
  }'
```

---

## 💻 Programmatic Integration (React)

You can import components directly into any React 18+ application:

```tsx
import React from 'react';
import { 
  PolarMap, 
  AssetManagement, 
  ExpeditionTracker,
  INITIAL_STATIONS, 
  INITIAL_ASSETS 
} from 'polar-expedition-asset-management';

export function OperationsCenter() {
  return (
    <div className="w-full min-h-screen bg-slate-950 text-white">
      <PolarMap 
        region="antarctica"
        stations={INITIAL_STATIONS}
        assets={INITIAL_ASSETS}
        expeditions={[]}
        customWaypoints={[]}
      />
    </div>
  );
}
```

---

## 🛠️ NPM Scripts & CLI Usage

All development, production, packaging, and mobile targets are mapped directly in [`package.json`](./package.json):

| Command | Target / Layer | Description |
| :--- | :--- | :--- |
| `npm run dev` | Web & API | Starts Vite frontend dev server and Express/WebSocket backend at `http://localhost:3000` with hot module replacement (HMR). |
| `npm run build` | Web & Backend | Builds the optimized frontend bundle into `dist/` and compiles `server.ts` into `dist/server.cjs`. |
| `npm run start` | Web Server | Boots the compiled production Node.js Express server (`node dist/server.cjs`). |
| `npm run lint` | TypeScript | Performs strict type verification across the entire project (`tsc --noEmit`). |
| `npm run pack:check` | NPM Package | Verifies the published NPM package tarball payload. |
| `npm run tauri` | Tauri CLI | Invokes the Tauri 2 CLI toolchain directly. |
| `npm run tauri:dev` | Desktop Dev | Boots the native desktop application shell in development mode with live frontend reloading. |
| `npm run tauri:build` | Desktop Build | Builds the optimized production native desktop executable (`src-tauri/target/release/polaris-ops`). |
| `npm run tauri:build:deb` | Debian / Ubuntu | Packages the native desktop application into a Debian archive (`src-tauri/target/release/bundle/deb/polaris-ops_1.0.0_amd64.deb`). |
| `npm run tauri:build:appimage`| Universal Linux | Packages the application into a distribution-independent portable AppImage (`src-tauri/target/release/bundle/appimage/polaris-ops_1.0.0_amd64.AppImage`). |
| `npm run tauri:android:init` | Android Setup | Initializes the native Android Gradle project in `src-tauri/gen/android`. |
| `npm run tauri:android:dev` | Android Dev | Boots the application in the Android Emulator or on a connected USB Debugging device. |
| `npm run tauri:android:build` | Android Release | Compiles the standalone Release APK and Google Play App Bundle (AAB). |
| `npm run tauri:ios:init` | iOS Setup | Initializes the Xcode workspace in `src-tauri/gen/ios` (macOS host required). |
| `npm run tauri:ios:dev` | iOS Dev | Runs the mobile app in the iOS Simulator or on an attached iPhone/iPad (macOS host required). |
| `npm run tauri:ios:build` | iOS Release | Compiles the production iOS application archive (macOS host required). |

---

## 📡 Hardware Integration Matrix

The Polar Expedition System provides tiered hardware communication across all supported targets:

| Hardware Integration | Web Browser | Linux Desktop | Windows Desktop | macOS Desktop | Android Mobile | iOS Mobile | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **HTML5 Geolocation (A-GPS)** | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Supported | High-precision position fix via OS location subsystem. |
| **USB / Serial NMEA 0183** | ✅ Chrome/Edge | ✅ Supported | ✅ Supported | ✅ Supported | ⚠️ USB-OTG Host | ❌ Unsupported | Consumes raw `$GPGGA`, `$GPRMC`, and `$GPGLL` via Web Serial API. |
| **Bluetooth GPS (Garmin/Dual)**| ⚠️ Web Bluetooth | ⚠️ OS Paired | ⚠️ OS Paired | ⚠️ OS Paired | ✅ Mock Provider | ✅ MFi System | Direct mock location bridge on Android; MFi system-wide fix on iOS. |
| **NMEA-over-IP (SATCOM/UDP)** | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Supported | Rest/JSON telemetry push to `POST /api/action` via Iridium/cellular. |
| **Acoustic Audio Synthesizer** | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Supported | Procedural Web Audio API sound generation (chirps, Mayday klaxons). |
| **Haptic Feedback** | ❌ Unsupported | ❌ Unsupported | ❌ Unsupported | ❌ Unsupported | ✅ Supported | ✅ Supported | Tactile vibration alert triggers on Mayday distress broadcast. |

---

## 🔑 Environment Configuration

The system maintains a strict separation between **Client-Safe Configuration** and **Server-Only Secrets**:

```text
                     Configuration Boundary
    Client / Public (.env)             Server-Only (.env / Secret Vault)
┌─────────────────────────────┐       ┌─────────────────────────────────┐
│ VITE_API_BASE_URL           │       │ GEMINI_API_KEY                  │
│ PORT                        │       │ DATABASE_PATH                   │
│ ALLOW_SIMULATION_MODE       │       │ SESSION_SIGNING_SECRET          │
└─────────────────────────────┘       └─────────────────────────────────┘
```

### 1. Client-Safe Public Configuration
These variables are safe to embed in compiled frontend and Tauri bundles:
```env
# Centralized API Gateway URL
# For Android APK / Remote Field Deployment: set to your active HTTPS ngrok URL
VITE_API_BASE_URL=https://YOUR-NGROK-SUBDOMAIN.ngrok-free.app

# For Local Browser Development (.env.development automatically provides):
# VITE_API_BASE_URL=http://localhost:3000

# Backend Web Server Port (defaults to 3000)
PORT=3000
```

### 2. Server-Only Secrets
> [!CAUTION]
> **NEVER BUNDLE SECRETS IN CLIENT EXECUTABLES**: Server-side secrets must reside strictly on the server host or backend container. They must never be checked into git or compiled into client JavaScript bundles.
```env
# Server-side Gemini 3.8 Flash API Key (for Recon & SAR analysis)
GEMINI_API_KEY=AIzaSy...

# Authoritative ACID Database Storage Path (defaults to ./data/polar-database.json)
DATABASE_PATH=./data/polar-database.json
```

---

## 🚨 Troubleshooting & Diagnostics Guide

The application incorporates built-in diagnostics (`src-tauri/src/lib.rs` and `src/utils/api.ts`). Use the following table to diagnose and resolve operational issues:

### 1. Backend Unreachable / Connection Refused
- **Symptoms**: HUD displays `CACHED / OFFLINE`, "Failed to fetch /api/health", red connection dot.
- **Root Cause**: The Express backend is not running, firewall is blocking port 3000, or the Operations Gateway URL is incorrect.
- **Remediation**:
  1. Verify the backend process is running: `npm run dev` or `node dist/server.cjs`.
  2. Open the **Operations Gateway HUD** (HardDrive icon in top nav) and tap **"Test Link"**.
  3. Ensure the gateway URL matches your base station IP (e.g., `http://192.168.1.150:3000` or `https://server.domain`).
  4. Ensure port 3000 is open in your host firewall: `sudo ufw allow 3000/tcp` (Ubuntu) or `sudo firewall-cmd --add-port=3000/tcp --permanent` (Fedora/RHEL).

### 2. WebSocket Telemetry Disconnected
- **Symptoms**: Live rover movement stops; HUD shows `RECONNECTING` with a yellow pulse.
- **Root Cause**: Proxy blocking WebSocket upgrades, SATCOM link drop, or network interface transition.
- **Remediation**:
  - The client automatically executes exponential backoff reconnection attempts every 2-5 seconds.
  - If using a reverse proxy (Nginx/Traefik), ensure `Upgrade: $http_upgrade` and `Connection: "upgrade"` headers are forwarded.

### 3. Database Unavailable / Schema Corruption
- **Symptoms**: Login returns `500 Internal Server Error`; server logs show `EACCES` or database parse failure.
- **Root Cause**: Permissions on `./data` directory or truncated JSON file.
- **Remediation**:
  1. Ensure the backend process has write access to `./data`: `chmod 755 ./data && chmod 644 ./data/*.json`.
  2. If the database file is corrupted, the server automatically creates a `.bak` backup and re-seeds clean demo accounts on restart.

### 4. Gemini AI Unavailable / Over-Quota
- **Symptoms**: Route optimization or SAR dispatch logs report "Gemini 3.8 Flash unavailable; fallback engaged".
- **Root Cause**: Invalid `GEMINI_API_KEY`, quota exhaustion, or offline network state.
- **Remediation**:
  - The application automatically engages **Deterministic Route Fallback** (A* Polar heuristic) without failing or stalling.
  - Station operators can update their API key at runtime via the **API Key Config** modal (`ApiKeyModal.tsx`).

### 5. GPS Permission Denied or Unavailable
- **Symptoms**: Map reports "Location acquisition error (code 1)"; asset marker does not center.
- **Root Cause**: Browser/OS location permission declined or GPS hardware missing.
- **Remediation**:
  - In browser: Click the lock icon in the browser address bar ➔ Site Settings ➔ Location ➔ **Allow**.
  - In Linux: Ensure geoclue is installed and running (`sudo systemctl start geoclue`).
  - In Android: Settings ➔ Apps ➔ Polaris Ops ➔ Permissions ➔ Location ➔ **Allow while using app**.
  - Alternatively, connect an external USB NMEA module or stream via NMEA-over-IP.

### 6. Linux WebView2 / WebKitGTK Missing
- **Symptoms**: `npm run tauri:dev` fails with `Package webkit2gtk-4.1 was not found in the pkg-config search path`.
- **Remediation**:
  - Arch Linux: `sudo pacman -S webkit2gtk-4.1`
  - Debian / Ubuntu: `sudo apt install libwebkit2gtk-4.1-dev`

### 7. Android Device Not Detected
- **Symptoms**: `npm run tauri:android:dev` fails with `No target device found`.
- **Remediation**:
  1. Enable **Developer Options** and **USB Debugging** on the Android device.
  2. Verify adb sees the device: `adb devices`.
  3. Ensure USB udev rules are installed on Linux: `sudo pacman -S android-udev` (Arch) or `sudo apt install android-sdk-platform-tools-common` (Ubuntu).

### 8. Stale Cached Application Data
- **Symptoms**: UI reflects outdated mission state after reconnecting to a new expedition.
- **Remediation**:
  - Open the **Operations Gateway HUD** modal and click **"Clear Local Offline Cache"**.
  - The client will flush IndexedDB/LocalStorage state and re-synchronize clean snapshots from the server.

---

## 🏗️ Technical Development Architecture

```text
React 18 + TypeScript + Tailwind
               │
               ▼
             Vite 6
               │
        ┌──────┴──────┐
        ▼             ▼
   Web Browser     Tauri 2 Shell
   (SPA/PWA)          │
                      ▼
               Rust Native Layer (IPC)
               ├── OS Metadata & Diags
               ├── Offline Storage Snapshots
               ├── Native Notifications
               └── Secure Credential Vault
                      │
   ┌──────────────────┼──────────────────┐
   ▼                  ▼                  ▼
Linux (Arch/Deb)   Windows / macOS    Android / iOS
Desktop Workstation Native Installers Mobile Terminals
   │                  │                  │
   └──────────────────┼──────────────────┘
                      │ HTTPS & WSS (Configurable Operations Gateway)
                      ▼
             Express 4 Web Server
             ├── Authoritative RBAC (/api/auth)
             ├── Server-Side Gemini 3.8 Flash (/api/ai)
             ├── WebSocket Real-Time Telemetry Hub (/ws)
             └── Mission Action Logger (/api/action)
                      │
                      ▼
             ACID Shared Database
             (./data/polar-database.json)
```

---

## 📄 License

MIT © International Polar Expedition Consortium

