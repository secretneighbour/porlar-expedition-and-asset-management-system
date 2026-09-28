import L from 'leaflet';
import { Waypoint, PolarAsset } from '../types';

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

/**
 * Linear or geodesic coordinate interpolator with cubic ease-out
 */
export function interpolateLatLng(
  start: [number, number],
  end: [number, number],
  progress: number
): [number, number] {
  // Cubic ease-out
  const t = 1 - Math.pow(1 - Math.min(1, Math.max(0, progress)), 3);
  const lat = start[0] + (end[0] - start[0]) * t;
  const lng = start[1] + (end[1] - start[1]) * t;
  return [lat, lng];
}

export interface WaypointCluster<T extends Waypoint = Waypoint> {
  id: string;
  lat: number;
  lng: number;
  count: number;
  items: T[];
  hasLethal: boolean;
  hasActive: boolean;
  hasPending: boolean;
  bounds: L.LatLngBounds;
}

/**
 * Tactical spatial clustering algorithm that groups waypoints within `radiusPx` screen pixels.
 * Uses native Leaflet map projection so no external cluster libraries are required.
 */
export function clusterTacticalWaypoints<T extends Waypoint>(
  map: L.Map,
  waypoints: T[],
  radiusPx = 44
): { clusters: WaypointCluster<T>[]; singles: T[] } {
  if (!map || waypoints.length === 0) {
    return { clusters: [], singles: waypoints };
  }

  const clusters: WaypointCluster<T>[] = [];
  const singles: T[] = [];
  const visited = new Set<string>();

  const projectedPoints = waypoints.map((wp, index) => {
    const latLng = L.latLng(wp.lat, wp.lng);
    let pt: L.Point;
    try {
      pt = map.latLngToContainerPoint(latLng);
    } catch {
      pt = L.point(0, 0);
    }
    return { wp, index, id: wp.id || `wp-${index}`, latLng, pt };
  });

  for (let i = 0; i < projectedPoints.length; i++) {
    const p1 = projectedPoints[i];
    if (visited.has(p1.id)) continue;

    const clusterGroup: typeof projectedPoints = [p1];
    visited.add(p1.id);

    for (let j = i + 1; j < projectedPoints.length; j++) {
      const p2 = projectedPoints[j];
      if (visited.has(p2.id)) continue;

      const dist = p1.pt.distanceTo(p2.pt);
      if (dist <= radiusPx) {
        clusterGroup.push(p2);
        visited.add(p2.id);
      }
    }

    if (clusterGroup.length > 1) {
      // Calculate cluster centroid
      let sumLat = 0;
      let sumLng = 0;
      let hasLethal = false;
      let hasActive = false;
      let hasPending = false;
      const bounds = L.latLngBounds(clusterGroup.map((c) => c.latLng));

      clusterGroup.forEach((item) => {
        sumLat += item.wp.lat;
        sumLng += item.wp.lng;
        if (
          (item.wp.hazardNote && item.wp.hazardNote.toLowerCase().includes('lethal')) ||
          (item.wp.hazardNote && item.wp.hazardNote.toLowerCase().includes('crevasse'))
        ) {
          hasLethal = true;
        }
        if (item.wp.status === 'current') hasActive = true;
        if (item.wp.status === 'pending') hasPending = true;
      });

      clusters.push({
        id: `cluster-${clusterGroup.map((c) => c.id).join('-')}`,
        lat: sumLat / clusterGroup.length,
        lng: sumLng / clusterGroup.length,
        count: clusterGroup.length,
        items: clusterGroup.map((c) => c.wp),
        hasLethal,
        hasActive,
        hasPending,
        bounds,
      });
    } else {
      singles.push(p1.wp);
    }
  }

  return { clusters, singles };
}

/**
 * Interpolation controller for smooth marker transitions.
 */
export class SmoothMarkerTracker {
  private currentLat: number;
  private currentLng: number;
  private targetLat: number;
  private targetLng: number;
  private startLat: number;
  private startLng: number;
  private startTime: number = 0;
  private durationMs: number = 800;
  private heading: number = 0;
  private animFrameId: number | null = null;
  private marker: L.Marker;
  private onUpdate?: (lat: number, lng: number, heading: number) => void;

  constructor(
    marker: L.Marker,
    initialLat: number,
    initialLng: number,
    initialHeading = 0,
    onUpdate?: (lat: number, lng: number, heading: number) => void
  ) {
    this.marker = marker;
    this.currentLat = initialLat;
    this.currentLng = initialLng;
    this.startLat = initialLat;
    this.startLng = initialLng;
    this.targetLat = initialLat;
    this.targetLng = initialLng;
    this.heading = initialHeading;
    this.onUpdate = onUpdate;
  }

  public updateTarget(newLat: number, newLng: number, durationMs = 800) {
    if (this.currentLat === newLat && this.currentLng === newLng) return;

    // Calculate heading towards target
    const newHeading = calculateBearing(this.currentLat, this.currentLng, newLat, newLng);
    if (!isNaN(newHeading)) {
      this.heading = newHeading;
    }

    this.startLat = this.currentLat;
    this.startLng = this.currentLng;
    this.targetLat = newLat;
    this.targetLng = newLng;
    this.durationMs = durationMs;
    this.startTime = performance.now();

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }

    this.animate();
  }

  private animate = () => {
    const now = performance.now();
    const elapsed = now - this.startTime;
    const progress = Math.min(1, elapsed / this.durationMs);

    const [curLat, curLng] = interpolateLatLng(
      [this.startLat, this.startLng],
      [this.targetLat, this.targetLng],
      progress
    );

    this.currentLat = curLat;
    this.currentLng = curLng;
    this.marker.setLatLng([curLat, curLng]);

    if (this.onUpdate) {
      this.onUpdate(curLat, curLng, this.heading);
    }

    if (progress < 1) {
      this.animFrameId = requestAnimationFrame(this.animate);
    } else {
      this.animFrameId = null;
    }
  };

  public getHeading(): number {
    return this.heading;
  }

  public destroy() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}
