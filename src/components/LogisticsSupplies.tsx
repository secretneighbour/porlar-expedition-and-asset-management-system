import React, { useState } from 'react';
import { 
  Package, 
  Fuel, 
  Utensils, 
  HeartPulse, 
  ShieldAlert, 
  Wrench, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown,
  Plane,
  RefreshCw
} from 'lucide-react';
import { SupplyItem } from '../types';

interface LogisticsSuppliesProps {
  supplies: SupplyItem[];
  onRestockSupply: (supplyId: string, amount: number) => void;
  onRequestAirdrop: (supplyName: string) => void;
}

export const LogisticsSupplies: React.FC<LogisticsSuppliesProps> = ({
  supplies,
  onRestockSupply,
  onRequestAirdrop,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [airdropSuccessMsg, setAirdropSuccessMsg] = useState<string | null>(null);

  const filteredSupplies = supplies.filter(
    (s) => filterCategory === 'all' || s.category === filterCategory
  );

  const handleAirdropClick = (item: SupplyItem) => {
    onRequestAirdrop(item.name);
    setAirdropSuccessMsg(`Twin Otter Ski-Drop scheduled for ${item.name}!`);
    setTimeout(() => setAirdropSuccessMsg(null), 4000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fuel':
        return <Fuel className="w-4 h-4 text-amber-400" />;
      case 'rations':
        return <Utensils className="w-4 h-4 text-emerald-400" />;
      case 'medical':
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case 'survival_gear':
        return <ShieldAlert className="w-4 h-4 text-cyan-400" />;
      case 'technical':
      default:
        return <Wrench className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white font-display uppercase tracking-wider">
              SURVIVAL LOGISTICS & DEPOT INVENTORY ({supplies.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Extreme cold fuel reserves, freeze-dried caloric rations, medical hypothermia kits
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'fuel', 'rations', 'medical', 'survival_gear', 'technical'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 text-xs font-mono uppercase rounded transition-colors ${
                filterCategory === cat
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'survival_gear' ? 'SURVIVAL' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Airdrop notice if triggered */}
      {airdropSuccessMsg && (
        <div className="my-3 p-2.5 rounded bg-sky-950 border border-sky-500 text-sky-200 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <Plane className="w-4 h-4 text-sky-400 animate-pulse" />
          <span>{airdropSuccessMsg}</span>
        </div>
      )}

      {/* Supplies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 max-h-[580px] overflow-y-auto pr-1">
        {filteredSupplies.map((item) => {
          const isCritical = item.currentStock <= item.minThreshold;
          const daysRemaining =
            item.burnRatePerDay > 0
              ? Math.floor(item.currentStock / item.burnRatePerDay)
              : null;

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-lg border flex flex-col justify-between transition-all ${
                isCritical
                  ? 'bg-rose-950/40 border-rose-600/80 shadow-rose-950/20 shadow-md'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Top: Category & Status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-slate-900 border border-slate-800">
                      {getCategoryIcon(item.category)}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {item.category.replace('_', ' ')}
                    </span>
                  </div>
                  {isCritical ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-900/80 text-rose-200 border border-rose-500 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      CRITICAL LOW
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700">
                      ADEQUATE
                    </span>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-sm font-bold text-white font-display line-clamp-1 mb-1">
                  {item.name}
                </h3>
                <p className="text-[11px] font-mono text-slate-400 mb-2">
                  Storage: {item.storageLocation}
                </p>

                {/* Stock Level & Stock Progress Bar */}
                <div className="bg-slate-900/90 rounded p-2 border border-slate-800 mb-2.5">
                  <div className="flex items-baseline justify-between font-mono mb-1">
                    <span className="text-xl font-bold text-white">
                      {item.currentStock.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">{item.unit}</span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCritical ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(10, (item.currentStock / (item.minThreshold * 2.5)) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>Min Safety: {item.minThreshold.toLocaleString()}</span>
                    {daysRemaining !== null && (
                      <span className={daysRemaining < 30 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        ~{daysRemaining} Days Burn
                      </span>
                    )}
                  </div>
                </div>

                {/* Stability rating */}
                <div className="text-[10px] font-mono text-cyan-300/80 flex items-center justify-between mb-3">
                  <span>Cold Cryo-Stability:</span>
                  <span className="font-bold">{item.coldStabilityC}°C Verified</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => onRestockSupply(item.id, Math.round(item.minThreshold * 0.5))}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold tracking-wider transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-400" />
                  <span>+ RESTOCK 50%</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAirdropClick(item)}
                  className="px-2 py-1 rounded bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 text-[10px] font-bold tracking-wider transition-colors flex items-center gap-1"
                >
                  <Plane className="w-3 h-3 text-sky-400" />
                  <span>AIR-DROP</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
