import { isAllowedOrigin } from '../src/lib/cors';
import { normalizeBackendUrl } from '../src/config/api';

console.log('--- TEST 1: CORS Origins ---');
const testOrigins = [
  'https://polar-expedition.pages.dev',
  'https://staging.polar-expedition.pages.dev',
  'https://polar-api.solid.workers.dev',
  'https://my-preview-123.pages.dev',
  'https://expedition-ops.vercel.app',
  'https://tunnel-123.trycloudflare.com',
  'https://abc.ngrok-free.app',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://malicious-site.com',
];

for (const origin of testOrigins) {
  const allowed = isAllowedOrigin(origin);
  console.log(`Origin: ${origin} -> Allowed: ${allowed}`);
  if (origin.includes('pages.dev') || origin.includes('workers.dev')) {
    if (!allowed) throw new Error(`CORS check failed for ${origin}`);
  }
  if (origin.includes('malicious-site.com')) {
    if (allowed) throw new Error(`CORS check failed - allowed malicious origin ${origin}`);
  }
}

console.log('--- TEST 2: normalizeBackendUrl ---');
const urls = [
  { input: 'https://backend.example.com/', expected: 'https://backend.example.com' },
  { input: 'https://backend.example.com/api///', expected: 'https://backend.example.com/api' },
  { input: 'backend.example.com', expected: 'https://backend.example.com' },
  { input: '', expected: '' },
  { input: null, expected: '' },
];

for (const { input, expected } of urls) {
  const result = normalizeBackendUrl(input as any);
  console.log(`Input: "${input}" -> Normalized: "${result}"`);
  if (result !== expected) {
    throw new Error(`Normalization mismatch: expected "${expected}", got "${result}"`);
  }
}

console.log('--- TEST 3: apiUrl & wsUrl Resolution ---');
import { apiUrl, wsUrl, setCustomApiBaseUrl, clearCustomApiBaseUrl, PRODUCTION_CLOUDFLARE_WORKER_URL, PRODUCTION_WS_URL } from '../src/config/api';

// 3A: Production Mobile / Cloudflare Gateway Default URL
clearCustomApiBaseUrl();
const cfLogin = apiUrl('/api/auth/login');
console.log(`Default Production Cloudflare -> /api/auth/login: "${cfLogin}"`);
if (cfLogin !== `${PRODUCTION_CLOUDFLARE_WORKER_URL}/api/auth/login`) {
  throw new Error(`Expected ${PRODUCTION_CLOUDFLARE_WORKER_URL}/api/auth/login, got ${cfLogin}`);
}

const cfHealth = apiUrl('/api/health');
console.log(`Default Production Cloudflare -> /api/health: "${cfHealth}"`);
if (cfHealth !== `${PRODUCTION_CLOUDFLARE_WORKER_URL}/api/health`) {
  throw new Error(`Expected ${PRODUCTION_CLOUDFLARE_WORKER_URL}/api/health, got ${cfHealth}`);
}

const cfHeartbeat = apiUrl('/api/heartbeat');
console.log(`Default Production Cloudflare -> /api/heartbeat: "${cfHeartbeat}"`);
if (cfHeartbeat !== `${PRODUCTION_CLOUDFLARE_WORKER_URL}/api/heartbeat`) {
  throw new Error(`Expected ${PRODUCTION_CLOUDFLARE_WORKER_URL}/api/heartbeat, got ${cfHeartbeat}`);
}

// 3B: Production WebSocket WSS derivation
const cfWs = wsUrl('/ws');
console.log(`Default Production Cloudflare WebSocket -> "${cfWs}"`);
if (cfWs !== 'wss://porlar-expedition-and-asset-management-system.ggm23768.workers.dev/ws') {
  throw new Error(`Expected wss://porlar-expedition-and-asset-management-system.ggm23768.workers.dev/ws, got ${cfWs}`);
}
if (cfWs.startsWith('ws://') || cfWs.startsWith('http://')) {
  throw new Error(`Insecure protocol detected in WebSocket: ${cfWs}`);
}

// 3C: Base ending in /api deduplication (must not produce /api/api)
setCustomApiBaseUrl('https://porlar-expedition-and-asset-management-system.ggm23768.workers.dev/api');
const dedupeLogin = apiUrl('/api/auth/login');
console.log(`Deduplication test -> "${dedupeLogin}"`);
if (dedupeLogin !== `${PRODUCTION_CLOUDFLARE_WORKER_URL}/api/auth/login`) {
  throw new Error(`Deduplication failure: got ${dedupeLogin}`);
}

// 3D: Trailing slash normalization without double slash
setCustomApiBaseUrl('https://porlar-expedition-and-asset-management-system.ggm23768.workers.dev///');
const slashLogin = apiUrl('api/auth/login');
console.log(`Slash normalization -> "${slashLogin}"`);
if (slashLogin !== `${PRODUCTION_CLOUDFLARE_WORKER_URL}/api/auth/login` || slashLogin.includes('//api/')) {
  throw new Error(`Slash normalization failure: got ${slashLogin}`);
}

// 3E: Ngrok development URL with browser warning bypass
setCustomApiBaseUrl('https://alpha-recon.ngrok-free.app');
const ngrokLogin = apiUrl('/api/auth/login');
console.log(`Ngrok base https://alpha-recon.ngrok-free.app -> /api/auth/login: "${ngrokLogin}"`);
if (
  ngrokLogin !==
  'https://alpha-recon.ngrok-free.app/api/auth/login?ngrok-skip-browser-warning=true'
) {
  throw new Error(`Expected ngrok skip warning query param, got ${ngrokLogin}`);
}

// 3F: Ngrok WebSocket WSS derivation
const ngrokWs = wsUrl('/ws');
console.log(`Ngrok WebSocket -> "${ngrokWs}"`);
if (ngrokWs !== 'wss://alpha-recon.ngrok-free.app/ws') {
  throw new Error(`Expected wss://alpha-recon.ngrok-free.app/ws, got ${ngrokWs}`);
}

// 3G: Custom development override cleanup
clearCustomApiBaseUrl();
const finalHealth = apiUrl('/api/health');
if (!finalHealth.startsWith('https://porlar-expedition-and-asset-management-system.ggm23768.workers.dev')) {
  throw new Error(`Expected Cloudflare Worker URL after clear, got ${finalHealth}`);
}

console.log('ALL API ROUTING AND WEBSOCKET TESTS PASSED SUCCESSFULLY!');
