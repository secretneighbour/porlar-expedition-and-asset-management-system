import { Waypoint, WaypointStatus, GpsTrackPoint } from '../types';

export const DEFAULT_WAYPOINT_ARRIVAL_RADIUS_KM = 3.0;

/**
 * Calculates geodesic distance between two latitude/longitude points in kilometers using the Haversine formula.
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Earth mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Calculates compass heading bearing between two points in degrees (0 - 360°).
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
  return Math.round(brng);
}

/**
 * Formats distance in km or meters if sub-kilometer.
 */
export function formatDistanceKm(distKm: number): string {
  if (distKm < 1.0) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
}

/**
 * Formats ETA string given duration in minutes.
 */
export function formatEtaString(minutes: number): string {
  if (!minutes || minutes <= 0) return 'Arrived';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}h ${mins}m`;
}

export interface WaypointProgressResult {
  enrichedWaypoints: Waypoint[];
  activeWaypoint: Waypoint | null;
  activeWaypointIndex: number;
  traveledWaypoints: Waypoint[];
  remainingWaypoints: Waypoint[];
  traveledPathCoords: [number, number][];
  remainingPathCoords: [number, number][];
  totalPlannedDistanceKm: number;
  distanceTraveledKm: number;
  distanceRemainingKm: number;
  nextEtaMinutes: number;
  nextEtaFormatted: string;
  newlyReachedWaypoint: Waypoint | null;
}

/**
 * Evaluates progress across a waypoint sequence relative to current asset position.
 * Distinguishes traveled vs remaining route and identifies current active target.
 */
export function evaluateWaypointProgress(
  currentLat: number,
  currentLng: number,
  waypoints: Waypoint[],
  arrivalRadiusKm: number = DEFAULT_WAYPOINT_ARRIVAL_RADIUS_KM,
  speedKmh: number = 30
): WaypointProgressResult {
  if (!waypoints || waypoints.length === 0) {
    return {
      enrichedWaypoints: [],
      activeWaypoint: null,
      activeWaypointIndex: -1,
      traveledWaypoints: [],
      remainingWaypoints: [],
      traveledPathCoords: [],
      remainingPathCoords: [],
      totalPlannedDistanceKm: 0,
      distanceTraveledKm: 0,
      distanceRemainingKm: 0,
      nextEtaMinutes: 0,
      nextEtaFormatted: '0m',
      newlyReachedWaypoint: null,
    };
  }

  const effectiveSpeed = Math.max(5, speedKmh);
  let newlyReachedWaypoint: Waypoint | null = null;

  // 1. Identify which waypoint is active
  // Find first waypoint not marked passed
  let firstUnpassedIdx = waypoints.findIndex((w) => !w.passed);
  if (firstUnpassedIdx === -1) {
    // All passed, last waypoint was completed
    firstUnpassedIdx = waypoints.length - 1;
  }

  // Check if asset has arrived at the first unpassed waypoint
  if (firstUnpassedIdx >= 0 && firstUnpassedIdx < waypoints.length) {
    const candidate = waypoints[firstUnpassedIdx];
    const distToCandidate = haversineDistanceKm(currentLat, currentLng, candidate.lat, candidate.lng);
    const radius = candidate.arrivalRadiusKm || arrivalRadiusKm;

    if (!candidate.passed && distToCandidate <= radius) {
      newlyReachedWaypoint = { ...candidate, passed: true, status: 'completed' };
      // Advance to next waypoint if available
      if (firstUnpassedIdx < waypoints.length - 1) {
        firstUnpassedIdx += 1;
      }
    }
  }

  let cumulativeDistance = 0;
  let remainingDistanceAcc = 0;

  // 2. Build enriched waypoints with sequence numbers, statuses, distances & ETAs
  const enrichedWaypoints: Waypoint[] = waypoints.map((wp, idx) => {
    const seq = idx + 1;
    const isPassed = wp.passed || (newlyReachedWaypoint && newlyReachedWaypoint.id === wp.id);
    const isActive = idx === firstUnpassedIdx && !isPassed;
    const status: WaypointStatus = isPassed ? 'completed' : isActive ? 'current' : 'pending';

    const distFromCurrent = haversineDistanceKm(currentLat, currentLng, wp.lat, wp.lng);

    // Calculate sequential route ETA
    let etaMinutes = 0;
    if (isActive) {
      etaMinutes = (distFromCurrent / effectiveSpeed) * 60;
    } else if (idx > firstUnpassedIdx) {
      const prevWp = waypoints[idx - 1];
      const legDist = wp.distanceFromPrevKm || haversineDistanceKm(prevWp.lat, prevWp.lng, wp.lat, wp.lng);
      remainingDistanceAcc += legDist;
      etaMinutes = ((distFromCurrent + remainingDistanceAcc) / effectiveSpeed) * 60;
    }

    if (idx > 0) {
      const prev = waypoints[idx - 1];
      cumulativeDistance += wp.distanceFromPrevKm || haversineDistanceKm(prev.lat, prev.lng, wp.lat, wp.lng);
    }

    return {
      ...wp,
      sequence: seq,
      status,
      passed: Boolean(isPassed),
      distanceFromCurrentKm: distFromCurrent,
      eta: formatEtaString(etaMinutes),
      arrivalRadiusKm: wp.arrivalRadiusKm || arrivalRadiusKm,
    };
  });

  const activeWaypoint = enrichedWaypoints[firstUnpassedIdx] || null;
  const activeWaypointIndex = firstUnpassedIdx;

  const traveledWaypoints = enrichedWaypoints.filter((w) => w.status === 'completed');
  const remainingWaypoints = enrichedWaypoints.filter((w) => w.status !== 'completed');

  // 3. Build Traveled vs Remaining Polyline Coordinates
  // Traveled path: Start through all completed waypoints up to current asset position
  const traveledCoords: [number, number][] = [];
  traveledWaypoints.forEach((w) => {
    traveledCoords.push([w.lat, w.lng]);
  });
  // Connect cleanly up to current asset position
  traveledCoords.push([currentLat, currentLng]);

  // Remaining path: Start from current asset position, proceed to active waypoint, then remaining waypoints
  const remainingCoords: [number, number][] = [[currentLat, currentLng]];
  remainingWaypoints.forEach((w) => {
    remainingCoords.push([w.lat, w.lng]);
  });

  const distToActive = activeWaypoint ? haversineDistanceKm(currentLat, currentLng, activeWaypoint.lat, activeWaypoint.lng) : 0;
  const nextEtaMinutes = (distToActive / effectiveSpeed) * 60;

  let distRemaining = distToActive;
  for (let i = firstUnpassedIdx + 1; i < enrichedWaypoints.length; i++) {
    const curr = enrichedWaypoints[i];
    const prev = enrichedWaypoints[i - 1];
    distRemaining += curr.distanceFromPrevKm || haversineDistanceKm(prev.lat, prev.lng, curr.lat, curr.lng);
  }

  return {
    enrichedWaypoints,
    activeWaypoint,
    activeWaypointIndex,
    traveledWaypoints,
    remainingWaypoints,
    traveledPathCoords: traveledCoords.length > 1 ? traveledCoords : [],
    remainingPathCoords: remainingCoords.length > 1 ? remainingCoords : [],
    totalPlannedDistanceKm: Number(cumulativeDistance.toFixed(1)),
    distanceTraveledKm: Number((cumulativeDistance - distRemaining).toFixed(1)),
    distanceRemainingKm: Number(distRemaining.toFixed(1)),
    nextEtaMinutes: Number(nextEtaMinutes.toFixed(1)),
    nextEtaFormatted: formatEtaString(nextEtaMinutes),
    newlyReachedWaypoint,
  };
}
