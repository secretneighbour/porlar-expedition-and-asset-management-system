import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare state: State;
  declare props: Props;
  declare setState: React.Component<Props, State>['setState'];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const msg = error?.message || String(error || '');
    if (
      msg.includes('Permission denied') ||
      msg.includes('$$typeof') ||
      msg.includes('cross-origin') ||
      msg.includes('Should not already be working') ||
      msg.includes('WebSocket') ||
      msg.includes('websocket')
    ) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const msg = error?.message || String(error || '');
    if (
      msg.includes('Permission denied') ||
      msg.includes('$$typeof') ||
      msg.includes('cross-origin') ||
      msg.includes('Should not already be working') ||
      msg.includes('WebSocket') ||
      msg.includes('websocket')
    ) {
      this.setState({ hasError: false, error: null });
      return;
    }
    console.warn('Caught application boundary error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100 tracking-tight">POLAR-OS Recovered</h2>
              <p className="text-xs text-slate-400">
                A non-critical system event occurred. Polar telemetry state remains intact.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 bg-slate-950 border border-slate-800/80 rounded text-left overflow-x-auto text-[11px] font-mono text-slate-400 max-h-24">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-initialize Telemetry Canvas
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
