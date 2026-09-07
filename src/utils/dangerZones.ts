import { PolarRegion, RealtimeWeatherReading } from '../types';

export interface SubZeroDangerZone {
  id: string;
  name: string;
  region: PolarRegion;
  lat: number;
  lng: number;
  centerLat?: number;
  centerLng?: number;
  radiusKm: number;
  tempC: number;
  apparentTempC: number;
  windchillC?: number;
  windSpeedKts: number;
  windGustsKts: number;
  pressureHpa: number;
  severityLevel: 'LETHAL' | 'EXTREME' | 'HIGH_RISK';
  severity?: 'LETHAL' | 'EXTREME' | 'HIGH_RISK' | 'lethal' | 'extreme' | 'high_risk';
  survivalTimeMinutes: number; // Maximum minutes of human survival before core hypothermia incapacitation
  frostbiteTimeMinutes: number; // Minutes of bare skin exposure before irreversible frostbite
  fuelCloudPointHazard: boolean; // Arctic diesel wax/clouding threshold reached (<= -45°C)
  equipmentAdvisory: string;
  survivalAdvisory: string;
  recommendation?: string;
  historicalMinC: number;
}

/**
 * Standard baseline cold-pool anomaly centers in polar regions
 */
const BASELINE_DANGER_CENTERS: Omit<SubZeroDangerZone, 'tempC' | 'apparentTempC' | 'windSpeedKts' | 'windGustsKts' | 'pressureHpa' | 'severityLevel' | 'survivalTimeMinutes' | 'frostbiteTimeMinutes' | 'fuelCloudPointHazard'>[] = [
  {
    id: 'dz-vostok-dep',
    name: 'Vostok Cryogenic Depression (Ridge B)',
    region: 'antarctica',
    lat: -78.464,
    lng: 106.837,
    radiusKm: 180,
    historicalMinC: -89.2,
    equipmentAdvisory: 'Hydraulic vitrification. Arctic diesel fuel line waxing. Continuous auxiliary block heater required.',
    survivalAdvisory: 'LETHAL CRITICAL: Exposed flesh freezes in under 2 minutes. Total core hypothermia in < 12 minutes.',
  },
  {
    id: 'dz-dome-c-plateau',
    name: 'Dome C Polar High Plateau (Concordia)',
    region: 'antarctica',
    lat: -75.100,
    lng: 123.333,
    radiusKm: 160,
    historicalMinC: -84.6,
    equipmentAdvisory: 'Battery capacity depleted by 70%. Pneumatic seals brittle. Mandatory 100m crawler convoy spacing.',
    survivalAdvisory: 'CRITICAL HAZARD: Thermal suit active heating mandatory. Frostbite onset < 4 minutes.',
  },
  {
    id: 'dz-south-pole-vortex',
    name: 'Amundsen-Scott Polar Vortex Cap',
    region: 'antarctica',
    lat: -89.997,
    lng: 0.0,
    radiusKm: 150,
    historicalMinC: -82.8,
    equipmentAdvisory: 'Jet-A1 freeze-point depression protocol active. LC-130 ski-wheel oleo strut stiffness.',
    survivalAdvisory: 'EXTREME HYPOTHERMIA RISK: Maximum 10-minute exterior sortie limit without heated shelter.',
  },
  {
    id: 'dz-leverett-katabatic',
    name: 'Leverett Glacier Katabatic Shear Funnel',
    region: 'antarctica',
    lat: -85.100,
    lng: 152.000,
    radiusKm: 120,
    historicalMinC: -62.0,
    equipmentAdvisory: 'Extreme katabatic wind shear. Ground penetrating radar (GPR) required for crevasse bridge stability.',
    survivalAdvisory: 'SEVERE BLIZZARD CHILL: 50+ kt katabatic winds produce apparent wind chill below -70°C.',
  },
  {
    id: 'dz-dome-fuji',
    name: 'Dome Fuji High Elevation Cold Pool',
    region: 'antarctica',
    lat: -77.316,
    lng: 39.700,
    radiusKm: 140,
    historicalMinC: -81.2,
    equipmentAdvisory: 'Atmospheric pressure below 600 hPa. Engine oxygen starvation; turbo pre-boosters engaged.',
    survivalAdvisory: 'LETHAL EXPOSURE: Supplemental oxygen and triple-layer cryogenic hoods required.',
  },
  {
    id: 'dz-queen-maud-sastrugi',
    name: 'Queen Maud Land Sastrugi Corridor (Maitri South)',
    region: 'antarctica',
    lat: -72.800,
    lng: 12.500,
    radiusKm: 110,
    historicalMinC: -58.0,
    equipmentAdvisory: 'Hard-packed sastrugi impacts shock suspension. Track rubber vulcanization cracks.',
    survivalAdvisory: 'HIGH COLD STRESS: Frostbite risk < 15 minutes. Two-person buddy check protocol enforced.',
  },
  {
    id: 'dz-svalbard-ice-cap',
    name: 'Nordaustlandet Glacial Ice Cap',
    region: 'arctic',
    lat: 79.800,
    lng: 22.500,
    radiusKm: 95,
    historicalMinC: -46.0,
    equipmentAdvisory: 'Glacier crevasses and sea-fog rime icing on aviation surfaces.',
    survivalAdvisory: 'HIGH ARCTIC EXPOSURE: Rapid thermal shock. Survival time in open pack ice < 25 minutes.',
  },
  {
    id: 'dz-deep-arctic-pack',
    name: 'High Arctic Multi-Year Pack Ice Sector',
    region: 'arctic',
    lat: 82.500,
    lng: 15.000,
    radiusKm: 130,
    historicalMinC: -52.0,
    equipmentAdvisory: 'Drifting pack ice floe instability. Sea-ice leads opening under thermal contraction.',
    survivalAdvisory: 'SUB-ZERO MARITIME HAZARD: Wet freeze danger. Immersion hypothermia fatal in < 3 minutes.',
  },
];

