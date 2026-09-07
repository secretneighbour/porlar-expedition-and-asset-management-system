export type PolarRegion = 'antarctica' | 'arctic';

export type ConditionLevel = 'COND-3_NORMAL' | 'COND-2_CAUTION' | 'COND-1_SEVERE_BLIZZARD';

export type AssetCategory = 'heavy_traverse' | 'aviation' | 'scientific_rig' | 'power_habitat' | 'emergency_sar';

export type AssetStatus = 'operational' | 'in_transit' | 'maintenance' | 'cold_soaked' | 'standby';

export interface PolarAsset {
  id: string;
  name: string;
  code: string;
  category: AssetCategory;
  model: string;
  status: AssetStatus;
  currentLocation: {
    name: string;
    lat: number;
    lng: number;
    elevationM: number;
  };
  assignedExpeditionId?: string;
  assignedStationId?: string;
  coldRatingC: number; // e.g. -70
  fuelOrBatteryPercent: number;
  fuelType: 'Arctic Diesel F-34' | 'Jet-A1 Polar' | 'Lithium-Cold Solid' | 'Micro-Nuclear' | 'Manual/Pneumatic';
  crewCapacity: number;
  lastMaintenanceDate: string;
  nextServiceHours: number;
  specifications: {
    weightKg: number;
    topSpeedKmh: number;
    rangeKm: number;
    heatingSystem: string;
  };
  telemetry: {
    tempC: number;
    engineHealthPercent: number;
    satlinkSignal: number; // 0-100
  };
}

export type ExpeditionPhase = 'planning' | 'staging' | 'in_progress' | 'weather_hold' | 'completed' | 'emergency_extraction';

export interface ExpeditionCrewMember {
  id: string;
  name: string;
  role: 'Traverse Leader' | 'Glaciologist' | 'Doctor / Medical Officer' | 'Heavy Mechanic' | 'Navigator / Comms' | 'Survival Specialist';
  callsign: string;
  experienceSeasons: number;
  medicalClearance: 'Class-1 Unrestricted' | 'Class-2 Cold-Adaptive' | 'Restricted';
}

export interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevationM: number;
  passed: boolean;
  distanceFromPrevKm: number;
  hazardNote?: string;
}

export interface Expedition {
  id: string;
  code: string;
  name: string;
  region: PolarRegion;
  objective: string;
  phase: ExpeditionPhase;
  leader: string;
  crew: ExpeditionCrewMember[];
  assignedAssetIds: string[];
  departureDate: string;
  estimatedReturnDate: string;
  totalDistanceKm: number;
  distanceCoveredKm: number;
  currentLat: number;
  currentLng: number;
  waypoints: Waypoint[];
  fuelBurnPerDayL: number;
  rationsDaysRemaining: number;
  currentWeather: {
    tempC: number;
    windchillC: number;
    windKnots: number;
    condition: ConditionLevel;
  };
}

export interface ResearchStation {
  id: string;
  name: string;
  code: string;
  country: string;
  lat: number;
  lng: number;
  elevationM: number;
  region: PolarRegion;
  winterPopulation: number;
  summerPopulation: number;
  runwayType: 'Skiway (Snow)' | 'Blue Ice Runway' | 'Hard Surface' | 'Helipad Only';
  fuelReserveL: number;
  powerStatus: 'Nominal' | 'Auxiliary' | 'Emergency';
}

export interface SupplyItem {
  id: string;
  name: string;
  category: 'fuel' | 'rations' | 'medical' | 'technical' | 'survival_gear';
  currentStock: number;
  unit: string;
  minThreshold: number;
  burnRatePerDay: number;
  storageLocation: string;
  coldStabilityC: number;
  status: 'optimal' | 'low' | 'critical';
}

export interface DispatchLog {
  id: string;
  timestamp: string;
  callsign: string;
  severity: 'routine' | 'advisory' | 'warning' | 'urgent_distress';
  sector: string;
  message: string;
}

export interface HazardZone {
  id: string;
  name: string;
  type: 'crevasse_field' | 'whiteout_zone' | 'katabatic_pass' | 'unstable_ice_shelf';
  lat: number;
  lng: number;
  radiusKm: number;
  dangerLevel: 'high' | 'extreme' | 'moderate';
  notes: string;
}

export interface AutonomousSARTelemetry {
  nearestBaseName: string;
  nearestBaseDistanceKm: number;
  nearestBaseCoords: string;
  weatherSummary: string;
  tempC: number;
  windSpeedKt: number;
  visibilityKm: number;
  weatherFlyable: boolean;
  dispatchedAssetType: 'drone' | 'crawler' | 'dual_sortie';
  dispatchedDroneName: string;
  dispatchedGroundTeamName: string;
  droneEtaMinutes: number;
  groundEtaMinutes: number;
  dispatchTimestamp: string;
  executionTimeMs: number;
  autonomousDecisionReasoning: string;
  zeroClickExecuted: boolean;
}

