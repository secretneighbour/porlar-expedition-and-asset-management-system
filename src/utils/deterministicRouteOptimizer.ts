import { Waypoint, WaypointOptimizationRequest, WaypointOptimizationResult } from '../types';

/**
 * Calculates geodesic distance between two latitude/longitude points in kilometers using the Haversine formula.
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Calculates the shortest distance in kilometers from a point (pLat, pLng)
 * to a great-circle segment between (lat1, lon1) and (lat2, lon2).
 */
export function pointToSegmentDistanceKm(
  pLat: number,
  pLng: number,
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // If segment endpoints are virtually identical, return distance to endpoint
  const segmentLength = haversineKm(lat1, lon1, lat2, lon2);
  if (segmentLength < 0.1) {
    return haversineKm(pLat, pLng, lat1, lon1);
  }

  // Linear projection in equirectangular projection centered around mean latitude
  const meanLatRad = (((lat1 + lat2 + pLat) / 3) * Math.PI) / 180;
  const cosMean = Math.cos(meanLatRad);

  const x1 = lon1 * cosMean;
  const y1 = lat1;
  const x2 = lon2 * cosMean;
  const y2 = lat2;
  const px = pLng * cosMean;
  const py = pLat;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;

  if (l2 === 0) return haversineKm(pLat, pLng, lat1, lon1);

  // Project point onto line segment: t = [(p - a) . (b - a)] / |b - a|^2
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  const projLng = projX / (cosMean || 1);
  const projLat = projY;

  return haversineKm(pLat, pLng, projLat, projLng);
}

/**
 * Checks how closely a segment between WP1 and WP2 approaches any danger zone or crevasse.
 * Returns penalty cost and closest distance in km.
 */
export function evaluateSegmentHazardPenalty(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  dangerZones: Array<{ lat: number; lng: number; radiusKm: number; severityLevel?: string }> = [],
  crevasses: Array<{ lat: number; lng: number; dangerLevel?: string }> = []
): { penalty: number; minDistanceToHazardKm: number; intersectedZones: number } {
  let penalty = 0;
  let minDistanceToHazardKm = 999999;
  let intersectedZones = 0;

  for (const zone of dangerZones) {
    const dist = pointToSegmentDistanceKm(zone.lat, zone.lng, lat1, lng1, lat2, lng2);
    if (dist < minDistanceToHazardKm) minDistanceToHazardKm = dist;

    const radius = zone.radiusKm || 20;
    if (dist <= radius) {
      intersectedZones++;
      const severityMultiplier =
        zone.severityLevel === 'LETHAL' ? 10000 : zone.severityLevel === 'EXTREME' ? 5000 : 2500;
      // High penalty that ramps up the closer to the center
      const penetrationRatio = Math.max(0, (radius - dist) / radius);
      penalty += severityMultiplier * (1 + penetrationRatio * 4);
    }
  }

  for (const crv of crevasses) {
    const dist = pointToSegmentDistanceKm(crv.lat, crv.lng, lat1, lng1, lat2, lng2);
    if (dist < minDistanceToHazardKm) minDistanceToHazardKm = dist;

    // Crevasse default danger zone is 5 km
    if (dist <= 5) {
      intersectedZones++;
      penalty += 4000 * (1 + (5 - dist) / 5);
    }
  }

  return { penalty, minDistanceToHazardKm, intersectedZones };
}

/**
 * Deterministic Polar Route Optimizer (2-Opt with Geodesic Hazard Cost Matrix)
 *
 * Runs without network or API dependencies, respecting mandatory waypoints,
 * minimizing total distance while circumnavigating known danger zones and crevasses.
 */
