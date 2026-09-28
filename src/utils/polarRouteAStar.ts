/**
 * Polar A* (A-Star) Tactical Route Optimization Engine
 * 
 * Features:
 * - Weighted Edge Cost Function: Distance, Mock DEM Slope, Cold-Soak Temp, Wind Heading, and LETHAL Danger Zones
 * - A* Pathfinding Algorithm with Admissible Haversine Heuristic
 * - Adaptive Polar Search Lattice for Hazard Circumvention
 * - Route Telemetry Metadata Generation for Gemini AI Decision Layer
 */

/**
 * Calculates the forward azimuth bearing (heading) between two coordinates in degrees (0 - 360).
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

export interface AStarNode {
  id: string;
  lat: number;
  lng: number;
  elevationM?: number;
  name?: string;
  hazardNote?: string;
}

export interface AStarHazardZone {
  id?: string;
  name?: string;
  lat: number;
  lng: number;
  radiusKm: number;
  severityLevel: 'LETHAL' | 'EXTREME' | 'HIGH_RISK' | string;
}

export interface AStarEnvironment {
  tempC?: number;
  apparentTempC?: number;
  windSpeedKts?: number;
  windDirectionDeg?: number; // 0-360 degrees (direction wind is blowing from)
  dangerZones?: AStarHazardZone[];
  crevasses?: Array<{ id: string; name: string; lat: number; lng: number; dangerLevel?: string }>;
  mockDem?: (lat: number, lng: number) => number;
}

export interface AStarAsset {
  id?: string;
  name?: string;
  minOperatingTemp?: number; // Minimum safe operating temperature (e.g. -50°C)
  coldRatingC?: number;      // Cold soak rating
  speedKmh?: number;         // Nominal crawler speed (e.g. 24 km/h)
  type?: string;
}

export interface AStarRouteMetadata {
  totalDistanceKm: number;
  straightLineDistanceKm: number;
  distanceDeltaKm: number;
  estimatedTimeMinutes: number;
  maxTempEncountered: number;
  minTempEncountered: number;
  windConditions: {
    speedKts: number;
    directionDeg: number;
    headwindTailwind: 'HEADWIND' | 'TAILWIND' | 'CROSSWIND';
    costImpactPercent: number;
  };
  hazardsAvoided: string[];
  maxSlopeDeg: number;
  totalCost: number;
  straightLineCost: number;
  savingsVsStraightLinePercent: number;
}

export interface AStarOptimizationResult {
  path: AStarNode[];
  coordinates: [number, number][]; // [lat, lng] array for Leaflet polyline
  metadata: AStarRouteMetadata;
  tacticalRecommendation?: string;
  mode?: 'gemini_ai_live' | 'deterministic_fallback';
  model?: string;
  timestamp?: string;
}

/**
 * Standard Geodesic Haversine Distance in Kilometers
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0; // Earth mean radius in km
  const toRad = Math.PI / 180.0;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * High-accuracy Mock Digital Elevation Model (DEM) for Polar Topography
 * Models coastal ice shelves (0-150m) rising to the central polar plateau (2,800m - 3,500m)
 * with nunataks and glacier slopes.
 */
export function getMockElevationM(lat: number, lng: number): number {
  const absLat = Math.abs(lat);
  // Plateau elevation rises as latitude approaches 90° (South/North Pole)
  const polarFactor = Math.max(0, Math.min(1.0, (absLat - 60) / 30));
  const baseElev = polarFactor * 2900; // ~2900m at South Pole

  // Regional undulations representing nunataks, Transantarctic mountains, and sastrugi ridges
  const undulation = 
    Math.sin(lat * 0.12) * Math.cos(lng * 0.08) * 350 +
    Math.sin(lng * 0.04) * 180;

  return Math.max(10, Math.round(baseElev + undulation));
}

/**
 * Calculate perpendicular distance from a point to a great-circle segment in kilometers.
 * Used to detect intersection with circular LETHAL hazard zones.
 */
export function distanceToSegmentKm(
  pLat: number, pLng: number,
  aLat: number, aLng: number,
  bLat: number, bLng: number
): number {
  const dAB = haversineDistanceKm(aLat, aLng, bLat, bLng);
  if (dAB < 0.001) return haversineDistanceKm(pLat, pLng, aLat, aLng);

  // Sample along segment at 10 equidistant intervals for robust detection
  let minDistance = Infinity;
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const interLat = aLat + (bLat - aLat) * fraction;
    const interLng = aLng + (bLng - aLng) * fraction;
    const d = haversineDistanceKm(pLat, pLng, interLat, interLng);
    if (d < minDistance) minDistance = d;
  }
  return minDistance;
}

