/**
 * Comprehensive Mobile & Cloudflare Backend Routing Verification Script
 * Validates request construction and executes live requests to Cloudflare Worker endpoints.
 */

import {
  apiUrl,
  wsUrl,
  getApiBaseUrl,
  PRODUCTION_CLOUDFLARE_WORKER_URL,
  PRODUCTION_WS_URL,
  setCustomApiBaseUrl,
  clearCustomApiBaseUrl,
} from '../src/config/api';

async function runDiagnostics() {
  console.log('================================================================');
  console.log('  POLAR EXPEDITION MOBILE ROUTING & CLOUDFLARE VERIFICATION');
  console.log('================================================================');

  // --- DIAGNOSTIC 1: Configuration & Defaults ---
  console.log('\n[1] Centralized URL Constants:');
  console.log('  Production Cloudflare Base URL:', PRODUCTION_CLOUDFLARE_WORKER_URL);
  console.log('  Production WebSocket URL:      ', PRODUCTION_WS_URL);
  console.log('  Effective getApiBaseUrl():     ', getApiBaseUrl());

  if (getApiBaseUrl() !== PRODUCTION_CLOUDFLARE_WORKER_URL) {
    throw new Error(`getApiBaseUrl() failed to default to Cloudflare Worker: got ${getApiBaseUrl()}`);
  }

  // --- DIAGNOSTIC 2: Path Appending & URL Construction ---
  console.log('\n[2] URL Path Construction Verification:');
  const testCases = [
    { endpoint: '/api/health', expected: `${PRODUCTION_CLOUDFLARE_WORKER_URL}/api/health` },
    { endpoint: 'api/health', expected: `${PRODUCTION_CLOUDFLARE_WORKER_URL}/api/health` },
    { endpoint: '/api/auth/login', expected: `${PRODUCTION_CLOUDFLARE_WORKER_URL}/api/auth/login` },
    { endpoint: '/api/heartbeat', expected: `${PRODUCTION_CLOUDFLARE_WORKER_URL}/api/heartbeat` },
    { endpoint: '/api/state', expected: `${PRODUCTION_CLOUDFLARE_WORKER_URL}/api/state` },
  ];

  for (const { endpoint, expected } of testCases) {
    const constructed = apiUrl(endpoint);
    console.log(`  apiUrl('${endpoint}') -> ${constructed}`);
    if (constructed !== expected) {
      throw new Error(`Mismatch for ${endpoint}: expected ${expected}, got ${constructed}`);
    }
    if (constructed.includes('//api/') || constructed.includes('/api/api/')) {
      throw new Error(`Malformed URL path produced for ${endpoint}: ${constructed}`);
    }
  }

  // --- DIAGNOSTIC 3: WebSocket Derivation ---
  console.log('\n[3] WebSocket Protocol & URL Derivation:');
  const derivedWs = wsUrl('/ws');
  console.log('  wsUrl(\'/ws\') ->', derivedWs);
  if (derivedWs !== 'wss://porlar-expedition-and-asset-management-system.ggm23768.workers.dev/ws') {
    throw new Error(`Invalid WebSocket URL: ${derivedWs}`);
  }
  if (!derivedWs.startsWith('wss://')) {
    throw new Error(`WebSocket protocol MUST be wss://, got: ${derivedWs}`);
  }

  // --- DIAGNOSTIC 4: Live HTTP Health Check ---
  console.log('\n[4] Live Health Check against Cloudflare Worker:');
  const healthUrl = apiUrl('/api/health');
  const healthRes = await fetch(healthUrl, { method: 'GET' });
  const healthJson = await healthRes.json();
  console.log(`  GET ${healthUrl} -> HTTP ${healthRes.status}`);
  console.log('  Response:', JSON.stringify(healthJson));
  if (healthRes.status !== 200 || healthJson.status !== 'ok') {
    throw new Error(`Health check failed: HTTP ${healthRes.status}`);
  }

  // --- DIAGNOSTIC 5: Live Authentication Request ---
  console.log('\n[5] Live Authentication Request against Cloudflare Worker:');
  const loginUrl = apiUrl('/api/auth/login');
  const loginRes = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'RSC-0142',
      password: 'polar2026',
      role: 'researcher',
    }),
  });
  const loginJson = await loginRes.json();
  console.log(`  POST ${loginUrl} -> HTTP ${loginRes.status}`);
  console.log(`  Login Success: ${loginJson.success}, User: ${loginJson.user?.name}`);
  if (loginRes.status !== 200 || !loginJson.token) {
    throw new Error(`Login failed: HTTP ${loginRes.status}`);
  }

  // --- DIAGNOSTIC 6: Live Heartbeat & Telemetry ---
  console.log('\n[6] Live Heartbeat Request against Cloudflare Worker:');
  const heartbeatUrl = apiUrl('/api/heartbeat');
  const heartbeatRes = await fetch(heartbeatUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginJson.token}`,
    },
    body: JSON.stringify({
      deviceId: 'test-mobile-verifier',
      deviceType: 'mobile_field',
      batteryLevel: 98,
    }),
  });
  const heartbeatJson = await heartbeatRes.json();
  console.log(`  POST ${heartbeatUrl} -> HTTP ${heartbeatRes.status}`);
  console.log(`  Heartbeat Status: ${heartbeatJson.status}, Devices Count: ${heartbeatJson.devices?.length}`);
  if (heartbeatRes.status !== 200 || !heartbeatJson.ok) {
    throw new Error(`Heartbeat failed: HTTP ${heartbeatRes.status}`);
  }

  // --- DIAGNOSTIC 7: Live Cloudflare Worker WebSocket Connection ---
  console.log('\n[7] Live WebSocket Handshake & State Sync against Cloudflare Worker:');
  const wsEndpoint = wsUrl('/ws');
  console.log(`  Connecting to ${wsEndpoint}...`);
  await new Promise<void>((resolve, reject) => {
    // Dynamic import to support node runtime
    import('ws').then(({ default: WebSocketClient }) => {
      const socket = new WebSocketClient(wsEndpoint);
      const timer = setTimeout(() => {
        socket.terminate();
        reject(new Error('WebSocket connection timed out after 7000ms'));
      }, 7000);

      socket.on('open', () => {
        console.log('  WebSocket Handshake Succeeded (101 Switching Protocols)');
        socket.send(JSON.stringify({ type: 'HEARTBEAT' }));
      });

      socket.on('message', (msg) => {
        const parsed = JSON.parse(msg.toString());
        console.log(`  Received WebSocket Packet: type=${parsed.type}, clients=${parsed.payload?.connectedClients}`);
        clearTimeout(timer);
        socket.close();
        resolve();
      });

      socket.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    }).catch(reject);
  });

  // --- DIAGNOSTIC 8: Localhost / Ngrok Development Preservation ---
  console.log('\n[8] Development Mode Support (Localhost / Ngrok):');
  setCustomApiBaseUrl('https://my-laptop.ngrok-free.app');
  const devNgrokUrl = apiUrl('/api/auth/login');
  console.log(`  Ngrok Custom Base -> ${devNgrokUrl}`);
  if (!devNgrokUrl.startsWith('https://my-laptop.ngrok-free.app') || !devNgrokUrl.includes('ngrok-skip-browser-warning=true')) {
    throw new Error(`Ngrok dev routing failed: ${devNgrokUrl}`);
  }

  setCustomApiBaseUrl('http://192.168.1.150:3000');
  const devLanUrl = apiUrl('/api/state');
  console.log(`  LAN Dev Base -> ${devLanUrl}`);
  if (devLanUrl !== 'http://192.168.1.150:3000/api/state') {
    throw new Error(`LAN dev routing failed: ${devLanUrl}`);
  }

  clearCustomApiBaseUrl();
  console.log(`  After Reset -> Default is restored to: ${apiUrl('/api/health')}`);
  if (!apiUrl('/api/health').startsWith(PRODUCTION_CLOUDFLARE_WORKER_URL)) {
    throw new Error('Reset failed to restore Cloudflare Worker target.');
  }

  console.log('\n================================================================');
  console.log('  ALL MOBILE ROUTING & CLOUDFLARE TESTS PASSED (100% VERIFIED)');
  console.log('================================================================\n');
}

runDiagnostics().catch((err) => {
  console.error('\n❌ DIAGNOSTIC FAILED:', err);
  process.exit(1);
});