/**
 * Derives dynamic Sub-Zero Danger Zones by fusing baseline geographical cold pools
 * with live real-time station weather readings.
 */
export function getSubZeroDangerZones(
  stationWeather?: Record<string, any> | any[],
  regionFilter: 'all' | 'antarctica' | 'arctic' = 'all',
  thresholdFilter: 'all' | 'extreme' | 'lethal' = 'all'
): SubZeroDangerZone[] {
  // Convert weather map or array to search list
  const weatherList: any[] = Array.isArray(stationWeather)
    ? stationWeather
    : stationWeather
    ? Object.values(stationWeather)
    : [];

  // Check if live station readings are available to tune the thermal intensity
  const concordiaWeather = weatherList.find((w) =>
    (w.locationName || w.name || w.stationName || '')?.toLowerCase().includes('concordia') || w.stationCode === 'DCB' || w.code === 'DCB'
  );
  const southPoleWeather = weatherList.find((w) =>
    (w.locationName || w.name || w.stationName || '')?.toLowerCase().includes('amundsen') || w.stationCode === 'NPX' || w.code === 'NPX'
  );
  const maitriWeather = weatherList.find((w) =>
    (w.locationName || w.name || w.stationName || '')?.toLowerCase().includes('maitri') || w.stationCode === 'MAI' || w.code === 'MAI'
  );
  const himadriWeather = weatherList.find((w) =>
    (w.locationName || w.name || w.stationName || '')?.toLowerCase().includes('himadri') ||
    (w.locationName || w.name || w.stationName || '')?.toLowerCase().includes('svalbard') ||
    w.stationCode === 'NYA' ||
    w.code === 'NYA'
  );

  const zones: SubZeroDangerZone[] = BASELINE_DANGER_CENTERS.map((base) => {
    let tempC = -48;
    let windKts = 28;
    let apparentTempC = -64;
    let pressure = 640;

    if (base.id === 'dz-vostok-dep') {
      tempC = concordiaWeather ? Math.min(-52, (concordiaWeather.tempC || concordiaWeather.temperatureC || -50) - 4) : -54.4;
      windKts = concordiaWeather ? (concordiaWeather.windSpeedKts || concordiaWeather.windKnots || 24) : 24;
      pressure = 624;
    } else if (base.id === 'dz-dome-c-plateau') {
      tempC = concordiaWeather ? (concordiaWeather.tempC || concordiaWeather.temperatureC || -48) : -51.2;
      windKts = concordiaWeather ? (concordiaWeather.windSpeedKts || concordiaWeather.windKnots || 26) : 26;
      pressure = 645;
    } else if (base.id === 'dz-south-pole-vortex') {
      tempC = southPoleWeather ? (southPoleWeather.tempC || southPoleWeather.temperatureC || -46) : -48.0;
      windKts = southPoleWeather ? (southPoleWeather.windSpeedKts || southPoleWeather.windKnots || 30) : 32;
      pressure = 680;
    } else if (base.id === 'dz-leverett-katabatic') {
      tempC = southPoleWeather ? (southPoleWeather.tempC || southPoleWeather.temperatureC || -46) + 4 : -44.5;
      windKts = southPoleWeather ? Math.max(48, (southPoleWeather.windSpeedKts || southPoleWeather.windKnots || 30) + 18) : 52;
      pressure = 760;
    } else if (base.id === 'dz-dome-fuji') {
      tempC = concordiaWeather ? Math.min(-56, (concordiaWeather.tempC || concordiaWeather.temperatureC || -50) - 5) : -57.8;
      windKts = 22;
      pressure = 595;
    } else if (base.id === 'dz-queen-maud-sastrugi') {
      tempC = maitriWeather ? (maitriWeather.tempC || maitriWeather.temperatureC || -30) - 6 : -34.8;
      windKts = maitriWeather ? (maitriWeather.windSpeedKts || maitriWeather.windKnots || 25) + 8 : 36;
      pressure = 820;
    } else if (base.id === 'dz-svalbard-ice-cap') {
      tempC = himadriWeather ? (himadriWeather.tempC || himadriWeather.temperatureC || -20) - 8 : -26.4;
      windKts = himadriWeather ? (himadriWeather.windSpeedKts || himadriWeather.windKnots || 22) + 10 : 34;
      pressure = 985;
    } else if (base.id === 'dz-deep-arctic-pack') {
      tempC = himadriWeather ? (himadriWeather.tempC || himadriWeather.temperatureC || -20) - 14 : -32.5;
      windKts = 28;
      pressure = 1005;
    }

    // Formula for apparent windchill if not directly provided
    apparentTempC = Math.round(13.12 + 0.6215 * tempC - 11.37 * Math.pow(windKts * 1.852, 0.16) + 0.3965 * tempC * Math.pow(windKts * 1.852, 0.16));

    // Survival categorization based on scientific polar thresholds
    let severityLevel: 'LETHAL' | 'EXTREME' | 'HIGH_RISK' = 'HIGH_RISK';
    let survivalTimeMinutes = 60;
    let frostbiteTimeMinutes = 20;

    if (tempC <= -45 || apparentTempC <= -60) {
      severityLevel = 'LETHAL';
      survivalTimeMinutes = 12;
      frostbiteTimeMinutes = 2;
    } else if (tempC <= -35 || apparentTempC <= -48) {
      severityLevel = 'EXTREME';
      survivalTimeMinutes = 25;
      frostbiteTimeMinutes = 8;
    } else {
      severityLevel = 'HIGH_RISK';
      survivalTimeMinutes = 55;
      frostbiteTimeMinutes = 20;
    }

    const roundedTemp = Math.round(tempC * 10) / 10;
    const roundedApparent = Math.round(apparentTempC * 10) / 10;

    return {
      ...base,
      centerLat: base.lat,
      centerLng: base.lng,
      tempC: roundedTemp,
      apparentTempC: roundedApparent,
      windchillC: roundedApparent,
      windSpeedKts: Math.round(windKts),
      windGustsKts: Math.round(windKts * 1.35),
      pressureHpa: pressure,
      severityLevel,
      severity: severityLevel,
      survivalTimeMinutes,
      frostbiteTimeMinutes,
      fuelCloudPointHazard: tempC <= -45,
      recommendation: base.equipmentAdvisory,
    };
  });

  return zones.filter((z) => {
    if (regionFilter !== 'all' && z.region !== regionFilter) return false;
    if (thresholdFilter === 'lethal') return z.severityLevel === 'LETHAL';
    if (thresholdFilter === 'extreme') return z.severityLevel === 'LETHAL' || z.severityLevel === 'EXTREME';
    return true;
  });
}