export interface ActiveDistressAlert {
  id: string;
  timestamp: string;
  incidentType: string;
  location: string;
  coordinates: string;
  summary: string;
  reporterCallsign: string;
  reportedByDevice: 'Mobile Phone Field Unit' | 'Satellite Handheld' | 'Crawler Console' | 'Station HQ';
  active: boolean;
  acknowledgedByHQ: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  dispatchedSARAssetId?: string;
  dispatchedSARName?: string;
  targetLat?: number;
  targetLng?: number;
  autonomousSAR?: AutonomousSARTelemetry;
}

export interface PolarisDb {
  expeditions: any[];
  personnel: any[];
  assets: any[];
  inventory: any[];
  shipments: any[];
  transportation: any[];
  maintenance: any[];
  tasks: any[];
  alerts: any[];
  expenses: any[];
  users: any[];
  auditLog: any[];
  completedWorkLogs?: CompletedWorkLogEntry[];
}

export interface PolarSystemState {
  region: PolarRegion;
  conditionLevel: ConditionLevel;
  assets: PolarAsset[];
  expeditions: Expedition[];
  supplies: SupplyItem[];
  dispatchLogs: DispatchLog[];
  activeDistress: ActiveDistressAlert | null;
  stations?: ResearchStation[];
  customWaypoints?: Waypoint[];
  polarisDb?: PolarisDb;
  lastUpdated: string;
}

export interface ConnectedDevice {
  id: string;
  type: 'laptop_hq' | 'mobile_field';
  name: string;
  userAgent?: string;
  ip?: string;
  lastSeen: number;
  batteryLevel?: number; // Real hardware battery % (0 - 100)
  isCharging?: boolean;  // Real hardware charging state
}

export type SyncMessageType =
  | 'INIT_STATE'
  | 'PRESENCE_UPDATE'
  | 'REGISTER_DEVICE'
  | 'HEARTBEAT'
  | 'TRIGGER_DISTRESS'
  | 'ACKNOWLEDGE_DISTRESS'
  | 'RESOLVE_DISTRESS'
  | 'UPDATE_ASSET'
  | 'UPDATE_EXPEDITION'
  | 'ADD_EXPEDITION'
  | 'ADD_STATION'
  | 'ADD_WAYPOINT'
  | 'DELETE_WAYPOINT'
  | 'UPDATE_WAYPOINT'
  | 'UPDATE_STATIONS'
  | 'UPDATE_CONDITION'
  | 'UPDATE_REGION'
  | 'ADD_DISPATCH_LOG'
  | 'RESTOCK_SUPPLY'
  | 'RESET_STATE'
  | 'UPDATE_POLARIS_DB'
  | 'UPDATE_POLARIS_COLLECTION'
  | 'STATE_UPDATE';

export interface HourlyForecastPoint {
  time: string; // e.g. "14:00"
  fullTime: string;
  tempC: number;
  apparentTempC: number;
  windKts: number;
  precipitationMm: number;
}

export interface RealtimeWeatherReading {
  id: string;
  locationName: string;
  stationCode?: string;
  country?: string;
  region: PolarRegion | 'local_gps';
  lat: number;
  lng: number;
  elevationM?: number;
  tempC: number;
  apparentTempC: number; // Feels like / windchill
  windSpeedKts: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  windDirectionCardinal: string;
  windGustsKts: number;
  pressureHpa: number;
  relativeHumidity: number;
  precipitationMm: number;
  weatherCode: number;
  weatherDescription: string;
  visibilityKm: number;
  frostbiteRiskTime: string;
  frostbiteRiskLevel: 'None' | 'Low' | 'Moderate' | 'High' | 'Severe' | 'Extreme';
  isKatabaticStorm: boolean;
  hourlyForecast?: HourlyForecastPoint[];
  updatedAt: string;
  source: string;
}

export interface SyncMessage {
  type: SyncMessageType;
  payload?: any;
  senderId?: string;
  timestamp?: string;
}

export interface CitySearchResult {
  name: string;
  lat: number;
  lng: number;
  country: string;
  admin1?: string;
}

