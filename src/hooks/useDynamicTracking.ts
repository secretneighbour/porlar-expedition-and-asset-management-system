/**
 * Dynamic Asset Tracking & Polar GNSS Compensation Hook
 * 
 * Features:
 * - 2D Kalman Filter for Polar GPS jitter attenuation (mitigating low-satellite-elevation dispersion)
 * - 60 FPS smooth marker interpolation (0.5s transition window)
 * - Geodesic bearing calculation with heading indicator rotation
 * - Polar GNSS telemetry modeling: HDOP, VDOP, satellite count & elevation
 * - Dynamic asset state: cyan (stationary) -> emerald (moving)
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PolarAsset } from '../types';
import { calculateBearing } from '../utils/tacticalMapTracking';

export interface PolarGnssTelemetry {
  gpsQuality: 'GOOD' | 'MODERATE' | 'POOR';
  hdop: number;
  vdop: number;
  satellites: number;
  elevationMinDeg: number;
  elevationMaxDeg: number;
  elevationAvgDeg: number;
  geometryWarning: string;
  isFilteringActive: boolean;
}

export interface DynamicTrackedAsset {
  id: string;
  name: string;
  type: string;
  status: string;
  currentLat: number;
  currentLng: number;
  interpolatedLat: number;
  interpolatedLng: number;
  bearing: number;
  speedKmh: number;
  isMoving: boolean;
  hdop: number;
  vdop: number;
  satellites: number;
  gpsQuality: 'GOOD' | 'MODERATE' | 'POOR';
  smoothedAccuracyMeters: number;
  lastUpdated: number;
}

/**
 * 1D Kalman Filter instance for continuous coordinate smoothing
 */
class PolarKalmanFilter {
  private x: number; // State estimate (lat or lng)
  private p: number; // Estimate error covariance
  private q: number; // Process noise covariance
  private r: number; // Measurement noise covariance

  constructor(initialVal: number, processNoise: number = 0.000005, measurementNoise: number = 0.0001) {
    this.x = initialVal;
    this.p = 1.0;
    this.q = processNoise;
    this.r = measurementNoise;
  }

  public update(measurement: number, measurementUncertainty?: number): number {
    // Dynamically adjust measurement noise based on GNSS HDOP/accuracy
    const currentR = measurementUncertainty ? Math.max(0.00001, measurementUncertainty * 0.000005) : this.r;
    
    // Prediction step
    this.p = this.p + this.q;

    // Measurement update step
    const k = this.p / (this.p + currentR);
    this.x = this.x + k * (measurement - this.x);
    this.p = (1 - k) * this.p;

    return this.x;
  }

  public getState(): number {
    return this.x;
  }
}

/**
 * Custom hook for smooth real-time tracking with polar GNSS geometry compensation
 * 
 * @param sourceAssets Current list of assets from state, REST polling, or WebSocket
 * @param endpoint Optional WebSocket or polling endpoint URL
 * @param interpolationDurationMs Duration of smoothing interpolation window (default: 500ms)
 */
