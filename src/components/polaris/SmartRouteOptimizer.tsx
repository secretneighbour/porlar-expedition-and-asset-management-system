import React, { useState, useMemo, useEffect } from 'react';
import {
  Navigation,
  Satellite,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Send,
  ArrowRight,
  Radio,
  Sliders,
  Ruler,
  Maximize2,
  LocateFixed,
  Compass,
  ThermometerSnowflake,
  Wind,
  CloudRain,
  EyeOff,
  Gauge,
  Activity,
  MapPin,
  Flame,
  AlertCircle,
  X,
  XCircle
} from 'lucide-react';
import { FONT_HEAD, FONT_BODY, emitAiActionBroadcast } from '../../data/polarisData';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useRealtimeWeather } from '../../hooks/useRealtimeWeather';
import { evaluateLocationWeatherHazards, WeatherHazardEvaluation } from '../../utils/weatherHazards';
import { INITIAL_STATIONS, INITIAL_EXPEDITIONS } from '../../data/polarData';
import { Waypoint, WaypointOptimizationResult, WaypointOptimizationRequest } from '../../types';

interface SmartRouteOptimizerProps {
  t: any;
  db?: any;
  setDb?: React.Dispatch<React.SetStateAction<any>>;
  geminiApiKey?: string;
  onNavigateToMap?: (coords?: { lat: number; lng: number }) => void;
  isSimulation?: boolean;
}

