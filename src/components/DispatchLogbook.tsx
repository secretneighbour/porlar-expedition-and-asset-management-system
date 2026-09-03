import React, { useState } from 'react';
import { 
  Radio, 
  Send, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  Clock, 
  Search,
  Filter
} from 'lucide-react';
import { DispatchLog } from '../types';

interface DispatchLogbookProps {
  logs: DispatchLog[];
  onAddLog: (newLog: Omit<DispatchLog, 'id' | 'timestamp'>) => void;
}

export const DispatchLogbook: React.FC<DispatchLogbookProps> = ({
  logs,
  onAddLog,
}) => {
  const [callsign, setCallsign] = useState('');
  const [sector, setSector] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'routine' | 'advisory' | 'warning' | 'urgent_distress'>('routine');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !callsign.trim()) return;

    onAddLog({
      callsign: callsign.trim(),
      sector: sector.trim() || 'General Polar Relay',
      message: message.trim(),
      severity,
    });

    setMessage('');
  };

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    return (
      log.callsign.toLowerCase().includes(query) ||
      log.sector.toLowerCase().includes(query) ||
      log.message.toLowerCase().includes(query)
    );
  });

  const getSeverityBadge = (sev: DispatchLog['severity']) => {
    switch (sev) {
      case 'urgent_distress':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-600 font-bold animate-pulse">DISTRESS MAYDAY</span>;
      case 'warning':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-orange-950 text-orange-300 border border-orange-600 font-bold">WEATHER / MECH WARNING</span>;
      case 'advisory':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-600 font-bold">ADVISORY</span>;
      case 'routine':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">ROUTINE COMMS</span>;
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white font-display uppercase tracking-wider">
              HF / IRIDIUM RADIO DISPATCH LOGBOOK ({logs.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Direct high-frequency tactical communications transcript between convoys, airfields, and base
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search radio logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 font-mono text-xs focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Quick Transmission Form */}
      <form onSubmit={handleSubmit} className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-2.5">
        <span className="text-slate-400 font-bold block uppercase text-[10px]">
          TRANSMIT NEW DISPATCH LOG:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            required
            placeholder="Callsign (e.g. SPoT-Lead)"
            value={callsign}
            onChange={(e) => setCallsign(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
          <input
            type="text"
            placeholder="Sector / Location (e.g. Leverett Pass)"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as any)}
            aria-label="Dispatch severity level"
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="routine">Routine Comms</option>
            <option value="advisory">Advisory Notice</option>
            <option value="warning">Mechanical / Weather Warning</option>
            <option value="urgent_distress">Urgent Mayday / SAR</option>
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Type transmission message text..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded flex items-center gap-1.5 transition-colors border border-sky-400/40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>TRANSMIT</span>
          </button>
        </div>
      </form>

      {/* Logs Feed */}
      <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="p-3 rounded-lg bg-slate-950/90 border border-slate-800/80 hover:border-slate-700 text-xs font-mono transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sky-300">{log.callsign}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{log.sector}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[10px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  {log.timestamp}
                </span>
                {getSeverityBadge(log.severity)}
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed pl-2 border-l-2 border-slate-700">
              {log.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
