import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Play, 
  Pause, 
  Zap, 
  ChevronDown, 
  Radio, 
  ShieldCheck, 
  Activity, 
  Clock, 
  Maximize2, 
  Minimize2,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { FONT_HEAD, FONT_BODY } from '../../data/polarisData';

export interface AiActionLogEntry {
  id: string;
  timeStr: string;
  category: 'logistics' | 'power' | 'weather' | 'sar' | 'inventory' | 'maintenance';
  prefix: string; // e.g. "AI:"
  message: string;
  stationOrAsset?: string;
  impact?: string;
  autoResolvedAlertId?: string;
}

export const INITIAL_AI_ACTION_LOGS: AiActionLogEntry[] = [
  {
    id: 'act-1',
    timeStr: '10:45 AM',
    category: 'logistics',
    prefix: 'AI:',
    message: 'Rerouting supply convoy due to expected blizzard.',
    stationOrAsset: 'Convoy PBD-04',
    impact: 'Avoids 65kt whiteout zone'
  },
  {
    id: 'act-2',
    timeStr: '10:47 AM',
    category: 'power',
    prefix: 'AI:',
    message: 'Optimizing generator fuel consumption at Himadri Base.',
    stationOrAsset: 'Himadri Station',
    impact: '-18% fuel burn rate'
  },
  {
    id: 'act-3',
    timeStr: '10:50 AM',
    category: 'inventory',
    prefix: 'AI:',
    message: 'Auto-elevating emergency fuel buffer at Maitri Station from 4,000L to 8,500L.',
    stationOrAsset: 'Maitri Station',
    impact: 'Protected against 5-day blizzard'
  },
  {
    id: 'act-4',
    timeStr: '10:52 AM',
    category: 'maintenance',
    prefix: 'AI:',
    message: 'Pre-heating hydraulic seals on Ice Corer Rig 3000 ahead of -48°C temperature drop.',
    stationOrAsset: 'AST-0003',
    impact: 'Averts seal vitrification'
  },
  {
    id: 'act-5',
    timeStr: '10:55 AM',
    category: 'sar',
    prefix: 'AI:',
    message: 'Autonomous SAR micro-drone dispatched on reconnaissance path over Wohlthat Ridge.',
    stationOrAsset: 'SAR Sentry-1',
    impact: 'Zero-click dispatch in 8.4s'
  },
  {
    id: 'act-6',
    timeStr: '10:58 AM',
    category: 'logistics',
    prefix: 'AI:',
    message: 'Calculated optimal ice-leads navigation trajectory for resupply ship MV Vasiliy Golovnin.',
    stationOrAsset: 'MV Vasiliy Golovnin',
    impact: '+2.4 knots transit speed'
  },
  {
    id: 'act-7',
    timeStr: '11:01 AM',
    category: 'maintenance',
    prefix: 'AI:',
    message: 'Auto-resolved fuel line pressure warning after activating heated trace wire.',
    stationOrAsset: 'Polar Generator Unit 1',
    impact: 'Alert ALT-04 Auto-Resolved'
  },
  {
    id: 'act-8',
    timeStr: '11:04 AM',
    category: 'power',
    prefix: 'AI:',
    message: 'Switching Bharati station solar inverter feed to battery thermal storage banks.',
    stationOrAsset: 'Bharati Station',
    impact: 'Conserves 120L diesel/day'
  },
  {
    id: 'act-9',
    timeStr: '11:07 AM',
    category: 'weather',
    prefix: 'AI:',
    message: 'Detected katabatic wind surge in Sector 4; auto-locking crawler bay hangar doors.',
    stationOrAsset: 'Hangar Bay 2',
    impact: 'Structural wind defense'
  },
  {
    id: 'act-10',
    timeStr: '11:10 AM',
    category: 'logistics',
    prefix: 'AI:',
    message: 'Adjusting scheduled flight window for IAF C-17 Globemaster to bypass low-pressure trough.',
    stationOrAsset: 'IAF C-17',
    impact: '100% blue-ice visibility'
  }
];