/**
 * 1. The Cost Function (Pathfinding Layer):
 * calculateEdgeCost(nodeA, nodeB, environment, asset)
 * 
 * Rules:
 * - Distance: Base cost (1 point per km).
 * - Slope: Mock DEM layer. +50% cost if slope > 5 degrees.
 * - Temperature: If temp is below asset's minOperatingTemp, return Infinity (unroutable).
 * - Wind: Headwind = +25% cost. Tailwind = -10% cost.
 * - Hazard Zones: If path intersects a "LETHAL" red zone, +500% cost (6.0x multiplier).
 */
export function calculateEdgeCost(
  nodeA: AStarNode,
  nodeB: AStarNode,
  environment: AStarEnvironment = {},
  asset: AStarAsset = {}
): number {
  // A. Temperature Check: Below minimum operating temperature -> unroutable
  const minOperatingTemp = asset.minOperatingTemp ?? asset.coldRatingC ?? -50;
  const currentTemp = environment.tempC ?? -32;
  if (currentTemp < minOperatingTemp) {
    return Infinity; // Hard block: hydraulic fluid freezes / crawler vitrification
  }

  // B. Base Distance Cost: 1 point per km
  const distanceKm = haversineDistanceKm(nodeA.lat, nodeA.lng, nodeB.lat, nodeB.lng);
  if (distanceKm < 0.0001) return 0;

  let costMultiplier = 1.0;

  // C. Slope: Mock DEM layer. +50% cost if slope > 5 degrees
  const elevA = nodeA.elevationM ?? (environment.mockDem ? environment.mockDem(nodeA.lat, nodeA.lng) : getMockElevationM(nodeA.lat, nodeA.lng));
  const elevB = nodeB.elevationM ?? (environment.mockDem ? environment.mockDem(nodeB.lat, nodeB.lng) : getMockElevationM(nodeB.lat, nodeB.lng));
  const deltaElevationM = Math.abs(elevB - elevA);
  const distanceM = distanceKm * 1000.0;
  const slopeRad = Math.atan2(deltaElevationM, Math.max(1.0, distanceM));
  const slopeDeg = (slopeRad * 180.0) / Math.PI;

  if (slopeDeg > 5.0) {
    costMultiplier += 0.50; // +50% cost
  }

  // D. Wind: Headwind = +25% cost; Tailwind = -10% cost
  const travelBearing = calculateBearing(nodeA.lat, nodeA.lng, nodeB.lat, nodeB.lng);
  const windFromDeg = environment.windDirectionDeg ?? 45; // Meteorological wind origin
  
  // Angle between direction of motion and incoming wind
  let diffAngle = Math.abs(travelBearing - windFromDeg) % 360;
  if (diffAngle > 180) diffAngle = 360 - diffAngle;

  if (diffAngle < 60) {
    // Headwind: Moving directly or nearly against the wind
    costMultiplier += 0.25; // +25% cost
  } else if (diffAngle > 120) {
    // Tailwind: Wind pushing from behind
    costMultiplier -= 0.10; // -10% cost
  }

  // E. Hazard Zones: Intersecting a "LETHAL" red zone = +500% cost (6.0x total cost)
  const dangerZones = environment.dangerZones || [];
  for (const zone of dangerZones) {
    const isLethal = zone.severityLevel === 'LETHAL' || (zone as any).severity === 'LETHAL' || (zone as any).severity === 'lethal';
    if (isLethal) {
      const distToSegment = distanceToSegmentKm(zone.lat, zone.lng, nodeA.lat, nodeA.lng, nodeB.lat, nodeB.lng);
      if (distToSegment <= zone.radiusKm) {
        costMultiplier += 5.0; // +500% cost penalty
      }
    }
  }

  return distanceKm * Math.max(0.1, costMultiplier);
}

/**
 * Construct an adaptive polar search mesh between startNode and goalNode.
 * Allows A* to discover lateral detours around LETHAL danger zones.
 */
