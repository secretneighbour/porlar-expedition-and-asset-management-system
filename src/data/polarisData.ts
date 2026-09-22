import {
  LayoutGrid, Compass, Users, Boxes, Package, Ship, Truck, Wrench,
  ClipboardList, MapPin, Bell, Wallet, FileText, ScrollText, UserCog, Settings as SettingsIcon,
  ShieldCheck, AlertOctagon, Sparkles, Activity, ShieldAlert, Navigation, Route, Cpu,
  Flame, Terminal, QrCode, Radio, CloudSnow, Sun, Moon, Target
} from 'lucide-react';
import { PredictiveMaintenanceRecord } from '../types';

/* ============================== TACTICAL DESIGN TOKENS ============================== */
export const THEME: Record<string, any> = {
  // 1. Cyan Polar (Tactical Command Center)
  cyan: {
    name: "Cyan Polar",
    bg: "#060B18",
    bgAlt: "rgba(0, 242, 254, 0.04)",
    panel: "rgba(10, 17, 40, 0.78)",
    panelAlt: "rgba(15, 23, 42, 0.92)",
    border: "rgba(56, 189, 248, 0.22)",
    borderLight: "rgba(56, 189, 248, 0.38)",
    text: "#F8FAFC",
    textDim: "#94A3B8",
    textFaint: "#64748B",
    accent: "#00F2FE",
    accentSoft: "rgba(0, 242, 254, 0.16)",
    cyan: "#00F2FE",
    blue: "#38BDF8",
    blueSoft: "rgba(56, 189, 248, 0.18)",
    green: "#10B981",
    greenSoft: "rgba(16, 185, 129, 0.18)",
    amber: "#F59E0B",
    amberSoft: "rgba(245, 158, 11, 0.18)",
    red: "#EF4444",
    redSoft: "rgba(239, 68, 68, 0.18)",
    sidebar: "#060C1B",
    white: "#FFFFFF",
    cardBg: "rgba(10, 17, 40, 0.78)",
    cardBorder: "rgba(56, 189, 248, 0.22)",
    cardBlur: "blur(16px)",
    cardShadow: "0 14px 40px rgba(0, 0, 0, 0.55)",
    btnGradient: "linear-gradient(135deg, #0284C7, #00F2FE)",
    btnShadow: "0 8px 20px rgba(0, 242, 254, 0.3)",
  },

  // 2. Phosphor Green (Tactical P300 Terminal)
  green: {
    name: "Phosphor Green",
    bg: "#040D08",
    bgAlt: "rgba(34, 197, 94, 0.05)",
    panel: "rgba(6, 20, 13, 0.82)",
    panelAlt: "rgba(8, 28, 18, 0.92)",
    border: "rgba(34, 197, 94, 0.24)",
    borderLight: "rgba(34, 197, 94, 0.42)",
    text: "#F0FDF4",
    textDim: "#86EFAC",
    textFaint: "#4ADE80",
    accent: "#22C55E",
    accentSoft: "rgba(34, 197, 94, 0.18)",
    cyan: "#4ADE80",
    blue: "#22C55E",
    blueSoft: "rgba(34, 197, 94, 0.15)",
    green: "#22C55E",
    greenSoft: "rgba(34, 197, 94, 0.2)",
    amber: "#EAB308",
    amberSoft: "rgba(234, 179, 8, 0.18)",
    red: "#F43F5E",
    redSoft: "rgba(244, 63, 94, 0.18)",
    sidebar: "#040D08",
    white: "#F0FDF4",
    cardBg: "rgba(6, 20, 13, 0.82)",
    cardBorder: "rgba(34, 197, 94, 0.24)",
    cardBlur: "blur(12px)",
    cardShadow: "0 12px 40px rgba(0, 0, 0, 0.65)",
    btnGradient: "linear-gradient(135deg, #15803D, #22C55E)",
    btnShadow: "0 8px 20px rgba(34, 197, 94, 0.3)",
  },

  // 3. Amber CRT (High-Contrast Cathode Workstation)
  amber: {
    name: "Amber CRT",
    bg: "#0D0804",
    bgAlt: "rgba(245, 158, 11, 0.05)",
    panel: "rgba(23, 15, 7, 0.85)",
    panelAlt: "rgba(36, 23, 10, 0.94)",
    border: "rgba(245, 158, 11, 0.26)",
    borderLight: "rgba(245, 158, 11, 0.44)",
    text: "#FFFBEB",
    textDim: "#FDE68A",
    textFaint: "#F59E0B",
    accent: "#F59E0B",
    accentSoft: "rgba(245, 158, 11, 0.18)",
    cyan: "#FBBF24",
    blue: "#F59E0B",
    blueSoft: "rgba(245, 158, 11, 0.15)",
    green: "#10B981",
    greenSoft: "rgba(16, 185, 129, 0.18)",
    amber: "#F59E0B",
    amberSoft: "rgba(245, 158, 11, 0.2)",
    red: "#EF4444",
    redSoft: "rgba(239, 68, 68, 0.18)",
    sidebar: "#0D0804",
    white: "#FFFBEB",
    cardBg: "rgba(23, 15, 7, 0.85)",
    cardBorder: "rgba(245, 158, 11, 0.26)",
    cardBlur: "blur(12px)",
    cardShadow: "0 12px 40px rgba(0, 0, 0, 0.65)",
    btnGradient: "linear-gradient(135deg, #B45309, #F59E0B)",
    btnShadow: "0 8px 20px rgba(245, 158, 11, 0.3)",
  },

  // 4. Polar Daylight (High-Contrast White)
  light: {
    name: "Daylight Mode",
    bg: "#F8FAFC",
    bgAlt: "rgba(15, 23, 42, 0.04)",
    panel: "#FFFFFF",
    panelAlt: "#F1F5F9",
    border: "rgba(15, 23, 42, 0.14)",
    borderLight: "rgba(15, 23, 42, 0.22)",
    text: "#0F172A",
    textDim: "#475569",
    textFaint: "#64748B",
    accent: "#0284C7",
    accentSoft: "rgba(2, 132, 199, 0.14)",
    cyan: "#0284C7",
    blue: "#2563EB",
    blueSoft: "rgba(37, 99, 235, 0.12)",
    green: "#059669",
    greenSoft: "rgba(5, 150, 105, 0.14)",
    amber: "#D97706",
    amberSoft: "rgba(217, 119, 6, 0.14)",
    red: "#DC2626",
    redSoft: "rgba(220, 38, 38, 0.14)",
    sidebar: "#0F172A",
    white: "#0F172A",
    cardBg: "#FFFFFF",
    cardBorder: "rgba(15, 23, 42, 0.14)",
    cardBlur: "none",
    cardShadow: "0 10px 25px rgba(0, 0, 0, 0.06)",
    btnGradient: "linear-gradient(135deg, #0284C7, #0369A1)",
    btnShadow: "0 6px 15px rgba(2, 132, 199, 0.25)",
  }
};

// Aliases for backward compatibility
THEME.dark = THEME.cyan;

export const FONT_HEAD = "'Space Grotesk', 'Inter', sans-serif";
export const FONT_BODY = "'Inter', sans-serif";

