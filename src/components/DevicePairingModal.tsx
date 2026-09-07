import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Smartphone, 
  Laptop, 
  Copy, 
  Check, 
  QrCode, 
  Wifi, 
  ShieldAlert, 
  ExternalLink,
  Radio,
  X,
  Zap,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow
} from 'lucide-react';
import { ConnectedDevice } from '../types';

interface DevicePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedClients: number;
  connectedDevices: ConnectedDevice[];
  currentDeviceId: string;
  currentDeviceType: 'laptop_hq' | 'mobile_field';
  onSwitchDeviceRole: (role: 'laptop_hq' | 'mobile_field') => void;
  onSimulateDistress: () => void;
}

export const DevicePairingModal: React.FC<DevicePairingModalProps> = ({
  isOpen,
  onClose,
  connectedClients,
  connectedDevices,
  currentDeviceId,
  currentDeviceType,
  onSwitchDeviceRole,
  onSimulateDistress,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      setCurrentUrl(url);

      QRCode.toDataURL(url, {
        width: 240,
        margin: 1.5,
        color: {
          dark: '#020617',
          light: '#f8fafc',
        },
      })
        .then((dataUrl) => setQrCodeDataUrl(dataUrl))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [isOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 font-mono text-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-950 border border-sky-600 text-sky-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                  REAL-TIME MULTI-DEVICE SYNC
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[9px] font-bold">
                  {connectedClients} {connectedClients === 1 ? 'TERMINAL ACTIVE' : 'TERMINALS ACTIVE'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white font-display uppercase tracking-wide">
                PAIR PHONE WITH RESEARCH CENTER LAPTOP
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-300">
          
          {/* Instructions Box */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
            <p className="text-slate-200">
              <strong>Scan the QR code</strong> below with your mobile phone camera, or copy the link to open this console on your phone over mobile data / Wi-Fi.
            </p>
            <p className="text-slate-400">
              Once connected, your phone acts as a remote field beacon: any distress signal broadcast from your phone immediately rings the audio alarm and updates the map on this laptop console in real time!
            </p>
          </div>

          {/* QR Code & Direct Link Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
            
            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-inner mx-auto">
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="Scan to open on mobile phone" 
                  className="w-44 h-44 rounded-lg block" 
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-slate-500">
                  Generating QR Code...
                </div>
              )}
              <span className="text-[10px] text-slate-800 font-bold mt-2">
                SCAN WITH MOBILE CAMERA
              </span>
            </div>

            {/* Direct Link & Copy */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                  DIRECT CONSOLE URL:
                </label>
                <div className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-sky-300 break-all select-all font-mono">
                  {currentUrl}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors shadow"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>COPIED TO CLIPBOARD!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>COPY LINK TO OPEN ON PHONE</span>
                  </>
                )}
              </button>

              <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero login needed. State synchronizes instantly via WebSocket.</span>
              </div>
            </div>
          </div>

          {/* Active Connected Devices Roster */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                ACTIVE TERMINALS ROSTER ({connectedDevices.length}):
              </span>
              <span className="text-[10px] text-slate-500">
                PINGS EVERY 3s
              </span>
            </div>

            <div className="space-y-1.5">
              {connectedDevices.map((dev) => {
                const isCurrent = dev.id === currentDeviceId;
                const isMobile = dev.type === 'mobile_field';
                return (
                  <div
                    key={dev.id}
                    className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                      isCurrent
                        ? 'bg-sky-950/40 border-sky-600/70 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded ${isMobile ? 'bg-rose-950 text-rose-400' : 'bg-sky-950 text-sky-400'}`}>
                        {isMobile ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">{dev.name}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-900 text-sky-300 text-[9px] font-bold">
                              THIS DEVICE
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          ID: {dev.id.slice(0, 12)}... {dev.ip ? `// IP: ${dev.ip}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Battery Status Badge for Connected Node */}
                      {typeof dev.batteryLevel === 'number' ? (
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold border ${
                            dev.isCharging
                              ? 'bg-amber-950/80 border-amber-600/80 text-amber-300'
                              : dev.batteryLevel <= 20
                              ? 'bg-rose-950/80 border-rose-600/80 text-rose-300 animate-pulse'
                              : dev.batteryLevel <= 40
                              ? 'bg-amber-950/60 border-amber-700/60 text-amber-300'
                              : 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                          }`}
                          title={dev.isCharging ? `Charging (${dev.batteryLevel}%)` : `Hardware Battery: ${dev.batteryLevel}%`}
                        >
                          {dev.isCharging ? (
                            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          ) : dev.batteryLevel > 70 ? (
                            <BatteryFull className="w-3.5 h-3.5 text-emerald-400" />
                          ) : dev.batteryLevel > 30 ? (
                            <BatteryMedium className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <BatteryLow className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                          )}
                          <span>{dev.batteryLevel}%</span>
                          {dev.isCharging && <span className="text-[8px] text-amber-400 uppercase font-black">⚡</span>}
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400"
                          title="Connected to AC Line / Wall Power"
                        >
                          <Zap className="w-3 h-3 text-sky-400" />
                          <span>AC MAIN</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>ONLINE</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {connectedDevices.length <= 1 && (
                <div className="p-2.5 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 text-slate-500 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-600" />
                    <span className="text-[11px] italic">
                      Waiting for Mobile Phone to join... Scan QR code above to connect.
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-600">OFFLINE</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Simulation Trigger */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left space-y-0.5">
              <span className="text-white font-bold text-xs block">
                Want to test Mayday without opening a phone?
              </span>
              <span className="text-slate-400 text-[10px]">
                Triggers a simulated field mobile phone Mayday to test the laptop alarm and radar lock.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onSimulateDistress();
                onClose();
              }}
              className="py-1.5 px-3 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-[11px] uppercase whitespace-nowrap flex items-center gap-1.5 transition-colors border border-rose-500"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>TEST MAYDAY ALARM</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Current Role:</span>
            <button
              type="button"
              onClick={() => onSwitchDeviceRole(currentDeviceType === 'laptop_hq' ? 'mobile_field' : 'laptop_hq')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-[10px] border border-slate-700 transition-colors"
            >
              SWITCH TO {currentDeviceType === 'laptop_hq' ? 'MOBILE FIELD MODE' : 'LAPTOP HQ MODE'}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase transition-colors"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
};