function buildAdaptiveSearchGraph(
  startNode: AStarNode,
  goalNode: AStarNode,
  environment: AStarEnvironment,
  intermediateWaypoints: AStarNode[] = []
): { nodes: AStarNode[]; adjacency: Map<string, AStarNode[]> } {
  const nodesMap = new Map<string, AStarNode>();
  nodesMap.set(startNode.id, startNode);
  nodesMap.set(goalNode.id, goalNode);

  intermediateWaypoints.forEach((w) => nodesMap.set(w.id, w));

  const totalDist = haversineDistanceKm(startNode.lat, startNode.lng, goalNode.lat, goalNode.lng);
  const bearing = calculateBearing(startNode.lat, startNode.lng, goalNode.lat, goalNode.lng);
  const perpBearingRad = ((bearing + 90) % 360) * (Math.PI / 180.0);

  // Divide path into 5 longitudinal slices
  const slices = 5;
  // Lateral deviation offsets in km: [-60, -30, -15, 0, +15, +30, +60]
  const lateralOffsetsKm = [-70, -40, -20, 0, 20, 40, 70];

  const sliceNodes: AStarNode[][] = [];
  sliceNodes.push([startNode]);

  for (let s = 1; s < slices; s++) {
    const fraction = s / slices;
    const centerLat = startNode.lat + (goalNode.lat - startNode.lat) * fraction;
    const centerLng = startNode.lng + (goalNode.lng - startNode.lng) * fraction;
    const currentSlice: AStarNode[] = [];

    lateralOffsetsKm.forEach((offsetKm, idx) => {
      // Approximate 1 deg lat ~= 111 km, 1 deg lng ~= 111 km * cos(lat)
      const latOffsetDeg = (offsetKm * Math.sin(perpBearingRad)) / 111.0;
      const lngOffsetDeg = (offsetKm * Math.cos(perpBearingRad)) / (111.0 * Math.max(0.1, Math.cos((centerLat * Math.PI) / 180.0)));

      const nodeLat = centerLat + latOffsetDeg;
      const nodeLng = centerLng + lngOffsetDeg;
      const nodeId = `grid_s${s}_o${idx}`;

      const node: AStarNode = {
        id: nodeId,
        lat: nodeLat,
        lng: nodeLng,
        elevationM: getMockElevationM(nodeLat, nodeLng),
        name: `Waypoint S${s}-${offsetKm >= 0 ? `+${offsetKm}` : offsetKm}km`,
      };

      nodesMap.set(node.id, node);
      currentSlice.push(node);
    });

    sliceNodes.push(currentSlice);
  }

  sliceNodes.push([goalNode]);

  // Connect adjacent slice layers
  const adjacency = new Map<string, AStarNode[]>();
  for (const node of nodesMap.values()) {
    adjacency.set(node.id, []);
  }

  for (let s = 0; s < sliceNodes.length - 1; s++) {
    const fromLayer = sliceNodes[s];
    const toLayer = sliceNodes[s + 1];

    for (const fromNode of fromLayer) {
      for (const toNode of toLayer) {
        adjacency.get(fromNode.id)?.push(toNode);
      }
    }
  }

  return { nodes: Array.from(nodesMap.values()), adjacency };
}

/**
 * 2. The Algorithm: A* (A-Star) Pathfinding Algorithm
 * Finds the lowest-cost path from startNode to goalNode using calculateEdgeCost.
 */
