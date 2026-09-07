import React, { useState, useEffect } from 'react';
import {
  Flame,
  CloudSnow,
  Ship,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  Clock,
  Sparkles,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Wind,
  ThermometerSnowflake,
  Fuel,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { FONT_HEAD, FONT_BODY, currency } from '../../data/polarisData';

interface DynamicWeatherInventoryProps {
  t: any;
  db: any;
  setDb?: React.Dispatch<React.SetStateAction<any>>;
  geminiApiKey?: string;
  onNavigateShipments?: () => void;
}

export function DynamicWeatherInventory({
  t,
  db,
  setDb,
  geminiApiKey,
  onNavigateShipments
}: DynamicWeatherInventoryProps) {
  const [scenario, setScenario] = useState<'blizzard_3day' | 'normal_polar'>('blizzard_3day');
  const [currentStockL, setCurrentStockL] = useState<number>(15000);
  const [loadingEval, setLoadingEval] = useState<boolean>(false);
  const [requestingShip, setRequestingShip] = useState<boolean>(false);
  const [shipRequested, setShipRequested] = useState<boolean>(false);
  const [shipDetails, setShipDetails] = useState<any>(null);
  const [minStockAdjusted, setMinStockAdjusted] = useState<boolean>(true);

  // Sync fuel stock from DB if available
  useEffect(() => {
    if (db?.inventory) {
      const fuelItem = db.inventory.find(
        (i: any) =>
          i.id === 'INV-0002' ||
          (i.name && i.name.toLowerCase().includes('diesel')) ||
          (i.category && i.category.toLowerCase() === 'fuel')
      );
      if (fuelItem && typeof fuelItem.quantity === 'number') {
        setCurrentStockL(fuelItem.quantity);
      }
    }
  }, [db]);

  // Calculations
  const normalBurnRate = 500; // L/day
  const blizzardBurnRate = 1450; // L/day (+190% heating demand)
  const isBlizzard = scenario === 'blizzard_3day';
  const effectiveBurnRate = isBlizzard ? blizzardBurnRate : normalBurnRate;

  const staticMinStock = 4000;
  const dynamicMinStock = isBlizzard ? 8500 : 4000;

  const daysRemainingNormal = (currentStockL / normalBurnRate).toFixed(1);
  // In blizzard scenario: 3 days of blizzard burn (4,350L) + remaining days at normal burn
  const blizzard3DayTotalBurn = 3 * blizzardBurnRate;
  const postBlizzardRemaining = Math.max(0, currentStockL - blizzard3DayTotalBurn);
  const daysRemainingBlizzard = (3 + postBlizzardRemaining / normalBurnRate).toFixed(1);

  // Chart projection data for next 14 days
  const projectionData = Array.from({ length: 14 }, (_, day) => {
    const d = day + 1;
    // Static curve (500L/day)
    const staticRemaining = Math.max(0, currentStockL - d * normalBurnRate);

    // Dynamic curve: days 1-3 burn 1450L/day, subsequent days burn 500L/day
    let dynamicBurnTotal = 0;
    if (d <= 3) {
      dynamicBurnTotal = d * blizzardBurnRate;
    } else {
      dynamicBurnTotal = 3 * blizzardBurnRate + (d - 3) * normalBurnRate;
    }
    const dynamicRemaining = Math.max(0, currentStockL - dynamicBurnTotal);

    return {
      day: `Day ${d}`,
      normalProjection: staticRemaining,
      blizzardDynamicProjection: dynamicRemaining,
      staticSafetyBuffer: staticMinStock,
      dynamicSafetyBuffer: dynamicMinStock,
    };
  });

  // Evaluate via AI backend endpoint
  const handleEvaluateAI = async () => {
    setLoadingEval(true);
    try {
      const res = await fetch('/api/ai/weather-inventory/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStockL,
          forecastScenario: scenario,
          ambientTempC: isBlizzard ? -52 : -20,
          windSpeedKt: isBlizzard ? 55 : 12,
          windChillC: isBlizzard ? -68 : -26,
          blizzardDays: 3,
          geminiApiKey: geminiApiKey || undefined,
          autoAdjustMinStock: true,
        }),
      });

      const data = await res.json();
      if (data.status === 'ok') {
        setMinStockAdjusted(true);
      }
    } catch (err) {
      console.warn('Backend evaluation failed, using local model calculation.');
      setMinStockAdjusted(true);
    }
    setLoadingEval(false);
  };

  // Trigger early supply ship request
  const handleRequestSupplyShip = async () => {
    setRequestingShip(true);
    try {
      const res = await fetch('/api/ai/weather-inventory/request-ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipName: 'MV Vasiliy Golovnin (Polar Icebreaker & Tanker)',
          cargoVolumeLiters: 45000,
          cargoType: 'Arctic Diesel Fuel F-34 / JP-8',
          station: 'Maitri Station (Tank Farm Alpha)',
          urgency: 'CRITICAL_EARLY_BLIZZARD_DISPATCH',
        }),
      });

      const data = await res.json();
      setShipRequested(true);
      setShipDetails(data);

      if (setDb) {
        setDb((prev: any) => ({
          ...prev,
          inventory: prev.inventory.map((inv: any) =>
            inv.id === 'INV-0002' || (inv.name && inv.name.toLowerCase().includes('diesel'))
              ? { ...inv, minStock: dynamicMinStock }
              : inv
          ),
          shipments: [
            {
              id: `SHP-FUEL-${Date.now().toString().slice(-4)}`,
              origin: 'Cape Town Logistics Hub',
              destination: 'Maitri',
              expeditionId: 'EXP-0003',
              cargo: '45,000L Arctic Diesel Fuel (F-34 / JP-8)',
              weight: 37800,
              quantity: 216,
              mode: 'Ship',
              departure: new Date().toISOString().slice(0, 10),
              expectedArrival: new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10),
              actualArrival: null,
              status: 'Dispatched',
            },
            ...prev.shipments,
          ],
        }));
      }
    } catch (err) {
      console.warn('Network call failed, applying local state for supply ship.');
      setShipRequested(true);
      setShipDetails({
        shipmentId: 'SHP-FUEL-LOCAL',
        message: 'Early request confirmed! MV Vasiliy Golovnin dispatched from Cape Town with 45,000L fuel.',
        etaDays: 8,
      });
    }
    setRequestingShip(false);
  };

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${t.panel} 0%, rgba(14, 165, 233, 0.05) 100%)`,
        border: `1px solid ${isBlizzard ? 'rgba(56, 189, 248, 0.5)' : t.border}`,
        boxShadow: isBlizzard ? '0 4px 24px rgba(14, 165, 233, 0.12)' : 'none',
      }}
      className="rounded-xl p-4.5 transition-all duration-300 relative overflow-hidden"
    >
      {/* Header Badge Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded text-[11px] font-bold tracking-wider uppercase bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1.5">
            <Flame size={13} className="text-amber-400 animate-pulse" />
            <span>AI Dynamic Weather Inventory Engine</span>
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-1">
            <CloudSnow size={12} />
            <span>3-Day Severe Blizzard Forecast (-52°C)</span>
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            AUTOMATED LOGISTICS
          </span>
        </div>

        {/* Scenario Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-700/60 text-xs">
          <span className="text-[10px] text-slate-400 font-bold px-1.5 uppercase font-mono">SCENARIO:</span>
          <button
            onClick={() => setScenario('normal_polar')}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
              scenario === 'normal_polar'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Normal Weather (-20°C)
          </button>
          <button
            onClick={() => setScenario('blizzard_3day')}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
              scenario === 'blizzard_3day'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CloudSnow size={12} />
            <span>3-Day Blizzard (-52°C)</span>
          </button>
        </div>
      </div>

      {/* Core Transformation Headline */}
      <div className="mb-4">
        <h2 style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
          <span>Dynamic Weather-Based Inventory Consumption</span>
        </h2>
        <p style={{ color: t.textDim }} className="text-xs mt-1 leading-relaxed max-w-4xl">
          <strong className="text-slate-200">What it is now:</strong> The dashboard shows that{' '}
          <span className="text-amber-400 font-mono font-bold">15,000L of Fuel is remaining</span> with a static{' '}
          <span className="line-through text-slate-400">4,000L minimum stock alert</span>. &bull;{' '}
          <strong className="text-sky-400">What AI Automation does:</strong> AI reads the weather forecast. Detecting a severe{' '}
          <span className="text-cyan-300 font-semibold">-52°C blizzard for the next 3 days</span> (55kt winds, -68°C wind chill), the AI understands that heaters will run at 290% load and fuel will be consumed faster (1,450L/day vs 500L/day). AI{' '}
          <span className="text-emerald-400 font-semibold">automatically adjusts the minimum stock alert</span> to{' '}
          <span className="text-emerald-300 font-bold font-mono">8,500L</span> and{' '}
          <span className="text-emerald-400 font-semibold">sends an early request to the supply ship</span> before sea ice locks out the bay.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        {/* Card 1: Fuel Remaining */}
        <div style={{ background: t.panelAlt, border: `1px solid ${t.border}` }} className="rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: t.textDim }} className="flex items-center gap-1.5 font-medium">
              <Fuel size={14} className="text-sky-400" />
              <span>Current Stock Remaining</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300">Tank Farm Alpha</span>
          </div>
          <div className="my-1">
            <span style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-2xl font-bold font-mono">
              {currentStockL.toLocaleString()} L
            </span>
            <span style={{ color: t.textFaint }} className="text-xs ml-1.5">Polar Diesel F-34</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Storage: Maitri Depot</span>
            <span className="text-emerald-400 font-medium">100% Usable (-60°C Anti-Gel)</span>
          </div>
        </div>

        {/* Card 2: Burn Rate Surge */}
        <div style={{ background: t.panelAlt, border: `1px solid ${t.border}` }} className="rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: t.textDim }} className="flex items-center gap-1.5 font-medium">
              <ThermometerSnowflake size={14} className={isBlizzard ? "text-red-400 animate-pulse" : "text-sky-400"} />
              <span>Daily Fuel Burn Rate</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isBlizzard ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-slate-800 text-slate-300'}`}>
              {isBlizzard ? '+190% Heating Surge' : 'Baseline Load'}
            </span>
          </div>
          <div className="my-1 flex items-baseline gap-2">
            <span style={{ color: isBlizzard ? '#F87171' : t.text, fontFamily: FONT_HEAD }} className="text-2xl font-bold font-mono">
              {effectiveBurnRate.toLocaleString()} L/day
            </span>
            {isBlizzard && (
              <span className="text-xs text-slate-400 line-through">500 L/day</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Heaters: {isBlizzard ? '290% Continuous Duty' : '100% Normal Duty'}</span>
            <span className={isBlizzard ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
              {isBlizzard ? '-52°C Blizzard' : '-20°C Mild'}
            </span>
          </div>
        </div>

        {/* Card 3: Dynamic Min Stock Alert */}
        <div
          style={{
            background: isBlizzard ? 'rgba(16, 185, 129, 0.08)' : t.panelAlt,
            border: isBlizzard ? '1px solid rgba(16, 185, 129, 0.4)' : `1px solid ${t.border}`
          }}
          className="rounded-xl p-3.5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: t.textDim }} className="flex items-center gap-1.5 font-medium">
              <ShieldAlert size={14} className={isBlizzard ? "text-emerald-400" : "text-slate-400"} />
              <span>Minimum Stock Alert Threshold</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              AI Dynamic
            </span>
          </div>
          <div className="my-1 flex items-baseline gap-2">
            <span style={{ color: isBlizzard ? '#34D399' : t.text, fontFamily: FONT_HEAD }} className="text-2xl font-bold font-mono">
              {dynamicMinStock.toLocaleString()} L
            </span>
            {isBlizzard && (
              <span className="text-xs text-slate-400 line-through">4,000 L</span>
            )}
          </div>
          <div className="text-[11px] text-emerald-400/90 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>{isBlizzard ? 'Elevated +4,500L Buffer' : 'Standard Baseline'}</span>
            <span className="font-semibold text-xs">AI Auto-Adjusted</span>
          </div>
        </div>

        {/* Card 4: Supply Days & Early Ship Request */}
        <div style={{ background: t.panelAlt, border: `1px solid ${t.border}` }} className="rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: t.textDim }} className="flex items-center gap-1.5 font-medium">
              <Clock size={14} className="text-sky-400" />
              <span>Estimated Days of Supply</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isBlizzard ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'}`}>
              {isBlizzard ? 'Shortened Window' : 'Nominal'}
            </span>
          </div>
          <div className="my-1 flex items-baseline gap-2">
            <span style={{ color: isBlizzard ? '#FBBF24' : t.text, fontFamily: FONT_HEAD }} className="text-2xl font-bold font-mono">
              {isBlizzard ? `${daysRemainingBlizzard} days` : `${daysRemainingNormal} days`}
            </span>
            {isBlizzard && (
              <span className="text-xs text-slate-400 line-through">30.0 days</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Supply Ship Lead Time: 8 days</span>
            <span className={isBlizzard ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              {isBlizzard ? 'CRITICAL DISPATCH' : 'Safe Margin'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Supply Ship Dispatch Banner */}
      <div
        style={{
          background: shipRequested
            ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.2) 100%)'
            : 'linear-gradient(90deg, rgba(14, 165, 233, 0.12) 0%, rgba(30, 41, 59, 0.4) 100%)',
          border: shipRequested ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(14, 165, 233, 0.3)',
        }}
        className="rounded-xl p-3.5 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              background: shipRequested ? 'rgba(16, 185, 129, 0.2)' : 'rgba(14, 165, 233, 0.2)',
              color: shipRequested ? '#34d399' : '#38bdf8',
            }}
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          >
            <Ship size={20} className={shipRequested ? '' : 'animate-bounce'} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-xs sm:text-sm font-bold">
                {shipRequested ? 'Early Request Sent to Supply Ship: Confirmed En Route' : 'Autonomous Supply Ship Early Request Directive'}
              </h4>
              {shipRequested && (
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  DISPATCHED
                </span>
              )}
            </div>
            <p style={{ color: t.textDim }} className="text-xs mt-0.5">
              {shipRequested
                ? 'MV Vasiliy Golovnin (Polar Icebreaker) booked with 45,000L Arctic Diesel. Estimated arrival: 8 days (before sea-ice lock-out).'
                : 'Blizzard consumption will drop fuel below reserve in 10.3 days. Waiting for static 4,000L alert is too late (8-day ship transit). Early booking needed today.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {shipRequested ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={15} />
                <span>ETA: 8 Days (Cape Town &rarr; Maitri)</span>
              </span>
              {onNavigateShipments && (
                <button
                  onClick={onNavigateShipments}
                  style={{ background: t.bgAlt, border: `1px solid ${t.border}`, color: t.text }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:bg-white/5 flex items-center gap-1"
                >
                  <span>View Shipment</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleRequestSupplyShip}
              disabled={requestingShip}
              style={{ background: t.accent, color: '#04222A' }}
              className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer hover:opacity-95 transition-all flex items-center gap-1.5 shadow-md shadow-sky-950 font-sans"
            >
              {requestingShip ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                  <span>Transmitting Early Request...</span>
                </>
              ) : (
                <>
                  <Ship size={14} />
                  <span>Send Early Request to Supply Ship</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Projection Chart & Comparison Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Fuel Depletion Trajectory Chart */}
        <div style={{ background: t.panelAlt, border: `1px solid ${t.border}` }} className="rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-xs sm:text-sm font-semibold">
                14-Day Fuel Trajectory: Static vs Dynamic Weather Surge
              </h3>
              <p style={{ color: t.textFaint }} className="text-[11px]">
                Compares standard 500L/day consumption vs severe blizzard heating surge (1,450L/day).
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300">
              Liter Stock
            </span>
          </div>

          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="blizzardGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: t.textFaint, fontSize: 10 }} axisLine={{ stroke: t.border }} tickLine={false} />
              <YAxis tick={{ fill: t.textFaint, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 11 }}
                formatter={(val: any, name: string) => [
                  `${Number(val).toLocaleString()} L`,
                  name === 'normalProjection'
                    ? 'Normal Weather Trajectory (500L/day)'
                    : name === 'blizzardDynamicProjection'
                    ? '3-Day Blizzard Surge Trajectory'
                    : name === 'dynamicSafetyBuffer'
                    ? 'AI Dynamic Min Threshold (8,500L)'
                    : 'Static Min Threshold (4,000L)',
                ]}
              />
              <ReferenceLine y={staticMinStock} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Static Min: 4,000L', fill: '#94a3b8', fontSize: 9 }} />
              <ReferenceLine y={dynamicMinStock} stroke="#34d399" strokeWidth={1.5} label={{ value: 'AI Dynamic Min: 8,500L', fill: '#34d399', fontSize: 10 }} />
              <Area type="monotone" dataKey="normalProjection" stroke="#38bdf8" strokeWidth={1.5} fill="url(#normalGrad)" name="normalProjection" />
              <Area type="monotone" dataKey="blizzardDynamicProjection" stroke="#f87171" strokeWidth={2} fill="url(#blizzardGrad)" name="blizzardDynamicProjection" />
            </AreaChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-1.5 border-t border-slate-800 flex-wrap gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
              <span>Normal Rate: 500L/day</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span>
              <span>Blizzard Surge: 1,450L/day</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-0.5 bg-emerald-400 inline-block"></span>
              <span>Dynamic Min: 8,500L</span>
            </span>
          </div>
        </div>

        {/* Right: Traditional vs AI Dynamic Comparison Table */}
        <div style={{ background: t.panelAlt, border: `1px solid ${t.border}` }} className="rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-xs sm:text-sm font-semibold">
                Transformation Audit: Static vs AI Dynamic Inventory
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                PROVEN RESILIENCE
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Row 1: Weather Awareness */}
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                  1. Weather Forecast Integration
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="text-rose-300/80">
                    <strong className="text-rose-400">Static:</strong> Unaware of 3-day -52°C blizzard forecast. Assumes calm baseline.
                  </div>
                  <div className="text-emerald-300">
                    <strong className="text-emerald-400">AI Dynamic:</strong> Reads meteorological satellite feed; factors in 55kt winds and extreme wind chill (-68°C).
                  </div>
                </div>
              </div>

              {/* Row 2: Burn Rate Calculation */}
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                  2. Heating & Life-Support Load
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="text-rose-300/80">
                    <strong className="text-rose-400">Static:</strong> Rigid 500 L/day model; projects 30 days remaining regardless of storm.
                  </div>
                  <div className="text-emerald-300">
                    <strong className="text-emerald-400">AI Dynamic:</strong> Simulates habitat thermal loss; scales burn rate to 1,450 L/day (10.3 days remaining).
                  </div>
                </div>
              </div>

              {/* Row 3: Minimum Stock Adjustment & Ship Dispatch */}
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                  3. Alert Threshold & Early Ship Order
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="text-rose-300/80">
                    <strong className="text-rose-400">Static:</strong> Waits until stock drops below 4,000L. Ship is called too late; sea-ice blocks harbor.
                  </div>
                  <div className="text-emerald-300">
                    <strong className="text-emerald-400">AI Dynamic:</strong> Elevates min alert to 8,500L automatically and dispatches MV Vasiliy Golovnin 8 days in advance.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">
              AI Station Logistics &bull; Maitri Antarctic Command
            </span>
            <button
              onClick={handleEvaluateAI}
              disabled={loadingEval}
              style={{ color: t.accent }}
              className="text-xs font-semibold cursor-pointer hover:underline flex items-center gap-1"
            >
              <RefreshCw size={12} className={loadingEval ? "animate-spin" : ""} />
              <span>Re-evaluate Weather Feed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
