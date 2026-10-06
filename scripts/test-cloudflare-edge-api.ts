import { onRequest } from '../functions/api/[[catchall]]';

async function runTests() {
  console.log('--- TEST 1: GET /api/health ---');
  const reqHealth = new Request('https://polar-expedition.pages.dev/api/health', {
    method: 'GET',
    headers: { Origin: 'https://polar-expedition.pages.dev' },
  });
  const resHealth = await onRequest({ request: reqHealth, env: {} });
  console.log(`Status: ${resHealth.status}, Content-Type: ${resHealth.headers.get('content-type')}`);
  const jsonHealth = await resHealth.json();
  console.log('Health JSON:', JSON.stringify(jsonHealth));
  if (resHealth.status !== 200 || jsonHealth.status !== 'ok') {
    throw new Error('Health check failed');
  }

  console.log('\n--- TEST 2: POST /api/auth/login (VALID CREDENTIALS) ---');
  const reqLoginValid = new Request('https://polar-expedition.pages.dev/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://polar-expedition.pages.dev',
    },
    body: JSON.stringify({
      userId: 'RSC-0142',
      password: 'polar2026',
      role: 'researcher',
      remember: true,
    }),
  });
  const resLoginValid = await onRequest({ request: reqLoginValid, env: {} });
  console.log(`Status: ${resLoginValid.status}, Content-Type: ${resLoginValid.headers.get('content-type')}`);
  const jsonLoginValid = await resLoginValid.json();
  console.log('Login Valid JSON:', JSON.stringify(jsonLoginValid));
  if (resLoginValid.status !== 200 || !jsonLoginValid.success || !jsonLoginValid.token) {
    throw new Error('Valid login failed');
  }

  console.log('\n--- TEST 3: POST /api/auth/login (INVALID CREDENTIALS) ---');
  const reqLoginInvalid = new Request('https://polar-expedition.pages.dev/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://polar-expedition.pages.dev',
    },
    body: JSON.stringify({
      userId: 'RSC-0142',
      password: 'wrongpassword',
      role: 'researcher',
    }),
  });
  const resLoginInvalid = await onRequest({ request: reqLoginInvalid, env: {} });
  console.log(`Status: ${resLoginInvalid.status}, Content-Type: ${resLoginInvalid.headers.get('content-type')}`);
  const jsonLoginInvalid = await resLoginInvalid.json();
  console.log('Login Invalid JSON:', JSON.stringify(jsonLoginInvalid));
  if (resLoginInvalid.status !== 401 || jsonLoginInvalid.error?.code !== 'INVALID_CREDENTIALS') {
    throw new Error('Invalid login check failed');
  }

  console.log('\n--- TEST 4: POST /api/auth/login (ROLE MISMATCH) ---');
  const reqRoleMismatch = new Request('https://polar-expedition.pages.dev/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://polar-expedition.pages.dev',
    },
    body: JSON.stringify({
      userId: 'RSC-0142', // Researcher, not Asset Manager
      password: 'polar2026',
      role: 'asset',
    }),
  });
  const resRoleMismatch = await onRequest({ request: reqRoleMismatch, env: {} });
  console.log(`Status: ${resRoleMismatch.status}, Content-Type: ${resRoleMismatch.headers.get('content-type')}`);
  const jsonRoleMismatch = await resRoleMismatch.json();
  console.log('Role Mismatch JSON:', JSON.stringify(jsonRoleMismatch));
  if (resRoleMismatch.status !== 403 || jsonRoleMismatch.error?.code !== 'ROLE_MISMATCH') {
    throw new Error('Role mismatch check failed');
  }

  console.log('\n--- TEST 5: GET /api/heartbeat ---');
  const reqHeartbeat = new Request('https://polar-expedition.pages.dev/api/heartbeat', {
    method: 'GET',
    headers: { Origin: 'https://polar-expedition.pages.dev' },
  });
  const resHeartbeat = await onRequest({ request: reqHeartbeat, env: {} });
  const jsonHeartbeat = await resHeartbeat.json();
  console.log(`Status: ${resHeartbeat.status}, JSON:`, JSON.stringify(jsonHeartbeat));
  if (resHeartbeat.status !== 200 || !jsonHeartbeat.ok) {
    throw new Error('Heartbeat failed');
  }

  console.log('\n--- TEST 6: GET /api/unknown-endpoint (404 JSON, NEVER HTML) ---');
  const reqUnknown = new Request('https://polar-expedition.pages.dev/api/unknown-endpoint', {
    method: 'GET',
    headers: { Origin: 'https://polar-expedition.pages.dev' },
  });
  const resUnknown = await onRequest({ request: reqUnknown, env: {} });
  const contentType = resUnknown.headers.get('content-type') || '';
  const jsonUnknown = await resUnknown.json();
  console.log(`Status: ${resUnknown.status}, Content-Type: ${contentType}, JSON:`, JSON.stringify(jsonUnknown));
  if (resUnknown.status !== 404 || !contentType.includes('application/json')) {
    throw new Error('404 JSON check failed');
  }

  console.log('\n--- TEST 7: GET /api/auth/session (WITH VALID TOKEN) ---');
  const reqSession = new Request('https://polar-expedition.pages.dev/api/auth/session', {
    method: 'GET',
    headers: {
      Origin: 'https://polar-expedition.pages.dev',
      Authorization: `Bearer ${jsonLoginValid.token}`,
    },
  });
  const resSession = await onRequest({ request: reqSession, env: {} });
  const jsonSession = await resSession.json();
  console.log(`Status: ${resSession.status}, JSON:`, JSON.stringify(jsonSession));
  if (resSession.status !== 200 || !jsonSession.authenticated) {
    throw new Error('Session verification failed');
  }

  console.log('\n--- TEST 8: POST /api/auth/logout ---');
  const reqLogout = new Request('https://polar-expedition.pages.dev/api/auth/logout', {
    method: 'POST',
    headers: { Origin: 'https://polar-expedition.pages.dev' },
  });
  const resLogout = await onRequest({ request: reqLogout, env: {} });
  const jsonLogout = await resLogout.json();
  console.log(`Status: ${resLogout.status}, JSON:`, JSON.stringify(jsonLogout));
  if (resLogout.status !== 200 || !jsonLogout.ok) {
    throw new Error('Logout failed');
  }

  console.log('\n--- TEST 9: GET /api/state ---');
  const reqState = new Request('https://polar-expedition.pages.dev/api/state', {
    method: 'GET',
    headers: { Origin: 'https://polar-expedition.pages.dev' },
  });
  const resState = await onRequest({ request: reqState, env: {} });
  const jsonState = await resState.json();
  console.log(`Status: ${resState.status}, Expeditions: ${jsonState.expeditions?.length}, Assets: ${jsonState.assets?.length}`);
  if (resState.status !== 200 || !jsonState.ok || !Array.isArray(jsonState.expeditions)) {
    throw new Error('State fetch failed');
  }

  console.log('\n--- TEST 10: POST /api/ai/sar/dispatch-crevasse-fall (AUTONOMOUS SAR) ---');
  const reqSar = new Request('https://polar-expedition.pages.dev/api/ai/sar/dispatch-crevasse-fall', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://polar-expedition.pages.dev',
    },
  });
  const resSar = await onRequest({ request: reqSar, env: {} });
  const jsonSar = await resSar.json();
  console.log(`Status: ${resSar.status}, Autonomous SAR Asset: ${jsonSar.autonomousDispatch?.assignedAsset}`);
  if (resSar.status !== 200 || !jsonSar.autonomousDispatch?.assignedAsset) {
    throw new Error('SAR dispatch failed');
  }

  console.log('\n--- TEST 11: POST /api/ai/predictive-maintenance (-50°C COLD SOAK) ---');
  const reqMnt = new Request('https://polar-expedition.pages.dev/api/ai/predictive-maintenance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://polar-expedition.pages.dev',
    },
    body: JSON.stringify({
      assetId: 'AST-SNW-01',
      ambientTempC: -52,
      operatingHours: 1540,
      vibrationRms: 2.3,
    }),
  });
  const resMnt = await onRequest({ request: reqMnt, env: {} });
  const jsonMnt = await resMnt.json();
  console.log(`Status: ${resMnt.status}, Wear Risk: ${jsonMnt.wearRiskScore}, Hours to Fail: ${jsonMnt.hoursToEstimatedFailure}`);
  if (resMnt.status !== 200 || !jsonMnt.wearRiskScore) {
    throw new Error('Predictive maintenance failed');
  }

  console.log('\n--- TEST 12: POST /api/ai/weather-inventory/evaluate ---');
  const reqWth = new Request('https://polar-expedition.pages.dev/api/ai/weather-inventory/evaluate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://polar-expedition.pages.dev',
    },
    body: JSON.stringify({ temperatureC: -48, windSpeedKt: 42 }),
  });
  const resWth = await onRequest({ request: reqWth, env: {} });
  const jsonWth = await resWth.json();
  console.log(`Status: ${resWth.status}, Burn Surge: +${jsonWth.burnRateSurgePercent}%, Days Left: ${jsonWth.daysOfHeatingSupplyRemaining}`);
  if (resWth.status !== 200 || !jsonWth.burnRateSurgePercent) {
    throw new Error('Weather inventory evaluation failed');
  }

  console.log('\n--- TEST 13: POST /api/ai/route-optimizer/astar ---');
  const reqAstar = new Request('https://polar-expedition.pages.dev/api/ai/route-optimizer/astar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://polar-expedition.pages.dev',
    },
    body: JSON.stringify({
      startNode: { lat: -70.767, lng: 11.733 },
      goalNode: { lat: -75.1, lng: 123.333 },
    }),
  });
  const resAstar = await onRequest({ request: reqAstar, env: {} });
  const jsonAstar = await resAstar.json();
  console.log(`Status: ${resAstar.status}, Waypoints: ${jsonAstar.waypoints?.length}, Distance: ${jsonAstar.optimizedTraverseKm} km`);
  if (resAstar.status !== 200 || !jsonAstar.waypoints) {
    throw new Error('A* pathfinding failed');
  }

  console.log('\nALL 13 CLOUDFLARE EDGE API TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
