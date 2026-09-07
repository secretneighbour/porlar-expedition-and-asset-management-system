import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal, ShieldCheck, Zap, Radio, Battery, Cpu, Activity,
  CheckCircle2, AlertTriangle, RefreshCw, Play, Pause, FastForward,
  Volume2, VolumeX, Download, Eye, ArrowRight, Snowflake, Layers, Wifi
} from 'lucide-react';
import { FONT_HEAD, FONT_BODY } from '../../data/polarisData';

export interface PreBootProps {
  onComplete: () => void;
  onSkip?: () => void;
  standaloneModal?: boolean;
  onCloseModal?: () => void;
}

interface DiagnosticStep {
  id: string;
  category: 'core' | 'sensors' | 'satellite' | 'battery' | 'system';
  subsystem: string;
  detail: string;
  metric?: string;
  status: 'PENDING' | 'RUNNING' | 'OK' | 'VERIFIED' | 'ONLINE' | 'WARN_FIXED';
  durationMs: number;
  hexAddr: string;
}

const INITIAL_DIAGNOSTIC_STEPS: DiagnosticStep[] = [
  // Core CPU & Memory
  {
    id: 'post-01',
    category: 'core',
    subsystem: 'POLAR-CPU-0',
    detail: 'Probing Intel Xeon Polar-Embedded Registers & Cold-Soak Junction',
    metric: 'Core Temp: -48.2°C | 3.6 GHz Nominal',
    status: 'PENDING',
    durationMs: 380,
    hexAddr: '0x000000000000'
  },
  {
    id: 'post-02',
    category: 'core',
    subsystem: 'ECC-RAM-BUS',
    detail: '64GB LPDDR5 ECC Cold-Hardened Memory Parity & CRC32 Verification',
    metric: '65,536 MB Verified | 0 Parity Faults',
    status: 'PENDING',
    durationMs: 420,
    hexAddr: '0x00007FFF0040'
  },
  {
    id: 'post-03',
    category: 'core',
    subsystem: 'NVMe-CRYPTO',
    detail: 'Mounting 1.92TB Self-Encrypting FIPS-140-3 Polar Solid-State Array',
    metric: 'AES-256 XTS Active | IOPS: 420K',
    status: 'PENDING',
    durationMs: 350,
    hexAddr: '0x0000F890A120'
  },

  // Sensor Connectivity Checks
  {
    id: 'post-04',
    category: 'sensors',
    subsystem: 'CRYO-THERM',
    detail: 'Verifying Sub-Zero Cryogenic Temperature Probes at Dome-C & Bharati',
    metric: 'Dome-C: -51.6°C | Bharati: -24.8°C | 100% Telemetry Stream',
    status: 'PENDING',
    durationMs: 500,
    hexAddr: '0x0001A4B02210'
  },
  {
    id: 'post-05',
    category: 'sensors',
    subsystem: 'GPR-800-RADAR',
    detail: 'Ground Penetrating Radar (GPR) 800MHz Sub-Ice Crevasse Interface',
    metric: 'Depth: 35m Penetration | Transceiver Sync: LOCKED',
    status: 'PENDING',
    durationMs: 480,
    hexAddr: '0x0001B6C03420'
  },
  {
    id: 'post-06',
    category: 'sensors',
    subsystem: 'CRAWLER-HARMONICS',
    detail: 'Snowcat PBD-04 & PBD-02 HNBR Belt Vibration Harmonic Transducers',
    metric: 'RMS Vibration: 0.42 mm/s | Tension: 8.2mm (Nominal)',
    status: 'PENDING',
    durationMs: 450,
    hexAddr: '0x0001C8D04630'
  },
  {
    id: 'post-07',
    category: 'sensors',
    subsystem: 'FUEL-TRACE-SENS',
    detail: 'Arctic Diesel F-34 Line Viscosity & Electrical Trace Heat Blanket',
    metric: 'Viscosity: 2.8 cSt | Line Temp: +4.2°C (Gelation Blocked)',
    status: 'PENDING',
    durationMs: 440,
    hexAddr: '0x0001DAE05840'
  },
  {
    id: 'post-08',
    category: 'sensors',
    subsystem: 'KATABATIC-ARRAY',
    detail: 'Barometric Pressure Transducer & Heated Ultrasonic Anemometer Array',
    metric: 'Pressure: 982.4 hPa | Wind: 42.6 kt ENE | De-Icer: ACTIVE',
    status: 'PENDING',
    durationMs: 460,
    hexAddr: '0x0001EBF06A50'
  },

  // Satellite Uplink & Telemetry Mesh
  {
    id: 'post-09',
    category: 'satellite',
    subsystem: 'IRIDIUM-NEXT',
    detail: 'Iridium NEXT L-Band Polar Constellation Uplink Handshake',
    metric: 'Signal: -74 dBm | 66/66 Cross-Links | 99.8% Uplink Lock',
    status: 'PENDING',
    durationMs: 550,
    hexAddr: '0x0002F0017B60'
  },
  {
    id: 'post-10',
    category: 'satellite',
    subsystem: 'STARLINK-POLAR',
    detail: 'Starlink Polar Gateway Phased-Array Ground Station Tracking',
    metric: 'Az: 194.2° | El: 22.4° | Latency: 42ms | BW: 140 Mbps',
    status: 'PENDING',
    durationMs: 520,
    hexAddr: '0x0002F1128C70'
  },
  {
    id: 'post-11',
    category: 'satellite',
    subsystem: 'COSPAS-SARSAT',
    detail: 'Inmarsat-C / COSPAS-SARSAT 406 MHz Emergency Distress Beacon',
    metric: 'Hex-ID: 352326252673 | GPS Ephemeris Sync: ARMED',
    status: 'PENDING',
    durationMs: 400,
    hexAddr: '0x0002F2239D80'
  },
  {
    id: 'post-12',
    category: 'satellite',
    subsystem: 'VHF-TROPO-MESH',
    detail: 'VHF Troposcatter Mesh Network Link (142.800 MHz Bharati Link)',
    metric: 'FEC Rate: 99.98% | Packet Loss: 0.00% | Mesh Hops: 3',
    status: 'PENDING',
    durationMs: 420,
    hexAddr: '0x0002F334AE90'
  },

  // Battery Levels & Power Reserves
  {
    id: 'post-13',
    category: 'battery',
    subsystem: 'BASE-MICROGRID-BAT',
    detail: 'Base Microgrid LiFePO4 Thermal Reservoir Battery Bank',
    metric: 'Voltage: 53.4V DC | SOC: 94.2% | Pack Temp: +18.5°C Heated',
    status: 'PENDING',
    durationMs: 480,
    hexAddr: '0x0003A001BF00'
  },
  {
    id: 'post-14',
    category: 'battery',
    subsystem: 'SNOWCAT-AUX-BATT',
    detail: 'Snowcat PBD-04 Cold-Cranking Dual Auxiliary Battery System',
    metric: '12.8V DC | Capacity: 98% | Sub-Zero Thermal Blanket: ON',
    status: 'PENDING',
    durationMs: 430,
    hexAddr: '0x0003B112C010'
  },
  {
    id: 'post-15',
    category: 'battery',
    subsystem: 'SOLAR-ALBEDO-PV',
    detail: 'Bifacial Solar Photovoltaic Snow-Albedo Harvest Array',
    metric: 'Output: 0.42 kW | Inverter Eff: 98.4% | Sun Angle: 14.2°',
    status: 'PENDING',
    durationMs: 410,
    hexAddr: '0x0003C223D120'
  },
  {
    id: 'post-16',
    category: 'battery',
    subsystem: 'GENSET-AUTO-ATS',
    detail: 'Cummins Diesel Backup Generator 1 & 2 Auto-Transfer Switch',
    metric: 'ATS: AUTO-READY | Block Temp: +65.0°C | Fuel Res: 96%',
    status: 'PENDING',
    durationMs: 450,
    hexAddr: '0x0003D334E230'
  },

  // AI & Final Init
  {
    id: 'post-17',
    category: 'system',
    subsystem: 'AI-AUTONOMOUS-CORE',
    detail: 'Polaris Autonomous Work Janitor & Forensic Archival Daemon',
    metric: 'Cache LRU: 100% | Queue Backlog: 0 Items | Shards: Active',
    status: 'PENDING',
    durationMs: 380,
    hexAddr: '0x0004E001F340'
  },
  {
    id: 'post-18',
    category: 'system',
    subsystem: 'DISPATCH-UI-HANDSHAKE',
    detail: 'Synchronizing Real-Time GIS Mesh & Tactical Command Canvas',
    metric: 'All 18 Critical Subsystems Nominal | Ready for Handshake',
    status: 'PENDING',
    durationMs: 300,
    hexAddr: '0x0004F1120450'
  }
];