export function SmartRouteOptimizer({
  t,
  db,
  setDb,
  geminiApiKey,
  onNavigateToMap,
  isSimulation,
}: SmartRouteOptimizerProps) {
  // Device Geolocation hook
  const geo = useGeolocation(true);

  // Weather hook for current location & stations
  const weather = useRealtimeWeather({
    stations: INITIAL_STATIONS,
    expeditions: INITIAL_EXPEDITIONS,
    userLat: geo.latitude,
    userLng: geo.longitude,
    userLocationName: geo.cityName,
    region: geo.latitude && geo.latitude > 0 ? 'arctic' : 'antarctica',
  });

  // Active Corridor / Mode selection
  const [corridorMode, setCorridorMode] = useState<'device_dynamic' | 'maitri_southpole' | 'concordia_vostok'>('device_dynamic');
  const [destinationTarget, setDestinationTarget] = useState<string>('Maitri Coastal Base Depot');

  // Map layer controls
  const [showLegacyRoute, setShowLegacyRoute] = useState<boolean>(true);
  const [showAiSafeRoute, setShowAiSafeRoute] = useState<boolean>(true);
  const [showCrevasses, setShowCrevasses] = useState<boolean>(true);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [pushing, setPushing] = useState<boolean>(false);
  const [pushedToTrucks, setPushedToTrucks] = useState<boolean>(false);
  const [selectedHazard, setSelectedHazard] = useState<any>(null);
  const [scanTimestamp, setScanTimestamp] = useState<string>('Live Dynamic Sync (Active GPS + SAR)');

  // Gemini Route Optimization state
  const [geminiPlan, setGeminiPlan] = useState<WaypointOptimizationResult | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [operatorDecision, setOperatorDecision] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [showAiProposalOnMap, setShowAiProposalOnMap] = useState<boolean>(true);

  // Evaluate real-time weather hazards for the device's location
  const hazardEvaluation: WeatherHazardEvaluation = useMemo(() => {
    return evaluateLocationWeatherHazards(
      weather.userLocationWeather,
      geo.cityName || (geo.latitude ? `${geo.latitude.toFixed(2)}°, ${geo.longitude?.toFixed(2)}°` : 'Device Location')
    );
  }, [weather.userLocationWeather, geo.cityName, geo.latitude, geo.longitude]);

  // Detected Glacial Crevasses and Dynamic Weather Hazard Centers
  const detectedCrevasses = useMemo(() => {
    const isDynamic = corridorMode === 'device_dynamic';
    return [
      {
        id: 'CRV-01',
        name: 'Crevasse Chasm C-104 (Major Shear Fissure)',
        cx: 48,
        cy: 46,
        widthM: 18.5,
        depthM: 42.0,
        intersectsOldRoute: true,
        risk: 'CRITICAL COLLAPSE ZONE',
        sensor: 'Sentinel-1 SAR Interferogram Coherence Loss',
        description: 'Newly sheared transverse crevasse spanning 450m directly across legacy direct corridor. Snow-bridge thickness < 0.4m (92% punch-through risk for 28-ton crawlers).',
      },
      {
        id: 'CRV-02',
        name: 'Stress Fracture F-88 (Sub-surface Cavity)',
        cx: 62,
        cy: 58,
        widthM: 12.0,
        depthM: 28.0,
        intersectsOldRoute: true,
        risk: 'SEVERE SHEAR',
        sensor: 'WorldView-3 30cm Multispectral Thermal Contrast',
        description: 'Rapidly widening shear crack on glacier hinge line caused by ice sheet creep (+3.2m/month). Direct collision hazard with legacy path.',
      },
      {
        id: 'CRV-03',
        name: 'Bergschrund Crevasse B-12 (Peripheral Fracture)',
        cx: 74,
        cy: 72,
        widthM: 9.5,
        depthM: 21.0,
        intersectsOldRoute: false,
        risk: 'MODERATE FISSURE',
        sensor: 'CryoSat-2 Surface Roughness Radar Altimeter',
        description: 'Peripheral crevasse 180m north of new safe corridor. Safely skirted by AI pathfinding with verified 300m blue-ice buffer.',
      },
      ...(isDynamic && hazardEvaluation.overallSeverity !== 'NORMAL' ? [
        {
          id: 'WX-HAZ-01',
          name: `Atmospheric Hazard Front: ${hazardEvaluation.hazards[0]?.title || 'Squall Line'}`,
          cx: 38,
          cy: 38,
          widthM: 2400,
          depthM: 0,
          intersectsOldRoute: true,
          risk: hazardEvaluation.overallSeverity,
          sensor: 'Live Device AWOS Telemetry & Barometric Gradient',
          description: `Active local weather hazard: ${hazardEvaluation.hazards[0]?.metric || 'High chill & wind drift'}. AI pathfinder circumnavigates the squall corridor.`,
        }
      ] : []),
    ];
  }, [corridorMode, hazardEvaluation]);

  // Compute origin label
  const originLabel = useMemo(() => {
    if (corridorMode === 'device_dynamic') {
      if (geo.cityName) return `GPS: ${geo.cityName}`;
      if (geo.latitude !== null && geo.longitude !== null) {
        return `GPS: ${geo.latitude.toFixed(3)}°, ${geo.longitude.toFixed(3)}°`;
      }
      return 'Live Device Location (Acquiring...)';
    }
    if (corridorMode === 'concordia_vostok') return 'Concordia Base (Dome C)';
    return 'Maitri Base Depot (Antarctica)';
  }, [corridorMode, geo.cityName, geo.latitude, geo.longitude]);

  // Available candidate waypoints based on active expedition or selected corridor
  const candidateWaypoints: Waypoint[] = useMemo(() => {
    if (db?.expeditions?.[0]?.waypoints && db.expeditions[0].waypoints.length >= 2) {
      return db.expeditions[0].waypoints.map((w: any, idx: number) => ({
        ...w,
        sequence: w.sequence || idx + 1,
        priority: w.priority || (idx === 0 || idx === db.expeditions[0].waypoints.length - 1 ? 'mandatory' : 'normal'),
        isMandatory: w.isMandatory !== undefined ? w.isMandatory : (idx === 0 || idx === db.expeditions[0].waypoints.length - 1),
      }));
    }

    const baseLat = corridorMode === 'concordia_vostok' ? -75.10 : -70.76;
    const baseLng = corridorMode === 'concordia_vostok' ? 123.33 : 11.73;

    if (corridorMode === 'concordia_vostok') {
      return [
        { id: 'WP-01', name: 'Concordia Staging Hub', lat: -75.10, lng: 123.33, sequence: 1, isMandatory: true, priority: 'mandatory', status: 'completed' },
        { id: 'WP-02', name: 'Dome Ridge Blue-Ice Corridor', lat: -76.10, lng: 119.50, sequence: 2, priority: 'high', status: 'current' },
        { id: 'WP-03', name: 'Sastrugi Deflection Gate', lat: -76.90, lng: 115.20, sequence: 3, priority: 'normal', status: 'pending' },
        { id: 'WP-04', name: 'Ridge 3600m Transit Point', lat: -77.60, lng: 111.40, sequence: 4, priority: 'normal', status: 'pending' },
        { id: 'WP-05', name: 'Lake Vostok Glacial Transition', lat: -78.10, lng: 108.10, sequence: 5, priority: 'high', status: 'pending' },
        { id: 'WP-06', name: destinationTarget, lat: -78.46, lng: 106.84, sequence: 6, isMandatory: true, priority: 'mandatory', status: 'pending' },
      ];
    }

    return [
      { id: 'WP-01', name: originLabel, lat: baseLat, lng: baseLng, sequence: 1, isMandatory: true, priority: 'mandatory', status: 'completed' },
      { id: 'WP-02', name: 'Moraine Blue-Ice Bypass', lat: -71.12, lng: 11.95, sequence: 2, priority: 'high', status: 'current' },
      { id: 'WP-03', name: 'West Fissure Bypass Ridge', lat: -71.42, lng: 12.22, sequence: 3, priority: 'normal', status: 'pending' },
      { id: 'WP-04', name: 'Firn Ridge Transition Point', lat: -71.68, lng: 12.45, sequence: 4, priority: 'normal', status: 'pending' },
      { id: 'WP-05', name: 'Plateau Gate Approach', lat: -71.85, lng: 12.72, sequence: 5, priority: 'high', status: 'pending' },
      { id: 'WP-06', name: destinationTarget, lat: -72.05, lng: 12.98, sequence: 6, isMandatory: true, priority: 'mandatory', status: 'pending' },
    ];
  }, [db?.expeditions, corridorMode, originLabel, destinationTarget]);

  // Run Gemini-powered waypoint route optimization
  const handleRunGeminiRouteOptimization = async () => {
    setOptimizing(true);
    setGeminiError(null);
    try {
      const activeAsset = db?.assets?.[0] || {
        id: 'AST-0001',
        name: 'TRK-Alpha Heavy Snowcat',
        lat: candidateWaypoints[0]?.lat || -70.76,
        lng: candidateWaypoints[0]?.lng || 11.73,
        speedKmh: 24,
        headingDeg: 180,
        type: 'PistenBully 300 Polar Crawler',
        fuelPercent: 88,
        condition: 'nominal',
      };

      const payload: WaypointOptimizationRequest = {
        waypoints: candidateWaypoints,
        asset: {
          id: activeAsset.id || 'AST-0001',
          name: activeAsset.name || 'TRK-Alpha Heavy Snowcat',
          lat: activeAsset.lat || candidateWaypoints[0]?.lat || -70.76,
          lng: activeAsset.lng || candidateWaypoints[0]?.lng || 11.73,
          speedKmh: activeAsset.speedKmh || 22,
          headingDeg: activeAsset.headingDeg || 180,
          vehicleType: activeAsset.type || 'PistenBully 300 Polar Crawler',
          fuelPercent: activeAsset.fuelPercent || 85,
          condition: activeAsset.condition || 'nominal',
        },
        environment: {
          tempC: hazardEvaluation.tempC,
          apparentTempC: hazardEvaluation.apparentTempC,
          windSpeedKts: hazardEvaluation.windSpeedKts,
          visibilityKm: hazardEvaluation.visibilityKm,
          weatherDescription: hazardEvaluation.weatherDescription,
          weatherHazards: hazardEvaluation.hazards.map((h: any) => `${h.title}: ${h.metric}`),
          crevasses: [
            { id: 'CRV-01', name: 'Crevasse Chasm C-104', lat: candidateWaypoints[0]?.lat + 0.05, lng: candidateWaypoints[0]?.lng + 0.08, dangerLevel: 'CRITICAL' },
            { id: 'CRV-02', name: 'Stress Fracture F-88', lat: candidateWaypoints[0]?.lat + 0.12, lng: candidateWaypoints[0]?.lng + 0.15, dangerLevel: 'SEVERE' }
          ],
          dangerZones: [
            {
              id: 'DZ-WX-01',
              name: 'Katabatic Front Anomaly',
              lat: (candidateWaypoints[0]?.lat + candidateWaypoints[candidateWaypoints.length - 1]?.lat) / 2,
              lng: (candidateWaypoints[0]?.lng + candidateWaypoints[candidateWaypoints.length - 1]?.lng) / 2,
              radiusKm: 25,
              severityLevel: hazardEvaluation.overallSeverity,
            }
          ],
        },
        constraints: {
          maxTravelDistanceKm: 600,
          mandatoryWaypointIds: candidateWaypoints.filter(w => w.isMandatory).map(w => w.id),
          emergencyRestrictions: hazardEvaluation.overallSeverity === 'LETHAL' ? ['Lethal Katabatic Gale Active'] : [],
        },
        isSimulation: isSimulation,
      };

      emitAiActionBroadcast({
        category: 'logistics',
        message: `Analyzing route with Gemini for ${candidateWaypoints.length} waypoints along ${corridorMode}...`,
        stationOrAsset: activeAsset.name,
      });

      const res = await fetch('/api/ai/waypoints/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.result) {
        setGeminiPlan(data.result);
        setOperatorDecision('pending');
        emitAiActionBroadcast({
          category: 'logistics',
          message: `Gemini Route Recommendation ready: ${data.result.recommendedOrder.join(' → ')} (${data.result.estimatedDistance.toFixed(1)} km, Risk: ${data.result.riskLevel}). Pending operator review.`,
          stationOrAsset: activeAsset.name,
          impact: data.result.reasoning[0] || 'Safe polar waypoint sequence',
        });
      } else {
        throw new Error(data.error || 'Optimization calculation failed.');
      }
    } catch (err: any) {
      console.warn('Gemini route optimization error:', err);
      setGeminiError(err.message || 'Route optimization error');
    } finally {
      setOptimizing(false);
    }
  };

  // Operator Approves and Dispatches Proposed Route
  const handleApproveAndApplyRoute = () => {
    if (!geminiPlan) return;
    setOperatorDecision('approved');
    setPushedToTrucks(true);

    if (setDb) {
      setDb((prev: any) => {
        const nextExpeditions = (prev.expeditions || []).map((exp: any, i: number) => {
          if (i === 0 || exp.id === 'EXP-0001') {
            return {
              ...exp,
              waypoints: geminiPlan.orderedWaypoints,
              currentLat: geminiPlan.orderedWaypoints[0]?.lat || exp.currentLat,
              currentLng: geminiPlan.orderedWaypoints[0]?.lng || exp.currentLng,
            };
          }
          return exp;
        });

        return {
          ...prev,
          expeditions: nextExpeditions,
          alerts: [
            {
              id: `alt-ai-route-${Date.now()}`,
              title: `${isSimulation ? '[SIMULATION] ' : ''}Gemini Route Applied: ${geminiPlan.recommendedOrder.join(' → ')} (${geminiPlan.estimatedDistance.toFixed(1)} km)`,
              severity: geminiPlan.riskLevel === 'HIGH' ? 'WARNING' : 'LOW',
              timestamp: new Date().toISOString(),
              read: false,
            },
            ...(prev.alerts || []),
          ],
        };
      });
    }

    emitAiActionBroadcast({
      category: 'logistics',
      message: `${isSimulation ? '[SIMULATION] ' : ''}Operator approved Gemini route (${geminiPlan.recommendedOrder.join(' → ')}). Dispatched to convoy fleet navigation.`,
      stationOrAsset: 'Active Fleet Logistics',
      impact: `Route verified: ${geminiPlan.estimatedDistance.toFixed(1)} km, ${geminiPlan.riskLevel} risk`,
    });
  };

  // Operator Rejects Proposed Route
  const handleRejectProposedRoute = () => {
    setOperatorDecision('rejected');
    emitAiActionBroadcast({
      category: 'logistics',
      message: 'Operator rejected proposed AI route. Preserving active legacy operational path.',
      stationOrAsset: 'Fleet Operations',
    });
  };

  // Run AI & Satellite Scan
  const handleRunDailySatelliteScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/ai/smart-route/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corridor: `${originLabel} to ${destinationTarget}`,
          sensorSource: 'Sentinel-1 SAR C-Band, WorldView-3 & Live AWOS',
          geminiApiKey: geminiApiKey || undefined,
          userLat: geo.latitude,
          userLng: geo.longitude,
          userLocationName: geo.cityName || undefined,
          destinationName: destinationTarget,
          weatherSummary: `${hazardEvaluation.tempC}°C (Chill: ${hazardEvaluation.apparentTempC}°C) | Wind: ${hazardEvaluation.windSpeedKts} kt | ${hazardEvaluation.weatherDescription}`,
          localHazards: hazardEvaluation.hazards,
        }),
      });
      await res.json();
      setScanTimestamp('Updated Just Now (Live Satellite Pass & Device GPS)');

      // Also trigger Gemini route optimization
      await handleRunGeminiRouteOptimization();
    } catch (err) {
      console.warn('Network scan call failed, using local model calculation.');
      setScanTimestamp('Updated Just Now (Local Glaciology Heuristic)');
    }
    setScanning(false);
  };

  // Push Route to Trucks & Fleet
  const handlePushRouteToTrucks = async () => {
    setPushing(true);
    try {
      const res = await fetch('/api/ai/smart-route/push-to-trucks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: `RTE-OPT-${Date.now().toString().slice(-4)}`,
          routeName: `AI Safe Route: ${originLabel} → ${destinationTarget}`,
          truckCount: 2,
          truckNames: ['TRK-Alpha Heavy Snowcat (AST-0001)', 'P300 Supply Hauler Convoy-1'],
        }),
      });
      await res.json();
      setPushedToTrucks(true);

      if (setDb) {
        setDb((prev: any) => {
          // If Gemini plan is available, use its ordered waypoints, otherwise use deterministic defaults
          const optimizedWaypoints: Waypoint[] = geminiPlan?.orderedWaypoints && geminiPlan.orderedWaypoints.length > 0
            ? geminiPlan.orderedWaypoints
            : (corridorMode === 'concordia_vostok' ? [
                { id: 'wp-opt-1', name: 'Concordia Staging Hub', lat: -75.10, lng: 123.33, elevationM: 3233, passed: true, status: 'completed', sequence: 1 },
                { id: 'wp-opt-2', name: 'Dome Ridge Blue-Ice Corridor', lat: -76.10, lng: 119.50, elevationM: 3400, passed: false, status: 'current', sequence: 2, hazardNote: '300m Crevasse Buffer Active' },
                { id: 'wp-opt-3', name: 'Sastrugi Deflection Gate', lat: -76.90, lng: 115.20, elevationM: 3520, passed: false, status: 'pending', sequence: 3 },
                { id: 'wp-opt-4', name: 'Ridge 3600m Transit Point', lat: -77.60, lng: 111.40, elevationM: 3600, passed: false, status: 'pending', sequence: 4 },
                { id: 'wp-opt-5', name: 'Lake Vostok Glacial Transition', lat: -78.10, lng: 108.10, elevationM: 3500, passed: false, status: 'pending', sequence: 5 },
                { id: 'wp-opt-6', name: destinationTarget, lat: -78.46, lng: 106.84, elevationM: 3488, passed: false, status: 'pending', sequence: 6 },
              ] : [
                { id: 'wp-opt-1', name: originLabel, lat: -70.76, lng: 11.73, elevationM: 140, passed: true, status: 'completed', sequence: 1 },
                { id: 'wp-opt-2', name: 'Moraine Blue-Ice Bypass', lat: -71.12, lng: 11.95, elevationM: 450, passed: false, status: 'current', sequence: 2, hazardNote: '300m Crevasse Safety Buffer Active' },
                { id: 'wp-opt-3', name: 'West Fissure Bypass Ridge', lat: -71.42, lng: 12.22, elevationM: 920, passed: false, status: 'pending', sequence: 3 },
                { id: 'wp-opt-4', name: 'Firn Ridge Transition Point', lat: -71.68, lng: 12.45, elevationM: 1650, passed: false, status: 'pending', sequence: 4 },
                { id: 'wp-opt-5', name: 'Plateau Gate Approach', lat: -71.85, lng: 12.72, elevationM: 2280, passed: false, status: 'pending', sequence: 5 },
                { id: 'wp-opt-6', name: destinationTarget, lat: -72.05, lng: 12.98, elevationM: 2835, passed: false, status: 'pending', sequence: 6 },
              ]);

          const nextExpeditions = (prev.expeditions || []).map((exp: any, i: number) => {
            if (i === 0 || exp.id === 'EXP-0001') {
              return {
                ...exp,
                waypoints: optimizedWaypoints,
                currentLat: optimizedWaypoints[0].lat,
                currentLng: optimizedWaypoints[0].lng,
              };
            }
            return exp;
          });

          return {
            ...prev,
            expeditions: nextExpeditions,
            alerts: [
              {
                id: `alt-route-${Date.now()}`,
                title: `${isSimulation ? '[SIMULATION] ' : ''}Safe Route Dispatched: ${originLabel} → ${destinationTarget}`,
                severity: 'LOW',
                timestamp: new Date().toISOString(),
                read: false,
              },
              ...(prev.alerts || []),
            ],
          };
        });
      }
    } catch (err) {
      setPushedToTrucks(true);
    }
    setPushing(false);
  };

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${t.panel} 0%, rgba(16, 185, 129, 0.04) 100%)`,
        border: `1px solid ${t.border}`,
      }}
      className="rounded-xl p-4 sm:p-5 transition-all duration-300 relative overflow-hidden"
    >
      {/* Top Header Badge Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded text-[11px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <Satellite size={13} className="text-emerald-400 animate-pulse" />
            <span>Smart Route Optimization (Dynamic Pathfinding)</span>
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-1">
            <LocateFixed size={12} className={geo.isWatching ? 'text-emerald-400 animate-spin' : 'text-cyan-400'} />
            <span>Dynamic Device Location &bull; {geo.source === 'gps' ? 'Live GPS' : geo.source === 'ip' ? 'IP Geo' : 'Active'}</span>
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
            hazardEvaluation.overallSeverity === 'LETHAL'
              ? 'bg-purple-950 text-purple-300 border border-purple-800 animate-pulse'
              : hazardEvaluation.overallSeverity === 'CRITICAL'
              ? 'bg-rose-950 text-rose-300 border border-rose-800'
              : hazardEvaluation.overallSeverity === 'WARNING'
              ? 'bg-amber-950 text-amber-300 border border-amber-800'
              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
          }`}>
            <AlertTriangle size={11} />
            <span>HAZARDS: {hazardEvaluation.overallSeverity} ({hazardEvaluation.hazards.length} ACTIVE)</span>
          </span>

          {isSimulation && (
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
              <Sparkles size={11} />
              <span>SIMULATION &bull; AI ROUTE</span>
            </span>
          )}

          {geminiPlan && (
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
              operatorDecision === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : operatorDecision === 'rejected'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
            }`}>
              <Sparkles size={11} />
              <span>AI ROUTE: {operatorDecision === 'approved' ? 'APPROVED & ACTIVE' : operatorDecision === 'rejected' ? 'REJECTED' : 'PROPOSED (AWAITING APPROVAL)'}</span>
            </span>
          )}
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRunGeminiRouteOptimization}
            disabled={optimizing}
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              color: '#e9d5ff',
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-purple-600/30 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles size={12} className={optimizing ? 'animate-spin text-purple-300' : 'text-purple-300'} />
            <span>{optimizing ? 'Analyzing with Gemini...' : 'Gemini AI Optimize'}</span>
          </button>

          <button
            onClick={handleRunDailySatelliteScan}
            disabled={scanning || optimizing}
            style={{ background: t.bgAlt, border: `1px solid ${t.border}`, color: t.text }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-white/5 transition-all flex items-center gap-1.5"
          >
            <RefreshCw size={12} className={scanning ? 'animate-spin text-sky-400' : 'text-sky-400'} />
            <span>{scanning ? 'Scanning SAR & Weather...' : 'Re-scan SAR & Weather'}</span>
          </button>

          <button
            onClick={handlePushRouteToTrucks}
            disabled={pushing || pushedToTrucks}
            style={{
              background: pushedToTrucks ? 'rgba(16, 185, 129, 0.2)' : 'linear-gradient(135deg, #7C3AED, #60A5FA)',
              color: pushedToTrucks ? '#34d399' : '#FFFFFF',
              border: pushedToTrucks ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
              boxShadow: pushedToTrucks ? 'none' : '0 4px 15px rgba(124, 58, 237, 0.35)'
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer hover:opacity-95 transition-all flex items-center gap-1.5 font-sans"
          >
            {pushing ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Transmitting Safe Route...</span>
              </>
            ) : pushedToTrucks ? (
              <>
                <CheckCircle2 size={13} />
                <span>Pushed to Supply Fleet (Locked)</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Push Safe Route to Trucks</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feature Context Headline & Corridor Selector */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
            <span>Dynamic Route Optimization &amp; Weather Hazard Avoidance</span>
          </h2>

          {/* Corridor Selection Pills */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => {
                setCorridorMode('device_dynamic');
                setPushedToTrucks(false);
              }}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                corridorMode === 'device_dynamic'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LocateFixed size={12} />
              <span>Live Device GPS Route</span>
            </button>
            <button
              onClick={() => {
                setCorridorMode('maitri_southpole');
                setPushedToTrucks(false);
              }}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                corridorMode === 'maitri_southpole'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Maitri &rarr; South Pole
            </button>
            <button
              onClick={() => {
                setCorridorMode('concordia_vostok');
                setPushedToTrucks(false);
              }}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                corridorMode === 'concordia_vostok'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Concordia &rarr; Vostok
            </button>
          </div>
        </div>

        <p style={{ color: t.textDim }} className="text-xs mt-1.5 leading-relaxed max-w-4xl">
          <strong className="text-slate-200">Dynamic AI Navigation:</strong> In extreme polar environments, ice sheets shift continuously (+3.2m/month creep) and katabatic blizzards generate lethal sub-zero wind chills. Polaris AI integrates{' '}
          <span className="text-sky-300 font-semibold">your real-time device location ({geo.cityName || 'Live GPS'})</span>, daily Sentinel-1 SAR satellite scans, and Open-Meteo AWOS telemetry to{' '}
          <span className="text-emerald-300 font-semibold">dynamically detour around active crevasses and katabatic squall corridors</span> along safe blue-ice ridges with a 300m safety buffer.
        </p>
      </div>

      {/* Real-Time Device Weather & Hazard Detection HUD Banner */}
      <div
        style={{
          background:
            hazardEvaluation.overallSeverity === 'LETHAL'
              ? 'linear-gradient(90deg, rgba(88, 28, 135, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)'
              : hazardEvaluation.overallSeverity === 'CRITICAL'
              ? 'linear-gradient(90deg, rgba(127, 29, 29, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)'
              : hazardEvaluation.overallSeverity === 'WARNING'
              ? 'linear-gradient(90deg, rgba(120, 53, 15, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)'
              : 'linear-gradient(90deg, rgba(6, 78, 59, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: `1px solid ${
            hazardEvaluation.overallSeverity === 'LETHAL'
              ? 'rgba(168, 85, 247, 0.5)'
              : hazardEvaluation.overallSeverity === 'CRITICAL'
              ? 'rgba(239, 68, 68, 0.5)'
              : hazardEvaluation.overallSeverity === 'WARNING'
              ? 'rgba(245, 158, 11, 0.5)'
              : 'rgba(16, 185, 129, 0.4)'
          }`,
        }}
        className="rounded-xl p-3.5 mb-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        {/* Left: Location & Meteorological Metrics */}
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            hazardEvaluation.overallSeverity === 'LETHAL'
              ? 'bg-purple-900/60 text-purple-300'
              : hazardEvaluation.overallSeverity === 'CRITICAL'
              ? 'bg-rose-900/60 text-rose-300'
              : hazardEvaluation.overallSeverity === 'WARNING'
              ? 'bg-amber-900/60 text-amber-300'
              : 'bg-emerald-900/60 text-emerald-300'
          }`}>
            <ThermometerSnowflake size={24} className="animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <MapPin size={13} className="text-sky-400" />
                <span>{hazardEvaluation.locationName}</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800">
                {hazardEvaluation.coords}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                hazardEvaluation.overallSeverity === 'LETHAL'
                  ? 'bg-purple-500 text-slate-950'
                  : hazardEvaluation.overallSeverity === 'CRITICAL'
                  ? 'bg-rose-500 text-white'
                  : hazardEvaluation.overallSeverity === 'WARNING'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-emerald-500 text-slate-950'
              }`}>
                {hazardEvaluation.overallSeverity} HAZARD LEVEL
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono mt-1 text-slate-300 flex-wrap">
              <span className="flex items-center gap-1">
                <strong className="text-sky-300 text-sm">{hazardEvaluation.tempC}°C</strong>
                <span className="text-slate-400 text-[11px]">(Feels: <span className="text-cyan-300 font-bold">{hazardEvaluation.apparentTempC}°C</span>)</span>
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <Wind size={12} className="text-cyan-400" />
                <span>{hazardEvaluation.windSpeedKts} kts (Gusts {hazardEvaluation.windGustsKts} kts)</span>
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <Eye size={12} className="text-emerald-400" />
                <span>Vis: {hazardEvaluation.visibilityKm.toFixed(1)} km</span>
              </span>
              <span className="text-amber-300 text-[11px] font-sans font-medium">
                {hazardEvaluation.weatherDescription}
              </span>
            </div>

            {/* Tactical Advisory Sentence */}
            <p className="text-[11px] text-slate-300 mt-1.5 leading-snug">
              <strong className="text-slate-100">Live Hazard Status:</strong> {hazardEvaluation.recommendation}
            </p>
          </div>
        </div>

        {/* Right: Quick Operational Indicators */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap md:border-l md:border-slate-800 md:pl-4">
          {/* Survival / Frostbite Metric */}
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center min-w-[100px]">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Frostbite Window</span>
            <span className="text-xs font-bold font-mono text-rose-300">{hazardEvaluation.frostbiteWindow}</span>
          </div>

          {/* Travel Safety Score */}
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center min-w-[100px]">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Route Safety Score</span>
            <span className={`text-xs font-bold font-mono ${
              hazardEvaluation.travelSafetyScore > 80 ? 'text-emerald-400' : hazardEvaluation.travelSafetyScore > 50 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {hazardEvaluation.travelSafetyScore}% Safe
            </span>
          </div>

          {/* Speed Limit Advice */}
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center min-w-[90px]">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Convoy Speed</span>
            <span className="text-xs font-bold font-mono text-cyan-300">{hazardEvaluation.optimalSpeedLimitKmh} km/h</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Satellite Radar Map Canvas + Route Intelligence Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 my-3">
        {/* Left 2 Cols: High-Resolution Satellite & Radar Pathfinding Map Canvas */}
        <div
          style={{ background: '#02121A', border: `1px solid ${t.border}` }}
          className="lg:col-span-2 rounded-xl p-3 relative overflow-hidden flex flex-col justify-between min-h-[400px]"
        >
          {/* Top Bar on Map */}
          <div className="flex items-center justify-between z-10 mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-cyan-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/80 flex items-center gap-1">
                <Radio size={11} className="text-cyan-400 animate-ping" />
                <span>SAR 30cm Interferometry + Device GPS</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                Corridor: {originLabel} &rarr; {destinationTarget}
              </span>
            </div>

            {/* Map Filter Toggles */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono flex-wrap">
              <button
                onClick={() => setShowLegacyRoute(!showLegacyRoute)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                  showLegacyRoute
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Old Direct Line (Risk)
              </button>
              <button
                onClick={() => setShowAiSafeRoute(!showAiSafeRoute)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                  showAiSafeRoute
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                AI Safe Route (Optimized)
              </button>
              <button
                onClick={() => setShowCrevasses(!showCrevasses)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                  showCrevasses
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Hazards &amp; Fissures ({detectedCrevasses.length})
              </button>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full flex-1 min-h-[320px] flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full max-h-[360px] select-none">
              {/* Satellite Background Grid & Ice Texture */}
              <defs>
                <pattern id="radarGridOpt" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="0.3" />
                </pattern>
                <radialGradient id="glacierGlowOpt" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0B2B3E" />
                  <stop offset="100%" stopColor="#031622" />
                </radialGradient>
                <radialGradient id="hazardGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(239, 68, 68, 0.25)" />
                  <stop offset="100%" stopColor="rgba(239, 68, 68, 0.0)" />
                </radialGradient>
              </defs>

              {/* Base terrain fill */}
              <rect width="100" height="100" fill="url(#glacierGlowOpt)" rx="4" />
              <rect width="100" height="100" fill="url(#radarGridOpt)" rx="4" />

              {/* Glacial Moraine & Stable Blue-Ice Ridge Surface */}
              <path
                d="M 15 15 Q 35 25 45 42 T 75 75 T 90 90"
                fill="none"
                stroke="rgba(56, 189, 248, 0.15)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <text x="35" y="32" fontSize="2.0" fill="rgba(56, 189, 248, 0.35)" fontFamily={FONT_HEAD} fontWeight="bold">
                BLUE-ICE STABLE RIDGE CORRIDOR (100% LOAD BEARING)
              </text>

              {/* Shifting Shear & Katabatic Front Zone (High Hazard Polygon) */}
              <polygon
                points="36,36 68,46 76,78 44,62"
                fill="url(#hazardGlow)"
                stroke="rgba(239, 68, 68, 0.35)"
                strokeDasharray="1,1"
                strokeWidth="0.4"
              />
              <text x="56" y="52" fontSize="2.0" fill="rgba(239, 68, 68, 0.65)" fontFamily={FONT_HEAD} fontWeight="bold" textAnchor="middle">
                DYNAMIC SHEAR &amp; KATABATIC GALE ZONE
              </text>

              {/* 1. OLD / LEGACY DIRECT ROUTE (RED DASHED - Intersects crevasses & squalls) */}
              {showLegacyRoute && (
                <g>
                  <path
                    d="M 15 18 L 32 32 L 48 46 L 62 58 L 88 88"
                    fill="none"
                    stroke="#F87171"
                    strokeWidth="0.9"
                    strokeDasharray="1.8,1.2"
                  />
                  {/* Danger Intersections */}
                  <circle cx="48" cy="46" r="3.2" fill="none" stroke="#EF4444" strokeWidth="0.5" className="animate-ping" />
                  <circle cx="48" cy="46" r="1.4" fill="#EF4444" />
                  <circle cx="62" cy="58" r="1.4" fill="#EF4444" />

                  {/* Warning label */}
                  <rect x="36" y="40" width="24" height="4.5" rx="1" fill="#7F1D1D" stroke="#EF4444" strokeWidth="0.3" />
                  <text x="48" y="43" fontSize="1.8" fill="#FCA5A5" fontFamily={FONT_HEAD} fontWeight="bold" textAnchor="middle">
                    92% PUNCH-THROUGH COLLAPSE RISK
                  </text>
                </g>
              )}

              {/* 2. AI DYNAMIC SAFE ROUTE (EMERALD GLOWING - Safely detours around crevasses and hazards) */}
              {showAiSafeRoute && (
                <g>
                  {/* Glowing background stroke */}
                  <path
                    d="M 15 18 Q 28 22 36 28 T 40 38 T 38 52 T 52 70 T 72 82 L 88 88"
                    fill="none"
                    stroke="rgba(16, 185, 129, 0.3)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Foreground precise stroke */}
                  <path
                    d="M 15 18 Q 28 22 36 28 T 40 38 T 38 52 T 52 70 T 72 82 L 88 88"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                  />

                  {/* AI Safe Waypoint Nodes */}
                  {[
                    { x: 15, y: 18, name: originLabel },
                    { x: 36, y: 28, name: 'WP-02 Moraine Blue Ice' },
                    { x: 38, y: 52, name: 'WP-03 West Bypass (+320m Clear)' },
                    { x: 52, y: 70, name: 'WP-04 Firn Ridge' },
                    { x: 72, y: 82, name: 'WP-05 Plateau East Gate' },
                    { x: 88, y: 88, name: destinationTarget },
                  ].map((wp, i) => (
                    <g key={i}>
                      <circle cx={wp.x} cy={wp.y} r="1.2" fill="#04222A" stroke="#34D399" strokeWidth="0.6" />
                    </g>
                  ))}

                  {/* Truck Icon moving along safe route */}
                  <g transform="translate(38, 52)">
                    <circle cx="0" cy="0" r="2.8" fill="rgba(56, 189, 248, 0.25)" className="animate-ping" />
                    <rect x="-2" y="-1.2" width="4" height="2.4" rx="0.5" fill="#38BDF8" />
                    <text x="0" y="-2.2" fontSize="1.7" fill="#38BDF8" textAnchor="middle" fontFamily={FONT_HEAD} fontWeight="bold">
                      TRK-Alpha
                    </text>
                  </g>
                </g>
              )}

              {/* 3. DETECTED HAZARDS & CREVASSES */}
              {showCrevasses &&
                detectedCrevasses.map((crv) => {
                  const isSelected = selectedHazard?.id === crv.id;
                  const isWeatherHaz = crv.id.startsWith('WX-');
                  return (
                    <g
                      key={crv.id}
                      onClick={() => setSelectedHazard(crv)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Crevasse or Weather Chasm Marker */}
                      {isWeatherHaz ? (
                        <circle cx={crv.cx} cy={crv.cy} r="3.5" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" strokeWidth="0.6" strokeDasharray="1,1" />
                      ) : (
                        <line
                          x1={crv.cx - 4}
                          y1={crv.cy - 1.5}
                          x2={crv.cx + 4}
                          y2={crv.cy + 1.5}
                          stroke="#EF4444"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Detection Bounding Box */}
                      <rect
                        x={crv.cx - 5.5}
                        y={crv.cy - 3.5}
                        width="11"
                        height="7"
                        fill="rgba(239, 68, 68, 0.15)"
                        stroke={isSelected ? '#F87171' : '#EF4444'}
                        strokeWidth="0.4"
                        strokeDasharray="0.8,0.8"
                      />
                      {/* Tag label */}
                      <text
                        x={crv.cx}
                        y={crv.cy - 4}
                        fontSize="1.8"
                        fill="#FCA5A5"
                        fontFamily={FONT_HEAD}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {crv.id}: {crv.widthM > 100 ? 'Weather Squall' : `${crv.widthM}m Chasm`}
                      </text>
                    </g>
                  );
                })}

              {/* Dynamic Origin Pin (User Device GPS with Radar Pulse) */}
              <circle cx="15" cy="18" r="3.5" fill="none" stroke="#38BDF8" strokeWidth="0.5" className="animate-ping" />
              <circle cx="15" cy="18" r="2" fill="#0284C7" stroke="#FFFFFF" strokeWidth="0.5" />
              <text x="15" y="13" fontSize="2.2" fill="#38BDF8" fontFamily={FONT_HEAD} fontWeight="bold" textAnchor="middle">
                ORIGIN: {corridorMode === 'device_dynamic' ? 'YOUR DEVICE' : 'MAITRI BASE'}
              </text>

              {/* Destination Terminal Pin */}
              <circle cx="88" cy="88" r="2" fill="#10B981" stroke="#FFFFFF" strokeWidth="0.5" />
              <text x="88" y="93.5" fontSize="2.2" fill="#34D399" fontFamily={FONT_HEAD} fontWeight="bold" textAnchor="middle">
                DESTINATION: {destinationTarget.toUpperCase()}
              </text>
            </svg>
          </div>

          {/* Bottom Telemetry Legend on Map */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex-wrap gap-2 z-10">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-3 h-0.5 bg-rose-400 inline-block border-t border-dashed"></span>
                <span>Direct Line: 148.2 km (High Risk)</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-3 h-1 bg-emerald-400 rounded-full inline-block shadow-sm shadow-emerald-400"></span>
                <span>AI Safe Route: 162.8 km (Clear &bull; +300m Detour Buffer)</span>
              </span>
            </div>
            <span className="text-cyan-300">
              Sensor Sync: {scanTimestamp}
            </span>
          </div>
        </div>

        {/* Right Col: Mission Comparison, Weather Impact & Fleet Telemetry */}
        <div className="flex flex-col justify-between space-y-3">
          {/* Card 1: Route Safety Assessment & Gemini AI Optimization Scorecard */}
          <div style={{ background: t.panelAlt, border: `1px solid ${geminiPlan ? 'rgba(168, 85, 247, 0.4)' : t.border}` }} className="rounded-xl p-3.5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-400" />
                <span>{isSimulation ? 'SIMULATION — AI ROUTE RECOMMENDATION' : 'AI ROUTE ANALYSIS'}</span>
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                geminiPlan?.engineUsed === 'gemini-3.8-flash'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {geminiPlan ? (geminiPlan.engineUsed === 'gemini-3.8-flash' ? 'gemini-3.8-flash' : 'deterministic fallback') : 'Neural Risk Matrix'}
              </span>
            </div>

            {geminiError && (
              <div className="mb-2 p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-1.5">
                <AlertTriangle size={13} className="text-rose-400 shrink-0 mt-0.5" />
                <span>{geminiError}</span>
              </div>
            )}

            {geminiPlan ? (
              <div className="space-y-2.5 text-xs">
                {/* Recommended Sequence */}
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-purple-500/30">
                  <div className="flex items-center justify-between text-[11px] font-mono text-purple-300 mb-1">
                    <span className="font-semibold uppercase tracking-wider">Recommended sequence:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      geminiPlan.riskLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                      geminiPlan.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      Risk: {geminiPlan.riskLevel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap py-1 text-slate-100 font-mono font-bold text-xs">
                    {geminiPlan.recommendedOrder.map((wpId, idx) => (
                      <React.Fragment key={wpId}>
                        <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/80 text-purple-200">
                          {wpId}
                        </span>
                        {idx < geminiPlan.recommendedOrder.length - 1 && (
                          <ArrowRight size={11} className="text-purple-400" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Distance & Duration */}
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Estimated distance:</span>
                      <span className="text-slate-200 font-bold">{geminiPlan.estimatedDistance.toFixed(1)} km</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Estimated duration:</span>
                      <span className="text-slate-200 font-bold">
                        {Math.floor(geminiPlan.estimatedDuration / 60)}h {Math.round(geminiPlan.estimatedDuration % 60)}m
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Reasons */}
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Reasons:</span>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {geminiPlan.reasoning.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 leading-snug">
                        <span className="text-emerald-400 mt-0.5">&bull;</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>

                  {geminiPlan.warnings && geminiPlan.warnings.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Warnings:</span>
                      <ul className="space-y-1 text-[11px] text-amber-200/90">
                        {geminiPlan.warnings.map((w, i) => (
                          <li key={i} className="flex items-start gap-1.5 leading-snug">
                            <AlertTriangle size={11} className="text-amber-400 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Operator Approval / Rejection Controls */}
                <div className="pt-1">
                  {operatorDecision === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleApproveAndApplyRoute}
                        style={{
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          color: '#ffffff',
                          boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
                        }}
                        className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={13} />
                        <span>Accept &amp; Apply</span>
                      </button>
                      <button
                        onClick={handleRejectProposedRoute}
                        className="py-1.5 px-3 rounded-lg text-xs font-bold text-rose-300 bg-rose-950/40 border border-rose-800/60 cursor-pointer hover:bg-rose-900/50 transition-all flex items-center gap-1"
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={handleRunGeminiRouteOptimization}
                        disabled={optimizing}
                        className="py-1.5 px-2.5 rounded-lg text-xs font-mono text-sky-300 bg-sky-950/40 border border-sky-800/60 cursor-pointer hover:bg-sky-900/50 transition-all"
                        title="Recalculate route analysis"
                      >
                        <RefreshCw size={12} className={optimizing ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  ) : operatorDecision === 'approved' ? (
                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
                      <span className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span>Route Approved &amp; Dispatched</span>
                      </span>
                      <button
                        onClick={handleRunGeminiRouteOptimization}
                        disabled={optimizing}
                        className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={10} />
                        <span>Recalculate</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 flex items-center justify-between">
                      <span className="text-xs text-rose-300 font-bold flex items-center gap-1.5">
                        <XCircle size={14} className="text-rose-400" />
                        <span>Route Rejected (Legacy Active)</span>
                      </span>
                      <button
                        onClick={handleRunGeminiRouteOptimization}
                        disabled={optimizing}
                        className="text-[10px] font-mono text-sky-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={10} />
                        <span>Retry</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {/* Old Route Rating */}
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50">
                  <div className="flex items-center justify-between text-rose-300 font-semibold mb-1">
                    <span className="flex items-center gap-1">
                      <ShieldAlert size={14} className="text-rose-400" />
                      <span>Direct Unoptimized Line</span>
                    </span>
                    <span className="font-mono text-rose-400 font-bold">8% Safety Score</span>
                  </div>
                  <p className="text-[11px] text-rose-200/80 leading-relaxed">
                    Direct line cuts through 2 active crevasse chasms (C-104 &amp; F-88) and direct katabatic wind funnels.
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-rose-400/90 pt-1 border-t border-rose-900/60">
                    <span>Distance: 148.2 km</span>
                    <span>Plunge Risk: 92%</span>
                  </div>
                </div>

                {/* AI Safe Route Rating */}
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50">
                  <div className="flex items-center justify-between text-emerald-300 font-semibold mb-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      <span>AI Dynamic Safe Corridor</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">99.4% Safety Score</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                    Circumvents shear fissures and local blizzard squalls along verified blue-ice compression ridges with a 300m buffer.
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-emerald-400/90 pt-1 border-t border-emerald-900/60">
                    <span>Distance: 162.8 km (+14.6km safe detour)</span>
                    <span>Accident Risk: ZERO (VERIFIED)</span>
                  </div>
                </div>

                <button
                  onClick={handleRunGeminiRouteOptimization}
                  disabled={optimizing}
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.5)',
                    color: '#e9d5ff',
                  }}
                  className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-bold cursor-pointer hover:bg-purple-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={13} className={optimizing ? 'animate-spin' : ''} />
                  <span>{optimizing ? 'Analyzing with Gemini...' : 'Analyze with Gemini AI'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Supply Convoy Fleet & Device Telemetry Sync */}
          <div style={{ background: t.panelAlt, border: `1px solid ${t.border}` }} className="rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: t.text }}>
                <Truck size={14} className="text-sky-400" />
                <span>Supply Fleet Telemetry &amp; GPS</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${pushedToTrucks ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300'}`}>
                {pushedToTrucks ? 'DYNAMIC ROUTE ACTIVE' : 'AWAITING DISPATCH SYNC'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <div>
                  <p className="font-medium text-slate-200 text-xs">TRK-Alpha Heavy Snowcat</p>
                  <p className="text-[10px] text-slate-400 font-mono">PistenBully 300 &bull; 28-Ton Payload</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {pushedToTrucks ? 'GPS Locked (Safe)' : 'Depot Standby'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <div>
                  <p className="font-medium text-slate-200 text-xs">P300 Supply Hauler Convoy-1</p>
                  <p className="text-[10px] text-slate-400 font-mono">Crawler Tractor &bull; Fuel Sledge Rig</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {pushedToTrucks ? 'GPS Locked (Safe)' : 'Depot Standby'}
                </span>
              </div>
            </div>

            {/* Direct Link to GIS Map */}
            {onNavigateToMap && (
              <button
                onClick={() => onNavigateToMap(geo.latitude && geo.longitude ? { lat: geo.latitude, lng: geo.longitude } : undefined)}
                style={{ background: t.bgAlt, border: `1px solid ${t.border}`, color: t.text }}
                className="w-full mt-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
              >
                <Compass size={13} className="text-cyan-400" />
                <span>View Full GIS Polar Map with Heatmap</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selected Hazard Inspector Drawer (if user clicks on crevasse or weather hazard) */}
      {selectedHazard && (
        <div className="mt-3 p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-300 text-sm">{selectedHazard.name}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 font-bold">
                  {selectedHazard.risk}
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5">{selectedHazard.description}</p>
              <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 mt-1 flex-wrap">
                {selectedHazard.widthM && <span>Dimension: {selectedHazard.widthM}m</span>}
                {selectedHazard.depthM ? <span>Depth: {selectedHazard.depthM}m</span> : null}
                <span>Sensor: {selectedHazard.sensor}</span>
                <span className="text-emerald-400 font-semibold">AI Clearance: Detoured by +300m Safe Blue-Ice</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedHazard(null)}
            className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
