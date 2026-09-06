import React, { useState } from 'react';
import { 
  Radio, 
  Send, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  Clock, 
  Search, 
  Filter,
  Sparkles,
  Loader2,
  Key,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DispatchLog } from '../types';

interface DispatchLogbookProps {
  logs: DispatchLog[];
  onAddLog: (newLog: Omit<DispatchLog, 'id' | 'timestamp'>) => void;
  geminiApiKey?: string;
  onOpenApiKeyModal?: () => void;
}

export const DispatchLogbook: React.FC<DispatchLogbookProps> = ({
  logs,
  onAddLog,
  geminiApiKey = '',
  onOpenApiKeyModal,
}) => {
  const [callsign, setCallsign] = useState('');
  const [sector, setSector] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'routine' | 'advisory' | 'warning' | 'urgent_distress'>('routine');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Reconnaissance Evaluation State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  const handleRunAiEvaluation = async () => {
    setAiLoading(true);
    setAiError(null);
    setIsAiPanelOpen(true);

    try {
      const res = await fetch('/api/ai/recon-eval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(geminiApiKey ? { 'x-gemini-api-key': geminiApiKey } : {}),
        },
        body: JSON.stringify({
          geminiApiKey,
          prompt: `Analyze the following latest ${logs.length} polar dispatch logs and identify critical operational anomalies, crevasse/weather risks, and immediate survival directives for traverse teams: \n\n${logs.map(l => `[${l.severity.toUpperCase()}] ${l.callsign} (${l.sector}): ${l.message}`).join('\n')}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI Evaluation request failed.');
      }

      setAiAnalysis(data.analysis || 'Analysis complete.');
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate AI tactical evaluation.');
    } finally {
      setAiLoading(false);
    }
  };

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

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* AI Intelligence Trigger */}
          <button
            type="button"
            onClick={handleRunAiEvaluation}
            disabled={aiLoading}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-950 to-amber-900/90 hover:from-amber-900 hover:to-amber-800 text-amber-200 border border-amber-500/60 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-md shadow-amber-950/40"
            title="Generate AI Tactical Risk & Survival Assessment with Gemini 2.5 Flash"
          >
            {aiLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            )}
            <span>AI TACTICAL AUDIT</span>
          </button>

          {/* Search */}
          <div className="relative flex-1 sm:w-56">
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
      </div>

      {/* AI Intelligence Analysis Panel */}
      {isAiPanelOpen && (
        <div className="p-3.5 bg-slate-950/90 rounded-xl border border-amber-500/40 space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>POLAR-AI TACTICAL SITUATION REPORT</span>
              <span className="text-[10px] px-2 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800">
                GEMINI 2.5 FLASH
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onOpenApiKeyModal && (
                <button
                  type="button"
                  onClick={onOpenApiKeyModal}
                  className="text-slate-400 hover:text-amber-300 flex items-center gap-1 text-[11px]"
                  title="Configure Gemini API Key"
                >
                  <Key className="w-3 h-3 text-amber-400" />
                  <span>Configure Key</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAiPanelOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                ✕
              </button>
            </div>
          </div>

          {aiLoading ? (
            <div className="flex items-center gap-3 py-3 text-amber-300">
              <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              <span>Synthesizing recent convoy transmissions, blizzard vectors, and crevasse anomalies...</span>
            </div>
          ) : aiError ? (
            <div className="p-3 bg-rose-950/60 rounded-lg border border-rose-800 text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>AI Intelligence Notice:</span>
              </div>
              <p className="text-[11px]">{aiError}</p>
              {onOpenApiKeyModal && (
                <button
                  type="button"
                  onClick={onOpenApiKeyModal}
                  className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded text-xs flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Enter Gemini API Key in Settings</span>
                </button>
              )}
            </div>
          ) : aiAnalysis ? (
            <div className="space-y-2 text-slate-200">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 whitespace-pre-wrap leading-relaxed text-[11px] max-h-60 overflow-y-auto font-mono text-slate-200">
                {aiAnalysis}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Synthesized with authoritative polar operations telemetry</span>
                </span>
                <button
                  type="button"
                  onClick={handleRunAiEvaluation}
                  className="text-amber-400 hover:text-amber-300 underline"
                >
                  Re-evaluate
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

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