/* ============================== STATIONS & NAV ============================== */
export const STATIONS = [
  { id: "MAITRI", name: "Maitri", region: "Antarctica", loc: "Schirmacher Oasis", x: 34, y: 62 },
  { id: "BHARATI", name: "Bharati", region: "Antarctica", loc: "Larsemann Hills", x: 58, y: 74 },
  { id: "HIMADRI", name: "Himadri", region: "Arctic", loc: "Ny-Alesund, Svalbard", x: 68, y: 28 },
  { id: "MCMURDO", name: "McMurdo", region: "Antarctica", loc: "Ross Island", x: 42, y: 82 },
];

export const ROLES = ["Super Admin", "Expedition Manager", "Logistics Officer", "Asset Manager", "Maintenance Officer", "Scientist / Team Member"];

export const PERMISSIONS: Record<string, string[]> = {
  "Super Admin": [
    "dashboard", "simulation", "live-ops", "map",
    "expeditions", "waypoints", "routes", "transportation",
    "assets", "maintenance", "inventory", "shipments", "stations", "personnel",
    "predictive-maintenance", "smart-route", "weather-inventory", "ai-action-logs", "ai-alerts", "ai-cleared-work",
    "sar", "alerts", "emergency-events",
    "reports", "expenses", "audit",
    "device-pairing", "api-config", "post-diagnostics", "users", "settings"
  ],
  "Expedition Manager": [
    "dashboard", "simulation", "live-ops", "map",
    "expeditions", "waypoints", "routes", "transportation",
    "assets", "maintenance", "inventory", "shipments", "stations", "personnel",
    "predictive-maintenance", "smart-route", "weather-inventory", "ai-action-logs", "ai-alerts", "ai-cleared-work",
    "sar", "alerts", "emergency-events",
    "reports", "expenses", "settings"
  ],
  "Logistics Officer": [
    "dashboard", "simulation", "live-ops", "map",
    "expeditions", "transportation", "routes",
    "inventory", "shipments", "stations",
    "weather-inventory", "smart-route", "ai-action-logs",
    "alerts", "reports", "expenses", "settings"
  ],
  "Asset Manager": [
    "dashboard", "simulation", "live-ops", "map",
    "assets", "maintenance", "predictive-maintenance",
    "inventory", "stations", "ai-action-logs",
    "alerts", "reports", "settings"
  ],
  "Maintenance Officer": [
    "dashboard", "simulation", "live-ops", "assets", "maintenance", "predictive-maintenance", "alerts", "settings"
  ],
  "Scientist / Team Member": [
    "dashboard", "simulation", "live-ops", "map", "expeditions", "waypoints", "tasks", "assets", "alerts", "settings"
  ],
  "Researcher": [
    "dashboard", "simulation", "live-ops", "map", "expeditions", "waypoints", "tasks", "assets", "alerts", "settings"
  ],
  "Asset Management": [
    "dashboard", "simulation", "live-ops", "map", "assets", "maintenance", "predictive-maintenance", "inventory", "stations", "alerts", "reports", "settings"
  ],
  "Transportation": [
    "dashboard", "simulation", "live-ops", "map", "transportation", "routes", "inventory", "shipments", "weather-inventory", "smart-route", "alerts", "reports", "settings"
  ],
};

export interface NavItem {
  key: string;
  label: string;
  icon: any;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "COMMAND",
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
      { key: "simulation", label: "Training Sim", icon: Target, badge: "TRAIN" },
      { key: "live-ops", label: "Live Operations", icon: Activity, badge: "-48°C" },
      { key: "map", label: "Polar GIS Map", icon: MapPin },
    ]
  },
  {
    title: "EXPEDITION",
    items: [
      { key: "expeditions", label: "Expeditions", icon: Compass },
      { key: "waypoints", label: "Waypoint Studio", icon: Navigation },
      { key: "routes", label: "Smart Route AI", icon: Route, badge: "CV" },
      { key: "transportation", label: "Transportation", icon: Truck },
    ]
  },
  {
    title: "ASSETS",
    items: [
      { key: "assets", label: "Fleet Telemetry", icon: Boxes },
      { key: "maintenance", label: "Maintenance", icon: Wrench },
      { key: "inventory", label: "Inventory", icon: Package },
      { key: "shipments", label: "Logistics Ships", icon: Ship },
      { key: "stations", label: "Research Stations", icon: ShieldCheck },
      { key: "personnel", label: "Personnel", icon: Users },
    ]
  },
  {
    title: "AI OPERATIONS",
    items: [
      { key: "predictive-maintenance", label: "Predictive Maint", icon: Cpu, badge: "ML" },
      { key: "weather-inventory", label: "Weather Fuel Model", icon: CloudSnow, badge: "AI" },
      { key: "ai-action-logs", label: "AI Action Feed", icon: Terminal, badge: "LIVE" },
      { key: "ai-alerts", label: "AI Resolved Alerts", icon: AlertOctagon },
      { key: "ai-cleared-work", label: "AI Cleared Work", icon: ShieldCheck },
    ]
  },
  {
    title: "INCIDENTS",
    items: [
      { key: "sar", label: "Mayday & S.A.R.", icon: ShieldAlert, badge: "AUTO" },
      { key: "alerts", label: "Alerts & Alarms", icon: Bell },
      { key: "emergency-events", label: "Dispatch Logbook", icon: Radio },
    ]
  },
  {
    title: "ANALYTICS",
    items: [
      { key: "reports", label: "Mission Reports", icon: FileText },
      { key: "expenses", label: "Financials", icon: Wallet },
      { key: "audit", label: "System Audit Trail", icon: ScrollText },
    ]
  },
  {
    title: "SYSTEM",
    items: [
      { key: "device-pairing", label: "Device Pairing", icon: QrCode },
      { key: "api-config", label: "API / AI Config", icon: Sparkles },
      { key: "post-diagnostics", label: "POST Hardware Check", icon: Terminal },
      { key: "users", label: "Operators & Users", icon: UserCog },
      { key: "settings", label: "Tactical Settings", icon: SettingsIcon },
    ]
  },
];

export const NAV = NAV_SECTIONS.flatMap(s => s.items);

/* ============================== MOCK GENERATORS ============================== */
const rnd = (seed: number) => { const x = Math.sin(seed * 999) * 10000; return x - Math.floor(x); };
export const pick = <T>(arr: T[], seed: number): T => arr[Math.floor(rnd(seed) * arr.length)];
export const uid = (p: string, n: number) => `${p}-${String(n).padStart(4, "0")}`;

export const FIRST = ["Arjun","Priya","Rohan","Ananya","Vikram","Kavya","Aditya","Sneha","Karan","Meera","Nikhil","Divya","Rahul","Isha","Suresh","Pooja","Manoj","Ritika","Sanjay","Neha","Deepak","Shreya","Anil","Tanvi","Varun"];
export const LAST = ["Sharma","Verma","Iyer","Nair","Patel","Reddy","Singh","Kulkarni","Das","Menon","Rao","Bose","Kapoor","Joshi","Chatterjee"];
export const SCI_ROLES = ["Glaciologist","Marine Biologist","Atmospheric Scientist","Geophysicist","Medical Officer","Communications Officer","Meteorologist","Field Engineer"];

