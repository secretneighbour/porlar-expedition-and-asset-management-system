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

console.log('ALL TESTS PASSED SUCCESSFULLY!');
