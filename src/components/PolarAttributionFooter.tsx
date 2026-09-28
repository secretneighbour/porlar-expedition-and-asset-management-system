import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Info, 
  Database, 
  Satellite, 
  X, 
  CheckCircle2, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { AddCacheStatus, ADD_ATTRIBUTION_TEXT, ADD_DISCLAIMER_TEXT } from '../utils/addFeatureService';
import { PolarGnssTelemetry } from '../hooks/useDynamicTracking';

interface PolarAttributionFooterProps {
  cacheStatus?: AddCacheStatus;
  gnssTelemetry?: PolarGnssTelemetry;
  isWarningDismissed?: boolean;
  onDismissWarning?: () => void;
  className?: string;
}

export const PolarAttributionFooter: React.FC<PolarAttributionFooterProps> = ({
  cacheStatus,
  gnssTelemetry,
  isWarningDismissed = false,
  onDismissWarning,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showGnssDetails, setShowGnssDetails] = useState(false);

  return (
    <div className={`pointer-events-auto flex flex-col items-end gap-1.5 ${className}`}>
      {/* Polar GNSS Geometry Warning Badge (Dismissible) */}
      {!isWarningDismissed && (
        <div 
          className="flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-mono border backdrop-blur-md transition-all duration-200 shadow-lg cursor-pointer bg-amber-950/80 border-amber-500/50 text-amber-200 hover:bg-amber-900/90"
          onClick={() => setShowGnssDetails(!showGnssDetails)}
          title="Click to view Polar GNSS satellite geometry & dilution of precision"
        >
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span className="font-semibold tracking-wide">⚠ Polar GNSS:</span>
            <span className="hidden sm:inline text-amber-300/90">Vertical accuracy reduced; horizontal geometry dispersed.</span>
            <span className="sm:hidden text-amber-300/90">Geometry Dispersed</span>
          </div>

          {gnssTelemetry && (
            <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-amber-500/40 text-[10px]">
              <span className="text-slate-400">HDOP:</span>
              <span className="font-bold text-cyan-300">{gnssTelemetry.hdop.toFixed(1)}</span>
              <span className="text-slate-400 ml-1">VDOP:</span>
              <span className="font-bold text-amber-300">{gnssTelemetry.vdop.toFixed(1)}</span>
              <span className={`px-1 rounded text-[9px] font-bold ${
                gnssTelemetry.gpsQuality === 'GOOD' 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                  : gnssTelemetry.gpsQuality === 'MODERATE' 
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40' 
                  : 'bg-red-950 text-red-300 border border-red-500/40'
              }`}>
                {gnssTelemetry.gpsQuality}
              </span>
            </div>
          )}

          {onDismissWarning && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismissWarning();
              }}
              className="ml-1 p-0.5 text-amber-400/80 hover:text-white rounded hover:bg-amber-800/50 transition-colors"
              title="Dismiss warning"
              aria-label="Dismiss Polar GNSS warning"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Expanded GNSS Telemetry Details Modal / Card */}
      {showGnssDetails && gnssTelemetry && (
        <div className="bg-slate-950/95 border border-amber-500/40 rounded-lg p-3 text-xs font-mono text-slate-300 max-w-sm backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Satellite className="w-3.5 h-3.5" />
              <span>POLAR ORBIT GEOMETRY TELEMETRY</span>
            </div>
            <button 
              onClick={() => setShowGnssDetails(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
            GPS orbits (~55° inclination) limit satellites to low horizons (0°–45° elevation) at high polar latitudes.
            Vertical dilution of precision (VDOP) is elevated; 2D Kalman smoothing filter is active to eliminate tracker jitter.
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-900/80 p-2 rounded border border-slate-800">
            <div>
              <span className="text-slate-400">QUALITY:</span>{' '}
              <span className="font-bold text-cyan-300">{gnssTelemetry.gpsQuality}</span>
            </div>
            <div>
              <span className="text-slate-400">SATELLITES:</span>{' '}
              <span className="font-bold text-emerald-300">{gnssTelemetry.satellites} Locked</span>
            </div>
            <div>
              <span className="text-slate-400">HDOP (HORIZ):</span>{' '}
              <span className="font-bold text-cyan-300">{gnssTelemetry.hdop.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400">VDOP (VERT):</span>{' '}
              <span className="font-bold text-amber-400">{gnssTelemetry.vdop.toFixed(2)} (Elevated)</span>
            </div>
            <div>
              <span className="text-slate-400">SAT ELEVATION:</span>{' '}
              <span className="font-bold text-slate-200">{gnssTelemetry.elevationMinDeg}° - {gnssTelemetry.elevationMaxDeg}°</span>
            </div>
            <div>
              <span className="text-slate-400">KALMAN FILTER:</span>{' '}
              <span className="font-bold text-emerald-400">ACTIVE (60 FPS)</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar: ADD Attribution + Offline Cache Indicator */}
      <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-950/85 border border-cyan-500/20 backdrop-blur-md text-[10px] font-mono text-slate-400 shadow-md">
        {/* Offline Cache Indicator */}
        {cacheStatus && (
          <div className="flex items-center gap-1 pr-2 border-r border-slate-800">
            <span className={`w-1.5 h-1.5 rounded-full ${
              cacheStatus.source === 'arcgis_rest' 
                ? 'bg-cyan-400 shadow-[0_0_6px_rgba(0,255,255,0.8)]' 
                : cacheStatus.source === 'local_cache'
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                : 'bg-amber-400'
            }`} />
            <span className="font-semibold text-slate-300">
              {cacheStatus.source === 'arcgis_rest' ? 'ADD REST LIVE' : 'OFFLINE CACHE'}
            </span>
            <span className="text-slate-500 text-[9px]">
              ({cacheStatus.featureCount.toLocaleString()} fts)
            </span>
          </div>
        )}

        {/* Persistent SCAR ADD Attribution Line */}
        <div 
          className="relative flex items-center gap-1 cursor-pointer hover:text-cyan-300 transition-colors"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(!showTooltip)}
        >
          <Info className="w-3 h-3 text-cyan-400" />
          <span>{ADD_ATTRIBUTION_TEXT}</span>

          {/* Hover Tooltip: Accuracy Disclaimer */}
          {showTooltip && (
            <div className="absolute bottom-full right-0 mb-1.5 w-64 p-2 bg-slate-900 border border-cyan-500/40 rounded shadow-xl text-[10px] text-slate-300 leading-tight z-50 pointer-events-none">
              <div className="font-bold text-cyan-400 mb-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                SCAR ADD v7.4 Vector Layers
              </div>
              <p className="text-slate-300">{ADD_DISCLAIMER_TEXT}</p>
              <div className="mt-1 text-[9px] text-slate-500">
                Medium resolution coastline, grounding lines & scientific research bases.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
