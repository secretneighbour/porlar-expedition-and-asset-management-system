import React from 'react';
import {
  FileText, CheckCircle2, Download, RotateCcw, X, ShieldCheck,
  Zap, AlertTriangle, Clock, Activity, Award, BarChart3, CornerDownRight, ArrowRight
} from 'lucide-react';
import { SimulationReport } from '../../types';
import { Modal } from './SharedUI';

export interface SimulationReportModalProps {
  t: any;
  isOpen?: boolean;
  report: SimulationReport | null;
  onClose: () => void;
  onReplay?: () => void;
  onExit?: () => void;
  onReplayScenario?: () => void;
  onExitSimulation?: () => void;
}

export function SimulationReportModal({
  t,
  isOpen = true,
  report,
  onClose,
  onReplay,
  onExit,
  onReplayScenario,
  onExitSimulation
}: SimulationReportModalProps) {
  if (!isOpen || !report) return null;

  const handleReplay = onReplay || onReplayScenario || (() => {});
  const handleExit = onExit || onExitSimulation || (() => {});

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Polaris_Simulation_AAR_${report.scenarioId}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <Modal
      t={t}
      title="Mission After-Action Report (AAR)"
      onClose={onClose}
    >
      <div className="space-y-6 font-mono text-xs max-h-[80vh] overflow-y-auto pr-1">
        {/* Top Header Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(16, 185, 129, 0.15))',
            borderColor: 'rgba(245, 158, 11, 0.4)'
          }}
          className="p-5 rounded-2xl border flex items-center justify-between gap-4 flex-wrap"
        >
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-white">{report.scenarioName}</h3>
            </div>
            <p className="text-slate-400 text-[11px] mt-1">
              Mission Duration: <strong className="text-white">{report.durationFormatted}</strong> (Sim Speed: {report.speed}×) • Completed: {report.completedAt}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Operational Readiness Grade</span>
            <span className="text-xl font-black text-emerald-400 font-mono tracking-wider">
              {report.performanceGrade}
            </span>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
            <span className="text-slate-400 block text-[10px] uppercase">Events Processed</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{report.totalEventsTriggered}</span>
            <span className="text-[10px] text-amber-400">{report.manualInjectionsCount} manual injections</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
            <span className="text-slate-400 block text-[10px] uppercase">AI Action Decisions</span>
            <span className="text-lg font-bold text-cyan-400 mt-0.5 block">
              {report.aiActionsByLevel.observe + report.aiActionsByLevel.assist + report.aiActionsByLevel.autonomous}
            </span>
            <span className="text-[10px] text-emerald-400">{report.aiActionsByLevel.autonomous} Autonomous Zero-Click</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
            <span className="text-slate-400 block text-[10px] uppercase">Downtime Averted</span>
            <span className="text-lg font-bold text-emerald-400 mt-0.5 block">+{report.downtimeSavedHours}h</span>
            <span className="text-[10px] text-slate-400">Scheduled shop swap</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
            <span className="text-slate-400 block text-[10px] uppercase">Recovery Cost Saved</span>
            <span className="text-lg font-bold text-emerald-400 mt-0.5 block">${report.costSavedUsd.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">Traverse stranding averted</span>
          </div>
        </div>

        {/* AI Action Safety Level Breakdown */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" /> AI Safety Classification Matrix
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300 font-bold">1. OBSERVE</span>
                <span className="text-slate-400 font-bold">{report.aiActionsByLevel.observe} events</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Passive monitoring of cold-soak rates, barometric shifts, and sastrugi drift.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-cyan-300 font-bold">2. ASSIST</span>
                <span className="text-cyan-400 font-bold">{report.aiActionsByLevel.assist} events</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Formulated predictive maintenance recommendations for human confirmation.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-emerald-300 font-bold">3. AUTONOMOUS</span>
                <span className="text-emerald-400 font-bold">{report.aiActionsByLevel.autonomous} events</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Zero-click S.A.R. dispatch, dynamic fuel buffer elevation, and CV route push.
              </p>
            </div>
          </div>
        </div>

        {/* Chronological Event Log Summary */}
        <div className="space-y-2">
          <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" /> Detailed Sequence Logbook
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto p-1">
            {report.timelineLog.map((evt, idx) => (
              <div
                key={evt.id + idx}
                className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-[11px]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-bold">{evt.timeFormatted}</span>
                  <span className="text-white font-medium">{evt.title}</span>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                  evt.safetyLevel === 'AUTONOMOUS'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    : evt.safetyLevel === 'ASSIST'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {evt.safetyLevel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 flex-wrap gap-2">
          <button
            onClick={handleExportJson}
            className="px-4 py-2 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 flex items-center gap-2 cursor-pointer transition-all text-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export AAR (JSON)</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                handleReplay();
              }}
              style={{ borderColor: 'rgba(56, 189, 248, 0.4)' }}
              className="px-4 py-2 rounded-xl border text-cyan-300 hover:bg-cyan-500/15 flex items-center gap-2 cursor-pointer transition-all text-xs font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay Scenario</span>
            </button>

            <button
              onClick={() => {
                onClose();
                handleExit();
              }}
              style={{
                background: t.btnGradient,
                boxShadow: t.btnShadow,
                color: '#FFFFFF'
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold font-mono tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:opacity-90"
            >
              <span>Exit to Live Operations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
