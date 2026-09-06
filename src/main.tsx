import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Gracefully prevent benign dev-server WebSocket / HMR disconnection warnings & cross-origin browser extension errors from bubbling up
if (typeof window !== 'undefined') {
  const isIgnoredError = (msg: string) => {
    const text = String(msg || '');
    return (
      text.includes('WebSocket') ||
      text.includes('websocket') ||
      text.includes('closed without opened') ||
      text.includes('failed to connect to websocket') ||
      text.includes('Permission denied') ||
      text.includes('$$typeof') ||
      text.includes('cross-origin') ||
      text.includes('Should not already be working')
    );
  };

  const origConsoleError = console.error;
  console.error = (...args: any[]) => {
    const msg = args.map(a => (typeof a === 'string' ? a : a?.message || String(a || ''))).join(' ');
    if (isIgnoredError(msg)) {
      return;
    }
    origConsoleError.apply(console, args);
  };

  window.onerror = function (message, source, lineno, colno, error) {
    const msg = String(message || error?.message || '');
    if (isIgnoredError(msg)) {
      return true;
    }
    return false;
  };

  window.onunhandledrejection = function (event) {
    const reason = event?.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || String(reason || '');
    if (isIgnoredError(msg)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return true;
    }
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || String(reason || '');
    if (isIgnoredError(msg)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    const filename = event?.filename || '';
    if (isIgnoredError(msg) || filename.includes('extension://') || filename.includes('moz-extension://')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


