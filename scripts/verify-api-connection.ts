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

console.log('--- TEST 3: apiUrl Resolution ---');
import { apiUrl, setCustomApiBaseUrl, clearCustomApiBaseUrl } from '../src/config/api';

// 3A: Standard base URL
setCustomApiBaseUrl('https://example-backend.com');
const loginUrl1 = apiUrl('/api/auth/login');
console.log(`Base https://example-backend.com -> /api/auth/login: "${loginUrl1}"`);
if (loginUrl1 !== 'https://example-backend.com/api/auth/login') {
  throw new Error(`Expected https://example-backend.com/api/auth/login, got ${loginUrl1}`);
}

// 3B: Base ending in /api deduplication (must not produce /api/api)
setCustomApiBaseUrl('https://example-backend.com/api');
const loginUrl2 = apiUrl('/api/auth/login');
console.log(`Base https://example-backend.com/api -> /api/auth/login: "${loginUrl2}"`);
if (loginUrl2 !== 'https://example-backend.com/api/auth/login') {
  throw new Error(`Expected https://example-backend.com/api/auth/login, got ${loginUrl2}`);
}

// 3C: Base with trailing slashes and endpoint without leading slash
setCustomApiBaseUrl('https://example-backend.com///');
const loginUrl3 = apiUrl('api/auth/login');
console.log(`Base https://example-backend.com/// -> api/auth/login: "${loginUrl3}"`);
if (loginUrl3 !== 'https://example-backend.com/api/auth/login') {
  throw new Error(`Expected https://example-backend.com/api/auth/login, got ${loginUrl3}`);
}

// 3D: Ngrok development URL with browser warning bypass
setCustomApiBaseUrl('https://alpha-recon.ngrok-free.app');
const ngrokLogin = apiUrl('/api/auth/login');
console.log(`Ngrok base https://alpha-recon.ngrok-free.app -> /api/auth/login: "${ngrokLogin}"`);
if (
  ngrokLogin !==
  'https://alpha-recon.ngrok-free.app/api/auth/login?ngrok-skip-browser-warning=true'
) {
  throw new Error(`Expected ngrok skip warning query param, got ${ngrokLogin}`);
}

// 3E: Clean same-origin relative paths (Production Cloudflare Mode)
clearCustomApiBaseUrl();
const relativeLogin = apiUrl('/api/auth/login');
console.log(`Empty Base (Production Cloudflare) -> /api/auth/login: "${relativeLogin}"`);
if (relativeLogin !== '/api/auth/login') {
  throw new Error(`Expected clean relative path /api/auth/login, got ${relativeLogin}`);
}

// 3F: Auth endpoints verification
setCustomApiBaseUrl('https://example-backend.com');
const authEndpoints = ['/api/auth/login', '/api/auth/logout', '/api/auth/session', '/api/heartbeat', '/api/health'];
for (const ep of authEndpoints) {
  const resolved = apiUrl(ep);
  if (!resolved.startsWith('https://example-backend.com') || resolved.includes('/api/api/')) {
    throw new Error(`Endpoint construction error for ${ep}: got ${resolved}`);
  }
}

clearCustomApiBaseUrl();
console.log('ALL TESTS PASSED SUCCESSFULLY!');