export const INITIAL_PERSONNEL = Array.from({ length: 20 }, (_, i) => {
  const seed = i + 1;
  const dept = pick(["Science","Logistics","Medical","Engineering","Communications","Administration"], seed * 3);
  const status = pick(["On Expedition","Available","Assigned","On Leave","Unavailable"], seed * 7);
  return {
    id: uid("PER", i + 1),
    name: `${pick(FIRST, seed)} ${pick(LAST, seed * 2)}`,
    role: dept === "Science" ? pick(SCI_ROLES, seed * 5) : pick(["Logistics Officer","Asset Manager","Maintenance Technician","Expedition Manager","Support Staff"], seed * 5),
    department: dept,
    qualification: pick(["Ph.D.","M.Sc.","B.Tech","M.Tech","M.B.B.S.","Diploma"], seed * 4),
    contact: `+91-9${String(100000000 + seed * 137).slice(0,8)}`,
    emergencyContact: `+91-8${String(200000000 + seed * 211).slice(0,8)}`,
    expeditionId: seed <= 12 ? uid("EXP", (seed % 5) + 1) : null,
    location: pick(["Goa HQ","Maitri","Bharati","Himadri","In Transit"], seed * 6),
    status,
  };
});

export const ASSET_CATS = [
  { cat: "Scientific Instruments", items: ["CTD Profiler","Automatic Weather Station","Ice Corer Rig","Seismograph Unit","UV Spectrometer","Ozone Sonde"] },
  { cat: "Communication Devices", items: ["Iridium Satellite Phone","VHF Radio Set","HF Transceiver","Base Station Antenna"] },
  { cat: "Vehicles", items: ["Snowcat Heavy Tractor","Snow Groomer","Ski-Doo Snowmobile","Amphibious ATV","Piston Bully"] },
  { cat: "Generators", items: ["20kW Diesel Generator","Portable Genset 5kW"] },
  { cat: "Safety Equipment", items: ["Crevasse Rescue Kit","Cold-Weather Survival Suit","Emergency Beacon (EPIRB)"] },
  { cat: "Camping Equipment", items: ["Polar Expedition Tent","-40C Sleeping System","Portable Stove Unit"] },
  { cat: "Navigation Equipment", items: ["GPS Handheld Unit","Magnetic Compass Set","Satellite Navigation Console"] },
  { cat: "Research Equipment", items: ["Sample Collection Kit","Ice Core Freezer Box","Drone Survey Unit"] },
  { cat: "Power Systems", items: ["Solar Panel Array","Lithium Battery Bank"] },
];
export const ASSET_STATUSES = ["Available","Assigned","In Transit","In Use","Under Maintenance","Damaged","Lost","Retired"];

export const INITIAL_ASSETS = [
  {
    id: "AST-0001",
    name: "Snowcat Heavy Tractor (Arctic Spec)",
    category: "Vehicles",
    serial: "SN-CAT-8890",
    purchaseDate: "2024-03-15",
    location: "Maitri Station Traverse Depot",
    expeditionId: "EXP-0001",
    assignedPerson: "PER-0004",
    condition: "Fair",
    status: "Under Maintenance",
    lastMaintenance: "2026-03-10",
    nextMaintenance: "2026-09-08",
    warranty: "Under Warranty",
  },
  ...Array.from({ length: 49 }, (_, i) => {
    const seed = i + 4;
    const group = pick(ASSET_CATS, seed);
    const status = pick(ASSET_STATUSES, seed * 9);
    const expeditionId = ["Assigned","In Transit","In Use"].includes(status) ? uid("EXP", (seed % 5) + 1) : null;
    const lastM = new Date(2026, (seed * 3) % 12, (seed * 5) % 27 + 1);
    const nextM = new Date(lastM); nextM.setMonth(nextM.getMonth() + 6);
    return {
      id: uid("AST", i + 2),
      name: pick(group.items, seed * 2),
      category: group.cat,
      serial: `SN-${1000 + seed * 17}`,
      purchaseDate: `202${3 + (seed % 3)}-0${(seed % 9) + 1}-1${seed % 9}`,
      location: pick(["Goa HQ Store","Maitri","Bharati","Himadri","In Transit"], seed * 4),
      expeditionId,
      assignedPerson: expeditionId ? uid("PER", (seed % 20) + 1) : null,
      condition: pick(["Excellent","Good","Fair","Poor"], seed * 6),
      status,
      lastMaintenance: lastM.toISOString().slice(0,10),
      nextMaintenance: nextM.toISOString().slice(0,10),
      warranty: pick(["Under Warranty","Expired","N/A"], seed * 8),
    };
  })
];

export const INV_CATS = [
  { cat: "Food", items: ["Freeze-Dried Rations","Rice (25kg bags)","Lentils (Dal)","Multivitamin Packs"], unit: "kg" },
  { cat: "Fuel", items: ["Diesel","Aviation Turbine Fuel","Kerosene"], unit: "L" },
  { cat: "Water", items: ["Purified Drinking Water","Water Purification Tablets"], unit: "L" },
  { cat: "Medical Supplies", items: ["First Aid Kits","Antibiotics Stock","Frostbite Treatment Kits"], unit: "units" },
  { cat: "Batteries", items: ["Lithium-Ion Battery Packs","AA Alkaline Batteries"], unit: "units" },
  { cat: "Clothing", items: ["Thermal Base Layers","Wind-Proof Outer Shells","Insulated Boots"], unit: "sets" },
  { cat: "Spare Parts", items: ["Heavy-Duty Serpentine Belts","Generator Spare Kit","Vehicle Track Pads","Hydraulic Seals (-60C)"], unit: "units" },
  { cat: "Scientific Consumables", items: ["Sample Vials","Filter Papers","Reagent Kits"], unit: "boxes" },
  { cat: "Emergency Supplies", items: ["Emergency Flares","Survival Ration Packs"], unit: "units" },
];

export const INITIAL_INVENTORY = [
  {
    id: "INV-0001",
    name: "Heavy-Duty Serpentine Engine Belts",
    category: "Spare Parts",
    quantity: 8,
    unit: "units",
    minStock: 3,
    location: "Maitri Store",
    expiry: null,
    supplier: "National Polar Logistics Ltd.",
    cost: 450,
  },
  {
    id: "INV-0002",
    name: "Polar Diesel Heating Fuel (F-34 / JP-8)",
    category: "Fuel",
    quantity: 15000,
    unit: "L",
    minStock: 4000,
    location: "Maitri Station (Tank Farm Alpha)",
    expiry: null,
    supplier: "Indian Antarctic Logistics Command / MV Vasiliy Golovnin",
    cost: 3.2,
  },
  ...Array.from({ length: 28 }, (_, i) => {
    const seed = i + 6;
    const group = pick(INV_CATS, seed);
    const min = 20 + (seed % 5) * 10;
    const qty = seed % 4 === 0 ? Math.floor(min * 0.6) : min + (seed % 6) * 15;
    return {
      id: uid("INV", i + 2),
      name: pick(group.items, seed * 3),
      category: group.cat,
      quantity: qty,
      unit: group.unit,
      minStock: min,
      location: pick(["Goa Warehouse","Maitri Store","Bharati Store","Himadri Store"], seed * 2),
      expiry: group.cat === "Food" || group.cat === "Medical Supplies" ? `2026-${String((seed % 9)+1).padStart(2,"0")}-15` : null,
      supplier: pick(["ITBP Supply Corps","Indian Coast Guard Stores","National Polar Logistics Ltd.","Local Vendor - Goa"], seed * 4),
      cost: 200 + seed * 37,
    };
  })
];

