import React from 'react';
import { Loader2 } from 'lucide-react';

export interface TacticalLoadingFallbackProps {
  label?: string;
  sublabel?: string;
}

export function TacticalLoadingFallback({
  label = 'LOADING POLAR TACTICAL SUBSYSTEM...',
  sublabel = 'INITIALIZING ISOLATED RUNTIME CHUNK',
}: TacticalLoadingFallbackProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center min-h-[380px] w-full p-8 text-cyan-400 font-mono bg-slate-950/40 rounded-xl border border-slate-800/60"
    >
      <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
      <span className="text-xs uppercase tracking-widest text-cyan-300 font-bold animate-pulse">
        {label}
      </span>
      <span className="text-[10px] text-slate-500 mt-1">
        {sublabel}
      </span>
    </div>
  );
}

export default TacticalLoadingFallback;
