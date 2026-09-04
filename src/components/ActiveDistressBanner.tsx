import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Radio, 
  MapPin, 
  Volume2, 
  VolumeX, 
  Crosshair, 
  CheckCircle2, 
  ShieldAlert,
  Send,
  Truck
} from 'lucide-react';
import { ActiveDistressAlert, PolarAsset } from '../types';

interface ActiveDistressBannerProps {
  distress: ActiveDistressAlert;
  assets: PolarAsset[];
  isMuted: boolean;
  onToggleMute: () => void;
  onAcknowledge: (data: { acknowledgedBy: string; dispatchedSARAssetId?: string; dispatchedSARName?: string }) => void;
  onResolve: () => void;
  onLocateOnMap?: (lat: number, lng: number) => void;
}

export const ActiveDistressBanner: React.FC<ActiveDistressBannerProps> = ({
  distress,
  assets,
  isMuted,
  onToggleMute,
  onAcknowledge,
  onResolve,
  onLocateOnMap,
}) => {
  const [showAcknowledgeForm, setShowAcknowledgeForm] = useState(false);
  const [dispatcherName, setDispatcherName] = useState('Operations Desk Lead');
  
  // Find SAR capable assets
  const sarAssets = assets.filter((a) => a.category === 'emergency_sar' || a.category === 'aviation' || a.status === 'operational');
  const [selectedSarId, setSelectedSarId] = useState(sarAssets[0]?.id || '');

  // Parse coords if available
  const handleLocate = () => {
    if (distress.targetLat && distress.targetLng && onLocateOnMap) {
      onLocateOnMap(distress.targetLat, distress.targetLng);
    } else if (distress.coordinates && onLocateOnMap) {
      const parts = distress.coordinates.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        onLocateOnMap(parts[0], parts[1]);
      }
    }
  };

  const handleConfirmAcknowledge = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenAsset = assets.find((a) => a.id === selectedSarId);
    onAcknowledge({
      acknowledgedBy: dispatcherName.trim() || 'HQ Director',
      dispatchedSARAssetId: chosenAsset?.id,
      dispatchedSARName: chosenAsset ? `${chosenAsset.code} (${chosenAsset.name})` : 'Rapid Response Team Alpha',
    });
    setShowAcknowledgeForm(false);
  };

  const isAcknowledged = distress.acknowledgedByHQ;

  return (
    <div
      id="distress-active-banner"
      className={`w-full rounded-xl border p-4 font-mono transition-all shadow-2xl ${
        isAcknowledged
          ? 'bg-amber-950/40 border-amber-600/80 text-amber-100'
          : 'bg-rose-950/80 border-rose-600 text-rose-100 animate-pulse-border'
      }`}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Left header & title */}
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-lg flex items-center justify-center shrink-0 ${
              isAcknowledged ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white animate-bounce'
            }`}
          >
            {isAcknowledged ? <CheckCircle2 className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${
                  isAcknowledged ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' : 'bg-rose-600 text-white'
                }`}
              >
                {isAcknowledged ? 'STATUS: ACKNOWLEDGED BY HQ (SAR IN TRANSIT)' : '🚨 LIVE FIELD MAYDAY BEACON ACTIVE'}
              </span>
              <span className="text-xs text-slate-300">
                Source: <span className="font-bold text-white">{distress.reportedByDevice}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                ({new Date(distress.timestamp).toLocaleTimeString()})
              </span>
            </div>

            <h3 className="text-base font-bold text-white tracking-wide mt-1">
              {distress.incidentType} — {distress.location}
            </h3>

            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
              <span className="text-rose-400 font-bold">REPORT: </span>
              {distress.summary}
            </p>
          </div>
        </div>

        {/* Action button bar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
          <button
            type="button"
            onClick={onToggleMute}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 transition-colors"
            title={isMuted ? 'Unmute siren' : 'Mute siren'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />}
            <span>{isMuted ? 'MUTED' : 'ALARM ON'}</span>
          </button>

          {onLocateOnMap && (
            <button
              type="button"
              onClick={handleLocate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-sky-400 hover:text-sky-300 text-xs border border-slate-700 transition-colors"
            >
              <Crosshair className="w-4 h-4" />
              <span>RADAR LOCK</span>
            </button>
          )}

          {!isAcknowledged ? (
            <button
              type="button"
              onClick={() => setShowAcknowledgeForm(!showAcknowledgeForm)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/50 transition-colors border border-rose-400"
            >
              <Radio className="w-4 h-4 animate-spin" />
              <span>ACKNOWLEDGE & SCRAMBLE SAR</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onResolve}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow transition-colors border border-emerald-400"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>FIELD PARTY SAFE (STAND DOWN)</span>
            </button>
          )}
        </div>
      </div>

      {/* Telemetry info row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/10 text-[11px]">
        <div>
          <span className="text-slate-400 block text-[10px]">COORDINATES:</span>
          <span className="font-bold text-white flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-400" />
            {distress.coordinates}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">CALLSIGN / REPORTER:</span>
          <span className="font-bold text-white">{distress.reporterCallsign}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">CURRENT HQ STATUS:</span>
          <span className={`font-bold ${isAcknowledged ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isAcknowledged ? 'SAR En Route' : 'Awaiting Laptop Dispatch'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">ASSIGNED SAR RESCUE:</span>
          <span className="font-bold text-amber-300 truncate block">
            {distress.dispatchedSARName || 'Pending HQ Assignment'}
          </span>
        </div>
      </div>

      {/* Scramble SAR Dispatcher Form (Dropdown) */}
      {showAcknowledgeForm && !isAcknowledged && (
        <form
          onSubmit={handleConfirmAcknowledge}
          className="mt-3 p-3 bg-slate-900/90 border border-slate-700 rounded-lg text-xs space-y-3 animate-fade-in"
        >
          <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
            <Truck className="w-4 h-4" />
            <span>DISPATCH RESCUE MISSION TO FIELD OPERATOR PHONE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">
                DISPATCHER / HQ DIRECTOR SIGN-OFF:
              </label>
              <input
                type="text"
                required
                value={dispatcherName}
                onChange={(e) => setDispatcherName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">
                DEPLOY RAPID RESPONSE / AVIATION ASSET:
              </label>
              <select
                value={selectedSarId}
                onChange={(e) => setSelectedSarId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-rose-500"
              >
                {sarAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.code} — {asset.name} ({asset.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAcknowledgeForm(false)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors flex items-center gap-1.5 border border-rose-400"
            >
              <Send className="w-3.5 h-3.5" />
              <span>TRANSMIT CONFIRMATION TO FIELD PHONE</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