export const SHIP_STATUSES = ["Planned","Packed","Dispatched","In Transit","Delayed","Delivered","Cancelled"];

export const INITIAL_SHIPMENTS = Array.from({ length: 15 }, (_, i) => {
  const seed = i + 2;
  const dest = pick(STATIONS, seed);
  const status = pick(SHIP_STATUSES, seed * 5);
  return {
    id: uid("SHP", i + 1),
    origin: pick(["Goa Port","Mumbai Port","Cape Town Transit Hub"], seed),
    destination: dest.name,
    expeditionId: uid("EXP", (seed % 5) + 1),
    cargo: pick(["Scientific Equipment","Fuel Drums","Food Rations","Medical Supplies","Vehicle Parts"], seed * 3),
    weight: 500 + seed * 120,
    quantity: 10 + seed * 3,
    mode: pick(["Ship","Aircraft"], seed * 2),
    departure: `2026-0${(seed % 8) + 1}-1${seed % 9}`,
    expectedArrival: `2026-0${(seed % 9) + 1}-2${seed % 8}`,
    actualArrival: status === "Delivered" ? `2026-0${(seed % 9) + 1}-2${seed % 8}` : null,
    status,
  };
});

export const INITIAL_TRANSPORTATION = Array.from({ length: 8 }, (_, i) => {
  const seed = i + 1;
  const type = pick(["Ship","Aircraft","Vehicle"], seed);
  const name = type === "Ship" ? pick(["MV Vasiliy Golovnin","MV Akademik Fedorov","ORV Sagar Nidhi"], seed)
    : type === "Aircraft" ? pick(["IAF C-17 Globemaster","Basler BT-67","IAF IL-76"], seed)
    : pick(["Piston Bully Fleet-1","Snow Groomer Fleet-2"], seed);
  return {
    id: uid("TRN", i + 1),
    type, name,
    capacity: type === "Ship" ? "120 personnel / 3000t cargo" : type === "Aircraft" ? "40 personnel / 20t cargo" : "6 personnel / 2t cargo",
    route: pick(["Goa -> Cape Town -> Bharati","Mumbai -> Himadri (via Svalbard Airport)","Cape Town -> Maitri"], seed),
    departure: `2026-0${(seed % 9) + 1}-0${(seed % 8) + 1}`,
    arrival: `2026-0${(seed % 9) + 1}-2${seed % 8}`,
    status: pick(["Scheduled","En Route","Docked/Landed","Completed"], seed * 3),
  };
});

export const MAINT_STATUSES = ["Reported","Assigned","In Progress","Awaiting Parts","Completed","Cancelled"];

export const INITIAL_MAINTENANCE = [
  {
    id: "MNT-0001",
    assetId: "AST-0001",
    assetName: "Snowcat Heavy Tractor (Arctic Spec)",
    type: "Corrective",
    reportedBy: "PER-0004",
    technician: "PER-0007",
    cost: 450,
    downtimeHours: 4,
    status: "Reported",
    dueDate: "2026-09-08",
    notes: "Needs Repair: Engine belt high wear flagged by telemetry. Severe -50°C temperature warning.",
  },
  ...Array.from({ length: 9 }, (_, i) => {
    const seed = i + 2;
    const asset = INITIAL_ASSETS[(seed * 4) % INITIAL_ASSETS.length];
    return {
      id: uid("MNT", i + 2),
      assetId: asset.id,
      assetName: asset.name,
      type: pick(["Preventive","Corrective"], seed),
      reportedBy: uid("PER", (seed % 20) + 1),
      technician: uid("PER", ((seed + 5) % 20) + 1),
      cost: 1500 + seed * 340,
      downtimeHours: 4 + seed * 2,
      status: pick(MAINT_STATUSES, seed * 6),
      dueDate: `2026-0${(seed % 9) + 1}-1${seed % 9}`,
      notes: pick(["Routine calibration required","Reported unusual noise / vibration","Battery unit underperforming","Corrosion inspection due to salt exposure"], seed * 3),
    };
  })
];

