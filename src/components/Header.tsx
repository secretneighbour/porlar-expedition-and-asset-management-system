import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Radio, 
  ShieldAlert, 
  Clock, 
  RotateCcw,
  AlertTriangle,
  Smartphone,
  Laptop,
  Wifi,
  WifiOff,
  Key,
  Sparkles,
  CloudSnow,
  Wind,
  LocateFixed
} from 'lucide-react';
import { PolarRegion, ConditionLevel, RealtimeWeatherReading } from '../types';
import { SyncConnectionStatus } from '../hooks/usePolarSync';

interface HeaderProps {
  currentRegion: PolarRegion;
  onSelectRegion: (region: PolarRegion) => void;
  conditionLevel: ConditionLevel;
  onChangeCondition: (level: ConditionLevel) => void;
  onOpenDistressModal: () => void;
  onOpenPairingModal?: () => void;
  onOpenApiKeyModal?: () => void;
  hasCustomGmaps?: boolean;
  hasCustomGemini?: boolean;
  weatherTicker?: string;
  userLocationWeather?: RealtimeWeatherReading | null;
  userCityName?: string | null;
  onAcquireGps?: () => Promise<any>;
  onResetData: () => void;
  activeExpeditionsCount: number;
  activeAssetsCount: number;
  alertsCount: number;
  syncStatus: SyncConnectionStatus;
  connectedClients: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRegion,
  onSelectRegion,
  conditionLevel,
  onChangeCondition,
  onOpenDistressModal,
  onOpenPairingModal,
  onOpenApiKeyModal,
  hasCustomGmaps = false,
  hasCustomGemini = false,
  weatherTicker,
  userLocationWeather,
  userCityName,
  onAcquireGps,
  onResetData,
  activeExpeditionsCount,
  activeAssetsCount,
  alertsCount,
  syncStatus,
  connectedClients,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [julianDay, setJulianDay] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utc = now.toUTCString().replace('GMT', 'UTC');
      setUtcTime(utc);

