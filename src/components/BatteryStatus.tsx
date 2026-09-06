import React from 'react';
import {
  Battery,
  BatteryCharging,
  BatteryWarning,
  BatteryMedium,
  BatteryLow,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ThermometerSnowflake,
  TrendingDown,
  Activity,
  Sparkles,
} from 'lucide-react';
import { AssetStatus } from '../types';

export interface BatteryStatusProps {
  batteryPercent: number; // 0 - 100
  status?: AssetStatus;
  fuelType?: string;
  engineHealthPercent?: number; // 0 - 100
  tempC?: number;
  compact?: boolean;
  showHealthDetails?: boolean;
  className?: string;
}

export type BatteryHealthState = 'EXCELLENT' | 'NOMINAL' | 'DEGRADED' | 'CRITICAL';

export const calculateBatteryHealth = (
  batteryPercent: number,
  engineHealthPercent: number = 90,
  tempC: number = -25
): {
  healthState: BatteryHealthState;
  healthPercent: number;
  label: string;
  color: string;
  borderColor: string;
  bgColor: string;
  icon: React.ReactNode;
} => {
  // Cold temperatures (< -40°C) and low battery decrease effective health calculation
  let coldPenalty = 0;
  if (tempC < -50) coldPenalty = 20;
  else if (tempC < -30) coldPenalty = 10;
  else if (tempC < -15) coldPenalty = 5;

  const rawHealth = Math.max(10, Math.min(100, Math.round(engineHealthPercent - coldPenalty)));

  if (batteryPercent < 15 || rawHealth < 40) {
    return {
      healthState: 'CRITICAL',
      healthPercent: Math.min(rawHealth, 38),
      label: 'CRITICAL / COLD LOSS',
      color: 'text-rose-400',
      borderColor: 'border-rose-700/60',
      bgColor: 'bg-rose-950/40',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />,
    };
  }

  if (batteryPercent < 35 || rawHealth < 65) {
    return {
      healthState: 'DEGRADED',
      healthPercent: rawHealth,
      label: 'DEGRADED / COLD WEAR',
      color: 'text-amber-400',
      borderColor: 'border-amber-700/60',
      bgColor: 'bg-amber-950/40',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    };
  }

  if (rawHealth >= 88 && batteryPercent >= 70) {
    return {
      healthState: 'EXCELLENT',
      healthPercent: rawHealth,
      label: 'OPTIMAL (ARCTIC RATED)',
      color: 'text-emerald-400',
      borderColor: 'border-emerald-700/60',
      bgColor: 'bg-emerald-950/40',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    };
  }

  return {
    healthState: 'NOMINAL',
    healthPercent: rawHealth,
    label: 'NOMINAL CELLS',
    color: 'text-sky-400',
    borderColor: 'border-sky-700/60',
    bgColor: 'bg-sky-950/40',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />,
  };
};

export const getDrainRateInfo = (status?: AssetStatus | string): {
  label: string;
  rateText: string;
  color: string;
  icon: React.ReactNode;
} => {
  switch (status) {
    case 'in_transit':
      return {
        label: 'TRAVERSE LOAD DRAIN',
        rateText: '~3.5%/min (Engines & Heaters)',
        color: 'text-rose-400',
        icon: <TrendingDown className="w-3 h-3 text-rose-400 animate-pulse" />,
      };
    case 'operational':
      return {
        label: 'ACTIVE FIELD DRAIN',
        rateText: '~1.8%/min (Radio & Sensors)',
        color: 'text-amber-400',
        icon: <Zap className="w-3 h-3 text-amber-400" />,
      };
    case 'cold_soaked':
      return {
        label: 'PARASITIC SUB-ZERO DRAIN',
        rateText: '~0.8%/min (Thermal Loss)',
        color: 'text-indigo-400',
        icon: <ThermometerSnowflake className="w-3 h-3 text-indigo-400" />,
      };
    case 'maintenance':
      return {
        label: 'DEPOT CHARGE/SERVICE',
        rateText: '+2.0%/min (Generator Dock)',
        color: 'text-emerald-400',
        icon: <BatteryCharging className="w-3 h-3 text-emerald-400 animate-bounce" />,
      };
    case 'standby':
    default:
      return {
        label: 'STANDBY PARASITIC',
        rateText: '~0.3%/min (Idle)',
        color: 'text-slate-400',
        icon: <Activity className="w-3 h-3 text-slate-400" />,
      };
  }
};