export interface PredictiveMaintenanceRecord {
  id: string;
  assetId: string;
  assetName: string;
  category: string;
  component: string;
  currentCondition: string;
  traditionalStatus: string;
  riskScore: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  predictedFailureHorizon: string;
  ambientTempTriggerC: number;
  weatherFactor: string;
  predictionHeadline: string;
  rootCauseAnalysis: string;
  recommendedAction: string;
  downtimeSavedHours: number;
  costSavedUsd: number;
  partRequired: string;
  spareAvailableInStock: boolean;
  spareStockCount: number;
  assignedTechnician: string;
  telemetryMetrics: {
    beltTensionMm: number;
    vibrationRms: number;
    coldSoakHours: number;
    lubricantViscosityDegradation: number;
  };
  isPrevented: boolean;
  preventedAt?: string;
}

export interface DynamicWeatherInventoryState {
  itemStockId: string;
  itemName: string;
  stationName: string;
  currentFuelLiters: number; // 15,000L
  standardBurnRateLitersPerDay: number; // 500L/day
  blizzardBurnRateLitersPerDay: number; // 1,450L/day (290% heating load)
  staticMinStockThreshold: number; // 4,000L
  dynamicMinStockThreshold: number; // 8,500L
  currentWeatherScenario: 'blizzard_3day' | 'normal_polar';
  blizzardForecastDays: number;
  blizzardSeverity: string;
  ambientTempC: number; // -52°C
  windSpeedKnots: number; // 55 kt
  windChillC: number; // -68°C
  daysRemainingStatic: number; // 30 days
  daysRemainingUnderBlizzard: number; // 10.3 days
  thresholdAdjustedAutomatically: boolean;
  earlySupplyShipRequested: boolean;
  shipRequestDetails?: {
    shipName: string; // "MV Vasiliy Golovnin (Polar Icebreaker & Tanker)"
    requestedCargo: string; // "45,000 Liters Polar Diesel Fuel (F-34)"
    departurePort: string; // "Cape Town Logistics Hub"
    etaDays: number;
    requestTimestamp: string;
    requestUrgency: 'CRITICAL_EARLY_BLIZZARD_DISPATCH';
    rationale: string;
    confirmedByVessel: boolean;
  };
}

export interface CrevasseDetection {
  id: string;
  name: string;
  lat: number;
  lng: number;
  widthMeters: number;
  depthMeters: number;
  orientationDeg: number;
  dangerLevel: 'CRITICAL_COLLAPSE_ZONE' | 'SEVERE_SHEAR' | 'MODERATE_FISSURE';
  intersectsOldRoute: boolean;
  satelliteSensor: string; // "Sentinel-1 SAR C-Band + WorldView-3 30cm"
  detectedTimestamp: string;
  description: string;
}

export interface SmartRoutePlan {
  id: string;
  title: string;
  corridor: string;
  lastSurveyDate: string;
  satellitePass: string;
  crevassesDetected: CrevasseDetection[];
  legacyRoute: {
    name: string;
    distanceKm: number;
    safetyScorePercent: number; // 8%
    hazardsCount: number;
    status: 'HAZARDOUS_COMPROMISED';
    warningMessage: string;
    waypoints: Array<{ name: string; lat: number; lng: number; isHazardPoint?: boolean; note?: string }>;
  };
  aiSafeRoute: {
    name: string;
    distanceKm: number;
    safetyScorePercent: number; // 99.4%
    blueIceCorridorKm: number;
    bufferDistanceMeters: number;
    status: 'AI_OPTIMIZED_SAFE';
    clearedBy: string; // "Polar Computer Vision Deep Ice Fissure Neural Net"
    waypoints: Array<{ name: string; lat: number; lng: number; description?: string }>;
  };
  truckConvoyUnits: Array<{
    id: string;
    name: string;
    model: string;
    weightTons: number;
    status: 'Active Route Sync' | 'Standby in Depot';
    routeSyncTimestamp: string;
  }>;
  automatedPushActive: boolean;
  lastPushedAt?: string;
}

export interface AiOptimizationMetrics {
  totalRequests: number;
  geminiApiLiveCalls: number;
  cacheHits: number;
  coalescedRequests: number;
  estimatedTokensUsed: number;
  estimatedTokensSaved: number;
  quotaReductionPercent: number;
  avgLatencyMs: number;
  cacheEntriesActive: number;
  uptimeSeconds: number;
}

export interface CompletedWorkLogEntry {
  id: string;
  timestamp: string;
  timeStr: string;
  category: 'task' | 'maintenance' | 'alert' | 'route' | 'inventory' | 'sar';
  title: string;
  entityId?: string;
  entityName?: string;
  stationOrExpedition?: string;
  assignedToOrOperator?: string;
  clearedBy: 'AI Autonomous Janitor' | 'Operator Manual' | 'Predictive AI';
  actionTaken: string;
  resolutionNotes: string;
  avertedImpactOrSavings?: string;
  status: 'Archived & Verified';
}

