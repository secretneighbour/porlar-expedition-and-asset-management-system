import React from 'react';
import { Search, Plus, X, ChevronRight } from 'lucide-react';
import { FONT_BODY, FONT_HEAD, badgeColors } from '../../data/polarisData';

export function Badge({ status, t }: { status: string; t: any }) {
  const c = badgeColors(status, t);
  return (
    <span style={{ background: c.bg, color: c.fg, fontFamily: FONT_BODY }} className="px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap">
      {status}
    </span>
  );
}

export function StatCard({ icon: Icon, label, value, sub, t, accent }: { icon: any; label: string; value: any; sub?: string; t: any; accent?: boolean }) {
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="rounded-xl p-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <span style={{ color: t.textDim, fontFamily: FONT_BODY }} className="text-xs uppercase tracking-wide">{label}</span>
        <div style={{ background: accent ? t.accentSoft : t.bgAlt, color: accent ? t.accent : t.textDim }} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
          <Icon size={16} />
        </div>
      </div>
      <div style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-2xl font-semibold">{value}</div>
      {sub && <div style={{ color: t.textFaint }} className="text-xs">{sub}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, t, wide }: { title: string; onClose: () => void; children: React.ReactNode; t: any; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className={`rounded-xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div style={{ borderBottom: `1px solid ${t.border}` }} className="flex items-center justify-between px-5 py-4 sticky top-0 bg-inherit z-10">
          <h3 style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} style={{ color: t.textDim }} className="p-1 rounded hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, t }: { label: string; children: React.ReactNode; t: any }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span style={{ color: t.textDim, fontFamily: FONT_BODY }}>{label}</span>
      {children}
    </label>
  );
}

export function inputStyle(t: any) {
  return { background: t.bgAlt, border: `1px solid ${t.border}`, color: t.text, fontFamily: FONT_BODY };
}

export const inputClass = "px-3 py-2 rounded-lg text-sm outline-none w-full";

export function Toolbar({ t, search, setSearch, onAdd, addLabel, extra }: { t: any; search: string; setSearch: (s: string) => void; onAdd?: (() => void) | null; addLabel?: string; extra?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[200px]">
        <Search size={15} color={t.textFaint} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ color: t.text, fontFamily: FONT_BODY, background: "transparent" }} className="outline-none bg-transparent text-sm w-full" />
      </div>
      {extra}
      {onAdd && (
        <button onClick={onAdd} style={{ background: t.accent, color: "#04222A", fontFamily: FONT_BODY }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium shrink-0 cursor-pointer">
          <Plus size={15} /> {addLabel || "Add"}
        </button>
      )}
    </div>
  );
}

export function Table({ t, columns, rows, onRowClick }: { t: any; columns: Array<{ key: string; label: string; render?: (r: any) => React.ReactNode }>; rows: any[]; onRowClick?: (r: any) => void }) {
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="rounded-xl overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr style={{ borderBottom: `1px solid ${t.border}` }}>
            {columns.map(c => <th key={c.key} style={{ color: t.textFaint, fontFamily: FONT_BODY }} className="text-left font-medium px-4 py-3 whitespace-nowrap text-xs uppercase tracking-wide">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} onClick={() => onRowClick && onRowClick(row)} style={{ borderBottom: i === rows.length - 1 ? "none" : `1px solid ${t.border}`, cursor: onRowClick ? "pointer" : "default" }} className="hover:bg-white/5 transition-colors">
              {columns.map(c => <td key={c.key} style={{ color: t.text, fontFamily: FONT_BODY }} className="px-4 py-3 align-middle">{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={columns.length} style={{ color: t.textFaint }} className="px-4 py-8 text-center text-sm">No records match your search.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function PageHeader({ title, subtitle, t, action }: { title: string; subtitle?: string; t: any; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        <h1 style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-xl font-semibold">{title}</h1>
        {subtitle && <p style={{ color: t.textDim }} className="text-sm mt-1 max-w-xl">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ReadinessBar({ label, value, t }: { label: string; value: number; t: any }) {
  return (
    <div className="flex items-center gap-3">
      <span style={{ color: t.textDim, fontFamily: FONT_BODY }} className="text-xs w-24 shrink-0">{label}</span>
      <div style={{ background: t.bgAlt }} className="flex-1 h-2 rounded-full overflow-hidden">
        <div style={{ width: `${value}%`, background: value > 80 ? t.green : value > 60 ? t.amber : t.red }} className="h-full rounded-full" />
      </div>
      <span style={{ color: t.text, fontFamily: FONT_BODY }} className="text-xs w-9 text-right">{value}%</span>
    </div>
  );
}