export const INITIAL_PREDICTIVE_RECORDS: PredictiveMaintenanceRecord[] = [
  {
    id: "PRD-0001",
    assetId: "AST-0001",
    assetName: "Snowcat Heavy Tractor (Arctic Spec)",
    category: "Vehicles",
    component: "Engine Serpentine Belt & Alternator Tensioner",
    currentCondition: "Fair (High Cold Stress)",
    traditionalStatus: "Needs Repair",
    riskScore: 94,
    severity: "CRITICAL",
    predictedFailureHorizon: "Within 18 - 24 hours (Tomorrow by 14:00 UTC)",
    ambientTempTriggerC: -50,
    weatherFactor: "Severe -50°C Cold-Soak & Rubber Vitrification (Vibration: 4.8 mm/s)",
    predictionHeadline: "The Snowcat Tractor's engine belt might break by tomorrow, so maintain it today itself.",
    rootCauseAnalysis: "Machine learning models analyzed 420 hrs past telemetry under -50°C polar freeze. Chloroprene elastomer undergoes severe glass transition embrittlement below -42°C. Cold-start torsional vibration has initiated micro-cracking across rib 3 and 4.",
    recommendedAction: "Maintain today: Replace belt with Arctic HNBR grade (Part #CAT-BELT-88) in heated garage bay before tomorrow's traverse.",
    downtimeSavedHours: 48,
    costSavedUsd: 18500,
    partRequired: "Heavy-Duty Serpentine Engine Belts",
    spareAvailableInStock: true,
    spareStockCount: 8,
    assignedTechnician: "Manoj Joshi (PER-0007)",
    telemetryMetrics: {
      beltTensionMm: 14.2,
      vibrationRms: 4.8,
      coldSoakHours: 72,
      lubricantViscosityDegradation: 68
    },
    isPrevented: false
  },
  {
    id: "PRD-0002",
    assetId: "AST-0003",
    assetName: "Ice Corer Rig (Deep Core 3000)",
    category: "Scientific Instruments",
    component: "Hydraulic Fluid Seals (-60°C Grade)",
    currentCondition: "Good",
    traditionalStatus: "Scheduled Check in 30 Days",
    riskScore: 78,
    severity: "HIGH",
    predictedFailureHorizon: "Within 48 hours under blizzard load",
    ambientTempTriggerC: -48,
    weatherFactor: "-48°C Ambient with 55kt Katabatic Blizzard",
    predictionHeadline: "Ice Corer hydraulic pressure loss predicted in 48 hours; pre-heat fluid block today.",
    rootCauseAnalysis: "Seal elasticity reduced by 62% from rapid thermal cycling between heated cabin drilling and sub-surface glacial core extraction at -48°C.",
    recommendedAction: "Purge moisture from line and swap O-rings using cold-rated fluorosilicone kit.",
    downtimeSavedHours: 28,
    costSavedUsd: 9200,
    partRequired: "Hydraulic Seals (-60C)",
    spareAvailableInStock: true,
    spareStockCount: 14,
    assignedTechnician: "Karan Verma (PER-0009)",
    telemetryMetrics: {
      beltTensionMm: 8.1,
      vibrationRms: 3.2,
      coldSoakHours: 48,
      lubricantViscosityDegradation: 45
    },
    isPrevented: false
  },
  {
    id: "PRD-0003",
    assetId: "AST-0004",
    assetName: "20kW Polar Diesel Generator Unit 1",
    category: "Generators",
    component: "Fuel Injector Paraffin Wax Filter",
    currentCondition: "Fair",
    traditionalStatus: "Operating Normally",
    riskScore: 66,
    severity: "MEDIUM",
    predictedFailureHorizon: "Within 36 hours of sustained -50°C",
    ambientTempTriggerC: -50,
    weatherFactor: "-50°C fuel cloud point boundary",
    predictionHeadline: "Generator injector fuel line clouding detected; apply fuel pre-heater blanket today.",
    rootCauseAnalysis: "Fuel line temp approaching cloud point (-47°C). Paraffin wax micro-crystals forming on micron pre-filter mesh, causing progressive rail pressure drop.",
    recommendedAction: "Activate redundant heating trace wire and dose fuel with anti-gel winterizer.",
    downtimeSavedHours: 32,
    costSavedUsd: 14000,
    partRequired: "Generator Spare Kit",
    spareAvailableInStock: true,
    spareStockCount: 5,
    assignedTechnician: "Suresh Menon (PER-0015)",
    telemetryMetrics: {
      beltTensionMm: 7.0,
      vibrationRms: 2.9,
      coldSoakHours: 96,
      lubricantViscosityDegradation: 52
    },
    isPrevented: false
  },
  {
    id: "PRD-0004",
    assetId: "AST-0006",
    assetName: "Ski-Doo Snowmobile Alpha",
    category: "Vehicles",
    component: "Drive Track Tensioner Pulley",
    currentCondition: "Good",
    traditionalStatus: "Needs Repair",
    riskScore: 42,
    severity: "LOW",
    predictedFailureHorizon: "5 - 7 Days",
    ambientTempTriggerC: -40,
    weatherFactor: "Hard-packed sastrugi terrain vibration",
    predictionHeadline: "Ski-Doo track tensioner bearing grease stiffening; inspect during next shift.",
    rootCauseAnalysis: "Low-viscosity grease wash-out from sastrugi ice powder infiltration into outer bearing shield.",
    recommendedAction: "Repack with low-temp synthetic grease at end of day shift.",
    downtimeSavedHours: 12,
    costSavedUsd: 2800,
    partRequired: "Vehicle Track Pads",
    spareAvailableInStock: true,
    spareStockCount: 12,
    assignedTechnician: "Rahul Bose (PER-0013)",
    telemetryMetrics: {
      beltTensionMm: 9.5,
      vibrationRms: 2.1,
      coldSoakHours: 24,
      lubricantViscosityDegradation: 30
    },
    isPrevented: false
  }
];

export function computePredictiveRecords(tempC: number = -50): PredictiveMaintenanceRecord[] {
  // Machine learning thermal scaling curve: As temperature drops below -35C, elastomer failure risk increases exponentially
  const coldFactor = Math.max(0, (-tempC - 20) / 30); // 0 at -20C, 1.0 at -50C, 1.5 at -65C
  return INITIAL_PREDICTIVE_RECORDS.map(rec => {
    const adjustedRisk = Math.min(99, Math.max(15, Math.round(rec.riskScore * (0.4 + 0.6 * coldFactor))));
    let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (adjustedRisk >= 85) severity = 'CRITICAL';
    else if (adjustedRisk >= 65) severity = 'HIGH';
    else if (adjustedRisk >= 40) severity = 'MEDIUM';

    let headline = rec.predictionHeadline;
    let horizon = rec.predictedFailureHorizon;
    if (rec.id === "PRD-0001") {
      if (tempC <= -45) {
        headline = "The Snowcat Tractor's engine belt might break by tomorrow, so maintain it today itself.";
        horizon = "Within 18 - 24 hours (Tomorrow by 14:00 UTC)";
      } else if (tempC <= -30) {
        headline = "Snowcat Tractor engine belt showing elevated thermal stress; service within 48 hours.";
        horizon = "Within 48 hours";
      } else {
        headline = "Snowcat Tractor engine belt operating within stable thermal parameters.";
        horizon = "Estimated 7+ days buffer";
      }
    }

    return {
      ...rec,
      riskScore: adjustedRisk,
      severity,
      predictionHeadline: headline,
      predictedFailureHorizon: horizon,
      ambientTempTriggerC: tempC,
      weatherFactor: `${tempC}°C Ambient Polar Stress (Cold Factor: ${(coldFactor * 100).toFixed(0)}%)`
    };
  });
}


export const TASK_STATUSES = ["Pending","In Progress","Completed","Overdue"];

export const INITIAL_TASKS = Array.from({ length: 20 }, (_, i) => {
  const seed = i + 1;
  return {
    id: uid("TSK", i + 1),
    name: pick(["Calibrate weather station","Pack scientific cargo","Conduct safety drill","Inspect generator fuel lines","Submit weekly ice report","Restock medical kits","Test satellite comms link","Survey crevasse field","Update expedition logbook","Brief incoming team"], seed * 2),
    expeditionId: uid("EXP", (seed % 5) + 1),
    assignedTo: uid("PER", (seed % 20) + 1),
    priority: pick(["Low","Medium","High","Critical"], seed * 3),
    deadline: `2026-0${(seed % 9) + 1}-1${seed % 9}`,
    status: pick(TASK_STATUSES, seed * 5),
  };
});

export const EXP_STATUSES = ["Planning","Approved","Preparation","In Transit","Active","Returning","Completed","Cancelled"];

