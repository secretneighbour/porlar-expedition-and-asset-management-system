import { RealtimeWeatherReading } from '../types';

export type HazardSeverity = 'LETHAL' | 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'NORMAL';

export type HazardCategory =
  | 'CRYOGENIC_CHILL'
  | 'KATABATIC_GALE'
  | 'WHITEOUT_BLIZZARD'
  | 'FREEZING_GLAZE'
  | 'CYCLONIC_LOW'
  | 'HEAT_INDEX'
  | 'DENSE_FOG'
  | 'CLEAR_SAFE';

export interface DetectedHazardItem {
  id: string;
  category: HazardCategory;
  title: string;
  severity: HazardSeverity;
  metric: string;
  description: string;
  tacticalAdvisory: string;
  routeImpact: string;
}

export interface WeatherHazardEvaluation {
  locationName: string;
  coords: string;
  timestamp: string;
  overallSeverity: HazardSeverity;
  hazards: DetectedHazardItem[];
  humanSurvivalMinutes: number;
  frostbiteWindow: string;
  frostbiteRiskLevel: string;
  fuelCloudPointWarning: boolean;
  travelSafetyScore: number; // 0 (extreme danger) to 100 (safe clear)
  flightCategory: 'VFR_OPEN' | 'MVFR_MARGINAL' | 'IFR_INSTRUMENT' | 'LIFR_GROUNDED';
  flyabilityAdvisory: string;
  optimalSpeedLimitKmh: number;
  recommendation: string;
  tempC: number;
  apparentTempC: number;
  windSpeedKts: number;
  windGustsKts: number;
  visibilityKm: number;
  pressureHpa: number;
  weatherDescription: string;
}

/**
 * Evaluates real-time meteorological reading to detect active environmental hazards
 * for the device's dynamic current location or any field coordinate.
 */