const STREAMING_TEMPLATES = [
  {
    category: 'logistics',
    message: 'Dynamically re-balancing cargo payload on Snowcat Tractor 01 to prevent trench bridging stress.',
    stationOrAsset: 'Snowcat Fleet',
    impact: 'Lower chassis torque'
  },
  {
    category: 'power',
    message: 'Calibrated diesel glow plug ignition cycle for extreme sub-zero cold start (-50°C).',
    stationOrAsset: 'Bharati Aux Power',
    impact: '100% cold-soak reliability'
  },
  {
    category: 'inventory',
    message: 'Dispatched automated replenishment order for Arctic HNBR Serpentine Belts to Cape Town Hub.',
    stationOrAsset: 'Logistics Supply Chain',
    impact: '+12 units pre-ordered'
  },
  {
    category: 'weather',
    message: 'Satellite telemetry fusion updated polar vortex vector. Predicted calm window at 16:30 UTC.',
    stationOrAsset: 'Maitri Met Tower',
    impact: 'Traverse greenlit'
  },
  {
    category: 'maintenance',
    message: 'Auto-resolved vibration advisory on Snow Groomer Fleet-2 following autonomous track tension adjustment.',
    stationOrAsset: 'Snow Groomer 2',
    impact: 'Alert Auto-Resolved'
  },
  {
    category: 'sar',
    message: 'Completed automated radio beacon triangulations across Princess Astrid Coast.',
    stationOrAsset: 'VHF Repeater #3',
    impact: 'Signal SNR 99.4%'
  }
];

