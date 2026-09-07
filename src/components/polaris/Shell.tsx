import React from 'react';
import {
  Snowflake, ChevronRight, Bell, Sun, Moon, LogOut, Terminal
} from 'lucide-react';
import { FONT_HEAD, FONT_BODY, NAV } from '../../data/polarisData';

export function Sidebar({ t, theme, active, setActive, allowed, collapsed, setCollapsed }: {
  t: any; theme: string; active: string; setActive: (a: string) => void; allowed: string[]; collapsed: boolean; setCollapsed: (c: boolean) => void;
}) {
  return (
    <div style={{ background: t.sidebar, width: collapsed ? 72 : 232, borderRight: `1px solid ${t.border}` }} className="shrink-0 h-screen sticky top-0 flex flex-col transition-all duration-150 overflow-hidden z-20">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div style={{ background: t.accentSoft, color: t.accent }} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"><Snowflake size={17} /></div>
        {!collapsed && <span style={{ color: "#EAF4F8", fontFamily: FONT_HEAD }} className="font-semibold text-sm">POLARIS</span>}
      </div>
      <div className="flex-1 overflow-y-auto px-2.5 space-y-0.5">
        {NAV.filter(n => allowed.includes(n.key)).map(n => {
          const Icon = n.icon;
          const active_ = active === n.key;
          return (
            <button key={n.key} onClick={() => setActive(n.key)} style={{ background: active_ ? t.accentSoft : "transparent", color: active_ ? t.accent : "#9FB4C4" }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer hover:bg-white/5">
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span style={{ fontFamily: FONT_BODY }} className="truncate">{n.label}</span>}
            </button>
          );
        })}
      </div>
      <button onClick={() => setCollapsed(!collapsed)} style={{ color: "#7C93A8", borderTop: `1px solid ${t.border}` }} className="px-4 py-3 text-xs flex items-center gap-2 cursor-pointer hover:text-white">
        <ChevronRight size={14} className={collapsed ? "" : "rotate-180"} /> {!collapsed && "Collapse"}
      </button>
    </div>
  );
}

export function Topbar({ t, theme, setTheme, user, onLogout, unread, setActive, onOpenPreBoot }: {
  t: any; theme: string; setTheme: (s: string) => void; user: any; onLogout: () => void; unread: number; setActive: (a: string) => void; onOpenPreBoot: () => void;
}) {
  return (
    <div style={{ background: t.bg, borderBottom: `1px solid ${t.border}` }} className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 gap-4">
      <div>
        <p style={{ color: t.textFaint, fontFamily: FONT_BODY }} className="text-xs">Integrated Polar Expedition Logistics &amp; Asset Management &middot; SIH 2026</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenPreBoot}
          style={{ background: t.accentSoft, color: t.accent, border: `1px solid ${t.border}` }}
          className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110 transition-all shadow-sm"
          title="Run Pre-Boot System Check &amp; Sensor/Uplink Diagnostics"
        >
          <Terminal size={14} />
          <span className="hidden sm:inline">POST Diagnostics</span>
        </button>
        <button onClick={() => setActive("alerts")} style={{ color: t.textDim }} className="relative p-2 rounded-lg cursor-pointer hover:bg-white/5">
          <Bell size={17} />
          {unread > 0 && <span style={{ background: t.red }} className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full text-white text-[9px] flex items-center justify-center">{unread}</span>}
        </button>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ color: t.textDim }} className="p-2 rounded-lg cursor-pointer hover:bg-white/5">
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <div className="flex items-center gap-2 pl-3" style={{ borderLeft: `1px solid ${t.border}` }}>
          <div style={{ background: t.accentSoft, color: t.accent, fontFamily: FONT_HEAD }} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold">{user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}</div>
          <div className="hidden sm:block">
            <p style={{ color: t.text, fontFamily: FONT_BODY }} className="text-xs font-medium leading-tight">{user.name}</p>
            <p style={{ color: t.textFaint }} className="text-[11px] leading-tight">{user.role}</p>
          </div>
          <button onClick={onLogout} style={{ color: t.textFaint }} className="p-1.5 cursor-pointer hover:text-white"><LogOut size={15} /></button>
        </div>
      </div>
    </div>
  );
}
