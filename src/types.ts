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
}

export interface PolarSystemState {
  region: PolarRegion;
  conditionLevel: ConditionLevel;
  assets: PolarAsset[];
  expeditions: Expedition[];
  supplies: SupplyItem[];
  dispatchLogs: DispatchLog[];
  activeDistress: ActiveDistressAlert | null;
  lastUpdated: string;
}

export interface ConnectedDevice {
  id: string;
  type: 'laptop_hq' | 'mobile_field';
  name: string;
  userAgent?: string;
  ip?: string;
  lastSeen: number;
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
  | 'UPDATE_CONDITION'
  | 'UPDATE_REGION'
  | 'ADD_DISPATCH_LOG'
  | 'RESTOCK_SUPPLY'
  | 'RESET_STATE'
  | 'STATE_UPDATE';

export interface SyncMessage {
  type: SyncMessageType;
  payload?: any;
  senderId?: string;
  timestamp?: string;
}