export const INITIAL_EXPEDITIONS = [
  {
    id: "EXP-0001",
    name: "42nd Indian Antarctic Expedition",
    region: "Antarctica",
    destination: "Bharati Station",
    base: "Bharati",
    start: "2026-01-05",
    end: "2026-06-20",
    status: "Active",
    manager: "PER-0001",
    objectives: "Glaciological survey, atmospheric monitoring, and station resupply.",
    description: "Primary summer expedition supporting ongoing scientific research at Bharati Station.",
    currentLat: -70.15,
    currentLng: 77.20,
    waypoints: [
      { id: 'wp-exp1-1', name: 'Bharati Station Gate', lat: -69.41, lng: 76.19, elevationM: 35, passed: true, distanceFromPrevKm: 0 },
      { id: 'wp-exp1-2', name: 'Fisher Island Sea-Ice Crossing', lat: -69.58, lng: 76.45, elevationM: 15, passed: true, distanceFromPrevKm: 24 },
      { id: 'wp-exp1-3', name: 'Stornes Peninsula Staging', lat: -69.75, lng: 76.80, elevationM: 110, passed: true, distanceFromPrevKm: 28 },
      { id: 'wp-exp1-4', name: 'Quilty Nunataks Blue-Ice Strip', lat: -70.15, lng: 77.20, elevationM: 480, passed: false, distanceFromPrevKm: 52, hazardNote: 'Sub-surface crevasses on eastern ridge' },
      { id: 'wp-exp1-5', name: 'Polar Plateau Gateway', lat: -70.80, lng: 77.65, elevationM: 1450, passed: false, distanceFromPrevKm: 76, hazardNote: 'Katabatic wind shear pass' },
      { id: 'wp-exp1-6', name: 'Deep Inland Traverse Depot', lat: -71.40, lng: 78.10, elevationM: 2350, passed: false, distanceFromPrevKm: 72 }
    ]
  },
  {
    id: "EXP-0002",
    name: "13th Indian Arctic Research Expedition",
    region: "Arctic",
    destination: "Himadri Station",
    base: "Himadri",
    start: "2026-04-01",
    end: "2026-09-15",
    status: "Preparation",
    manager: "PER-0002",
    objectives: "Fjord ecosystem study and glacier retreat monitoring near Ny-Alesund.",
    description: "Annual Arctic research mission focused on climate change indicators.",
    currentLat: 79.12,
    currentLng: 12.35,
    waypoints: [
      { id: 'wp-exp2-1', name: 'Ny-Alesund Station Gate', lat: 78.923, lng: 11.928, elevationM: 12, passed: true, distanceFromPrevKm: 0 },
      { id: 'wp-exp2-2', name: 'Kongsfjorden Glacier Front', lat: 79.050, lng: 12.200, elevationM: 45, passed: true, distanceFromPrevKm: 18 },
      { id: 'wp-exp2-3', name: 'Blomstrandhalvøya Island Pass', lat: 79.120, lng: 12.350, elevationM: 110, passed: false, distanceFromPrevKm: 12, hazardNote: 'Tidal ice fracture zone' },
      { id: 'wp-exp2-4', name: 'Kronebreen Calving Terminus', lat: 79.180, lng: 12.550, elevationM: 280, passed: false, distanceFromPrevKm: 15 },
      { id: 'wp-exp2-5', name: 'Holtedahlfonna Icefield Camp', lat: 79.250, lng: 12.800, elevationM: 650, passed: false, distanceFromPrevKm: 18 }
    ]
  },
  {
    id: "EXP-0003",
    name: "43rd Indian Antarctic Expedition - Advance Party",
    region: "Antarctica",
    destination: "Maitri Station",
    base: "Maitri",
    start: "2026-09-10",
    end: "2027-02-28",
    status: "Planning",
    manager: "PER-0003",
    objectives: "Pre-positioning of supplies and station handover preparation.",
    description: "Advance logistics party ahead of the main 43rd expedition.",
    currentLat: -71.36,
    currentLng: 12.15,
    waypoints: [
      { id: 'wp-exp3-1', name: 'Maitri Depot Gate', lat: -70.76, lng: 11.73, elevationM: 260, passed: true, distanceFromPrevKm: 0 },
      { id: 'wp-exp3-2', name: 'Intermediate Staging Gate', lat: -71.08, lng: 12.02, elevationM: 740, passed: true, distanceFromPrevKm: 38 },
      { id: 'wp-exp3-3', name: 'Blue-Ice Ridge Bypass', lat: -71.36, lng: 12.15, elevationM: 1200, passed: false, distanceFromPrevKm: 32, hazardNote: 'Active shear crevasse field' },
      { id: 'wp-exp3-4', name: 'Firn Dome Staging', lat: -71.60, lng: 12.32, elevationM: 1820, passed: false, distanceFromPrevKm: 30 },
      { id: 'wp-exp3-5', name: 'East Sastrugi Approach', lat: -71.78, lng: 12.58, elevationM: 2240, passed: false, distanceFromPrevKm: 25, hazardNote: 'Deep snow sastrugi drifts' },
      { id: 'wp-exp3-6', name: 'South Pole Inland Depot', lat: -71.95, lng: 12.90, elevationM: 2680, passed: false, distanceFromPrevKm: 24 }
    ]
  },
  { id: "EXP-0004", name: "Southern Ocean Krill Survey", region: "Antarctica", destination: "Bharati Station", base: "Bharati", start: "2025-11-01", end: "2026-02-10", status: "Completed", manager: "PER-0004", objectives: "Krill population assessment for fisheries research.", description: "Completed marine biology survey mission in the Southern Ocean." },
  { id: "EXP-0005", name: "Arctic Glaciology Winter Study", region: "Arctic", destination: "Himadri Station", base: "Himadri", start: "2026-02-01", end: "2026-05-30", status: "In Transit", manager: "PER-0005", objectives: "Winter ice-core sampling and permafrost temperature logging.", description: "Specialized winter research team en route to Himadri Station." },
];

export const INITIAL_EXPENSES = INITIAL_EXPEDITIONS.map((e, i) => ({
  expeditionId: e.id,
  transportation: 800000 + i * 150000,
  equipment: 400000 + i * 90000,
  maintenance: 120000 + i * 30000,
  inventory: 300000 + i * 60000,
  shipment: 250000 + i * 45000,
  other: 80000 + i * 15000,
}));

export const INITIAL_USERS = [
  {
    id: "RSC-0142",
    name: "Dr. Elena Rostova",
    role: "Scientist / Team Member",
    email: "elena.rostova@polar.gov.in",
    password: "polar2026",
    active: true,
  },
  {
    id: "AST-0101",
    name: "Vikram Nair",
    role: "Asset Manager",
    email: "vikram.nair@polar.gov.in",
    password: "polar2026",
    active: true,
  },
  {
    id: "TRN-0301",
    name: "Marcus Vance",
    role: "Logistics Officer",
    email: "marcus.vance@polar.gov.in",
    password: "polar2026",
    active: true,
  },
  {
    id: "ADM-0001",
    name: "Station Commander",
    role: "Super Admin",
    email: "admin@polar.gov.in",
    password: "polar2026",
    active: true,
  },
  ...ROLES.flatMap((role, ri) => [1, 2].map((n) => ({
    id: `USR-${ri}${n}`,
    name: `${pick(FIRST, ri * 3 + n)} ${pick(LAST, ri * 5 + n)}`,
    role,
    email: `user${ri}${n}@polar.gov.in`,
    password: "polar2026",
    active: true,
  }))),
];

export const INITIAL_AUDIT_LOG = Array.from({ length: 25 }, (_, i) => {
  const seed = i + 1;
  return {
    id: `AUD-${seed}`,
    user: `${pick(FIRST, seed)} ${pick(LAST, seed * 2)}`,
    action: pick(["Logged in","Created expedition","Assigned asset","Updated inventory","Created shipment","Updated maintenance status","Created user","Deleted record"], seed * 4),
    entity: pick(["User","Expedition","Asset","Inventory","Shipment","Maintenance"], seed * 3),
    timestamp: `2026-0${(seed % 9) + 1}-${String((seed % 27) + 1).padStart(2,"0")} ${String((seed*7)%24).padStart(2,"0")}:${String((seed*13)%60).padStart(2,"0")}`,
    details: "Auto-generated demo log entry.",
  };
});