export function AiActionLogsPanel({ 
  t, 
  compact = false,
  maxHeight = 220,
  onAutoResolveAlert
}: { 
  t: any; 
  compact?: boolean;
  maxHeight?: number;
  onAutoResolveAlert?: (alertId: string) => void;
}) {
  const [logs, setLogs] = useState<AiActionLogEntry[]>(INITIAL_AI_ACTION_LOGS);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<'all' | 'logistics' | 'power' | 'maintenance' | 'sar'>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [newEntryCount, setNewEntryCount] = useState(0);

  // Live action generation ticker (pushes new autonomous actions periodically)
  useEffect(() => {
    // Window custom event listener for instant dispatched actions
    const handleBroadcastAction = (evt: any) => {
      if (evt.detail) {
        setLogs(prev => [evt.detail, ...prev.slice(0, 40)]);
        setNewEntryCount(c => c + 1);
      }
    };

    window.addEventListener('polar-ai-action-event', handleBroadcastAction);

    if (isPaused) return () => window.removeEventListener('polar-ai-action-event', handleBroadcastAction);

    const interval = setInterval(() => {
      const template = STREAMING_TEMPLATES[Math.floor(Math.random() * STREAMING_TEMPLATES.length)];
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 ? hours % 12 : 12;
      const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
      const timeStr = `${formattedHours}:${formattedMinutes} ${ampm}`;

      const newEntry: AiActionLogEntry = {
        id: `act-${Date.now()}`,
        timeStr,
        category: template.category as any,
        prefix: 'AI:',
        message: template.message,
        stationOrAsset: template.stationOrAsset,
        impact: template.impact
      };

      setLogs(prev => [newEntry, ...prev.slice(0, 35)]);
      setNewEntryCount(c => c + 1);
    }, 9000);

    return () => {
      window.removeEventListener('polar-ai-action-event', handleBroadcastAction);
      clearInterval(interval);
    };
  }, [isPaused]);

  // Smooth auto-scroll behavior when active
  useEffect(() => {
    if (!isPaused && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [logs, isPaused]);

  const filteredLogs = logs.filter(l => filter === 'all' || l.category === filter);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'logistics':
        return { label: 'LOGISTICS', bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' };
      case 'power':
        return { label: 'POWER/GRID', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' };
      case 'maintenance':
        return { label: 'MAINTENANCE', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' };
      case 'sar':
        return { label: 'SAR / RESCUE', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' };
      case 'weather':
        return { label: 'WEATHER DEFENSE', bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' };
      default:
        return { label: 'AI ACTION', bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' };
    }
  };

  return (
    <div 
      style={{ background: t.panel, border: `1px solid ${t.border}` }} 
      className="rounded-xl p-3.5 sm:p-4 relative overflow-hidden shadow-lg shadow-black/20"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800/80 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Zap size={14} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-xs sm:text-sm font-bold tracking-wide">
                AI Action Logs
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>AUTONOMOUS STREAM</span>
              </span>
            </div>
            <p style={{ color: t.textFaint }} className="text-[10px] hidden sm:block">
              Continuous live telemetry & autonomous actions executed across polar stations
            </p>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="flex items-center bg-slate-950/90 rounded-lg border border-slate-800 p-0.5 text-[10px]">
            {(['all', 'logistics', 'power', 'maintenance', 'sar'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded cursor-pointer capitalize transition-colors ${
                  filter === f 
                    ? 'bg-sky-600 text-white font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume live autoscroll' : 'Pause live autoscroll'}
            style={{ color: isPaused ? t.amber : t.textDim, background: t.bgAlt }}
            className="p-1.5 rounded-lg border border-slate-700/60 hover:text-white cursor-pointer transition-colors flex items-center gap-1 text-[10px] font-mono"
          >
            {isPaused ? <Play size={11} className="text-emerald-400" /> : <Pause size={11} />}
            <span className="hidden md:inline">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>
      </div>

      {/* Continuously Scrolling / Streaming Log Viewport */}
      <div 
        ref={scrollContainerRef}
        style={{ 
          maxHeight: `${maxHeight}px`,
          background: 'rgba(3, 11, 20, 0.75)',
          border: '1px solid rgba(30, 58, 138, 0.25)'
        }}
        className="rounded-lg p-2.5 overflow-y-auto space-y-2 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent select-text"
      >
        {filteredLogs.map((entry, idx) => {
          const badge = getCategoryBadge(entry.category);
          const isLatest = idx === 0;

          return (
            <div
              key={entry.id}
              className={`p-2 rounded-md transition-all duration-300 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                isLatest
                  ? 'bg-slate-900/90 border-sky-500/40 shadow-sm shadow-sky-950/50'
                  : 'bg-slate-950/60 border-slate-800/60 hover:border-slate-700/80 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
                {/* Timestamp */}
                <span className="shrink-0 text-[11px] font-bold text-sky-400/90 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/40">
                  [{entry.timeStr}]
                </span>

                {/* AI: Prefix */}
                <span className="shrink-0 font-bold text-emerald-400 flex items-center gap-1">
                  <Sparkles size={11} className="text-emerald-300" />
                  <span>{entry.prefix}</span>
                </span>

                {/* Message Body */}
                <span className="text-slate-200 text-xs leading-relaxed font-sans sm:font-mono">
                  {entry.message}
                </span>
              </div>

              {/* Station & Impact Badges */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto text-[10px]">
                {entry.stationOrAsset && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {entry.stationOrAsset}
                  </span>
                )}
                {entry.impact && (
                  <span className={`px-1.5 py-0.5 rounded border font-medium ${
                    entry.impact.includes('Auto-Resolved') 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 flex items-center gap-1' 
                      : `${badge.bg} ${badge.text} ${badge.border}`
                  }`}>
                    {entry.impact.includes('Auto-Resolved') && <CheckCircle2 size={10} />}
                    <span>{entry.impact}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="text-center py-6 text-slate-500 text-xs">
            No active logs matching category filter "{filter}".
          </div>
        )}
      </div>

      {/* Footer Ticker Status */}
      <div className="flex items-center justify-between pt-2.5 mt-2 text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>AUTONOMOUS AGENT ACTIVE &bull; 0-CLICK EVENT DISPATCH READY</span>
        </div>
        <div className="flex items-center gap-3">
          <span>STREAMING: {logs.length} EVENTS</span>
          <span className="text-emerald-400">STATUS: NOMINAL</span>
        </div>
      </div>
    </div>
  );
}