      const start = new Date(now.getUTCFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const day = Math.floor(diff / oneDay);
      setJulianDay(`JD ${day}.${Math.floor((now.getUTCHours() * 60 + now.getUTCMinutes()) / 14.4)}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getConditionBadge = () => {
    switch (conditionLevel) {
      case 'COND-1_SEVERE_BLIZZARD':
        return {
          label: 'CONDITION 1 - SEVERE BLIZZARD',
          desc: 'ZERO VISIBILITY / OUTSIDE TRAVEL BANNED',
          badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-600 animate-pulse',
        };
      case 'COND-2_CAUTION':
        return {
          label: 'CONDITION 2 - HIGH CAUTION',
          desc: 'RESTRICTED TRAVEL / WINDS > 40 KTS',
          badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-500',
        };
      case 'COND-3_NORMAL':
      default:
        return {
          label: 'CONDITION 3 - NORMAL OPS',
          desc: 'STANDARD SURFACE & AIR MOBILITY',
          badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-600',
        };
    }
  };

  const cond = getConditionBadge();

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          
          {/* System Title & Real-Time Sync Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-950/80 border border-sky-600/60 flex items-center justify-center text-sky-400 shrink-0">
              <Compass className="w-6 h-6 animate-[spin_40s_linear_infinite]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs tracking-widest text-sky-400 uppercase font-semibold">
                  POLAR OPS WORKSTATION
                </span>
                
                {/* Live Sync Node Pill (Clickable to open pairing modal) */}
                <button
                  type="button"
                  onClick={onOpenPairingModal}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer hover:opacity-90 ${
                    syncStatus === 'connected'
                      ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300 hover:border-emerald-400'
                      : syncStatus === 'connecting'
                      ? 'bg-amber-950/60 border-amber-600/60 text-amber-300'
                      : 'bg-rose-950/60 border-rose-600/60 text-rose-300'
                  }`}
                  title="Click to view connected terminals roster or pair your phone via QR code"
                >
                  {syncStatus === 'connected' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <Wifi className="w-3 h-3 text-emerald-400" />
                      <span>LIVE SYNC: {connectedClients} {connectedClients === 1 ? 'NODE' : 'NODES'} ONLINE</span>
                      <span className="hidden sm:inline text-[9px] text-emerald-400/70 border-l border-emerald-700/60 pl-1 ml-0.5">PAIR PHONE</span>
                    </>
                  ) : syncStatus === 'connecting' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      <span>CONNECTING BASE SERVER...</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-rose-400" />
                      <span>OFFLINE (CACHED)</span>
                    </>
                  )}
                </button>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-display">
                POLAR EXPEDITION & ASSET MANAGEMENT SYSTEM
              </h1>
            </div>
          </div>

          {/* UTC Clock & Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto justify-between lg:justify-end">
            
            {/* UTC Clock & Julian Day */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>{utcTime || 'SYNCHRONIZING UTC...'}</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400">{julianDay}</span>
            </div>

            {/* Region Selector */}
            <div className="inline-flex rounded-md p-0.5 bg-slate-900 border border-slate-800">
              <button
                id="region-antarctica-btn"
                type="button"
                onClick={() => onSelectRegion('antarctica')}
                className={`px-3 py-1 text-xs font-semibold rounded tracking-wide transition-all ${
                  currentRegion === 'antarctica'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ANTARCTICA
              </button>
              <button
                id="region-arctic-btn"
                type="button"
                onClick={() => onSelectRegion('arctic')}
                className={`px-3 py-1 text-xs font-semibold rounded tracking-wide transition-all ${
                  currentRegion === 'arctic'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ARCTIC
              </button>
            </div>

            {/* Pair Phone Button */}
            {onOpenPairingModal && (
              <button
                id="pair-phone-btn"
                type="button"
                onClick={onOpenPairingModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 text-xs font-semibold tracking-wider transition-colors shadow-sm"
                title="Scan QR code to connect your mobile phone as a remote field beacon"
              >
                <Smartphone className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span className="hidden sm:inline">PAIR PHONE</span>
                <span className="px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-bold">
                  {connectedClients}
                </span>
              </button>
            )}

            {/* API Keys Configuration Button */}
            {onOpenApiKeyModal && (
              <button
                id="api-keys-config-btn"
                type="button"
                onClick={onOpenApiKeyModal}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-semibold tracking-wider transition-colors shadow-sm ${
                  hasCustomGmaps || hasCustomGemini
                    ? 'bg-sky-950/80 hover:bg-sky-900/90 text-sky-200 border-sky-600/80 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title="Configure Google Maps Platform & Gemini AI API Keys"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">API KEYS</span>
                {(hasCustomGmaps || hasCustomGemini) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Custom API Keys Active" />
                )}
              </button>
            )}

            {/* Emergency Distress Protocol Trigger */}
            <button
              id="sos-distress-btn"
              type="button"
              onClick={onOpenDistressModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold tracking-wider uppercase transition-colors shadow-lg shadow-rose-950/50 border border-rose-400/40"
              title="Broadcast Mayday Distress Signal across all connected laptops and phones"
            >
              <ShieldAlert className="w-4 h-4 animate-bounce" />
              <Smartphone className="w-3.5 h-3.5 hidden sm:inline" />
              <span>TRANSMIT DISTRESS</span>
            </button>

            {/* Reset data */}
            <button
              id="reset-manifest-btn"
              type="button"
              onClick={onResetData}
              title="Reset to official polar manifest defaults"
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Operational Status Sub-Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-900/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Condition Level Dropdown / Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 uppercase text-[11px]">BASE DEFCON:</span>
            <div className={`px-2.5 py-1 rounded border flex items-center gap-2 ${cond.badgeClass}`}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold tracking-wide">{cond.label}</span>
              <span className="hidden md:inline text-[10px] opacity-80">({cond.desc})</span>
            </div>
            <select
              value={conditionLevel}
              onChange={(e) => onChangeCondition(e.target.value as ConditionLevel)}
              aria-label="Set base condition status"
              className="bg-slate-900 text-slate-300 border border-slate-700 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="COND-3_NORMAL">Set: Condition 3 (Normal Ops)</option>
              <option value="COND-2_CAUTION">Set: Condition 2 (High Caution)</option>
              <option value="COND-1_SEVERE_BLIZZARD">Set: Condition 1 (Blizzard Lock)</option>
            </select>
          </div>

          {/* Quick Metrics & Live Weather Ticker */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            {userLocationWeather && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/80 text-emerald-200 font-mono shadow-sm"
                title={`Real-time meteorological conditions at ${userCityName || userLocationWeather.locationName}: ${userLocationWeather.weatherDescription}, Wind: ${userLocationWeather.windSpeedKts} kts, Baro: ${userLocationWeather.pressureHpa} hPa`}
              >
                <LocateFixed className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span className="font-bold text-[10px] text-white uppercase tracking-wider">
                  {userCityName ? userCityName.split(',')[0] : userLocationWeather.locationName.split(' ')[0]}:
                </span>
                <span className="font-extrabold text-emerald-300">{userLocationWeather.tempC}°C</span>
                <span className="text-slate-300 text-[10px] hidden sm:inline">
                  ({userLocationWeather.weatherDescription} • {userLocationWeather.windSpeedKts}kt)
                </span>
              </div>
            )}

            {weatherTicker && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800/80 text-sky-300 font-mono">
                <CloudSnow className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span className="font-bold text-[10px] text-sky-200">POLAR AWOS:</span>
                <span>{weatherTicker}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span>EXPEDITIONS:</span>
              <span className="text-white font-bold">{activeExpeditionsCount} ACTIVE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>DEPLOYED ASSETS:</span>
              <span className="text-white font-bold">{activeAssetsCount} IN FIELD</span>
            </div>
            {alertsCount > 0 && (
              <div className="flex items-center gap-1.5 text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                <AlertTriangle className="w-3 h-3" />
                <span>{alertsCount} LOGISTICS ALERTS</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