export const INITIAL_COMPLETED_WORK_LOGS = [
  {
    id: "CWL-001",
    timestamp: "2026-09-07 05:42 UTC",
    timeStr: "05:42 AM",
    category: "maintenance" as const,
    title: "Generator Fuel Line Thermal Trace Activation & Cleared Rail Pressure Warning",
    entityId: "AST-0004",
    entityName: "Polar Heavy Generator Unit 1",
    stationOrExpedition: "Bharati Station",
    assignedToOrOperator: "Suresh Menon (PER-0015)",
    clearedBy: "AI Autonomous Janitor" as const,
    actionTaken: "Activated secondary trace heater blanket, balanced rail pressure from 1.8 to 3.8 bar, cleared technician ticket from active queue.",
    resolutionNotes: "Paraffin wax micro-crystals dissolved from micron pre-filter mesh. System rail pressure stabilized at nominal 3.8 bar.",
    avertedImpactOrSavings: "Averted base blackout, saved $14,000 in emergency generator overhaul.",
    status: "Archived & Verified" as const
  },
  {
    id: "CWL-002",
    timestamp: "2026-09-06 18:20 UTC",
    timeStr: "06:20 PM",
    category: "task" as const,
    title: "Snowcat Tractor Belt Inspection & Pre-Failure Replacement",
    entityId: "AST-0001",
    entityName: "Snowcat Heavy Tractor (Arctic Spec)",
    stationOrExpedition: "Maitri Station",
    assignedToOrOperator: "Rahul Bose (PER-0013)",
    clearedBy: "AI Autonomous Janitor" as const,
    actionTaken: "Confirmed HNBR serpentine belt replacement with 8.2mm tension, verified cold-soak elasticity, cleared maintenance task.",
    resolutionNotes: "Pre-failure replacement completed prior to traverse. Belt vitrification stress test passed down to -50°C.",
    avertedImpactOrSavings: "Saved 48h traverse delay in -50°C blizzard.",
    status: "Archived & Verified" as const
  },
  {
    id: "CWL-003",
    timestamp: "2026-09-06 11:15 UTC",
    timeStr: "11:15 AM",
    category: "route" as const,
    title: "Convoy PBD-04 Tactical Sastrugi Reroute & Hazard Clearing",
    entityId: "EXP-0001",
    entityName: "Convoy PBD-04 Blue-Ice Corridor",
    stationOrExpedition: "Wohlthat Range",
    assignedToOrOperator: "Dr. Vikram Sarabhai (PER-0001)",
    clearedBy: "AI Autonomous Janitor" as const,
    actionTaken: "Synthetic aperture radar scanned crevasse field, generated 99.4% safe route, pushed to crawler autopilot, cleared route hazard task.",
    resolutionNotes: "Active route safely routed 800m north of dangerous transverse fissure field. Convoy completed passage without incident.",
    avertedImpactOrSavings: "Zero crevasse incidents, +3.2h transit speed.",
    status: "Archived & Verified" as const
  },
  {
    id: "CWL-004",
    timestamp: "2026-09-05 09:30 UTC",
    timeStr: "09:30 AM",
    category: "inventory" as const,
    title: "Sub-Zero Emergency Fuel Buffer Elevation at Maitri",
    entityId: "INV-0002",
    entityName: "Arctic Diesel Fuel F-34 Reserves",
    stationOrExpedition: "Maitri Station",
    assignedToOrOperator: "Priya Sharma (PER-0002)",
    clearedBy: "AI Autonomous Janitor" as const,
    actionTaken: "Calculated 5-day blizzard heating consumption model, elevated fuel threshold from 4,000L to 8,500L, issued pre-order, cleared buffer advisory.",
    resolutionNotes: "Depot reserves topped up to 14,200L before katabatic storm closure. Temperature dropped to -44°C safely.",
    avertedImpactOrSavings: "100% heating supply continuity.",
    status: "Archived & Verified" as const
  },
  {
    id: "CWL-005",
    timestamp: "2026-09-04 14:05 UTC",
    timeStr: "02:05 PM",
    category: "alert" as const,
    title: "VHF Repeater Antenna Troposcatter Frequency Re-Alignment",
    entityId: "ALT-0006",
    entityName: "VHF Repeater #3 (Princess Astrid Coast)",
    stationOrExpedition: "Himadri Station",
    assignedToOrOperator: "Amit Patel (PER-0003)",
    clearedBy: "AI Autonomous Janitor" as const,
    actionTaken: "Shifted transmission link to 142.800 MHz with adaptive forward error correction, cleared packet loss alert.",
    resolutionNotes: "Atmospheric ducting disturbance mitigated. Telemetry packet error rate dropped from 42% to 0.02%.",
    avertedImpactOrSavings: "Restored 99.8% continuous scientific telemetry.",
    status: "Archived & Verified" as const
  }
];

export function emitAiActionBroadcast(entry: {
  category: 'logistics' | 'power' | 'weather' | 'sar' | 'inventory' | 'maintenance';
  message: string;
  stationOrAsset?: string;
  impact?: string;
}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('polar-ai-action-event', {
      detail: {
        id: `act-${Date.now()}`,
        timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: entry.category,
        prefix: 'AI:',
        message: entry.message,
        stationOrAsset: entry.stationOrAsset,
        impact: entry.impact
      }
    }));
  }
}