export function PreBootSystemCheck({ onComplete, onSkip, standaloneModal = false, onCloseModal }: PreBootProps) {
  const [steps, setSteps] = useState<DiagnosticStep[]>(INITIAL_DIAGNOSTIC_STEPS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFastForward, setIsFastForward] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanlinesEnabled, setScanlinesEnabled] = useState(true);
  const [colorTheme, setColorTheme] = useState<'cyan' | 'green' | 'amber'>('cyan');
  const [isComplete, setIsComplete] = useState(false);
  const [autoRedirectCounter, setAutoRedirectCounter] = useState(3);
  const [injectedFault, setInjectedFault] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sound synthesis function
  const playBeep = (freq: number = 880, duration: number = 0.04, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  // Step progression execution loop
  useEffect(() => {
    if (isPaused || isComplete) return;

    if (currentIndex >= steps.length) {
      setIsComplete(true);
      playBeep(1320, 0.15, 'triangle');
      return;
    }

    const currentStep = steps[currentIndex];
    
    // Mark current step running
    setSteps(prev => prev.map((s, idx) => idx === currentIndex ? { ...s, status: 'RUNNING' } : s));
    playBeep(640 + currentIndex * 35, 0.03, 'sine');

    const duration = isFastForward ? Math.max(60, currentStep.durationMs * 0.15) : currentStep.durationMs;

    const timer = setTimeout(() => {
      setSteps(prev => prev.map((s, idx) => {
        if (idx === currentIndex) {
          return {
            ...s,
            status: s.category === 'satellite' ? 'ONLINE' : s.category === 'sensors' || s.category === 'battery' ? 'VERIFIED' : 'OK'
          };
        }
        return s;
      }));

      playBeep(1040, 0.02, 'sine');
      setCurrentIndex(prev => prev + 1);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, isPaused, isFastForward, isComplete, steps.length]);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentIndex, steps]);

  // Auto-redirect countdown when complete (only if not a modal inspector)
  useEffect(() => {
    if (!isComplete || standaloneModal) return;

    const countdown = setInterval(() => {
      setAutoRedirectCounter(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [isComplete, standaloneModal, onComplete]);

  // Calculations for progress & metrics
  const completedCount = steps.filter(s => s.status !== 'PENDING' && s.status !== 'RUNNING').length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  // Subsystem category stats
  const sensorSteps = steps.filter(s => s.category === 'sensors');
  const sensorDone = sensorSteps.filter(s => s.status !== 'PENDING' && s.status !== 'RUNNING').length;

  const satSteps = steps.filter(s => s.category === 'satellite');
  const satDone = satSteps.filter(s => s.status !== 'PENDING' && s.status !== 'RUNNING').length;

  const batSteps = steps.filter(s => s.category === 'battery');
  const batDone = batSteps.filter(s => s.status !== 'PENDING' && s.status !== 'RUNNING').length;

  // Color theme palettes
  const themes = {
    cyan: {
      text: '#38BDF8',
      textGlow: '0 0 10px rgba(56, 189, 248, 0.6)',
      border: 'rgba(56, 189, 248, 0.3)',
      bg: '#04101A',
      panel: '#071A29',
      highlight: '#0284C7',
      accent: '#00F0FF',
      cursor: '#38BDF8',
      badgeBg: 'rgba(56, 189, 248, 0.15)'
    },
    green: {
      text: '#4ADE80',
      textGlow: '0 0 10px rgba(74, 222, 128, 0.6)',
      border: 'rgba(74, 222, 128, 0.3)',
      bg: '#051408',
      panel: '#0A240F',
      highlight: '#16A34A',
      accent: '#22C55E',
      cursor: '#4ADE80',
      badgeBg: 'rgba(74, 222, 128, 0.15)'
    },
    amber: {
      text: '#FBBF24',
      textGlow: '0 0 10px rgba(251, 191, 36, 0.6)',
      border: 'rgba(251, 191, 36, 0.3)',
      bg: '#140D04',
      panel: '#241708',
      highlight: '#D97706',
      accent: '#F59E0B',
      cursor: '#FBBF24',
      badgeBg: 'rgba(251, 191, 36, 0.15)'
    }
  };

  const currentTheme = themes[colorTheme];

  // Re-run diagnostic
  const handleReRun = () => {
    setSteps(INITIAL_DIAGNOSTIC_STEPS.map(s => ({ ...s, status: 'PENDING' })));
    setCurrentIndex(0);
    setIsComplete(false);
    setIsPaused(false);
    setAutoRedirectCounter(3);
    setInjectedFault(null);
  };

  // Export raw boot log to file
  const handleExportLog = () => {
    const timestamp = new Date().toISOString();
    const logHeader = `=================================================================\n` +
      `POLARIS EXPEDITION OS v4.18.9-POLAR PRE-BOOT DIAGNOSTIC POST REPORT\n` +
      `Station: Maitri & Bharati Central Polar Command\n` +
      `Timestamp: ${timestamp}\n` +
      `Overall Result: ${progressPercent === 100 ? 'ALL CRITICAL SUBSYSTEMS NOMINAL (100%)' : 'DIAGNOSTIC IN-PROGRESS'}\n` +
      `=================================================================\n\n` +
      `[1. SENSOR CONNECTIVITY VERIFICATION]\n` +
      `  • Cryogenic Probes: PASS (-51.6°C to -24.8°C)\n` +
      `  • GPR-800 Crevasse Radar: PASS (800 MHz Synchronized)\n` +
      `  • Crawler Harmonic Transducers: PASS (0.42 mm/s RMS)\n` +
      `  • F-34 Fuel Thermal Blanket: PASS (+4.2°C Heated)\n` +
      `  • Katabatic Anemometer Array: PASS (982.4 hPa, 42.6 kt)\n\n` +
      `[2. SATELLITE UPLINK & TELEMETRY]\n` +
      `  • Iridium NEXT L-Band: ONLINE (-74 dBm, 66/66 satellites)\n` +
      `  • Starlink Polar Gateway: ONLINE (Az 194°, El 22°, 42ms)\n` +
      `  • Inmarsat-C / COSPAS-SARSAT: STANDBY-ARMED (Hex: 352326252673)\n` +
      `  • VHF Troposcatter Link: SYNCHRONIZED (142.800 MHz)\n\n` +
      `[3. BATTERY & MICROGRID POWER RESERVES]\n` +
      `  • Base Microgrid LiFePO4: 53.4V DC (SOC: 94.2%, Temp: +18.5°C)\n` +
      `  • Snowcat Aux Cranking Battery: 12.8V DC (Capacity: 98%)\n` +
      `  • Solar Albedo PV Array: 0.42 kW\n` +
      `  • Cummins Backup GenSet: ATS AUTO-READY (Fuel: 96%)\n\n` +
      `-----------------------------------------------------------------\n` +
      `DETAILED STEP EXECUTION LOGS:\n` +
      steps.map(s => `[${s.hexAddr}] [${s.status.padEnd(8)}] [${s.subsystem.padEnd(18)}] ${s.detail} => ${s.metric || ''}`).join('\n') +
      `\n\n=================================================================\n` +
      `END OF DIAGNOSTIC LOG · CRYPTOGRAPHIC SIGNATURE: SHA256:e6a61141bcb34ae1bc8bf047208d1d05\n`;

    const blob = new Blob([logHeader], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `POLARIS_PREBOOT_DIAGNOSTIC_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.log`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Simulate Cold-Soak Sensor Fault & AI Auto-Remediation
  const handleInjectFaultAndRemediate = () => {
    setInjectedFault('SIMULATED_COLD_SOAK_FAULT');
    playBeep(440, 0.3, 'sawtooth');
    
    // Inject fault into fuel trace step
    setSteps(prev => prev.map(s => {
      if (s.id === 'post-07') {
        return {
          ...s,
          status: 'RUNNING',
          metric: '🚨 FAULT: Fuel Line Temp -38.4°C (Risk of Paraffin Wax Gelation)',
          detail: 'Thermal Blanket Circuit Tripped -> AI Auto-Remediation Engaging...'
        };
      }
      return s;
    }));

    setTimeout(() => {
      playBeep(880, 0.1, 'sine');
      setSteps(prev => prev.map(s => {
        if (s.id === 'post-07') {
          return {
            ...s,
            status: 'WARN_FIXED',
            metric: '⚡ AI REMEDIATED: Secondary Trace Blanket Activated -> +5.1°C Stabilized',
            detail: 'AI Autonomous Janitor bypassed primary relay, restored 3.8 bar rail pressure & cleared warning.'
          };
        }
        return s;
      }));
      setInjectedFault('RESOLVED_BY_AI');
    }, 1800);
  };

  return (
    <div
      style={{
        backgroundColor: currentTheme.bg,
        color: currentTheme.text,
        borderColor: currentTheme.border,
        minHeight: standaloneModal ? 'auto' : '100vh'
      }}
      className={`font-mono relative flex flex-col justify-between overflow-hidden selection:bg-cyan-500/30 select-none ${
        standaloneModal ? 'p-4 rounded-xl border max-h-[85vh] overflow-y-auto shadow-2xl' : 'p-4 sm:p-6'
      }`}
    >
      {/* Optional CRT Scanlines Effect */}
      {scanlinesEnabled && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 opacity-25"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 2px)',
            backgroundSize: '100% 2px'
          }}
        />
      )}

      {/* Terminal Top Bar */}
      <div 
        style={{ 
          background: currentTheme.panel, 
          borderBottom: `1px solid ${currentTheme.border}`,
          borderColor: currentTheme.border
        }}
        className="rounded-t-lg p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>

          <div className="pl-2 border-l border-slate-700/60 flex items-center gap-2">
            <Terminal size={16} className="text-cyan-400 animate-pulse" />
            <span style={{ fontFamily: FONT_HEAD }} className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-100">
              POLARIS MK-IV BIOS // PRE-BOOT SYSTEM CHECK (POST)
            </span>
          </div>
        </div>

        {/* Top Controls: Theme, Audio, Scanlines, Skip */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Theme Switcher */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded border border-slate-800">
            <button
              onClick={() => setColorTheme('cyan')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colorTheme === 'cyan' ? 'bg-cyan-500 text-black' : 'text-cyan-400 hover:text-white'}`}
              title="Cyan Polar Theme"
            >
              CYAN
            </button>
            <button
              onClick={() => setColorTheme('green')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colorTheme === 'green' ? 'bg-emerald-500 text-black' : 'text-emerald-400 hover:text-white'}`}
              title="Phosphor Green Theme"
            >
              GRN
            </button>
            <button
              onClick={() => setColorTheme('amber')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colorTheme === 'amber' ? 'bg-amber-500 text-black' : 'text-amber-400 hover:text-white'}`}
              title="Amber CRT Theme"
            >
              AMB
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{ border: `1px solid ${currentTheme.border}`, background: currentTheme.badgeBg }}
            className="px-2 py-1 rounded flex items-center gap-1 hover:brightness-125 transition-all cursor-pointer"
            title="Toggle BIOS Acoustic Beeps"
          >
            {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            <span className="text-[10px]">{soundEnabled ? 'BEEP ON' : 'MUTE'}</span>
          </button>

          {/* Scanlines Toggle */}
          <button
            onClick={() => setScanlinesEnabled(!scanlinesEnabled)}
            style={{ border: `1px solid ${currentTheme.border}`, background: currentTheme.badgeBg }}
            className="px-2 py-1 rounded text-[10px] hover:brightness-125 transition-all cursor-pointer"
            title="Toggle CRT Scanlines"
          >
            {scanlinesEnabled ? 'CRT: ON' : 'CRT: OFF'}
          </button>

          {/* Skip / Direct Enter */}
          {onSkip && (
            <button
              onClick={onSkip}
              style={{ background: currentTheme.highlight, color: '#04101A' }}
              className="px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-sm"
              title="Bypass pre-boot checks and enter dashboard directly"
            >
              <span>Skip POST</span>
              <ArrowRight size={12} />
            </button>
          )}

          {standaloneModal && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="px-2.5 py-1 rounded text-[11px] font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Sub-header Stats & Three Core Pillars (Sensors, Satellite, Battery) */}
      <div 
        style={{ background: currentTheme.panel, borderBottom: `1px solid ${currentTheme.border}` }}
        className="p-3 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
      >
        {/* Overall POST Status */}
        <div className="p-2 rounded bg-black/40 border border-slate-800/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-mono">POST Progress</span>
            <div className="text-sm font-bold flex items-center gap-1.5">
              <span>{progressPercent}%</span>
              <span className="text-[10px] text-slate-400 font-normal">({completedCount}/{steps.length} Steps)</span>
            </div>
          </div>
          <Activity size={18} className={isComplete ? 'text-emerald-400' : 'text-cyan-400 animate-pulse'} />
        </div>

        {/* 1. Sensor Connectivity */}
        <div className="p-2 rounded bg-black/40 border border-slate-800/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
              <Snowflake size={10} className="text-cyan-400" />
              <span>Sensors Connectivity</span>
            </span>
            <div className="text-sm font-bold flex items-center gap-1.5">
              <span className={sensorDone === sensorSteps.length ? 'text-emerald-400' : 'text-cyan-300'}>
                {sensorDone}/{sensorSteps.length} Probes OK
              </span>
            </div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
        </div>

        {/* 2. Satellite Uplink */}
        <div className="p-2 rounded bg-black/40 border border-slate-800/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
              <Radio size={10} className="text-sky-400" />
              <span>Satellite Uplink</span>
            </span>
            <div className="text-sm font-bold flex items-center gap-1.5">
              <span className={satDone === satSteps.length ? 'text-emerald-400' : 'text-sky-300'}>
                {satDone}/{satSteps.length} Links Locked
              </span>
            </div>
          </div>
          <Wifi size={14} className="text-sky-400" />
        </div>

        {/* 3. Battery Levels */}
        <div className="p-2 rounded bg-black/40 border border-slate-800/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
              <Battery size={10} className="text-emerald-400" />
              <span>Battery &amp; Microgrid</span>
            </span>
            <div className="text-sm font-bold flex items-center gap-1.5">
              <span className={batDone === batSteps.length ? 'text-emerald-400' : 'text-amber-300'}>
                {batDone}/{batSteps.length} Packs Verified
              </span>
            </div>
          </div>
          <Zap size={14} className="text-amber-400" />
        </div>
      </div>

      {/* Progress Bar with Hex Offsets */}
      <div className="p-3 bg-black/60 border-b border-slate-800">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="font-mono text-slate-400">
            SYSTEM BOOT ADDRESS: <strong className="text-slate-200">{steps[Math.min(currentIndex, steps.length - 1)]?.hexAddr}</strong>
          </span>
          <span className="font-mono text-slate-300 font-bold">
            {isComplete ? 'STATUS: ALL SYSTEMS NOMINAL' : isPaused ? 'STATUS: DIAGNOSTIC PAUSED' : 'STATUS: EXECUTING PRE-BOOT POST...'}
          </span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700/60 p-0.5">
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: currentTheme.accent,
              boxShadow: currentTheme.textGlow
            }}
          />
        </div>
      </div>

      {/* Terminal Main Log Stream Output */}
      <div 
        style={{ minHeight: standaloneModal ? '280px' : '380px' }}
        className="flex-1 p-4 bg-black/80 font-mono text-xs overflow-y-auto space-y-2 border-b border-slate-800 leading-relaxed"
      >
        <div className="text-slate-500 text-[11px] pb-2 border-b border-slate-900">
          <p>POLARIS EMBEDDED SYSTEM FIRMWARE INITIALIZATION</p>
          <p>HARDWARE PLATFORM: ARCTIC/ANTARCTIC HIGH-RELIABILITY NODE</p>
          <p>COLD-SOAK RATING: -55°C CERTIFIED // SHIFT TIME: {new Date().toISOString()}</p>
        </div>

        {steps.map((step, idx) => {
          const isCurrent = idx === currentIndex && !isComplete;
          const isDone = step.status !== 'PENDING' && step.status !== 'RUNNING';
          const isPending = step.status === 'PENDING';

          return (
            <div
              key={step.id}
              className={`flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 p-1 rounded transition-colors ${
                isCurrent
                  ? 'bg-cyan-950/40 border border-cyan-500/30'
                  : isPending
                  ? 'opacity-40'
                  : 'opacity-95'
              }`}
            >
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span className="text-slate-500 font-mono text-[10px] shrink-0">
                  [{step.hexAddr.slice(2, 10)}]
                </span>

                <span 
                  className={`font-bold shrink-0 text-[11px] ${
                    step.category === 'sensors' ? 'text-cyan-400' :
                    step.category === 'satellite' ? 'text-sky-400' :
                    step.category === 'battery' ? 'text-amber-400' :
                    'text-purple-400'
                  }`}
                >
                  [{step.subsystem}]
                </span>

                <span className="text-slate-300 truncate">
                  {step.detail}
                </span>
              </div>

              <div className="flex items-center gap-2 pl-4 sm:pl-0 shrink-0 self-start sm:self-auto">
                {step.metric && isDone && (
                  <span className="text-[10px] font-mono text-slate-400 hidden lg:inline">
                    {step.metric}
                  </span>
                )}

                {step.status === 'RUNNING' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/50 flex items-center gap-1 animate-pulse font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    <span>CHECKING...</span>
                  </span>
                )}

                {step.status === 'OK' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                    [ OK ]
                  </span>
                )}

                {step.status === 'VERIFIED' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                    <CheckCircle2 size={10} className="text-emerald-400" />
                    <span>[ VERIFIED ]</span>
                  </span>
                )}

                {step.status === 'ONLINE' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-500/40 font-bold flex items-center gap-1">
                    <Radio size={10} className="text-sky-400" />
                    <span>[ ONLINE ]</span>
                  </span>
                )}

                {step.status === 'WARN_FIXED' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-500/50 font-bold flex items-center gap-1">
                    <Zap size={10} className="text-amber-400" />
                    <span>[ AUTO-FIXED ]</span>
                  </span>
                )}

                {step.status === 'PENDING' && (
                  <span className="text-[10px] font-mono text-slate-600">
                    [ QUEUED ]
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Blinking Cursor at bottom of stream */}
        {!isComplete && (
          <div className="flex items-center gap-1 pt-2 text-cyan-400 font-mono text-xs">
            <span>&gt; Executing sub-zero kernel diagnostics and interface probes</span>
            <span className="inline-block w-2 h-3.5 bg-cyan-400 animate-pulse"></span>
          </div>
        )}

        {isComplete && (
          <div className="p-3 mt-3 rounded bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>ALL PRE-BOOT CHECKS COMPLETED SUCCESSFULLY (100% NOMINAL)</span>
            </div>
            <p className="text-xs text-slate-300">
              Sensors Connectivity (5/5), Satellite Uplink (4/4), Battery Subsystems (4/4), and AI Janitor initialized with zero exceptions.
            </p>
            {!standaloneModal && (
              <p className="text-[11px] text-emerald-400 font-mono">
                Redirecting to Polaris Tactical Dashboard in {autoRedirectCounter}s...
              </p>
            )}
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Bottom Controls & Action Toolbar */}
      <div 
        style={{ background: currentTheme.panel }}
        className="p-3 rounded-b-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs"
      >
        {/* Playback / Execution Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isComplete && (
            <>
              <button
                onClick={() => setIsPaused(!isPaused)}
                style={{ border: `1px solid ${currentTheme.border}`, background: currentTheme.badgeBg }}
                className="px-2.5 py-1.5 rounded flex items-center gap-1 font-bold cursor-pointer hover:brightness-125 transition-all"
              >
                {isPaused ? <Play size={13} /> : <Pause size={13} />}
                <span>{isPaused ? 'Resume POST' : 'Pause'}</span>
              </button>

              <button
                onClick={() => setIsFastForward(!isFastForward)}
                style={{ border: `1px solid ${currentTheme.border}`, background: currentTheme.badgeBg }}
                className={`px-2.5 py-1.5 rounded flex items-center gap-1 font-bold cursor-pointer hover:brightness-125 transition-all ${
                  isFastForward ? 'text-amber-400 border-amber-500' : ''
                }`}
                title="Accelerate POST diagnostic cycle"
              >
                <FastForward size={13} />
                <span>{isFastForward ? 'Speed: 5X' : 'Fast-Forward'}</span>
              </button>
            </>
          )}

          <button
            onClick={handleReRun}
            style={{ border: `1px solid ${currentTheme.border}`, background: currentTheme.badgeBg }}
            className="px-2.5 py-1.5 rounded flex items-center gap-1 font-bold cursor-pointer hover:brightness-125 transition-all"
            title="Re-run the entire pre-boot diagnostic sequence"
          >
            <RefreshCw size={13} />
            <span>Re-Run POST</span>
          </button>

          <button
            onClick={handleExportLog}
            style={{ border: `1px solid ${currentTheme.border}`, background: currentTheme.badgeBg }}
            className="px-2.5 py-1.5 rounded flex items-center gap-1 font-bold cursor-pointer hover:brightness-125 transition-all"
            title="Download full diagnostic POST log in .log / text format"
          >
            <Download size={13} />
            <span>Export Log</span>
          </button>

          {/* Fault Simulation */}
          <button
            onClick={handleInjectFaultAndRemediate}
            disabled={injectedFault === 'SIMULATED_COLD_SOAK_FAULT'}
            style={{ border: `1px solid ${currentTheme.border}`, background: 'rgba(239, 68, 68, 0.15)' }}
            className="px-2.5 py-1.5 rounded flex items-center gap-1 text-red-300 font-bold cursor-pointer hover:bg-red-500/20 transition-all disabled:opacity-50"
            title="Simulate a sub-zero sensor anomaly and observe AI Auto-Remediation"
          >
            <AlertTriangle size={13} className="text-red-400" />
            <span>Simulate Sensor Fault &amp; Auto-Fix</span>
          </button>
        </div>

        {/* Enter Dashboard Button */}
        <div className="flex items-center gap-2 justify-end">
          {standaloneModal ? (
            <button
              onClick={onCloseModal}
              style={{ background: currentTheme.highlight, color: '#04101A' }}
              className="px-4 py-2 rounded font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110 shadow-lg text-xs"
            >
              <span>Done / Dismiss</span>
            </button>
          ) : (
            <button
              onClick={onComplete}
              style={{
                background: isComplete ? '#10B981' : currentTheme.highlight,
                color: '#04101A'
              }}
              className="px-4 py-2 rounded font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110 shadow-lg text-xs transition-all animate-in fade-in"
            >
              <span>{isComplete ? 'Initialize Dashboard Now' : 'Enter Dashboard (Skip)'}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
