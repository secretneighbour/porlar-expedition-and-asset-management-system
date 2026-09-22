import React, { useState, useEffect } from 'react';
import {
  ChevronRight, ChevronDown, Bell, Sun, Moon, LogOut, Terminal,
  Radio, Key, QrCode, ShieldAlert, Volume2, VolumeX, Monitor,
  Cpu, Wifi, WifiOff, ThermometerSnowflake, Wind, Gauge, Sparkles, Target
} from 'lucide-react';
import { FONT_HEAD, FONT_BODY, NAV_SECTIONS, STATIONS } from '../../data/polarisData';

export function Sidebar({
  t,
  theme,
  active,
  setActive,
  allowed,
  collapsed,
  setCollapsed,
  unreadAlerts = 0,
  hasActiveDistress = false,
}: {
  t: any;
  theme: string;
  active: string;
  setActive: (a: string) => void;
  allowed: string[];
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  unreadAlerts?: number;
  hasActiveDistress?: boolean;
}) {
  // Collapsible section state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside
      style={{
        background: t.sidebar || 'rgba(6, 12, 27, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        width: collapsed ? 72 : 256,
        borderRight: `1px solid ${t.border}`,
      }}
      className="shrink-0 h-screen sticky top-0 flex flex-col transition-all duration-200 overflow-hidden z-20 select-none shadow-2xl font-mono"
    >
      {/* Brand Header */}
      <div 
        style={{ borderBottom: `1px solid ${t.border}` }}
        className="flex items-center gap-3 px-4 py-4 shrink-0 bg-black/20"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 shrink-0 drop-shadow-[0_0_10px_rgba(0,242,254,0.4)]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="sidebarLogoGrad" x1="0" y1="0" x2="24" y2="24">
              <stop offset="0%" stopColor={t.accent || "#00F2FE"} />
              <stop offset="100%" stopColor={t.blue || "#38BDF8"} />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="11" stroke="url(#sidebarLogoGrad)" strokeWidth="1.6" />
          <path
            d="M12 2v20M2 12h20M4.5 4.5l15 15M19.5 4.5l-15 15"
            stroke="url(#sidebarLogoGrad)"
            strokeWidth="1.1"
            opacity="0.6"
          />
          <circle cx="12" cy="12" r="3.2" fill="url(#sidebarLogoGrad)" />
        </svg>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span
              style={{ color: t.text, fontFamily: FONT_HEAD }}
              className="font-bold text-sm tracking-tight leading-tight uppercase truncate"
            >
              Polaris Ops
            </span>
            <span style={{ color: t.accent }} className="text-[10px] uppercase font-mono tracking-wider font-semibold">
              Command Console
            </span>
          </div>
        )}
      </div>

      {/* Grouped Nav List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 text-xs" aria-label="Main Navigation">
        {NAV_SECTIONS.map((sec) => {
          // Filter section items allowed for current user role
          const visibleItems = sec.items.filter(item => allowed.includes(item.key));
          if (visibleItems.length === 0) return null;

          const isSecCollapsed = Boolean(collapsedSections[sec.title]);

          return (
            <div key={sec.title} className="space-y-1">
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleSection(sec.title)}
                  style={{ color: t.textFaint }}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors cursor-pointer"
                >
                  <span>{sec.title}</span>
                  <ChevronDown
                    size={11}
                    className={`transition-transform duration-150 ${isSecCollapsed ? '-rotate-90' : ''}`}
                  />
                </button>
              )}

              {(!isSecCollapsed || collapsed) && (
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.key;
                    const isMayday = item.key === 'sar' && hasActiveDistress;
                    const isAlerts = item.key === 'alerts' && unreadAlerts > 0;

                    return (
                      <button
                        key={item.key}
                        onClick={() => setActive(item.key)}
                        style={{
                          background: isActive
                            ? (t.accentSoft || 'rgba(0, 242, 254, 0.15)')
                            : isMayday
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'transparent',
                          border: isActive
                            ? `1px solid ${t.borderLight || t.accent}`
                            : isMayday
                            ? '1px solid rgba(239, 68, 68, 0.5)'
                            : '1px solid transparent',
                          color: isActive ? (t.text || '#FFFFFF') : t.textDim,
                          boxShadow: isActive ? (t.btnShadow || '0 0 15px rgba(0, 242, 254, 0.2)') : 'none',
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer hover:bg-white/5 hover:text-white group ${isMayday ? 'animate-pulse' : ''}`}
                        title={item.label}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            size={15}
                            style={{ color: isActive ? t.accent : isMayday ? '#EF4444' : t.textFaint }}
                            className={`shrink-0 transition-transform duration-150 ${
                              isActive ? 'scale-110' : 'group-hover:scale-110'
                            }`}
                          />
                          {!collapsed && (
                            <span style={{ fontFamily: FONT_BODY }} className="truncate font-medium">
                              {item.label}
                            </span>
                          )}
                        </div>

                        {!collapsed && (
                          <div className="flex items-center gap-1 shrink-0">
                            {item.badge && !isActive && (
                              <span
                                style={{
                                  background: item.badge === 'LIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                                  color: item.badge === 'LIVE' ? '#10B981' : t.accent,
                                  border: `1px solid ${item.badge === 'LIVE' ? 'rgba(16, 185, 129, 0.3)' : t.border}`,
                                }}
                                className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold"
                              >
                                {item.badge}
                              </span>
                            )}
                            {isAlerts && (
                              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                                {unreadAlerts}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{ color: t.textDim, borderTop: `1px solid ${t.border}`, background: 'rgba(0,0,0,0.2)' }}
        className="px-3.5 py-3 text-xs flex items-center justify-between cursor-pointer hover:text-white hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2">
          <ChevronRight size={14} className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} />
          {!collapsed && <span className="text-[11px] font-mono uppercase">Minimize Console</span>}
        </span>
      </button>
    </aside>
  );
}

export function Topbar({
  t,
  theme,
  setTheme,
  user,
  onLogout,
  unread,
  setActive,
  onOpenPreBoot,
  onOpenPairing,
  onOpenApiKey,
  onTriggerMayday,
  syncStatus = 'synced',
  connectedClients = 1,
  currentDeviceId = 'NODE-01',
  selectedStation = 'Maitri',
  onSelectStation,
  crtEnabled = false,
  onToggleCrt,
  soundEnabled = true,
  onToggleSound,
  hasActiveDistress = false,
  isSimulationActive = false,
  onOpenSimulation,
}: {
  t: any;
  theme: string;
  setTheme: (s: string) => void;
  user: any;
  onLogout: () => void;
  unread: number;
  setActive: (a: string) => void;
  onOpenPreBoot: () => void;
  onOpenPairing?: () => void;
  onOpenApiKey?: () => void;
  onTriggerMayday?: () => void;
  syncStatus?: 'synced' | 'connecting' | 'offline';
  connectedClients?: number;
  currentDeviceId?: string;
  selectedStation?: string;
  onSelectStation?: (st: string) => void;
  crtEnabled?: boolean;
  onToggleCrt?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  hasActiveDistress?: boolean;
  isSimulationActive?: boolean;
  onOpenSimulation?: () => void;
}) {
  const [timeStr, setTimeStr] = useState<string>('');
  const [utcStr, setUtcStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
      setUtcStr(now.toISOString().slice(11, 19) + ' UTC');
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const cycleTheme = () => {
    if (theme === 'cyan' || theme === 'dark') setTheme('green');
    else if (theme === 'green') setTheme('amber');
    else setTheme('cyan');
  };

  const themeDisplay = (theme === 'green') ? 'GRN' : (theme === 'amber') ? 'AMB' : 'CYAN';

  return (
    <header
      style={{
        background: t.panelAlt || 'rgba(10, 17, 40, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${t.border}`,
      }}
      className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-2.5 gap-3 font-mono text-xs select-none"
    >
      {/* Left: Station Context & Telemetry Badges */}
      <div className="flex items-center gap-3 flex-wrap min-w-0">
        {/* Station Selector */}
        <div className="flex items-center gap-1.5">
          <span style={{ color: t.textFaint }} className="text-[10px] uppercase hidden sm:inline">Station:</span>
          {onSelectStation ? (
            <select
              value={selectedStation}
              onChange={(e) => onSelectStation(e.target.value)}
              style={{
                background: t.bgAlt || 'rgba(0, 242, 254, 0.05)',
                border: `1px solid ${t.borderLight || t.border}`,
                color: t.accent || '#00F2FE',
              }}
              className="px-2 py-0.5 rounded text-xs font-bold font-mono outline-none cursor-pointer"
            >
              {STATIONS.map((s) => (
                <option key={s.id} value={s.name} className="bg-slate-900 text-white">
                  {s.name} Station ({s.region})
                </option>
              ))}
            </select>
          ) : (
            <span style={{ color: t.accent }} className="font-bold text-xs">{selectedStation}</span>
          )}
        </div>

        <span style={{ color: t.border }}>|</span>

        {/* Environmental Ambient */}
        <div className="hidden lg:flex items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1 text-cyan-400 font-semibold" title="AWOS Ambient Temperature">
            <ThermometerSnowflake size={13} className="text-cyan-400 animate-pulse" />
            <span>-48.2°C</span>
          </span>
          <span className="flex items-center gap-1 text-sky-300" title="Katabatic Surface Wind">
            <Wind size={13} />
            <span>45kt SW</span>
          </span>
          <span className="flex items-center gap-1 text-slate-400" title="Surface Barometric Pressure">
            <Gauge size={13} />
            <span>978 hPa</span>
          </span>
        </div>

        <span style={{ color: t.border }} className="hidden lg:inline">|</span>

        {/* SATCOM & WebSocket Health */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold">
            {syncStatus === 'synced' ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi size={12} />
                <span className="text-[10px]">SATCOM SYNC</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 animate-pulse">
                <WifiOff size={12} />
                <span className="text-[10px]">OFFLINE CACHE</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline" title="Connected Field Terminals">
            ({connectedClients} {connectedClients === 1 ? 'Node' : 'Nodes'})
          </span>
        </div>

        <span style={{ color: t.border }} className="hidden xl:inline">|</span>

        {/* AI Health */}
        <div className="hidden xl:flex items-center gap-1 text-[10px] text-emerald-300 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <Sparkles size={11} className="text-emerald-400" />
          <span>AI 3.8 FLASH: ACTIVE</span>
        </div>
      </div>

      {/* Right: Actions, Diagnostics, Theme, Mayday, and Clock */}
      <div className="flex items-center gap-2 shrink-0">
        {/* UTC & Station Clock */}
        <div className="hidden md:flex flex-col text-right font-mono text-[10px] leading-tight pr-1">
          <span style={{ color: t.text }} className="font-bold">{timeStr} LOCAL</span>
          <span style={{ color: t.textFaint }}>{utcStr}</span>
        </div>

        {/* Quick Action: Training Simulation Mode */}
        {onOpenSimulation && (
          <button
            type="button"
            onClick={onOpenSimulation}
            style={{
              border: isSimulationActive ? '1px solid #F59E0B' : `1px solid ${t.border}`,
              background: isSimulationActive ? 'rgba(245, 158, 11, 0.25)' : t.bgAlt,
              color: isSimulationActive ? '#FDE68A' : t.textDim
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:text-white transition-colors cursor-pointer text-[11px] font-mono font-bold"
            title="Launch Mission Simulation & Training Sandbox"
          >
            <Target size={13} style={{ color: isSimulationActive ? '#F59E0B' : t.accent }} className={isSimulationActive ? 'animate-pulse' : ''} />
            <span className="hidden sm:inline">{isSimulationActive ? 'SIM ACTIVE' : 'SIMULATION'}</span>
          </button>
        )}

        {/* Quick Action: Device Pairing */}
        {onOpenPairing && (
          <button
            type="button"
            onClick={onOpenPairing}
            style={{ border: `1px solid ${t.border}`, background: t.bgAlt }}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
            title="Pair Phone via QR Code"
          >
            <QrCode size={13} style={{ color: t.accent }} />
            <span>Pair</span>
          </button>
        )}

        {/* Quick Action: POST Diagnostics */}
        <button
          type="button"
          onClick={onOpenPreBoot}
          style={{ border: `1px solid ${t.border}`, background: t.bgAlt }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
          title="Hardware & Cryo-Sensor Pre-Boot Diagnostics"
        >
          <Terminal size={13} style={{ color: t.accent }} />
          <span className="hidden sm:inline">POST</span>
        </button>

        {/* Quick Action: API Keys */}
        {onOpenApiKey && (
          <button
            type="button"
            onClick={onOpenApiKey}
            style={{ border: `1px solid ${t.border}`, background: t.bgAlt }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Configure Gemini & Google Maps Keys"
          >
            <Key size={13} style={{ color: t.accent }} />
          </button>
        )}

        {/* Tactical Theme 1-Click Cycle */}
        <button
          type="button"
          onClick={cycleTheme}
          style={{
            border: `1px solid ${t.borderLight || t.border}`,
            background: t.accentSoft || 'rgba(0, 242, 254, 0.15)',
            color: t.accent || '#00F2FE'
          }}
          className="px-2 py-1 rounded-lg font-mono font-bold text-[10px] cursor-pointer hover:brightness-125 transition-all"
          title={`Theme: ${themeDisplay}. Click to switch theme.`}
        >
          {themeDisplay}
        </button>

        {/* CRT Scanlines Toggle */}
        {onToggleCrt && (
          <button
            type="button"
            onClick={onToggleCrt}
            style={{
              border: `1px solid ${t.border}`,
              background: crtEnabled ? 'rgba(0, 242, 254, 0.2)' : t.bgAlt,
              color: crtEnabled ? '#00F2FE' : t.textFaint
            }}
            className="p-1.5 rounded-lg cursor-pointer hover:text-white transition-colors hidden sm:block"
            title={crtEnabled ? "CRT Scanlines: ACTIVE" : "CRT Scanlines: OFF"}
          >
            <Monitor size={13} />
          </button>
        )}

        {/* Acoustic Beep Sound Toggle */}
        {onToggleSound && (
          <button
            type="button"
            onClick={onToggleSound}
            style={{ border: `1px solid ${t.border}`, background: t.bgAlt }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer hidden sm:block"
            title={soundEnabled ? "Tactical Audio: ON" : "Tactical Audio: MUTED"}
          >
            {soundEnabled ? <Volume2 size={13} style={{ color: t.accent }} /> : <VolumeX size={13} />}
          </button>
        )}

        {/* Alerts Bell */}
        <button
          type="button"
          onClick={() => setActive('alerts')}
          style={{ border: `1px solid ${t.border}`, background: t.bgAlt }}
          className="relative p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors"
          title="Tactical Alerts"
        >
          <Bell size={14} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
              {unread}
            </span>
          )}
        </button>

        {/* SOS MAYDAY Direct Emergency Button */}
        {onTriggerMayday && (
          <button
            type="button"
            onClick={onTriggerMayday}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
              hasActiveDistress
                ? 'bg-rose-600 hover:bg-rose-500 ring-2 ring-rose-400 animate-bounce'
                : 'bg-rose-700 hover:bg-rose-600 shadow-rose-950/80'
            }`}
            title="Trigger Emergency MAYDAY Broadcast"
          >
            <ShieldAlert size={14} />
            <span className="hidden sm:inline">MAYDAY</span>
          </button>
        )}

        {/* User Pill & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-700/60">
          <div
            style={{ background: t.accentSoft || 'rgba(0,242,254,0.2)', color: t.accent }}
            className="w-7 h-7 rounded-lg border border-slate-700 flex items-center justify-center font-bold text-xs"
            title={`${user.name} (${user.role})`}
          >
            {user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
          </div>
          <button
            type="button"
            onClick={onLogout}
            style={{ color: t.textDim }}
            className="p-1 hover:text-rose-400 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}

