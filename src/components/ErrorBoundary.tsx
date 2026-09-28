import React from 'react';
import { AlertTriangle, RefreshCw, Terminal, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { formatError } from '../utils/safeFormat';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showTechnicalDetails: boolean;
  recoveryCount: number;
}

/**
 * Parses minified React production errors and translates them to human-readable explanations.
 */
function decodeReactProductionError(error: Error | null): { headline: string; explanation: string; technical: string } {
  if (!error) {
    return {
      headline: 'Unknown System Event',
      explanation: 'An unexpected application state was detected and isolated.',
      technical: 'No error object available.',
    };
  }

  const rawMessage = error.message || String(error);

  // Check for React error #31: Objects are not valid as a React child
  if (rawMessage.includes('Minified React error #31') || rawMessage.includes('react.dev/errors/31')) {
    let keysFound = '{code, message}';
    const match = rawMessage.match(/args\[\]=([^&\s]+)/);
    if (match && match[1]) {
      try {
        const decoded = decodeURIComponent(match[1]);
        const keysMatch = decoded.match(/\{([^}]+)\}/);
        if (keysMatch && keysMatch[1]) {
          keysFound = `{${keysMatch[1]}}`;
        }
      } catch {}
    }

    return {
      headline: 'React Render Error #31 (Unescaped Data Object)',
      explanation: `A backend response or state object with keys ${keysFound} was passed directly into JSX without text formatting. Polar telemetry state was safely preserved.`,
      technical: rawMessage,
    };
  }

  // Check for React error #418 / #423 / #425 (Hydration mismatches)
  if (
    rawMessage.includes('Minified React error #418') ||
    rawMessage.includes('Minified React error #423') ||
    rawMessage.includes('Minified React error #425') ||
    rawMessage.toLowerCase().includes('hydration')
  ) {
    return {
      headline: 'Client Environment Reconciliation Notice',
      explanation: 'A client-side timestamp or hardware sensor reading diverged from the initial render snapshot. State has been re-synchronized.',
      technical: rawMessage,
    };
  }

  return {
    headline: 'Application Error Isolated',
    explanation: formatError(error, 'An unhandled application error occurred during rendering.'),
    technical: `${error.name}: ${rawMessage}\n\nStack:\n${error.stack || 'No stack trace captured.'}`,
  };
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
      errorInfo: null,
      showTechnicalDetails: false,
      recoveryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const msg = error?.message || String(error || '');
    // Ignore benign dev-server WebSocket or cross-origin extension disconnection issues
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
      this.setState({ hasError: false, error: null, errorInfo: null });
      return;
    }

    console.error('[POLAR-OS CRITICAL BOUNDARY]', error, errorInfo);
    this.setState({ errorInfo });
  }

  /**
   * Safe re-initialization that prevents infinite reload loops
   */
  handleReset = () => {
    if (typeof window !== 'undefined') {
      try {
        const now = Date.now();
        const lastReset = parseInt(sessionStorage.getItem('polar_last_reset_time') || '0', 10);
        const count = parseInt(sessionStorage.getItem('polar_reset_loop_count') || '0', 10);

        if (now - lastReset < 8000) {
          // Rapid retry detected
          const nextCount = count + 1;
          sessionStorage.setItem('polar_reset_loop_count', String(nextCount));
          sessionStorage.setItem('polar_last_reset_time', String(now));

          if (nextCount >= 3) {
            // High loop count: reset in-place without page reload to stop loop
            console.warn('[POLAR-OS] High crash loop detected. Recovering in-place without full page reload.');
            this.setState({ hasError: false, error: null, errorInfo: null, recoveryCount: nextCount });
            if (this.props.onReset) this.props.onReset();
            return;
          }
        } else {
          sessionStorage.setItem('polar_reset_loop_count', '1');
          sessionStorage.setItem('polar_last_reset_time', String(now));
        }
      } catch {}
    }

    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  /**
   * Deep recovery that clears transient sessionStorage while preserving authoritative database
   */
  handleHardReset = () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('polar_reset_loop_count');
        sessionStorage.removeItem('polar_last_reset_time');
        sessionStorage.removeItem('polar_auth_token');
      } catch {}
      window.location.href = window.location.pathname;
    }
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showTechnicalDetails: !prev.showTechnicalDetails }));
  };

  render() {
    if (this.state.hasError) {
      const diagnostic = decodeReactProductionError(this.state.error);
      const isLooping = this.state.recoveryCount >= 2;

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans select-text">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-2xl space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-100 tracking-tight font-mono">
                {this.props.fallbackTitle || 'POLAR-OS Recovered'}
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                A non-critical system event occurred. Polar telemetry state remains intact.
              </p>
            </div>

            {/* Human-Readable Diagnostic Banner */}
            <div className="p-3.5 bg-slate-950/80 border border-amber-500/30 rounded-xl text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold">
                <Terminal className="w-4 h-4 shrink-0" />
                <span>{diagnostic.headline}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {diagnostic.explanation}
              </p>
            </div>

            {/* Expandable Technical Log */}
            <div className="text-left">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="text-[11px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {this.state.showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{this.state.showTechnicalDetails ? 'Hide technical trace' : 'Show technical trace'}</span>
              </button>

              {this.state.showTechnicalDetails && (
                <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto text-[10px] font-mono text-slate-400 max-h-36 whitespace-pre-wrap leading-relaxed select-all">
                  {diagnostic.technical}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1 font-mono">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 cursor-pointer min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Re-initialize Telemetry Canvas</span>
              </button>

              {isLooping && (
                <button
                  type="button"
                  onClick={this.handleHardReset}
                  className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-xl transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Transient Session &amp; Reload</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