export function buildAlerts() {
  const list: any[] = [];
  let n = 1;

  // Active inventory alerts
  INITIAL_INVENTORY.filter(i => i.quantity <= i.minStock).forEach(i => {
    list.push({
      id: `ALT-${n++}`,
      severity: "HIGH",
      type: "Low Inventory",
      description: `${i.name} at ${i.location} is at or below minimum stock (${i.quantity}/${i.minStock} ${i.unit}).`,
      relatedId: i.id,
      expeditionId: null,
      date: "2026-08-2" + (n % 9),
      read: false,
      autoResolved: false
    });
  });

  // Active asset alerts
  INITIAL_ASSETS.filter(a => a.status === "Under Maintenance" || a.status === "Damaged").forEach(a => {
    list.push({
      id: `ALT-${n++}`,
      severity: a.status === "Damaged" ? "CRITICAL" : "MEDIUM",
      type: a.status === "Damaged" ? "Asset Damaged" : "Maintenance Due",
      description: `${a.name} (${a.id}) is ${a.status.toLowerCase()} - next service ${a.nextMaintenance}.`,
      relatedId: a.id,
      expeditionId: a.expeditionId,
      date: "2026-08-1" + (n % 9),
      read: false,
      autoResolved: false
    });
  });

  // Active shipment alerts
  INITIAL_SHIPMENTS.filter(s => s.status === "Delayed").forEach(s => {
    list.push({
      id: `ALT-${n++}`,
      severity: "MEDIUM",
      type: "Shipment Delayed",
      description: `Shipment ${s.id} to ${s.destination} is delayed (expected ${s.expectedArrival}).`,
      relatedId: s.id,
      expeditionId: s.expeditionId,
      date: "2026-08-0" + (n % 9),
      read: false,
      autoResolved: false
    });
  });

  // Safety & Expedition alerts
  ["Critical satellite uplink redundancy required before Himadri departure.", "Crevasse field near Bharati flagged unsafe pending resurvey.", "Fuel reserve at Maitri projected below 30-day buffer."].forEach((desc, idx) => {
    list.push({
      id: `ALT-${n++}`,
      severity: idx === 0 ? "CRITICAL" : "LOW",
      type: "Safety Warning",
      description: desc,
      relatedId: null,
      expeditionId: INITIAL_EXPEDITIONS[idx % INITIAL_EXPEDITIONS.length].id,
      date: "2026-08-0" + (idx + 1),
      read: idx === 2,
      autoResolved: false
    });
  });

  // =========================================================================
  // HISTORICAL ALERTS: AUTO-RESOLVED BY AI (Demonstrating autonomous resolution)
  // =========================================================================
  const autoResolvedAlerts = [
    {
      id: `ALT-${n++}`,
      severity: "HIGH",
      type: "Fuel Line Pressure Anomaly",
      description: "Fuel line rail pressure dropped to 1.8 bar on 20kW Polar Diesel Generator Unit 1 due to -50°C cold-soak.",
      relatedId: "AST-0004",
      expeditionId: "EXP-0001",
      date: "2026-08-25",
      read: true,
      autoResolved: true,
      autoResolvedTag: "Auto-Resolved by AI",
      autoResolvedAt: "2026-08-25 14:32 UTC",
      autoResolvedReason: "AI triggered autonomous heating trace wire activation & closed paraffin anti-gel dosing loop. Rail pressure restored to 3.8 bar.",
      impactAverted: "Averted catastrophic base generator power blackout during sub-zero night."
    },
    {
      id: `ALT-${n++}`,
      severity: "MEDIUM",
      type: "Logistics Transit Delay Risk",
      description: "Resupply Ship MV Vasiliy Golovnin encountered heavy pack ice near Prydz Bay approach.",
      relatedId: "TRN-0001",
      expeditionId: "EXP-0001",
      date: "2026-08-24",
      read: true,
      autoResolved: true,
      autoResolvedTag: "Auto-Resolved by AI",
      autoResolvedAt: "2026-08-24 09:15 UTC",
      autoResolvedReason: "AI fused multi-spectral satellite radar imagery, computed dynamic open leads corridor, and updated autopilot heading.",
      impactAverted: "Eliminated 36-hour pack ice stagnation and saved 8,200L bunker fuel."
    },
    {
      id: `ALT-${n++}`,
      severity: "CRITICAL",
      type: "Predictive Thermal Vitrification",
      description: "Hydraulic actuator seal elasticity on Snowcat Tractor dropped 68% under sustained -50°C blizzard load.",
      relatedId: "AST-0001",
      expeditionId: "EXP-0003",
      date: "2026-08-23",
      read: true,
      autoResolved: true,
      autoResolvedTag: "Auto-Resolved by AI",
      autoResolvedAt: "2026-08-23 18:40 UTC",
      autoResolvedReason: "AI scheduled proactive workshop bay pre-heat and queued Arctic HNBR seal kit replacement before field traverse.",
      impactAverted: "Prevented hydraulic rupture and 48-hour rescue extraction in whiteout conditions."
    },
    {
      id: `ALT-${n++}`,
      severity: "LOW",
      type: "Telemetry Radio Link Degradation",
      description: "VHF transceiver packet loss between Himadri Base and Zeppelin Observatory exceeded 14%.",
      relatedId: "AST-0006",
      expeditionId: "EXP-0002",
      date: "2026-08-22",
      read: true,
      autoResolved: true,
      autoResolvedTag: "Auto-Resolved by AI",
      autoResolvedAt: "2026-08-22 11:20 UTC",
      autoResolvedReason: "AI shifted transmission frequency to 142.800 MHz and engaged adaptive forward error correction on troposcatter channel.",
      impactAverted: "Restored 99.8% continuous scientific data logging telemetry."
    },
    {
      id: `ALT-${n++}`,
      severity: "HIGH",
      type: "Emergency Rations Buffer Depletion",
      description: "High-Calorie Field Rations inventory at Maitri Station approached critical 14-day blizzard buffer.",
      relatedId: "INV-0002",
      expeditionId: "EXP-0003",
      date: "2026-08-21",
      read: true,
      autoResolved: true,
      autoResolvedTag: "Auto-Resolved by AI",
      autoResolvedAt: "2026-08-21 16:05 UTC",
      autoResolvedReason: "AI auto-generated high-priority airlift requisition and synchronized delivery with IAF C-17 scheduled flight window.",
      impactAverted: "Restocked +450 daily rations prior to winter closure."
    }
  ];

  list.push(...autoResolvedAlerts);

  return list;
}

export function computeReadiness(exp: any, db?: any) {
  const currentAssets = db?.assets || INITIAL_ASSETS;
  const currentPersonnel = db?.personnel || INITIAL_PERSONNEL;
  const currentShipments = db?.shipments || INITIAL_SHIPMENTS;
  const currentInventory = db?.inventory || INITIAL_INVENTORY;

  const linkedAssets = currentAssets.filter((a: any) => a.expeditionId === exp.id);
  const linkedPersonnel = currentPersonnel.filter((p: any) => p.expeditionId === exp.id);
  const linkedShipments = currentShipments.filter((s: any) => s.expeditionId === exp.id);
  const personnelScore = Math.min(100, 60 + linkedPersonnel.length * 6);
  const assetsReady = linkedAssets.length ? Math.round((linkedAssets.filter((a: any) => ["Assigned","In Use","Available"].includes(a.status)).length / linkedAssets.length) * 100) : 70;
  const invScore = Math.round((currentInventory.filter((i: any) => i.quantity > i.minStock).length / currentInventory.length) * 100);
  const transportScore = linkedShipments.length ? Math.round((linkedShipments.filter((s: any) => ["Delivered","In Transit","Dispatched"].includes(s.status)).length / linkedShipments.length) * 100) : 65;
  const maintScore = Math.round((currentAssets.filter((a: any) => a.status !== "Under Maintenance" && a.status !== "Damaged").length / currentAssets.length) * 100);
  const overall = Math.round((personnelScore + assetsReady + invScore + transportScore + maintScore) / 5);
  return { overall, personnel: personnelScore, assets: assetsReady, inventory: invScore, transport: transportScore, maintenance: maintScore };
}

export const currency = (n: number) => `\u20B9${n.toLocaleString("en-IN")}`;

export function badgeColors(status: string, t: any) {
  const green = ["Active","Completed","Available","Delivered","Excellent","Good"];
  const amber = ["Preparation","Planning","In Transit","Assigned","Fair","In Progress","Pending","Dispatched","Packed","Scheduled","En Route"];
  const red = ["Cancelled","Damaged","Lost","Overdue","Delayed","Poor","Critical","Unavailable","CRITICAL","HIGH"];
  const blue = ["Approved","Returning","In Use","On Expedition","Completed Task"];
  if (green.includes(status)) return { bg: t.greenSoft, fg: t.green };
  if (amber.includes(status)) return { bg: t.amberSoft, fg: t.amber };
  if (red.includes(status)) return { bg: t.redSoft, fg: t.red };
  if (blue.includes(status)) return { bg: t.blueSoft, fg: t.blue };
  return { bg: t.bgAlt, fg: t.textDim };
}

export function csvDownload(filename: string, rows: any[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g,'""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
