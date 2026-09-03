import React, { useState } from 'react';
import { 
  CloudSnow, 
  Wind, 
  Thermometer, 
  Eye, 
  Gauge, 
  Sun, 
  Moon, 
  AlertTriangle, 
  Calculator,
  Compass,
  ArrowDownRight,
  TrendingDown
} from 'lucide-react';
import { ConditionLevel } from '../types';

interface EnvironmentalTelemetryProps {
  conditionLevel: ConditionLevel;
}

export const EnvironmentalTelemetry: React.FC<EnvironmentalTelemetryProps> = ({
  conditionLevel,
}) => {
  // Interactive windchill calculator state
  const [calcTemp, setCalcTemp] = useState<number>(-45);
  const [calcWindKts, setCalcWindKts] = useState<number>(30);

  // Standard polar windchill calculation:
  // Twc = 13.12 + 0.6215*T - 11.37*(V_kmh^0.16) + 0.3965*T*(V_kmh^0.16)
  const calcWindKmh = calcWindKts * 1.852;
  const calculatedWindchill = Math.round(
    13.12 +
    0.6215 * calcTemp -
    11.37 * Math.pow(calcWindKmh, 0.16) +
    0.3965 * calcTemp * Math.pow(calcWindKmh, 0.16)
  );

  // Frostbite exposure time approximation
  const getFrostbiteRisk = (chill: number) => {
    if (chill > -25) return { time: '> 60 min', risk: 'Low', color: 'text-emerald-400' };
    if (chill > -35) return { time: '30 min', risk: 'Moderate', color: 'text-amber-400' };
    if (chill > -48) return { time: '10 min', risk: 'High', color: 'text-orange-400' };
    if (chill > -60) return { time: '2 - 5 min', risk: 'Severe (Exposed Flesh Freezes)', color: 'text-rose-400' };
    return { time: '< 60 seconds', risk: 'Extreme / Fatal Exposure', color: 'text-rose-600 font-bold' };
  };

  const frostbite = getFrostbiteRisk(calculatedWindchill);

  // Real-world polar meteorological sensors
  const telemetryStations = [
    {
      name: 'Amundsen-Scott South Pole',
      code: 'NPX-MET',
      tempC: -51.2,
      windchillC: -73.4,
      windKts: 18,
      windDir: '040° NNE',
      pressureHpa: 678.2, // high altitude ~2835m
      visibilityKm: 8.0,
      sky: 'Clear Ice Fog Crystals',
      solar: 'Polar Twilight Transition',
    },
    {
      name: 'Dome C Concordia Plateau',
      code: 'DCB-MET',
      tempC: -62.8,
      windchillC: -81.2,
      windKts: 14,
      windDir: '190° S',
      pressureHpa: 642.1, // 3233m elevation
      visibilityKm: 12.0,
      sky: 'Diamond Dust Precipitation',
      solar: '24h Polar Darkness',
    },
    {
      name: 'McMurdo Ross Ice Shelf',
      code: 'MCM-MET',
      tempC: -24.6,
      windchillC: -42.1,
      windKts: 38,
      windDir: '160° SSE',
      pressureHpa: 982.5,
      visibilityKm: 0.8,
      sky: 'Severe Drifting Snow / Whiteout',
      solar: 'Low Horizon Glare',
    },
    {
      name: 'Vostok Pole of Cold',
      code: 'VOS-MET',
      tempC: -68.4,
      windchillC: -89.0,
      windKts: 16,
      windDir: '270° W',
      pressureHpa: 624.0,
      visibilityKm: 10.0,
      sky: 'Extreme Cryo-Clear',
      solar: 'Polar Night',
    },
    {
      name: 'Ny-Ålesund Arctic Spitsbergen',
      code: 'NYA-MET',
      tempC: -14.2,
      windchillC: -26.5,
      windKts: 26,
      windDir: '340° NNW',
      pressureHpa: 1004.2,
      visibilityKm: 4.5,
      sky: 'Maritime Snow Squalls',
      solar: 'Midnight Sun / High Noon',
    },
  ];

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CloudSnow className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white font-display uppercase tracking-wider">
              METEOROLOGICAL & KATABATIC ATMOSPHERIC TELEMETRY
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Antarctic plateau adiabatic cooling, gravity wind corridors, and exposed flesh freezing thresholds
          </p>
        </div>

        {/* Condition reminder pill */}
        <div className="px-3 py-1 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-300">
          GLOBAL OPS: <strong className="text-amber-400">{conditionLevel.replace('_', ' ')}</strong>
        </div>
      </div>

      {/* Windchill Calculator & Hypothermia Safety Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Interactive Field Operator Windchill Tool */}
        <div className="lg:col-span-1 bg-slate-950/80 border border-cyan-500/40 rounded-lg p-3.5 flex flex-col justify-between font-mono text-xs">
          <div>
            <div className="flex items-center gap-2 text-cyan-300 font-bold mb-2 pb-1.5 border-b border-slate-800">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>FIELD WINDCHILL & FROSTBITE CALCULATOR</span>
            </div>

            {/* Slider 1: Temperature */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">AMBIENT AIR TEMP:</span>
                <span className="text-sky-300 font-bold">{calcTemp}°C</span>
              </div>
              <input
                type="range"
                min="-85"
                max="0"
                step="1"
                value={calcTemp}
                onChange={(e) => setCalcTemp(Number(e.target.value))}
                className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>-85°C (Extreme)</span>
                <span>-40°C</span>
                <span>0°C</span>
              </div>
            </div>

            {/* Slider 2: Wind Speed */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">SURFACE WIND SPEED:</span>
                <span className="text-amber-300 font-bold">{calcWindKts} knots ({Math.round(calcWindKmh)} km/h)</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="2"
                value={calcWindKts}
                onChange={(e) => setCalcWindKts(Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>0 kts (Calm)</span>
                <span>40 kts (Gale)</span>
                <span>80 kts (Storm)</span>
              </div>
            </div>
          </div>

          {/* Output Display */}
          <div className="bg-slate-900 rounded p-2.5 border border-slate-800 mt-2 space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-slate-400 text-[11px]">EFFECTIVE WINDCHILL:</span>
              <span className="text-2xl font-bold font-mono text-cyan-300">
                {calculatedWindchill}°C
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
              <span className="text-slate-500">FROSTBITE RISK:</span>
              <span className={frostbite.color}>{frostbite.risk}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">EXPOSURE LIMIT:</span>
              <span className="text-white font-bold">{frostbite.time}</span>
            </div>
          </div>
        </div>

        {/* Real-time Weather Station Sensors Table */}
        <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800 rounded-lg p-3.5">
          <span className="font-mono text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
            AUTOMATED WEATHER OBSERVING STATIONS (AWOS)
          </span>

          <div className="space-y-2">
            {telemetryStations.map((station) => (
              <div
                key={station.code}
                className="p-2.5 rounded bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sky-400 font-bold">{station.code}</span>
                    <span className="text-white font-display font-semibold">{station.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                    <span>Baro: <strong className="text-slate-300">{station.pressureHpa} hPa</strong></span>
                    <span>Vis: <strong className={station.visibilityKm < 1 ? 'text-rose-400' : 'text-slate-300'}>{station.visibilityKm} km</strong></span>
                    <span className="hidden md:inline">{station.sky}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:text-right">
                  <div>
                    <div className="text-sky-300 font-bold">
                      {station.tempC}°C <span className="text-slate-500 font-normal">Air</span>
                    </div>
                    <div className="text-[11px] text-cyan-400 font-semibold">
                      {station.windchillC}°C <span className="text-slate-500 font-normal">Chill</span>
                    </div>
                  </div>

                  <div className="border-l border-slate-800 pl-3">
                    <div className="text-amber-300 font-bold flex items-center gap-1">
                      <Wind className="w-3 h-3" />
                      <span>{station.windKts} kts</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Dir: {station.windDir}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