export const BatteryStatus: React.FC<BatteryStatusProps> = ({
  batteryPercent,
  status = 'operational',
  fuelType = 'Lithium-Cold Solid',
  engineHealthPercent = 92,
  tempC = -25,
  compact = false,
  showHealthDetails = true,
  className = '',
}) => {
  const clampedPercent = Math.max(0, Math.min(100, Math.round(batteryPercent)));
  const health = calculateBatteryHealth(clampedPercent, engineHealthPercent, tempC);
  const drain = getDrainRateInfo(status);

  const getBatteryIcon = () => {
    if (status === 'maintenance') {
      return <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />;
    }
    if (clampedPercent <= 15) {
      return <BatteryWarning className="w-4 h-4 text-rose-400 animate-pulse" />;
    }
    if (clampedPercent <= 35) {
      return <BatteryLow className="w-4 h-4 text-amber-400" />;
    }
    if (clampedPercent <= 70) {
      return <BatteryMedium className="w-4 h-4 text-sky-400" />;
    }
    return <Battery className="w-4 h-4 text-emerald-400" />;
  };

  const getBarColor = () => {
    if (clampedPercent <= 15) return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]';
    if (clampedPercent <= 35) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
    if (clampedPercent <= 70) return 'bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.3)]';
    return 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 font-mono ${className}`}>
        <div className="flex items-center gap-1">
          {getBatteryIcon()}
          <span
            className={`text-xs font-bold ${
              clampedPercent <= 15
                ? 'text-rose-400 animate-pulse'
                : clampedPercent <= 35
                ? 'text-amber-400'
                : 'text-slate-200'
            }`}
          >
            {clampedPercent}%
          </span>
        </div>
        <div
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${health.bgColor} ${health.borderColor} ${health.color}`}
          title={`Battery Health: ${health.healthPercent}% (${health.label})`}
        >
          {health.icon}
          <span>{health.healthState}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-2 ${className}`}
    >
      {/* Top row: Power Type & Health Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-300">
          {getBatteryIcon()}
          <span className="text-[11px] font-bold tracking-tight uppercase">
            {fuelType.includes('Lithium') || fuelType.includes('Battery')
              ? 'COLD-CELL BATTERY'
              : 'POWER CELL / FUEL'}
          </span>
        </div>

        {/* Real-time Health Status Badge */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${health.bgColor} ${health.borderColor} ${health.color}`}
          title={`Calculated Cell Health: ${health.healthPercent}%`}
        >
          {health.icon}
          <span>HEALTH: {health.healthState}</span>
        </div>
      </div>

      {/* Main Charge Meter Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-slate-400 flex items-center gap-1 text-[10px]">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>CHARGE LEVEL</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-black ${
                clampedPercent <= 15
                  ? 'text-rose-400 animate-pulse'
                  : clampedPercent <= 35
                  ? 'text-amber-400'
                  : 'text-slate-100'
              }`}
            >
              {clampedPercent}%
            </span>
            {clampedPercent <= 15 && (
              <span className="px-1 py-0.2 rounded bg-rose-950 border border-rose-600 text-[8px] text-rose-300 font-bold animate-ping">
                LOW
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Battery Gauge with Segment Markers */}
        <div className="relative w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getBarColor()}`}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
      </div>

      {/* Drain Simulation Rate & Health Diagnostics */}
      {showHealthDetails && (
        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1" title={drain.label}>
            {drain.icon}
            <span className={drain.color}>{drain.rateText}</span>
          </div>

          <div className="text-right text-[10px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-sky-400" />
            <span>CELL: {health.healthPercent}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
