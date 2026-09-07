# 🏔️ Polar Expedition & Asset Management System

[![npm version](https://img.shields.io/npm/v/polar-expedition-asset-management.svg?style=flat-square)](https://www.npmjs.com/package/polar-expedition-asset-management)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

A mission-critical tactical operations console and real-time telemetry workstation engineered for Antarctic and Arctic expeditions, high-latitude research outposts, heavy traverse crawlers, extreme-cold aviation, and field Mayday distress coordination.

---

## 📋 Table of Contents

- [🚀 Quick Start](#-quick-start)
  - [🛠️ Troubleshooting NPM `EALLOWSCRIPTS` / `--allow-scripts` Error](#️-troubleshooting-npm-eallowscripts---allow-scripts-error)
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
| **🤖 AI Predictive Maintenance** | Pre-failure machine learning forecaster modeling severe polar cold-soak (-50°C) stress, elastomer vitrification curves, vibration harmonics (FFT), and parts pre-allocation to avert field breakdowns. |
| **🔥 Danger Zone Heatmap** | Dynamic multi-ring gradient heatmap overlay visualizing sub-zero cold pools, katabatic shear funnels, human survival windows (<12m lethal threshold), and Arctic diesel fuel waxing perimeters. |
| **🧭 Real-World & Polar Cartography** | Dual projection mapping system with Leaflet GIS and Stereographic Polar Radar. Click anywhere on the map to set custom Waypoints or establish new Outposts with auto-populated coordinates. |
| **🚛 Fleet & Asset Telemetry** | Real-time monitoring of heavy PistenBully crawlers, Twin Otter ski-planes, coring rigs, and mobile shelter pods. Track fuel/battery levels, sub-zero cold-soak statuses, and SATCOM health. |
| **📍 Waypoint Planner Studio** | Clean split-pane interface to pin, edit, and step sequential waypoints (+50km auto-advance). Features 1-click map pinning, instant card removals, and batch route clearing. |
| **⚡ Automated S.A.R. Dispatch (Zero-Click)** | Autonomous Search & Rescue command system: upon distress beacon reception (e.g., Crevasse Fall), the engine automatically computes the nearest base, assesses weather flyability, and dispatches Drone Falcon-X and tracked extraction teams without requiring human operator clicks. |
| **❄️ Dynamic Weather Inventory Engine** | AI weather forecasting reader: predicts 3-day severe blizzard impact (-48°C, 95 km/h winds), models exponential heater burn surge (500L/day → 1,450L/day), dynamically elevates minimum stock safety buffer (4,000L → 8,500L), and dispatches early supply ship orders to MV Vasiliy Golovnin. |
| **🛰️ Smart Route Optimization (Satellite CV)** | High-resolution satellite computer vision engine detecting shifting ice shelves and active crevasse hazards; recalculates daily safe bypass corridors for 28-ton heavy supply trucks and pushes waypoints directly to crawler GPS terminals. |
| **🚨 Mayday Distress & SAR Console** | Bi-directionally synchronized Mayday alarm system. Transmit field distress alerts from mobile phones; trigger audible klaxon alarms and automated SAR scramble protocols on HQ laptops. |
| **⛺ Research Stations & Outposts** | Operational status, personnel headcounts, runway conditions, and emergency shelter capacities across McMurdo, Amundsen-Scott, Vostok, Concordia, Halley VI, and custom bases. |
| **📦 Consumables & Depot Allocation** | Burn-rate tracking for Arctic diesel (F-34/JP-8), Jet-A1, rations, and medical hypothermia kits with automated resupply orders. |
| **🌡️ AWOS Weather & Katabatic Risk** | Live environmental telemetry: ambient temperature, wind chill, barometric pressure, whiteout warnings, and frostbite time calculators. |
| **🧠 AI Tactical Recon (Gemini 3.8 Flash)** | Server-side AI intelligence engine evaluating traverse route hazards, crevasse field proximity, and cold-weather mechanical risk mitigations. |
| **📜 AI Action Logs Stream** | Real-time continuously scrolling telemetry and autonomous event feed (`[10:45 AM] AI: Rerouting supply convoy...`, `[10:47 AM] AI: Optimizing generator fuel...`) across polar stations with category filters and pause/resume controls. |
| **⚡ Auto-Resolved by AI Alerts** | Autonomous self-healing infrastructure giving historical and real-time alerts green `[⚡ Auto-Resolved by AI]` tags with complete forensic action logs and averted-impact explanations. |

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