export function evaluateLocationWeatherHazards(
  weather: RealtimeWeatherReading | null | undefined,
  fallbackLocationName = 'Current Device Location'
): WeatherHazardEvaluation {
  if (!weather) {
    return {
      locationName: fallbackLocationName,
      coords: 'GPS Standby',
      timestamp: new Date().toISOString(),
      overallSeverity: 'NORMAL',
      hazards: [],
      humanSurvivalMinutes: 720,
      frostbiteWindow: 'Safe (>2 hours)',
      frostbiteRiskLevel: 'None',
      fuelCloudPointWarning: false,
      travelSafetyScore: 98,
      flightCategory: 'VFR_OPEN',
      flyabilityAdvisory: 'Meteorological telemetry acquiring; baseline open flight corridor.',
      optimalSpeedLimitKmh: 45,
      recommendation: 'Awaiting real-time sensor sync. Standard traverse safety protocol.',
      tempC: 0,
      apparentTempC: 0,
      windSpeedKts: 0,
      windGustsKts: 0,
      visibilityKm: 10,
      pressureHpa: 1013,
      weatherDescription: 'Acquiring local AWOS telemetry...',
    };
  }

  const {
    tempC,
    apparentTempC,
    windSpeedKts,
    windGustsKts,
    visibilityKm,
    pressureHpa,
    weatherCode,
    weatherDescription,
    locationName,
    lat,
    lng,
  } = weather;

  const hazards: DetectedHazardItem[] = [];
  let severityScore = 0; // accumulated penalty

  // 1. Extreme Cold / Wind Chill Assessment
  if (apparentTempC <= -50) {
    hazards.push({
      id: 'hz-cryo-lethal',
      category: 'CRYOGENIC_CHILL',
      title: 'Lethal Cryogenic Cold-Soak',
      severity: 'LETHAL',
      metric: `Apparent Chill: ${apparentTempC}°C (Ambient: ${tempC}°C)`,
      description: 'Core body heat exhaustion in < 15 min. Rapid tissue freezing and elastomer vitrification threshold.',
      tacticalAdvisory: 'Zero bare skin exposure. Heated crawler cab mandatory; continuous block heaters required.',
      routeImpact: 'Convoy speed restricted to 12 km/h to minimize wind chill factor on machine radiators.',
    });
    severityScore += 50;
  } else if (apparentTempC <= -35) {
    hazards.push({
      id: 'hz-cryo-critical',
      category: 'CRYOGENIC_CHILL',
      title: 'Severe Sub-Zero Cold-Soak',
      severity: 'CRITICAL',
      metric: `Apparent Chill: ${apparentTempC}°C`,
      description: 'Frostbite onset within 10 to 15 minutes of exposure. Arctic diesel waxing risk increases.',
      tacticalAdvisory: 'Level-3 Expedition parkas and face balaclavas mandatory for exterior inspections.',
      routeImpact: 'Schedule mandatory 15-min thermal checks on crawler track seals and hydraulics.',
    });
    severityScore += 35;
  } else if (apparentTempC <= -20) {
    hazards.push({
      id: 'hz-cryo-warning',
      category: 'CRYOGENIC_CHILL',
      title: 'Sub-Zero Cold Weather Caution',
      severity: 'WARNING',
      metric: `Apparent Chill: ${apparentTempC}°C`,
      description: 'Moderate frostbite risk (>30 min). Surface ice friction and battery capacity reduced by 25%.',
      tacticalAdvisory: 'Keep field battery packs in insulated inner-garment pockets.',
      routeImpact: 'Maintain standard blue-ice corridor spacing.',
    });
    severityScore += 18;
  } else if (apparentTempC >= 38) {
    hazards.push({
      id: 'hz-heat-index',
      category: 'HEAT_INDEX',
      title: 'High Thermal Heat Index',
      severity: 'WARNING',
      metric: `Feels Like: ${apparentTempC}°C`,
      description: 'High heat exhaustion risk during strenuous field operations.',
      tacticalAdvisory: 'Enforce hydration cycles and heat dissipation protocols.',
      routeImpact: 'Standard navigation clear; monitor vehicle engine cooling jackets.',
    });
    severityScore += 15;
  }

  // 2. High Wind & Katabatic Gale Assessment
  const maxWind = Math.max(windSpeedKts, windGustsKts);
  if (maxWind >= 45) {
    hazards.push({
      id: 'hz-katabatic-lethal',
      category: 'KATABATIC_GALE',
      title: 'Katabatic Gale Shear (Storm Force 9+)',
      severity: 'LETHAL',
      metric: `Sustained: ${windSpeedKts} kts | Gusts: ${windGustsKts} kts`,
      description: 'Violent downhill glacial wind funnel. Extreme risk of tent destruction and tracked vehicle roll.',
      tacticalAdvisory: 'Halt all exterior movement. Anchor crawlers with ice pitons facing 45° into the wind.',
      routeImpact: 'Immediate traverse moratorium. Wait out katabatic squall line.',
    });
    severityScore += 45;
  } else if (maxWind >= 30) {
    hazards.push({
      id: 'hz-katabatic-critical',
      category: 'KATABATIC_GALE',
      title: 'High Velocity Gale Winds',
      severity: 'CRITICAL',
      metric: `Wind: ${windSpeedKts} kts (Gusts ${windGustsKts} kts)`,
      description: 'Ground sastrugi drifting, severe wind drift shear, and air turbulence.',
      tacticalAdvisory: 'Secure all sledge lashing straps; tether crew pairs before stepping outside.',
      routeImpact: 'Detour around leeward glacial ridges to avoid katabatic velocity acceleration.',
    });
    severityScore += 25;
  } else if (maxWind >= 20) {
    hazards.push({
      id: 'hz-wind-advisory',
      category: 'KATABATIC_GALE',
      title: 'Moderate Wind Drift Advisory',
      severity: 'ADVISORY',
      metric: `Wind: ${windSpeedKts} kts`,
      description: 'Light blowing snow may obscure crevasse surface relief markers.',
      tacticalAdvisory: 'Use forward Ground Penetrating Radar (GPR) continuously.',
      routeImpact: 'Follow AI blue-ice waypoints with optical visual confirmation.',
    });
    severityScore += 10;
  }

  // 3. Visibility & Whiteout Hazards
  const isSnowWmo = [71, 73, 75, 77, 85, 86].includes(weatherCode);
  const isFogWmo = [45, 48].includes(weatherCode);
  const isFreezingRain = [56, 57, 66, 67].includes(weatherCode);

  if (visibilityKm <= 0.4 || weatherCode === 86) {
    hazards.push({
      id: 'hz-whiteout-lethal',
      category: 'WHITEOUT_BLIZZARD',
      title: 'Ground Whiteout (Total Horizon Loss)',
      severity: 'LETHAL',
      metric: `Visibility: ${(visibilityKm * 1000).toFixed(0)}m (Code ${weatherCode})`,
      description: 'Complete loss of horizon contrast. Crevasse edges, sastrugi drops, and ice cliffs become 100% invisible to human eyes.',
      tacticalAdvisory: 'Zero un-tethered foot movement. Rely exclusively on centimeter-precision RTK GNSS and LIDAR.',
      routeImpact: 'AI Route: Maintain safe 300m blue-ice ridge corridor; stop convoy if GNSS lock drops below 6 satellites.',
    });
    severityScore += 40;
  } else if (visibilityKm <= 1.5 || isSnowWmo || isFogWmo) {
    hazards.push({
      id: 'hz-fog-warning',
      category: isFogWmo ? 'DENSE_FOG' : 'WHITEOUT_BLIZZARD',
      title: isFogWmo ? 'Supercooled Rime Fog' : 'Blowing Snowpack & Restricted Visibility',
      severity: 'WARNING',
      metric: `Visibility: ${visibilityKm.toFixed(1)} km`,
      description: 'Ice crystals and supercooled water droplets cause rapid windshield icing and reduced optical range.',
      tacticalAdvisory: 'Engage high-output LED searchlights and forward infrared cameras.',
      routeImpact: 'Reduce traverse velocity to 18 km/h and increase convoy inter-vehicle separation to 100m.',
    });
    severityScore += 20;
  }

  // 4. Freezing Glaze & Black Ice Hazard
  if (isFreezingRain) {
    hazards.push({
      id: 'hz-freezing-glaze',
      category: 'FREEZING_GLAZE',
      title: 'Freezing Rain & Airframe Glaze Icing',
      severity: 'CRITICAL',
      metric: `Precipitation Code: ${weatherCode} (Freezing Drizzle/Rain)`,
      description: 'Supercooled liquid droplets freeze instantaneously on contact with steel tracks and airframes.',
      tacticalAdvisory: 'Activate propeller/wing de-icing boots; apply anti-skid sand/studs to crawler ramps.',
      routeImpact: 'Ski-plane flight sorties grounded. Tracked crawler traction limited on > 8° gradients.',
    });
    severityScore += 30;
  }

  // 5. Severe Polar Cyclonic Low (Barometric Drop)
  if (pressureHpa < 975 && pressureHpa > 500) {
    hazards.push({
      id: 'hz-cyclone-low',
      category: 'CYCLONIC_LOW',
      title: 'Deep Polar Barometric Low (Incoming Front)',
      severity: 'WARNING',
      metric: `Surface Pressure: ${pressureHpa} hPa`,
      description: 'Rapidly falling atmospheric pressure signals an incoming maritime cyclonic depression.',
      tacticalAdvisory: 'Complete depot loading within 2 hours before blizzard front arrives.',
      routeImpact: 'Prioritize transit to nearest sheltered waypoint or forward supply depot.',
    });
    severityScore += 15;
  }

  // Determine Overall Severity
  let overallSeverity: HazardSeverity = 'NORMAL';
  if (hazards.some((h) => h.severity === 'LETHAL')) {
    overallSeverity = 'LETHAL';
  } else if (hazards.some((h) => h.severity === 'CRITICAL')) {
    overallSeverity = 'CRITICAL';
  } else if (hazards.some((h) => h.severity === 'WARNING')) {
    overallSeverity = 'WARNING';
  } else if (hazards.length > 0) {
    overallSeverity = 'ADVISORY';
  }

  // Human survival time calculation
  let humanSurvivalMinutes = 480;
  if (apparentTempC <= -60) humanSurvivalMinutes = 12;
  else if (apparentTempC <= -50) humanSurvivalMinutes = 25;
  else if (apparentTempC <= -40) humanSurvivalMinutes = 60;
  else if (apparentTempC <= -30) humanSurvivalMinutes = 180;
  else if (apparentTempC <= -20) humanSurvivalMinutes = 360;

  // Frostbite calculation
  let frostbiteWindow = 'Safe (>2 hours)';
  let frostbiteRiskLevel = 'None';
  if (apparentTempC <= -60) {
    frostbiteWindow = '< 60 seconds';
    frostbiteRiskLevel = 'Extreme';
  } else if (apparentTempC <= -48) {
    frostbiteWindow = '2 - 5 min';
    frostbiteRiskLevel = 'Severe';
  } else if (apparentTempC <= -35) {
    frostbiteWindow = '10 - 15 min';
    frostbiteRiskLevel = 'High';
  } else if (apparentTempC <= -25) {
    frostbiteWindow = '30 min';
    frostbiteRiskLevel = 'Moderate';
  } else if (apparentTempC <= -15) {
    frostbiteWindow = '> 60 min';
    frostbiteRiskLevel = 'Low';
  }

  // Fuel cloud point warning
  const fuelCloudPointWarning = tempC <= -45;

  // Calculate Travel Safety Score (0 - 100)
  const travelSafetyScore = Math.max(8, Math.min(100, 100 - severityScore));

  // Determine flight category
  let flightCategory: 'VFR_OPEN' | 'MVFR_MARGINAL' | 'IFR_INSTRUMENT' | 'LIFR_GROUNDED' = 'VFR_OPEN';
  let flyabilityAdvisory = 'Twin Otter & SAR Drone flights cleared across all sectors.';

  if (visibilityKm < 0.8 || maxWind >= 45 || isFreezingRain) {
    flightCategory = 'LIFR_GROUNDED';
    flyabilityAdvisory = 'ALL FLIGHTS GROUNDED. Zero visibility whiteout / severe katabatic shear exceeds aircraft safe limits.';
  } else if (visibilityKm < 3.0 || maxWind >= 32) {
    flightCategory = 'IFR_INSTRUMENT';
    flyabilityAdvisory = 'Instrument flights only. Ski-plane landings restricted to groomed laser-leveled runways.';
  } else if (visibilityKm < 6.0 || maxWind >= 22) {
    flightCategory = 'MVFR_MARGINAL';
    flyabilityAdvisory = 'Marginal VFR. Monitor cloud ceiling and localized blizzard drift.';
  }

  // Speed Limit Recommendation
  let optimalSpeedLimitKmh = 35;
  if (overallSeverity === 'LETHAL') optimalSpeedLimitKmh = 10;
  else if (overallSeverity === 'CRITICAL') optimalSpeedLimitKmh = 18;
  else if (overallSeverity === 'WARNING') optimalSpeedLimitKmh = 26;

  // Tactical Recommendation Summary
  let recommendation = 'Weather within nominal polar limits. Traverse routes proceed along standard planned corridors.';
  if (overallSeverity === 'LETHAL') {
    recommendation = `CRITICAL HAZARD OVERRIDE: ${hazards.length} active severe hazards detected. AI Route Optimization automatically detours around katabatic squalls and crevasses. Human survival limit: ${humanSurvivalMinutes} min.`;
  } else if (overallSeverity === 'CRITICAL') {
    recommendation = `ELEVATED CAUTION: High winds and sub-zero chill require strict convoy spacing and blue-ice adherence. Frostbite risk window: ${frostbiteWindow}.`;
  } else if (overallSeverity === 'WARNING') {
    recommendation = `ADVISORY: Moderate atmospheric turbulence detected. Proceed along AI-optimized route with continuous GPR radar trace.`;
  }

  return {
    locationName: locationName || fallbackLocationName,
    coords: `${lat?.toFixed(4) || '0.0000'}°, ${lng?.toFixed(4) || '0.0000'}°`,
    timestamp: new Date().toISOString(),
    overallSeverity,
    hazards,
    humanSurvivalMinutes,
    frostbiteWindow,
    frostbiteRiskLevel,
    fuelCloudPointWarning,
    travelSafetyScore,
    flightCategory,
    flyabilityAdvisory,
    optimalSpeedLimitKmh,
    recommendation,
    tempC,
    apparentTempC,
    windSpeedKts,
    windGustsKts,
    visibilityKm,
    pressureHpa,
    weatherDescription,
  };
}
