import React from 'react';
import { Search, Plus, X, ChevronRight } from 'lucide-react';
import { FONT_BODY, FONT_HEAD, badgeColors } from '../../data/polarisData';

export function Badge({ status, t }: { status: string; t: any }) {
  const c = badgeColors(status, t);
  return (
    <span
      style={{
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.fg}33`,
        fontFamily: FONT_BODY,
      }}
      className="px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1 shadow-sm"
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.fg }} />
      {status}
    </span>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  t,
  accent,
}: {
  icon: any;
  label: string;
  value: any;
  sub?: string;
  t: any;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: accent
          ? '1px solid rgba(196, 181, 253, 0.35)'
          : '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '20px',
        boxShadow: accent
          ? '0 15px 35px rgba(124, 58, 237, 0.25)'
          : '0 15px 35px rgba(0, 0, 0, 0.35)',
      }}
      className="p-4.5 flex flex-col gap-3 min-w-0 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between">
        <span
          style={{ color: '#C9C1E8', fontFamily: FONT_BODY }}
          className="text-xs uppercase font-semibold tracking-wider"
        >
          {label}
        </span>
        <div
          style={{
            background: accent
              ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.35), rgba(96, 165, 250, 0.25))'
              : 'rgba(255, 255, 255, 0.05)',
            color: accent ? '#C4B5FD' : '#C9C1E8',
            border: '1px solid rgba(196, 181, 253, 0.2)',
          }}
          className="w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
        >
          <Icon size={16} />
        </div>
      </div>
      <div
        style={{ color: '#F5F3FF', fontFamily: FONT_HEAD }}
        className="text-2xl sm:text-3xl font-bold tracking-tight"
      >
        {value}
      </div>
      {sub && (
        <div style={{ color: '#A78BFA' }} className="text-xs font-medium">
          {sub}
        </div>
      )}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  t,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  t: any;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(15, 8, 35, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(30, 18, 64, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(196, 181, 253, 0.28)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
        }}
        className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[85vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}
          className="flex items-center justify-between px-6 py-4.5 sticky top-0 bg-inherit z-10 backdrop-blur-md"
        >
          <h3
            style={{ color: '#F5F3FF', fontFamily: FONT_HEAD }}
            className="text-lg font-bold"
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{ color: '#C9C1E8' }}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  t,
}: {
  label: string;
  children: React.ReactNode;
  t: any;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span style={{ color: '#C9C1E8', fontFamily: FONT_BODY }} className="text-xs font-semibold">
        {label}
      </span>
      {children}
    </label>
  );
}

export function inputStyle(t: any) {
  return {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(196, 181, 253, 0.22)',
    color: '#F5F3FF',
    fontFamily: FONT_BODY,
    borderRadius: '14px',
  };
}

export const inputClass =
  'px-3.5 py-2.5 rounded-xl text-sm outline-none w-full transition-all focus:border-[#C4B5FD] focus:ring-2 focus:ring-[#7C3AED]/30';

export function Toolbar({
  t,
  search,
  setSearch,
  onAdd,
  addLabel,
  extra,
}: {
  t: any;
  search: string;
  setSearch: (s: string) => void;
  onAdd?: (() => void) | null;
  addLabel?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(196, 181, 253, 0.22)',
          borderRadius: '14px',
        }}
        className="flex items-center gap-2.5 px-3.5 py-2 flex-1 min-w-[220px]"
      >
        <Search size={15} color="#A78BFA" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search operations, personnel, assets..."
          style={{ color: '#F5F3FF', fontFamily: FONT_BODY }}
          className="outline-none bg-transparent text-sm w-full placeholder:text-[#C9C1E8]/50"
        />
      </div>
      {extra}
      {onAdd && (
        <button
          onClick={onAdd}
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #60A5FA)',
            boxShadow: '0 10px 25px rgba(124, 58, 237, 0.38)',
            color: '#fff',
            fontFamily: FONT_BODY,
            borderRadius: '14px',
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> {addLabel || 'Add'}
        </button>
      )}
    </div>
  );
}

export function Table({
  t,
  columns,
  rows,
  onRowClick,
}: {
  t: any;
  columns: Array<{ key: string; label: string; render?: (r: any) => React.ReactNode }>;
  rows: any[];
  onRowClick?: (r: any) => void;
}) {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
      }}
      className="overflow-x-auto"
    >
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr
            style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(21, 11, 46, 0.45)',
            }}
          >
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ color: '#C9C1E8', fontFamily: FONT_BODY }}
                className="text-left font-semibold px-4.5 py-3.5 whitespace-nowrap text-xs uppercase tracking-wider"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick && onRowClick(row)}
              style={{
                borderBottom:
                  i === rows.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: onRowClick ? 'pointer' : 'default',
              }}
              className="hover:bg-purple-500/10 transition-colors"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  style={{ color: '#F5F3FF', fontFamily: FONT_BODY }}
                  className="px-4.5 py-3.5 align-middle"
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{ color: '#A78BFA' }}
                className="px-4 py-10 text-center text-sm font-medium"
              >
                No operational records match your search criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  t,
  action,
}: {
  title: string;
  subtitle?: string;
  t: any;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        <h1
          style={{ color: '#F5F3FF', fontFamily: FONT_HEAD }}
          className="text-2xl font-bold tracking-tight"
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: '#C9C1E8' }} className="text-sm mt-1 max-w-xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function ReadinessBar({
  label,
  value,
  t,
}: {
  label: string;
  value: number;
  t: any;
}) {
  return (
    <div className="flex items-center gap-3">
      <span style={{ color: '#C9C1E8', fontFamily: FONT_BODY }} className="text-xs w-24 shrink-0 font-medium">
        {label}
      </span>
      <div
        style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px' }}
        className="flex-1 h-2 overflow-hidden"
      >
        <div
          style={{
            width: `${value}%`,
            background: value > 80 ? '#5EEAB0' : value > 60 ? '#FBBF24' : '#F43F5E',
          }}
          className="h-full rounded-full transition-all duration-300"
        />
      </div>
      <span style={{ color: '#F5F3FF', fontFamily: FONT_BODY }} className="text-xs w-9 text-right font-bold">
        {value}%
      </span>
    </div>
  );
}

