import http from 'http';

const BASE_URL = 'http://127.0.0.1:8787';

async function request(path: string, options: RequestInit = {}): Promise<{ status: number; headers: Headers; text: string; json: any }> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, headers: res.headers, text, json };
}

async function runWorkerSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING CLOUDFLARE PRODUCTION WORKER TEST SUITE');
  console.log(`Target: ${BASE_URL}`);
  console.log('====================================================\n');

  // TEST 1: Static Asset Root
  console.log('--- TEST 1: GET / (Frontend Static Asset) ---');
  const t1 = await request('/');
  const isHtml1 = t1.headers.get('content-type')?.includes('text/html');
  console.log(`Status: ${t1.status}, IsHTML: ${isHtml1}, HasTitle: ${t1.text.includes('Polar') || t1.text.includes('root')}`);
  if (t1.status !== 200 || !isHtml1) throw new Error('Static asset serving failed for /');

  // TEST 2: SPA Navigation Fallback
  console.log('\n--- TEST 2: GET /dashboard (SPA Fallback) ---');
  const t2 = await request('/dashboard');
  const isHtml2 = t2.headers.get('content-type')?.includes('text/html');
  console.log(`Status: ${t2.status}, IsHTML: ${isHtml2}, HasTitle: ${t2.text.includes('root') || t2.text.includes('html')}`);
  if (t2.status !== 200 || !isHtml2) throw new Error('SPA fallback serving failed for /dashboard');

  // TEST 3: Health Endpoint
  console.log('\n--- TEST 3: GET /api/health ---');
  const t3 = await request('/api/health');
  const isJson3 = t3.headers.get('content-type')?.includes('application/json');
  console.log(`Status: ${t3.status}, IsJSON: ${isJson3}, Health: ${t3.json?.status}, Storage: ${t3.json?.database?.storageType}`);
  if (t3.status !== 200 || !isJson3 || t3.json?.status !== 'ok') throw new Error('GET /api/health failed');

  // TEST 4: Valid Login
  console.log('\n--- TEST 4: POST /api/auth/login (VALID CREDENTIALS) ---');
  const t4 = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'RSC-0142',
      password: 'polar2026',
      role: 'researcher',
      remember: true,
    }),
  });
  const isJson4 = t4.headers.get('content-type')?.includes('application/json');
  console.log(`Status: ${t4.status}, IsJSON: ${isJson4}, Success: ${t4.json?.success}, User: ${t4.json?.user?.name}`);
  if (t4.status !== 200 || !isJson4 || !t4.json?.token) throw new Error('POST /api/auth/login valid failed');
  const authToken = t4.json.token;

  // TEST 5: Invalid Login (Strictly JSON, NEVER HTML)
  console.log('\n--- TEST 5: POST /api/auth/login (INVALID CREDENTIALS) ---');
  const t5 = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'RSC-0142',
      password: 'bad-password',
      role: 'researcher',
    }),
  });
  const isJson5 = t5.headers.get('content-type')?.includes('application/json');
  console.log(`Status: ${t5.status}, IsJSON: ${isJson5}, ErrorCode: ${t5.json?.error?.code}`);
  if (t5.status !== 401 || !isJson5 || t5.json?.error?.code !== 'INVALID_CREDENTIALS') {
    throw new Error('Invalid login check failed or returned HTML');
  }

  // TEST 6: Role Mismatch
  console.log('\n--- TEST 6: POST /api/auth/login (ROLE MISMATCH) ---');
  const t6 = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'RSC-0142',
      password: 'polar2026',
      role: 'asset',
    }),
  });
  console.log(`Status: ${t6.status}, ErrorCode: ${t6.json?.error?.code}`);
  if (t6.status !== 403 || t6.json?.error?.code !== 'ROLE_MISMATCH') {
    throw new Error('Role mismatch check failed');
  }

  // TEST 7: Session Verification
  console.log('\n--- TEST 7: GET /api/auth/session ---');
  const t7 = await request('/api/auth/session', {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  console.log(`Status: ${t7.status}, Authenticated: ${t7.json?.authenticated}, Name: ${t7.json?.user?.name}`);
  if (t7.status !== 200 || !t7.json?.authenticated) throw new Error('Session verification failed');

  // TEST 8: Heartbeat
  console.log('\n--- TEST 8: GET /api/heartbeat ---');
  const t8 = await request('/api/heartbeat');
  console.log(`Status: ${t8.status}, Service: ${t8.json?.service}, Clients: ${t8.json?.connectedClients}`);
  if (t8.status !== 200 || !t8.json?.ok) throw new Error('Heartbeat failed');

  // TEST 9: State Fetching
  console.log('\n--- TEST 9: GET /api/state ---');
  const t9 = await request('/api/state');
  console.log(`Status: ${t9.status}, Assets: ${t9.json?.assets?.length}, Expeditions: ${t9.json?.expeditions?.length}`);
  if (t9.status !== 200 || !Array.isArray(t9.json?.expeditions)) throw new Error('State fetch failed');

  // TEST 10: AI Autonomous SAR Dispatch
  console.log('\n--- TEST 10: POST /api/ai/sar/dispatch-crevasse-fall ---');
  const t10 = await request('/api/ai/sar/dispatch-crevasse-fall', { method: 'POST' });
  console.log(`Status: ${t10.status}, Assigned Asset: ${t10.json?.autonomousDispatch?.assignedAsset}, ETA: ${t10.json?.autonomousDispatch?.etaMinutes}m`);
  if (t10.status !== 200 || !t10.json?.autonomousDispatch?.assignedAsset) throw new Error('SAR dispatch failed');

  // TEST 11: AI Predictive Maintenance
  console.log('\n--- TEST 11: POST /api/ai/predictive-maintenance ---');
  const t11 = await request('/api/ai/predictive-maintenance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assetId: 'AST-SNW-01',
      ambientTempC: -52,
      operatingHours: 1540,
      vibrationRms: 2.3,
    }),
  });
  console.log(`Status: ${t11.status}, Risk: ${t11.json?.wearRiskScore}, HoursToFail: ${t11.json?.hoursToEstimatedFailure}`);
  if (t11.status !== 200 || !t11.json?.wearRiskScore) throw new Error('Predictive maintenance failed');

  // TEST 12: Weather Inventory Evaluation
  console.log('\n--- TEST 12: POST /api/ai/weather-inventory/evaluate ---');
  const t12 = await request('/api/ai/weather-inventory/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ temperatureC: -48, windSpeedKt: 42 }),
  });
  console.log(`Status: ${t12.status}, Surge: +${t12.json?.burnRateSurgePercent}%, DaysRemaining: ${t12.json?.daysOfHeatingSupplyRemaining}`);
  if (t12.status !== 200 || !t12.json?.burnRateSurgePercent) throw new Error('Weather inventory evaluation failed');

  // TEST 13: Tactical A* Pathfinding
  console.log('\n--- TEST 13: POST /api/ai/route-optimizer/astar ---');
  const t13 = await request('/api/ai/route-optimizer/astar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startNode: { lat: -70.767, lng: 11.733 },
      goalNode: { lat: -75.1, lng: 123.333 },
    }),
  });
  console.log(`Status: ${t13.status}, Waypoints: ${t13.json?.waypoints?.length}, Distance: ${t13.json?.optimizedTraverseKm} km`);
  if (t13.status !== 200 || !t13.json?.waypoints) throw new Error('A* pathfinding failed');

  // TEST 14: Unmatched API Endpoint (Strict 404 JSON, NEVER HTML)
  console.log('\n--- TEST 14: GET /api/unmatched-endpoint (404 JSON) ---');
  const t14 = await request('/api/unmatched-endpoint');
  const isJson14 = t14.headers.get('content-type')?.includes('application/json');
  console.log(`Status: ${t14.status}, IsJSON: ${isJson14}, Code: ${t14.json?.error?.code}`);
  if (t14.status !== 404 || !isJson14 || t14.json?.error?.code !== 'NOT_FOUND') {
    throw new Error('Unmatched API endpoint did not return 404 JSON');
  }

  console.log('\n====================================================');
  console.log('🎉 ALL 14 CLOUDFLARE WORKER TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runWorkerSuite().catch((err) => {
  console.error('\n❌ Test suite failure:', err);
  process.exit(1);
});