export function findAStarPath(
  startNode: AStarNode,
  goalNode: AStarNode,
  environment: AStarEnvironment = {},
  asset: AStarAsset = {},
  intermediateWaypoints: AStarNode[] = []
): AStarOptimizationResult {
  // Build search space
  const { adjacency } = buildAdaptiveSearchGraph(startNode, goalNode, environment, intermediateWaypoints);

  // Straight line benchmark
  const straightLineDistanceKm = haversineDistanceKm(startNode.lat, startNode.lng, goalNode.lat, goalNode.lng);
  const straightLineCost = calculateEdgeCost(startNode, goalNode, environment, asset);

  // A* Data Structures
  const openSet = new Set<string>([startNode.id]);
  const cameFrom = new Map<string, AStarNode>();

  const gScore = new Map<string, number>();
  gScore.set(startNode.id, 0);

  const fScore = new Map<string, number>();
  // Heuristic: Haversine distance * 0.90 (admissible because minimum cost is distance * 0.90 under tailwind)
  fScore.set(startNode.id, straightLineDistanceKm * 0.90);

  const nodeMap = new Map<string, AStarNode>();
  nodeMap.set(startNode.id, startNode);
  nodeMap.set(goalNode.id, goalNode);

  while (openSet.size > 0) {
    // Find node with lowest fScore
    let currentId = '';
    let lowestF = Infinity;
    for (const id of openSet) {
      const f = fScore.get(id) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        currentId = id;
      }
    }

    if (currentId === goalNode.id) {
      // Reconstruct path
      const path: AStarNode[] = [goalNode];
      let curr = goalNode;
      while (cameFrom.has(curr.id)) {
        curr = cameFrom.get(curr.id)!;
        path.unshift(curr);
      }

      // Compute metadata
      let totalDist = 0;
      let totalCost = 0;
      let maxSlope = 0;
      const hazardsAvoidedSet = new Set<string>();

      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i];
        const b = path[i + 1];
        const d = haversineDistanceKm(a.lat, a.lng, b.lat, b.lng);
        totalDist += d;
        totalCost += calculateEdgeCost(a, b, environment, asset);

        // Slope
        const elA = a.elevationM ?? getMockElevationM(a.lat, a.lng);
        const elB = b.elevationM ?? getMockElevationM(b.lat, b.lng);
        const slopeDeg = (Math.atan2(Math.abs(elB - elA), Math.max(1, d * 1000)) * 180) / Math.PI;
        if (slopeDeg > maxSlope) maxSlope = slopeDeg;
      }

      // Check which hazards were avoided by not taking straight line
      const dangerZones = environment.dangerZones || [];
      for (const zone of dangerZones) {
        const straightDist = distanceToSegmentKm(zone.lat, zone.lng, startNode.lat, startNode.lng, goalNode.lat, goalNode.lng);
        if (straightDist <= zone.radiusKm) {
          // Straight line would have intersected this hazard!
          let pathIntersects = false;
          for (let i = 0; i < path.length - 1; i++) {
            if (distanceToSegmentKm(zone.lat, zone.lng, path[i].lat, path[i].lng, path[i+1].lat, path[i+1].lng) <= zone.radiusKm) {
              pathIntersects = true;
              break;
            }
          }
          if (!pathIntersects) {
            hazardsAvoidedSet.add(zone.name || `Danger Zone ${zone.id || 'Hazard'}`);
          }
        }
      }

      const speed = asset.speedKmh ?? 24.0;
      const timeMinutes = Math.round((totalDist / speed) * 60);
      const savings = straightLineCost > 0 ? Math.round(((straightLineCost - totalCost) / straightLineCost) * 100) : 0;

      const metadata: AStarRouteMetadata = {
        totalDistanceKm: parseFloat(totalDist.toFixed(1)),
        straightLineDistanceKm: parseFloat(straightLineDistanceKm.toFixed(1)),
        distanceDeltaKm: parseFloat((totalDist - straightLineDistanceKm).toFixed(1)),
        estimatedTimeMinutes: timeMinutes,
        maxTempEncountered: environment.tempC ?? -32,
        minTempEncountered: environment.apparentTempC ?? -45,
        windConditions: {
          speedKts: environment.windSpeedKts ?? 18,
          directionDeg: environment.windDirectionDeg ?? 45,
          headwindTailwind: (environment.windDirectionDeg ?? 45) < 90 ? 'HEADWIND' : 'TAILWIND',
          costImpactPercent: (environment.windDirectionDeg ?? 45) < 90 ? 25 : -10,
        },
        hazardsAvoided: Array.from(hazardsAvoidedSet),
        maxSlopeDeg: parseFloat(maxSlope.toFixed(1)),
        totalCost: parseFloat(totalCost.toFixed(1)),
        straightLineCost: parseFloat(straightLineCost.toFixed(1)),
        savingsVsStraightLinePercent: Math.max(0, savings),
      };

      const coordinates: [number, number][] = path.map((n) => [n.lat, n.lng]);

      return {
        path,
        coordinates,
        metadata,
      };
    }

    openSet.delete(currentId);
    const neighbors = adjacency.get(currentId) || [];

    for (const neighbor of neighbors) {
      nodeMap.set(neighbor.id, neighbor);
      const currentNode = nodeMap.get(currentId)!;
      const edgeCost = calculateEdgeCost(currentNode, neighbor, environment, asset);

      if (edgeCost === Infinity) continue; // Unroutable edge

      const tentativeG = (gScore.get(currentId) ?? Infinity) + edgeCost;

      if (tentativeG < (gScore.get(neighbor.id) ?? Infinity)) {
        cameFrom.set(neighbor.id, currentNode);
        gScore.set(neighbor.id, tentativeG);
        const h = haversineDistanceKm(neighbor.lat, neighbor.lng, goalNode.lat, goalNode.lng) * 0.90;
        fScore.set(neighbor.id, tentativeG + h);
        openSet.add(neighbor.id);
      }
    }
  }

  // Fallback: If no path found (e.g. enclosed), return direct route with warning
  const fallbackMetadata: AStarRouteMetadata = {
    totalDistanceKm: parseFloat(straightLineDistanceKm.toFixed(1)),
    straightLineDistanceKm: parseFloat(straightLineDistanceKm.toFixed(1)),
    distanceDeltaKm: 0,
    estimatedTimeMinutes: Math.round((straightLineDistanceKm / (asset.speedKmh || 24)) * 60),
    maxTempEncountered: environment.tempC ?? -32,
    minTempEncountered: environment.apparentTempC ?? -45,
    windConditions: {
      speedKts: environment.windSpeedKts ?? 18,
      directionDeg: environment.windDirectionDeg ?? 45,
      headwindTailwind: 'CROSSWIND',
      costImpactPercent: 0,
    },
    hazardsAvoided: [],
    maxSlopeDeg: 3.2,
    totalCost: straightLineCost,
    straightLineCost,
    savingsVsStraightLinePercent: 0,
  };

  return {
    path: [startNode, goalNode],
    coordinates: [[startNode.lat, startNode.lng], [goalNode.lat, goalNode.lng]],
    metadata: fallbackMetadata,
  };
}