export function useDynamicTracking(
  sourceAssets: PolarAsset[],
  endpoint?: string,
  interpolationDurationMs: number = 500
) {
  const [trackedAssets, setTrackedAssets] = useState<DynamicTrackedAsset[]>([]);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Internal state tracking for animation and filtering
  const filtersRef = useRef<Map<string, { latFilter: PolarKalmanFilter; lngFilter: PolarKalmanFilter }>>(new Map());
  const assetAnimationRef = useRef<Map<string, {
    startLat: number;
    startLng: number;
    targetLat: number;
    targetLng: number;
    startTime: number;
    currentBearing: number;
    lastSpeed: number;
  }>>(new Map());

  const animationFrameIdRef = useRef<number | null>(null);

  /**
   * Calculate Polar GNSS Dilution of Precision metrics based on polar latitude
   * High latitudes (>65° S/N) experience low satellite elevation (0°–45°),
   * causing VDOP >> HDOP and horizontal dispersion.
   */
  const computePolarGnssMetrics = useCallback((lat: number): {
    hdop: number;
    vdop: number;
    satellites: number;
    gpsQuality: 'GOOD' | 'MODERATE' | 'POOR';
    elevationAvgDeg: number;
  } => {
    const absLat = Math.abs(lat);
    const polarFactor = Math.min(1.0, Math.max(0, (absLat - 60) / 30)); // 0 at 60°, 1 at 90°

    // Near poles, satellites are clustered near horizon
    const elevationAvgDeg = Math.round(48 - (polarFactor * 26)); // Drops from ~48° to ~22°
    const satellites = Math.round(9 - (polarFactor * 3)); // 9 satellites down to 6 visible
    
    // HDOP slightly degrades; VDOP degrades severely due to poor vertical geometry
    const hdop = parseFloat((1.2 + polarFactor * 1.6).toFixed(2)); // 1.2 to 2.8
    const vdop = parseFloat((2.5 + polarFactor * 4.8).toFixed(2)); // 2.5 to 7.3

    let gpsQuality: 'GOOD' | 'MODERATE' | 'POOR' = 'GOOD';
    if (hdop > 2.4 || elevationAvgDeg < 25) {
      gpsQuality = 'POOR';
    } else if (hdop > 1.8 || elevationAvgDeg < 35) {
      gpsQuality = 'MODERATE';
    }

    return { hdop, vdop, satellites, gpsQuality, elevationAvgDeg };
  }, []);

  // Update target coordinates when sourceAssets change
  useEffect(() => {
    const now = performance.now();

    sourceAssets.forEach((asset) => {
      const rawLat = asset.currentLocation.lat;
      const rawLng = asset.currentLocation.lng;

      // Initialize or retrieve Kalman filters for this asset
      let filterPair = filtersRef.current.get(asset.id);
      if (!filterPair) {
        filterPair = {
          latFilter: new PolarKalmanFilter(rawLat),
          lngFilter: new PolarKalmanFilter(rawLng),
        };
        filtersRef.current.set(asset.id, filterPair);
      }

      // Apply Kalman filter with polar measurement uncertainty
      const { hdop } = computePolarGnssMetrics(rawLat);
      const smoothedLat = filterPair.latFilter.update(rawLat, hdop * 12);
      const smoothedLng = filterPair.lngFilter.update(rawLng, hdop * 12);

      const anim = assetAnimationRef.current.get(asset.id);
      if (!anim) {
        // Initial placement
        assetAnimationRef.current.set(asset.id, {
          startLat: smoothedLat,
          startLng: smoothedLng,
          targetLat: smoothedLat,
          targetLng: smoothedLng,
          startTime: now,
          currentBearing: 0,
          lastSpeed: 0,
        });
      } else {
        // New incoming target: calculate bearing and update interpolation bounds
        const dLat = smoothedLat - anim.targetLat;
        const dLng = smoothedLng - anim.targetLng;
        const hasMoved = Math.abs(dLat) > 0.00005 || Math.abs(dLng) > 0.00005;

        const newBearing = hasMoved 
          ? calculateBearing(anim.targetLat, anim.targetLng, smoothedLat, smoothedLng)
          : anim.currentBearing;

        assetAnimationRef.current.set(asset.id, {
          startLat: anim.targetLat,
          startLng: anim.targetLng,
          targetLat: smoothedLat,
          targetLng: smoothedLng,
          startTime: now,
          currentBearing: newBearing,
          lastSpeed: hasMoved ? Math.max(12, Math.random() * 25 + 10) : 0,
        });
      }
    });

    // Clean up filters for removed assets
    const activeIds = new Set(sourceAssets.map(a => a.id));
    for (const id of filtersRef.current.keys()) {
      if (!activeIds.has(id)) {
        filtersRef.current.delete(id);
        assetAnimationRef.current.delete(id);
      }
    }
  }, [sourceAssets, computePolarGnssMetrics]);

  // High-performance requestAnimationFrame interpolation loop
  useEffect(() => {
    const loop = (timestamp: number) => {
      const updated: DynamicTrackedAsset[] = sourceAssets.map((asset) => {
        const anim = assetAnimationRef.current.get(asset.id);
        const { hdop, vdop, satellites, gpsQuality } = computePolarGnssMetrics(asset.currentLocation.lat);

        if (!anim) {
          return {
            id: asset.id,
            name: asset.name,
            type: asset.category,
            status: asset.status,
            currentLat: asset.currentLocation.lat,
            currentLng: asset.currentLocation.lng,
            interpolatedLat: asset.currentLocation.lat,
            interpolatedLng: asset.currentLocation.lng,
            bearing: 0,
            speedKmh: 0,
            isMoving: false,
            hdop,
            vdop,
            satellites,
            gpsQuality,
            smoothedAccuracyMeters: 8,
            lastUpdated: Date.now(),
          };
        }

        // Cubic ease-out interpolation
        const elapsed = timestamp - anim.startTime;
        const progress = Math.min(1.0, Math.max(0.0, elapsed / interpolationDurationMs));
        const ease = 1 - Math.pow(1 - progress, 3);

        const currentInterpLat = anim.startLat + (anim.targetLat - anim.startLat) * ease;
        const currentInterpLng = anim.startLng + (anim.targetLng - anim.startLng) * ease;
        const isMoving = anim.lastSpeed > 1.0;

        return {
          id: asset.id,
          name: asset.name,
          type: asset.category,
          status: asset.status,
          currentLat: anim.targetLat,
          currentLng: anim.targetLng,
          interpolatedLat: currentInterpLat,
          interpolatedLng: currentInterpLng,
          bearing: anim.currentBearing,
          speedKmh: isMoving ? anim.lastSpeed : 0,
          isMoving,
          hdop,
          vdop,
          satellites,
          gpsQuality,
          smoothedAccuracyMeters: Math.round(hdop * 12),
          lastUpdated: Date.now(),
        };
      });

      setTrackedAssets(updated);
      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [sourceAssets, interpolationDurationMs, computePolarGnssMetrics]);

  // Aggregate polar GNSS telemetry across active fleet
  const gnssTelemetry: PolarGnssTelemetry = useMemo(() => {
    if (trackedAssets.length === 0) {
      return {
        gpsQuality: 'MODERATE',
        hdop: 1.85,
        vdop: 4.6,
        satellites: 8,
        elevationMinDeg: 8,
        elevationMaxDeg: 42,
        elevationAvgDeg: 28,
        geometryWarning: 'Polar GNSS: Satellites visible only at low elevation (<45°); VDOP elevated.',
        isFilteringActive: true,
      };
    }

    const avgHdop = trackedAssets.reduce((sum, a) => sum + a.hdop, 0) / trackedAssets.length;
    const avgVdop = trackedAssets.reduce((sum, a) => sum + a.vdop, 0) / trackedAssets.length;
    const worstQuality = trackedAssets.some(a => a.gpsQuality === 'POOR')
      ? 'POOR'
      : trackedAssets.some(a => a.gpsQuality === 'MODERATE')
      ? 'MODERATE'
      : 'GOOD';

    return {
      gpsQuality: worstQuality,
      hdop: parseFloat(avgHdop.toFixed(2)),
      vdop: parseFloat(avgVdop.toFixed(2)),
      satellites: Math.min(...trackedAssets.map(a => a.satellites)),
      elevationMinDeg: 6,
      elevationMaxDeg: 44,
      elevationAvgDeg: 26,
      geometryWarning: '⚠ Polar GNSS: Vertical accuracy reduced; horizontal geometry dispersed.',
      isFilteringActive: true,
    };
  }, [trackedAssets]);

  const dismissWarning = useCallback(() => {
    setIsWarningDismissed(true);
  }, []);

  return {
    trackedAssets,
    gnssTelemetry,
    isConnected,
    isWarningDismissed,
    dismissWarning,
  };
}
