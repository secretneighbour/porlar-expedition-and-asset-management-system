import { SimulationScenario, SimulationTimelineEvent, SimulationSafetyLevel } from '../types';

/* ==========================================================================
   PRE-BUILT MISSION TRAINING SCENARIOS
   ========================================================================== */

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  // --------------------------------------------------------------------------
  // Scenario 1: Trans-Antarctic Resupply
  // --------------------------------------------------------------------------
  {
    id: 'SIM-SCEN-01',
    scenarioNumber: 1,
    name: 'Trans-Antarctic Resupply',
    code: 'RESUPPLY-ALPHA',
    sector: 'Maitri Station to South Pole Inland Traverse',
    difficulty: 'ELEVATED',
    estimatedDurationSeconds: 2400, // 40 simulated minutes (T+00:00 -> T+40:00)
    description: 'A 28-ton heavy Snowcat supply convoy departs Maitri Station bound for the high inland plateau. As temperatures plummet, mechanical vibration anomalies emerge, followed by a Category-2 katabatic blizzard and an active crevasse field breach requiring autonomous S.A.R. intervention.',
    primaryObjectives: [
      'Maintain convoy progress along designated safe blue-ice corridors.',
      'Identify and remediate pre-failure alternator tensioner vibration before traverse stranding.',
      'Respond to sudden blizzard fuel burn surges and elevate safety stock reserves.',
      'Execute autonomous zero-click S.A.R. dispatch when a snow-bridge collapse occurs.'
    ],
    expectedFailureModes: [
      'Engine belt vitrification and shear at -48°C ambient cold-soak.',
      'Direct collision with newly formed shear crevasses C-104 and F-88.',
      'Fuel exhaustion due to unpredicted heating surge (+190% burn rate).',
      'Loss of SATCOM uplink during katabatic storm.'
    ],
    initialStateOverrides: {
      tempC: -34,
      windKnots: 18,
      condition: 'COND-2_CAUTION',
    },
    events: [
      {
        id: 'EVT-01-00',
        second: 0,
        timeFormatted: 'T+00:00',
        title: 'Traverse Departure Authorized',
        description: 'Convoy PBD-Alpha and Sledge Tug depart Maitri Depot Gate. All systems nominal.',
        category: 'logistics',
        severity: 'info',
        safetyLevel: 'OBSERVE',
        targetAssetId: 'ast-pb300-1',
        coordinates: { lat: -70.76, lng: 11.73 },
        impactSummary: 'Convoy underway. Telemetry heartbeat established.'
      },
      {
        id: 'EVT-01-08',
        second: 480, // T+08:00
        title: 'Ambient Temperature Drop (-48°C)',
        description: 'Rapid katabatic cold front sweeps off Wohlthat Massif. Ambient temp plunges to -48°C with -64°C wind chill.',
        category: 'weather',
        severity: 'advisory',
        safetyLevel: 'OBSERVE',
        coordinates: { lat: -71.10, lng: 12.05 },
        impactSummary: 'Cold-soak stress initiated. Lubricant viscosity increasing.'
      },
      {
        id: 'EVT-01-10',
        second: 600, // T+10:00
        title: 'Crawler Vibration Spike (4.6 mm/s)',
        description: 'Vibration sensors on AST-PB300-1 detect anomalous 3rd-order harmonic oscillation on engine tensioner pulley.',
        category: 'mechanical',
        severity: 'warning',
        safetyLevel: 'ASSIST',
        targetAssetId: 'ast-pb300-1',
        impactSummary: 'Micro-cracking detected along belt ribs. Pre-failure window opening.'
      },
      {
        id: 'EVT-01-12',
        second: 720, // T+12:00
        title: 'AI Predictive Maintenance Alert',
        description: 'Machine Learning forecaster flags 78% failure risk within 18 hours. Immediate tensioner swap recommended.',
        category: 'mechanical',
        severity: 'warning',
        safetyLevel: 'ASSIST',
        targetAssetId: 'ast-pb300-1',
        impactSummary: 'Predictive alert logged: "Maintain today itself to avert traverse stranding."'
      },
      {
        id: 'EVT-01-13',
        second: 780, // T+13:00
        title: 'AI Recommendation Prepared',
        description: 'AI schedules preventive service window at Intermediate Staging Gate. Part #CAT-BELT-88 reserved from depot.',
        category: 'mechanical',
        severity: 'info',
        safetyLevel: 'ASSIST',
        targetAssetId: 'ast-pb300-1',
        impactSummary: 'Averts 48 hours of emergency field recovery downtime.'
      },
      {
        id: 'EVT-01-16',
        second: 960, // T+16:00
        title: 'Category-2 Blizzard Warning',
        description: 'AWOS radar confirms advancing blizzard: 52 kt sustained gusts, severe sastrugi drift, zero ground visibility.',
        category: 'weather',
        severity: 'critical',
        safetyLevel: 'AUTONOMOUS',
        coordinates: { lat: -71.42, lng: 12.28 },
        impactSummary: 'Condition elevated to COND-1_SEVERE_BLIZZARD. Safe speed restricted to 8 km/h.'
      },
      {
        id: 'EVT-01-17',
        second: 1020, // T+17:00
        title: 'Satellite CV Route Recalculated',
        description: 'Sentinel-1 radar detects active shear crevasse C-104 across legacy line. AI pathfinder computes blue-ice bypass corridor.',
        category: 'route',
        severity: 'info',
        safetyLevel: 'AUTONOMOUS',
        coordinates: { lat: -71.36, lng: 12.15 },
        impactSummary: 'Pushes safe route with 300m safety buffer to crawler GPS terminals.'
      },
      {
        id: 'EVT-01-22',
        second: 1320, // T+22:00
        title: 'Blizzard Heating Fuel Surge (+190%)',
        description: 'Station and crawler thermal jackets running at 290% load. Daily fuel burn accelerates to 1,450 L/day.',
        category: 'logistics',
        severity: 'warning',
        safetyLevel: 'AUTONOMOUS',
        impactSummary: 'AI dynamically elevates minimum fuel safety buffer from 4,000L to 8,500L.'
      },
      {
        id: 'EVT-01-30',
        second: 1800, // T+30:00
        title: 'SATCOM Signal Instability (18%)',
        description: 'Severe auroral storm activity degrades satellite uplink. Workstation automatically switches to cached offline store.',
        category: 'comms',
        severity: 'warning',
        safetyLevel: 'OBSERVE',
        impactSummary: 'Local queueing enabled. Zero data loss during communications blackout.'
      },
      {
        id: 'EVT-01-35',
        second: 2100, // T+35:00
        title: 'MAYDAY: Crevasse Breach Ingested',
        description: 'Field mobile beacon reports Snowcat lead track breached concealed 25m slot void on Leverett Glacier (-85.25°, 151.10°).',
        category: 'sar',
        severity: 'emergency',
        safetyLevel: 'AUTONOMOUS',
        coordinates: { lat: -85.25, lng: 151.10 },
        impactSummary: 'Emergency klaxon triggered. Automated S.A.R. dispatch activated.'
      },
      {
        id: 'EVT-01-36',
        second: 2160, // T+36:00
        title: 'Zero-Click S.A.R. Scramble Executed',
        description: 'AI computes nearest base (Amundsen-Scott 530km), scrambles FLIR Drone Falcon-X and P300 Tracked Rescue Crawler.',
        category: 'sar',
        severity: 'critical',
        safetyLevel: 'AUTONOMOUS',
        impactSummary: 'Drone ETA 219m, Track Team ETA 1223m. Field survivor countdown synchronized.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Scenario 2: Vehicle Mechanical Failure
  // --------------------------------------------------------------------------
  {
    id: 'SIM-SCEN-02',
    scenarioNumber: 2,
    name: 'Heavy Vehicle Mechanical Failure',
    code: 'MECH-FAILURE',
    sector: 'Leverett Glacier High Plateau',
    difficulty: 'SEVERE',
    estimatedDurationSeconds: 1800, // 30 simulated minutes
    description: 'Models catastrophic elastomer vitrification on heavy traverse crawlers operating under severe -58°C cold-soak. Follows progressive harmonic vibration degradation, AI predictive intervention, vehicle stall, spare allocation, and field recovery.',
    primaryObjectives: [
      'Observe sensor telemetry degradation on crawler tensioner pulleys.',
      'Evaluate predictive AI failure horizon curves before breakdown occurs.',
      'Perform field maintenance swap using replacement HNBR serpentine belts.',
      'Restore crawler operational readiness and verify sensor normalization.'
    ],
    expectedFailureModes: [
      'Complete alternator belt shear stalling cooling pump.',
      'Hydraulic line freeze resulting in track lock.',
      'Traverse schedule bottleneck on high plateau.'
    ],
    initialStateOverrides: {
      tempC: -45,
      windKnots: 22,
      condition: 'COND-2_CAUTION',
    },
    events: [
      {
        id: 'EVT-02-00',
        second: 0,
        timeFormatted: 'T+00:00',
        title: 'High Plateau Traverse Underway',
        description: 'AST-PB300-1 operating at 2,150m MSL. Baseline vibration 1.8 mm/s, engine temp nominal.',
        category: 'mechanical',
        severity: 'info',
        safetyLevel: 'OBSERVE',
        targetAssetId: 'ast-pb300-1'
      },
      {
        id: 'EVT-02-05',
        second: 300, // T+05:00
        title: 'Extreme Cold-Soak Influx (-58°C)',
        description: 'Ambient temp drops below chloroprene glass transition threshold (-42°C). Elastomers becoming glassy.',
        category: 'weather',
        severity: 'warning',
        safetyLevel: 'OBSERVE',
        impactSummary: 'Rubber elasticity drops by 78%. High micro-cracking probability.'
      },
      {
        id: 'EVT-02-10',
        second: 600, // T+10:00
        title: 'FFT Harmonic Vibration Spike (4.8 mm/s)',
        description: 'Vibration amplitude exceeds 4.5 mm/s alarm ceiling. High-frequency pulley slip detected.',
        category: 'mechanical',
        severity: 'warning',
        safetyLevel: 'ASSIST',
        targetAssetId: 'ast-pb300-1',
        impactSummary: 'Risk score elevated to 94%. Failure predicted within 18 hours.'
      },
      {
        id: 'EVT-02-14',
        second: 840, // T+14:00
        title: 'AI Proactive Maintenance Directive',
        description: 'Predictive engine issues: "The Snowcat Tractor engine belt might break by tomorrow, so maintain it today itself."',
        category: 'mechanical',
        severity: 'warning',
        safetyLevel: 'ASSIST',
        targetAssetId: 'ast-pb300-1',
        impactSummary: 'Operator prompted to execute preventive swap.'
      },
      {
        id: 'EVT-02-18',
        second: 1080, // T+18:00
        title: 'Belt Micro-Tear Threshold Breached',
        description: 'Belt slippage surpasses 18%. Coolant pump RPM declining; engine block temp rising abnormally (+14°C).',
        category: 'mechanical',
        severity: 'critical',
        safetyLevel: 'ASSIST',
        targetAssetId: 'ast-pb300-1'
      },
      {
        id: 'EVT-02-22',
        second: 1320, // T+22:00
        title: 'Simulated Belt Shear & Vehicle Stall',
        description: 'Engine belt snaps. Automatic engine shutdown engaged to prevent block seizure. Vehicle immobilized.',
        category: 'mechanical',
        severity: 'critical',
        safetyLevel: 'AUTONOMOUS',
        targetAssetId: 'ast-pb300-1',
        impactSummary: 'Asset status set to "maintenance". Trailing vehicles alerted.'
      },
      {
        id: 'EVT-02-26',
        second: 1560, // T+26:00
        title: 'AI Spare Part Allocation',
        description: 'Inventory management system reserves 1x Arctic HNBR Serpentine Belt from Support Sledge Alpha.',
        category: 'logistics',
        severity: 'info',
        safetyLevel: 'AUTONOMOUS',
        impactSummary: 'Spare part logged: 8 units remaining in regional stock.'
      },
      {
        id: 'EVT-02-30',
        second: 1800, // T+30:00
        title: 'Service Completed & Sensor Normalization',
        description: 'Replacement belt installed with Webasto pre-heating. Vibration drops to 1.4 mm/s. Vehicle restored to Nominal.',
        category: 'mechanical',
        severity: 'info',
        safetyLevel: 'AUTONOMOUS',
        targetAssetId: 'ast-pb300-1',
        impactSummary: 'Mission resumed. $18,500 recovery expense successfully averted.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Scenario 3: Severe Katabatic Blizzard
  // --------------------------------------------------------------------------
  {
    id: 'SIM-SCEN-03',
    scenarioNumber: 3,
    name: 'Category-3 Severe Katabatic Blizzard',
    code: 'BLIZZARD-CAT3',
    sector: 'Queen Maud Land Coastal Ice Shelf',
    difficulty: 'SEVERE',
    estimatedDurationSeconds: 2100, // 35 simulated minutes
    description: 'A violent katabatic gale accelerates down continental ice slopes, dropping temperatures to -62°C with 65-knot gusts. Forces sub-zero danger zone expansions, supply route closures, automated fuel surge rebalancing, and shelter lock-down protocols.',
    primaryObjectives: [
      'Monitor barometric pressure plunge and early katabatic shear warnings.',
      'Expand geospatial sub-zero danger zones and reroute traverse convoys.',
      'Rebalance station power grids and calculate blizzard heating fuel consumption.',
      'Issue automated supply ship replenishment directive before coastal harbor freeze.'
    ],
    expectedFailureModes: [
      'Structural wind damage to mobile shelter pods.',
      'Life-support fuel exhaustion without dynamic stock elevation.',
      'Hypothermia hazard outside heated station habitats (<12 minute survival window).'
    ],
    initialStateOverrides: {
      tempC: -38,
      windKnots: 20,
      condition: 'COND-2_CAUTION',
    },
    events: [
      {
        id: 'EVT-03-00',
        second: 0,
        timeFormatted: 'T+00:00',
        title: 'Meteorological Watch Active',
        description: 'AWOS Barometric pressure steady at 984 hPa. Base power grid operating on nominal diesel-solar blend.',
        category: 'weather',
        severity: 'info',
        safetyLevel: 'OBSERVE'
      },
      {
        id: 'EVT-03-06',
        second: 360, // T+06:00
        title: 'Barometric Plunge (-18 hPa in 2h)',
        description: 'Steep pressure gradient indicates imminent gravity-driven katabatic wind funneling off high polar plateau.',
        category: 'weather',
        severity: 'warning',
        safetyLevel: 'OBSERVE',
        impactSummary: 'Katabatic wind shear warning broadcast to all field parties.'
      },
      {
        id: 'EVT-03-12',
        second: 720, // T+12:00
        title: 'Blizzard Touchdown: 65 kt Gales (-62°C)',
        description: 'Full Category-3 blizzard engulfs coastal oasis. Wind chill reaches -78°C; ground visibility collapses to zero.',
        category: 'weather',
        severity: 'critical',
        safetyLevel: 'AUTONOMOUS',
        impactSummary: 'Condition Level set to COND-1_SEVERE_BLIZZARD. Station storm doors auto-locked.'
      },
      {
        id: 'EVT-03-15',
        second: 900, // T+15:00
        title: 'Sub-Zero Danger Zone Expansion',
        description: 'Dynamic heatmap models lethal cold pool extending 120km along ice shelf. Human survival time < 10 mins.',
        category: 'hazard',
        severity: 'critical',
        safetyLevel: 'OBSERVE',
        coordinates: { lat: -70.76, lng: 11.73 },
        impactSummary: 'Map hazard layers dynamically updated with red exclusion zones.'
      },
      {
        id: 'EVT-03-18',
        second: 1080, // T+18:00
        title: 'Traverse Routes Closed & Vehicles Anchored',
        description: 'All field crawl operations suspended. Snowcats instructed to deploy snow-anchors and activate emergency thermal loop.',
        category: 'route',
        severity: 'warning',
        safetyLevel: 'AUTONOMOUS',
        impactSummary: 'Prevents rollover in 65kt gusts. Crew secured in survival pods.'
      },
      {
        id: 'EVT-03-24',
        second: 1440, // T+24:00
        title: 'Blizzard Fuel Consumption Surge (+190%)',
        description: 'Habitats consuming 1,450 L/day (+190% over standard 500 L/day). Projected 3-day blizzard burns 4,350L.',
        category: 'logistics',
        severity: 'warning',
        safetyLevel: 'AUTONOMOUS',
        impactSummary: 'AI elevates minimum safety threshold from 4,000L to 8,500L.'
      },
      {
        id: 'EVT-03-28',
        second: 1680, // T+28:00
        title: 'Early Supply Ship Replenishment Directive',
        description: 'Automated request transmitted to icebreaker MV Vasiliy Golovnin for 45,000L Arctic Diesel dispatch from Cape Town.',
        category: 'logistics',
        severity: 'info',
        safetyLevel: 'AUTONOMOUS',
        impactSummary: 'Guarantees delivery before winter sea-ice locks coastal access.'
      },
      {
        id: 'EVT-03-34',
        second: 2040, // T+34:00
        title: 'Gale Subsiding & Habitat Inspection',
        description: 'Winds ease to 32 kt. Structural wind defense logged to audit ledger. All personnel accounted for without casualty.',
        category: 'weather',
        severity: 'info',
        safetyLevel: 'OBSERVE',
        impactSummary: 'Blizzard defense protocol successfully verified.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Scenario 4: Communications Blackout
  // --------------------------------------------------------------------------
  {
    id: 'SIM-SCEN-04',
    scenarioNumber: 4,
    name: 'Blackout Communications Loss & Offline Cache',
    code: 'COMMS-BLACKOUT',
    sector: 'High Latitude Ionospheric Disturbance Sector',
    difficulty: 'BLACKOUT',
    estimatedDurationSeconds: 1800, // 30 simulated minutes
    description: 'A major Class X solar coronal mass ejection bombards polar upper-atmosphere layers, degrading SATCOM uplinks to 0%. Tests the local offline queueing architecture, browser cache persistence, delayed telemetry queuing, and automatic catch-up synchronization upon link restoration.',
    primaryObjectives: [
      'Observe graceful transition from LIVE SATCOM SYNC to OFFLINE CACHE mode.',
      'Record local operator tasks, maintenance actions, and waypoints into offline queue.',
      'Ensure zero UI freeze or data loss during extended satellite outage.',
      'Verify automated queue reconciliation and forensic audit trail once SATCOM restores.'
    ],
    expectedFailureModes: [
      'UI crash caused by failed remote REST/WebSocket calls.',
      'Divergence between client-side state and server truth.',
      'Duplicate action replay upon re-establishing network connection.'
    ],
    initialStateOverrides: {
      tempC: -40,
      windKnots: 25,
      condition: 'COND-2_CAUTION',
    },
    events: [
      {
        id: 'EVT-04-00',
        second: 0,
        timeFormatted: 'T+00:00',
        title: 'SATCOM Mesh Nominal',
        description: 'All 4 ground terminals connected via AES-GCM encrypted polar link. WebSocket status: Nominal.',
        category: 'comms',
        severity: 'info',
        safetyLevel: 'OBSERVE'
      },
      {
        id: 'EVT-04-06',
        second: 360, // T+06:00
        title: 'Ionospheric Scintillation Detected',
        description: 'Solar energetic proton influx disrupts Iridium satellite constellation cross-links in polar orbits.',
        category: 'comms',
        severity: 'advisory',
        safetyLevel: 'OBSERVE',
        impactSummary: 'Link packet loss increases to 42%. Latency spikes to 3,400ms.'
      },
      {
        id: 'EVT-04-10',
        second: 600, // T+10:00
        title: 'SATCOM Uplink Blackout (0% Signal)',
        description: 'Total satellite signal loss. WebSocket socket closes. System switches immediately to OFFLINE LOCAL CACHE.',
        category: 'comms',
        severity: 'critical',
        safetyLevel: 'AUTONOMOUS',
        impactSummary: 'Top toolbar displays blinking "OFFLINE CACHE" badge. Local event queue engaged.'
      },
      {
        id: 'EVT-04-14',
        second: 840, // T+14:00
        title: 'Local Work Order Completed Offline',
        description: 'Operator completes hydraulic line inspection and logs replacement task offline in station browser cache.',
        category: 'logistics',
        severity: 'info',
        safetyLevel: 'ASSIST',
        impactSummary: 'Action signed with local cryptographic nonce; added to pending upload queue.'
      },
      {
        id: 'EVT-04-20',
        second: 1200, // T+20:00
        title: 'Emergency Waypoint Pinned Offline',
        description: 'Glacier scout adds emergency waypoint WP-CAV-09 to local cartography without internet connectivity.',
        category: 'route',
        severity: 'info',
        safetyLevel: 'ASSIST',
        coordinates: { lat: -71.25, lng: 12.40 },
        impactSummary: 'Waypoint rendered locally on Leaflet cache with offline indicator.'
      },
      {
        id: 'EVT-04-26',
        second: 1560, // T+26:00
        title: 'SATCOM Uplink Restored (92%)',
        description: 'Ionospheric disturbance passes. Iridium transponder re-locks. WebSocket reconnected successfully.',
        category: 'comms',
        severity: 'info',
        safetyLevel: 'AUTONOMOUS',
        impactSummary: 'Sync status transitions back to "LIVE SATCOM SYNC".'
      },
      {
        id: 'EVT-04-28',
        second: 1680, // T+28:00
        title: 'Automated Queue Reconciliation Complete',
        description: 'All 6 locally queued work orders, waypoints, and audit records synchronized to HQ master database.',
        category: 'comms',
        severity: 'info',
        safetyLevel: 'AUTONOMOUS',
        impactSummary: 'Zero data loss. Forensic timestamp chronology verified with 100% integrity.'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // Scenario 5: Crevasse Fall Mayday & Autonomous S.A.R.
  // --------------------------------------------------------------------------
  {
    id: 'SIM-SCEN-05',
    scenarioNumber: 5,
    name: 'Crevasse Fall Mayday & Autonomous S.A.R.',
    code: 'MAYDAY-SAR',
    sector: 'Leverett Glacier Approach (-85.25°S, 151.10°E)',
    difficulty: 'SEVERE',
    estimatedDurationSeconds: 1500, // 25 simulated minutes
    description: 'During a traverse across Leverett Glacier, a snowcat lead track breaks through a concealed snow bridge into a 25-meter crevasse void. Tests the zero-click autonomous S.A.R. dispatch engine, dual-tone audio klaxon, drone thermal reconnaissance, and ground extraction team deployment.',
    primaryObjectives: [
      'Experience zero-latency autonomous distress beacon decoding (<400ms).',
      'Verify automated geodesic Haversine distance calculation to nearest research base.',
      'Observe simultaneous scramble of forward thermal drone and tracked rescue crawler.',
      'Execute field recovery stand-down protocol once party is safely recovered.'
    ],
    expectedFailureModes: [
      'Human operator triage latency in manual mode exceeding 15 minutes.',
      'Navigation error in snow-blind terrain without thermal FLIR guidance.',
      'Hypothermia onset in crevasse slot void (<45 minute rescue envelope).'
    ],
    initialStateOverrides: {
      tempC: -48,
      windKnots: 28,
      condition: 'COND-2_CAUTION',
    },
    events: [
      {
        id: 'EVT-05-00',
        second: 0,
        timeFormatted: 'T+00:00',
        title: 'Field Traverse Routine Scan',
        description: 'EXP-701 Field party traversing Leverett Glacier. Ground-penetrating radar active.',
        category: 'route',
        severity: 'info',
        safetyLevel: 'OBSERVE',
        coordinates: { lat: -85.20, lng: 151.05 }
      },
      {
        id: 'EVT-05-04',
        second: 240, // T+04:00
        title: 'MAYDAY: Concealed Snow Bridge Collapse',
        description: 'Snowcat lead track breaks through snow bridge into 25m slot void. Vehicle anchored, 4 souls secured in emergency bivouac.',
        category: 'sar',
        severity: 'emergency',
        safetyLevel: 'AUTONOMOUS',
        coordinates: { lat: -85.25, lng: 151.10 },
        impactSummary: 'Emergency beacon transmitting on 406.025 MHz. Dual-tone klaxon sounds.'
      },
      {
        id: 'EVT-05-05',
        second: 300, // T+05:00
        title: 'AI Zero-Click S.A.R. Engine Triggered',
        description: 'In 381ms, AI calculates nearest station (Amundsen-Scott 530.1km) and assesses weather: -54°C, 20kt wind (CLEAR envelope).',
        category: 'sar',
        severity: 'critical',
        safetyLevel: 'AUTONOMOUS',
        impactSummary: 'Nearest Base: Amundsen-Scott South Pole Station (NPX).'
      },
      {
        id: 'EVT-05-06',
        second: 360, // T+06:00
        title: 'Recon Drone Falcon-X Scrambled',
        description: 'Autonomous FLIR thermal drone launched with forward infrared cameras and emergency drop winch.',
        category: 'sar',
        severity: 'critical',
        safetyLevel: 'AUTONOMOUS',
        impactSummary: 'Flight corridor locked. Drone ETA: 18 minutes (speed 110 km/h).'
      },
      {
        id: 'EVT-05-08',
        second: 480, // T+08:00
        title: 'Tracked Winch Extraction Team Dispatched',
        description: 'P300 Rapid Crevasse Rescue Team scrambled from South Pole base with 30m mechanical hoist and heated litter.',
        category: 'sar',
        severity: 'critical',
        safetyLevel: 'AUTONOMOUS',
        impactSummary: 'Ground rescue crawler underway. ETA: 65 minutes.'
      },
      {
        id: 'EVT-05-14',
        second: 840, // T+14:00
        title: 'Thermal Drone Confirms Survivor Status',
        description: 'Falcon-X transmits live FLIR telemetry. 4 thermal heat signatures confirmed inside shelter pod. Zero critical injuries.',
        category: 'sar',
        severity: 'info',
        safetyLevel: 'OBSERVE',
        impactSummary: 'Radio contact established via drone relay repeater.'
      },
      {
        id: 'EVT-05-20',
        second: 1200, // T+20:00
        title: 'Ground Team Reaches Crevasse Rim',
        description: 'P300 winch deployed. Riggers lower safety harness and extract 4 crew members into heated crawler cab.',
        category: 'sar',
        severity: 'info',
        safetyLevel: 'ASSIST',
        impactSummary: 'All survivors secured. Vehicle anchor lines stabilized.'
      },
      {
        id: 'EVT-05-24',
        second: 1440, // T+24:00
        title: 'FIELD PARTY SAFE — STAND DOWN',
        description: 'Mission commander executes stand-down protocol. Rescue assets recalled; emergency status cleared; event logged in audit.',
        category: 'sar',
        severity: 'info',
        safetyLevel: 'AUTONOMOUS',
        impactSummary: 'Mission successfully concluded. Zero lives lost.'
      }
    ]
  }
];

/* ==========================================================================
   MANUAL EVENT INJECTION TEMPLATES (11 TACTICAL TRIGGERS)
   ========================================================================== */

export interface ManualEventTemplate {
  type: string;
  name: string;
  icon: string;
  category: 'weather' | 'mechanical' | 'sar' | 'comms' | 'logistics' | 'route' | 'hazard';
  severity: 'info' | 'advisory' | 'warning' | 'critical' | 'emergency';
  defaultTitle: string;
  defaultDescription: string;
  safetyLevel: SimulationSafetyLevel;
}

export const MANUAL_EVENT_TEMPLATES: ManualEventTemplate[] = [
  {
    type: 'INJECT_BLIZZARD',
    name: 'Blizzard Gale Surge',
    icon: 'CloudSnow',
    category: 'weather',
    severity: 'critical',
    defaultTitle: 'Injected: Severe Katabatic Blizzard',
    defaultDescription: 'Ambient temperature drops by 15°C, wind speed increases to 58 kt, visibility collapses to zero. Condition elevated to COND-1.',
    safetyLevel: 'AUTONOMOUS'
  },
  {
    type: 'INJECT_VEHICLE_FAILURE',
    name: 'Engine Tensioner Shear',
    icon: 'Wrench',
    category: 'mechanical',
    severity: 'critical',
    defaultTitle: 'Injected: Serpentine Belt Vitrification Shear',
    defaultDescription: 'Lead crawler alternator belt fractures under -52°C shock. Engine stalls; asset status forced to "maintenance".',
    safetyLevel: 'ASSIST'
  },
  {
    type: 'INJECT_COMMS_LOSS',
    name: 'SATCOM Blackout',
    icon: 'Radio',
    category: 'comms',
    severity: 'warning',
    defaultTitle: 'Injected: SATCOM L-Band Uplink Blackout',
    defaultDescription: 'Satellite signal drops to 0%. Workstation transitions to OFFLINE LOCAL CACHE mode with local event queueing.',
    safetyLevel: 'OBSERVE'
  },
  {
    type: 'INJECT_GPS_LOSS',
    name: 'GPS Interruption',
    icon: 'Compass',
    category: 'comms',
    severity: 'warning',
    defaultTitle: 'Injected: GNSS Multiconstellation Lock Loss',
    defaultDescription: 'Scintillation degrades GPS accuracy from 3.2m to 480m. Map alerts navigation uncertainty warning.',
    safetyLevel: 'OBSERVE'
  },
  {
    type: 'INJECT_MAYDAY',
    name: 'Crevasse Breach (Mayday)',
    icon: 'ShieldAlert',
    category: 'sar',
    severity: 'emergency',
    defaultTitle: 'Injected: Crevasse Fall Mayday Beacon',
    defaultDescription: 'Slot crevasse collapse reported on traverse. Emergency klaxon triggered; automated S.A.R. dispatch initiated.',
    safetyLevel: 'AUTONOMOUS'
  },
  {
    type: 'INJECT_FUEL_CRISIS',
    name: 'Fuel Tank Depletion',
    icon: 'Fuel',
    category: 'logistics',
    severity: 'critical',
    defaultTitle: 'Injected: Critical Fuel Buffer Depletion',
    defaultDescription: 'Fuel tank level drops by 4,000L. Days of supply drops below minimum safety threshold (8,500L).',
    safetyLevel: 'AUTONOMOUS'
  },
  {
    type: 'INJECT_MECHANICAL_FAULT',
    name: 'Hydraulic Valve Freeze',
    icon: 'AlertTriangle',
    category: 'mechanical',
    severity: 'warning',
    defaultTitle: 'Injected: Hydraulic Steering Valve Ice Jam',
    defaultDescription: 'Track steering valve frozen by sastrugi drift. Predictive AI elevates failure probability to 91%.',
    safetyLevel: 'ASSIST'
  },
  {
    type: 'INJECT_EXTREME_TEMP',
    name: 'Extreme -65°C Cold-Soak',
    icon: 'ThermometerSnowflake',
    category: 'weather',
    severity: 'critical',
    defaultTitle: 'Injected: Extreme -65°C Cold-Soak',
    defaultDescription: 'Temperature plunges to -65°C. All synthetic elastomers enter brittle glassy state; heater jackets forced to maximum.',
    safetyLevel: 'AUTONOMOUS'
  },
  {
    type: 'INJECT_HAZARD_ZONE',
    name: 'Glacial Shear Hazard',
    icon: 'Flame',
    category: 'hazard',
    severity: 'warning',
    defaultTitle: 'Injected: Active Glacial Shear Fissure Zone',
    defaultDescription: 'Satellite SAR detects expanding 35km crevasse cluster. Dynamic danger zone appears on Polar Map.',
    safetyLevel: 'OBSERVE'
  },
  {
    type: 'INJECT_LOW_BATTERY',
    name: 'Battery Cell Degradation',
    icon: 'Zap',
    category: 'mechanical',
    severity: 'warning',
    defaultTitle: 'Injected: Lithium-Cold Battery Cell Drop (14%)',
    defaultDescription: 'Sub-zero battery voltage drops rapidly to 14%. Non-essential scientific heaters powered down.',
    safetyLevel: 'AUTONOMOUS'
  },
  {
    type: 'INJECT_ASSET_VECTOR',
    name: 'Vector Drift Deviation',
    icon: 'Navigation',
    category: 'route',
    severity: 'advisory',
    defaultTitle: 'Injected: Convoy Terrain Deviation',
    defaultDescription: 'Drifting sastrugi forces convoy 8km west of blue-ice corridor. Smart route optimizer recalculates approach.',
    safetyLevel: 'ASSIST'
  }
];