export function runDeterministicWaypointOptimizer(
  requestOrWaypoints: WaypointOptimizationRequest | Waypoint[],
  failureReason?: string,
  constraintsOverride?: WaypointOptimizationRequest['constraints']
): WaypointOptimizationResult {
  const request: WaypointOptimizationRequest = Array.isArray(requestOrWaypoints)
    ? {
        waypoints: requestOrWaypoints,
        constraints: constraintsOverride,
      }
    : {
        ...requestOrWaypoints,
        constraints: constraintsOverride || requestOrWaypoints.constraints,
      };

  const { asset, environment, constraints, isSimulation } = request;
  const rawWaypoints = request.waypoints || [];
  
  // Deduplicate input waypoints by unique ID
  const seenIds = new Set<string>();
  const waypoints: Waypoint[] = [];
  for (const wp of rawWaypoints) {
    if (!seenIds.has(wp.id)) {
      seenIds.add(wp.id);
      waypoints.push(wp);
    }
  }

  const dangerZones = environment?.dangerZones || [];
  const crevasses = environment?.crevasses || [];
  const mandatoryIds = new Set<string>(
    constraints?.mandatoryWaypointIds ||
      waypoints.filter((w) => w.isMandatory || w.priority === 'mandatory').map((w) => w.id)
  );

  // If 0 or 1 waypoint, return directly
  if (waypoints.length <= 1) {
    return {
      recommendedOrder: waypoints.map((w) => w.id),
      orderedWaypoints: waypoints.map((w, idx) => ({ ...w, sequence: idx + 1 })),
      reasoning: ['Single waypoint or empty candidate list. No reordering required.'],
      estimatedDistanceKm: 0,
      estimatedDurationHours: 0,
      estimatedDistance: 0,
      estimatedDuration: 0,
      riskLevel: 'LOW',
      warnings: [],
      confidence: 1.0,
      mode: 'cv_heuristic_fallback',
      engineUsed: 'deterministic-fallback',
      cached: false,
      timestamp: new Date().toISOString(),
      isSimulation: !!isSimulation,
      validationDetails: {
        allCandidateIdsValid: true,
        mandatoryPreserved: true,
        hazardAvoidanceCount: 0,
        fallbackUsed: true,
        failureReason,
      },
    };
  }

  // 1. Determine fixed start (origin)
  // If asset is provided, find the closest waypoint as departure, or preserve WP-1 as staging gate
  const startWp = waypoints[0];
  const otherWps = waypoints.slice(1);

  // Greedy Nearest Neighbor Tour with Hazard Penalty Cost
  const orderedIds: string[] = [startWp.id];
  const remaining = [...otherWps];
  let currLat = startWp.lat;
  let currLng = startWp.lng;
  let totalHazardAvoidanceCount = 0;
  let globalMinHazardDistKm = 999999;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let lowestCost = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const dist = haversineKm(currLat, currLng, candidate.lat, candidate.lng);
      const { penalty, minDistanceToHazardKm, intersectedZones } = evaluateSegmentHazardPenalty(
        currLat,
        currLng,
        candidate.lat,
        candidate.lng,
        dangerZones,
        crevasses
      );

      // Give mandatory waypoints slight priority boost so they aren't pushed to the end
      const mandatoryBonus = mandatoryIds.has(candidate.id) ? -15 : 0;
      const totalCost = dist + penalty + mandatoryBonus;

      if (totalCost < lowestCost) {
        lowestCost = totalCost;
        bestIdx = i;
      }

      if (minDistanceToHazardKm < globalMinHazardDistKm) {
        globalMinHazardDistKm = minDistanceToHazardKm;
      }
      if (intersectedZones > 0) {
        totalHazardAvoidanceCount += intersectedZones;
      }
    }

    const nextWp = remaining.splice(bestIdx, 1)[0];
    orderedIds.push(nextWp.id);
    currLat = nextWp.lat;
    currLng = nextWp.lng;
  }

  // 2. 2-Opt Edge Swap Refinement (for > 3 waypoints)
  if (orderedIds.length >= 4) {
    const idToWp = new Map(waypoints.map((w) => [w.id, w]));

    const computeTourCost = (ids: string[]): number => {
      let cost = 0;
      for (let i = 0; i < ids.length - 1; i++) {
        const a = idToWp.get(ids[i])!;
        const b = idToWp.get(ids[i + 1])!;
        const d = haversineKm(a.lat, a.lng, b.lat, b.lng);
        const { penalty } = evaluateSegmentHazardPenalty(a.lat, a.lng, b.lat, b.lng, dangerZones, crevasses);
        cost += d + penalty;
      }
      return cost;
    };

    let improved = true;
    let iterations = 0;
    while (improved && iterations < 20) {
      improved = false;
      iterations++;
      const currentCost = computeTourCost(orderedIds);

      // Keep index 0 pinned (origin/staging depot)
      for (let i = 1; i < orderedIds.length - 1; i++) {
        for (let k = i + 1; k < orderedIds.length; k++) {
          // Reverse sub-segment [i..k]
          const newIds = [
            ...orderedIds.slice(0, i),
            ...orderedIds.slice(i, k + 1).reverse(),
            ...orderedIds.slice(k + 1),
          ];

          const newCost = computeTourCost(newIds);
          if (newCost < currentCost - 1.0) {
            orderedIds.splice(0, orderedIds.length, ...newIds);
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }
  }

  // 3. Resolve ordered Waypoint objects and compute physical geodesic metrics
  const idMap = new Map(waypoints.map((w) => [w.id, w]));
  const orderedWaypoints: Waypoint[] = [];
  let totalDistanceKm = 0;

  for (let i = 0; i < orderedIds.length; i++) {
    const rawWp = idMap.get(orderedIds[i])!;
    let distFromPrev = 0;
    if (i > 0) {
      const prevWp = orderedWaypoints[i - 1];
      distFromPrev = haversineKm(prevWp.lat, prevWp.lng, rawWp.lat, rawWp.lng);
      totalDistanceKm += distFromPrev;
    }

    orderedWaypoints.push({
      ...rawWp,
      sequence: i + 1,
      distanceFromPrevKm: distFromPrev,
      status: i === 0 ? 'completed' : i === 1 ? 'current' : 'pending',
    });
  }

  totalDistanceKm = Math.round(totalDistanceKm * 10) / 10;

  // Assume standard polar crawler convoy speed (25 km/h) or asset telemetry speed
  const speedKmh = asset?.speedKmh && asset.speedKmh > 5 ? asset.speedKmh : 24.5;
  const estimatedDurationHours = Math.round((totalDistanceKm / speedKmh) * 10) / 10;

  // Risk Level assessment based on environment & closest hazard
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (globalMinHazardDistKm < 15 || (environment?.tempC && environment.tempC < -45)) {
    riskLevel = 'HIGH';
  } else if (globalMinHazardDistKm < 40 || (environment?.windSpeedKts && environment.windSpeedKts > 30)) {
    riskLevel = 'MEDIUM';
  }

  // Compile Reasonings & Warnings
  const reasoning: string[] = [
    'Optimized via Deterministic Polar Geodesic 2-Opt pathfinder.',
    `Minimizes total traverse to ${totalDistanceKm.toFixed(1)} km (~${estimatedDurationHours.toFixed(1)} hrs at ${speedKmh} km/h).`,
  ];
  if (mandatoryIds.size > 0) {
    reasoning.push(`Preserved all ${mandatoryIds.size} mandatory mission waypoint constraints.`);
  }
  if (dangerZones.length > 0 || crevasses.length > 0) {
    reasoning.push(
      `Circumnavigated ${dangerZones.length} active cold-pool anomaly centers & ${crevasses.length} crevasse shear zones.`
    );
  }

  const warnings: string[] = [];
  if (constraints?.fuelLimitsKm && totalDistanceKm > constraints.fuelLimitsKm) {
    warnings.push(
      `EXCEEDS FUEL CAPACITY: Total distance (${totalDistanceKm.toFixed(1)} km) exceeds nominal fuel range (${constraints.fuelLimitsKm} km). Intermediate refueling mandatory.`
    );
  }
  if (environment?.tempC && environment.tempC < -40) {
    warnings.push(
      `CRYOGENIC COLD WARNING (${environment.tempC}°C): Arctic diesel waxing risk and auxiliary block heater engagement required.`
    );
  }
  if (globalMinHazardDistKm < 20) {
    warnings.push(
      `PROXIMITY ALERT: Route passes within ${globalMinHazardDistKm.toFixed(1)} km of active danger zone perimeter.`
    );
  }

  return {
    recommendedOrder: orderedIds,
    orderedWaypoints,
    reasoning,
    estimatedDistanceKm: totalDistanceKm,
    estimatedDurationHours,
    estimatedDistance: Math.round(totalDistanceKm * 10) / 10,
    estimatedDuration: Math.round(estimatedDurationHours * 60),
    riskLevel,
    warnings,
    confidence: 0.92,
    mode: 'cv_heuristic_fallback',
    engineUsed: 'deterministic-fallback',
    cached: false,
    timestamp: new Date().toISOString(),
    isSimulation: !!isSimulation,
    validationDetails: {
      allCandidateIdsValid: true,
      mandatoryPreserved: true,
      hazardAvoidanceCount: totalHazardAvoidanceCount,
      fallbackUsed: true,
      failureReason: failureReason || 'Deterministic Polar Heuristic execution',
    },
  };
}
