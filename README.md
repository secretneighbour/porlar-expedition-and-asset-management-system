# Polar Expedition and Asset Management System

[![npm version](https://img.shields.io/npm/v/polar-expedition-asset-management.svg?style=flat-square)](https://www.npmjs.com/package/polar-expedition-asset-management)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

A tactical mission operations workstation and telemetry console for polar expeditions, high-latitude research stations, heavy traverse crawlers, extreme-cold aviation, and survival logistics depot allocation.

---

## 🚀 Quick Start with NPX

Run the complete polar operations console instantly with zero local installation:

```bash
npx polar-expedition-asset-management
```

This launches the operations console on `http://localhost:3000` (or `PORT` defined in your environment).

---

## 📦 Installation via NPM

Install into your project or globally on your system:

### Global CLI Tool
```bash
npm install -g polar-expedition-asset-management
polar-ops
```

### Dependency for React Applications
```bash
npm install polar-expedition-asset-management
```

---

## 💻 Programmatic Usage in React

Import the full tactical operations application or individual sub-modules into any React 18+ application:

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
        hazards={[]}
      />
    </div>
  );
}
```

---

## 🛠️ NPM Development & Deployment Scripts

The package includes production-ready NPM lifecycle scripts:

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite development server at `http://localhost:3000` |
| `npm run build` | Compiles production assets into the `dist/` directory |
| `npm run preview` | Previews the compiled production build locally |
| `npm run serve` | Serves the production build using the built-in HTTP server |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run pack:check` | Runs `npm pack --dry-run` to preview files included in publish tarball |
| `npm publish` | Builds and publishes the package to the NPM Registry |

---

## 🚢 Publishing to the NPM Registry

To publish this package to NPM:

1. **Verify you are logged in to NPM**:
   ```bash
   npm whoami
   # If not logged in:
   npm login
   ```

2. **Verify the package files**:
   ```bash
   npm run pack:check
   ```

3. **Publish the package**:
   ```bash
   npm publish --access public
   ```

*Note: The `prepublishOnly` lifecycle hook automatically runs `npm run build` before publishing to ensure all distribution bundles are fresh.*

---

## 🗺️ Key Operational Features

- **Polar Stereographic Radar Cartography**: Switchable projection for the Antarctic Continent and Arctic Basin with concentric latitude rings, meridian bearings, station locations, crevasse hazard sectors, and active traverse lines.
- **Heavy Fleet & Mobile Asset Telemetry**: Track crawler vehicles, ski-planes, coring rigs, and mobile shelter pods with cold rating limits (°C), fuel reserves, engine block heating, and SATCOM link health.
- **Expedition Traverse Planner**: Multi-waypoint route management, distance calculations, elevation profiling, and mission staging phases.
- **Extreme-Cold Consumables Depot**: Arctic diesel (F-34/JP-8), Jet-A1, rations, and hypothermia resuscitation units with burn-rate analysis and emergency air-drop dispatch.
- **Katabatic Telemetry & Windchill Calculator**: Real-time AWOS sensor feeds and frostbite risk calculation.
- **Real-Time Distress Beacon & Multi-Device Sync (Mobile ➔ Laptop HQ)**: Zero-cloud, free, built-in WebSocket & REST synchronization. When a field researcher triggers Mayday on their mobile phone over mobile data or satellite link, the research center asset manager's laptop console instantly sounds an emergency audio klaxon, flashes a high-visibility incident banner with coordinates, and queues SAR scramble confirmation back to the field phone.

---

## 📱 Mobile Field Unit to Research Center Laptop Sync (100% Free & Self-Contained)

The system includes a built-in bidirectional WebSocket and HTTP heartbeat synchronization server with accurate terminal deduplication:

1. **Research Center Laptop**: Open the console on the research center desk laptop. The top bar accurately indicates `LIVE SYNC: 1 NODE ONLINE` representing this single active workstation.
2. **Instant QR Code Pairing**: Click **PAIR PHONE** or the live sync badge in the top bar. A modal appears with a live, high-resolution QR code generated directly for your server URL.
3. **Field Mobile Device**: Point any smartphone camera at the QR code (or copy the URL) to open the console over 4G/5G mobile data or Wi-Fi.
   - The server instantly detects the new device ID and updates the status to `LIVE SYNC: 2 NODES ONLINE` across all screens.
   - The **Active Terminals Roster** displays both nodes (`Base Station HQ Console` & `Mobile Phone Field Unit`) with live pulsing heartbeat indicators.
4. **Triggering Mayday**: On the phone, navigate to the **FIELD PHONE MAYDAY TERMINAL** tab or tap **TRANSMIT DISTRESS**. Tap **BROADCAST MAYDAY OVER MOBILE DATA**.
5. **Immediate Laptop Alert**: The laptop console instantly:
   - Plays a pulsating two-tone polar emergency alarm klaxon via the Web Audio API.
   - Flashes an unmissable red alert banner with incident details, coordinates, and transmitting device ID.
   - Centers the polar radar map directly on the distress coordinates with an animated pulse marker.
   - Provides an **ACKNOWLEDGE & SCRAMBLE SAR** button to assign a rescue crawler or Twin Otter ski-plane.
6. **Phone Confirmation**: As soon as the laptop manager clicks **ACKNOWLEDGE**, the field phone screen immediately turns green:
   - `✅ HQ HAS RECEIVED YOUR MAYDAY! Deployed SAR Asset: PB-300 Heavy SAR En Route.`
7. **Disconnect Handling**: When the phone tab is closed or goes out of range, the heartbeat timeout automatically prunes the disconnected device within seconds and the counter returns to `1 NODE ONLINE`.

---

## 📄 License

MIT © International Polar Expedition Consortium
