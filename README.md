# 🏔️ Polar Expedition & Asset Management System

[![npm version](https://img.shields.io/npm/v/polar-expedition-asset-management.svg?style=flat-square)](https://www.npmjs.com/package/polar-expedition-asset-management)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

A mission-critical tactical operations console and real-time telemetry workstation engineered for Antarctic and Arctic expeditions, high-latitude research outposts, heavy traverse crawlers, extreme-cold aviation, and field Mayday distress coordination.

---

## 📋 Table of Contents

- [🚀 Quick Start](#-quick-start)
  - [🛠️ Troubleshooting NPM `EALLOWSCRIPTS` / `--allow-scripts` Error](#️-troubleshooting-npm-eallowscripts---allow-scripts-error)
- [🎨 Unified Polar Operations Design System & Frontend Architecture](#-unified-polar-operations-design-system--frontend-architecture)
- [🔐 Polar Ops Console Authentication & Role-Based Access Control](#-polar-ops-console-authentication--role-based-access-control)
- [✨ Key Operational Views & Features](#-key-operational-views--features)
- [🔥 Sub-Zero Danger Zone Heatmap & Polar GIS](#-sub-zero-danger-zone-heatmap--polar-gis)
- [🛠️ AI Predictive Maintenance System (-50°C Cold-Soak Modeling)](#️-ai-predictive-maintenance-system--50c-cold-soak-modeling)
- [⚡ Automated S.A.R. (Search and Rescue) Dispatch (Zero-Click AI Response)](#-automated-sar-search-and-rescue-dispatch-zero-click-ai-response)
- [❄️ Dynamic Weather-Based Inventory Consumption (Blizzard Heating Model)](#️-dynamic-weather-based-inventory-consumption-blizzard-heating-model)
- [🛰️ Smart Route Optimization (Satellite Computer Vision Pathfinding)](#️-smart-route-optimization-satellite-computer-vision-pathfinding)
- [⚡ API Key Optimization & Resource Conservation Engine](#-api-key-optimization--resource-conservation-engine)
- [🤖 AI Action Logs (Live Streaming Autonomous Action Feed)](#-ai-action-logs-live-streaming-autonomous-action-feed)
- [⚡ Auto-Resolved by AI Alert System (Self-Healing Autonomous Operations)](#-auto-resolved-by-ai-alert-system-self-healing-autonomous-operations)
- [🧹 AI Automated Work Clearing & Forensic Action Logging](#-ai-automated-work-clearing--forensic-action-logging)
- [🖥️ Pre-Boot System Check (Terminal-Style Hardware & Telemetry POST)](#️-pre-boot-system-check-terminal-style-hardware--telemetry-post)
- [🎮 Mission Simulation & Operator Training Mode](#-mission-simulation--operator-training-mode)
- [📍 Waypoint Tracing & Live Route Telemetry on Map](#-waypoint-tracing--live-route-telemetry-on-map)
- [🤖 Gemini-Powered Waypoint Route Optimization](#-gemini-powered-waypoint-route-optimization)
- [🧩 Comprehensive Modules & Dependencies Reference](#-comprehensive-modules--dependencies-reference)
  - [Production NPM Dependencies](#production-npm-dependencies)
  - [Development Dependencies](#development-dependencies)
  - [Frontend Component Modules](#frontend-component-modules)
  - [Custom React Hooks & Telemetry Services](#custom-react-hooks--telemetry-services)
  - [Server-Side Backend & API Modules](#server-side-backend--api-modules)
- [📱 Connecting Mobile Phones & Field Devices](#-connecting-mobile-phones--field-devices)
- [🌐 Exposing Field Consoles over Public Internet (ngrok Usage)](#-exposing-field-consoles-over-public-internet-ngrok-usage)
  - [Step-by-Step ngrok Guide](#step-by-step-ngrok-guide)
  - [🛠️ Troubleshooting ngrok Permission Issues](#️-troubleshooting-ngrok-permission-issues)
- [📡 Connecting External Hardware GPS Modules](#-connecting-external-hardware-gps-modules)
  - [1. Mobile Device On-Board GPS](#1-mobile-device-on-board-gps)
  - [2. External Bluetooth GPS Receivers](#2-external-bluetooth-gps-receivers-android--ios)
  - [3. USB/Serial Hardware GPS Modules (Web Serial API)](#3-usbserial-hardware-gps-modules-web-serial-api)
  - [4. NMEA-over-IP & Satellite / Cellular Telemetry Streams](#4-nmea-over-ip--satellite--cellular-telemetry-streams)
- [💻 Programmatic Integration (React)](#-programmatic-integration-react)
- [🛠️ NPM Scripts & CLI Usage](#️-npm-scripts--cli-usage)
- [🔑 Environment Configuration](#-environment-configuration)
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

## ✨ Key Operational Views & Features

| View | Capabilities |
| :--- | :--- |
| **🔐 Polar Ops Console Auth** | Glassmorphic tactical authentication portal with multi-radial lighting (`#7C3AED`, `#60A5FA`), role-based access for Researcher, Asset Management, and Transportation, server-side authorization enforcement, and forensic session auditing. |
| **📊 Polar Operations Command Center** | Information-dense polar operations dashboard featuring live mission progress, environmental telemetry, crawler fleet readiness, active AI recommendations, and embedded real-time AI action logs. |
| **🌡️ Live Operations & Environmental Telemetry** | Dedicated AWOS meteorological workstation: ambient temperature, katabatic wind velocity, barometric pressure, wind chill indexes, and real-time frostbite hazard calculations. |
| **🧭 Polar Map & Geospatial GIS** | Dual-projection cartography with Leaflet GIS and stereographic radar. Real-time GPS device tracking, interactive coordinate pinning, danger zone overlays, and custom base commissioning. |
| **🤖 AI Predictive Maintenance** | Pre-failure machine learning forecaster modeling severe polar cold-soak (-50°C) stress, elastomer vitrification curves, vibration harmonics (FFT), and parts pre-allocation to avert field breakdowns. |
| **🔥 Danger Zone Heatmap** | Dynamic multi-ring gradient heatmap overlay visualizing sub-zero cold pools, katabatic shear funnels, human survival windows (<12m lethal threshold), and Arctic diesel fuel waxing perimeters. |
| **📍 Waypoint Planner Studio** | Clean split-pane interface to pin, edit, and step sequential waypoints (+50km auto-advance). Features 1-click map pinning, instant card removals, and GPX navigation file exports. |
| **🛰️ Smart Route Optimization (Satellite CV)** | High-resolution satellite computer vision engine detecting shifting ice shelves and active crevasse hazards; recalculates daily safe bypass corridors for 28-ton heavy supply trucks and pushes waypoints directly to crawler GPS terminals. |
| **⚡ Automated S.A.R. Mission Console** | Autonomous Search & Rescue command workstation: upon distress beacon reception (e.g., Crevasse Fall), the engine automatically computes the nearest base, assesses weather flyability, and dispatches Drone Falcon-X and tracked extraction teams with zero human latency. |
| **❄️ Dynamic Weather Inventory Engine** | AI weather forecasting reader: predicts 3-day severe blizzard impact (-48°C, 95 km/h winds), models exponential heater burn surge (500L/day → 1,450L/day), dynamically elevates minimum stock safety buffer (4,000L → 8,500L), and dispatches early supply ship orders to MV Vasiliy Golovnin. |
| **🚨 Mayday Distress & Emergency Broadcast** | Bi-directionally synchronized Mayday alarm system. Transmit field distress alerts from mobile phones; trigger audible klaxon alarms and automated SAR scramble protocols on HQ laptops. |
| **📻 Tactical Dispatch Logbook & AI Recon** | Tactical field communications logbook with automated Gemini 3.8 Flash reconnaissance evaluation, severity-based filtering, callsign tracking, and sector monitoring. |
| **⛺ Research Stations & Outposts Studio** | Comprehensive operational status, personnel headcounts, runway conditions, and emergency shelter capacities across McMurdo, Amundsen-Scott, Vostok, Concordia, Halley VI, Maitri, Bharati, Himadri, and custom outposts. |
| **🚛 Fleet & Asset Telemetry** | Real-time monitoring of heavy PistenBully crawlers, Twin Otter ski-planes, coring rigs, and mobile shelter pods. Track fuel/battery levels, sub-zero cold-soak statuses, and SATCOM health. |
| **📦 Consumables & Depot Allocation** | Burn-rate tracking for Arctic diesel (F-34/JP-8), Jet-A1, rations, and medical hypothermia kits with automated resupply orders. |
| **📜 AI Action Logs Stream** | Real-time continuously scrolling telemetry and autonomous event feed (`[10:45 AM] AI: Rerouting supply convoy...`, `[10:47 AM] AI: Optimizing generator fuel...`) across polar stations with category filters and pause/resume controls. |
| **⚡ Auto-Resolved by AI Alerts** | Autonomous self-healing infrastructure giving historical and real-time alerts green `[⚡ Auto-Resolved by AI]` tags with complete forensic action logs and averted-impact explanations. |
| **🧹 AI Cleared Work Logs Archive** | Automated forensic task clearing engine with dual `ACTIVE TASK QUEUE` and `⚡ AI CLEARED WORK LOGS` views, one-click `AI AUTO-CLEAR ALL DONE`, and immutable verification logs. |
| **🎮 Mission Simulation & Training Sandbox** | Integrated tactical training mode allowing operators to simulate extreme crises (blizzards, crawler tensioner failures, SATCOM blackouts, crevasse fall Maydays). Features 5 pre-built scenarios, 11 manual inject triggers, 1x-25x playback controls, moving convoy map interpolation, 3-tier AI safety classification (OBSERVE, ASSIST, AUTONOMOUS), AAR evaluation reports, and strict isolation from production data. |
| **🎨 4 Tactical Themes & CRT Scanlines** | Complete customizable tactical visual identities: Cyan Polar, Phosphor Green (P300 CRT), Amber CRT, and Polar Daylight, accompanied by toggleable CRT cathode-beam scanlines and Web Audio acoustic feedback. |
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
| [`src/components/RealMapView.tsx`](src/components/RealMapView.tsx) | Renders proposed violet polyline and AI sequence badges on the Leaflet map |
| [`src/components/WaypointPlannerPage.tsx`](src/components/WaypointPlannerPage.tsx) | Waypoint planner with priority/mandatory flags and AI optimize modal |
| [`src/utils/deterministicRouteOptimizer.ts`](src/utils/deterministicRouteOptimizer.ts) | Deterministic fallback: nearest-neighbor + 2-opt, Haversine geodesic math, hazard penalty |
| [`src/types.ts`](src/types.ts) | `WaypointOptimizationRequest` and `WaypointOptimizationResult` TypeScript interfaces |
| [`server.ts`](server.ts) | `POST /api/ai/waypoints/optimize` — backend AI gateway with validation and caching |

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
| **`@types/leaflet`** | `^1.9.22` | Type Definitions | **TypeScript Declarations for Leaflet**. Ensures strict type checking and auto-completion when defining Leaflet layers, map instances, lat/lng bounds, and custom vector icons. |
| **`@vis.gl/react-google-maps`** | `^1.10.0` | Satellite Maps | **Official Google Maps React Wrapper**. Used to integrate high-resolution Google Maps Platform satellite aerial imagery and terrain layers when an optional Google Maps API Key is entered in the console settings. |
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
* **`RealMapView.tsx` / `PolarMap.tsx`**: Interactive Leaflet GIS cartography workstation with stereographic projections, custom waypoint pinning, station shelter markers, and multi-ring sub-zero cold pool heatmaps.
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

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite + Express server with hot reloads at `http://localhost:3000` |
| `npm run build` | Bundles frontend React assets and compiles server entry point into `dist/` |
| `npm run start` | Boots the compiled production server (`node dist/server.cjs`) |
| `npm run lint` | Performs strict TypeScript type checks (`tsc --noEmit`) |
| `npm run pack:check` | Previews files included in the published NPM package tarball |

---

## 🔑 Environment Configuration

Declare optional environment variables in `.env`:

```env
# Optional Port (defaults to 3000)
PORT=3000

# Optional Gemini API Key for AI Tactical Reconnaissance Advisor
GEMINI_API_KEY=your_gemini_api_key_here
```

*Note: You can also enter your Gemini API key dynamically via the frontend **API Key Config** modal inside the application interface.*

---

## 📄 License

MIT © International Polar Expedition Consortium
